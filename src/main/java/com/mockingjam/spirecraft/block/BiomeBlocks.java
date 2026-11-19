package com.mockingjam.spirecraft.block;

import static com.mockingjam.spirecraft.registry.ModBlocks.*;

import java.util.ArrayList;
import java.util.List;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.FireBlock;
import net.minecraftforge.registries.RegistryObject;

/** Groupings of the phase 7 biome blocks, shared by setup, datagen, the creative tab and the self-test. */
public final class BiomeBlocks {
    private BiomeBlocks() {}

    public static List<WoodSet> woods() {
        return List.of(GNARLWOOD, HIVESHROOM, ROTTEN);
    }

    public static List<StoneSet> stones() {
        return List.of(RUIN_STONE, RUIN_STONE_BRICKS, DOCK_BRICKS, HARBOUR_ROCK, POLISHED_HARBOUR_ROCK, INK_STAINED_STONE, HIVE_ROCK, DEEP_HIVE_ROCK, POLISHED_HIVE_ROCK, HIVE_ROCK_BRICKS, HIVE_SOIL_BRICKS);
    }

    /** Every phase 7 block that has an item, in creative-tab order (grouped by biome). */
    public static List<RegistryObject<Block>> tabOrder() {
        List<RegistryObject<Block>> out = new ArrayList<>();
        out.addAll(GNARLWOOD.all());
        out.addAll(RUIN_STONE.all());
        out.addAll(RUIN_STONE_BRICKS.all());
        out.addAll(List.of(CRACKED_RUIN_STONE_BRICKS, CHISELED_RUIN_STONE_BRICKS, PAVING_STONES, GLOWVINE, FOGCAP, FOGCAP_BLOCK, SPIRE_FERN));
        out.addAll(DOCK_BRICKS.all());
        out.add(CRACKED_DOCK_BRICKS);
        out.addAll(HARBOUR_ROCK.all());
        out.addAll(POLISHED_HARBOUR_ROCK.all());
        out.addAll(List.of(BARNACLES, SLUDGE, DARK_SAND));
        out.addAll(HIVESHROOM.all());
        out.add(HIVE_SOIL);
        out.addAll(List.of(HIVE_EGG, HIVE_MYCELIUM_LAYER, MYCELIUM_THREAD, BUG_CARCASS, BYRDONIS_EGG, JUNK_BLOCK));
        // biomes v2
        out.addAll(ROTTEN.all());
        out.addAll(List.of(REED, ROTTEN_SHRUB, POLLUTED_CORAL_BLOCK, POLLUTED_TUBE_CORAL, POLLUTED_HORN_CORAL, POLLUTED_CORAL_FAN,
                POLLUTED_SEAGRASS, POLLUTED_KELP, LANTERN_CAP, CORAL_CAP, BLUEBELL_CAP, SHELF_FUNGUS, GLOW_SHRUB, GLOW_MOSS_CARPET,
                LANTERN_CAP_BLOCK, CORAL_CAP_BLOCK, BLUEBELL_CAP_BLOCK));
        out.addAll(INK_STAINED_STONE.all());
        out.addAll(List.of(INK_VENT, CRACKED_INK_STONE));
        out.addAll(DEEP_HIVE_ROCK.all());
        out.addAll(CaveOres.allOres());
        out.addAll(HIVE_ROCK.all());
        out.addAll(POLISHED_HIVE_ROCK.all());
        out.addAll(HIVE_ROCK_BRICKS.all());
        out.addAll(List.of(CRACKED_HIVE_ROCK_BRICKS, CHISELED_HIVE_ROCK_BRICKS, PACKED_HIVE_SOIL));
        out.addAll(HIVE_SOIL_BRICKS.all());
        out.addAll(List.of(WEBBED_HIVE_SOIL, SILK_HIVE, TWIG_NEST, THATCH, THATCH_STAIRS, THATCH_SLAB));
        out.addAll(List.of(HIVE_COMB, HIVE_CACHE, HIVE_SHROOM, HIVE_SHROOM_BLOCK, HIVE_MYCELIUM, QUICKSAND));
        return out;
    }

    /** Flammability like the vanilla equivalents (FireBlock.bootStrap). */
    public static void commonSetup() {
        FireBlock fire = (FireBlock) Blocks.FIRE;
        for (WoodSet w : woods()) {
            for (var b : List.of(w.planks, w.slab, w.stairs, w.fence, w.fenceGate)) fire.setFlammable(b.get(), 5, 20);
            for (var b : w.logs()) fire.setFlammable(b.get(), 5, 5);
            if (w.hasTree) fire.setFlammable(w.leaves.get(), 30, 60);
        }
        fire.setFlammable(SPIRE_FERN.get(), 60, 100);
        fire.setFlammable(GLOWVINE.get(), 15, 60);
        fire.setFlammable(GLOWVINE_PLANT.get(), 15, 60);
        for (var b : List.of(REED, ROTTEN_SHRUB, GLOW_SHRUB, GLOW_MOSS_CARPET)) fire.setFlammable(b.get(), 60, 100);
        for (var b : List.of(THATCH, THATCH_STAIRS, THATCH_SLAB, TWIG_NEST)) fire.setFlammable(b.get(), 60, 20);
    }
}
