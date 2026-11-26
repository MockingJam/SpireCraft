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

    // ---- Glory (docs/design/glory.md) ----
    /** Paper Cuts (Scroll of Biting): −1 max health per stack (at most 6); gone after a night's sleep or death. */
    public static final RegistryObject<MobEffect> PAPER_CUTS = register("paper_cuts", () -> new SpireEffect(MobEffectCategory.HARMFUL, 0xB49AE0)
            .addAttributeModifier(Attributes.MAX_HEALTH, SpireCraft.id("effect.paper_cuts"), -1.0, AttributeModifier.Operation.ADD_VALUE));
    /** Galvanic (Globe Head, while near it): every new beneficial effect - a potion, a golden apple - shocks you for 2.5. */
    public static final RegistryObject<MobEffect> GALVANIC = register("galvanic", () -> new SpireEffect(MobEffectCategory.HARMFUL, 0x58A8F0));
    /** Hex (Spectral Knight, while near it; STS2: every card turns Ethereal): your buffs run out twice as fast. */
    public static final RegistryObject<MobEffect> HEX = register("hex", () -> new SpireEffect(MobEffectCategory.HARMFUL, 0x6ADCC0));
    /** Dampen (Magi Knight, while near it; STS2: every card is Downgraded): your gear is worse - attack −20 %, armour −4. */
    public static final RegistryObject<MobEffect> DAMPEN = register("dampen", () -> new SpireEffect(MobEffectCategory.HARMFUL, 0xA0784C)
            .addAttributeModifier(Attributes.ATTACK_DAMAGE, SpireCraft.id("effect.dampen"), -0.2, AttributeModifier.Operation.ADD_MULTIPLIED_TOTAL)
            .addAttributeModifier(Attributes.ARMOR, SpireCraft.id("effect.dampen_armor"), -4.0, AttributeModifier.Operation.ADD_VALUE));
    /** Bound (the Queen's Chains of Binding; STS2: only one Bound card a turn): after you change the item in your hand, 1.5 s before you can strike or use it. */
    public static final RegistryObject<MobEffect> BOUND = register("bound", () -> new SpireEffect(MobEffectCategory.HARMFUL, 0x5A8A3A));
    /** Stolen Strength / Stolen Speed (the Lost / the Forgotten took more than you had): −1 attack, −10 % speed per level, until the thief dies. */
    public static final RegistryObject<MobEffect> STOLEN_STRENGTH = register("stolen_strength", () -> new SpireEffect(MobEffectCategory.HARMFUL, 0xC07A3A)
            .addAttributeModifier(Attributes.ATTACK_DAMAGE, SpireCraft.id("effect.stolen_strength"), -1.0, AttributeModifier.Operation.ADD_VALUE));
    /** Wound (the Test Subject's Painful Stabs): healing −20 % per stack (SpireEffectEvents / GloryEffectEvents). */
    public static final RegistryObject<MobEffect> WOUND = register("wound", () -> new SpireEffect(MobEffectCategory.HARMFUL, 0x8A1A1A));
    public static final RegistryObject<MobEffect> STOLEN_SPEED = register("stolen_speed", () -> new SpireEffect(MobEffectCategory.HARMFUL, 0x9A9AA4)
            .addAttributeModifier(Attributes.MOVEMENT_SPEED, SpireCraft.id("effect.stolen_speed"), -0.1, AttributeModifier.Operation.ADD_MULTIPLIED_TOTAL));

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
