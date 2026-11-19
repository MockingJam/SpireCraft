package com.mockingjam.spirecraft.alchemy;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.registry.ModItems;
import java.util.function.Supplier;
import net.minecraft.core.Holder;
import net.minecraft.core.registries.Registries;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.item.Items;
import net.minecraft.world.item.alchemy.Potion;
import net.minecraft.world.item.alchemy.Potions;
import net.minecraftforge.event.brewing.BrewingRecipeRegisterEvent;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.RegistryObject;

/**
 * STS2 potions as vanilla potions, so splash / lingering / tipped arrows work automatically.
 * Durations follow vanilla (strength 3:00 / 8:00 / 1:30, weakness 1:30 / 4:00). Design: docs/design/consumables.md.
 * Potion names are the translation suffix: item.minecraft.potion.effect.&lt;name&gt; etc., prefixed to avoid vanilla clashes.
 */
public final class ModPotions {
    public static final DeferredRegister<Potion> POTIONS = DeferredRegister.create(Registries.POTION, SpireCraft.MODID);

    private static final int MIN = 1200;

    public static final RegistryObject<Potion> STRENGTH = potion("strength", () -> eff(ModEffects.STRENGTH, 3 * MIN, 1));
    public static final RegistryObject<Potion> LONG_STRENGTH = potion("long_strength", "strength", () -> eff(ModEffects.STRENGTH, 8 * MIN, 1));
    public static final RegistryObject<Potion> STRONG_STRENGTH = potion("strong_strength", "strength", () -> eff(ModEffects.STRENGTH, 90 * 20, 3));
    public static final RegistryObject<Potion> FLEX = potion("flex", () -> eff(ModEffects.STRENGTH, 20 * 20, 4));

    public static final RegistryObject<Potion> DEXTERITY = potion("dexterity", () -> eff(ModEffects.DEXTERITY, 3 * MIN, 1));
    public static final RegistryObject<Potion> LONG_DEXTERITY = potion("long_dexterity", "dexterity", () -> eff(ModEffects.DEXTERITY, 8 * MIN, 1));
    public static final RegistryObject<Potion> STRONG_DEXTERITY = potion("strong_dexterity", "dexterity", () -> eff(ModEffects.DEXTERITY, 90 * 20, 3));
    public static final RegistryObject<Potion> FYSH_OIL = custom("fysh_oil", () -> new Potion(name("fysh_oil"),
            eff(ModEffects.STRENGTH, 3 * MIN, 0), eff(ModEffects.DEXTERITY, 3 * MIN, 0)));

    public static final RegistryObject<Potion> WEAK = potion("weak", () -> eff(ModEffects.WEAK, 90 * 20, 0));
    public static final RegistryObject<Potion> LONG_WEAK = potion("long_weak", "weak", () -> eff(ModEffects.WEAK, 4 * MIN, 0));
    public static final RegistryObject<Potion> VULNERABLE = potion("vulnerable", () -> eff(ModEffects.VULNERABLE, 90 * 20, 0));
    public static final RegistryObject<Potion> LONG_VULNERABLE = potion("long_vulnerable", "vulnerable", () -> eff(ModEffects.VULNERABLE, 4 * MIN, 0));

    /** 4 stacks decay 4+3+2+1 = 10 damage over ~20 s; strong: 6 stacks = 21. Duration covers the whole decay. */
    public static final RegistryObject<Potion> POISON = potion("poison", () -> eff(ModEffects.POISON, 30 * 20, 3));
    public static final RegistryObject<Potion> STRONG_POISON = potion("strong_poison", "poison", () -> eff(ModEffects.POISON, 40 * 20, 5));
    public static final RegistryObject<Potion> DOOM = potion("doom", () -> eff(ModEffects.DOOM, 30 * 20, 9));

    public static final RegistryObject<Potion> BLOCK = custom("block", () -> new Potion(name("block"), new MobEffectInstance(MobEffects.ABSORPTION, 30 * 20, 1)));
    public static final RegistryObject<Potion> LIQUID_BRONZE = potion("liquid_bronze", () -> eff(ModEffects.THORNS, 90 * 20, 2));
    public static final RegistryObject<Potion> LUCKY_TONIC = potion("lucky_tonic", () -> eff(ModEffects.BUFFER, 3 * MIN, 0));
    public static final RegistryObject<Potion> BLOOD = potion("blood", () -> eff(ModEffects.BLOOD_HEAL, 1, 0));
    /** Potion of Capacity (STS2): 2 extra orb slots for 3 minutes. */
    public static final RegistryObject<Potion> CAPACITY = potion("capacity", () -> eff(ModEffects.CAPACITY, 3 * MIN, 1));
    public static final RegistryObject<Potion> GHOST_IN_A_JAR = potion("ghost_in_a_jar", () -> eff(ModEffects.INTANGIBLE, 10 * 20, 0));

