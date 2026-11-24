package com.mockingjam.spirecraft.datagen;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.block.BiomeBlocks;
import com.mockingjam.spirecraft.block.StoneSet;
import com.mockingjam.spirecraft.block.WoodSet;
import net.minecraft.data.BlockFamily;
import net.minecraft.data.recipes.SingleItemRecipeBuilder;
import net.minecraft.world.flag.FeatureFlags;
import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mockingjam.spirecraft.registry.ModItems;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import net.minecraft.core.HolderLookup;
import net.minecraft.core.registries.Registries;
import net.minecraft.data.PackOutput;
import net.minecraft.data.recipes.RecipeCategory;
import net.minecraft.data.recipes.RecipeOutput;
import net.minecraft.data.recipes.RecipeProvider;
import net.minecraft.data.recipes.SimpleCookingRecipeBuilder;
import net.minecraft.resources.ResourceKey;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.Items;
import net.minecraft.world.item.crafting.Ingredient;
import net.minecraft.world.item.crafting.Recipe;
import net.minecraft.world.level.ItemLike;

/**
 * Crafting / smelting recipes.
 * Note: vanilla helpers that take a String recipe name (nineBlockStorageRecipes, oreSmelting, ...) save under the
 * minecraft namespace, so this class uses its own helpers that always save as spirecraft:&lt;name&gt;.
 */
public class ModRecipeProvider extends RecipeProvider {
    protected ModRecipeProvider(HolderLookup.Provider registries, RecipeOutput output) {
        super(registries, output);
    }

