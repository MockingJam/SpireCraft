package com.mockingjam.spirecraft.weapon;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.network.SpireNetwork;
import com.mockingjam.spirecraft.registry.ModItems;
import com.mockingjam.spirecraft.weapon.projectile.OrbWisp;
import java.util.ArrayList;
import java.util.List;
import net.minecraft.core.particles.DustParticleOptions;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.ai.attributes.AttributeModifier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Enemy;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.phys.AABB;
import net.minecraft.world.phys.Vec3;

/**
 * Defect's channeled orbs (v2.2, docs/design/weapons.md "Orbs"). A player holds a queue of orbs in a row of slots:
 * <ul>
 *   <li>Slots: {@link #BASE_SLOTS} + 1 per Energy Core carried + Capacity (potion), at most {@link #MAX_SLOTS}.</li>
 *   <li>Channeling into full slots evokes the oldest orb first (first in, first out). The Evoke key evokes the oldest
 *       orb on demand. An orb whose time runs out is evoked too — nothing just disappears.</li>
 *   <li>Lightning: every {@link #PASSIVE_PERIOD} ticks a homing ball of lightning flies at a hostile mob within
 *       {@link #LIGHTNING_RANGE} blocks in any direction ({@link #LIGHTNING_PASSIVE}); evoked, a bigger one
 *       ({@link #LIGHTNING_EVOKE}).</li>
 *   <li>Frost: +{@link #FROST_ARMOR} armor each while it lasts; evoked, Absorption I for 10 s.</li>
 *   <li>Dark: after {@link #DARK_TICKS} ticks it bursts for {@link #DARK_DAMAGE} on every hostile mob within
 *       {@link #DARK_RADIUS} blocks; pushed out early it bursts the same.</li>
 * </ul>
 * Stored in the player's persistent data, synced to its client for the HUD; cleared on death.
 */
public final class Orbs {
    public enum Type { LIGHTNING, FROST, DARK }

    public record Orb(Type type, int left) {}

    public static final int BASE_SLOTS = 1, MAX_SLOTS = 6;
    public static final int LIGHTNING_TICKS = 600, FROST_TICKS = 600, DARK_TICKS = 300;
    public static final int PASSIVE_PERIOD = 60;
    public static final float LIGHTNING_PASSIVE = 3.0F, LIGHTNING_EVOKE = 8.0F;
    public static final double LIGHTNING_RANGE = 10.0;
    public static final int FROST_ARMOR = 2, FROST_EVOKE_TICKS = 200;
    public static final float DARK_DAMAGE = 20.0F;   // v2.3 (user): a delayed burst should pay off - 2.5x the old 8
    public static final double DARK_RADIUS = 4.0;
    public static final int[] COLORS = {0xFFE04A, 0xA8E6F2, 0x7A4AC0};
    private static final String KEY = "spirecraft_orbs";
    private static final net.minecraft.resources.ResourceLocation FROST_ID = SpireCraft.id("frost_orbs");

    private Orbs() {}

    public static int lifetime(Type type) {
        return switch (type) { case LIGHTNING -> LIGHTNING_TICKS; case FROST -> FROST_TICKS; case DARK -> DARK_TICKS; };
    }

    // ------------------------------------------------------------------ storage

    public static List<Orb> get(Player player) {
        int[] raw = player.getPersistentData().getIntArray(KEY).orElse(new int[0]);
        List<Orb> out = new ArrayList<>();
        for (int i = 0; i + 1 < raw.length; i += 2) {
            if (raw[i] >= 0 && raw[i] < Type.values().length) out.add(new Orb(Type.values()[raw[i]], raw[i + 1]));
        }
        return out;
    }

    private static void put(Player player, List<Orb> orbs, boolean sync) {
        int[] raw = new int[orbs.size() * 2];
        for (int i = 0; i < orbs.size(); i++) {
            raw[2 * i] = orbs.get(i).type().ordinal();
            raw[2 * i + 1] = orbs.get(i).left();
        }
        player.getPersistentData().putIntArray(KEY, raw);
        updateArmor(player, orbs);
        if (sync) sync(player, orbs);
    }

    public static void sync(Player player) {
        sync(player, get(player));
    }

    private static void sync(Player player, List<Orb> orbs) {
        if (player instanceof ServerPlayer sp && sp.connection != null) SpireNetwork.syncOrbs(sp, slots(player), orbs);
    }

    public static int count(Player player) {
        return get(player).size();
    }

