package com.mockingjam.spirecraft.registry;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.alchemy.ModPotions;
import net.minecraft.world.item.Items;
import net.minecraft.world.item.alchemy.PotionContents;
import java.util.List;
import java.util.function.Supplier;
import net.minecraft.core.registries.Registries;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.ItemLike;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.RegistryObject;

/**
 * Creative tabs. A tab is added when the first content of its kind exists, so the game never shows an empty tab.
 * Tabs: blocks, materials, equipment, food & potions, relics.
 */
public final class ModCreativeTabs {
    public static final DeferredRegister<CreativeModeTab> TABS = DeferredRegister.create(Registries.CREATIVE_MODE_TAB, SpireCraft.MODID);

    public static final RegistryObject<CreativeModeTab> BLOCKS = tab("blocks", ModBlocks.WOLFRAMITE_ORE, () -> List.of(
            ModBlocks.WOLFRAMITE_ORE.get(), ModBlocks.DEEPSLATE_WOLFRAMITE_ORE.get(), ModBlocks.TUNGSTEN_ALLOY_BLOCK.get(),
            ModBlocks.ORICHALCUM_ORE.get(), ModBlocks.ORICHALCUM_BLOCK.get(),
            ModBlocks.AUTOMATON_ALLOY_BLOCK.get(), ModBlocks.TARNISHED_AUTOMATON_ALLOY_BLOCK.get(), ModBlocks.DERELICT_AUTOMATON_ALLOY_BLOCK.get(),
            ModBlocks.CORE_CRYSTAL_BLOCK.get(), ModBlocks.CRACKED_CORE_CRYSTAL_BLOCK.get(),
            ModBlocks.METEORITE.get(), ModBlocks.ORANGE_DOUGH.get(),
            ModBlocks.NETHER_BRIMSTONE_ORE.get(), ModBlocks.BRIMSTONE_BLOCK.get(),
            ModBlocks.LAVA_ROCK_ORE.get()));

    public static final RegistryObject<CreativeModeTab> MATERIALS = tab("materials", ModItems.TUNGSTEN_ALLOY_INGOT, () -> List.of(
            ModItems.RAW_TUNGSTEN.get(), ModItems.TUNGSTEN_INGOT.get(), ModItems.TUNGSTEN_ALLOY_INGOT.get(), ModItems.AUTOMATON_ALLOY_INGOT.get(),
            ModItems.RAW_ORICHALCUM.get(), ModItems.ORICHALCUM_INGOT.get(),
            ModItems.BRIMSTONE.get(), ModItems.LAVA_ROCK_SHARD.get(), ModItems.LAVA_ROCK.get(), ModItems.GALACTIC_DUST.get(),
            ModItems.SCRAP.get(), ModItems.PEBBLE.get(), ModItems.FLAK_SHELL.get()));

    public static final RegistryObject<CreativeModeTab> EQUIPMENT = tab("equipment", ModItems.ORICHALCUM_SWORD, () -> List.of(
            ModItems.TUNGSTEN_HELMET.get(), ModItems.TUNGSTEN_CHESTPLATE.get(), ModItems.TUNGSTEN_LEGGINGS.get(), ModItems.TUNGSTEN_BOOTS.get(),
            ModItems.ORICHALCUM_SWORD.get(), ModItems.ORICHALCUM_PICKAXE.get(), ModItems.ORICHALCUM_AXE.get(),
            ModItems.ORICHALCUM_SHOVEL.get(), ModItems.ORICHALCUM_HOE.get(),
            ModItems.ORICHALCUM_HELMET.get(), ModItems.ORICHALCUM_CHESTPLATE.get(), ModItems.ORICHALCUM_LEGGINGS.get(), ModItems.ORICHALCUM_BOOTS.get()));