    private ModPotions() {}

    /** Translation suffix shared by a potion and its long/strong variants. */
    public static String name(String base) {
        return SpireCraft.MODID + "_" + base;
    }

    private static MobEffectInstance eff(RegistryObject<net.minecraft.world.effect.MobEffect> effect, int duration, int amplifier) {
        return new MobEffectInstance(ModEffects.holder(effect), duration, amplifier);
    }

    private static RegistryObject<Potion> potion(String id, Supplier<MobEffectInstance> effect) {
        return potion(id, id, effect);
    }

    private static RegistryObject<Potion> potion(String id, String nameBase, Supplier<MobEffectInstance> effect) {
        return POTIONS.register(id, () -> new Potion(name(nameBase), effect.get()));
    }

    /** Potions with several effects or vanilla effects. */
    private static RegistryObject<Potion> custom(String id, Supplier<Potion> factory) {
        return POTIONS.register(id, factory);
    }

    public static Holder<Potion> holder(RegistryObject<Potion> potion) {
        return potion.getHolder().orElseThrow();
    }

    /** Brewing recipes; the base is the awkward potion like vanilla, corruption uses fermented spider eye like vanilla. */
    public static void registerBrewing(BrewingRecipeRegisterEvent event) {
        var b = event.getBuilder();
        b.addMix(Potions.AWKWARD, ModItems.BRIMSTONE.get(), holder(STRENGTH));
        b.addMix(holder(STRENGTH), Items.REDSTONE, holder(LONG_STRENGTH));
        b.addMix(holder(STRENGTH), Items.GLOWSTONE_DUST, holder(STRONG_STRENGTH));
        b.addMix(holder(STRENGTH), Items.BLAZE_POWDER, holder(FLEX));

        b.addMix(Potions.AWKWARD, Items.FEATHER, holder(DEXTERITY));
        b.addMix(Potions.AWKWARD, Items.COPPER_INGOT, holder(CAPACITY));
        b.addMix(holder(DEXTERITY), Items.REDSTONE, holder(LONG_DEXTERITY));
        b.addMix(holder(DEXTERITY), Items.GLOWSTONE_DUST, holder(STRONG_DEXTERITY));
        b.addMix(Potions.AWKWARD, Items.COD, holder(FYSH_OIL));

        b.addMix(holder(STRENGTH), Items.FERMENTED_SPIDER_EYE, holder(WEAK));
        b.addMix(holder(LONG_STRENGTH), Items.FERMENTED_SPIDER_EYE, holder(LONG_WEAK));
        b.addMix(holder(WEAK), Items.REDSTONE, holder(LONG_WEAK));
        b.addMix(holder(DEXTERITY), Items.FERMENTED_SPIDER_EYE, holder(VULNERABLE));
        b.addMix(holder(LONG_DEXTERITY), Items.FERMENTED_SPIDER_EYE, holder(LONG_VULNERABLE));
        b.addMix(holder(VULNERABLE), Items.REDSTONE, holder(LONG_VULNERABLE));

        b.addMix(Potions.AWKWARD, Items.POISONOUS_POTATO, holder(POISON));
        b.addMix(holder(POISON), Items.GLOWSTONE_DUST, holder(STRONG_POISON));
        b.addMix(Potions.AWKWARD, Items.WITHER_ROSE, holder(DOOM));

        b.addMix(Potions.AWKWARD, ModItems.TUNGSTEN_INGOT.get(), holder(BLOCK));
        b.addMix(Potions.AWKWARD, Items.COPPER_INGOT, holder(LIQUID_BRONZE));
        b.addMix(Potions.AWKWARD, Items.AMETHYST_SHARD, holder(LUCKY_TONIC));
        b.addMix(Potions.AWKWARD, Items.CRIMSON_FUNGUS, holder(BLOOD));
        b.addMix(Potions.AWKWARD, Items.ECHO_SHARD, holder(GHOST_IN_A_JAR));
    }
}
