package com.mockingjam.spirecraft.datagen;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.block.BiomeBlocks;
import com.mockingjam.spirecraft.block.StoneSet;
import com.mockingjam.spirecraft.block.WoodSet;
import com.mockingjam.spirecraft.registry.ModBlocks;
import java.util.concurrent.CompletableFuture;
import net.minecraft.core.HolderLookup;
import net.minecraft.data.PackOutput;
import net.minecraft.tags.BlockTags;
import net.minecraftforge.common.Tags;
import net.minecraftforge.common.data.BlockTagsProvider;
import net.minecraftforge.common.data.ExistingFileHelper;
import org.jetbrains.annotations.Nullable;

/** Block tags: mineable/pickaxe, needed tool tier, infiniburn, common ore tags. */
public class ModBlockTagsProvider extends BlockTagsProvider {
    public ModBlockTagsProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookup, @Nullable ExistingFileHelper existing) {
        super(output, lookup, SpireCraft.MODID, existing);
    }

    @Override
    protected void addTags(HolderLookup.Provider provider) {
        tag(BlockTags.MINEABLE_WITH_PICKAXE).add(
                ModBlocks.WOLFRAMITE_ORE.get(), ModBlocks.DEEPSLATE_WOLFRAMITE_ORE.get(), ModBlocks.TUNGSTEN_ALLOY_BLOCK.get(),
                ModBlocks.ORICHALCUM_ORE.get(), ModBlocks.ORICHALCUM_BLOCK.get(),
                ModBlocks.NETHER_BRIMSTONE_ORE.get(), ModBlocks.BRIMSTONE_BLOCK.get(), ModBlocks.LAVA_ROCK_ORE.get());
        tag(BlockTags.NEEDS_IRON_TOOL).add(
                ModBlocks.WOLFRAMITE_ORE.get(), ModBlocks.DEEPSLATE_WOLFRAMITE_ORE.get(), ModBlocks.TUNGSTEN_ALLOY_BLOCK.get(),
                ModBlocks.ORICHALCUM_ORE.get(), ModBlocks.ORICHALCUM_BLOCK.get(), ModBlocks.LAVA_ROCK_ORE.get());
        // Brimstone ore/block need only a wooden pickaxe, like nether quartz ore.

        // Lit brimstone blocks burn forever, in every dimension.
        tag(BlockTags.INFINIBURN_OVERWORLD).add(ModBlocks.BRIMSTONE_BLOCK.get());
        tag(BlockTags.INFINIBURN_NETHER).add(ModBlocks.BRIMSTONE_BLOCK.get());
        tag(BlockTags.INFINIBURN_END).add(ModBlocks.BRIMSTONE_BLOCK.get());

        // ---- Phase 7 biome blocks: the vanilla tags of their vanilla counterparts ----
        for (WoodSet w : BiomeBlocks.woods()) {
            for (var b : w.logs()) tag(w.logsBlockTag).add(b.get());
            tag(BlockTags.LOGS_THAT_BURN).addTag(w.logsBlockTag);
            tag(BlockTags.OVERWORLD_NATURAL_LOGS).add(w.log.get());
            tag(BlockTags.COMPLETES_FIND_TREE_TUTORIAL).addTag(w.logsBlockTag);
            tag(BlockTags.PLANKS).add(w.planks.get());
            tag(BlockTags.WOODEN_SLABS).add(w.slab.get());
            tag(BlockTags.WOODEN_STAIRS).add(w.stairs.get());
            tag(BlockTags.WOODEN_FENCES).add(w.fence.get());
            tag(BlockTags.FENCE_GATES).add(w.fenceGate.get());
            tag(BlockTags.WOODEN_DOORS).add(w.door.get());
            tag(BlockTags.WOODEN_TRAPDOORS).add(w.trapdoor.get());
            tag(BlockTags.WOODEN_BUTTONS).add(w.button.get());
            tag(BlockTags.WOODEN_PRESSURE_PLATES).add(w.pressurePlate.get());
            if (w.hasTree) {
                tag(BlockTags.LEAVES).add(w.leaves.get());
                tag(BlockTags.SAPLINGS).add(w.sapling.get());
            }
        }
        for (StoneSet set : BiomeBlocks.stones()) {
            tag(BlockTags.MINEABLE_WITH_PICKAXE).add(set.base.get(), set.stairs.get(), set.slab.get(), set.wall.get());
            tag(BlockTags.STAIRS).add(set.stairs.get());
            tag(BlockTags.SLABS).add(set.slab.get());
            tag(BlockTags.WALLS).add(set.wall.get());
        }
        tag(BlockTags.MINEABLE_WITH_PICKAXE).add(ModBlocks.CRACKED_RUIN_STONE_BRICKS.get(), ModBlocks.CHISELED_RUIN_STONE_BRICKS.get(),
                ModBlocks.PAVING_STONES.get(), ModBlocks.CRACKED_DOCK_BRICKS.get(), ModBlocks.JUNK_BLOCK.get());
        tag(BlockTags.MINEABLE_WITH_AXE).add(ModBlocks.FOGCAP_BLOCK.get());
        tag(BlockTags.MINEABLE_WITH_SHOVEL).add(ModBlocks.SLUDGE.get(), ModBlocks.HIVE_SOIL.get());
        // ---- Biomes v2 ----
        tag(BlockTags.MINEABLE_WITH_PICKAXE).add(ModBlocks.POLLUTED_CORAL_BLOCK.get(), ModBlocks.POLLUTED_TUBE_CORAL.get(), ModBlocks.POLLUTED_HORN_CORAL.get(),
                ModBlocks.POLLUTED_CORAL_FAN.get(), ModBlocks.POLLUTED_CORAL_WALL_FAN.get(), ModBlocks.HIVE_COMB.get(), ModBlocks.HIVE_CACHE.get());
        tag(BlockTags.MINEABLE_WITH_AXE).add(ModBlocks.LANTERN_CAP_BLOCK.get(), ModBlocks.CORAL_CAP_BLOCK.get(), ModBlocks.BLUEBELL_CAP_BLOCK.get(), ModBlocks.HIVE_SHROOM_BLOCK.get(),
                ModBlocks.SHELF_FUNGUS.get());
        tag(BlockTags.MINEABLE_WITH_SHOVEL).add(ModBlocks.QUICKSAND.get());
        tag(BlockTags.SWORD_EFFICIENT).add(ModBlocks.SILK_HIVE.get());
        tag(BlockTags.MINEABLE_WITH_HOE).add(ModBlocks.SILK_HIVE.get(), ModBlocks.THATCH.get(), ModBlocks.THATCH_STAIRS.get(), ModBlocks.THATCH_SLAB.get());
        tag(BlockTags.MINEABLE_WITH_AXE).add(ModBlocks.TWIG_NEST.get());
        tag(BlockTags.MINEABLE_WITH_PICKAXE).add(ModBlocks.AUTOMATON_ALLOY_BLOCK.get(), ModBlocks.TARNISHED_AUTOMATON_ALLOY_BLOCK.get(), ModBlocks.DERELICT_AUTOMATON_ALLOY_BLOCK.get(),
                ModBlocks.CORE_CRYSTAL_BLOCK.get(), ModBlocks.CRACKED_CORE_CRYSTAL_BLOCK.get());
        tag(BlockTags.NEEDS_STONE_TOOL).add(ModBlocks.AUTOMATON_ALLOY_BLOCK.get(), ModBlocks.TARNISHED_AUTOMATON_ALLOY_BLOCK.get(), ModBlocks.DERELICT_AUTOMATON_ALLOY_BLOCK.get());
        tag(BlockTags.MINEABLE_WITH_SHOVEL).add(ModBlocks.WEBBED_HIVE_SOIL.get());
        // issue #36: the Regent's crater
        tag(BlockTags.MINEABLE_WITH_SHOVEL).add(ModBlocks.ORANGE_DOUGH.get());
        tag(BlockTags.MINEABLE_WITH_PICKAXE).add(ModBlocks.POLISHED_AUTOMATON_ALLOY.get(), ModBlocks.AUTOMATON_ALLOY_LAMP.get(), ModBlocks.POLISHED_ORANGE_DOUGH.get(), ModBlocks.ORANGE_DOUGH_BRICKS.get());
        tag(BlockTags.NEEDS_STONE_TOOL).add(ModBlocks.POLISHED_AUTOMATON_ALLOY.get());
        tag(BlockTags.MINEABLE_WITH_PICKAXE).add(ModBlocks.HARBOUR_ROCK_SPIRE.get());
        tag(BlockTags.MINEABLE_WITH_PICKAXE).add(ModBlocks.PACKED_HIVE_SOIL.get(), ModBlocks.CRACKED_HIVE_ROCK_BRICKS.get(), ModBlocks.CHISELED_HIVE_ROCK_BRICKS.get());
        tag(BlockTags.STAIRS).add(ModBlocks.THATCH_STAIRS.get());
        tag(BlockTags.SLABS).add(ModBlocks.THATCH_SLAB.get());
        tag(BlockTags.MINEABLE_WITH_HOE).add(ModBlocks.GLOW_MOSS_CARPET.get());
        tag(BlockTags.MINEABLE_WITH_SHOVEL).add(ModBlocks.DARK_SAND.get());
        tag(BlockTags.SAND).add(ModBlocks.DARK_SAND.get());
        tag(BlockTags.MINEABLE_WITH_PICKAXE).add(ModBlocks.INK_VENT.get(), ModBlocks.CRACKED_INK_STONE.get());
        tag(BlockTags.MINEABLE_WITH_HOE).add(ModBlocks.BARNACLES.get(), ModBlocks.HIVE_MYCELIUM_LAYER.get(), ModBlocks.MYCELIUM_THREAD.get());
        tag(BlockTags.MINEABLE_WITH_PICKAXE).add(ModBlocks.BUG_CARCASS.get());
        tag(BlockTags.MINEABLE_WITH_SHOVEL).add(ModBlocks.HIVE_MYCELIUM.get());
        tag(BlockTags.DIRT).add(ModBlocks.HIVE_MYCELIUM.get());
        // the cave stones' ores: tool tiers and ore tags like the vanilla ore each replaces
        for (var e : com.mockingjam.spirecraft.block.CaveOres.kinds().entrySet()) {
            net.minecraft.world.level.block.Block b = e.getKey();
            tag(BlockTags.MINEABLE_WITH_PICKAXE).add(b);
            tag(Tags.Blocks.ORES).add(b);
            switch (e.getValue()) {
                case IRON, COPPER, LAPIS -> tag(BlockTags.NEEDS_STONE_TOOL).add(b);
                case GOLD, REDSTONE, DIAMOND, EMERALD, WOLFRAMITE, ORICHALCUM -> tag(BlockTags.NEEDS_IRON_TOOL).add(b);
                default -> { }
            }
            switch (e.getValue()) {
                case COAL -> tag(BlockTags.COAL_ORES).add(b);
                case IRON -> tag(BlockTags.IRON_ORES).add(b);
                case COPPER -> tag(BlockTags.COPPER_ORES).add(b);
                case GOLD -> tag(BlockTags.GOLD_ORES).add(b);
                case REDSTONE -> tag(BlockTags.REDSTONE_ORES).add(b);
                case LAPIS -> tag(BlockTags.LAPIS_ORES).add(b);
                case DIAMOND -> tag(BlockTags.DIAMOND_ORES).add(b);
                case EMERALD -> tag(BlockTags.EMERALD_ORES).add(b);
                default -> { }
            }
        }
        tag(BlockTags.CORAL_PLANTS).add(ModBlocks.POLLUTED_TUBE_CORAL.get(), ModBlocks.POLLUTED_HORN_CORAL.get());
        tag(BlockTags.SMALL_FLOWERS).add(ModBlocks.GLOW_SHRUB.get());
        tag(BlockTags.SWORD_EFFICIENT).add(ModBlocks.REED.get(), ModBlocks.ROTTEN_SHRUB.get(), ModBlocks.GLOW_SHRUB.get());
        tag(BlockTags.DIRT).add(ModBlocks.HIVE_SOIL.get());   // grass, saplings and trees grow on it
        tag(BlockTags.CLIMBABLE).add(ModBlocks.GLOWVINE.get(), ModBlocks.GLOWVINE_PLANT.get());
        tag(BlockTags.REPLACEABLE_BY_TREES).add(ModBlocks.SPIRE_FERN.get(), ModBlocks.GLOWVINE.get(), ModBlocks.GLOWVINE_PLANT.get());
        tag(BlockTags.SWORD_EFFICIENT).add(ModBlocks.SPIRE_FERN.get(), ModBlocks.GLOWVINE.get(), ModBlocks.GLOWVINE_PLANT.get());
        tag(BlockTags.ENDERMAN_HOLDABLE).add(ModBlocks.FOGCAP.get(), ModBlocks.HIVE_SOIL.get());

        tag(Tags.Blocks.ORES).add(
                ModBlocks.WOLFRAMITE_ORE.get(), ModBlocks.DEEPSLATE_WOLFRAMITE_ORE.get(), ModBlocks.ORICHALCUM_ORE.get(),
                ModBlocks.NETHER_BRIMSTONE_ORE.get(), ModBlocks.LAVA_ROCK_ORE.get());
    }
}
