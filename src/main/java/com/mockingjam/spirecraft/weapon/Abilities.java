package com.mockingjam.spirecraft.weapon;

import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.mob.Osty;
import com.mockingjam.spirecraft.registry.ModEntities;
import com.mockingjam.spirecraft.registry.ModItems;
import com.mockingjam.spirecraft.weapon.projectile.SpireBolt;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.WeakHashMap;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.EntitySpawnReason;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.monster.Enemy;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.entity.projectile.Projectile;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.phys.Vec3;

/** Right-click abilities of the v2 weapons (docs/design/weapons.md). All run on the server thread. */
public final class Abilities {
    public static final int INK_COOLDOWN = 120;
    public static final float INK_DAMAGE = 3.0F;
    public static final int INFERNAL_COOLDOWN = 160;
    public static final int ARMED_TICKS = 100;
    public static final float INFERNAL_MULTIPLIER = 1.5F;
    public static final int ROCKET_COOLDOWN = 100;
    public static final float ROCKET_DAMAGE = 8.0F;
    public static final int ROCKET_HURT_REFUND = 20;
    public static final int TESLA_COOLDOWN = 80;
    public static final float TESLA_DAMAGE = 3.0F;
    public static final int TESLA_JUMPS = 3;
    public static final double TESLA_RANGE = 8.0, TESLA_CHAIN = 5.0;
    public static final int SHADOW_COOLDOWN = 240;
    public static final int GRIMOIRE_COOLDOWN = 600;
    public static final int GRIMOIRE_SOULS = 3;
    public static final int DANSE_MIN_COOLDOWN = 100;
    public static final float DANSE_ABSORPTION = 2.0F, DANSE_MAX = 6.0F;

    /** Players whose next melee hit is empowered (Snakebite / Infernal Blade), with the game tick it expires. */
    private static final Map<Player, Long> INFERNAL_ARMED = new WeakHashMap<>();

    private Abilities() {}

    // ------------------------------------------------------------------ Silent
    /** Blade of Ink: two inky knives in a narrow spread. */
    public static boolean inkKnives(ServerLevel level, Player player, ItemStack stack) {
        for (float spread : new float[] {-5.0F, 5.0F}) {
            float yaw = player.getYRot();
            player.setYRot(yaw + spread);
            Projectile.spawnProjectileFromRotation((l, o, s) -> new SpireBolt(l, o, s, SpireBolt.Kind.INK, INK_DAMAGE), level,
                    new ItemStack(ModItems.INK_DAGGER.get()), player, 0.0F, 1.5F, 0.5F);
            player.setYRot(yaw);
        }
        level.playSound(null, player.blockPosition(), SoundEvents.TRIDENT_THROW.value(), SoundSource.PLAYERS, 0.6F, 1.4F);
        return true;
    }

    // ------------------------------------------------------------------ Ironclad
    /** Infernal Blade: the next hit within 5 s is a free extra-strong one. */
    public static boolean infernal(ServerLevel level, Player player, ItemStack stack) {
        INFERNAL_ARMED.put(player, level.getGameTime() + ARMED_TICKS);
        level.sendParticles(ParticleTypes.FLAME, player.getX(), player.getY() + 1.2, player.getZ(), 12, 0.3, 0.4, 0.3, 0.02);
        level.playSound(null, player.blockPosition(), SoundEvents.BLAZE_SHOOT, SoundSource.PLAYERS, 0.6F, 1.2F);
        return true;
    }

    public static boolean takeInfernal(ServerLevel level, Player player) {
        Long until = INFERNAL_ARMED.remove(player);
        return until != null && until >= level.getGameTime();
    }

    // ------------------------------------------------------------------ Defect
    /** Rocket Punch: launches the fist straight ahead. */
    public static boolean rocketPunch(ServerLevel level, Player player, ItemStack stack) {
        Projectile.spawnProjectileFromRotation((l, o, s) -> new SpireBolt(l, o, s, SpireBolt.Kind.FIST, ROCKET_DAMAGE), level,
                new ItemStack(ModItems.ROCKET_FIST.get()), player, 0.0F, 1.8F, 0.0F);
        level.playSound(null, player.blockPosition(), SoundEvents.FIREWORK_ROCKET_LAUNCH, SoundSource.PLAYERS, 0.8F, 1.0F);
        return true;
    }

    /** Rocket Punch: taking damage shortens a running cooldown by 1 s (STS2: creating a Status lowers its cost). */
    public static void rocketRefund(Player player) {
        for (ItemStack stack : List.of(player.getMainHandItem(), player.getOffhandItem())) {
            if (!stack.is(ModItems.ROCKET_PUNCH.get())) continue;
            float left = player.getCooldowns().getCooldownPercent(stack, 0) * ROCKET_COOLDOWN;
            if (left <= 0) continue;
            player.getCooldowns().removeCooldown(player.getCooldowns().getCooldownGroup(stack));
            int rest = Math.round(left) - ROCKET_HURT_REFUND;
            if (rest > 0) player.getCooldowns().addCooldown(stack, rest);
        }
    }

    /** Tesla Coil: lightning arcs through up to 3 hostiles (+1 per Lightning orb), 3 damage each. Returns the hits. */
    public static boolean teslaCoil(ServerLevel level, Player player, ItemStack stack) {
        return tesla(level, player) > 0;
    }

