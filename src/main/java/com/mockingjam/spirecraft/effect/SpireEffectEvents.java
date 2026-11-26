package com.mockingjam.spirecraft.effect;

import com.mockingjam.spirecraft.SpireCraft;
import java.util.Map;
import java.util.WeakHashMap;
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.ResourceKey;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.tags.DamageTypeTags;
import net.minecraft.world.damagesource.DamageSource;
import net.minecraft.world.damagesource.DamageType;
import net.minecraft.world.damagesource.DamageTypes;
import net.minecraft.world.effect.MobEffectCategory;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.projectile.Projectile;
import net.minecraftforge.common.util.Result;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.event.entity.living.LivingDamageEvent;
import net.minecraftforge.event.entity.living.LivingDropsEvent;
import net.minecraftforge.event.entity.living.LivingEvent;
import net.minecraftforge.event.entity.living.LivingHurtEvent;
import net.minecraftforge.event.entity.living.MobEffectEvent;

/**
 * Game rules of the Spire effects. Order follows STS: additive first, then multipliers.
 * See docs/design/effects.md.
 */
public final class SpireEffectEvents {
    public static final ResourceKey<DamageType> DOOM_DAMAGE = ResourceKey.create(Registries.DAMAGE_TYPE, SpireCraft.id("doom"));

    private static final float WEAK_MULTIPLIER = 0.75f;
    private static final float VULNERABLE_MULTIPLIER = 1.5f;
    private static final float FRAIL_MULTIPLIER = 0.75f;

    /** Absorption seen last tick, to detect gains for dexterity / frail. Server thread only. */
    private static final Map<LivingEntity, Float> LAST_ABSORPTION = new WeakHashMap<>();

    /** Extra strength from other systems (e.g. the Red Skull relic), added on top of the Strength effect. */
    public static final float SHRINK_MULTIPLIER = 0.7F;
    public static java.util.function.ToIntFunction<LivingEntity> extraStrength = e -> 0;

    private SpireEffectEvents() {}

    public static void register() {
        LivingHurtEvent.BUS.addListener(SpireEffectEvents::onHurt);
        LivingEvent.LivingTickEvent.BUS.addListener(SpireEffectEvents::onLivingTick);
        MobEffectEvent.Applicable.BUS.addListener(SpireEffectEvents::onApplicable);
        TickEvent.ServerTickEvent.Post.BUS.addListener(e -> StackChanges.flush());
        LivingDamageEvent.BUS.addListener(SpireEffectEvents::onHpLoss);
        LivingDropsEvent.BUS.addListener(SpireEffectEvents::onDrops);
        GloryEffectEvents.register();
        // Glory: Galvanic shocks every fresh buff; a night's sleep heals the paper cuts
        MobEffectEvent.Added.BUS.addListener(e -> {
            var who = e.getEntity();
            if (who.level().isClientSide() || e.getOldEffectInstance() != null || GloryEffectEvents.rewriting) return;
            var added = e.getEffectInstance().getEffect();
            if (added.value().getCategory() != net.minecraft.world.effect.MobEffectCategory.BENEFICIAL || !who.hasEffect(ModEffects.holder(ModEffects.GALVANIC))) return;
            if (who.level() instanceof net.minecraft.server.level.ServerLevel sl) {
                sl.getServer().execute(() -> who.hurtServer(sl, who.damageSources().lightningBolt(), 2.5F));
                sl.sendParticles(net.minecraft.core.particles.ParticleTypes.ELECTRIC_SPARK, who.getX(), who.getY() + 1, who.getZ(), 15, 0.3, 0.5, 0.3, 0.1);
            }
        });
        net.minecraftforge.event.entity.player.PlayerWakeUpEvent.BUS.addListener(e -> e.getEntity().removeEffect(ModEffects.holder(ModEffects.PAPER_CUTS)));
    }

    /** Intangible: the HP actually lost (after armor and absorption) is at most 1. Doom and /kill go through. */
    private static void onHpLoss(LivingDamageEvent event) {
        LivingEntity entity = event.getEntity();
        if (event.getAmount() > 1 && entity.hasEffect(ModEffects.holder(ModEffects.INTANGIBLE))
                && !event.getSource().is(DamageTypeTags.BYPASSES_INVULNERABILITY)) {
            event.setAmount(1);
        }
    }

