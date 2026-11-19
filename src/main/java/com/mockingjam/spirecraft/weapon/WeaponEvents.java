package com.mockingjam.spirecraft.weapon;

import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.registry.ModItems;
import java.util.Map;
import java.util.WeakHashMap;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.damagesource.CombatRules;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.TamableAnimal;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.animal.IronGolem;
import net.minecraft.world.entity.item.ItemEntity;
import net.minecraft.world.entity.monster.Enemy;
import net.minecraft.world.entity.npc.AbstractVillager;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.event.entity.living.LivingDeathEvent;
import net.minecraftforge.event.entity.living.LivingDropsEvent;
import net.minecraftforge.event.entity.living.LivingHurtEvent;
import net.minecraftforge.event.entity.player.AttackEntityEvent;

/** On-hit, on-kill and per-tick rules of the v2 weapons (docs/design/weapons.md). Server thread only. */
public final class WeaponEvents {
    public static final int FLAIL_VULNERABLE = 60;          // 3 s
    public static final int POISON_PER_HIT = 2;
    public static final int SCYTHE_DOOM = 2;
    public static final int SCOURGE_DOOM = 4;
    public static final int DOOM_DURATION = 1200;
    public static final double SCYTHE_SWEEP_RADIUS = 2.5;
    public static final float SCYTHE_SWEEP_RATIO = 0.5F;
    public static final int INK_WEAK = 40;
    public static final int INFERNAL_FIRE = 4;
    public static final float BLUDGEON_CHARGED = 1.5F;
    public static final float PHOTON_PIERCE = 0.3F;
    public static final float SPEAR_PER_REGENT = 0.5F, SPEAR_MAX = 2.0F;
    public static final float HEIRLOOM_CHANCE = 0.25F;
    public static final double TANK_RANGE = 8.0;
    public static final float TANK_REDUCTION = 0.5F;
    public static final int ROD_PERIOD = 40;

    /** Whether the player's current swing was fully charged (recorded before vanilla resets the attack timer). */
    private static final Map<Player, Boolean> CHARGED = new WeakHashMap<>();
    private static boolean sweeping;

    private WeaponEvents() {}

    public static void register() {
        AttackEntityEvent.BUS.addListener(e -> { CHARGED.put(e.getEntity(), e.getEntity().getAttackStrengthScale(0.5F) > 0.9F); });
        LivingHurtEvent.BUS.addListener(WeaponEvents::onHurt);
        LivingDeathEvent.BUS.addListener(WeaponEvents::onDeath);
        LivingDeathEvent.BUS.addListener(e -> { if (e.getEntity() instanceof Player p && !p.level().isClientSide()) Orbs.clear(p); });
        net.minecraftforge.event.entity.player.PlayerEvent.PlayerLoggedInEvent.BUS.addListener(e -> Orbs.sync(e.getEntity()));
        LivingDropsEvent.BUS.addListener(WeaponEvents::onDrops);
        net.minecraftforge.event.LootTableLoadEvent.BUS.addListener(WeaponEvents::scrapLoot);
        TickEvent.PlayerTickEvent.Post.BUS.addListener(e -> {
            if (!(e.player().level() instanceof ServerLevel level)) return;
            Orbs.tick(level, e.player());
            lightningRod(level, e.player());
        });
    }

    /** Scrap (flak shell material): 5 % from gravel, and 1–3 in a third of dungeon / mineshaft / shipwreck / village smith chests. */
    public static final float SCRAP_GRAVEL = 0.05F, SCRAP_CHEST = 0.35F;
    private static final java.util.Set<String> SCRAP_CHESTS = java.util.Set.of("chests/simple_dungeon", "chests/abandoned_mineshaft",
            "chests/shipwreck_supply", "chests/ruined_portal", "chests/village/village_weaponsmith", "chests/village/village_toolsmith",
            "chests/pillager_outpost", "chests/trial_chambers/supply");