    public static int count(Player player, Type type) {
        int n = 0;
        for (Orb o : get(player)) if (o.type() == type) n++;
        return n;
    }

    /** Orb slots: base, +1 per Energy Core in the inventory, + Capacity (amplifier + 1). */
    public static int slots(Player player) {
        int cores = 0;
        var inv = player.getInventory();
        for (int i = 0; i < inv.getContainerSize(); i++) if (inv.getItem(i).is(ModItems.ENERGY_CORE.get())) cores += inv.getItem(i).getCount();
        var capacity = player.getEffect(ModEffects.holder(ModEffects.CAPACITY));
        int extra = capacity == null ? 0 : capacity.getAmplifier() + 1;
        return Math.max(1, Math.min(MAX_SLOTS, BASE_SLOTS + cores + extra));
    }

    // ------------------------------------------------------------------ channel / evoke

    /** Channels an orb at the back of the queue; full slots evoke the front orb first. */
    public static void channel(ServerLevel level, Player player, Type type) {
        List<Orb> orbs = get(player);
        while (orbs.size() >= slots(player)) evoke(level, player, orbs.remove(0).type());
        orbs.add(new Orb(type, lifetime(type)));
        put(player, orbs, true);
        level.playSound(null, player.blockPosition(), switch (type) {
            case LIGHTNING -> SoundEvents.BEACON_ACTIVATE;
            case FROST -> SoundEvents.POWDER_SNOW_PLACE;
            case DARK -> SoundEvents.SCULK_SHRIEKER_SHRIEK;
        }, SoundSource.PLAYERS, type == Type.DARK ? 0.3F : 0.7F, 1.6F);
    }

    /** Evokes the oldest orb (the Evoke key). Returns false with no orbs. */
    public static boolean evokeFront(ServerLevel level, Player player) {
        List<Orb> orbs = get(player);
        if (orbs.isEmpty()) return false;
        Type type = orbs.remove(0).type();
        put(player, orbs, true);
        evoke(level, player, type);
        return true;
    }

    /** The evoke effect of one orb (the orb itself is already out of the queue). */
    public static void evoke(ServerLevel level, Player player, Type type) {
        Vec3 at = orbPosition(level, player, 0, 1);
        switch (type) {
            case LIGHTNING -> {
                LivingEntity target = nearestEnemy(level, player, LIGHTNING_RANGE);
                if (target != null) OrbWisp.launch(level, player, at, target, LIGHTNING_EVOKE, true);
                level.playSound(null, player.blockPosition(), SoundEvents.LIGHTNING_BOLT_THUNDER, SoundSource.PLAYERS, 0.25F, 1.8F);
            }
            case FROST -> {
                player.addEffect(new MobEffectInstance(MobEffects.ABSORPTION, FROST_EVOKE_TICKS, 0));
                level.sendParticles(ParticleTypes.SNOWFLAKE, player.getX(), player.getY() + 1.0, player.getZ(), 30, 0.5, 0.7, 0.5, 0.05);
                level.playSound(null, player.blockPosition(), SoundEvents.GLASS_BREAK, SoundSource.PLAYERS, 0.6F, 1.5F);
            }
            case DARK -> darkBurst(level, player);
        }
    }

    /** Dark orb burst: {@link #DARK_DAMAGE} to every hostile mob within {@link #DARK_RADIUS} of the player. */
    public static int darkBurst(ServerLevel level, Player player) {
        int hit = 0;
        for (LivingEntity e : level.getEntitiesOfClass(LivingEntity.class, player.getBoundingBox().inflate(DARK_RADIUS),
                e -> e instanceof Enemy && e.isAlive() && e.distanceTo(player) <= DARK_RADIUS + e.getBbWidth() / 2)) {
            e.invulnerableTime = 0;
            e.hurtServer(level, player.damageSources().indirectMagic(null, player), DARK_DAMAGE);
            hit++;
        }
        var shell = new DustParticleOptions(COLORS[2], 1.6F);
        for (int i = 0; i < 48; i++) {
            double a = i * Math.PI * 2 / 48;
            level.sendParticles(shell, player.getX() + Math.cos(a) * DARK_RADIUS, player.getY() + 0.8, player.getZ() + Math.sin(a) * DARK_RADIUS, 1, 0, 0.3, 0, 0);
        }
        level.sendParticles(ParticleTypes.SQUID_INK, player.getX(), player.getY() + 1.0, player.getZ(), 20, 1.2, 0.5, 1.2, 0.05);
        level.sendParticles(ParticleTypes.EXPLOSION, player.getX(), player.getY() + 1.0, player.getZ(), 1, 0, 0, 0, 0);
        level.playSound(null, player.blockPosition(), SoundEvents.WARDEN_SONIC_BOOM, SoundSource.PLAYERS, 0.5F, 1.4F);
        return hit;
    }