    /** Prosperity (Amethyst Aubergine): mobs killed by an entity with the effect drop 1–3 extra gold nuggets. */
    private static void onDrops(LivingDropsEvent event) {
        LivingEntity dead = event.getEntity();
        if (dead instanceof net.minecraft.world.entity.player.Player) return;
        if (!(dead.level() instanceof ServerLevel level)) return;
        if (event.getSource().getEntity() instanceof LivingEntity killer && killer.hasEffect(ModEffects.holder(ModEffects.PROSPERITY))) {
            int count = 1 + level.random.nextInt(3);
            event.getDrops().add(new net.minecraft.world.entity.item.ItemEntity(level, dead.getX(), dead.getY(), dead.getZ(),
                    new net.minecraft.world.item.ItemStack(net.minecraft.world.item.Items.GOLD_NUGGET, count)));
        }
    }

    /** Melee hit by a living attacker, or any projectile. Thorns reflections do not count. */
    public static boolean isAttack(DamageSource source) {
        if (source.is(DamageTypes.THORNS)) return false;
        Entity direct = source.getDirectEntity();
        return direct instanceof Projectile || (direct instanceof LivingEntity && direct == source.getEntity());
    }

    /** Return true to cancel the hurt (buffer). */
    private static boolean onHurt(LivingHurtEvent event) {
        LivingEntity victim = event.getEntity();
        if (!(victim.level() instanceof ServerLevel level)) return false;
        DamageSource source = event.getSource();
        float amount = event.getAmount();

        if (isAttack(source)) {
            if (source.getEntity() instanceof LivingEntity attacker) {
                amount += ModEffects.stacks(attacker, ModEffects.STRENGTH) + extraStrength.applyAsInt(attacker);
                if (attacker.hasEffect(ModEffects.holder(ModEffects.WEAK))) amount *= WEAK_MULTIPLIER;
                if (attacker.hasEffect(ModEffects.holder(ModEffects.SHRINK)) && source.getDirectEntity() == attacker) amount *= SHRINK_MULTIPLIER;
            }
            if (victim.hasEffect(ModEffects.holder(ModEffects.VULNERABLE))) amount *= VULNERABLE_MULTIPLIER;

            int thorns = ModEffects.stacks(victim, ModEffects.THORNS);
            if (thorns > 0 && source.getDirectEntity() instanceof LivingEntity melee && melee != victim) {
                melee.hurtServer(level, victim.damageSources().thorns(victim), thorns);
            }
        }
        amount = Math.max(0, amount);

        // Buffer: swallow the whole hit. /kill and Doom go through.
        var buffer = ModEffects.holder(ModEffects.BUFFER);
        if (amount > 0 && !source.is(DamageTypeTags.BYPASSES_INVULNERABILITY) && StackChanges.availableStacks(victim, buffer) > 0) {
            StackChanges.queueDecrement(victim, buffer);
            return true;
        }

        event.setAmount(amount);
        return false;
    }

    private static void onLivingTick(LivingEvent.LivingTickEvent event) {
        LivingEntity entity = event.getEntity();
        if (!(entity.level() instanceof ServerLevel level)) return;
        applyAbsorptionModifiers(entity);
        checkDoom(entity, level);
    }

    private static void applyAbsorptionModifiers(LivingEntity entity) {
        float current = entity.getAbsorptionAmount();
        Float last = LAST_ABSORPTION.put(entity, current);
        if (last == null || current <= last) return;

        int dexterity = ModEffects.stacks(entity, ModEffects.DEXTERITY);
        boolean frail = entity.hasEffect(ModEffects.holder(ModEffects.FRAIL));
        if (dexterity == 0 && !frail) return;

        float gained = current - last + dexterity;
        if (frail) gained = (float) Math.floor(gained * FRAIL_MULTIPLIER);
        float adjusted = last + Math.max(0, gained);
        entity.setAbsorptionAmount(adjusted); // clamped by MAX_ABSORPTION, which dexterity raises
        LAST_ABSORPTION.put(entity, entity.getAbsorptionAmount());
    }

    private static void checkDoom(LivingEntity entity, ServerLevel level) {
        int doom = ModEffects.stacks(entity, ModEffects.DOOM);
        if (doom == 0 || !entity.isAlive() || doom < entity.getHealth()) return;
        var type = level.registryAccess().lookupOrThrow(Registries.DAMAGE_TYPE).getOrThrow(DOOM_DAMAGE);
        entity.hurtServer(level, new DamageSource(type), Float.MAX_VALUE);
    }

    /** Artifact: block the next harmful effect, consuming one stack. */
    private static void onApplicable(MobEffectEvent.Applicable event) {
        LivingEntity entity = event.getEntity();
        if (entity.level().isClientSide() || StackChanges.isInternalApply()) return;
        if (event.getEffectInstance().getEffect().value().getCategory() != MobEffectCategory.HARMFUL) return;
        var artifact = ModEffects.holder(ModEffects.ARTIFACT);
        if (StackChanges.availableStacks(entity, artifact) <= 0) return;
        StackChanges.queueDecrement(entity, artifact);
        event.setResult(Result.DENY);
    }
}