    @Override
    protected void buildRecipes() {
        // ---- Tungsten: ore → ingot; alloy needs several vanilla ores (iron, copper, coal) ----
        oreCooking(List.of(ModItems.RAW_TUNGSTEN.get(), ModBlocks.WOLFRAMITE_ORE.get(), ModBlocks.DEEPSLATE_WOLFRAMITE_ORE.get()),
                ModItems.TUNGSTEN_INGOT.get(), 0.7F, "tungsten_ingot");
        // the cave stones' ores smelt like the vanilla ores they replace
        for (var e : com.mockingjam.spirecraft.block.CaveOres.kinds().entrySet()) {
            ItemLike result; float xp;
            switch (e.getValue()) {
                case COAL -> { result = Items.COAL; xp = 0.1F; }
                case IRON -> { result = Items.IRON_INGOT; xp = 0.7F; }
                case COPPER -> { result = Items.COPPER_INGOT; xp = 0.7F; }
                case GOLD -> { result = Items.GOLD_INGOT; xp = 1.0F; }
                case REDSTONE -> { result = Items.REDSTONE; xp = 0.7F; }
                case LAPIS -> { result = Items.LAPIS_LAZULI; xp = 0.2F; }
                case DIAMOND -> { result = Items.DIAMOND; xp = 1.0F; }
                case EMERALD -> { result = Items.EMERALD; xp = 1.0F; }
                case WOLFRAMITE -> { result = ModItems.TUNGSTEN_INGOT.get(); xp = 0.7F; }
                default -> { result = ModItems.ORICHALCUM_INGOT.get(); xp = 1.0F; }
            }
            oreCooking(List.of(e.getKey()), result, xp, getItemName(result));
        }
        shapeless(RecipeCategory.MISC, ModItems.TUNGSTEN_ALLOY_INGOT.get(), 2)
                .requires(ModItems.TUNGSTEN_INGOT.get(), 2).requires(Items.IRON_INGOT).requires(Items.COPPER_INGOT).requires(Items.COAL)
                .unlockedBy(getHasName(ModItems.TUNGSTEN_INGOT.get()), has(ModItems.TUNGSTEN_INGOT.get()))
                .save(output, key("tungsten_alloy_ingot"));
        storage(ModItems.TUNGSTEN_ALLOY_INGOT.get(), ModBlocks.TUNGSTEN_ALLOY_BLOCK.get());
        Item alloy = ModItems.TUNGSTEN_ALLOY_INGOT.get();
        armor(ModItems.TUNGSTEN_HELMET.get(), alloy, "XXX", "X X");
        armor(ModItems.TUNGSTEN_CHESTPLATE.get(), alloy, "X X", "XXX", "XXX");
        armor(ModItems.TUNGSTEN_LEGGINGS.get(), alloy, "XXX", "X X", "X X");
        armor(ModItems.TUNGSTEN_BOOTS.get(), alloy, "X X", "X X");
        // Tungsten Rod relic: the end of the tungsten chain (material → armor → relic); costs 2 ingots + 1 block
        shaped(RecipeCategory.COMBAT, ModItems.TUNGSTEN_ROD.get())
                .define('A', alloy).define('B', ModBlocks.TUNGSTEN_ALLOY_BLOCK.get())
                .pattern("  A").pattern(" B ").pattern("A  ")
                .unlockedBy(getHasName(ModBlocks.TUNGSTEN_ALLOY_BLOCK.get()), has(ModBlocks.TUNGSTEN_ALLOY_BLOCK.get()))
                .save(output, key("tungsten_rod"));

        // Ceremonial Bell (summons the phase 8 boss): a vanilla bell, gold and a bone block
        shaped(RecipeCategory.MISC, ModItems.CEREMONIAL_BELL.get())
                .define('G', Items.GOLD_INGOT).define('B', Items.BELL).define('O', Items.BONE_BLOCK)
                .pattern("GOG").pattern(" B ")
                .unlockedBy(getHasName(Items.BELL), has(Items.BELL))
                .save(output, key("ceremonial_bell"));

        // Soul Bait (summons the batch 2 boss): rotten flesh, an ink sac and a ghast tear
        shapeless(RecipeCategory.MISC, ModItems.SOUL_BAIT.get(), 1)
                .requires(Items.ROTTEN_FLESH).requires(Items.INK_SAC).requires(Items.GHAST_TEAR)
                .unlockedBy(getHasName(Items.GHAST_TEAR), has(Items.GHAST_TEAR))
                .save(output, key("soul_bait"));

        // Relic pouch: a vanilla bundle trimmed with gold
        shaped(RecipeCategory.TOOLS, ModItems.RELIC_POUCH.get())
                .define('G', net.minecraft.world.item.Items.GOLD_INGOT).define('B', net.minecraft.world.item.Items.BUNDLE)
                .pattern(" G ").pattern("GBG").pattern(" G ")
                .unlockedBy(getHasName(net.minecraft.world.item.Items.BUNDLE), has(net.minecraft.world.item.Items.BUNDLE))
                .save(output, key("relic_pouch"));

        // ---- Relics (docs/design/relics.md; §11 user: relics are rare - not a crafting-table recipe any more). Each
        // craftable relic is forged at a smithing table: a Relic Fragment (only elites and bosses drop it) as the template,
        // the vanilla thing it grows out of as the base, and the material that tells its story. The rare ones
        // (Shuriken, Lizard Tail) stay loot-only; Burning Blood is forged from a Blood Vial.
        relicSmithing(ModItems.ANCHOR.get(), Items.IRON_BLOCK, Items.IRON_CHAIN);
        relicSmithing(ModItems.VAJRA.get(), Items.LIGHTNING_ROD, Items.GOLD_BLOCK);
        relicSmithing(ModItems.ODDLY_SMOOTH_STONE.get(), Items.SMOOTH_STONE, Items.HONEYCOMB);
        relicSmithing(ModItems.BRONZE_SCALES.get(), Items.ARMADILLO_SCUTE, Items.COPPER_BLOCK);
        relicSmithing(ModItems.MERCURY_HOURGLASS.get(), Items.CLOCK, Items.QUARTZ);
        relicSmithing(ModItems.BAG_OF_MARBLES.get(), Items.BUNDLE, Items.GREEN_STAINED_GLASS);
        relicSmithing(ModItems.RED_MASK.get(), Items.LEATHER_HELMET, Items.RED_DYE);
        relicSmithing(ModItems.BLOOD_VIAL.get(), Items.GLASS_BOTTLE, Items.GLISTERING_MELON_SLICE);
        relicSmithing(ModItems.RED_SKULL.get(), Items.SKELETON_SKULL, Items.BLAZE_POWDER);
        relicSmithing(ModItems.PEN_NIB.get(), Items.FEATHER, Items.GOLD_INGOT);
        relicSmithing(ModItems.BURNING_BLOOD.get(), ModItems.BLOOD_VIAL.get(), Items.MAGMA_CREAM);

        // ---- §11 boss calling tokens: each from what its boss is made of
        shapeless(RecipeCategory.MISC, ModItems.BLACK_QUILL.get(), 1).requires(Items.FEATHER).requires(Items.INK_SAC, 2).requires(ModItems.INK_BUBBLE.get()).requires(Items.GOLD_NUGGET)
                .unlockedBy(getHasName(ModItems.INK_BUBBLE.get()), has(ModItems.INK_BUBBLE.get())).save(output, key("black_quill"));
        shaped(RecipeCategory.MISC, ModItems.KIN_IDOL.get()).define('S', Items.SKELETON_SKULL).define('G', Items.GOLD_INGOT).define('H', Items.HAY_BLOCK)
                .pattern(" S ").pattern("GHG").pattern(" H ").unlockedBy(getHasName(Items.SKELETON_SKULL), has(Items.SKELETON_SKULL)).save(output, key("kin_idol"));
        shapeless(RecipeCategory.MISC, ModItems.STEAM_WHISTLE.get(), 1).requires(Items.GOAT_HORN).requires(Items.COPPER_INGOT, 2).requires(Items.WATER_BUCKET)
                .unlockedBy(getHasName(Items.GOAT_HORN), has(Items.GOAT_HORN)).save(output, key("steam_whistle"));
        shapeless(RecipeCategory.MISC, ModItems.SLUMBER_HORN.get(), 1).requires(Items.NAUTILUS_SHELL).requires(Items.IRON_INGOT, 2).requires(Items.SOUL_SAND)
                .unlockedBy(getHasName(Items.NAUTILUS_SHELL), has(Items.NAUTILUS_SHELL)).save(output, key("slumber_horn"));
        shapeless(RecipeCategory.MISC, ModItems.SAND_LURE.get(), 1).requires(Items.ROTTEN_FLESH, 2).requires(Items.SAND, 2).requires(Items.GOLD_INGOT)
                .unlockedBy(getHasName(Items.SAND), has(Items.SAND)).save(output, key("sand_lure"));

        // ---- §11 blocks and small things that had no way to be made
        smelt(ModBlocks.CORE_CRYSTAL_BLOCK.get(), ModBlocks.CRACKED_CORE_CRYSTAL_BLOCK.get());
        smelt(ModBlocks.INK_STAINED_STONE.base.get(), ModBlocks.CRACKED_INK_STONE.get());
        shaped(RecipeCategory.BUILDING_BLOCKS, ModBlocks.HIVE_COMB.get(), 2).define('H', Items.HONEYCOMB).define('S', ModBlocks.HIVE_SOIL.get())
                .pattern("HS").pattern("SH").unlockedBy(getHasName(ModBlocks.HIVE_SOIL.get()), has(ModBlocks.HIVE_SOIL.get())).save(output, key("hive_comb"));
        shapeless(RecipeCategory.BUILDING_BLOCKS, ModBlocks.HIVE_CACHE.get(), 1).requires(ModBlocks.HIVE_COMB.get()).requires(Items.HONEY_BOTTLE)
                .unlockedBy(getHasName(ModBlocks.HIVE_COMB.get()), has(ModBlocks.HIVE_COMB.get())).save(output, key("hive_cache"));
        shaped(RecipeCategory.DECORATIONS, ModBlocks.HIVE_MYCELIUM_LAYER.get(), 3).define('M', ModBlocks.HIVE_MYCELIUM.get())
                .pattern("MM").unlockedBy(getHasName(ModBlocks.HIVE_MYCELIUM.get()), has(ModBlocks.HIVE_MYCELIUM.get())).save(output, key("hive_mycelium_layer"));
        shapeless(RecipeCategory.DECORATIONS, ModBlocks.GLOW_MOSS_CARPET.get(), 2).requires(Items.MOSS_CARPET, 2).requires(Items.GLOW_BERRIES)
                .unlockedBy(getHasName(Items.GLOW_BERRIES), has(Items.GLOW_BERRIES)).save(output, key("glow_moss_carpet"));
        // automaton alloy weathers like copper; a wet hand hurries it (the bucket comes back)
        shapeless(RecipeCategory.BUILDING_BLOCKS, ModBlocks.TARNISHED_AUTOMATON_ALLOY_BLOCK.get(), 1).requires(ModBlocks.AUTOMATON_ALLOY_BLOCK.get()).requires(Items.WATER_BUCKET)
                .unlockedBy(getHasName(ModBlocks.AUTOMATON_ALLOY_BLOCK.get()), has(ModBlocks.AUTOMATON_ALLOY_BLOCK.get())).save(output, key("tarnished_automaton_alloy_block"));
        shapeless(RecipeCategory.BUILDING_BLOCKS, ModBlocks.DERELICT_AUTOMATON_ALLOY_BLOCK.get(), 1).requires(ModBlocks.TARNISHED_AUTOMATON_ALLOY_BLOCK.get()).requires(Items.WATER_BUCKET)
                .unlockedBy(getHasName(ModBlocks.TARNISHED_AUTOMATON_ALLOY_BLOCK.get()), has(ModBlocks.TARNISHED_AUTOMATON_ALLOY_BLOCK.get())).save(output, key("derelict_automaton_alloy_block"));
        // ink bubbles: a slime ball soaked in ink
        shapeless(RecipeCategory.COMBAT, ModItems.INK_BUBBLE.get(), 2).requires(Items.SLIME_BALL).requires(Items.INK_SAC)
                .unlockedBy(getHasName(Items.INK_SAC), has(Items.INK_SAC)).save(output, key("ink_bubble"));

        // ---- Phase 6 weapons v2 (docs/design/weapons.md): vanilla materials that tell each card's story; no vanilla pattern clashes ----
        // Regent (issue #36: every Regent weapon takes Orange Dough from the meteor crater)
        Item dough = ModBlocks.ORANGE_DOUGH.get().asItem();
        relicShaped(ModItems.SOVEREIGN_BLADE.get(), dough, "sovereign_blade", "GDG", "XOX", " S ",
                'G', Items.GOLD_INGOT, 'D', ModItems.GALACTIC_DUST.get(), 'X', dough, 'O', ModItems.ORICHALCUM_INGOT.get(), 'S', Items.STICK);
        relicShaped(ModItems.CRESCENT_SPEAR.get(), dough, "crescent_spear", " XG", " AX", "S  ",
                'G', Items.GOLD_INGOT, 'A', Items.AMETHYST_SHARD, 'X', dough, 'S', Items.STICK);
        relicShaped(ModItems.HEIRLOOM_HAMMER.get(), dough, "heirloom_hammer", "GDG", "XSX", " S ",
                'G', Items.GOLD_INGOT, 'D', Items.DIAMOND, 'X', dough, 'S', Items.STICK);
        relicShaped(ModItems.REGENT_STRIKE.get(), dough, "regent_strike", "G", "X", "S",
                'G', Items.GOLD_INGOT, 'X', dough, 'S', Items.STICK);
        relicShaped(ModItems.PHOTON_CUT.get(), dough, "photon_cut", " XI", " G ", "S  ",
                'I', Items.IRON_INGOT, 'G', Items.GLOWSTONE_DUST, 'X', dough, 'S', Items.STICK);
        // Necrobinder
        relicShaped(ModItems.SCYTHE.get(), Items.WITHER_ROSE, "scythe", "III", " SW", "S B",
                'I', Items.IRON_INGOT, 'S', Items.STICK, 'W', Items.WITHER_ROSE, 'B', Items.BONE_BLOCK);
        relicShapeless(ModItems.SCOURGE.get(), Items.IRON_CHAIN, "scourge", Items.LEATHER, Items.IRON_CHAIN, Items.IRON_CHAIN, Items.STRING, Items.STRING);
        relicShapeless(ModItems.FORBIDDEN_GRIMOIRE.get(), Items.BOOK, "forbidden_grimoire", Items.BOOK, Items.BONE, Items.BONE, Items.SOUL_SOIL, Items.AMETHYST_SHARD);
        relicShapeless(ModItems.DIRGE_FLUTE.get(), Items.BONE, "dirge_flute", Items.BONE, Items.BONE, Items.BONE, Items.SOUL_SOIL);
        relicShapeless(ModItems.DANSE_MACABRE.get(), Items.PURPLE_DYE, "danse_macabre", Items.STICK, Items.STICK, Items.PAPER, Items.PAPER, Items.PURPLE_DYE, Items.BONE);
        // Silent
        shapeless(RecipeCategory.COMBAT, ModItems.POISON_FLASK.get(), 3).requires(Items.GLASS_BOTTLE, 3).requires(Items.SPIDER_EYE).requires(Items.SLIME_BALL)
                .unlockedBy(getHasName(Items.SPIDER_EYE), has(Items.SPIDER_EYE)).save(output, key("poison_flask"));
        relicShaped(ModItems.POISONED_DAGGER.get(), Items.SPIDER_EYE, "poisoned_dagger", "I", "E", "S",
                'I', Items.IRON_INGOT, 'E', Items.SPIDER_EYE, 'S', Items.STICK);
        relicShaped(ModItems.INK_DAGGER.get(), Items.INK_SAC, "ink_dagger", "I", "N", "S",
                'I', Items.IRON_INGOT, 'N', Items.INK_SAC, 'S', Items.STICK);
        shapeless(RecipeCategory.COMBAT, ModItems.THROWING_KNIFE.get(), 8).requires(Items.IRON_NUGGET, 3).requires(Items.FLINT)
                .unlockedBy(getHasName(Items.FLINT), has(Items.FLINT)).save(output, key("throwing_knife"));
        // v2.2 ammo. Pebbles: gravel sifted into slingshot stones. Scrap: junk metal. Flak shells: any alloy or scrap + gunpowder.
        shapeless(RecipeCategory.COMBAT, ModItems.PEBBLE.get(), 4).requires(Items.GRAVEL)
                .unlockedBy(getHasName(Items.GRAVEL), has(Items.GRAVEL)).save(output, key("pebble"));
        shapeless(RecipeCategory.MISC, ModItems.SCRAP.get(), 3).requires(Items.IRON_NUGGET).requires(Items.COPPER_NUGGET).requires(Items.FLINT)
                .unlockedBy(getHasName(Items.IRON_NUGGET), has(Items.IRON_NUGGET)).save(output, key("scrap"));
        shapeless(RecipeCategory.COMBAT, ModItems.FLAK_SHELL.get(), 4).requires(Items.COPPER_INGOT).requires(Items.GUNPOWDER)
                .unlockedBy(getHasName(Items.GUNPOWDER), has(Items.GUNPOWDER)).save(output, key("flak_shell_from_copper"));
        shapeless(RecipeCategory.COMBAT, ModItems.FLAK_SHELL.get(), 6).requires(Items.IRON_INGOT).requires(Items.GUNPOWDER)
                .unlockedBy(getHasName(Items.GUNPOWDER), has(Items.GUNPOWDER)).save(output, key("flak_shell_from_iron"));
        shapeless(RecipeCategory.COMBAT, ModItems.FLAK_SHELL.get(), 12).requires(ModItems.TUNGSTEN_ALLOY_INGOT.get()).requires(Items.GUNPOWDER)
                .unlockedBy(getHasName(Items.GUNPOWDER), has(Items.GUNPOWDER)).save(output, key("flak_shell_from_tungsten"));
        shapeless(RecipeCategory.COMBAT, ModItems.FLAK_SHELL.get(), 3).requires(ModItems.SCRAP.get(), 3).requires(Items.GUNPOWDER)
                .unlockedBy(getHasName(ModItems.SCRAP.get()), has(ModItems.SCRAP.get())).save(output, key("flak_shell_from_scrap"));
        relicShaped(ModItems.SLINGSHOT.get(), Items.LEATHER, "slingshot", "SLS", " S ", " S ",
                'S', Items.STICK, 'L', Items.LEATHER);
        relicShaped(ModItems.SNAKEBITE.get(), Items.PUFFERFISH, "snakebite", "I", "P", "S",
                'I', Items.IRON_INGOT, 'P', Items.PUFFERFISH, 'S', Items.STICK);
        // Ironclad
        relicShapeless(ModItems.CLEAVER.get(), Items.IRON_SWORD, "cleaver", Items.IRON_SWORD, Items.IRON_INGOT, Items.FLINT);
        relicShaped(ModItems.MORNING_STAR.get(), ModBlocks.TUNGSTEN_ALLOY_BLOCK.get(), "morning_star", "  B", " C ", "S  ",
                'B', ModBlocks.TUNGSTEN_ALLOY_BLOCK.get(), 'C', Items.IRON_CHAIN, 'S', Items.STICK);
        relicShapeless(ModItems.INFERNAL_BLADE.get(), Items.BLAZE_ROD, "infernal_blade", Items.IRON_SWORD, Items.BLAZE_ROD, Items.MAGMA_CREAM, ModItems.BRIMSTONE.get());
        relicShaped(ModItems.TANK_SHIELD.get(), Items.GOLD_INGOT, "tank_shield", "IGI", "IGI", " I ",
                'I', Items.IRON_INGOT, 'G', Items.GOLD_INGOT);
        relicShaped(ModItems.BLOODLETTING_DAGGER.get(), ModItems.BRIMSTONE.get(), "bloodletting_dagger", "I", "B", "S",
                'I', Items.IRON_INGOT, 'B', ModItems.BRIMSTONE.get(), 'S', Items.STICK);
        relicShaped(ModItems.BLUDGEON.get(), Items.IRON_BLOCK, "bludgeon", "B", "S", "S",
                'B', Items.IRON_BLOCK, 'S', Items.STICK);
        // Defect
        relicShapeless(ModItems.ROCKET_PUNCH.get(), Items.FIREWORK_ROCKET, "rocket_punch", Items.COPPER_INGOT, Items.COPPER_INGOT, Items.FIREWORK_ROCKET, Items.PISTON, Items.REDSTONE);
        // v3.4: the energy core is a core crystal in an automaton alloy cage
        relicShaped(ModItems.ENERGY_CORE.get(), ModItems.AUTOMATON_ALLOY_INGOT.get(), "energy_core", " A ", "ACA", " A ",
                'A', ModItems.AUTOMATON_ALLOY_INGOT.get(), 'C', ModBlocks.CORE_CRYSTAL_BLOCK.get());
        relicShaped(ModItems.FLAK_CANNON.get(), Items.CROSSBOW, "flak_cannon", "IDI", "RCR", " I ",
                'I', Items.IRON_INGOT, 'D', Items.DISPENSER, 'R', Items.REDSTONE, 'C', Items.CROSSBOW);
        relicShaped(ModItems.TESLA_COIL.get(), Items.LIGHTNING_ROD, "tesla_coil", " L ", "CRC", "III",
                'L', Items.LIGHTNING_ROD, 'C', Items.COPPER_INGOT, 'R', Items.REDSTONE_BLOCK, 'I', Items.IRON_INGOT);
        relicShapeless(ModItems.SHADOW_SHIELD.get(), Items.ENDER_PEARL, "shadow_shield", Items.ENDER_PEARL, Items.INK_SAC, Items.INK_SAC, Items.GLASS, Items.COPPER_INGOT, Items.COPPER_INGOT);
        relicShaped(ModItems.LIGHTNING_ROD.get(), Items.LIGHTNING_ROD, "lightning_rod", "GLG", "GGG", " G ",
                'G', Items.GOLD_INGOT, 'L', Items.LIGHTNING_ROD);

        // ---- Orichalcum: diamond-like XP; tools & armor in vanilla shapes ----
        oreCooking(List.of(ModItems.RAW_ORICHALCUM.get(), ModBlocks.ORICHALCUM_ORE.get()), ModItems.ORICHALCUM_INGOT.get(), 1.0F, "orichalcum_ingot");
        storage(ModItems.ORICHALCUM_INGOT.get(), ModBlocks.ORICHALCUM_BLOCK.get());
        // v3.4: automaton alloy - four copper, one gold, one quartz make three; its block; the core crystal
        shapeless(RecipeCategory.MISC, ModItems.AUTOMATON_ALLOY_INGOT.get(), 3).requires(Items.COPPER_INGOT, 4).requires(Items.GOLD_INGOT).requires(Items.QUARTZ)
                .unlockedBy(getHasName(Items.COPPER_INGOT), has(Items.COPPER_INGOT)).save(output);
        storage(ModItems.AUTOMATON_ALLOY_INGOT.get(), ModBlocks.AUTOMATON_ALLOY_BLOCK.get());
        shapeless(RecipeCategory.BUILDING_BLOCKS, ModBlocks.CORE_CRYSTAL_BLOCK.get()).requires(Items.PRISMARINE_CRYSTALS, 4).requires(Items.GLOWSTONE_DUST).requires(Items.REDSTONE)
                .unlockedBy(getHasName(Items.PRISMARINE_CRYSTALS), has(Items.PRISMARINE_CRYSTALS)).save(output);
        Item o = ModItems.ORICHALCUM_INGOT.get();
        tool(ModItems.ORICHALCUM_SWORD.get(), o, "X", "X", "#");
        tool(ModItems.ORICHALCUM_PICKAXE.get(), o, "XXX", " # ", " # ");
        tool(ModItems.ORICHALCUM_AXE.get(), o, "XX", "X#", " #");
        tool(ModItems.ORICHALCUM_SHOVEL.get(), o, "X", "#", "#");
        tool(ModItems.ORICHALCUM_HOE.get(), o, "XX", " #", " #");
        armor(ModItems.ORICHALCUM_HELMET.get(), o, "XXX", "X X");
        armor(ModItems.ORICHALCUM_CHESTPLATE.get(), o, "X X", "XXX", "XXX");
        armor(ModItems.ORICHALCUM_LEGGINGS.get(), o, "XXX", "X X", "X X");
        armor(ModItems.ORICHALCUM_BOOTS.get(), o, "X X", "X X");

        // ---- Brimstone: storage block; real-world gunpowder (sulfur + charcoal + saltpeter → bone meal stands in) ----
        storage(ModItems.BRIMSTONE.get(), ModBlocks.BRIMSTONE_BLOCK.get());
        shapeless(RecipeCategory.MISC, Items.GUNPOWDER, 2)
                .requires(ModItems.BRIMSTONE.get()).requires(Items.CHARCOAL).requires(Items.BONE_MEAL)
                .unlockedBy(getHasName(ModItems.BRIMSTONE.get()), has(ModItems.BRIMSTONE.get()))
                .save(output, key("gunpowder_from_brimstone"));

        // ---- Lava Rock: 4 shards bound by a magma block ----
        shaped(RecipeCategory.MISC, ModItems.LAVA_ROCK.get())
                .define('S', ModItems.LAVA_ROCK_SHARD.get()).define('M', Items.MAGMA_BLOCK)
                .pattern(" S ").pattern("SMS").pattern(" S ")
                .unlockedBy(getHasName(ModItems.LAVA_ROCK_SHARD.get()), has(ModItems.LAVA_ROCK_SHARD.get()))
                .save(output, key("lava_rock"));

        // ---- Phase 4 food ----
        // Amethyst Aubergine: grown from vanilla amethyst (three shards in an aubergine shape; no vanilla recipe uses this pattern)
        shaped(RecipeCategory.FOOD, ModItems.AMETHYST_AUBERGINE.get())
                .define('A', Items.AMETHYST_SHARD)
                .pattern(" A").pattern("AA")
                .unlockedBy(getHasName(Items.AMETHYST_SHARD), has(Items.AMETHYST_SHARD))
                .save(output, key("amethyst_aubergine"));
        shapeless(RecipeCategory.FOOD, ModItems.MEAT_ON_THE_BONE.get())
                .requires(Items.BONE)
                .requires(Ingredient.of(Items.COOKED_BEEF, Items.COOKED_PORKCHOP, Items.COOKED_MUTTON, Items.COOKED_CHICKEN, Items.COOKED_RABBIT))
                .unlockedBy(getHasName(Items.BONE), has(Items.BONE))
                .save(output, key("meat_on_the_bone"));

        biomeBlocks();
    }