    public static void clear(Player player) {
        put(player, new ArrayList<>(), true);
    }

    // ------------------------------------------------------------------ every tick

    public static void tick(ServerLevel level, Player player) {
        List<Orb> orbs = get(player);
        if (orbs.isEmpty()) return;
        boolean changed = false;
        // slots can shrink (an Energy Core dropped, Capacity ran out): the oldest orbs are evoked
        while (orbs.size() > slots(player)) { evoke(level, player, orbs.remove(0).type()); changed = true; }
        List<Orb> next = new ArrayList<>();
        List<Type> expired = new ArrayList<>();
        for (int i = 0; i < orbs.size(); i++) {
            Orb o = orbs.get(i);
            int left = o.left() - 1;
            if (o.type() == Type.LIGHTNING && left > 0 && (lifetime(Type.LIGHTNING) - left) % PASSIVE_PERIOD == 0) {
                LivingEntity target = nearestEnemy(level, player, LIGHTNING_RANGE);
                if (target != null) OrbWisp.launch(level, player, orbPosition(level, player, i, orbs.size()), target, LIGHTNING_PASSIVE, false);
            }
            if (left <= 0) expired.add(o.type()); else next.add(new Orb(o.type(), left));
        }
        if (!expired.isEmpty()) changed = true;
        put(player, next, changed || player.tickCount % 100 == 0);
        for (Type t : expired) evoke(level, player, t);
        particles(level, player, next);
    }

    /** Where orb i of n circles the player (shoulder height, bobbing). */
    public static Vec3 orbPosition(ServerLevel level, Player player, int i, int n) {
        double a = level.getGameTime() * 0.12 + i * Math.PI * 2 / Math.max(1, n);
        return new Vec3(player.getX() + Math.cos(a) * 0.95, player.getY() + 1.35 + Math.sin(level.getGameTime() * 0.2 + i * 2.1) * 0.08,
                player.getZ() + Math.sin(a) * 0.95);
    }

    private static void particles(ServerLevel level, Player player, List<Orb> orbs) {
        for (int i = 0; i < orbs.size(); i++) {
            Type t = orbs.get(i).type();
            Vec3 p = orbPosition(level, player, i, orbs.size());
            level.sendParticles(new DustParticleOptions(COLORS[t.ordinal()], 0.75F), p.x, p.y, p.z, 3, 0.07, 0.07, 0.07, 0);
            if (player.tickCount % 3 == 0) {
                level.sendParticles(t == Type.LIGHTNING ? ParticleTypes.ELECTRIC_SPARK : t == Type.FROST ? ParticleTypes.SNOWFLAKE : ParticleTypes.WITCH,
                        p.x, p.y, p.z, 1, 0.02, 0.02, 0.02, 0);
            }
        }
        // frost: an icy shimmer on the player while the armor is up
        int frost = 0;
        for (Orb o : orbs) if (o.type() == Type.FROST) frost++;
        if (frost > 0 && player.tickCount % 4 == 0) {
            level.sendParticles(ParticleTypes.SNOWFLAKE, player.getX(), player.getY() + 1.0, player.getZ(), frost, 0.35, 0.6, 0.35, 0.0);
        }
    }

    private static void updateArmor(Player player, List<Orb> orbs) {
        var armor = player.getAttribute(Attributes.ARMOR);
        if (armor == null) return;
        int frost = 0;
        for (Orb o : orbs) if (o.type() == Type.FROST) frost++;
        if (frost == 0) armor.removeModifier(FROST_ID);
        else armor.addOrUpdateTransientModifier(new AttributeModifier(FROST_ID, FROST_ARMOR * frost, AttributeModifier.Operation.ADD_VALUE));
    }

    public static LivingEntity nearestEnemy(ServerLevel level, Player player, double range) {
        LivingEntity best = null;
        double bd = range * range;
        Vec3 eye = player.position().add(0, 1.2, 0);
        for (LivingEntity e : level.getEntitiesOfClass(LivingEntity.class, new AABB(eye, eye).inflate(range), e -> e instanceof Enemy && e.isAlive())) {
            double d = e.position().add(0, e.getBbHeight() / 2, 0).distanceToSqr(eye);
            if (d < bd) { bd = d; best = e; }
        }
        return best;
    }
}