    private static void scrapLoot(net.minecraftforge.event.LootTableLoadEvent event) {
        if (!"minecraft".equals(event.getName().getNamespace()) || event.getTable() == null) return;
        String path = event.getName().getPath();
        float chance = path.equals("blocks/gravel") ? SCRAP_GRAVEL : SCRAP_CHESTS.contains(path) ? SCRAP_CHEST : 0;
        if (chance == 0) return;
        var entry = net.minecraft.world.level.storage.loot.entries.LootItem.lootTableItem(ModItems.SCRAP.get());
        if (!path.startsWith("blocks/")) entry.apply(net.minecraft.world.level.storage.loot.functions.SetItemCountFunction.setCount(
                net.minecraft.world.level.storage.loot.providers.number.UniformGenerator.between(1, 3)));
        event.getTable().addPool(net.minecraft.world.level.storage.loot.LootPool.lootPool().name("spirecraft_scrap")
                .setRolls(net.minecraft.world.level.storage.loot.providers.number.ConstantValue.exactly(1))
                .when(net.minecraft.world.level.storage.loot.predicates.LootItemRandomChanceCondition.randomChance(chance))
                .add(entry).build());
    }

    /** For the self-test: pretend the next swing was (not) fully charged. */
    public static void setCharged(Player player, boolean charged) {
        CHARGED.put(player, charged);
    }

    private static void onHurt(LivingHurtEvent event) {
        LivingEntity target = event.getEntity();
        if (!(target.level() instanceof ServerLevel level)) return;

        // Tank (meat shield): allies near a player blocking with it take half damage
        if (isAlly(target) && event.getSource().getEntity() instanceof LivingEntity attacker && attacker != target && !isAlly(attacker)) {
            for (Player guard : level.getEntitiesOfClass(Player.class, target.getBoundingBox().inflate(TANK_RANGE))) {
                if (guard != target && guard.isBlocking() && guard.getUseItem().is(ModItems.TANK_SHIELD.get())) {
                    event.setAmount(event.getAmount() * (1 - TANK_REDUCTION));
                    break;
                }
            }
        }
        if (target instanceof Player hurtPlayer) {
            Abilities.rocketRefund(hurtPlayer);
            // Osty — Die for You: attack damage aimed at the owner hits Osty first
            if (com.mockingjam.spirecraft.effect.SpireEffectEvents.isAttack(event.getSource()) && event.getSource().getEntity() instanceof LivingEntity attacker
                    && !(attacker instanceof com.mockingjam.spirecraft.mob.Osty)) {
                var osty = com.mockingjam.spirecraft.mob.Osty.of(level, hurtPlayer, com.mockingjam.spirecraft.mob.Osty.GUARD_RANGE);
                if (osty != null) event.setAmount(dieForYou(level, osty, event.getSource(), event.getAmount()));
            }
        }

        if (!(event.getSource().getDirectEntity() instanceof Player player) || event.getSource().getEntity() != player) return;
        ItemStack weapon = player.getMainHandItem();
        boolean charged = CHARGED.getOrDefault(player, false);

        // ---- Ironclad
        if (weapon.is(ModItems.MORNING_STAR.get()) && charged) {
            target.addEffect(new MobEffectInstance(ModEffects.holder(ModEffects.VULNERABLE), FLAIL_VULNERABLE, 0), player);
            target.knockback(0.6, player.getX() - target.getX(), player.getZ() - target.getZ());
        }
        if (weapon.is(ModItems.BLUDGEON.get()) && charged) event.setAmount(event.getAmount() * BLUDGEON_CHARGED);
        if (weapon.is(ModItems.INFERNAL_BLADE.get())) {
            if (Abilities.takeInfernal(level, player)) {
                event.setAmount(event.getAmount() * Abilities.INFERNAL_MULTIPLIER);
                target.igniteForSeconds(INFERNAL_FIRE * 2);
            } else {
                target.igniteForSeconds(INFERNAL_FIRE);
            }
        }
        // ---- Silent
        if (weapon.is(ModItems.POISONED_DAGGER.get())) ModEffects.addStacks(target, ModEffects.POISON, POISON_PER_HIT, 1200, 30);
        if (weapon.is(ModItems.INK_DAGGER.get())) target.addEffect(new MobEffectInstance(ModEffects.holder(ModEffects.WEAK), INK_WEAK, 0), player);
        // ---- Regent
        if (weapon.getItem() instanceof SovereignBlade) event.setAmount(event.getAmount() + SovereignBlade.bonusDamage(weapon));
        if (weapon.is(ModItems.REGENT_STRIKE.get()) && charged) feedSovereignBlade(player);
        if (weapon.is(ModItems.CRESCENT_SPEAR.get())) {
            event.setAmount(event.getAmount() + spearBonus(player));
            spearTrail(level, player, target);
        }
        if (weapon.is(ModItems.PHOTON_CUT.get())) event.setAmount(photonPierce(target, event.getAmount(), event.getSource()));
        // ---- Necrobinder
        if (weapon.is(ModItems.SCOURGE.get())) {
            ModEffects.addStacks(target, ModEffects.DOOM, SCOURGE_DOOM, DOOM_DURATION, 999);
            swingTrail(level, player, target, net.minecraft.core.particles.ParticleTypes.CRIT, 0.25);
            level.playSound(null, target.blockPosition(), net.minecraft.sounds.SoundEvents.PLAYER_ATTACK_SWEEP, net.minecraft.sounds.SoundSource.PLAYERS, 0.8F, 1.8F);
        }
        if (weapon.is(ModItems.MORNING_STAR.get())) {
            swingTrail(level, player, target, new net.minecraft.core.particles.DustParticleOptions(0x6E6E78, 0.6F), 0.0);
            level.playSound(null, target.blockPosition(), net.minecraft.sounds.SoundEvents.CHAIN_HIT, net.minecraft.sounds.SoundSource.PLAYERS, 1.0F, 0.8F);
        }
        if (weapon.is(ModItems.SCYTHE.get())) {
            ModEffects.addStacks(target, ModEffects.DOOM, SCYTHE_DOOM, DOOM_DURATION, 999);
            if (!sweeping) {
                sweeping = true;
                try {
                    float sweep = event.getAmount() * SCYTHE_SWEEP_RATIO;
                    for (LivingEntity other : level.getEntitiesOfClass(LivingEntity.class, target.getBoundingBox().inflate(SCYTHE_SWEEP_RADIUS, 0.5, SCYTHE_SWEEP_RADIUS),
                            e -> e != target && e != player && e instanceof Enemy && e.isAlive())) {
                        other.hurtServer(level, player.damageSources().playerAttack(player), sweep);
                    }
                } finally {
                    sweeping = false;
                }
            }
        }
        // Danse Macabre: a fully charged blow with a slow, heavy weapon
        if (charged && player.getAttributeValue(Attributes.ATTACK_SPEED) <= 1.0) Abilities.danseMacabre(player);
    }