    /** Phase 7 biome blocks: vanilla-shaped wood/stone family recipes, plus ways into the natural-only stones. */
    private void biomeBlocks() {
        for (WoodSet w : BiomeBlocks.woods()) {
            planksFromLog(w.planks.get(), w.logsItemTag, 4);
            woodFromLogs(w.wood.get(), w.log.get());
            if (w.strippable) woodFromLogs(w.strippedWood.get(), w.strippedLog.get());
            generateRecipes(new BlockFamily.Builder(w.planks.get())
                    .button(w.button.get()).fence(w.fence.get()).fenceGate(w.fenceGate.get()).pressurePlate(w.pressurePlate.get())
                    .slab(w.slab.get()).stairs(w.stairs.get()).door(w.door.get()).trapdoor(w.trapdoor.get())
                    .recipeGroupPrefix("wooden").recipeUnlockedBy("has_planks").getFamily(), FeatureFlags.VANILLA_SET);
        }
        // Biomes v2: rotten wood never grows — logs left to rot with rotten flesh
        shapeless(RecipeCategory.BUILDING_BLOCKS, ModBlocks.ROTTEN.log.get(), 4).requires(net.minecraft.tags.ItemTags.LOGS_THAT_BURN).requires(net.minecraft.tags.ItemTags.LOGS_THAT_BURN)
                .requires(net.minecraft.tags.ItemTags.LOGS_THAT_BURN).requires(net.minecraft.tags.ItemTags.LOGS_THAT_BURN).requires(Items.ROTTEN_FLESH)
                .unlockedBy(getHasName(Items.ROTTEN_FLESH), has(Items.ROTTEN_FLESH)).save(output, key("rotten_log"));
        shaped(RecipeCategory.BUILDING_BLOCKS, ModBlocks.POLISHED_HIVE_ROCK.base.get(), 4).define('#', ModBlocks.HIVE_ROCK.base.get()).pattern("##").pattern("##")
                .unlockedBy(getHasName(ModBlocks.HIVE_ROCK.base.get()), has(ModBlocks.HIVE_ROCK.base.get())).save(output, key("polished_hive_rock"));
        shaped(RecipeCategory.BUILDING_BLOCKS, ModBlocks.HIVE_ROCK_BRICKS.base.get(), 4).define('#', ModBlocks.POLISHED_HIVE_ROCK.base.get()).pattern("##").pattern("##")
                .unlockedBy(getHasName(ModBlocks.POLISHED_HIVE_ROCK.base.get()), has(ModBlocks.POLISHED_HIVE_ROCK.base.get())).save(output, key("hive_rock_bricks"));
        for (StoneSet set : BiomeBlocks.stones()) {
            generateRecipes(new BlockFamily.Builder(set.base.get()).stairs(set.stairs.get()).slab(set.slab.get()).wall(set.wall.get())
                    .getFamily(), FeatureFlags.VANILLA_SET);
            stonecut(set.base.get(), set.stairs.get(), 1);
            stonecut(set.base.get(), set.slab.get(), 2);
            stonecut(set.base.get(), set.wall.get(), 1);
        }
        // Overgrowth ruins: stone overgrown by moss → ruin stone → bricks (→ cracked by smelting, chiseled from slabs)
        shaped(RecipeCategory.BUILDING_BLOCKS, ModBlocks.RUIN_STONE.base.get(), 8).define('S', Items.STONE).define('M', Items.MOSS_BLOCK)
                .pattern("SSS").pattern("SMS").pattern("SSS").unlockedBy(getHasName(Items.MOSS_BLOCK), has(Items.MOSS_BLOCK)).save(output);
        twoByTwo(ModBlocks.RUIN_STONE_BRICKS.base.get(), ModBlocks.RUIN_STONE.base.get());
        stonecut(ModBlocks.RUIN_STONE.base.get(), ModBlocks.RUIN_STONE_BRICKS.base.get(), 1);
        stonecut(ModBlocks.RUIN_STONE.base.get(), ModBlocks.PAVING_STONES.get(), 3);   // v3.5: paving stones from ruin stone
        smelt(ModBlocks.RUIN_STONE_BRICKS.base.get(), ModBlocks.CRACKED_RUIN_STONE_BRICKS.get());
        shaped(RecipeCategory.BUILDING_BLOCKS, ModBlocks.CHISELED_RUIN_STONE_BRICKS.get()).define('#', ModBlocks.RUIN_STONE_BRICKS.slab.get())
                .pattern("#").pattern("#").unlockedBy(getHasName(ModBlocks.RUIN_STONE_BRICKS.base.get()), has(ModBlocks.RUIN_STONE_BRICKS.base.get())).save(output);
        stonecut(ModBlocks.RUIN_STONE_BRICKS.base.get(), ModBlocks.CHISELED_RUIN_STONE_BRICKS.get(), 1);
        // Underdocks (v3.3): dock bricks are fired harbour mud - packed mud smelts into a dock brick, four make the block
        smelt(Items.PACKED_MUD, ModItems.DOCK_BRICK.get());
        shaped(RecipeCategory.BUILDING_BLOCKS, ModBlocks.DOCK_BRICKS.base.get()).define('#', ModItems.DOCK_BRICK.get()).pattern("##").pattern("##")
                .unlockedBy(getHasName(ModItems.DOCK_BRICK.get()), has(ModItems.DOCK_BRICK.get())).save(output);
        smelt(ModBlocks.DOCK_BRICKS.base.get(), ModBlocks.CRACKED_DOCK_BRICKS.get());
        twoByTwo(ModBlocks.POLISHED_HARBOUR_ROCK.base.get(), ModBlocks.HARBOUR_ROCK.base.get());
        stonecut(ModBlocks.HARBOUR_ROCK.base.get(), ModBlocks.POLISHED_HARBOUR_ROCK.base.get(), 1);
        shapeless(RecipeCategory.BUILDING_BLOCKS, ModBlocks.SLUDGE.get(), 2).requires(Items.MUD, 2).requires(Items.SLIME_BALL)
                .unlockedBy(getHasName(Items.MUD), has(Items.MUD)).save(output);
        // v3.5: junk (nine scrap, and back); paving stones from cobblestone too
        storage(ModItems.SCRAP.get(), ModBlocks.JUNK_BLOCK.get());
        stonecut(Items.COBBLESTONE, ModBlocks.PAVING_STONES.get(), 3);
        // v3.3: hive building blocks like the vanilla mud and stone bricks; silk, thatch, twigs
        shapeless(RecipeCategory.BUILDING_BLOCKS, ModBlocks.PACKED_HIVE_SOIL.get()).requires(ModBlocks.HIVE_SOIL.get()).requires(Items.WHEAT)
                .unlockedBy(getHasName(ModBlocks.HIVE_SOIL.get()), has(ModBlocks.HIVE_SOIL.get())).save(output);
        twoByTwo(ModBlocks.HIVE_SOIL_BRICKS.base.get(), ModBlocks.PACKED_HIVE_SOIL.get());
        smelt(ModBlocks.HIVE_ROCK_BRICKS.base.get(), ModBlocks.CRACKED_HIVE_ROCK_BRICKS.get());
        shaped(RecipeCategory.BUILDING_BLOCKS, ModBlocks.CHISELED_HIVE_ROCK_BRICKS.get()).define('#', ModBlocks.HIVE_ROCK_BRICKS.slab.get())
                .pattern("#").pattern("#").unlockedBy(getHasName(ModBlocks.HIVE_ROCK_BRICKS.base.get()), has(ModBlocks.HIVE_ROCK_BRICKS.base.get())).save(output);
        stonecut(ModBlocks.HIVE_ROCK_BRICKS.base.get(), ModBlocks.CHISELED_HIVE_ROCK_BRICKS.get(), 1);
        shapeless(RecipeCategory.BUILDING_BLOCKS, ModBlocks.WEBBED_HIVE_SOIL.get()).requires(ModBlocks.HIVE_SOIL.get()).requires(Items.STRING)
                .unlockedBy(getHasName(ModBlocks.HIVE_SOIL.get()), has(ModBlocks.HIVE_SOIL.get())).save(output);
        shaped(RecipeCategory.BUILDING_BLOCKS, ModBlocks.SILK_HIVE.get()).define('#', Items.STRING).pattern("##").pattern("##")
                .unlockedBy(getHasName(Items.STRING), has(Items.STRING)).save(output);
        shaped(RecipeCategory.BUILDING_BLOCKS, ModBlocks.THATCH.get()).define('#', Items.WHEAT).pattern("##").pattern("##")
                .unlockedBy(getHasName(Items.WHEAT), has(Items.WHEAT)).save(output);
        shaped(RecipeCategory.BUILDING_BLOCKS, ModBlocks.THATCH_STAIRS.get(), 4).define('#', ModBlocks.THATCH.get()).pattern("#  ").pattern("## ").pattern("###")
                .unlockedBy(getHasName(ModBlocks.THATCH.get()), has(ModBlocks.THATCH.get())).save(output);
        shaped(RecipeCategory.BUILDING_BLOCKS, ModBlocks.THATCH_SLAB.get(), 6).define('#', ModBlocks.THATCH.get()).pattern("###")
                .unlockedBy(getHasName(ModBlocks.THATCH.get()), has(ModBlocks.THATCH.get())).save(output);
        shaped(RecipeCategory.BUILDING_BLOCKS, ModBlocks.TWIG_NEST.get()).define('#', Items.STICK).pattern("##").pattern("##")
                .unlockedBy(getHasName(Items.STICK), has(Items.STICK)).save(output);
    }

