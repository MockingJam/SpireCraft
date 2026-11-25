package com.mockingjam.spirecraft.worldgen;

import com.mockingjam.spirecraft.fluid.ModFluids;
import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import java.util.List;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.ResourceKey;
import net.minecraft.tags.BlockTags;
import net.minecraft.util.RandomSource;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.level.WorldGenLevel;
import net.minecraft.world.level.biome.Biome;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.HorizontalDirectionalBlock;
import net.minecraft.world.level.block.LeavesBlock;
import net.minecraft.world.level.block.RotatedPillarBlock;
import net.minecraft.world.level.block.VineBlock;
import net.minecraft.world.level.block.entity.SpawnerBlockEntity;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.properties.BlockStateProperties;
import net.minecraft.world.level.levelgen.Heightmap;
import net.minecraft.world.level.levelgen.feature.Feature;
import net.minecraft.world.level.levelgen.feature.FeaturePlaceContext;
import net.minecraft.world.level.levelgen.feature.configurations.FeatureConfiguration;
import net.minecraft.world.level.levelgen.feature.configurations.NoneFeatureConfiguration;
import net.minecraft.world.level.levelgen.feature.stateproviders.BlockStateProvider;
import net.minecraft.world.level.material.Fluids;
import net.minecraftforge.registries.RegistryObject;

/** Hand-written world features of the v2 biomes (docs/design/biomes_v2.md); configured and placed in BiomeData. */
public final class V2Features {
    private V2Features() {}

    private static RegistryObject<Feature<NoneFeatureConfiguration>> none(String name, java.util.function.Function<Codec<NoneFeatureConfiguration>, Feature<NoneFeatureConfiguration>> f) {
        return ModFeatures.FEATURES.register(name, () -> f.apply(NoneFeatureConfiguration.CODEC));
    }