    /** Osty takes the hit; returns what is left for the owner (only the overflow once Osty falls). */
    public static float dieForYou(ServerLevel level, com.mockingjam.spirecraft.mob.Osty osty, net.minecraft.world.damagesource.DamageSource source, float amount) {
        float hp = osty.getHealth();
        osty.invulnerableTime = 0;
        osty.hurtServer(level, source, amount);
        return amount >= hp ? amount - hp : 0;
    }

    /** Players, tamed animals, villagers and iron golems count as allies for the Tank shield. */
    public static boolean isAlly(LivingEntity e) {
        return e instanceof Player || (e instanceof TamableAnimal t && t.isTame()) || e instanceof AbstractVillager || e instanceof IronGolem;
    }

    /** Crescent Spear: +0.5 damage per other Regent weapon carried, up to +2. */
    /** A line of particles from the hand to the target: the whip's crack (an arcing line) or the flail's chain links. */
    private static void swingTrail(ServerLevel level, Player player, LivingEntity target, net.minecraft.core.particles.ParticleOptions particle, double arc) {
        var from = player.getEyePosition().add(player.getLookAngle().scale(0.6)).add(0, -0.4, 0);
        var to = target.getBoundingBox().getCenter();
        int steps = (int) Math.max(4, from.distanceTo(to) * 5);
        for (int i = 0; i <= steps; i++) {
            double k = (double) i / steps;
            var p = from.lerp(to, k).add(0, Math.sin(k * Math.PI) * arc, 0);
            level.sendParticles(particle, p.x, p.y, p.z, 1, 0, 0, 0, 0);
        }
    }

    /** Crescent Spear jab: a line of crit sparks from the spear point to the target (visual only). */
    private static void spearTrail(ServerLevel level, Player player, LivingEntity target) {
        var from = player.getEyePosition().add(player.getLookAngle().scale(0.8)).add(0, -0.25, 0);
        var to = target.getBoundingBox().getCenter();
        int steps = (int) Math.max(3, from.distanceTo(to) * 4);
        for (int i = 0; i <= steps; i++) {
            var p = from.lerp(to, (double) i / steps);
            level.sendParticles(net.minecraft.core.particles.ParticleTypes.CRIT, p.x, p.y, p.z, 1, 0.02, 0.02, 0.02, 0.0);
        }
        level.playSound(null, target.blockPosition(), net.minecraft.sounds.SoundEvents.TRIDENT_HIT, net.minecraft.sounds.SoundSource.PLAYERS, 0.6F, 1.3F);
    }