    private void stonecut(ItemLike from, ItemLike to, int count) {
        SingleItemRecipeBuilder.stonecutting(Ingredient.of(from), RecipeCategory.BUILDING_BLOCKS, to, count)
                .unlockedBy(getHasName(from), has(from)).save(output, key(getItemName(to) + "_from_" + getItemName(from) + "_stonecutting"));
    }

    private void twoByTwo(ItemLike result, ItemLike from) {
        shaped(RecipeCategory.BUILDING_BLOCKS, result, 4).define('#', from).pattern("##").pattern("##")
                .unlockedBy(getHasName(from), has(from)).save(output);
    }

    private void smelt(ItemLike from, ItemLike to) {
        SimpleCookingRecipeBuilder.smelting(Ingredient.of(from), RecipeCategory.BUILDING_BLOCKS, to, 0.1F, 200)
                .unlockedBy(getHasName(from), has(from)).save(output, key(getItemName(to) + "_from_smelting"));
    }

    // ---------------------------------------------------------------- helpers
    private static ResourceKey<Recipe<?>> key(String name) {
        return ResourceKey.create(Registries.RECIPE, SpireCraft.id(name));
    }

    /** Shaped relic recipe: pattern rows, then (char, item) pairs. Unlocked by having {@code unlock}. */
    private void relicShaped(ItemLike result, ItemLike unlock, String name, Object... spec) {
        int rows = 0;
        while (rows < spec.length && spec[rows] instanceof String) rows++;
        var builder = shaped(RecipeCategory.COMBAT, result);
        for (int i = 0; i < rows; i++) builder.pattern((String) spec[i]);
        for (int i = rows; i + 1 < spec.length; i += 2) builder.define((Character) spec[i], (ItemLike) spec[i + 1]);
        builder.unlockedBy(getHasName(unlock), has(unlock)).save(output, key(name));
    }