    public static final RegistryObject<Feature<NoneFeatureConfiguration>> STONE_SPIKE = none("stone_spike", StoneSpike::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> PUDDLE = none("puddle", Puddle::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> FALLEN_LOG = none("fallen_rotten_log", FallenLog::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> ROTTEN_STUMP = none("rotten_stump", RottenStump::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> STONE_PILE = none("stone_pile", StonePile::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> POLLUTED_REEF = none("polluted_reef", PollutedReef::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> TALL_GNARLWOOD = none("tall_gnarlwood", TallGnarlwood::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> GIANT_LANTERN_CAP = none("giant_lantern_cap", GiantLanternCap::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> GIANT_CORAL_CAP = none("giant_coral_cap", GiantCoralCap::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> GIANT_BLUEBELL = none("giant_bluebell", GiantBluebell::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> GIANT_HIVE_SHROOM = none("giant_hive_shroom", GiantHiveShroom::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> SHROOM_GROVE = none("shroom_grove", ShroomGrove::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> MYCELIUM_PATCHES = none("mycelium_patches", MyceliumPatches::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> INK_POOL = none("ink_pool", InkPool::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> HIVE_NEST = none("hive_nest", HiveNest::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> EGG_CLUTCH = none("egg_clutch", EggClutch::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> DARK_RUINS = none("dark_ruins", DarkRuins::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> QUICKSAND_POOL = none("quicksand_pool", QuicksandPool::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> CLIFF_SPRING = none("cliff_spring", CliffSpring::new);
    public static final RegistryObject<Feature<NoneFeatureConfiguration>> SHORE_REEDS = none("shore_reeds", ShoreReeds::new);
    public static final RegistryObject<Feature<CaveStoneConfig>> CAVE_STONE = ModFeatures.FEATURES.register("cave_stone", () -> new CaveStone(CaveStoneConfig.CODEC));

    /** Touch the class during mod construction so the registrations above are queued. */
    public static void init() {
    }

    // ------------------------------------------------------------------ helpers
    private static boolean replaceable(WorldGenLevel level, BlockPos pos) {
        BlockState s = level.getBlockState(pos);
        return s.isAir() || s.canBeReplaced() || s.is(Blocks.WATER) && s.getFluidState().isSource() || s.is(BlockTags.LEAVES);
    }

    private static boolean solid(WorldGenLevel level, BlockPos pos) {
        return level.getBlockState(pos).isFaceSturdy(level, pos, Direction.UP);
    }

    private static void set(WorldGenLevel level, BlockPos pos, BlockState state) {
        level.setBlock(pos, state, 2);
    }

    // ------------------------------------------------------------------ dark harbours
    /**
     * Stone forest (石林) rock (v2.3/2.4, user: more varied; every cone narrow at the top, broad at the foot; spires at
     * random heights): barnacle-rock formations of four kinds - tall leaning pillars with small ledges, clusters of two or
     * three pillars of different heights, short broad cones, and low boulders - all with wavy, uneven outlines. Barnacle
     * spires point up from random open spots on the rock (tops, ledges, steps) and in small groups around the foot.
     */
    static final class StoneSpike extends Feature<NoneFeatureConfiguration> {
        StoneSpike(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            BlockPos base = ctx.origin();
            if (!solid(level, base.below())) return false;
            java.util.Set<BlockPos> rock = new java.util.LinkedHashSet<>();
            int kind = r.nextInt(10);
            if (kind < 4) {
                pillar(level, r, base, rock, 1.8F + r.nextFloat() * 1.4F, 10 + r.nextInt(12), false);
            } else if (kind < 6) {
                int n = 2 + r.nextInt(2);
                for (int i = 0; i < n; i++) {
                    BlockPos b = base.offset(r.nextInt(5) - 2, 0, r.nextInt(5) - 2);
                    pillar(level, r, b, rock, 1.1F + r.nextFloat() * 0.9F, 5 + r.nextInt(13), false);
                }
            } else if (kind < 8) {
                // a short, broad cone
                pillar(level, r, base, rock, 2.6F + r.nextFloat() * 1.2F, 6 + r.nextInt(6), false);
            } else {
                boulder(level, r, base, rock, 2.0F + r.nextFloat() * 1.8F, 3 + r.nextInt(3));
            }
            barnacles(level, r, rock);
            spires(level, r, rock);   // 2026-11-25 (user): the stone cones are back - the harbour rock spire
            return true;
        }

        /**
         * Barnacles (v2.8): a layer of the barnacles block on the open faces of the rock - patches thickest at the
         * waterline (where barnacles live), a few higher up.
         */
        /**
         * Harbour rock spires (2026-11-25): stacks of 1-4 (base / middle / frustum / tip) pointing up from open spots on
         * the rock - its top, ledges and steps - a few hanging down from overhangs, and small groups round the foot.
         */
        private static void spires(WorldGenLevel level, RandomSource r, java.util.Set<BlockPos> rock) {
            java.util.List<BlockPos> list = new java.util.ArrayList<>(rock);
            if (list.isEmpty()) return;
            int up = 4 + r.nextInt(6), down = r.nextInt(3);
            for (int i = 0; i < up * 3 && up > 0; i++) {
                BlockPos p = list.get(r.nextInt(list.size())).above();
                if (rock.contains(p) || !level.getBlockState(p).isAir() && !level.getBlockState(p).is(Blocks.WATER)) continue;
                if (spire(level, p, Direction.UP, 1 + r.nextInt(4))) up--;
            }
            for (int i = 0; i < down * 3 && down > 0; i++) {
                BlockPos p = list.get(r.nextInt(list.size())).below();
                if (rock.contains(p) || !level.getBlockState(p).isAir()) continue;
                if (spire(level, p, Direction.DOWN, 1 + r.nextInt(3))) down--;
            }
            // a few short ones on the ground round the foot
            BlockPos foot = list.get(0);
            for (int i = 0; i < 4; i++) {
                BlockPos g = level.getHeightmapPos(Heightmap.Types.OCEAN_FLOOR_WG, foot.offset(r.nextInt(9) - 4, 0, r.nextInt(9) - 4));
                if (!rock.contains(g) && level.getBlockState(g.below()).isFaceSturdy(level, g.below(), Direction.UP)) spire(level, g, Direction.UP, 1 + r.nextInt(2));
            }
        }

        /** One spire of length n from p in dir, thickest at the root; returns whether it was placed. */
        private static boolean spire(WorldGenLevel level, BlockPos p, Direction dir, int n) {
            BlockPos root = p.relative(dir.getOpposite());
            if (!level.getBlockState(root).isFaceSturdy(level, root, dir)) return false;
            int len = 0;
            for (int k = 0; k < n; k++) { BlockState s = level.getBlockState(p.relative(dir, k)); if (!s.isAir() && !s.is(Blocks.WATER)) break; len++; }
            if (len == 0) return false;
            var block = com.mockingjam.spirecraft.registry.ModBlocks.HARBOUR_ROCK_SPIRE.get();
            for (int k = 0; k < len; k++) {
                var t = k == len - 1 ? net.minecraft.world.level.block.state.properties.DripstoneThickness.TIP
                        : k == len - 2 ? net.minecraft.world.level.block.state.properties.DripstoneThickness.FRUSTUM
                        : k == 0 ? net.minecraft.world.level.block.state.properties.DripstoneThickness.BASE
                        : net.minecraft.world.level.block.state.properties.DripstoneThickness.MIDDLE;
                BlockPos q = p.relative(dir, k);
                level.setBlock(q, block.defaultBlockState().setValue(com.mockingjam.spirecraft.block.HarbourSpireBlock.TIP_DIRECTION, dir)
                        .setValue(com.mockingjam.spirecraft.block.HarbourSpireBlock.THICKNESS, t)
                        .setValue(com.mockingjam.spirecraft.block.HarbourSpireBlock.WATERLOGGED, level.getBlockState(q).is(Blocks.WATER)), 2);
            }
            return true;
        }

        private static void barnacles(WorldGenLevel level, RandomSource r, java.util.Set<BlockPos> rock) {
            int sea = level.getSeaLevel();
            for (BlockPos p : rock) {
                int above = p.getY() - sea;
                double patch = Math.sin(p.getX() * 0.7) + Math.sin(p.getZ() * 0.6) + Math.sin(p.getY() * 0.9 + p.getX() * 0.3);
                double chance = above >= -3 && above <= 2 ? (patch > 0 ? 0.7 : 0.25) : (patch > 1.6 ? 0.35 : 0.0);
                if (r.nextDouble() >= chance) continue;
                for (Direction d : Direction.values()) {
                    if (d == Direction.UP) continue;
                    BlockPos q = p.relative(d);
                    BlockState at = level.getBlockState(q);
                    boolean water = at.is(Blocks.WATER) && at.getFluidState().isSource();
                    BlockState layer;
                    if (at.is(ModBlocks.BARNACLES.get())) layer = at;
                    else if (at.isAir() || water) layer = ModBlocks.BARNACLES.get().defaultBlockState().setValue(net.minecraft.world.level.block.MultifaceBlock.WATERLOGGED, water);
                    else continue;
                    if (r.nextInt(3) == 0) continue;
                    set(level, q, layer.setValue(net.minecraft.world.level.block.MultifaceBlock.getFaceProperty(d.getOpposite()), true));
                }
            }
        }

        private static boolean rockAt(WorldGenLevel level, BlockPos p) {
            return level.getBlockState(p).is(ModBlocks.HARBOUR_ROCK.base.get());
        }

        private static boolean open(WorldGenLevel level, BlockPos p) {
            BlockState s = level.getBlockState(p);
            return s.isAir() || s.is(Blocks.WATER) && s.getFluidState().isSource();
        }

        /**
         * Fill one horizontal ring of rock at {@code y} around (cx, cz) with a wavy outline of radius {@code rr}. v2.4: a
         * column only gets rock if the layer below had rock in the same column ({@code below}), so no part of a pillar
         * ever sticks out over the part under it. Mostly harbour rock; barnacle rock only as patches, thickest at the
         * waterline where barnacles live.
         */
        private static java.util.Set<Long> layer(WorldGenLevel level, BlockPos base, java.util.Set<BlockPos> rock, int y, float cx, float cz, float rr,
                float p1, float p2, java.util.Set<Long> below) {
            java.util.Set<Long> cols = new java.util.HashSet<>();
            int ri = (int) Math.ceil(rr + 1);
            for (int dx = -ri + (int) cx - 1; dx <= ri + (int) cx + 1; dx++) for (int dz = -ri + (int) cz - 1; dz <= ri + (int) cz + 1; dz++) {
                long key = ((long) dx << 32) ^ (dz & 0xffffffffL);
                if (below != null && !below.contains(key)) continue;
                float fx = dx - cx, fz = dz - cz;
                double a = Math.atan2(fz, fx);
                float wobble = 0.35F * (float) Math.sin(a * 3 + p1 + y * 0.35F) + 0.2F * (float) Math.sin(a * 5 + p2 - y * 0.2F);
                float rad = Math.max(0.4F, rr + wobble);
                if (fx * fx + fz * fz > rad * rad) continue;
                BlockPos p = base.offset(dx, y, dz);
                BlockState s = level.getBlockState(p);
                BlockState stone = rockFor(level, p, p1);
                if (y < 0) {
                    if (!s.is(Blocks.BEDROCK)) set(level, p, stone);   // the root, sunk into the ground
                    cols.add(key);
                } else if (replaceable(level, p) || s.is(BlockTags.DIRT) || s.is(Blocks.MUD) || s.is(ModBlocks.SLUDGE.get())
                        || s.is(ModBlocks.DARK_SAND.get())) {
                    set(level, p, stone);
                    rock.add(p);
                    cols.add(key);
                }
            }
            return cols;
        }

        /** Harbour rock, with barnacle-rock patches (half the blocks near the waterline, few higher up). */
        private static BlockState rockFor(WorldGenLevel level, BlockPos p, float phase) {
            double patch = Math.sin(p.getX() * 0.7 + phase) + Math.sin(p.getZ() * 0.6 - phase) + Math.sin(p.getY() * 0.9 + p.getX() * 0.3);
            int above = p.getY() - level.getSeaLevel();
            double limit = above >= -2 && above <= 2 ? 0.6 : 2.0;
            return ModBlocks.HARBOUR_ROCK.base.get().defaultBlockState();   // v2.8: barnacles grow on it as a layer (see barnacles())
        }

        /** A pillar: narrowing all the way up, leaning a little (it can only lean inwards over itself). */
        private static void pillar(WorldGenLevel level, RandomSource r, BlockPos base, java.util.Set<BlockPos> rock, float radius, int height, boolean capped) {
            float leanX = (r.nextFloat() - 0.5F) * 0.3F, leanZ = (r.nextFloat() - 0.5F) * 0.3F;
            float p1 = r.nextFloat() * 6.3F, p2 = r.nextFloat() * 6.3F;
            java.util.Set<Long> below = null;
            for (int y = -3; y < height; y++) {
                float t = Math.max(0, y) / (float) height;
                float rr = radius * (1 - 0.75F * (float) Math.pow(t, 1.3)) + 0.35F;
                below = layer(level, base, rock, y, leanX * Math.max(0, y), leanZ * Math.max(0, y), rr, p1, p2, y <= 0 ? null : below);
                if (below.isEmpty()) break;
            }
        }

        /** A low rounded boulder. */
        private static void boulder(WorldGenLevel level, RandomSource r, BlockPos base, java.util.Set<BlockPos> rock, float radius, int height) {
            float p1 = r.nextFloat() * 6.3F, p2 = r.nextFloat() * 6.3F;
            java.util.Set<Long> below = null;
            for (int y = -2; y < height; y++) {
                float t = Math.max(0, y) / (float) height;
                below = layer(level, base, rock, y, 0, 0, radius * (float) Math.sqrt(Math.max(0, 1 - t * t)) + 0.3F, p1, p2, y <= 0 ? null : below);
                if (below.isEmpty()) break;
            }
        }
    }


    /** Puddle: a 2–4 wide, 1-deep pool of (polluted) water sunk into the ground. */
    static final class Puddle extends Feature<NoneFeatureConfiguration> {
        Puddle(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            BlockPos c = ctx.origin().below();
            float rx = 1.2F + r.nextFloat() * 1.8F, rz = 1.2F + r.nextFloat() * 1.8F;
            int placed = 0;
            for (int dx = -3; dx <= 3; dx++) for (int dz = -3; dz <= 3; dz++) {
                if ((dx / rx) * (dx / rx) + (dz / rz) * (dz / rz) > 1) continue;
                BlockPos p = c.offset(dx, 0, dz);
                if (!solid(level, p) || !solid(level, p.below())) continue;
                // every side must hold water: solid or water next to it
                boolean sealed = true;
                for (Direction d : Direction.Plane.HORIZONTAL) {
                    BlockPos n = p.relative(d);
                    if (!solid(level, n) && !level.getFluidState(n).is(Fluids.WATER)) {
                        float nx = (dx + d.getStepX()) / rx, nz = (dz + d.getStepZ()) / rz;
                        if (nx * nx + nz * nz > 1) sealed = false;
                    }
                }
                if (!sealed) continue;
                set(level, p, Blocks.WATER.defaultBlockState());
                if (level.getBlockState(p.above()).canBeReplaced()) set(level, p.above(), Blocks.AIR.defaultBlockState());
                placed++;
            }
            return placed > 0;
        }
    }

    /** Fallen rotten log: 3–6 rotten logs lying on the ground, with moss and fungus on top. */
    static final class FallenLog extends Feature<NoneFeatureConfiguration> {
        FallenLog(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            Direction dir = Direction.Plane.HORIZONTAL.getRandomDirection(r);
            int length = 3 + r.nextInt(4);
            BlockPos start = ctx.origin();
            for (int i = 0; i < length; i++) {
                BlockPos p = start.relative(dir, i);
                if (!replaceable(level, p) || !solid(level, p.below())) return i > 0;
            }
            BlockState log = ModBlocks.ROTTEN.log.get().defaultBlockState().setValue(RotatedPillarBlock.AXIS, dir.getAxis());
            for (int i = 0; i < length; i++) {
                BlockPos p = start.relative(dir, i);
                set(level, p, log);
                BlockPos top = p.above();
                if (!replaceable(level, top)) continue;
                int roll = r.nextInt(6);
                if (roll == 0) set(level, top, Blocks.MOSS_CARPET.defaultBlockState());
                else if (roll == 1) set(level, top, ModBlocks.ROTTEN_SHRUB.get().defaultBlockState());
            }
            // a bracket fungus on the side
            BlockPos side = start.relative(dir, length / 2).relative(dir.getClockWise());
            if (replaceable(level, side)) set(level, side, ModBlocks.SHELF_FUNGUS.get().defaultBlockState().setValue(HorizontalDirectionalBlock.FACING, dir.getClockWise()));
            return true;
        }
    }

    /** Rotten stump: a 2–5 tall standing rotten log, sometimes with a broken branch. */
    static final class RottenStump extends Feature<NoneFeatureConfiguration> {
        RottenStump(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            BlockPos p = ctx.origin();
            if (!solid(level, p.below())) return false;
            int h = 2 + r.nextInt(4);
            for (int y = 0; y < h; y++) {
                if (!replaceable(level, p.above(y))) return y > 0;
                set(level, p.above(y), ModBlocks.ROTTEN.log.get().defaultBlockState());
            }
            if (h >= 3 && r.nextBoolean()) {
                Direction d = Direction.Plane.HORIZONTAL.getRandomDirection(r);
                BlockPos b = p.above(h - 2).relative(d);
                if (replaceable(level, b)) set(level, b, ModBlocks.ROTTEN.log.get().defaultBlockState().setValue(RotatedPillarBlock.AXIS, d.getAxis()));
            }
            return true;
        }
    }

    /** Stone pile: a small heap of harbour rock with the odd barnacle-rock block (the harbours' only stones). */
    static final class StonePile extends Feature<NoneFeatureConfiguration> {
        StonePile(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            BlockPos c = ctx.origin();
            if (!solid(level, c.below())) return false;
            BlockState[] stones = { ModBlocks.HARBOUR_ROCK.base.get().defaultBlockState() };   // v3.2: barnacle rock removed
            float rad = 1.0F + r.nextFloat() * 1.2F;
            for (int dx = -2; dx <= 2; dx++) for (int dz = -2; dz <= 2; dz++) for (int dy = 0; dy <= 2; dy++) {
                float d = (dx * dx + dz * dz) / (rad * rad) + dy * dy / (rad * rad * 0.6F);
                if (d > 1 || r.nextFloat() < 0.15F) continue;
                BlockPos p = c.offset(dx, dy, dz);
                if (replaceable(level, p) && solid(level, p.below())) set(level, p, stones[r.nextInt(stones.length)]);
            }
            return true;
        }
    }

    /** Polluted reef: a lump of polluted coral on the sea floor with polluted coral plants and fans on and around it. */
    static final class PollutedReef extends Feature<NoneFeatureConfiguration> {
        PollutedReef(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            BlockPos c = ctx.origin();
            if (!level.getFluidState(c).is(Fluids.WATER)) return false;
            // v2.8 (user): reefs come in clusters (3-6 lumps close together), with open sea floor between clusters
            for (int k = 2 + r.nextInt(4); k > 0; k--) {
                BlockPos q = level.getHeightmapPos(Heightmap.Types.OCEAN_FLOOR_WG, c.offset(r.nextInt(9) - 4, 0, r.nextInt(9) - 4));
                if (level.getFluidState(q).is(Fluids.WATER)) lump(level, r, q);
            }
            lump(level, r, c);
            return true;
        }

        private static void lump(WorldGenLevel level, RandomSource r, BlockPos c) {
            BlockState coral = ModBlocks.POLLUTED_CORAL_BLOCK.get().defaultBlockState();
            int rad = 1 + r.nextInt(2), height = 1 + r.nextInt(3);
            for (int dx = -rad; dx <= rad; dx++) for (int dz = -rad; dz <= rad; dz++) for (int dy = 0; dy < height; dy++) {
                if (dx * dx + dz * dz + dy * dy > rad * rad + 1 || r.nextFloat() < 0.2F) continue;
                BlockPos p = c.offset(dx, dy, dz);
                if (level.getFluidState(p).is(Fluids.WATER) && level.getBlockState(p).is(Blocks.WATER)) set(level, p, coral);
            }
            // decorate: plants on top, fans on the sides
            for (int i = 0; i < 12; i++) {
                BlockPos p = c.offset(r.nextInt(5) - 2, r.nextInt(4), r.nextInt(5) - 2);
                if (!level.getBlockState(p).is(Blocks.WATER)) continue;
                if (level.getBlockState(p.below()).is(coral.getBlock())) {
                    Block plant = switch (r.nextInt(3)) { case 0 -> ModBlocks.POLLUTED_TUBE_CORAL.get(); case 1 -> ModBlocks.POLLUTED_HORN_CORAL.get(); default -> ModBlocks.POLLUTED_CORAL_FAN.get(); };
                    set(level, p, plant.defaultBlockState().setValue(BlockStateProperties.WATERLOGGED, true));
                } else {
                    for (Direction d : Direction.Plane.HORIZONTAL) {
                        if (level.getBlockState(p.relative(d.getOpposite())).is(coral.getBlock())) {
                            set(level, p, ModBlocks.POLLUTED_CORAL_WALL_FAN.get().defaultBlockState()
                                    .setValue(BlockStateProperties.WATERLOGGED, true).setValue(HorizontalDirectionalBlock.FACING, d));
                            break;
                        }
                    }
                }
            }
        }
    }

    /** Reed beds (v2.3, user: dense patches, not single reeds): 15-35 reeds packed into a patch 5-9 across on the mud. */
    static final class ShoreReeds extends Feature<NoneFeatureConfiguration> {
        ShoreReeds(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            int radius = 2 + r.nextInt(3), placed = 0;
            BlockState reed = ModBlocks.REED.get().defaultBlockState();
            // v3.2 (user): reed beds grow by the sea - only where there is water within a few blocks
            boolean water = false;
            for (int dx = -5; dx <= 5 && !water; dx += 2) for (int dz = -5; dz <= 5 && !water; dz += 2) {
                BlockPos q = level.getHeightmapPos(Heightmap.Types.WORLD_SURFACE_WG, ctx.origin().offset(dx, 0, dz)).below();
                if (level.getFluidState(q).is(Fluids.WATER)) water = true;
            }
            if (!water) return false;
            for (int i = 0; i < 60; i++) {
                int dx = r.nextInt(radius * 2 + 1) - radius, dz = r.nextInt(radius * 2 + 1) - radius;
                if (dx * dx + dz * dz > radius * radius + 1) continue;
                BlockPos p = level.getHeightmapPos(Heightmap.Types.WORLD_SURFACE_WG, ctx.origin().offset(dx, 0, dz));
                if (!level.isEmptyBlock(p) || !level.isEmptyBlock(p.above()) || !reed.canSurvive(level, p)) continue;
                net.minecraft.world.level.block.DoublePlantBlock.placeAt(level, reed, p, 2);
                placed++;
            }
            return placed > 0;
        }
    }

    // ------------------------------------------------------------------ overgrowth family
    /**
     * Tall gnarlwood: as tall as a dark oak (2×2 trunk, 11–16 high) with one or two kinks in the trunk, roots splayed at
     * the base, four limbs under a broad flat crown (radius 6–7) so neighbouring crowns close into a canopy; vines on
     * the trunk, glowvines hanging from the crown edge, shelf fungus on the bark. Also what the sapling grows.
     */
    static final class TallGnarlwood extends Feature<NoneFeatureConfiguration> {
        TallGnarlwood(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            BlockPos base = ctx.origin();
            BlockState ground = level.getBlockState(base.below());
            if (!ground.is(BlockTags.DIRT) && !ground.is(Blocks.MOSS_BLOCK) && !ground.is(Blocks.MUD)) return false;
            int height = 8 + r.nextInt(5);   // 8–12: lower trees under one closed canopy (user)
            for (int y = 0; y < height + 3; y++) if (!replaceable(level, base.above(y)) && y > 0) return false;
            BlockState log = ModBlocks.GNARLWOOD.log.get().defaultBlockState();
            BlockState leaves = ModBlocks.GNARLWOOD.leaves.get().defaultBlockState().setValue(LeavesBlock.PERSISTENT, true);
            // the trunk: 2×2, kinking sideways once or twice
            Direction kink = Direction.Plane.HORIZONTAL.getRandomDirection(r);
            int kinkA = height / 3 + r.nextInt(3), kinkB = r.nextBoolean() ? 2 * height / 3 : -1;
            int ox = 0, oz = 0;
            for (int y = 0; y < height; y++) {
                if (y == kinkA || y == kinkB) {
                    // a diagonal step: place the joint, then move
                    for (int i = 0; i < 2; i++) for (int j = 0; j < 2; j++) set(level, base.offset(ox + i, y, oz + j), log);
                    ox += kink.getStepX();
                    oz += kink.getStepZ();
                    if (y == kinkB) kink = kink.getClockWise();
                }
                for (int i = 0; i < 2; i++) for (int j = 0; j < 2; j++) {
                    BlockPos p = base.offset(ox + i, y, oz + j);
                    if (replaceable(level, p) || level.getBlockState(p).is(BlockTags.LOGS)) set(level, p, log);
                }
            }
            // roots
            for (Direction d : Direction.Plane.HORIZONTAL) {
                BlockPos root = base.offset(d.getStepX() < 0 ? -1 : d.getStepX() > 0 ? 2 : r.nextInt(2), 0, d.getStepZ() < 0 ? -1 : d.getStepZ() > 0 ? 2 : r.nextInt(2));
                if (replaceable(level, root) && solid(level, root.below())) set(level, root, log.setValue(RotatedPillarBlock.AXIS, d.getAxis()));
            }
            BlockPos top = base.offset(ox, height, oz);
            // limbs: four horizontal arms under the crown
            for (Direction d : Direction.Plane.HORIZONTAL) {
                int len = 2 + r.nextInt(3);
                BlockPos arm = top.below(2 + r.nextInt(2)).offset(d.getStepX() > 0 ? 1 : 0, 0, d.getStepZ() > 0 ? 1 : 0);
                for (int i = 1; i <= len; i++) {
                    BlockPos p = arm.relative(d, i).above(i / 3);
                    if (replaceable(level, p)) set(level, p, log.setValue(RotatedPillarBlock.AXIS, d.getAxis()));
                }
            }
            // crown: a broad flat dome
            int radius = 7 + r.nextInt(2);   // wide crowns that meet, like a dark forest
            BlockPos cc = top.offset(0, 0, 0);
            for (int dy = -2; dy <= 2; dy++) {
                float rr = dy == 2 ? radius - 3.5F : dy == 1 ? radius - 1.5F : dy == 0 ? radius : radius - 0.5F;
                if (dy == -2) rr = radius - 1;
                for (int dx = -radius - 1; dx <= radius + 1; dx++) for (int dz = -radius - 1; dz <= radius + 1; dz++) {
                    float fx = dx - 0.5F, fz = dz - 0.5F;
                    float d2 = fx * fx + fz * fz;
                    if (d2 > rr * rr) continue;
                    if (dy == -2 && d2 < (rr - 2) * (rr - 2)) continue;   // underside: only a hanging rim
                    if (d2 > (rr - 1) * (rr - 1) && r.nextFloat() < 0.25F) continue;   // ragged edge
                    BlockPos p = cc.offset(dx, dy, dz);
                    if (replaceable(level, p)) set(level, p, leaves);
                }
            }
            // hanging glowvines and vines from the crown edge
            for (int i = 0; i < 10; i++) {
                double a = r.nextDouble() * Math.PI * 2;
                int dx = (int) Math.round(Math.cos(a) * (radius - 1)), dz = (int) Math.round(Math.sin(a) * (radius - 1));
                BlockPos p = cc.offset(dx, -3, dz);
                if (!level.getBlockState(p.above()).is(BlockTags.LEAVES)) continue;
                int len = 2 + r.nextInt(5);
                boolean glow = r.nextInt(3) == 0;
                for (int k = 0; k < len; k++) {
                    BlockPos q = p.below(k);
                    if (!level.isEmptyBlock(q)) break;
                    boolean last = k == len - 1 || !level.isEmptyBlock(q.below());
                    set(level, q, glow ? (last ? ModBlocks.GLOWVINE.get() : ModBlocks.GLOWVINE_PLANT.get()).defaultBlockState()
                            : Blocks.VINE.defaultBlockState().setValue(VineBlock.UP, true));
                    if (!glow) break;   // vanilla vines: one block hanging from the leaves (they grow down by themselves)
                }
            }
            // vines and shelf fungus on the trunk
            for (int y = 1; y < height - 2; y++) {
                for (Direction d : Direction.Plane.HORIZONTAL) {
                    if (r.nextInt(5) != 0) continue;
                    BlockPos face = base.offset(d.getStepX() > 0 ? 1 : 0, y, d.getStepZ() > 0 ? 1 : 0).relative(d);
                    if (!level.isEmptyBlock(face) || !level.getBlockState(face.relative(d.getOpposite())).is(BlockTags.LOGS)) continue;
                    if (r.nextInt(4) == 0) set(level, face, ModBlocks.SHELF_FUNGUS.get().defaultBlockState().setValue(HorizontalDirectionalBlock.FACING, d));
                    else set(level, face, Blocks.VINE.defaultBlockState().setValue(VineBlock.getPropertyForFace(d.getOpposite()), true));
                }
            }
            // tall grass and ferns crowd around the foot of the tree (user: more tall grass where the trees stand)
            for (int i = 0; i < 28; i++) {
                int dx = r.nextInt(11) - 5, dz = r.nextInt(11) - 5;
                if (dx >= -1 && dx <= 2 && dz >= -1 && dz <= 2) continue;
                BlockPos g = level.getHeightmapPos(Heightmap.Types.MOTION_BLOCKING_NO_LEAVES, base.offset(dx, 0, dz));
                BlockState under = level.getBlockState(g.below());
                if (!level.isEmptyBlock(g) || !level.isEmptyBlock(g.above()) || !(under.is(BlockTags.DIRT) || under.is(Blocks.MOSS_BLOCK))) continue;
                net.minecraft.world.level.block.DoublePlantBlock.placeAt(level, (r.nextInt(3) == 0 ? Blocks.LARGE_FERN : Blocks.TALL_GRASS).defaultBlockState(), g, 2);
            }
            return true;
        }
    }

    private static BlockState stem() {
        return Blocks.MUSHROOM_STEM.defaultBlockState();
    }

    /**
     * v3.4 (user: the stems need not all be straight): a mushroom stem that steps one block sideways once or twice on
     * its way up (each step has an elbow block, so it stays joined); returns the block above its top.
     */
    static BlockPos curvedStem(WorldGenLevel level, RandomSource r, BlockPos base, int h, Direction d) {
        return curvedStem(level, r, base, h, d, stem());
    }

    /** v3.5: the same with the stem block given (the giant hive shroom grows on hiveshroom stem). */
    static BlockPos curvedStem(WorldGenLevel level, RandomSource r, BlockPos base, int h, Direction d, BlockState stemState) {
        BlockPos p = base;
        int bends = h >= 4 ? 1 + r.nextInt(2) : 0;
        java.util.Set<Integer> at = new java.util.HashSet<>();
        for (int i = 0; i < bends; i++) at.add(1 + (i + 1) * (h - 2) / (bends + 1));
        for (int y = 0; y < h; y++) {
            set(level, p, stemState);
            if (at.contains(y) && replaceable(level, p.relative(d)) && replaceable(level, p.relative(d).above())) { p = p.relative(d); set(level, p, stemState); }
            p = p.above();
        }
        return p;
    }

    /** v3.5: the hive shroom's beige stem; and shroomlights tucked under a big cap, like the nether's huge fungi. */
    private static BlockState hiveStem() {
        return ModBlocks.HIVESHROOM.log.get().defaultBlockState();
    }

    private static void shroomlights(WorldGenLevel level, RandomSource r, BlockPos top, int rad, int count) {
        for (int i = 0, placed = 0; i < count * 4 && placed < count; i++) {
            BlockPos q = top.offset(r.nextInt(2 * rad + 1) - rad, -1, r.nextInt(2 * rad + 1) - rad);
            if (replaceable(level, q) && level.getBlockState(q.above()).is(ModBlocks.HIVE_SHROOM_BLOCK.get())) { set(level, q, Blocks.SHROOMLIGHT.defaultBlockState()); placed++; }
        }
    }

    static BlockPos curvedStem(WorldGenLevel level, RandomSource r, BlockPos base, int h) {
        return curvedStem(level, r, base, h, Direction.Plane.HORIZONTAL.getRandomDirection(r));
    }

    /** Giant lantern cap: a slender pale stem and a glowing yellow bell-shaped cap, hollow underneath. */
    /**
     * Giant hive shroom (v2.4, v2.7 more shapes): a glowing amber hive shroom grown huge, in one of four forms - a wide
     * flat cap with its rim turned down, a tall slender stem with a small domed cap, a short bell-shaped cap, or a
     * clump of two or three little ones. Fits under a cave ceiling.
     */
    static final class GiantHiveShroom extends Feature<NoneFeatureConfiguration> {
        GiantHiveShroom(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            return grow(ctx.level(), ctx.random(), ctx.origin(), ctx.random().nextInt(4));
        }

        static boolean grow(WorldGenLevel level, RandomSource r, BlockPos base, int form) {
            if (!solid(level, base.below())) return false;
            BlockState cap = ModBlocks.HIVE_SHROOM_BLOCK.get().defaultBlockState();
            switch (form) {
                case 1 -> {   // tall and slender, a small dome
                    int h = 6 + r.nextInt(4);
                    if (!clear(level, base, h + 2, 0)) return false;
                    BlockPos top = curvedStem(level, r, base, h, Direction.Plane.HORIZONTAL.getRandomDirection(r), hiveStem());
                    disc(level, top, 1, cap, false);
                    if (replaceable(level, top.above())) set(level, top.above(), cap);
                }
                case 2 -> {   // a bell
                    int h = 4 + r.nextInt(2);
                    if (!clear(level, base, h + 2, 0)) return false;
                    BlockPos top = curvedStem(level, r, base, h, Direction.Plane.HORIZONTAL.getRandomDirection(r), hiveStem());
                    if (replaceable(level, top.above())) set(level, top.above(), cap);
                    disc(level, top, 1, cap, false);
                    disc(level, top.below(), 2, cap, true);
                    disc(level, top.below(2), 2, cap, true);
                    // inside the bell: shroomlights hanging under the crown
                    for (BlockPos q : List.of(top.below().north(), top.below().east(), top.below().south(), top.below().west()))
                        if (r.nextInt(3) == 0 && replaceable(level, q)) set(level, q, Blocks.SHROOMLIGHT.defaultBlockState());
                }
                case 3 -> {   // a clump of little ones
                    int n = 2 + r.nextInt(2), grown = 0;
                    for (int i = 0; i < n * 3 && grown < n; i++) {
                        BlockPos q = base.offset(r.nextInt(5) - 2, 0, r.nextInt(5) - 2);
                        if (!solid(level, q.below())) continue;
                        int h = 2 + r.nextInt(2);
                        if (!clear(level, q, h + 1, 0)) continue;
                        for (int y = 0; y < h; y++) set(level, q.above(y), hiveStem());
                        disc(level, q.above(h), 1, cap, false);
                        grown++;
                    }
                    return grown > 0;
                }
                default -> {   // wide and flat, the rim turned down
                    int h = 3 + r.nextInt(3), rad = 2 + r.nextInt(2);
                    if (!clear(level, base, h + 1, 0)) return false;
                    BlockPos top = curvedStem(level, r, base, h, Direction.Plane.HORIZONTAL.getRandomDirection(r), hiveStem());
                    for (int dx = -rad; dx <= rad; dx++) for (int dz = -rad; dz <= rad; dz++) {
                        if (dx * dx + dz * dz > rad * rad + 1) continue;
                        BlockPos p = top.offset(dx, 0, dz);
                        if (replaceable(level, p)) set(level, p, cap);
                        boolean rim = dx * dx + dz * dz > (rad - 1) * (rad - 1) + 1;
                        if (rim && replaceable(level, p.below())) set(level, p.below(), cap);
                    }
                    shroomlights(level, r, top, rad - 1, 2 + r.nextInt(3));   // the wide caps glow underneath
                }
            }
            return true;
        }

        private static boolean clear(WorldGenLevel level, BlockPos base, int h, int unused) {
            for (int y = 0; y < h; y++) if (!replaceable(level, base.above(y))) return false;
            return true;
        }

        /** A round layer of cap; {@code ring} = only its edge (a hanging rim). */
        private static void disc(WorldGenLevel level, BlockPos c, int rad, BlockState cap, boolean ring) {
            for (int dx = -rad; dx <= rad; dx++) for (int dz = -rad; dz <= rad; dz++) {
                int d2 = dx * dx + dz * dz;
                if (d2 > rad * rad + (rad > 1 ? 1 : 0) || ring && d2 <= (rad - 1) * (rad - 1) + 1) continue;
                BlockPos p = c.offset(dx, 0, dz);
                if (replaceable(level, p)) set(level, p, cap);
            }
        }
    }

    /**
     * Mycelium patches (v3.1, user: mycelium in patches where the mushrooms grow): runs after the plants; in the hive
     * caves every hive shroom and giant hive shroom of the chunk spreads a ragged patch of hive mycelium over the soil
     * and rock floor around it (radius 2-3), only on blocks open to the air.
     */
    static final class MyceliumPatches extends Feature<NoneFeatureConfiguration> {
        MyceliumPatches(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            int x0 = ctx.origin().getX() & ~15, z0 = ctx.origin().getZ() & ~15;
            Block shroom = ModBlocks.HIVE_SHROOM.get(), cap = ModBlocks.HIVE_SHROOM_BLOCK.get();
            List<BlockPos> roots = new java.util.ArrayList<>();
            var chunk = level.getChunk(x0 >> 4, z0 >> 4);
            var sections = chunk.getSections();
            for (int i = 0; i < sections.length; i++) {
                var sec = sections[i];
                if (sec.hasOnlyAir() || !sec.getStates().maybeHas(st -> st.is(shroom) || st.is(Blocks.MUSHROOM_STEM))) continue;
                int y0 = level.getSectionYFromSectionIndex(i) << 4;
                for (int x = 0; x < 16; x++) for (int y = 0; y < 16; y++) for (int z = 0; z < 16; z++) {
                    BlockState st = sec.getBlockState(x, y, z);
                    BlockPos p = new BlockPos(x0 + x, y0 + y, z0 + z);
                    // a small shroom, or the foot of a giant one (a stem standing on the ground)
                    if (st.is(shroom) || st.is(Blocks.MUSHROOM_STEM) && !level.getBlockState(p.below()).is(Blocks.MUSHROOM_STEM)) roots.add(p);
                }
            }
            if (roots.isEmpty()) return false;
            BlockState myc = ModBlocks.HIVE_MYCELIUM.get().defaultBlockState();
            for (BlockPos root : roots) {
                if (!level.getBiome(root).is(ModBiomes.HIVE_CAVES) && !level.getBiome(root).is(ModBiomes.SPARSE_HIVE_CAVES) && !level.getBiome(root).is(ModBiomes.EGG_HIVE_CAVES)) continue;
                int rad = 2 + r.nextInt(2);
                for (int dx = -rad; dx <= rad; dx++) for (int dz = -rad; dz <= rad; dz++) for (int dy = -2; dy <= 1; dy++) {
                    if (dx * dx + dz * dz > rad * rad + 1 || dx * dx + dz * dz > rad * rad - 1 && r.nextBoolean()) continue;   // ragged edge
                    BlockPos g = root.offset(dx, dy - 1, dz);
                    BlockState st = level.getBlockState(g), up = level.getBlockState(g.above());
                    if (!(up.isAir() || up.is(shroom) || up.is(Blocks.MUSHROOM_STEM))) continue;
                    if (st.is(ModBlocks.HIVE_SOIL.get()) || st.is(ModBlocks.HIVE_ROCK.base.get()) || st.is(ModBlocks.DEEP_HIVE_ROCK.base.get()) || st.is(BlockTags.DIRT) && !st.is(ModBlocks.HIVE_MYCELIUM.get())) {
                        set(level, g, myc);
                    }
                }
            }
            return true;
        }
    }

    /**
     * Shroom grove (v2.7, user: dense mushroom patches in the mushroom hives): a floor of hive soil 5-7 blocks across
     * carpeted with small hive shrooms, among two to four giant hive shrooms of mixed forms.
     */
    static final class ShroomGrove extends Feature<NoneFeatureConfiguration> {
        ShroomGrove(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            BlockPos c = floor(level, ctx.origin());
            if (c == null) return false;
            int rad = 3 + r.nextInt(2);
            // the soil
            for (int dx = -rad - 1; dx <= rad + 1; dx++) for (int dz = -rad - 1; dz <= rad + 1; dz++) for (int dy = -2; dy <= 1; dy++) {
                if (dx * dx + dz * dz > (rad + 0.5) * (rad + 0.5)) continue;
                BlockPos g = c.offset(dx, dy, dz);
                if (level.isEmptyBlock(g.above()) && (level.getBlockState(g).is(BlockTags.BASE_STONE_OVERWORLD) || level.getBlockState(g).is(ModBlocks.HIVE_ROCK.base.get())
                        || level.getBlockState(g).is(ModBlocks.DEEP_HIVE_ROCK.base.get()) || level.getBlockState(g).is(ModBlocks.HIVE_SOIL.get())))
                    set(level, g, ModBlocks.HIVE_MYCELIUM.get().defaultBlockState());
            }
            // the giants
            for (int i = 2 + r.nextInt(3); i > 0; i--) {
                BlockPos q = c.offset(r.nextInt(rad * 2 + 1) - rad, 0, r.nextInt(rad * 2 + 1) - rad);
                BlockPos f = floor(level, q.above(2));
                if (f != null) GiantHiveShroom.grow(level, r, f, r.nextInt(4));
            }
            // a carpet of small shrooms
            BlockState shroom = ModBlocks.HIVE_SHROOM.get().defaultBlockState();
            for (int i = 0; i < 60; i++) {
                BlockPos q = c.offset(r.nextInt(rad * 2 + 3) - rad - 1, r.nextInt(3) - 1, r.nextInt(rad * 2 + 3) - rad - 1);
                if (level.isEmptyBlock(q) && shroom.canSurvive(level, q)) set(level, q, shroom);
            }
            return true;
        }
    }

    static final class GiantLanternCap extends Feature<NoneFeatureConfiguration> {
        GiantLanternCap(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            BlockPos base = ctx.origin();
            if (!solid(level, base.below())) return false;
            int h = 6 + r.nextInt(4);
            for (int y = 0; y < h + 4; y++) if (!replaceable(level, base.above(y))) return false;
            for (int y = 0; y < h; y++) set(level, base.above(y), stem());
            BlockState cap = ModBlocks.LANTERN_CAP_BLOCK.get().defaultBlockState();
            BlockPos top = base.above(h);
            set(level, top.above(2), cap);
            for (int dy = 1; dy >= -1; dy--) {
                int rad = dy == 1 ? 1 : 2;
                for (int dx = -rad; dx <= rad; dx++) for (int dz = -rad; dz <= rad; dz++) {
                    if (Math.abs(dx) == rad && Math.abs(dz) == rad) continue;
                    boolean rim = Math.max(Math.abs(dx), Math.abs(dz)) == rad;
                    if (dy == -1 && !rim) continue;   // hollow bell
                    BlockPos p = top.offset(dx, dy, dz);
                    if (replaceable(level, p)) set(level, p, cap);
                }
            }
            return true;
        }
    }

    /** Giant coral cap: a short trunk forking into 3–4 upward branches, each tipped with an orange cap cluster. */
    static final class GiantCoralCap extends Feature<NoneFeatureConfiguration> {
        GiantCoralCap(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            BlockPos base = ctx.origin();
            if (!solid(level, base.below())) return false;
            int trunk = 2 + r.nextInt(2);
            for (int y = 0; y < trunk + 6; y++) if (!replaceable(level, base.above(y))) return false;
            for (int y = 0; y < trunk; y++) set(level, base.above(y), stem());
            BlockState cap = ModBlocks.CORAL_CAP_BLOCK.get().defaultBlockState();
            int branches = 3 + r.nextInt(2);
            for (int b = 0; b < branches; b++) {
                double a = b * Math.PI * 2 / branches + r.nextDouble() * 0.6;
                int len = 3 + r.nextInt(3);
                BlockPos p = base.above(trunk - 1);
                for (int i = 1; i <= len; i++) {
                    p = base.offset((int) Math.round(Math.cos(a) * i * 0.6), trunk - 1 + i, (int) Math.round(Math.sin(a) * i * 0.6));
                    if (replaceable(level, p)) set(level, p, stem());
                }
                // tip cluster
                for (int dx = -1; dx <= 1; dx++) for (int dz = -1; dz <= 1; dz++) for (int dy = 0; dy <= 1; dy++) {
                    if (dy == 1 && (dx != 0 && dz != 0)) continue;
                    BlockPos q = p.offset(dx, dy + 1, dz);
                    if (replaceable(level, q)) set(level, q, cap);
                }
            }
            return true;
        }
    }

    /** Giant bluebell: a tall stalk that bends at the top into a hanging blue bell; often two or three together. */
    static final class GiantBluebell extends Feature<NoneFeatureConfiguration> {
        GiantBluebell(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            int n = 1 + r.nextInt(3), placed = 0;
            for (int k = 0; k < n; k++) {
                BlockPos base = ctx.origin().offset(k == 0 ? 0 : r.nextInt(7) - 3, 0, k == 0 ? 0 : r.nextInt(7) - 3);
                base = level.getHeightmapPos(Heightmap.Types.WORLD_SURFACE_WG, base);
                if (!solid(level, base.below())) continue;
                int h = 7 + r.nextInt(5);
                Direction lean = Direction.Plane.HORIZONTAL.getRandomDirection(r);
                boolean clear = true;
                for (int y = 0; y < h + 2; y++) if (!replaceable(level, base.above(y)) || !replaceable(level, base.above(y).relative(lean))) clear = false;
                if (!clear) continue;
                BlockPos top = curvedStem(level, r, base, h, lean);   // v3.4: the stem arcs over towards its lean
                set(level, top, stem());
                BlockPos head = top.relative(lean);
                BlockState cap = ModBlocks.BLUEBELL_CAP_BLOCK.get().defaultBlockState();
                // the bell hangs from the bent tip: a cap ring with a rim one block lower
                for (int dx = -1; dx <= 1; dx++) for (int dz = -1; dz <= 1; dz++) {
                    BlockPos p = head.offset(dx, 0, dz);
                    if (replaceable(level, p)) set(level, p, cap);
                    if (dx != 0 || dz != 0) {
                        BlockPos rim = p.below();
                        if (replaceable(level, rim) && (dx == 0 || dz == 0 || r.nextBoolean())) set(level, rim, cap);
                    }
                }
                if (replaceable(level, head.above())) set(level, head.above(), cap);
                placed++;
            }
            return placed > 0;
        }
    }

    // ------------------------------------------------------------------ caves
    /**
     * The cave biomes' rock (runs after ore generation): inside {@code biome}, every stone type (stone, andesite, granite,
     * diorite, tuff, gravel, dirt...) becomes the biome's stone and every ore the matching ore of that stone
     * (block/CaveOres). Style: 1-3 hive caves (hive rock, deep hive rock where deepslate was), 4 quicksand caves
     * (sandstone, a little sand). Style 0 (ink) is no longer used: the ink caves keep vanilla stone (v2.3) and only the
     * ink pools darken the rock around them. The hive comb is not part of the walls any more: it grows as nests stuck to
     * them (HiveNest).
     */
    public record CaveStoneConfig(ResourceKey<Biome> biome, int style) implements FeatureConfiguration {
        public static final Codec<CaveStoneConfig> CODEC = RecordCodecBuilder.create(i -> i.group(
                ResourceKey.codec(Registries.BIOME).fieldOf("biome").forGetter(CaveStoneConfig::biome),
                Codec.intRange(0, 4).fieldOf("style").forGetter(CaveStoneConfig::style)).apply(i, CaveStoneConfig::new));
    }

    static final class CaveStone extends Feature<CaveStoneConfig> {
        CaveStone(Codec<CaveStoneConfig> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<CaveStoneConfig> ctx) {
            WorldGenLevel level = ctx.level();
            int style = ctx.config().style();
            if (style == 0) return false;
            boolean mycelium = false;   // v3.1: mycelium only around mushrooms now (MyceliumPatches), not on all soil
            boolean sand = style == 4;
            if (sand) return false;   // v3.5: the quicksand caves and their sandstone ores are gone
            var shallow = com.mockingjam.spirecraft.block.CaveOres.HIVE;
            var deep = com.mockingjam.spirecraft.block.CaveOres.DEEP_HIVE;
            BlockState stone = sand ? Blocks.SANDSTONE.defaultBlockState() : shallow.stone.get().defaultBlockState();
            BlockState deepStone = sand ? Blocks.SANDSTONE.defaultBlockState() : deep.stone.get().defaultBlockState();
            int x0 = ctx.origin().getX() & ~15, z0 = ctx.origin().getZ() & ~15;
            BlockPos.MutableBlockPos p = new BlockPos.MutableBlockPos();
            boolean any = false;
            int minY = level.getMinY() + 1;
            for (int qx = 0; qx < 16; qx += 4) for (int qz = 0; qz < 16; qz += 4) {
                int surface = level.getHeight(Heightmap.Types.OCEAN_FLOOR_WG, x0 + qx, z0 + qz) - 6;
                for (int qy = minY; qy < surface; qy += 4) {
                    // biomes are stored per 4×4×4 cell: check once per cell
                    if (!level.getBiome(p.set(x0 + qx + 2, qy + 2, z0 + qz + 2)).is(ctx.config().biome())) continue;
                    for (int dx = 0; dx < 4; dx++) for (int dz = 0; dz < 4; dz++) for (int dy = 0; dy < 4 && qy + dy < surface; dy++) {
                        int x = x0 + qx + dx, y = qy + dy, z = z0 + qz + dz;
                        p.set(x, y, z);
                        BlockState s = level.getBlockState(p);
                        if (s.isAir() || !s.getFluidState().isEmpty() || s.is(Blocks.BEDROCK) || s.is(Blocks.SPAWNER)) continue;
                        BlockState next = null;
                        if (s.is(BlockTags.BASE_STONE_OVERWORLD) || s.is(Blocks.GRAVEL) || s.is(BlockTags.DIRT) || s.is(Blocks.CALCITE)
                                || s.is(Blocks.SMOOTH_BASALT) || s.is(Blocks.CLAY)) {
                            boolean isDeep = s.is(Blocks.DEEPSLATE) || y < 0;
                            next = sand && Math.floorMod(x * 31 + y * 17 + z * 7, 9) == 0 ? Blocks.SAND.defaultBlockState() : isDeep ? deepStone : stone;
                            // v2.4: the hive walls are part rock, part hive soil - in big patches, and wherever dirt was
                            if (!sand && (s.is(BlockTags.DIRT) || soilPatch(x, y, z))) next = ModBlocks.HIVE_SOIL.get().defaultBlockState();
                        } else {
                            Block ore = deep.swap(s.getBlock());
                            if (ore == null) ore = shallow.swap(s.getBlock());
                            if (ore != null) next = ore.defaultBlockState();
                        }
                        if (next != null && next != s) {
                            level.setBlock(p, next, 2);
                            any = true;
                        }
                    }
                    if (mycelium) for (int dx = 0; dx < 4; dx++) for (int dz = 0; dz < 4; dz++) for (int dy = 0; dy < 4 && qy + dy < surface; dy++) {
                        p.set(x0 + qx + dx, qy + dy, z0 + qz + dz);
                        if (level.getBlockState(p).is(ModBlocks.HIVE_SOIL.get()) && level.getBlockState(p.above()).isAir()) {
                            level.setBlock(p, ModBlocks.HIVE_MYCELIUM.get().defaultBlockState(), 2);
                        }
                    }
                }
            }
            return any;
        }
    }

    /** Big soil patches in the hive walls (a few blocks to a dozen across). */
    private static boolean soilPatch(int x, int y, int z) {
        return Math.sin(x * 0.21 + y * 0.05) + Math.sin(z * 0.19 - y * 0.07) + Math.sin((x + z) * 0.13 + y * 0.17) > 1.2;
    }

    /** Find the floor below an air position (for cave features placed in the air). */
    private static BlockPos floor(WorldGenLevel level, BlockPos p) {
        if (!level.isEmptyBlock(p)) return null;
        for (int i = 0; i < 24; i++, p = p.below()) if (!level.isEmptyBlock(p.below())) return solid(level, p.below()) ? p : null;
        return null;
    }

    /**
     * Ink pool (v2.3, user: bigger pools, bubbling vents that hurt, dark rock only around the pools): a bowl of ink 6-12
     * across, up to three deep in the middle, with one or two ink vents on its floor. Around it the stone (and any ore)
     * becomes ink-stained stone - deep ink stone below the deepslate line - in a ragged shell a few blocks thick, so the
     * pools sit in dark rock while the rest of the cave keeps its vanilla stone. Ink bubbles grow on the banks.
     */
    static final class InkPool extends Feature<NoneFeatureConfiguration> {
        InkPool(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            BlockPos c = floor(level, ctx.origin());
            if (c == null) return false;
            c = c.below();
            float rx = 3 + r.nextFloat() * 3, rz = 3 + r.nextFloat() * 3;
            BlockState ink = ModFluids.INK_BLOCK.get().defaultBlockState();
            BlockState shallowRock = ModBlocks.INK_STAINED_STONE.base.get().defaultBlockState(), deepRock = shallowRock;   // v3.6: one ink stone at every depth
            // the dark shell: stone and ores within a few blocks of the pool
            int sx = (int) rx + 5, sz = (int) rz + 5;
            for (int dx = -sx; dx <= sx; dx++) for (int dz = -sz; dz <= sz; dz++) for (int dy = -6; dy <= 5; dy++) {
                float d = (dx / (rx + 3.5F)) * (dx / (rx + 3.5F)) + (dz / (rz + 3.5F)) * (dz / (rz + 3.5F)) + (dy / 5.0F) * (dy / 5.0F);
                if (d > 1 || d > 0.75F && r.nextFloat() < 0.5F) continue;
                BlockPos p = c.offset(dx, dy, dz);
                BlockState s = level.getBlockState(p);
                if (s.is(BlockTags.BASE_STONE_OVERWORLD) || s.is(net.minecraftforge.common.Tags.Blocks.ORES) || s.is(Blocks.GRAVEL) || s.is(BlockTags.DIRT)) {
                    set(level, p, s.is(Blocks.DEEPSLATE) || s.is(BlockTags.DEEPSLATE_ORE_REPLACEABLES) || p.getY() < 0 ? deepRock : shallowRock);
                }
            }
            // the bowl
            int filled = 0;
            for (int dx = -7; dx <= 7; dx++) for (int dz = -7; dz <= 7; dz++) {
                float d = (dx / rx) * (dx / rx) + (dz / rz) * (dz / rz);
                if (d > 1) continue;
                int depth = d < 0.25F ? 3 : d < 0.6F ? 2 : 1;
                BlockPos top = c.offset(dx, 0, dz);
                for (int k = 0; k < depth; k++) {
                    BlockPos q = top.below(k);
                    set(level, q, ink);
                    // seal the sides and the bottom with dark rock where they are open
                    for (Direction side : Direction.Plane.HORIZONTAL) {
                        BlockPos n = q.relative(side);
                        float nd = ((dx + side.getStepX()) / rx) * ((dx + side.getStepX()) / rx) + ((dz + side.getStepZ()) / rz) * ((dz + side.getStepZ()) / rz);
                        if (nd > 1 && !solid(level, n)) set(level, n, n.getY() < 0 ? deepRock : shallowRock);
                    }
                }
                BlockPos bottom = top.below(depth);
                if (!solid(level, bottom)) set(level, bottom, bottom.getY() < 0 ? deepRock : shallowRock);
                // nothing standing in the pool
                if (!level.isEmptyBlock(top.above()) && replaceable(level, top.above())) set(level, top.above(), Blocks.CAVE_AIR.defaultBlockState());
                filled++;
            }
            // the rock right against the ink - its sides and bed - is crazed with heat cracks (v2.7: only there)
            BlockState cracked = ModBlocks.CRACKED_INK_STONE.get().defaultBlockState();
            for (int dx = -8; dx <= 8; dx++) for (int dz = -8; dz <= 8; dz++) for (int dy = -4; dy <= 0; dy++) {
                BlockPos q = c.offset(dx, dy, dz);
                BlockState st = level.getBlockState(q);
                if (!(st.is(shallowRock.getBlock()) || st.is(deepRock.getBlock()))) continue;
                boolean touches = false;
                for (Direction dir : Direction.values()) if (dir != Direction.DOWN && level.getFluidState(q.relative(dir)).getType().isSame(ModFluids.INK.get())) touches = true;
                if (touches && r.nextInt(5) < 3) set(level, q, cracked);
            }
            // vents on the deepest floor
            for (int v = 1 + r.nextInt(2); v > 0; v--) {
                BlockPos q = c.offset(Math.round((r.nextFloat() - 0.5F) * rx * 0.8F), -3, Math.round((r.nextFloat() - 0.5F) * rz * 0.8F));
                if (level.getFluidState(q.above()).getType().isSame(ModFluids.INK.get())) set(level, q, ModBlocks.INK_VENT.get().defaultBlockState());
            }
            // bubbles on the banks
            for (int i = 0; i < 10; i++) {
                BlockPos p = c.offset(Math.round((r.nextFloat() * 2 - 1) * (rx + 2.5F)), 1, Math.round((r.nextFloat() * 2 - 1) * (rz + 2.5F)));
                if (level.isEmptyBlock(p) && solid(level, p.below()) && level.getFluidState(p.below()).isEmpty()) {
                    set(level, p, ModBlocks.INK_BUBBLE.get().defaultBlockState());
                }
            }
            return filled > 0;
        }
    }

    /**
     * Hive nest (v2.3, user: "nests stuck to the walls as solid shapes, like a beehive, hollow inside"): a lump of hive
     * comb built against a cave wall or ceiling, half sunk into the rock, hollow, with an opening facing the cave. Two
     * kinds: round nests (an ellipsoid 7-11 across) and long nests (a capsule 13-25 long lying along the wall). Inside:
     * honey blocks and hive caches on the floor, and in some nests a spawner (cave spiders or silverfish).
     */
    /** Egg clutch (v2.4): 6-16 tough eggs (1-4 a block) laid close together on a cave floor - the Ovicopter's clutch. */
    static final class EggClutch extends Feature<NoneFeatureConfiguration> {
        EggClutch(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            BlockPos c = floor(level, ctx.origin());
            if (c == null) return false;
            int placed = 0, want = 6 + r.nextInt(11);
            for (int i = 0; i < 40 && placed < want; i++) {
                BlockPos p = c.offset(r.nextInt(5) - 2, r.nextInt(3) - 1, r.nextInt(5) - 2);
                if (!level.getBlockState(p).isAir() || !level.getBlockState(p.below()).isFaceSturdy(level, p.below(), Direction.UP)) continue;
                set(level, p, ModBlocks.HIVE_EGG.get().defaultBlockState().setValue(net.minecraft.world.level.block.TurtleEggBlock.EGGS, 1 + r.nextInt(4)));
                placed++;
            }
            return placed > 0;
        }
    }

    static final class HiveNest extends Feature<NoneFeatureConfiguration> {
        HiveNest(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            // an air cell in a cave right next to a wall or under a ceiling
            BlockPos anchor = null;
            Direction wall = null;
            for (int i = 0; i < 40 && anchor == null; i++) {
                BlockPos p = ctx.origin().offset(r.nextInt(9) - 4, r.nextInt(9) - 4, r.nextInt(9) - 4);
                if (!level.getBlockState(p).isAir()) continue;
                List<Direction> dirs = new java.util.ArrayList<>(List.of(Direction.UP, Direction.NORTH, Direction.SOUTH, Direction.EAST, Direction.WEST));
                net.minecraft.Util.shuffle(dirs, r);
                for (Direction d : dirs) {
                    if (solid(level, p.relative(d)) && level.getBlockState(p.relative(d.getOpposite())).isAir()) { anchor = p; wall = d; break; }
                }
            }
            if (anchor == null) return false;
            boolean round = r.nextBoolean();
            float rad = round ? 3.5F + r.nextFloat() * 2.0F : 2.6F + r.nextFloat() * 1.0F;
            float half = round ? 0 : 4.0F + r.nextFloat() * 4.5F;
            // the long axis lies along the wall: horizontal and across the wall direction
            Direction along = wall.getAxis().isVertical() ? Direction.Plane.HORIZONTAL.getRandomDirection(r) : wall.getClockWise();
            float ax = along.getStepX(), az = along.getStepZ(), ay = 0;
            if (!round && wall.getAxis().isHorizontal() && r.nextInt(3) == 0) { ay = 0.5F; float n = (float) Math.sqrt(1 + ay * ay); ax /= n; az /= n; ay /= n; }   // some lie slanted
            // a quarter sunk into the wall, the rest standing out into the cave
            float cx = anchor.getX() + 0.5F + wall.getStepX() * rad * 0.25F, cy = anchor.getY() + 0.5F + wall.getStepY() * rad * 0.25F,
                    cz = anchor.getZ() + 0.5F + wall.getStepZ() * rad * 0.25F;
            boolean eggCave = level.getBiome(anchor).is(ModBiomes.EGG_HIVE_CAVES), sparse = level.getBiome(anchor).is(ModBiomes.SPARSE_HIVE_CAVES);
            BlockState comb = ModBlocks.HIVE_COMB.get().defaultBlockState(), air = Blocks.CAVE_AIR.defaultBlockState();
            float p1 = r.nextFloat() * 6.3F;
            // v3.4 (user: the long nests need not be so regular): the long ones bow into an arc and wander a little,
            // and taper towards their ends; the bend lies in the wall's plane
            float bowA = round ? 0 : (r.nextBoolean() ? 1 : -1) * (1.0F + r.nextFloat() * 1.6F), wigA = round ? 0 : 0.6F + r.nextFloat() * 0.5F;
            float bx, by, bz;
            if (wall.getAxis().isHorizontal()) { bx = 0; by = 1; bz = 0; } else { bx = -az; by = 0; bz = ax; }
            int reach = (int) Math.ceil(half + rad + 1.5F + Math.abs(bowA) + wigA);
            List<BlockPos> inside = new java.util.ArrayList<>();
            for (int dx = -reach; dx <= reach; dx++) for (int dy = -reach; dy <= reach; dy++) for (int dz = -reach; dz <= reach; dz++) {
                float vx = (float) Math.floor(cx) + dx + 0.5F - cx, vy = (float) Math.floor(cy) + dy + 0.5F - cy, vz = (float) Math.floor(cz) + dz + 0.5F - cz;
                float s = Math.max(-half, Math.min(half, vx * ax + vy * ay + vz * az));
                float t = half > 0 ? s / half : 0, off = bowA * (t * t - 0.35F) + wigA * (float) Math.sin(s * 0.7F + p1);
                float px = vx - ax * s - bx * off, py = (vy - ay * s - by * off) * (round ? 1.15F : 1.0F), pz = vz - az * s - bz * off;
                float lr = rad * (1 - 0.22F * t * t);
                float q = (float) Math.sqrt(px * px + py * py + pz * pz) / lr + 0.07F * (float) Math.sin(Math.atan2(pz, px) * 3 + p1 + s);
                if (q > 1) continue;
                BlockPos p = BlockPos.containing(cx + vx, cy + vy, cz + vz);
                BlockState old = level.getBlockState(p);
                if (old.is(Blocks.BEDROCK) || old.is(Blocks.SPAWNER) || !old.getFluidState().isEmpty()) continue;
                if (q > 1 - 1.25F / rad) {
                    set(level, p, comb);
                } else {
                    set(level, p, air);
                    inside.add(p);
                }
            }
            // the opening, facing the cave
            Direction out = wall.getOpposite();
            for (int t = 0; t <= (int) (rad + 2); t++) {
                BlockPos h = BlockPos.containing(cx + out.getStepX() * t, cy + out.getStepY() * t - (wall == Direction.UP ? 0 : 0.6F), cz + out.getStepZ() * t);
                for (BlockPos q : BlockPos.betweenClosed(h.offset(-1, -1, -1), h.offset(1, 0, 1))) {
                    if (level.getBlockState(q).is(comb.getBlock()) && (q.distSqr(h) <= 1 || out.getAxis().isVertical())) set(level, q, air);
                }
            }
            // inside (v2.4, user): honey blocks on the floor and the hive's stores - no eggs (they lie in clutches outside)
            for (BlockPos p : inside) {
                if (!level.getBlockState(p).isAir() || !level.getBlockState(p.below()).isFaceSturdy(level, p.below(), Direction.UP)) continue;
                if (r.nextInt(5) == 0) set(level, p, Blocks.HONEY_BLOCK.defaultBlockState());
                else if (r.nextInt(12) == 0) set(level, p, ModBlocks.HIVE_CACHE.get().defaultBlockState());
            }
            List<BlockPos> floor = inside.stream().filter(p -> level.getBlockState(p).isAir() && solid(level, p.below())).toList();
            if (!floor.isEmpty() && r.nextInt(eggCave ? 4 : 3) == 0) {
                BlockPos q = floor.get(r.nextInt(floor.size()));
                if (r.nextBoolean()) {
                    set(level, q, Blocks.SPAWNER.defaultBlockState());
                    if (level.getBlockEntity(q) instanceof SpawnerBlockEntity spawner) {
                        spawner.setEntityId(r.nextBoolean() ? EntityType.CAVE_SPIDER : EntityType.SILVERFISH, r);
                    }
                } else {
                    set(level, q, ModBlocks.HIVE_CACHE.get().defaultBlockState());
                }
            }
            return true;
        }
    }

    /** Quicksand pool: a sunken patch of quicksand on the cave floor. */
    static final class QuicksandPool extends Feature<NoneFeatureConfiguration> {
        QuicksandPool(Codec<NoneFeatureConfiguration> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            BlockPos c = floor(level, ctx.origin());
            if (c == null) return false;
            c = c.below();
            // v3.2: on the desert surface only on flat ground (a pit on a slope looks like a stripe of steps)
            if (level.getHeight(Heightmap.Types.WORLD_SURFACE_WG, c.getX(), c.getZ()) <= c.getY() + 1) {   // open to the sky (canSeeSky has no light data in worldgen)
                for (int dx = -4; dx <= 4; dx += 2) for (int dz = -4; dz <= 4; dz += 2)
                    if (Math.abs(level.getHeight(Heightmap.Types.WORLD_SURFACE_WG, c.getX() + dx, c.getZ() + dz) - 1 - c.getY()) > 1) return false;
            }
            float rx = 2 + r.nextFloat() * 2, rz = 2 + r.nextFloat() * 2;
            int depth = 2 + r.nextInt(2), filled = 0;
            for (int dx = -4; dx <= 4; dx++) for (int dz = -4; dz <= 4; dz++) {
                if ((dx / rx) * (dx / rx) + (dz / rz) * (dz / rz) > 1) continue;
                for (int dy = 0; dy < depth; dy++) {
                    BlockPos p = c.offset(dx, -dy, dz);
                    if (solid(level, p)) { set(level, p, ModBlocks.QUICKSAND.get().defaultBlockState()); filled++; }
                }
            }
            return filled > 0;
        }
    }

    // ------------------------------------------------------------------ waterfalls
    /**
     * Waterfall (v2.4, user): two kinds, both built against a hillside and both ending in a stone-rimmed pool.
     * <ul>
     *   <li>Vertical: where the ground drops 6+ blocks within three, a spring 1-3 wide opens just under the cliff top and
     *       the water falls straight down; behind the plunge pool a small cave is dug into the hill.</li>
     *   <li>Stepped: on a gentler slope, a chain of irregular pools, each overlapping the next and a step higher, so the
     *       water spills from one straight into the next, down to the biggest pool at the bottom.</li>
     * </ul>
     * The pools are ringed with mossy cobblestone, cobblestone and stone set unevenly, their beds are gravel, sand or clay
     * with seagrass, and ferns, grass, sugar cane and flowers grow around them.
     */
    static final class CliffSpring extends Feature<NoneFeatureConfiguration> {
        CliffSpring(Codec<NoneFeatureConfiguration> c) { super(c); }

        private static int height(WorldGenLevel level, BlockPos p) {
            return level.getHeight(Heightmap.Types.WORLD_SURFACE_WG, p.getX(), p.getZ());
        }

        private static BlockState roughStone(RandomSource r) {
            return switch (r.nextInt(4)) {
                case 0 -> Blocks.MOSSY_COBBLESTONE.defaultBlockState();
                case 1 -> Blocks.COBBLESTONE.defaultBlockState();
                case 2 -> Blocks.STONE.defaultBlockState();
                default -> Blocks.MOSSY_COBBLESTONE.defaultBlockState();
            };
        }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            BlockPos o = ctx.origin();
            int y0 = height(level, o);
            // the steepest way down
            Direction best = null;
            int bestDrop = 0, cliffK = -1;
            for (Direction d : Direction.Plane.HORIZONTAL) {
                int drop = y0 - height(level, o.relative(d, 8));
                if (drop > bestDrop) { bestDrop = drop; best = d; }
            }
            if (best == null || bestDrop < 4) return false;
            Direction d = best;
            for (int k = 1; k <= 3; k++) if (y0 - height(level, o.relative(d, k)) >= 6) { cliffK = k; break; }
            if (cliffK > 0) return vertical(level, r, o, d, y0, cliffK);
            return bestDrop <= 12 && stepped(level, r, o, d);   // stepped falls only on gentler slopes
        }

        private boolean vertical(WorldGenLevel level, RandomSource r, BlockPos o, Direction d, int y0, int cliffK) {
            int ys = y0 - 2 - r.nextInt(2);
            BlockPos face = o.relative(d, cliffK);
            if (height(level, face) > ys - 5) return false;
            BlockPos spring = new BlockPos(o.relative(d, cliffK - 1).getX(), ys, o.relative(d, cliffK - 1).getZ());
            int width = 2 + r.nextInt(3), placed = 0;   // v3.3: wider falls
            for (int w = -(width / 2); w <= width - 1 - width / 2; w++) {
                BlockPos s = spring.relative(d.getClockWise(), w);
                if (!solid(level, s.above()) || !solid(level, s.below()) || !solid(level, s.relative(d.getOpposite()))) continue;
                // (side walls only where the cliff itself is solid: no stones stuck onto the cliff face)
                boolean sealed = true;
                for (Direction side : List.of(d.getClockWise(), d.getCounterClockWise())) {
                    BlockPos n = s.relative(side);
                    if (!solid(level, n) && Math.abs(w + (side == d.getClockWise() ? 1 : -1)) > width / 2) sealed = false;
                }
                if (!sealed) continue;
                set(level, s, Blocks.WATER.defaultBlockState());
                level.scheduleTick(s, Fluids.WATER, 0);
                placed++;
            }
            if (placed == 0) return false;
            BlockPos land = new BlockPos(face.getX(), height(level, face) - 1, face.getZ()).relative(d);
            basin(level, r, land, 3 + r.nextInt(2));   // v3.3: a bigger plunge pool
            // a small cave in the hill behind the fall
            BlockPos room = land.relative(d.getOpposite(), 4).above(2);
            cave(level, r, room, d);
            // phase 9 (structures.md): the room behind the fall - a camp or a meditation room
            if (r.nextInt(5) < 3) StructureFeatures.furnishWaterfallRoom(level, r, room, d);
            return true;
        }

        /**
         * Stepped fall (v2.4): a chain of irregular pools down the slope, each overlapping the next and 1-3 blocks higher,
         * so the water spills straight from one into the next; the last pool is the biggest.
         */
        private boolean stepped(WorldGenLevel level, RandomSource r, BlockPos o, Direction d) {
            List<BlockPos> centers = new java.util.ArrayList<>();
            List<Float> radii = new java.util.ArrayList<>();
            BlockPos c = o;
            int L = height(level, c) - 1;
            float rad = 2.0F + r.nextFloat() * 1.2F;   // v3.3: bigger pools
            centers.add(new BlockPos(c.getX(), L, c.getZ()));
            radii.add(rad);
            for (int i = 0; i < 6; i++) {
                float next = 2.0F + r.nextFloat() * 1.2F;
                BlockPos n = null;
                int nl = 0;
                for (int extra = 0; extra <= 2 && n == null; extra++) {
                    BlockPos q = c.relative(d, Math.round(rad + next - 0.6F) + extra).relative(d.getClockWise(), r.nextInt(3) - 1);
                    int ql = height(level, q) - 1;
                    if (ql <= L - 1 && ql >= L - 3) { n = q; nl = ql; }
                    else if (ql < L - 3) break;   // too steep for the next step
                }
                if (n == null) break;
                // keep every pool (and its rim) inside the 3x3 chunks a feature may write to
                net.minecraft.world.level.ChunkPos cp = new net.minecraft.world.level.ChunkPos(o);
                if (n.getX() < cp.getMinBlockX() - 6 || n.getX() > cp.getMaxBlockX() + 6 || n.getZ() < cp.getMinBlockZ() - 6 || n.getZ() > cp.getMaxBlockZ() + 6) break;
                c = n; L = nl; rad = next;
                centers.add(new BlockPos(c.getX(), L, c.getZ()));
                radii.add(rad);
            }
            if (centers.size() < 3) return false;
            int last = centers.size() - 1;
            radii.set(last, 4.2F + r.nextFloat() * 1.2F);   // the bottom pool is the biggest (v3.3: much bigger)
            for (int i = 0; i <= last; i++) pool(level, r, centers.get(i), radii.get(i), i == last);
            plants(level, r, centers.get(last), radii.get(last));
            // phase 9 (structures.md, v3.2 user): sometimes a statue holding a sword stands in the bottom pool
            // v3.4 (user: rarer, never several close together): at most one per 24x24-chunk region (StructureFeatures)
            if (StructureFeatures.swordStatueAllowed(level, centers.get(last))) StructureFeatures.swordStatue(level, r, centers.get(last), d);
            if (r.nextBoolean()) cave(level, r, o.relative(d, 2).below(4), d);
            return true;
        }

        /**
         * One pool: an irregular blob of water at the centre's level, its bed gravel / sand / clay with some seagrass,
         * dug into the slope where the ground is higher, and held by uneven rough stones wherever the ground around is
         * lower. Later (lower) pools cut through the rims of earlier ones, which makes the spill-overs.
         */
        private void pool(WorldGenLevel level, RandomSource r, BlockPos c, float rad, boolean bottom) {
            float phase = r.nextFloat() * 6.3F;
            int reach = (int) Math.ceil(rad * 1.34F + 1.5F);   // the wobbly edge plus its stone rim
            for (int dx = -reach; dx <= reach; dx++) for (int dz = -reach; dz <= reach; dz++) {
                double ang = Math.atan2(dz, dx), dist = Math.sqrt(dx * dx + dz * dz);
                double edge = rad * (1 + 0.22 * Math.sin(3 * ang + phase) + 0.12 * Math.sin(5 * ang - phase));
                BlockPos p = c.offset(dx, 0, dz);
                if (dist <= edge) {
                    // v3.3: the bottom pool is two deep away from its edge
                    boolean deep = bottom && dist <= edge - 1.5;
                    if (deep) { set(level, p.below(), Blocks.WATER.defaultBlockState()); level.scheduleTick(p.below(), Fluids.WATER, 0); }
                    set(level, deep ? p.below(2) : p.below(), switch (r.nextInt(6)) { case 0, 1 -> Blocks.SAND.defaultBlockState(); case 2 -> Blocks.CLAY.defaultBlockState(); default -> Blocks.GRAVEL.defaultBlockState(); });
                    if (deep && r.nextInt(3) == 0) { set(level, p.below(), Blocks.SEAGRASS.defaultBlockState()); }
                    set(level, p, r.nextInt(bottom ? 3 : 5) == 0 ? Blocks.SEAGRASS.defaultBlockState() : Blocks.WATER.defaultBlockState());
                    level.scheduleTick(p, Fluids.WATER, 0);
                    for (int up = 1; up <= 4; up++) {
                        BlockPos q = p.above(up);
                        BlockState st = level.getBlockState(q);
                        if (st.isAir() || st.is(BlockTags.LEAVES) || st.is(BlockTags.LOGS)) break;
                        set(level, q, Blocks.AIR.defaultBlockState());   // dig into the slope
                    }
                } else if (dist <= edge + 1.3) {
                    BlockState st = level.getBlockState(p);
                    if (st.getFluidState().is(Fluids.WATER)) continue;   // a pool already there: leave the spill-over open
                    // v3.3 (user): every pool is ringed with stone - the rim is always stone, built up from the ground
                    // below it (no floating stones), and here and there a stone sticks up above the water
                    int gap = 0;
                    while (gap < 6 && !solid(level, p.below(gap + 1))) gap++;
                    for (int k = 0; k <= gap; k++) set(level, p.below(k), roughStone(r));
                    if (dist > edge + 0.6 && r.nextInt(4) == 0 && level.isEmptyBlock(p.above())) set(level, p.above(), roughStone(r));
                }
            }
        }

        /** A pool ringed with uneven stones (the vertical fall's plunge pool). */
        private void basin(WorldGenLevel level, RandomSource r, BlockPos c, int rad) {
            pool(level, r, c, rad + 0.5F, true);
            plants(level, r, c, rad);
        }

        /** Ferns, grass, blue orchids and sugar cane around a pool. */
        private void plants(WorldGenLevel level, RandomSource r, BlockPos c, float rad) {
            for (int i = 0; i < 18; i++) {
                double a = r.nextDouble() * Math.PI * 2, dist = rad * 1.3 + 1.5 + r.nextDouble() * 1.5;
                BlockPos g = level.getHeightmapPos(Heightmap.Types.WORLD_SURFACE_WG, c.offset((int) Math.round(Math.cos(a) * dist), 0, (int) Math.round(Math.sin(a) * dist)));
                BlockState under = level.getBlockState(g.below());
                if (!level.isEmptyBlock(g) || !(under.is(BlockTags.DIRT) || under.is(BlockTags.SAND))) continue;
                BlockState plant = switch (r.nextInt(6)) {
                    case 0 -> Blocks.FERN.defaultBlockState();
                    case 1 -> Blocks.BLUE_ORCHID.defaultBlockState();
                    case 2 -> Blocks.SUGAR_CANE.defaultBlockState();
                    default -> Blocks.SHORT_GRASS.defaultBlockState();
                };
                if (plant.canSurvive(level, g)) {
                    set(level, g, plant);
                    if (plant.is(Blocks.SUGAR_CANE)) for (int h = 1; h < 1 + r.nextInt(3) && level.isEmptyBlock(g.above(h)); h++) set(level, g.above(h), plant);
                }
            }
        }

        /** A small cave pocket dug into the hill (only through rock and soil, never through water). */
        private void cave(WorldGenLevel level, RandomSource r, BlockPos c, Direction d) {
            float rx = 2.5F + r.nextFloat(), ry = 2.0F + r.nextFloat() * 0.5F, rz = 2.5F + r.nextFloat();
            for (int dx = -4; dx <= 4; dx++) for (int dy = -3; dy <= 3; dy++) for (int dz = -4; dz <= 4; dz++) {
                if ((dx / rx) * (dx / rx) + (dy / ry) * (dy / ry) + (dz / rz) * (dz / rz) > 1) continue;
                BlockPos p = c.offset(dx, dy, dz);
                BlockState s = level.getBlockState(p);
                if ((s.is(BlockTags.BASE_STONE_OVERWORLD) || s.is(BlockTags.DIRT) || s.is(Blocks.GRAVEL)) && level.getFluidState(p.above()).isEmpty()) {
                    set(level, p, Blocks.CAVE_AIR.defaultBlockState());
                }
            }
        }
    }

    // ------------------------------------------------------------------ polluted sea
    /**
     * Dark ruins (v2.3, user: the ruins on the polluted sea floor should be dark too): runs after the structures; in the
     * polluted waters (the polluted sea and both dark harbours) every stone-brick, sandstone or cobblestone block of the
     * chunk below sea level - the vanilla ocean ruins - becomes its deepslate counterpart (stairs and slabs keep their
     * shape), and (v2.4) seagrass and kelp become their polluted kinds.
     */
    static final class DarkRuins extends Feature<NoneFeatureConfiguration> {
        DarkRuins(Codec<NoneFeatureConfiguration> c) { super(c); }

        private static final java.util.Map<Block, Block> SWAP = new java.util.HashMap<>();

        private static void map() {
            if (!SWAP.isEmpty()) return;
            Object[][] pairs = {
                    { Blocks.STONE_BRICKS, Blocks.DEEPSLATE_BRICKS }, { Blocks.CRACKED_STONE_BRICKS, Blocks.CRACKED_DEEPSLATE_BRICKS },
                    { Blocks.MOSSY_STONE_BRICKS, Blocks.DEEPSLATE_TILES }, { Blocks.CHISELED_STONE_BRICKS, Blocks.CHISELED_DEEPSLATE },
                    { Blocks.STONE_BRICK_STAIRS, Blocks.DEEPSLATE_BRICK_STAIRS }, { Blocks.STONE_BRICK_SLAB, Blocks.DEEPSLATE_BRICK_SLAB },
                    { Blocks.MOSSY_STONE_BRICK_STAIRS, Blocks.DEEPSLATE_TILE_STAIRS }, { Blocks.MOSSY_STONE_BRICK_SLAB, Blocks.DEEPSLATE_TILE_SLAB },
                    { Blocks.STONE_BRICK_WALL, Blocks.DEEPSLATE_BRICK_WALL }, { Blocks.MOSSY_STONE_BRICK_WALL, Blocks.DEEPSLATE_TILE_WALL },
                    { Blocks.SANDSTONE, Blocks.DEEPSLATE_TILES }, { Blocks.CUT_SANDSTONE, Blocks.POLISHED_DEEPSLATE },
                    { Blocks.SMOOTH_SANDSTONE, Blocks.POLISHED_DEEPSLATE }, { Blocks.CHISELED_SANDSTONE, Blocks.CHISELED_DEEPSLATE },
                    { Blocks.SANDSTONE_STAIRS, Blocks.DEEPSLATE_TILE_STAIRS }, { Blocks.SANDSTONE_SLAB, Blocks.DEEPSLATE_TILE_SLAB },
                    { Blocks.SANDSTONE_WALL, Blocks.DEEPSLATE_TILE_WALL }, { Blocks.CUT_SANDSTONE_SLAB, Blocks.POLISHED_DEEPSLATE_SLAB },
                    { Blocks.COBBLESTONE, Blocks.COBBLED_DEEPSLATE }, { Blocks.MOSSY_COBBLESTONE, Blocks.COBBLED_DEEPSLATE },
                    { Blocks.COBBLESTONE_STAIRS, Blocks.COBBLED_DEEPSLATE_STAIRS }, { Blocks.COBBLESTONE_SLAB, Blocks.COBBLED_DEEPSLATE_SLAB },
                    // v2.4: the water plants of the polluted waters are polluted too
                    { Blocks.SEAGRASS, ModBlocks.POLLUTED_SEAGRASS.get() }, { Blocks.KELP, ModBlocks.POLLUTED_KELP.get() },
                    { Blocks.KELP_PLANT, ModBlocks.POLLUTED_KELP_PLANT.get() } };
            for (Object[] p : pairs) SWAP.put((Block) p[0], (Block) p[1]);
        }

        @Override
        public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {
            map();
            WorldGenLevel level = ctx.level();
            int x0 = ctx.origin().getX() & ~15, z0 = ctx.origin().getZ() & ~15, sea = level.getSeaLevel();
            BlockPos.MutableBlockPos p = new BlockPos.MutableBlockPos();
            boolean any = false;
            for (int dx = 0; dx < 16; dx++) for (int dz = 0; dz < 16; dz++) {
                int floorY = level.getHeight(Heightmap.Types.OCEAN_FLOOR_WG, x0 + dx, z0 + dz);
                if (!level.getBiome(p.set(x0 + dx, Math.min(sea - 1, floorY), z0 + dz)).is(ModBiomes.POLLUTED_WATER)) continue;
                for (int y = floorY - 8; y < sea; y++) {
                    p.set(x0 + dx, y, z0 + dz);
                    BlockState s = level.getBlockState(p);
                    if (s.is(Blocks.TALL_SEAGRASS)) {
                        level.setBlock(p, s.getValue(net.minecraft.world.level.block.TallSeagrassBlock.HALF) == net.minecraft.world.level.block.state.properties.DoubleBlockHalf.LOWER
                                ? ModBlocks.POLLUTED_SEAGRASS.get().defaultBlockState() : Blocks.WATER.defaultBlockState(), 2);
                        any = true;
                        continue;
                    }
                    Block to = SWAP.get(s.getBlock());
                    if (to == null) continue;
                    level.setBlock(p, to.withPropertiesOf(s), 2);
                    any = true;
                }
            }
            return any;
        }
    }

    /** Helper used by BiomeData: every block our cave features may put next to ores etc. */
    public static List<Block> caveStones() {
        return List.of(ModBlocks.HIVE_ROCK.base.get(), ModBlocks.INK_STAINED_STONE.base.get());
    }
}
