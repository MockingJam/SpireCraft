package com.mockingjam.spirecraft.worldgen;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.block.ThinBlock;
import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.ResourceKey;
import net.minecraft.tags.BlockTags;
import net.minecraft.util.RandomSource;
import net.minecraft.world.level.WorldGenLevel;
import net.minecraft.world.level.biome.Biome;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.SlabBlock;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.properties.BlockStateProperties;
import net.minecraft.world.level.block.state.properties.SlabType;
import net.minecraft.world.level.levelgen.Heightmap;
import net.minecraft.world.level.levelgen.feature.Feature;
import net.minecraft.world.level.levelgen.feature.FeaturePlaceContext;
import net.minecraft.world.level.levelgen.feature.configurations.FeatureConfiguration;
import net.minecraft.world.level.levelgen.feature.configurations.NoneFeatureConfiguration;
import net.minecraft.world.level.levelgen.feature.stateproviders.BlockStateProvider;
import net.minecraft.world.level.material.Fluids;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

/** Small hand-written world features for the phase 7 biomes (configured/placed in BiomeData). */
public final class ModFeatures {
    public static final DeferredRegister<Feature<?>> FEATURES = DeferredRegister.create(ForgeRegistries.FEATURES, SpireCraft.MODID);

    public static final RegistryObject<Feature<SurfaceConfig>> BIOME_SURFACE = FEATURES.register("biome_surface", () -> new BiomeSurface(SurfaceConfig.CODEC));
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> RUIN_PILLAR = FEATURES.register("ruin_pillar", () -> new RuinPillar(NoneFeatureConfiguration.CODEC));
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> HANGING_GLOWVINES = FEATURES.register("hanging_glowvines", () -> new HangingGlowvines(NoneFeatureConfiguration.CODEC));
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> DOCK_WALL = FEATURES.register("dock_wall", () -> new DockWall(NoneFeatureConfiguration.CODEC));

    private ModFeatures() {}

    /**
     * Re-surfaces the columns of the origin chunk that lie in {@code biome}: top block, then {@code depth} under-blocks.
     * With {@code rock} (the dark harbours, v2.3) bare stone and gravel at the surface are covered too, so the ground is
     * never stone - only rock features standing on it are.
     */
    public record SurfaceConfig(ResourceKey<Biome> biome, BlockStateProvider top, BlockStateProvider under, int depth, boolean rock) implements FeatureConfiguration {
        public SurfaceConfig(ResourceKey<Biome> biome, BlockStateProvider top, BlockStateProvider under, int depth) {
            this(biome, top, under, depth, false);
        }

        public static final Codec<SurfaceConfig> CODEC = RecordCodecBuilder.create(i -> i.group(
                ResourceKey.codec(Registries.BIOME).fieldOf("biome").forGetter(SurfaceConfig::biome),
                BlockStateProvider.CODEC.fieldOf("top").forGetter(SurfaceConfig::top),
                BlockStateProvider.CODEC.fieldOf("under").forGetter(SurfaceConfig::under),
                Codec.intRange(0, 8).fieldOf("depth").forGetter(SurfaceConfig::depth),
                Codec.BOOL.optionalFieldOf("rock", false).forGetter(SurfaceConfig::rock)).apply(i, SurfaceConfig::new));
    }

    private static boolean soil(BlockState s) {
        return s.is(BlockTags.DIRT) || s.is(BlockTags.SAND) || s.is(Blocks.GRAVEL) || s.is(Blocks.CLAY);
    }

    private static boolean rock(BlockState s) {
        return s.is(BlockTags.BASE_STONE_OVERWORLD) || s.is(Blocks.GRAVEL) || s.is(Blocks.COBBLESTONE) || s.is(Blocks.MOSSY_COBBLESTONE);
    }

    static final class BiomeSurface extends Feature<SurfaceConfig> {
        BiomeSurface(Codec<SurfaceConfig> codec) {
            super(codec);
        }

        @Override
        public boolean place(FeaturePlaceContext<SurfaceConfig> ctx) {
            WorldGenLevel level = ctx.level();
            SurfaceConfig cfg = ctx.config();
            RandomSource random = ctx.random();
            int x0 = ctx.origin().getX() & ~15, z0 = ctx.origin().getZ() & ~15;
            boolean any = false;
            BlockPos.MutableBlockPos pos = new BlockPos.MutableBlockPos();
            for (int dx = 0; dx < 16; dx++) {
                for (int dz = 0; dz < 16; dz++) {
                    int x = x0 + dx, z = z0 + dz;
                    int y = level.getHeight(Heightmap.Types.OCEAN_FLOOR_WG, x, z) - 1;
                    pos.set(x, y, z);
                    if (!level.getBiome(pos).is(cfg.biome())) continue;
                    BlockState top = level.getBlockState(pos);
                    if (!soil(top) && !(cfg.rock() && rock(top))) continue;
                    BlockState topState = cfg.top().getState(random, pos);
                    // Flagstones only make sense in open air; under water keep the under-block
                    if (!level.getFluidState(pos.above()).isEmpty() && !topState.isCollisionShapeFullBlock(level, pos)) {
                        topState = cfg.under().getState(random, pos);
                    }
                    level.setBlock(pos, topState, 2);
                    for (int i = 1; i <= cfg.depth(); i++) {
                        pos.setY(y - i);
                        BlockState below = level.getBlockState(pos);
                        if (!soil(below) && !(cfg.rock() && rock(below))) break;
                        level.setBlock(pos, cfg.under().getState(random, pos), 2);
                    }
                    any = true;
                }
            }
            return any;
        }
    }