    /** A relic forged at a smithing table from a Relic Fragment (§11). */
    private void relicSmithing(Item result, ItemLike base, ItemLike addition) {
        net.minecraft.data.recipes.SmithingTransformRecipeBuilder.smithing(Ingredient.of(ModItems.RELIC_FRAGMENT.get()), Ingredient.of(base), Ingredient.of(addition), RecipeCategory.COMBAT, result)
                .unlocks("has_relic_fragment", has(ModItems.RELIC_FRAGMENT.get())).save(output, key(getItemName(result) + "_smithing"));
    }

    private void relicShapeless(ItemLike result, ItemLike unlock, String name, ItemLike... ingredients) {
        var builder = shapeless(RecipeCategory.COMBAT, result, 1);
        for (ItemLike ingredient : ingredients) builder.requires(ingredient);
        builder.unlockedBy(getHasName(unlock), has(unlock)).save(output, key(name));
    }

    private void storage(ItemLike item, ItemLike block) {
        shaped(RecipeCategory.BUILDING_BLOCKS, block).define('#', item)
                .pattern("###").pattern("###").pattern("###")
                .unlockedBy(getHasName(item), has(item))
                .save(output, key(getItemName(block)));
        shapeless(RecipeCategory.MISC, item, 9).requires(block)
                .unlockedBy(getHasName(block), has(block))
                .save(output, key(getItemName(item) + "_from_" + getItemName(block)));
    }

