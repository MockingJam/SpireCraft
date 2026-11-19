package com.mockingjam.spirecraft.relic;

import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.effect.SpireEffectEvents;
import com.mockingjam.spirecraft.registry.ModItems;
import java.util.List;
import java.util.Map;
import java.util.WeakHashMap;
import java.util.function.Supplier;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.monster.Enemy;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.storage.loot.LootPool;
import net.minecraft.world.level.storage.loot.entries.EmptyLootItem;
import net.minecraft.world.level.storage.loot.entries.LootItem;
import net.minecraft.world.level.storage.loot.providers.number.ConstantValue;
import net.minecraftforge.event.LootTableLoadEvent;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.event.entity.living.LivingDeathEvent;
import net.minecraftforge.event.entity.living.LivingHurtEvent;
import net.minecraftforge.registries.RegistryObject;

/**
 * Relic effects. "Combat" for a player = attacking or being attacked by a hostile mob (or another player); it starts
 * after {@link #COMBAT_GAP} ticks without fighting and ends after the same quiet time. Design: docs/design/relics.md.
 * Server thread only.
 */
public final class RelicEvents {
    public static final int COMBAT_GAP = 200;            // 10 s
    public static final int BUFF_DURATION = 600;         // 30 s
    public static final int DEBUFF_DURATION = 120;       // 6 s
    public static final double DEBUFF_RADIUS = 8.0;
    public static final float BURNING_BLOOD_HEAL = 4.0F;
    public static final float BLOOD_VIAL_HEAL = 2.0F;
    public static final int ANCHOR_DURATION = 300;       // vanilla Absorption I = 4 absorption, 15 s
    public static final int RED_SKULL_STRENGTH = 2;
    public static final int PEN_NIB_EVERY = 10;
    public static final int MERCURY_PERIOD = 60;         // 3 s
    public static final double MERCURY_RADIUS = 6.0;
    public static final float MERCURY_DAMAGE = 1.0F;
    public static final int SHURIKEN_WINDOW = 60;        // 3 attacks within 3 s
    public static final int SHURIKEN_MAX = 3;
    public static final long LIZARD_TAIL_REGROW = 24000; // one Minecraft day

    private static final String PEN_NIB_KEY = "spirecraft.pen_nib";
    private static final String LIZARD_KEY = "spirecraft.lizard_tail_ready";

    /** Per-player combat state. */
    public static final class Combat {
        long last = Long.MIN_VALUE / 2;
        boolean active;
        int kills;
        long streakStart = Long.MIN_VALUE / 2;
        int streak;

        public boolean active() {
            return active;
        }
    }

    private static final Map<Player, Combat> COMBAT = new WeakHashMap<>();

    private RelicEvents() {}

    public static void register() {
        LivingHurtEvent.BUS.addListener(RelicEvents::onHurt);
        LivingDeathEvent.BUS.addListener(RelicEvents::onDeath);
        TickEvent.PlayerTickEvent.Post.BUS.addListener(e -> tick(e.player()));
        LootTableLoadEvent.BUS.addListener(RelicEvents::onLootLoad);
        SpireEffectEvents.extraStrength = RelicEvents::redSkullStrength;
    }

    public static Combat combat(Player player) {
        return COMBAT.computeIfAbsent(player, p -> new Combat());
    }

    /** A hostile mob or another player: what counts as a fight. */
    public static boolean isFoe(LivingEntity entity) {
        return entity instanceof Enemy || entity instanceof Player;
    }

    // ---------------------------------------------------------------- combat tracking
    /** Marks a combat action; runs the start-of-combat relics when this begins a new fight. */
    public static void enterCombat(Player player, ServerLevel level) {
        Combat c = combat(player);
        long now = level.getGameTime();
        if (!c.active) {
            c.active = true;
            c.kills = 0;
            c.last = now;
            onCombatStart(player, level);
        }
        c.last = now;
    }

    private static void onCombatStart(Player player, ServerLevel level) {
        var relics = Relics.active(player);
        if (relics.contains(ModItems.ANCHOR.get())) player.addEffect(new MobEffectInstance(MobEffects.ABSORPTION, ANCHOR_DURATION, 0));
        if (relics.contains(ModItems.BLOOD_VIAL.get())) player.heal(BLOOD_VIAL_HEAL);
        if (relics.contains(ModItems.VAJRA.get())) ModEffects.addStacks(player, ModEffects.STRENGTH, 1, BUFF_DURATION, 99);
        if (relics.contains(ModItems.ODDLY_SMOOTH_STONE.get())) ModEffects.addStacks(player, ModEffects.DEXTERITY, 1, BUFF_DURATION, 99);
        if (relics.contains(ModItems.BRONZE_SCALES.get())) ModEffects.addStacks(player, ModEffects.THORNS, 1, BUFF_DURATION, 99);
        boolean marbles = relics.contains(ModItems.BAG_OF_MARBLES.get()), mask = relics.contains(ModItems.RED_MASK.get());
        if (marbles || mask) {
            for (LivingEntity foe : foesNear(player, level, DEBUFF_RADIUS)) {
                if (marbles) foe.addEffect(new MobEffectInstance(ModEffects.holder(ModEffects.VULNERABLE), DEBUFF_DURATION, 0), player);
                if (mask) foe.addEffect(new MobEffectInstance(ModEffects.holder(ModEffects.WEAK), DEBUFF_DURATION, 0), player);
            }
        }
    }