    public static int tesla(ServerLevel level, Player player) {
        int jumps = TESLA_JUMPS + Orbs.count(player, Orbs.Type.LIGHTNING);
        List<LivingEntity> hit = new ArrayList<>();
        Vec3 from = player.position().add(0, 1.2, 0);
        LivingEntity next = nearestEnemy(level, player, from, TESLA_RANGE, hit);
        while (next != null && hit.size() < jumps) {
            hit.add(next);
            next.invulnerableTime = 0;
            next.hurtServer(level, player.damageSources().indirectMagic(player, player), TESLA_DAMAGE);
            Vec3 to = next.position().add(0, next.getBbHeight() / 2, 0);
            for (int i = 0; i <= 8; i++) {
                Vec3 p = from.lerp(to, i / 8.0);
                level.sendParticles(ParticleTypes.ELECTRIC_SPARK, p.x, p.y, p.z, 1, 0.05, 0.05, 0.05, 0);
            }
            from = to;
            next = nearestEnemy(level, player, from, TESLA_CHAIN, hit);
        }
        if (!hit.isEmpty()) level.playSound(null, player.blockPosition(), SoundEvents.LIGHTNING_BOLT_IMPACT, SoundSource.PLAYERS, 0.4F, 1.9F);
        return hit.size();
    }

    private static LivingEntity nearestEnemy(ServerLevel level, Player player, Vec3 from, double range, List<LivingEntity> skip) {
        LivingEntity best = null;
        double bd = range * range;
        for (LivingEntity e : level.getEntitiesOfClass(LivingEntity.class, new net.minecraft.world.phys.AABB(from, from).inflate(range),
                e -> e instanceof Enemy && e.isAlive() && !skip.contains(e))) {
            double d = e.position().distanceToSqr(from);
            if (d < bd) { bd = d; best = e; }
        }
        return best;
    }

    /** Shadow Shield: 4 absorption (vanilla Absorption I, 20 s) and channel a Dark orb. */
    public static boolean shadowShield(ServerLevel level, Player player, ItemStack stack) {
        player.addEffect(new MobEffectInstance(MobEffects.ABSORPTION, 400, 0));
        Orbs.channel(level, player, Orbs.Type.DARK);
        level.sendParticles(ParticleTypes.WITCH, player.getX(), player.getY() + 1.0, player.getZ(), 20, 0.5, 0.6, 0.5, 0.02);
        return true;
    }

    // ------------------------------------------------------------------ Necrobinder
    /**
     * Forbidden Grimoire: summons Osty (the Necrobinder's bone hand) for 3 Souls from a carried Dirge Flute; if Osty is
     * already near, every Soul spent instead adds {@link Osty#HP_PER_SOUL} max health (STS2 "Summon X"), up to the cap.
     */
    public static boolean grimoire(ServerLevel level, Player player, ItemStack stack) {
        ItemStack flute = ItemStack.EMPTY;
        var inv = player.getInventory();
        for (int i = 0; i < inv.getContainerSize(); i++) {
            ItemStack s = inv.getItem(i);
            if (s.getItem() instanceof DirgeFlute && DirgeFlute.souls(s) > 0) { flute = s; break; }
        }
        int souls = flute.isEmpty() ? (player.isCreative() ? 99 : 0) : DirgeFlute.souls(flute);
        Osty osty = Osty.of(level, player, 32);
        if (osty == null) {
            if (souls < GRIMOIRE_SOULS) return false;
            Osty summoned = ModEntities.OSTY.get().create(level, EntitySpawnReason.MOB_SUMMONED);
            if (summoned == null) return false;
            Vec3 at = player.position().add(player.getLookAngle().multiply(1.5, 0, 1.5));
            summoned.snapTo(at.x, player.getY(), at.z, player.getYRot(), 0);
            summoned.tame(player);
            level.addFreshEntity(summoned);
            if (!flute.isEmpty()) DirgeFlute.setSouls(flute, souls - GRIMOIRE_SOULS);
            level.sendParticles(ParticleTypes.SOUL, at.x, at.y + 0.5, at.z, 20, 0.4, 0.4, 0.4, 0.03);
            level.playSound(null, player.blockPosition(), SoundEvents.SOUL_ESCAPE.value(), SoundSource.PLAYERS, 1.0F, 0.8F);
            return true;
        }
        int room = (int) Math.ceil((Osty.MAX_HP - osty.getMaxHealth()) / Osty.HP_PER_SOUL);
        int spend = Math.min(souls, Math.max(1, room));
        if (spend <= 0) return false;
        osty.summon(spend * Osty.HP_PER_SOUL);
        if (!flute.isEmpty()) DirgeFlute.setSouls(flute, souls - spend);
        level.sendParticles(ParticleTypes.SOUL, osty.getX(), osty.getY() + 0.5, osty.getZ(), 10 * spend, 0.4, 0.4, 0.4, 0.03);
        return true;
    }

    /** Danse Macabre (off-hand fan): a heavy blow or a long-cooldown ability grants +2 absorption, up to 6. */
    public static void danseMacabre(Player player) {
        if (!player.getOffhandItem().is(ModItems.DANSE_MACABRE.get())) return;
        float target = Math.min(DANSE_MAX, player.getAbsorptionAmount() + DANSE_ABSORPTION);
        if (!player.hasEffect(MobEffects.ABSORPTION)) player.addEffect(new MobEffectInstance(MobEffects.ABSORPTION, 600, 1, false, false, true));
        player.setAbsorptionAmount(target);
    }
}