    public static float spearBonus(Player player) {
        int n = 0;
        var inv = player.getInventory();
        for (int i = 0; i < inv.getContainerSize(); i++) {
            ItemStack s = inv.getItem(i);
            if (s.getItem() instanceof SpireWeapon w && w.character() == SpireWeapon.Character.REGENT && !s.is(ModItems.CRESCENT_SPEAR.get())) n++;
        }
        return Math.min(SPEAR_MAX, n * SPEAR_PER_REGENT);
    }

    /**
     * Photon Cut: 30 % of the hit ignores armour. LivingHurtEvent runs before armour, so the amount is raised such that
     * after armour the result equals 70 % armoured + 30 % unarmoured.
     */
    public static float photonPierce(LivingEntity target, float amount, net.minecraft.world.damagesource.DamageSource source) {
        float armour = (float) target.getArmorValue(), toughness = (float) target.getAttributeValue(Attributes.ARMOR_TOUGHNESS);
        float after = CombatRules.getDamageAfterAbsorb(target, amount, source, armour, toughness);
        if (after <= 0 || after >= amount) return amount;
        float wanted = (1 - PHOTON_PIERCE) * after + PHOTON_PIERCE * amount;
        return amount * wanted / after;
    }

    /** Regent's Strike: a fully charged hit puts 1 Forge into a carried Sovereign Blade. */
    private static void feedSovereignBlade(Player player) {
        var inv = player.getInventory();
        for (int i = 0; i < inv.getContainerSize(); i++) {
            ItemStack s = inv.getItem(i);
            if (s.getItem() instanceof SovereignBlade) { SovereignBlade.addForge(s, 1); return; }
        }
    }

    /** Lightning Rod: while blocking with it, channel a Lightning orb every 2 s (never past the orb limit). */
    private static void lightningRod(ServerLevel level, Player player) {
        if (!player.isBlocking() || !player.getUseItem().is(ModItems.LIGHTNING_ROD.get())) return;
        if (player.tickCount % ROD_PERIOD == 0 && Orbs.count(player) < Orbs.slots(player)) Orbs.channel(level, player, Orbs.Type.LIGHTNING);
    }

    private static void onDeath(LivingDeathEvent event) {
        LivingEntity dead = event.getEntity();
        if (dead.level() instanceof ServerLevel level && !(dead instanceof Player)) {
            // Dirge Flute: every death nearby feeds a Soul to a carried flute
            for (Player near : level.getEntitiesOfClass(Player.class, dead.getBoundingBox().inflate(DirgeFlute.GATHER_RANGE))) DirgeFlute.gather(near);
        }
        if (!(event.getEntity() instanceof Enemy) || !(event.getSource().getEntity() instanceof Player player)) return;
        ItemStack weapon = player.getMainHandItem();
        if (weapon.getItem() instanceof SovereignBlade) SovereignBlade.addForge(weapon, 1);
    }

    /** Heirloom Hammer: a kill has a 25 % chance to double one of the drops. */
    private static void onDrops(LivingDropsEvent event) {
        LivingEntity dead = event.getEntity();
        if (!(dead.level() instanceof ServerLevel level) || event.getDrops().isEmpty()) return;
        if (!(event.getSource().getEntity() instanceof Player player) || !player.getMainHandItem().is(ModItems.HEIRLOOM_HAMMER.get())) return;
        if (level.getRandom().nextFloat() >= HEIRLOOM_CHANCE) return;
        heirloom(level, event.getDrops());
    }

    /** Copies one random drop (also used by the self-test). */
    public static void heirloom(ServerLevel level, java.util.Collection<ItemEntity> drops) {
        ItemEntity pick = drops.stream().skip(level.getRandom().nextInt(drops.size())).findFirst().orElseThrow();
        drops.add(new ItemEntity(level, pick.getX(), pick.getY(), pick.getZ(), pick.getItem().copy()));
    }
}