    private void oreCooking(List<ItemLike> ores, ItemLike result, float xp, String group) {
        for (ItemLike ore : ores) {
            SimpleCookingRecipeBuilder.smelting(Ingredient.of(ore), RecipeCategory.MISC, result, xp, 200).group(group)
                    .unlockedBy(getHasName(ore), has(ore))
                    .save(output, key(getItemName(result) + "_from_smelting_" + getItemName(ore)));
            SimpleCookingRecipeBuilder.blasting(Ingredient.of(ore), RecipeCategory.MISC, result, xp, 100).group(group)
                    .unlockedBy(getHasName(ore), has(ore))
                    .save(output, key(getItemName(result) + "_from_blasting_" + getItemName(ore)));
        }
    }

    private void tool(ItemLike result, ItemLike material, String... pattern) {
        var b = shaped(RecipeCategory.TOOLS, result).define('X', material).define('#', Items.STICK);
        for (String row : pattern) b.pattern(row);
        b.unlockedBy(getHasName(material), has(material)).save(output, key(getItemName(result)));
    }

    private void armor(ItemLike result, ItemLike material, String... pattern) {
        var b = shaped(RecipeCategory.COMBAT, result).define('X', material);
        for (String row : pattern) b.pattern(row);
        b.unlockedBy(getHasName(material), has(material)).save(output, key(getItemName(result)));
    }

    public static final class Runner extends RecipeProvider.Runner {
        public Runner(PackOutput output, CompletableFuture<HolderLookup.Provider> lookup) {
            super(output, lookup);
        }

        @Override
        protected RecipeProvider createRecipeProvider(HolderLookup.Provider registries, RecipeOutput output) {
            return new ModRecipeProvider(registries, output);
        }

        @Override
        public String getName() {
            return "SpireCraft Recipes";
        }
    }
}