    private static void onCombatEnd(Player player, Combat c) {
        if (c.kills > 0 && Relics.has(player, ModItems.BURNING_BLOOD)) player.heal(BURNING_BLOOD_HEAL);
        c.active = false;
        c.streak = 0;
    }

    private static List<LivingEntity> foesNear(Player player, ServerLevel level, double radius) {
        return level.getEntitiesOfClass(LivingEntity.class, player.getBoundingBox().inflate(radius),
                e -> e instanceof Enemy && e.isAlive());
    }

    /** Per-tick relic work (combat end, Mercury Hourglass). Public so the self-test can drive a mock player. */
    public static void tick(Player player) {
        if (!(player.level() instanceof ServerLevel level)) return;
        Combat c = COMBAT.get(player);
        if (c == null || !c.active) return;
        long now = level.getGameTime();
        if (now - c.last > COMBAT_GAP) {
            onCombatEnd(player, c);
            return;
        }
        if (player.tickCount % MERCURY_PERIOD == 0 && Relics.has(player, ModItems.MERCURY_HOURGLASS)) {
            for (LivingEntity foe : foesNear(player, level, MERCURY_RADIUS)) {
                foe.hurtServer(level, player.damageSources().magic(), MERCURY_DAMAGE);
            }
        }
    }

    // ---------------------------------------------------------------- hits
    private static void onHurt(LivingHurtEvent event) {
        LivingEntity victim = event.getEntity();
        if (!(victim.level() instanceof ServerLevel level)) return;
        var source = event.getSource();

        if (victim instanceof Player hurtPlayer && source.getEntity() instanceof LivingEntity attacker
                && attacker != hurtPlayer && isFoe(attacker)) {
            enterCombat(hurtPlayer, level);
        }
        if (source.getEntity() instanceof Player player && victim != player && isFoe(victim)) {
            enterCombat(player, level);
            if (SpireEffectEvents.isAttack(source)) onPlayerAttack(player, level, event);
        }
    }

    private static void onPlayerAttack(Player player, ServerLevel level, LivingHurtEvent event) {
        var relics = Relics.active(player);
        if (relics.contains(ModItems.PEN_NIB.get())) {
            var data = player.getPersistentData();
            int count = data.getIntOr(PEN_NIB_KEY, 0) + 1;
            if (count >= PEN_NIB_EVERY) {
                event.setAmount(event.getAmount() * 2);
                count = 0;
                level.playSound(null, player.blockPosition(), SoundEvents.PLAYER_ATTACK_CRIT, SoundSource.PLAYERS, 1.0F, 1.2F);
            }
            data.putInt(PEN_NIB_KEY, count);
        }
        if (relics.contains(ModItems.SHURIKEN.get())) {
            Combat c = combat(player);
            long now = level.getGameTime();
            if (now - c.streakStart > SHURIKEN_WINDOW) {
                c.streakStart = now;
                c.streak = 0;
            }
            if (++c.streak >= 3) {
                ModEffects.addStacks(player, ModEffects.STRENGTH, 1, BUFF_DURATION, SHURIKEN_MAX);
                c.streak = 0;
                c.streakStart = now;
            }
        }
    }

    /** Pen Nib progress (0–9), for tests and tooltips. */
    public static int penNibCount(Player player) {
        return player.getPersistentData().getIntOr(PEN_NIB_KEY, 0);
    }

    private static int redSkullStrength(LivingEntity entity) {
        return entity instanceof Player player && player.getHealth() <= player.getMaxHealth() / 2
                && Relics.has(player, ModItems.RED_SKULL) ? RED_SKULL_STRENGTH : 0;
    }