    public static final RegistryObject<CreativeModeTab> WEAPONS = tab("weapons", ModItems.SOVEREIGN_BLADE, () -> List.of(
            ModItems.SOVEREIGN_BLADE.get(),
            ModItems.CRESCENT_SPEAR.get(),
            ModItems.HEIRLOOM_HAMMER.get(),
            ModItems.REGENT_STRIKE.get(),
            ModItems.PHOTON_CUT.get(),
            ModItems.SCYTHE.get(),
            ModItems.SCOURGE.get(),
            ModItems.FORBIDDEN_GRIMOIRE.get(),
            ModItems.DIRGE_FLUTE.get(),
            ModItems.DANSE_MACABRE.get(),
            ModItems.POISON_FLASK.get(),
            ModItems.POISONED_DAGGER.get(),
            ModItems.INK_DAGGER.get(),
            ModItems.THROWING_KNIFE.get(),
            ModItems.SLINGSHOT.get(),
            ModItems.SNAKEBITE.get(),
            ModItems.CLEAVER.get(),
            ModItems.MORNING_STAR.get(),
            ModItems.INFERNAL_BLADE.get(),
            ModItems.TANK_SHIELD.get(),
            ModItems.BLOODLETTING_DAGGER.get(),
            ModItems.BLUDGEON.get(),
            ModItems.ROCKET_PUNCH.get(),
            ModItems.ENERGY_CORE.get(),
            ModItems.FLAK_CANNON.get(),
            ModItems.TESLA_COIL.get(),
            ModItems.SHADOW_SHIELD.get(),
            ModItems.LIGHTNING_ROD.get()));

    public static final RegistryObject<CreativeModeTab> CONSUMABLES = TABS.register("consumables", () -> CreativeModeTab.builder()
            .title(Component.translatable("itemGroup." + SpireCraft.MODID + ".consumables"))
            .icon(() -> new ItemStack(ModItems.MANGO.get()))
            .displayItems((params, output) -> {
                for (var food : List.of(ModItems.STRAWBERRY, ModItems.PEAR, ModItems.MANGO, ModItems.MEAT_ON_THE_BONE,
                        ModItems.AMETHYST_AUBERGINE)) {
                    output.accept(food.get());
                }
                for (var item : List.of(Items.POTION, Items.SPLASH_POTION, Items.LINGERING_POTION)) {
                    for (var potion : ModPotions.POTIONS.getEntries()) {
                        output.accept(PotionContents.createItemStack(item, ModPotions.holder(potion)));
                    }
                }
            })
            .build());

    public static final RegistryObject<CreativeModeTab> RELICS = tab("relics", ModItems.BURNING_BLOOD, () -> List.of(
            ModItems.RELIC_POUCH.get(), ModItems.BURNING_BLOOD.get(), ModItems.ANCHOR.get(), ModItems.VAJRA.get(),
            ModItems.ODDLY_SMOOTH_STONE.get(), ModItems.BAG_OF_MARBLES.get(), ModItems.RED_MASK.get(), ModItems.BRONZE_SCALES.get(),
            ModItems.BLOOD_VIAL.get(), ModItems.RED_SKULL.get(), ModItems.PEN_NIB.get(), ModItems.MERCURY_HOURGLASS.get(),
            ModItems.SHURIKEN.get(), ModItems.LIZARD_TAIL.get(), ModItems.TUNGSTEN_ROD.get()));

    public static final RegistryObject<CreativeModeTab> MOBS = tab("mobs", ModItems.CEREMONIAL_BELL, () -> {
        List<ItemLike> out = new java.util.ArrayList<>(ModItems.SPAWN_EGGS.stream().<ItemLike>map(RegistryObject::get).toList());
        out.add(ModItems.CEREMONIAL_BELL.get());
        for (var it : ModItems.BOSS_SUMMONS) out.add(it.get());
        out.add(ModItems.RELIC_FRAGMENT.get());
        out.add(ModItems.SOUL_BAIT.get());
        out.add(ModItems.SOUL_FYSH_BLADDER.get());
        return out;
    });

    public static final RegistryObject<CreativeModeTab> BIOME_BLOCKS = tab("biome_blocks", ModBlocks.GNARLWOOD.log, () ->
            com.mockingjam.spirecraft.block.BiomeBlocks.tabOrder().stream().<ItemLike>map(RegistryObject::get).toList());

    private ModCreativeTabs() {}

    private static RegistryObject<CreativeModeTab> tab(String name, Supplier<? extends ItemLike> icon, Supplier<List<ItemLike>> contents) {
        return TABS.register(name, () -> CreativeModeTab.builder()
                .title(Component.translatable("itemGroup." + SpireCraft.MODID + "." + name))
                .icon(() -> new ItemStack(icon.get()))
                .displayItems((params, output) -> contents.get().forEach(output::accept))
                .build());
    }
}
