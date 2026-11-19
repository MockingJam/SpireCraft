package com.mockingjam.spirecraft.block;

import com.mockingjam.spirecraft.registry.ModBlocks;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import net.minecraft.util.valueproviders.ConstantInt;
import net.minecraft.util.valueproviders.IntProvider;
import net.minecraft.util.valueproviders.UniformInt;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.DropExperienceBlock;
import net.minecraft.world.level.block.SoundType;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.minecraft.world.level.block.state.properties.NoteBlockInstrument;
import net.minecraft.world.level.material.MapColor;
import net.minecraftforge.registries.RegistryObject;

/**
 * Ores of the cave biomes' own stones (user: the cave walls need ores of their stone): every vanilla ore (and the mod's
 * wolframite / orichalcum) generated in a hive cave is swapped for the variant of the stone it sits in - hive rock /
 * deep hive rock - and in the quicksand caves for its sandstone variant (any depth). The ink spring caves keep vanilla
 * stone and ores (v2.3, user); only the rock around the ink pools darkens, and it holds no ores. Drops, XP, hardness and
 * tool tiers follow the vanilla stone / deepslate ore they replace (see the loot and tag providers).
 */
public final class CaveOres {
    /** An ore kind: its vanilla (or mod) stone and deepslate ores, and the XP its block drops. */
    public enum Kind {
        COAL("coal", ConstantInt.of(0), true), IRON("iron", ConstantInt.of(0), true), COPPER("copper", ConstantInt.of(0), true),
        GOLD("gold", ConstantInt.of(0), true), REDSTONE("redstone", UniformInt.of(1, 5), true), LAPIS("lapis", UniformInt.of(2, 5), true),
        DIAMOND("diamond", UniformInt.of(3, 7), true), EMERALD("emerald", UniformInt.of(3, 7), true),
        WOLFRAMITE("wolframite", ConstantInt.of(0), true), ORICHALCUM("orichalcum", ConstantInt.of(0), false);

        public final String id;
        public final IntProvider xp;
        /** Also found in the shallow (non-deepslate) stone. Orichalcum is deepslate-only, like its vanilla-style ore. */
        public final boolean shallow;

        Kind(String id, IntProvider xp, boolean shallow) {
            this.id = id;
            this.xp = xp;
            this.shallow = shallow;
        }

        public Block stoneOre() {
            return switch (this) {
                case COAL -> Blocks.COAL_ORE; case IRON -> Blocks.IRON_ORE; case COPPER -> Blocks.COPPER_ORE; case GOLD -> Blocks.GOLD_ORE;
                case REDSTONE -> Blocks.REDSTONE_ORE; case LAPIS -> Blocks.LAPIS_ORE; case DIAMOND -> Blocks.DIAMOND_ORE;
                case EMERALD -> Blocks.EMERALD_ORE; case WOLFRAMITE -> ModBlocks.WOLFRAMITE_ORE.get(); case ORICHALCUM -> null;
            };
        }

        public Block deepslateOre() {
            return switch (this) {
                case COAL -> Blocks.DEEPSLATE_COAL_ORE; case IRON -> Blocks.DEEPSLATE_IRON_ORE; case COPPER -> Blocks.DEEPSLATE_COPPER_ORE;
                case GOLD -> Blocks.DEEPSLATE_GOLD_ORE; case REDSTONE -> Blocks.DEEPSLATE_REDSTONE_ORE; case LAPIS -> Blocks.DEEPSLATE_LAPIS_ORE;
                case DIAMOND -> Blocks.DEEPSLATE_DIAMOND_ORE; case EMERALD -> Blocks.DEEPSLATE_EMERALD_ORE;
                case WOLFRAMITE -> ModBlocks.DEEPSLATE_WOLFRAMITE_ORE.get(); case ORICHALCUM -> ModBlocks.ORICHALCUM_ORE.get();
            };
        }
    }

    /** A cave stone with its ores. */
    public static final class Family {
        public final String name;
        public final boolean deep;
        public final Supplier<Block> stone;
        public final Map<Kind, RegistryObject<Block>> ores = new EnumMap<>(Kind.class);
        /** Replaces both the stone and the deepslate ores (the quicksand caves are sandstone all the way down). */
        public final boolean anyDepth;

        Family(String name, boolean deep, Supplier<Block> stone, MapColor color) {
            this(name, deep, false, stone, color);
        }

        Family(String name, boolean deep, boolean anyDepth, Supplier<Block> stone, MapColor color) {
            this.name = name;
            this.deep = deep;
            this.anyDepth = anyDepth;
            this.stone = stone;
            for (Kind kind : Kind.values()) {
                if (!deep && !anyDepth && !kind.shallow) continue;
                BlockBehaviour.Properties props = BlockBehaviour.Properties.of().mapColor(color).instrument(NoteBlockInstrument.BASEDRUM)
                        .requiresCorrectToolForDrops().strength(deep ? 4.5F : 3.0F, 3.0F).sound(deep ? SoundType.DEEPSLATE : SoundType.TUFF);
                ores.put(kind, ModBlocks.register(name + "_" + kind.id + "_ore", p -> new DropExperienceBlock(kind.xp, p), props));
            }
        }

        /** The block that should replace {@code vanilla} in this family's stone, or null if it is not one of its ores. */
        public Block swap(Block vanilla) {
            for (var e : ores.entrySet()) {
                if (anyDepth ? e.getKey().stoneOre() == vanilla || e.getKey().deepslateOre() == vanilla
                        : (deep ? e.getKey().deepslateOre() : e.getKey().stoneOre()) == vanilla) return e.getValue().get();
            }
            return null;
        }
    }

    public static final Family HIVE = new Family("hive_rock", false, () -> ModBlocks.HIVE_ROCK.base.get(), MapColor.TERRACOTTA_ORANGE);
    public static final Family DEEP_HIVE = new Family("deep_hive_rock", true, () -> ModBlocks.DEEP_HIVE_ROCK.base.get(), MapColor.TERRACOTTA_BROWN);
    public static final List<Family> ALL = List.of(HIVE, DEEP_HIVE);

    private CaveOres() {}

    public static List<RegistryObject<Block>> allOres() {
        List<RegistryObject<Block>> out = new ArrayList<>();
        for (Family f : ALL) out.addAll(f.ores.values());
        return out;
    }

    /** For datagen: the kind of an ore block of ours. */
    public static Map<Block, Kind> kinds() {
        Map<Block, Kind> out = new HashMap<>();
        for (Family f : ALL) for (var e : f.ores.entrySet()) out.put(e.getValue().get(), e.getKey());
        return out;
    }

    public static void init() {
    }
}