    /** A 2–5 block column of ruin stone bricks (some cracked, mossy top), a fallen block or two beside it. */
    static final class RuinPillar extends Feature<NoneFeatureConfiguration> {
        RuinPillar(Codec<NoneFeatureConfiguration> codec) {
            super(codec);
        }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            BlockPos base = ctx.origin();
            if (!level.getBlockState(base.below()).isFaceSturdy(level, base.below(), Direction.UP) || !level.isEmptyBlock(base)) return false;
            int h = 2 + r.nextInt(4);
            for (int i = 0; i < h; i++) {
                BlockState s = (i == 0 && r.nextBoolean()) ? ModBlocks.CHISELED_RUIN_STONE_BRICKS.get().defaultBlockState()
                        : r.nextFloat() < 0.3F ? ModBlocks.CRACKED_RUIN_STONE_BRICKS.get().defaultBlockState()
                        : ModBlocks.RUIN_STONE_BRICKS.base.get().defaultBlockState();
                level.setBlock(base.above(i), s, 2);
            }
            if (r.nextBoolean()) level.setBlock(base.above(h), ModBlocks.RUIN_STONE_BRICKS.slab.get().defaultBlockState(), 2);
            for (int n = r.nextInt(3); n > 0; n--) {
                BlockPos side = base.relative(Direction.Plane.HORIZONTAL.getRandomDirection(r), 1 + r.nextInt(2));
                side = level.getHeightmapPos(Heightmap.Types.WORLD_SURFACE_WG, side);
                if (level.getBlockState(side.below()).isFaceSturdy(level, side.below(), Direction.UP) && level.isEmptyBlock(side)) {
                    level.setBlock(side, (r.nextBoolean() ? ModBlocks.RUIN_STONE.base : ModBlocks.RUIN_STONE_BRICKS.base).get().defaultBlockState(), 2);
                }
            }
            return true;
        }
    }

    /** Hangs glowvines (2–6 long) under leaves near the origin. */
    static final class HangingGlowvines extends Feature<NoneFeatureConfiguration> {
        HangingGlowvines(Codec<NoneFeatureConfiguration> codec) {
            super(codec);
        }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            boolean any = false;
            for (int attempt = 0; attempt < 24; attempt++) {
                BlockPos p = ctx.origin().offset(r.nextInt(9) - 4, r.nextInt(10), r.nextInt(9) - 4);
                if (!level.getBlockState(p).is(BlockTags.LEAVES) || !level.isEmptyBlock(p.below())) continue;
                int len = 2 + r.nextInt(5);
                BlockPos q = p.below();
                for (int i = 0; i < len && level.isEmptyBlock(q) && level.isEmptyBlock(q.below()); i++, q = q.below()) {
                    level.setBlock(q, ModBlocks.GLOWVINE_PLANT.get().defaultBlockState(), 2);
                }
                level.setBlock(q, ModBlocks.GLOWVINE.get().defaultBlockState().setValue(BlockStateProperties.AGE_25, 25), 2);
                any = true;
            }
            return any;
        }
    }


    /** A ruined stretch of dock brick wall, 3–6 long and 1–3 high, with a gap or two. */
    static final class DockWall extends Feature<NoneFeatureConfiguration> {
        DockWall(Codec<NoneFeatureConfiguration> codec) {
            super(codec);
        }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            Direction dir = Direction.Plane.HORIZONTAL.getRandomDirection(r);
            int len = 3 + r.nextInt(4);
            boolean any = false;
            for (int i = 0; i < len; i++) {
                BlockPos p = level.getHeightmapPos(Heightmap.Types.OCEAN_FLOOR_WG, ctx.origin().relative(dir, i));
                if (!level.getBlockState(p.below()).isFaceSturdy(level, p.below(), Direction.UP)) continue;
                int h = 1 + r.nextInt(3);
                for (int y = 0; y < h; y++) {
                    BlockState s = (r.nextFloat() < 0.35F ? ModBlocks.CRACKED_DOCK_BRICKS : ModBlocks.DOCK_BRICKS.base).get().defaultBlockState();
                    setIfOpen(level, p.above(y), s);
                }
                any = true;
            }
            return any;
        }
    }

    private static boolean open(WorldGenLevel level, BlockPos p) {
        BlockState s = level.getBlockState(p);
        return s.isAir() || s.canBeReplaced();
    }

    private static void setIfOpen(WorldGenLevel level, BlockPos p, BlockState s) {
        if (open(level, p)) level.setBlock(p, s, 2);
    }
}