    // ---------------------------------------------------------------- deaths
    /** Returns true to cancel the death (Lizard Tail). */
    private static boolean onDeath(LivingDeathEvent event) {
        LivingEntity dead = event.getEntity();
        if (!(dead.level() instanceof ServerLevel level)) return false;

        if (dead instanceof Player player && lizardTailReady(player, level) && Relics.has(player, ModItems.LIZARD_TAIL)) {
            player.setHealth(player.getMaxHealth() / 2);
            player.getPersistentData().putLong(LIZARD_KEY, level.getGameTime() + LIZARD_TAIL_REGROW);
            level.playSound(null, player.blockPosition(), SoundEvents.TOTEM_USE, SoundSource.PLAYERS, 0.8F, 1.3F);
            level.sendParticles(ParticleTypes.TOTEM_OF_UNDYING, player.getX(), player.getY() + 1.0, player.getZ(), 30, 0.4, 0.6, 0.4, 0.3);
            return true;
        }
        if (event.getSource().getEntity() instanceof Player killer && dead != killer && isFoe(dead)) {
            enterCombat(killer, level);
            combat(killer).kills++;
        }
        return false;
    }

    public static boolean lizardTailReady(Player player, ServerLevel level) {
        return level.getGameTime() >= player.getPersistentData().getLongOr(LIZARD_KEY, Long.MIN_VALUE);
    }

    // ---------------------------------------------------------------- loot
    private record ChestRelics(List<Supplier<Item>> relics, float chance) {}

    private static List<Supplier<Item>> items(List<RegistryObject<Item>> objects) {
        return objects.stream().<Supplier<Item>>map(o -> o::get).toList();
    }

    public static final List<RegistryObject<Item>> COMMON = List.of(ModItems.ANCHOR, ModItems.VAJRA, ModItems.ODDLY_SMOOTH_STONE,
            ModItems.BAG_OF_MARBLES, ModItems.RED_MASK, ModItems.BRONZE_SCALES, ModItems.BLOOD_VIAL);
    public static final List<RegistryObject<Item>> UNCOMMON = List.of(ModItems.PEN_NIB, ModItems.MERCURY_HOURGLASS);
    public static final List<RegistryObject<Item>> RARE = List.of(ModItems.SHURIKEN, ModItems.LIZARD_TAIL);
    private static final List<RegistryObject<Item>> IRONCLAD = List.of(ModItems.BURNING_BLOOD, ModItems.RED_SKULL);
    private static final List<RegistryObject<Item>> BASTION = List.of(ModItems.PEN_NIB, ModItems.MERCURY_HOURGLASS, ModItems.RED_SKULL);

    private static final ChestRelics COMMON_CHEST = new ChestRelics(items(COMMON), 0.12F);
    private static final ChestRelics UNCOMMON_CHEST = new ChestRelics(items(UNCOMMON), 0.10F);
    private static final ChestRelics RARE_CHEST = new ChestRelics(items(RARE), 0.08F);
    private static final ChestRelics FORTRESS_CHEST = new ChestRelics(items(IRONCLAD), 0.15F);
    private static final ChestRelics BASTION_CHEST = new ChestRelics(items(BASTION), 0.10F);

    private static final Map<String, ChestRelics> CHESTS = Map.ofEntries(
            Map.entry("chests/simple_dungeon", COMMON_CHEST),
            Map.entry("chests/abandoned_mineshaft", COMMON_CHEST),
            Map.entry("chests/desert_pyramid", COMMON_CHEST),
            Map.entry("chests/jungle_temple", COMMON_CHEST),
            Map.entry("chests/shipwreck_treasure", COMMON_CHEST),
            Map.entry("chests/buried_treasure", COMMON_CHEST),
            Map.entry("chests/ruined_portal", COMMON_CHEST),
            Map.entry("chests/stronghold_corridor", UNCOMMON_CHEST),
            Map.entry("chests/stronghold_library", UNCOMMON_CHEST),
            Map.entry("chests/pillager_outpost", UNCOMMON_CHEST),
            Map.entry("chests/woodland_mansion", UNCOMMON_CHEST),
            Map.entry("chests/nether_bridge", FORTRESS_CHEST),
            Map.entry("chests/bastion_other", BASTION_CHEST),
            Map.entry("chests/ancient_city", RARE_CHEST),
            Map.entry("chests/end_city_treasure", RARE_CHEST),
            Map.entry("chests/bastion_treasure", RARE_CHEST));

    private static void onLootLoad(LootTableLoadEvent event) {
        if (!"minecraft".equals(event.getName().getNamespace()) || event.getTable() == null) return;
        ChestRelics loot = CHESTS.get(event.getName().getPath());
        if (loot == null) return;
        int n = loot.relics().size();
        int empty = Math.round(n * (1 - loot.chance()) / loot.chance());
        var pool = LootPool.lootPool().name("spirecraft_relics").setRolls(ConstantValue.exactly(1));
        for (Supplier<Item> relic : loot.relics()) pool.add(LootItem.lootTableItem(relic.get()).setWeight(1));
        pool.add(EmptyLootItem.emptyItem().setWeight(empty));
        event.getTable().addPool(pool.build());
    }
}
