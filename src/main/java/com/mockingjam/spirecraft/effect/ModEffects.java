package com.mockingjam.spirecraft.effect;

import com.mockingjam.spirecraft.SpireCraft;
import java.util.function.Supplier;
import net.minecraft.core.Holder;
import net.minecraft.core.registries.Registries;
import net.minecraft.world.effect.MobEffect;
import net.minecraft.world.effect.MobEffectCategory;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.ai.attributes.AttributeModifier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.RegistryObject;

/** Slay-the-Spire status effects. Rules: docs/design/effects.md. */
public final class ModEffects {
    public static final DeferredRegister<MobEffect> EFFECTS = DeferredRegister.create(Registries.MOB_EFFECT, SpireCraft.MODID);

    // ---- Buffs ----
    public static final RegistryObject<MobEffect> STRENGTH = register("strength", () -> new SpireEffect(MobEffectCategory.BENEFICIAL, 0xC8332B));
    /** +1 max absorption per stack, so the extra absorption granted by dexterity is not clipped by the vanilla cap. */
    public static final RegistryObject<MobEffect> DEXTERITY = register("dexterity", () -> new SpireEffect(MobEffectCategory.BENEFICIAL, 0x4FAE5A)
            .addAttributeModifier(Attributes.MAX_ABSORPTION, SpireCraft.id("effect.dexterity"), 1.0, AttributeModifier.Operation.ADD_VALUE));
    public static final RegistryObject<MobEffect> BUFFER = register("buffer", () -> new SpireEffect(MobEffectCategory.BENEFICIAL, 0x7FB8E8));
    public static final RegistryObject<MobEffect> ARTIFACT = register("artifact", () -> new SpireEffect(MobEffectCategory.BENEFICIAL, 0xE8C547));
    public static final RegistryObject<MobEffect> THORNS = register("thorns", () -> new SpireEffect(MobEffectCategory.BENEFICIAL, 0x8A6A3A));

    // ---- Debuffs ----
    public static final RegistryObject<MobEffect> WEAK = register("weak", () -> new SpireEffect(MobEffectCategory.HARMFUL, 0x7A6F8F));
    public static final RegistryObject<MobEffect> VULNERABLE = register("vulnerable", () -> new SpireEffect(MobEffectCategory.HARMFUL, 0xE07A2E));
    public static final RegistryObject<MobEffect> FRAIL = register("frail", () -> new SpireEffect(MobEffectCategory.HARMFUL, 0x9C8E7A));
    public static final RegistryObject<MobEffect> POISON = register("poison", () -> new SpirePoisonEffect(MobEffectCategory.HARMFUL, 0x5DA130));
    public static final RegistryObject<MobEffect> DOOM = register("doom", () -> new SpireEffect(MobEffectCategory.HARMFUL, 0x4B2A6B));

    // ---- Phase 4 ----
    /** Ghost in a Jar: every HP loss is capped at 1. */
    public static final RegistryObject<MobEffect> INTANGIBLE = register("intangible", () -> new SpireEffect(MobEffectCategory.BENEFICIAL, 0xC9D6E8));
    /** Amethyst Aubergine: slain mobs drop extra gold nuggets. */
    public static final RegistryObject<MobEffect> PROSPERITY = register("prosperity", () -> new SpireEffect(MobEffectCategory.BENEFICIAL, 0x9A6FD6));
    /** Blood Potion: instantly heal 20% of max health per level. */
    public static final RegistryObject<MobEffect> BLOOD_HEAL = register("blood_heal", () -> new BloodHealEffect(MobEffectCategory.BENEFICIAL, 0xA0102A));

    // ---- Phase 6: Defect's channeled orbs (stack count = number of orbs; see weapon/ChargeCoreItem) ----
    public static final RegistryObject<MobEffect> LIGHTNING_ORB = register("lightning_orb", () -> new SpireEffect(MobEffectCategory.BENEFICIAL, 0x8FD3FF));
    /** +2 max absorption per Frost orb, so the frost passive has room. */
    public static final RegistryObject<MobEffect> FROST_ORB = register("frost_orb", () -> new SpireEffect(MobEffectCategory.BENEFICIAL, 0xBFEFFF)
            .addAttributeModifier(Attributes.MAX_ABSORPTION, SpireCraft.id("effect.frost_orb"), 2.0, AttributeModifier.Operation.ADD_VALUE));

    /** Dark orb (Shadow Shield): gathers 2 damage every 3 s; evoked, it releases it all on the nearest hostile mob. */
    public static final RegistryObject<MobEffect> DARK_ORB = register("dark_orb", () -> new SpireEffect(MobEffectCategory.BENEFICIAL, 0x7A4AC0));

    /** Capacity (Potion of Capacity): +1 orb slot per level. */
    public static final RegistryObject<MobEffect> CAPACITY = register("capacity", () -> new SpireEffect(MobEffectCategory.BENEFICIAL, 0xE0C060));

    /** Shrink (Shrinker Beetle): melee hits deal 30% less; removed when the beetle that applied it dies. */
    public static final RegistryObject<MobEffect> SHRINK = register("shrink", () -> new SpireEffect(MobEffectCategory.HARMFUL, 0xC9B458));
    /** Ringing (Ceremonial Beast cry; STS2 "you can only play 1 card"): attack speed halved. */
    public static final RegistryObject<MobEffect> RINGING = register("ringing", () -> new SpireEffect(MobEffectCategory.HARMFUL, 0x9AD0E0)
            .addAttributeModifier(Attributes.ATTACK_SPEED, SpireCraft.id("effect.ringing"), -0.5, AttributeModifier.Operation.ADD_MULTIPLIED_TOTAL));

    /** Disintegration (Knowledge Demon): magic damage every 4 seconds. */
    public static final RegistryObject<MobEffect> DISINTEGRATION = register("disintegration", () -> new DisintegrationEffect(MobEffectCategory.HARMFUL, 0x8A9A6A));

    private ModEffects() {}

    private static RegistryObject<MobEffect> register(String name, Supplier<MobEffect> factory) {
        return EFFECTS.register(name, factory);
    }

    public static Holder<MobEffect> holder(RegistryObject<MobEffect> effect) {
        return effect.getHolder().orElseThrow();
    }

    /**
     * Adds {@code n} stacks (amplifier + n), capped at {@code maxStacks}; keeps the longer of the old and new duration.
     * Used by relics so their stacks add up with other sources instead of being ignored.
     */
    public static void addStacks(LivingEntity entity, RegistryObject<MobEffect> effect, int n, int duration, int maxStacks) {
        var holder = holder(effect);
        var old = entity.getEffect(holder);
        int stacks = Math.min(maxStacks, (old == null ? 0 : old.getAmplifier() + 1) + n);
        int time = old == null ? duration : Math.max(duration, old.getDuration());
        if (old != null) entity.removeEffect(holder);
        entity.addEffect(new net.minecraft.world.effect.MobEffectInstance(holder, time, stacks - 1));
    }

    /** STS stack count: 0 when absent, otherwise amplifier + 1. */
    public static int stacks(LivingEntity entity, RegistryObject<MobEffect> effect) {
        var instance = entity.getEffect(holder(effect));
        return instance == null ? 0 : instance.getAmplifier() + 1;
    }
}
