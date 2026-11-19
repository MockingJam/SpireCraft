package com.mockingjam.spirecraft.datagen;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.block.WoodSet;
import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mockingjam.spirecraft.registry.ModEntities;
import com.mockingjam.spirecraft.worldgen.ModBiomes;
import com.mockingjam.spirecraft.worldgen.ModFeatures;
import com.mockingjam.spirecraft.worldgen.V2Features;
import java.util.ArrayList;
import java.util.List;
import java.util.OptionalInt;
import java.util.Set;
import net.minecraft.core.Direction;
import net.minecraft.core.HolderGetter;
import net.minecraft.core.RegistrySetBuilder;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.core.registries.Registries;
import net.minecraft.data.worldgen.BiomeDefaultFeatures;
import net.minecraft.data.worldgen.BootstrapContext;
import net.minecraft.data.worldgen.features.FeatureUtils;
import net.minecraft.data.worldgen.placement.AquaticPlacements;
import net.minecraft.data.worldgen.placement.PlacementUtils;
import net.minecraft.resources.ResourceKey;
import net.minecraft.util.valueproviders.ConstantInt;
import net.minecraft.util.valueproviders.UniformInt;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.MobCategory;
import net.minecraft.world.level.biome.AmbientMoodSettings;
import net.minecraft.world.level.biome.AmbientParticleSettings;
import net.minecraft.world.level.biome.Biome;
import net.minecraft.world.level.biome.BiomeGenerationSettings;
import net.minecraft.world.level.biome.BiomeSpecialEffects;
import net.minecraft.world.level.biome.MobSpawnSettings;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.HugeMushroomBlock;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.levelgen.GenerationStep;
import net.minecraft.world.level.levelgen.VerticalAnchor;
import net.minecraft.world.level.levelgen.blockpredicates.BlockPredicate;
import net.minecraft.world.level.levelgen.carver.ConfiguredWorldCarver;
import net.minecraft.world.level.levelgen.feature.ConfiguredFeature;
import net.minecraft.world.level.levelgen.feature.Feature;
import net.minecraft.world.level.levelgen.feature.configurations.BlockColumnConfiguration;
import net.minecraft.world.level.levelgen.feature.configurations.HugeMushroomFeatureConfiguration;
import net.minecraft.world.level.levelgen.feature.configurations.NoneFeatureConfiguration;
import net.minecraft.world.level.levelgen.feature.configurations.SimpleBlockConfiguration;
import net.minecraft.world.level.levelgen.feature.configurations.TreeConfiguration;
import net.minecraft.world.level.levelgen.feature.featuresize.TwoLayersFeatureSize;
import net.minecraft.world.level.levelgen.feature.foliageplacers.BlobFoliagePlacer;
import net.minecraft.world.level.levelgen.feature.foliageplacers.RandomSpreadFoliagePlacer;
import net.minecraft.world.level.levelgen.feature.stateproviders.BlockStateProvider;
import net.minecraft.world.level.levelgen.feature.stateproviders.NoiseThresholdProvider;
import net.minecraft.world.level.levelgen.feature.trunkplacers.BendingTrunkPlacer;
import net.minecraft.world.level.levelgen.feature.trunkplacers.StraightTrunkPlacer;
import net.minecraft.world.level.levelgen.placement.BiomeFilter;
import net.minecraft.world.level.levelgen.placement.BlockPredicateFilter;
import net.minecraft.world.level.levelgen.placement.CountPlacement;
import net.minecraft.world.level.levelgen.placement.EnvironmentScanPlacement;
import net.minecraft.world.level.levelgen.placement.HeightRangePlacement;
import net.minecraft.world.level.levelgen.placement.InSquarePlacement;
import net.minecraft.world.level.levelgen.placement.PlacedFeature;
import net.minecraft.world.level.levelgen.placement.PlacementModifier;
import net.minecraft.world.level.levelgen.placement.RandomOffsetPlacement;
import net.minecraft.world.level.levelgen.placement.RarityFilter;
import net.minecraft.world.level.levelgen.placement.SurfaceWaterDepthFilter;
import net.minecraft.world.level.levelgen.synth.NormalNoise;
import net.minecraft.world.level.material.Fluids;

/**
 * Worldgen registries for the twelve v2 biomes (docs/design/biomes_v2.md): configured features, placed features and the
 * biomes. Vanilla feature groups are added in the order of the vanilla biome each one is modelled on (swamp, beach,
 * ocean, windswept forest, jungle, dripstone caves) so the global feature order stays acyclic; our own features come
 * after them in every step, always in the single order of {@link #OURS}.
 */
public final class BiomeData {
    private BiomeData() {}

    public static RegistrySetBuilder builder() {
        return new RegistrySetBuilder()
                .add(Registries.CONFIGURED_FEATURE, BiomeData::configured)
                .add(Registries.PLACED_FEATURE, BiomeData::placed)
                .add(Registries.BIOME, BiomeData::biomes);
    }

    // ------------------------------------------------------------------ keys
    private static ResourceKey<ConfiguredFeature<?, ?>> cf(String name) {
        return ResourceKey.create(Registries.CONFIGURED_FEATURE, SpireCraft.id(name));
    }

    private static ResourceKey<PlacedFeature> pf(String name) {
        return ResourceKey.create(Registries.PLACED_FEATURE, SpireCraft.id(name));
    }

    /** One of our placed features, with its generation step. */
    record Ours(ResourceKey<PlacedFeature> key, GenerationStep.Decoration step) {}

    private static Ours ours(String name, GenerationStep.Decoration step) {
        return new Ours(pf(name), step);
    }

    static final GenerationStep.Decoration RAW = GenerationStep.Decoration.RAW_GENERATION, LOCAL = GenerationStep.Decoration.LOCAL_MODIFICATIONS,
            VEG = GenerationStep.Decoration.VEGETAL_DECORATION, UNDER = GenerationStep.Decoration.UNDERGROUND_DECORATION,
            TOP = GenerationStep.Decoration.TOP_LAYER_MODIFICATION;

    // our placed features, in the one global order every biome adds them in
    static final Ours SURFACE_STONE_FOREST = ours("surface_stone_forest_docks", RAW), SURFACE_BEACH_DOCKS = ours("surface_beach_docks", RAW),
            SURFACE_POLLUTED_SEA = ours("surface_polluted_sea", RAW), SURFACE_WATERFALLS = ours("surface_waterfalls", RAW),
            SURFACE_OVERGROWTH = ours("surface_overgrowth", RAW), SURFACE_MISTY = ours("surface_misty_overgrowth", RAW),
            SURFACE_MUSHROOM = ours("surface_mushroom_overgrowth", RAW),
            STONE_INK = ours("cave_stone_ink", UNDER), STONE_HIVE = ours("cave_stone_hive", UNDER), STONE_SPARSE_HIVE = ours("cave_stone_sparse_hive", UNDER),
            STONE_EGG_HIVE = ours("cave_stone_egg_hive", UNDER), STONE_QUICKSAND = ours("cave_stone_quicksand", UNDER),
            STONE_SPIKES = ours("stone_spikes", LOCAL), STONE_SPIKES_SPARSE = ours("stone_spikes_sparse", LOCAL), STONE_SPIKES_WATER = ours("stone_spikes_water", LOCAL), MUD_DISKS = ours("overgrowth_mud_disks", LOCAL), PUDDLES = ours("puddles", LOCAL),
            STONE_PILES = ours("stone_piles", LOCAL), FALLEN_LOGS = ours("fallen_rotten_logs", LOCAL), ROTTEN_STUMPS = ours("rotten_stumps", LOCAL),
            DOCK_WALL = ours("dock_wall", LOCAL), RUIN_PILLAR = ours("ruin_pillar", LOCAL),
            CLIFF_SPRINGS = ours("cliff_springs", LOCAL), INK_POOLS = ours("ink_pools", LOCAL), HIVE_NESTS = ours("hive_nests", LOCAL),
            HIVE_NESTS_SPARSE = ours("hive_nests_sparse", LOCAL), EGG_CLUTCHES = ours("egg_clutches", LOCAL),
            EGG_CLUTCHES_DENSE = ours("egg_clutches_dense", LOCAL), DARK_RUINS = ours("dark_ruins", TOP), QUICKSAND_POOLS = ours("quicksand_pools", LOCAL), SURFACE_QUICKSAND = ours("surface_quicksand", LOCAL),
            TREES_GNARLWOOD = ours("trees_tall_gnarlwood", VEG), TREES_GNARLWOOD_SPARSE = ours("trees_tall_gnarlwood_sparse", VEG),
            GIANT_LANTERN = ours("giant_lantern_caps", VEG), GIANT_CORAL = ours("giant_coral_caps", VEG),
            GIANT_BLUEBELL = ours("giant_bluebells", VEG), HUGE_FOGCAP = ours("huge_fogcaps", VEG), GIANT_HIVE_SHROOMS = ours("giant_hive_shrooms", VEG), SHROOM_GROVES = ours("shroom_groves", VEG), MYCELIUM_PATCHES = ours("mycelium_patches", TOP),
            POLLUTED_REEFS = ours("polluted_reefs", VEG), POLLUTED_SEAGRASS = ours("polluted_seagrass", VEG), POLLUTED_KELP = ours("polluted_kelp", VEG),
            SHORE_REEDS = ours("shore_reeds", VEG), PATCH_ROTTEN_SHRUB = ours("patch_rotten_shrub", VEG),
            PATCH_SPIRE_FERN = ours("patch_spire_fern", VEG), PATCH_FOGCAP = ours("patch_fogcap", VEG), PATCH_LANTERN_CAP = ours("patch_lantern_cap", VEG),
            PATCH_CORAL_CAP = ours("patch_coral_cap", VEG), PATCH_BLUEBELL_CAP = ours("patch_bluebell_cap", VEG), PATCH_GLOW_SHRUB = ours("patch_glow_shrub", VEG),
            PATCH_GLOW_MOSS = ours("patch_glow_moss", VEG), PATCH_MOSS_CARPET = ours("patch_moss_carpet", VEG), MUSHROOMS_DENSE = ours("patch_mushrooms_dense", VEG), GLOWVINES = ours("hanging_glowvines", VEG),
            PATCH_INK_BUBBLE = ours("patch_ink_bubble", VEG), PATCH_HIVE_EGG = ours("patch_hive_egg", VEG), PATCH_HIVE_EGG_DENSE = ours("patch_hive_egg_dense", VEG),
            PATCH_HIVE_SHROOM = ours("patch_hive_shroom", VEG), PATCH_HIVE_SHROOM_FEW = ours("patch_hive_shroom_few", VEG);

    static final List<Ours> OURS = List.of(SURFACE_STONE_FOREST, SURFACE_BEACH_DOCKS, SURFACE_POLLUTED_SEA, SURFACE_WATERFALLS, SURFACE_OVERGROWTH,
            SURFACE_MISTY, SURFACE_MUSHROOM, STONE_INK, STONE_HIVE, STONE_SPARSE_HIVE, STONE_EGG_HIVE, STONE_QUICKSAND,
            STONE_SPIKES, STONE_SPIKES_SPARSE, STONE_SPIKES_WATER, MUD_DISKS, PUDDLES, STONE_PILES, FALLEN_LOGS, ROTTEN_STUMPS, DOCK_WALL, RUIN_PILLAR, CLIFF_SPRINGS,
            INK_POOLS, HIVE_NESTS, HIVE_NESTS_SPARSE, EGG_CLUTCHES, EGG_CLUTCHES_DENSE, QUICKSAND_POOLS,
            TREES_GNARLWOOD, TREES_GNARLWOOD_SPARSE, GIANT_LANTERN, GIANT_CORAL, GIANT_BLUEBELL, HUGE_FOGCAP, GIANT_HIVE_SHROOMS, SHROOM_GROVES,
            POLLUTED_REEFS, POLLUTED_SEAGRASS, POLLUTED_KELP, SHORE_REEDS, PATCH_ROTTEN_SHRUB, PATCH_SPIRE_FERN, PATCH_FOGCAP,
            PATCH_LANTERN_CAP, PATCH_CORAL_CAP, PATCH_BLUEBELL_CAP, PATCH_GLOW_SHRUB, PATCH_GLOW_MOSS, PATCH_MOSS_CARPET, MUSHROOMS_DENSE, GLOWVINES,
            PATCH_INK_BUBBLE, PATCH_HIVE_EGG, PATCH_HIVE_EGG_DENSE, PATCH_HIVE_SHROOM, PATCH_HIVE_SHROOM_FEW, DARK_RUINS, MYCELIUM_PATCHES);

    // configured-feature keys (one per configured feature; several placed features may share one)
    static final ResourceKey<ConfiguredFeature<?, ?>> CF_STONE_SPIKE = cf("stone_spike"), CF_PUDDLE = cf("puddle"), CF_STONE_PILE = cf("stone_pile"),
            CF_FALLEN_LOG = cf("fallen_rotten_log"), CF_ROTTEN_STUMP = cf("rotten_stump"),
            CF_DOCK_WALL = cf("dock_wall"), CF_RUIN_PILLAR = cf("ruin_pillar"), CF_CLIFF_SPRING = cf("cliff_spring"), CF_INK_POOL = cf("ink_pool"),
            CF_HIVE_NEST = cf("hive_nest"), CF_EGG_CLUTCH = cf("egg_clutch"), CF_DARK_RUINS = cf("dark_ruins"), CF_QUICKSAND_POOL = cf("quicksand_pool"), CF_GIANT_LANTERN = cf("giant_lantern_cap"),
            CF_GIANT_CORAL = cf("giant_coral_cap"), CF_GIANT_BLUEBELL = cf("giant_bluebell"), CF_GIANT_HIVE_SHROOM = cf("giant_hive_shroom"), CF_SHROOM_GROVE = cf("shroom_grove"), CF_MYCELIUM_PATCHES = cf("mycelium_patches"), CF_POLLUTED_REEF = cf("polluted_reef"),
            CF_POLLUTED_SEAGRASS = cf("polluted_seagrass"), CF_POLLUTED_KELP = cf("polluted_kelp"), CF_SHORE_REEDS = cf("shore_reeds"),
            CF_GLOWVINES = cf("hanging_glowvines"), CF_DENSE_MUSHROOMS = cf("patch_mushrooms_dense");

    private static ResourceKey<ConfiguredFeature<?, ?>> cfOf(Ours o) {
        return ResourceKey.create(Registries.CONFIGURED_FEATURE, o.key().location());
    }

    // ------------------------------------------------------------------ configured features
    private static void configured(BootstrapContext<ConfiguredFeature<?, ?>> ctx) {
        // Trees (also what the saplings grow). Gnarlwood is the tall, kinked canopy tree (V2Features.TallGnarlwood).
        FeatureUtils.register(ctx, ModBlocks.GNARLWOOD.tree, V2Features.TALL_GNARLWOOD.get(), NoneFeatureConfiguration.INSTANCE);
        FeatureUtils.register(ctx, ModBlocks.HUGE_FOGCAP_FEATURE, Feature.HUGE_BROWN_MUSHROOM, new HugeMushroomFeatureConfiguration(
                BlockStateProvider.simple(ModBlocks.FOGCAP_BLOCK.get().defaultBlockState().setValue(HugeMushroomBlock.UP, true).setValue(HugeMushroomBlock.DOWN, false)),
                BlockStateProvider.simple(Blocks.MUSHROOM_STEM.defaultBlockState().setValue(HugeMushroomBlock.UP, false).setValue(HugeMushroomBlock.DOWN, false)),
                3));

        // Hand-written features
        none(ctx, CF_STONE_SPIKE, V2Features.STONE_SPIKE.get());
        none(ctx, CF_PUDDLE, V2Features.PUDDLE.get());
        none(ctx, CF_STONE_PILE, V2Features.STONE_PILE.get());
        none(ctx, CF_FALLEN_LOG, V2Features.FALLEN_LOG.get());
        none(ctx, CF_ROTTEN_STUMP, V2Features.ROTTEN_STUMP.get());
        none(ctx, CF_DOCK_WALL, ModFeatures.DOCK_WALL.get());
        FeatureUtils.register(ctx, cfOf(MUD_DISKS), Feature.DISK, new net.minecraft.world.level.levelgen.feature.configurations.DiskConfiguration(
                net.minecraft.world.level.levelgen.feature.stateproviders.RuleBasedBlockStateProvider.simple(Blocks.MUD),
                BlockPredicate.matchesBlocks(List.of(Blocks.DIRT, Blocks.GRASS_BLOCK, Blocks.SAND, Blocks.GRAVEL, Blocks.CLAY, Blocks.COARSE_DIRT)), UniformInt.of(2, 4), 1));
        none(ctx, CF_RUIN_PILLAR, ModFeatures.RUIN_PILLAR.get());
        none(ctx, CF_CLIFF_SPRING, V2Features.CLIFF_SPRING.get());
        none(ctx, CF_INK_POOL, V2Features.INK_POOL.get());
        none(ctx, CF_HIVE_NEST, V2Features.HIVE_NEST.get());
        none(ctx, CF_EGG_CLUTCH, V2Features.EGG_CLUTCH.get());
        none(ctx, CF_DARK_RUINS, V2Features.DARK_RUINS.get());
        none(ctx, CF_QUICKSAND_POOL, V2Features.QUICKSAND_POOL.get());
        none(ctx, CF_GIANT_LANTERN, V2Features.GIANT_LANTERN_CAP.get());
        none(ctx, CF_GIANT_CORAL, V2Features.GIANT_CORAL_CAP.get());
        none(ctx, CF_GIANT_BLUEBELL, V2Features.GIANT_BLUEBELL.get());
        none(ctx, CF_GIANT_HIVE_SHROOM, V2Features.GIANT_HIVE_SHROOM.get());
        none(ctx, CF_SHROOM_GROVE, V2Features.SHROOM_GROVE.get());
        none(ctx, CF_MYCELIUM_PATCHES, V2Features.MYCELIUM_PATCHES.get());
        none(ctx, CF_POLLUTED_REEF, V2Features.POLLUTED_REEF.get());
        none(ctx, CF_SHORE_REEDS, V2Features.SHORE_REEDS.get());
        none(ctx, CF_GLOWVINES, ModFeatures.HANGING_GLOWVINES.get());

        // Water plants: polluted seagrass on the sea floor, polluted kelp columns
        // v2.7: only into water (seagrass itself does not check, so the patch grew it on dry land)
        FeatureUtils.register(ctx, CF_POLLUTED_SEAGRASS, Feature.RANDOM_PATCH, new net.minecraft.world.level.levelgen.feature.configurations.RandomPatchConfiguration(48, 7, 3,
                PlacementUtils.filtered(Feature.SIMPLE_BLOCK, new SimpleBlockConfiguration(BlockStateProvider.simple(ModBlocks.POLLUTED_SEAGRASS.get())),
                        BlockPredicate.matchesBlocks(Blocks.WATER))));
        FeatureUtils.register(ctx, CF_POLLUTED_KELP, Feature.BLOCK_COLUMN, new BlockColumnConfiguration(List.of(
                BlockColumnConfiguration.layer(UniformInt.of(2, 9), BlockStateProvider.simple(ModBlocks.POLLUTED_KELP_PLANT.get())),
                BlockColumnConfiguration.layer(ConstantInt.of(1), BlockStateProvider.simple(ModBlocks.POLLUTED_KELP.get()))),
                Direction.UP, BlockPredicate.matchesFluids(Fluids.WATER), true));

        // Plant patches (SIMPLE_BLOCK checks canSurvive; double plants place both halves)
        patch(ctx, cfOf(PATCH_ROTTEN_SHRUB), ModBlocks.ROTTEN_SHRUB.get(), 24);
        patch(ctx, cfOf(PATCH_SPIRE_FERN), ModBlocks.SPIRE_FERN.get(), 32);
        patch(ctx, cfOf(PATCH_FOGCAP), ModBlocks.FOGCAP.get(), 24);
        patch(ctx, cfOf(PATCH_LANTERN_CAP), ModBlocks.LANTERN_CAP.get(), 20);
        patch(ctx, cfOf(PATCH_CORAL_CAP), ModBlocks.CORAL_CAP.get(), 20);
        patch(ctx, cfOf(PATCH_BLUEBELL_CAP), ModBlocks.BLUEBELL_CAP.get(), 24);
        patch(ctx, cfOf(PATCH_GLOW_SHRUB), ModBlocks.GLOW_SHRUB.get(), 16);
        // carpets only on the ground blocks themselves - not on grass plants, not on the leaves (user, v2.3)
        groundPatch(ctx, cfOf(PATCH_GLOW_MOSS), ModBlocks.GLOW_MOSS_CARPET.get(), 32);
        groundPatch(ctx, cfOf(PATCH_MOSS_CARPET), Blocks.MOSS_CARPET, 48);
        patch(ctx, cfOf(PATCH_INK_BUBBLE), ModBlocks.INK_BUBBLE.get(), 24);
        FeatureUtils.register(ctx, cfOf(PATCH_HIVE_EGG), Feature.RANDOM_PATCH, FeatureUtils.simplePatchConfiguration(Feature.SIMPLE_BLOCK,
                new SimpleBlockConfiguration(new net.minecraft.world.level.levelgen.feature.stateproviders.RandomizedIntStateProvider(
                        BlockStateProvider.simple(ModBlocks.HIVE_EGG.get()), net.minecraft.world.level.block.TurtleEggBlock.EGGS, UniformInt.of(1, 4))),
                List.of(), 16));
        patch(ctx, cfOf(PATCH_HIVE_SHROOM), ModBlocks.HIVE_SHROOM.get(), 20);
        FeatureUtils.register(ctx, CF_DENSE_MUSHROOMS, Feature.RANDOM_PATCH, FeatureUtils.simplePatchConfiguration(Feature.SIMPLE_BLOCK,
                new SimpleBlockConfiguration(new net.minecraft.world.level.levelgen.feature.stateproviders.WeightedStateProvider(
                        net.minecraft.util.random.WeightedList.<BlockState>builder().add(ModBlocks.LANTERN_CAP.get().defaultBlockState(), 3)
                                .add(ModBlocks.CORAL_CAP.get().defaultBlockState(), 3).add(ModBlocks.BLUEBELL_CAP.get().defaultBlockState(), 3)
                                .add(Blocks.RED_MUSHROOM.defaultBlockState(), 2).add(Blocks.BROWN_MUSHROOM.defaultBlockState(), 1))),
                List.of(), 48));

        // Biome surfaces (run in RAW_GENERATION, before any vegetation)
        BlockState mud = Blocks.MUD.defaultBlockState(), sludge = ModBlocks.SLUDGE.get().defaultBlockState(), grass = Blocks.GRASS_BLOCK.defaultBlockState(),
                darkSand = ModBlocks.DARK_SAND.get().defaultBlockState();
        // the dark harbours: mud, dark sand and sludge down to 5 blocks; bare stone and gravel are covered too (v2.3)
        FeatureUtils.register(ctx, cfOf(SURFACE_STONE_FOREST), ModFeatures.BIOME_SURFACE.get(), new ModFeatures.SurfaceConfig(ModBiomes.STONE_FOREST_DOCKS,
                patches(103L, 0.04F, 0.0F, 0.95F, mud, sludge, darkSand), BlockStateProvider.simple(Blocks.MUD), 5, true));
        FeatureUtils.register(ctx, cfOf(SURFACE_BEACH_DOCKS), ModFeatures.BIOME_SURFACE.get(), new ModFeatures.SurfaceConfig(ModBiomes.BEACH_DOCKS,
                patches(104L, 0.04F, -0.2F, 0.95F, mud, darkSand, darkSand, sludge), BlockStateProvider.simple(Blocks.MUD), 5, true));
        FeatureUtils.register(ctx, cfOf(SURFACE_POLLUTED_SEA), ModFeatures.BIOME_SURFACE.get(), new ModFeatures.SurfaceConfig(ModBiomes.POLLUTED_SEA,
                patches(107L, 0.04F, -0.1F, 0.95F, mud, sludge, darkSand), BlockStateProvider.simple(Blocks.MUD), 3, true));
        surface(ctx, cfOf(SURFACE_WATERFALLS), ModBiomes.WATERFALLS, patches(108L, 0.09F, 0.3F, 0.8F, grass, Blocks.MOSS_BLOCK.defaultBlockState()),
                BlockStateProvider.simple(Blocks.DIRT), 0);
        BlockState podzol = Blocks.PODZOL.defaultBlockState(), mossBlock = Blocks.MOSS_BLOCK.defaultBlockState();
        surface(ctx, cfOf(SURFACE_OVERGROWTH), ModBiomes.OVERGROWTH, patches(101L, 0.035F, 0.05F, 1.0F, grass, podzol, podzol, mossBlock),
                BlockStateProvider.simple(Blocks.DIRT), 0);
        surface(ctx, cfOf(SURFACE_MISTY), ModBiomes.MISTY_OVERGROWTH, patches(102L, 0.035F, 0.05F, 1.0F, grass, mossBlock, podzol),
                BlockStateProvider.simple(Blocks.DIRT), 0);
        surface(ctx, cfOf(SURFACE_MUSHROOM), ModBiomes.MUSHROOM_OVERGROWTH, patches(109L, 0.035F, -0.1F, 1.0F, grass,
                Blocks.MYCELIUM.defaultBlockState(), Blocks.MYCELIUM.defaultBlockState(), podzol), BlockStateProvider.simple(Blocks.DIRT), 0);

        // Cave rock: the walls of each cave biome and its ores - see V2Features.CaveStone (style 0, ink, does nothing now)
        caveStone(ctx, cfOf(STONE_INK), ModBiomes.INK_SPRING_CAVES, 0);
        caveStone(ctx, cfOf(STONE_HIVE), ModBiomes.HIVE_CAVES, 1);
        caveStone(ctx, cfOf(STONE_SPARSE_HIVE), ModBiomes.SPARSE_HIVE_CAVES, 2);
        caveStone(ctx, cfOf(STONE_EGG_HIVE), ModBiomes.EGG_HIVE_CAVES, 3);
        caveStone(ctx, cfOf(STONE_QUICKSAND), ModBiomes.QUICKSAND_CAVES, 4);
    }

    private static void template(BootstrapContext<ConfiguredFeature<?, ?>> ctx, ResourceKey<ConfiguredFeature<?, ?>> key, String mode, int sink, String... ids) {
        FeatureUtils.register(ctx, key, com.mockingjam.spirecraft.worldgen.StructureFeatures.TEMPLATE.get(), new com.mockingjam.spirecraft.worldgen.StructureFeatures.TemplateConfig(
                java.util.Arrays.stream(ids).map(SpireCraft::id).toList(), mode, sink));
    }

    private static void none(BootstrapContext<ConfiguredFeature<?, ?>> ctx, ResourceKey<ConfiguredFeature<?, ?>> key, Feature<NoneFeatureConfiguration> f) {
        FeatureUtils.register(ctx, key, f, NoneFeatureConfiguration.INSTANCE);
    }

    private static void patch(BootstrapContext<ConfiguredFeature<?, ?>> ctx, ResourceKey<ConfiguredFeature<?, ?>> key, Block block, int tries) {
        FeatureUtils.register(ctx, key, Feature.RANDOM_PATCH, FeatureUtils.simplePatchConfiguration(
                Feature.SIMPLE_BLOCK, new SimpleBlockConfiguration(BlockStateProvider.simple(block)), List.of(), tries));
    }

    private static void groundPatch(BootstrapContext<ConfiguredFeature<?, ?>> ctx, ResourceKey<ConfiguredFeature<?, ?>> key, Block block, int tries) {
        FeatureUtils.register(ctx, key, Feature.RANDOM_PATCH, new net.minecraft.world.level.levelgen.feature.configurations.RandomPatchConfiguration(tries, 7, 3,
                PlacementUtils.filtered(Feature.SIMPLE_BLOCK, new SimpleBlockConfiguration(BlockStateProvider.simple(block)),
                        BlockPredicate.allOf(BlockPredicate.ONLY_IN_AIR_PREDICATE, BlockPredicate.matchesBlocks(Direction.DOWN.getUnitVec3i(),
                                Blocks.GRASS_BLOCK, Blocks.MOSS_BLOCK, Blocks.PODZOL, Blocks.DIRT, Blocks.COARSE_DIRT)))));
    }

    private static BlockStateProvider log(WoodSet w) {
        return BlockStateProvider.simple(w.log.get());
    }

    private static BlockStateProvider leaves(WoodSet w) {
        return BlockStateProvider.simple(w.leaves.get());
    }

    /** Noise patches: above {@code threshold} a {@code chance} share becomes one of {@code high}, everywhere else {@code base}. */
    private static BlockStateProvider patches(long seed, float scale, float threshold, float chance, BlockState base, BlockState... high) {
        return new NoiseThresholdProvider(seed, new NormalNoise.NoiseParameters(0, 1.0), scale, threshold, chance, base, List.of(base), List.of(high));
    }

    private static void surface(BootstrapContext<ConfiguredFeature<?, ?>> ctx, ResourceKey<ConfiguredFeature<?, ?>> key,
            ResourceKey<Biome> biome, BlockStateProvider top, BlockStateProvider under, int depth) {
        FeatureUtils.register(ctx, key, ModFeatures.BIOME_SURFACE.get(), new ModFeatures.SurfaceConfig(biome, top, under, depth));
    }

    private static void caveStone(BootstrapContext<ConfiguredFeature<?, ?>> ctx, ResourceKey<ConfiguredFeature<?, ?>> key,
            ResourceKey<Biome> biome, int style) {
        FeatureUtils.register(ctx, key, V2Features.CAVE_STONE.get(), new V2Features.CaveStoneConfig(biome, style));
    }

    // ------------------------------------------------------------------ placed features
    private static void placed(BootstrapContext<PlacedFeature> ctx) {
        HolderGetter<ConfiguredFeature<?, ?>> cf = ctx.lookup(Registries.CONFIGURED_FEATURE);
        // once per chunk, at the chunk origin (the features check the biome per column / per cell themselves)
        for (Ours o : List.of(SURFACE_STONE_FOREST, SURFACE_BEACH_DOCKS, SURFACE_POLLUTED_SEA, SURFACE_WATERFALLS, SURFACE_OVERGROWTH, SURFACE_MISTY,
                SURFACE_MUSHROOM, STONE_INK, STONE_HIVE, STONE_SPARSE_HIVE, STONE_EGG_HIVE, STONE_QUICKSAND, DARK_RUINS, MYCELIUM_PATCHES)) {
            PlacementUtils.register(ctx, o.key(), cf.getOrThrow(cfOf(o)));
        }
        reg(ctx, cf, STONE_SPIKES, CF_STONE_SPIKE, count(2, PlacementUtils.HEIGHTMAP_OCEAN_FLOOR));
        reg(ctx, cf, STONE_SPIKES_SPARSE, CF_STONE_SPIKE, rarity(2, PlacementUtils.HEIGHTMAP_OCEAN_FLOOR));
        // v3.5 (user): a few pillars standing in the harbour waters and the polluted sea (their tops may clear the water)
        reg(ctx, cf, STONE_SPIKES_WATER, CF_STONE_SPIKE, List.of(RarityFilter.onAverageOnceEvery(5), InSquarePlacement.spread(), PlacementUtils.HEIGHTMAP_OCEAN_FLOOR,
                BlockPredicateFilter.forPredicate(BlockPredicate.matchesFluids(Fluids.WATER)), BiomeFilter.biome()));
        // v3.5 (user): mud on the floors of the overgrowth's rivers and pools
        reg(ctx, cf, MUD_DISKS, cfOf(MUD_DISKS), List.of(CountPlacement.of(3), InSquarePlacement.spread(), PlacementUtils.HEIGHTMAP_TOP_SOLID,
                BlockPredicateFilter.forPredicate(BlockPredicate.matchesFluids(Fluids.WATER)), BiomeFilter.biome()));
        reg(ctx, cf, PUDDLES, CF_PUDDLE, count(2, PlacementUtils.HEIGHTMAP_WORLD_SURFACE));
        reg(ctx, cf, STONE_PILES, CF_STONE_PILE, rarity(2, PlacementUtils.HEIGHTMAP_WORLD_SURFACE));
        reg(ctx, cf, FALLEN_LOGS, CF_FALLEN_LOG, count(1, PlacementUtils.HEIGHTMAP_WORLD_SURFACE));
        reg(ctx, cf, ROTTEN_STUMPS, CF_ROTTEN_STUMP, rarity(2, PlacementUtils.HEIGHTMAP_WORLD_SURFACE));
        reg(ctx, cf, DOCK_WALL, CF_DOCK_WALL, rarity(4, PlacementUtils.HEIGHTMAP_TOP_SOLID));
        reg(ctx, cf, RUIN_PILLAR, CF_RUIN_PILLAR, rarity(3, PlacementUtils.HEIGHTMAP_WORLD_SURFACE));
        reg(ctx, cf, CLIFF_SPRINGS, CF_CLIFF_SPRING, count(3, PlacementUtils.HEIGHTMAP_WORLD_SURFACE));
        reg(ctx, cf, INK_POOLS, CF_INK_POOL, cave(4));
        reg(ctx, cf, HIVE_NESTS, CF_HIVE_NEST, cave(6));
        reg(ctx, cf, HIVE_NESTS_SPARSE, CF_HIVE_NEST, cave(2));
        reg(ctx, cf, EGG_CLUTCHES, CF_EGG_CLUTCH, cave(2));
        reg(ctx, cf, EGG_CLUTCHES_DENSE, CF_EGG_CLUTCH, cave(7));
        reg(ctx, cf, QUICKSAND_POOLS, CF_QUICKSAND_POOL, cave(12));
        // v3.2: quicksand pits on the desert surface (added to the desert by a biome modifier)
        reg(ctx, cf, SURFACE_QUICKSAND, CF_QUICKSAND_POOL, rarity(4, PlacementUtils.HEIGHTMAP_WORLD_SURFACE));

        reg(ctx, cf, TREES_GNARLWOOD, ModBlocks.GNARLWOOD.tree, tree(9, ModBlocks.GNARLWOOD.sapling.get()));
        reg(ctx, cf, TREES_GNARLWOOD_SPARSE, ModBlocks.GNARLWOOD.tree, tree(1, ModBlocks.GNARLWOOD.sapling.get()));
        reg(ctx, cf, GIANT_LANTERN, CF_GIANT_LANTERN, count(1, PlacementUtils.HEIGHTMAP));
        reg(ctx, cf, GIANT_CORAL, CF_GIANT_CORAL, rarity(2, PlacementUtils.HEIGHTMAP));
        reg(ctx, cf, GIANT_BLUEBELL, CF_GIANT_BLUEBELL, rarity(2, PlacementUtils.HEIGHTMAP));
        reg(ctx, cf, HUGE_FOGCAP, ModBlocks.HUGE_FOGCAP_FEATURE, rarity(2, PlacementUtils.HEIGHTMAP));
        reg(ctx, cf, GIANT_HIVE_SHROOMS, CF_GIANT_HIVE_SHROOM, cave(4));
        reg(ctx, cf, SHROOM_GROVES, CF_SHROOM_GROVE, cave(3));
        reg(ctx, cf, POLLUTED_REEFS, CF_POLLUTED_REEF, rarity(3, PlacementUtils.HEIGHTMAP_TOP_SOLID));   // v2.8: clusters, not scattered
        reg(ctx, cf, POLLUTED_SEAGRASS, CF_POLLUTED_SEAGRASS, count(6, PlacementUtils.HEIGHTMAP_TOP_SOLID));
        reg(ctx, cf, POLLUTED_KELP, CF_POLLUTED_KELP, count(48, PlacementUtils.HEIGHTMAP_TOP_SOLID));
        reg(ctx, cf, SHORE_REEDS, CF_SHORE_REEDS, count(4, PlacementUtils.HEIGHTMAP_WORLD_SURFACE));   // v3.2: more beds, but only by the water (V2Features.ShoreReeds)
        reg(ctx, cf, PATCH_ROTTEN_SHRUB, cfOf(PATCH_ROTTEN_SHRUB), count(1, PlacementUtils.HEIGHTMAP));
        reg(ctx, cf, PATCH_SPIRE_FERN, cfOf(PATCH_SPIRE_FERN), count(2, PlacementUtils.HEIGHTMAP_NO_LEAVES));
        reg(ctx, cf, PATCH_FOGCAP, cfOf(PATCH_FOGCAP), rarity(3, PlacementUtils.HEIGHTMAP_NO_LEAVES));
        reg(ctx, cf, PATCH_LANTERN_CAP, cfOf(PATCH_LANTERN_CAP), rarity(3, PlacementUtils.HEIGHTMAP_NO_LEAVES));
        reg(ctx, cf, PATCH_CORAL_CAP, cfOf(PATCH_CORAL_CAP), rarity(3, PlacementUtils.HEIGHTMAP_NO_LEAVES));
        reg(ctx, cf, PATCH_BLUEBELL_CAP, cfOf(PATCH_BLUEBELL_CAP), rarity(3, PlacementUtils.HEIGHTMAP_NO_LEAVES));
        reg(ctx, cf, PATCH_GLOW_SHRUB, cfOf(PATCH_GLOW_SHRUB), count(1, PlacementUtils.HEIGHTMAP_NO_LEAVES));
        reg(ctx, cf, PATCH_GLOW_MOSS, cfOf(PATCH_GLOW_MOSS), rarity(2, PlacementUtils.HEIGHTMAP_NO_LEAVES));
        reg(ctx, cf, PATCH_MOSS_CARPET, cfOf(PATCH_MOSS_CARPET), count(2, PlacementUtils.HEIGHTMAP_NO_LEAVES));
        reg(ctx, cf, MUSHROOMS_DENSE, CF_DENSE_MUSHROOMS, count(3, PlacementUtils.HEIGHTMAP_NO_LEAVES));
        reg(ctx, cf, GLOWVINES, CF_GLOWVINES, count(4, PlacementUtils.HEIGHTMAP_WORLD_SURFACE));
        reg(ctx, cf, PATCH_INK_BUBBLE, cfOf(PATCH_INK_BUBBLE), cave(6));
        reg(ctx, cf, PATCH_HIVE_EGG, cfOf(PATCH_HIVE_EGG), cave(2));
        reg(ctx, cf, PATCH_HIVE_EGG_DENSE, cfOf(PATCH_HIVE_EGG), cave(4));
        reg(ctx, cf, PATCH_HIVE_SHROOM, cfOf(PATCH_HIVE_SHROOM), cave(10));
        reg(ctx, cf, PATCH_HIVE_SHROOM_FEW, cfOf(PATCH_HIVE_SHROOM), cave(4));
    }

    private static void reg(BootstrapContext<PlacedFeature> ctx, HolderGetter<ConfiguredFeature<?, ?>> cf, Ours o,
            ResourceKey<ConfiguredFeature<?, ?>> feature, List<PlacementModifier> modifiers) {
        PlacementUtils.register(ctx, o.key(), cf.getOrThrow(feature), modifiers);
    }

    private static List<PlacementModifier> count(int n, PlacementModifier height) {
        return List.of(CountPlacement.of(n), InSquarePlacement.spread(), height, BiomeFilter.biome());
    }

    private static List<PlacementModifier> rarity(int oneIn, PlacementModifier height) {
        return List.of(RarityFilter.onAverageOnceEvery(oneIn), InSquarePlacement.spread(), height, BiomeFilter.biome());
    }

    /** Like cave(), but once every `oneIn` chunks (and a few tries in that chunk, the first good floor wins). */
    private static List<PlacementModifier> caveRare(int oneIn) {
        return List.of(RarityFilter.onAverageOnceEvery(oneIn), CountPlacement.of(4), InSquarePlacement.spread(), HeightRangePlacement.uniform(VerticalAnchor.absolute(-50), VerticalAnchor.absolute(40)),
                EnvironmentScanPlacement.scanningFor(Direction.DOWN, BlockPredicate.solid(), BlockPredicate.ONLY_IN_AIR_PREDICATE, 12),
                RandomOffsetPlacement.vertical(ConstantInt.of(1)), BiomeFilter.biome());
    }

    /** Cave floors: like vanilla cave vegetation — a random height, then down to the floor. */
    private static List<PlacementModifier> cave(int n) {
        return List.of(CountPlacement.of(n), InSquarePlacement.spread(), HeightRangePlacement.uniform(VerticalAnchor.absolute(-56), VerticalAnchor.absolute(48)),
                EnvironmentScanPlacement.scanningFor(Direction.DOWN, BlockPredicate.solid(), BlockPredicate.ONLY_IN_AIR_PREDICATE, 12),
                RandomOffsetPlacement.vertical(ConstantInt.of(1)), BiomeFilter.biome());
    }

    private static List<PlacementModifier> tree(int n, Block sapling) {
        return List.of(PlacementUtils.countExtra(n, 0.1F, 1), InSquarePlacement.spread(), SurfaceWaterDepthFilter.forMaxDepth(0),
                PlacementUtils.HEIGHTMAP_OCEAN_FLOOR, BiomeFilter.biome(), PlacementUtils.filteredByBlockSurvival(sapling));
    }

    private static List<PlacementModifier> rarityTree(int oneIn, Block sapling) {
        return List.of(RarityFilter.onAverageOnceEvery(oneIn), InSquarePlacement.spread(), SurfaceWaterDepthFilter.forMaxDepth(0),
                PlacementUtils.HEIGHTMAP_OCEAN_FLOOR, BiomeFilter.biome(), PlacementUtils.filteredByBlockSurvival(sapling));
    }

    // ------------------------------------------------------------------ biomes
    private static void biomes(BootstrapContext<Biome> ctx) {
        HolderGetter<PlacedFeature> pf = ctx.lookup(Registries.PLACED_FEATURE);
        HolderGetter<ConfiguredWorldCarver<?>> carvers = ctx.lookup(Registries.CONFIGURED_CARVER);
        ctx.register(ModBiomes.STONE_FOREST_DOCKS, stoneForestDocks(pf, carvers));
        ctx.register(ModBiomes.BEACH_DOCKS, beachDocks(pf, carvers));
        ctx.register(ModBiomes.POLLUTED_SEA, pollutedSea(pf, carvers));
        ctx.register(ModBiomes.WATERFALLS, waterfalls(pf, carvers));
        ctx.register(ModBiomes.OVERGROWTH, overgrowth(pf, carvers, 0));
        ctx.register(ModBiomes.MISTY_OVERGROWTH, overgrowth(pf, carvers, 1));
        ctx.register(ModBiomes.MUSHROOM_OVERGROWTH, overgrowth(pf, carvers, 2));
        ctx.register(ModBiomes.INK_SPRING_CAVES, cave(pf, carvers, ModBiomes.INK_SPRING_CAVES));
        ctx.register(ModBiomes.HIVE_CAVES, cave(pf, carvers, ModBiomes.HIVE_CAVES));
        ctx.register(ModBiomes.SPARSE_HIVE_CAVES, cave(pf, carvers, ModBiomes.SPARSE_HIVE_CAVES));
        ctx.register(ModBiomes.EGG_HIVE_CAVES, cave(pf, carvers, ModBiomes.EGG_HIVE_CAVES));
        ctx.register(ModBiomes.QUICKSAND_CAVES, cave(pf, carvers, ModBiomes.QUICKSAND_CAVES));
    }

    /** Adds the wanted subset of {@link #OURS} in the global order. */
    private static void addOurs(BiomeGenerationSettings.Builder g, Ours... wanted) {
        Set<Ours> set = Set.of(wanted);
        for (Ours o : OURS) if (set.contains(o)) g.addFeature(o.step(), o.key());
    }

    /** Same as the private OverworldBiomes.globalOverworldGeneration. */
    private static void global(BiomeGenerationSettings.Builder g) {
        BiomeDefaultFeatures.addDefaultCarversAndLakes(g);
        BiomeDefaultFeatures.addDefaultCrystalFormations(g);
        BiomeDefaultFeatures.addDefaultMonsterRoom(g);
        BiomeDefaultFeatures.addDefaultUndergroundVariety(g);
        BiomeDefaultFeatures.addDefaultSprings(g);
        BiomeDefaultFeatures.addSurfaceFreezing(g);
    }

    // blue-black harbour palette (user: 暗港总体色调偏蓝黑)
    private static BiomeSpecialEffects.Builder docksEffects() {
        return effects(0x2e3848, 0x1c2638, 0x080c14, 0x3a4458, 0x34403e, 0x2a3434);
    }

    private static Biome stoneForestDocks(HolderGetter<PlacedFeature> pf, HolderGetter<ConfiguredWorldCarver<?>> carvers) {
        var g = new BiomeGenerationSettings.Builder(pf, carvers);
        BiomeDefaultFeatures.addFossilDecoration(g);   // swamp order (without the swamp oaks)
        global(g);
        BiomeDefaultFeatures.addDefaultOres(g);
        BiomeDefaultFeatures.addSwampClayDisk(g);
        BiomeDefaultFeatures.addDefaultMushrooms(g);
        // (no swamp extra vegetation: its seagrass is vanilla - the harbour water gets polluted seagrass and kelp, v2.4)
        g.addFeature(VEG, AquaticPlacements.SEAGRASS_SWAMP);
        addOurs(g, SURFACE_STONE_FOREST, STONE_SPIKES, STONE_SPIKES_WATER, PUDDLES, DOCK_WALL, ROTTEN_STUMPS, POLLUTED_SEAGRASS, POLLUTED_KELP, SHORE_REEDS, PATCH_ROTTEN_SHRUB,
                DARK_RUINS);
        return biome(true, 0.8F, 0.9F, docksEffects(), scripted(docksSpawns(), ModBiomes.STONE_FOREST_DOCKS), g);
    }

    private static Biome beachDocks(HolderGetter<PlacedFeature> pf, HolderGetter<ConfiguredWorldCarver<?>> carvers) {
        var g = new BiomeGenerationSettings.Builder(pf, carvers);
        global(g);   // beach order
        BiomeDefaultFeatures.addDefaultOres(g);
        BiomeDefaultFeatures.addDefaultSoftDisks(g);
        BiomeDefaultFeatures.addDefaultMushrooms(g);
        BiomeDefaultFeatures.addDefaultExtraVegetation(g, true);
        addOurs(g, SURFACE_BEACH_DOCKS, STONE_SPIKES_SPARSE, STONE_SPIKES_WATER, STONE_PILES, FALLEN_LOGS, ROTTEN_STUMPS, POLLUTED_SEAGRASS, POLLUTED_KELP, SHORE_REEDS,
                PATCH_ROTTEN_SHRUB, DARK_RUINS);
        return biome(true, 0.8F, 0.6F, docksEffects(), scripted(docksSpawns(), ModBiomes.BEACH_DOCKS), g);
    }

    /** §11: the data-driven monsters that live in this biome (mob/ScriptedDefs spawns). */
    private static MobSpawnSettings.Builder scripted(MobSpawnSettings.Builder spawns, ResourceKey<Biome> biome) {
        for (var d : com.mockingjam.spirecraft.mob.ScriptedDefs.ALL.values())
            for (var sp : d.spawns)
                if (sp.biomes().contains(biome))
                    spawns.addSpawn(MobCategory.MONSTER, sp.weight(), new MobSpawnSettings.SpawnerData(ModEntities.SCRIPTED.get(d.name).get(), sp.min(), sp.max()));
        return spawns;
    }

    private static MobSpawnSettings.Builder docksSpawns() {
        var spawns = new MobSpawnSettings.Builder();
        BiomeDefaultFeatures.commonSpawns(spawns, 70);
        spawns.addSpawn(MobCategory.MONSTER, 30, new MobSpawnSettings.SpawnerData(EntityType.BOGGED, 4, 4));
        spawns.addSpawn(MobCategory.MONSTER, 20, new MobSpawnSettings.SpawnerData(EntityType.DROWNED, 1, 2));
        spawns.addSpawn(MobCategory.CREATURE, 10, new MobSpawnSettings.SpawnerData(EntityType.FROG, 2, 5));
        // phase 8 batch 2: the Underdocks (docs/design/mobs.md §9) - slugs and rats on land, toadpoles hovering,
        // seapunks and the rare Terror Eel in the water
        spawns.addSpawn(MobCategory.MONSTER, 40, new MobSpawnSettings.SpawnerData(ModEntities.CORPSE_SLUG.get(), 2, 3));
        spawns.addSpawn(MobCategory.MONSTER, 35, new MobSpawnSettings.SpawnerData(ModEntities.TWO_TAILED_RAT.get(), 3, 3));
        spawns.addSpawn(MobCategory.MONSTER, 30, new MobSpawnSettings.SpawnerData(ModEntities.TOADPOLE.get(), 2, 2));
        spawns.addSpawn(MobCategory.MONSTER, 25, new MobSpawnSettings.SpawnerData(ModEntities.SEAPUNK.get(), 1, 1));
        spawns.addSpawn(MobCategory.MONSTER, 3, new MobSpawnSettings.SpawnerData(ModEntities.TERROR_EEL.get(), 1, 1));
        return spawns;
    }

    private static Biome pollutedSea(HolderGetter<PlacedFeature> pf, HolderGetter<ConfiguredWorldCarver<?>> carvers) {
        var g = new BiomeGenerationSettings.Builder(pf, carvers);
        global(g);   // base ocean order
        BiomeDefaultFeatures.addDefaultOres(g);
        BiomeDefaultFeatures.addDefaultSoftDisks(g);
        BiomeDefaultFeatures.addDefaultMushrooms(g);
        BiomeDefaultFeatures.addDefaultExtraVegetation(g, true);
        addOurs(g, SURFACE_POLLUTED_SEA, STONE_SPIKES_WATER, POLLUTED_REEFS, POLLUTED_SEAGRASS, POLLUTED_KELP, DARK_RUINS);
        var spawns = new MobSpawnSettings.Builder();
        BiomeDefaultFeatures.commonSpawns(spawns);
        spawns.addSpawn(MobCategory.MONSTER, 15, new MobSpawnSettings.SpawnerData(EntityType.DROWNED, 1, 2));
        spawns.addSpawn(MobCategory.WATER_AMBIENT, 6, new MobSpawnSettings.SpawnerData(EntityType.PUFFERFISH, 1, 3));
        // phase 8 batch 2: sea creatures of the polluted sea
        spawns.addSpawn(MobCategory.MONSTER, 30, new MobSpawnSettings.SpawnerData(ModEntities.SEAPUNK.get(), 1, 2));
        spawns.addSpawn(MobCategory.MONSTER, 20, new MobSpawnSettings.SpawnerData(ModEntities.TOADPOLE.get(), 2, 2));
        spawns.addSpawn(MobCategory.MONSTER, 4, new MobSpawnSettings.SpawnerData(ModEntities.TERROR_EEL.get(), 1, 1));
        return biome(true, 0.6F, 0.5F, effects(0x2a3446, 0x18223a, 0x060a12, 0x3a4458, 0x34403e, 0x2a3434), scripted(spawns, ModBiomes.POLLUTED_SEA), g);
    }

    private static Biome waterfalls(HolderGetter<PlacedFeature> pf, HolderGetter<ConfiguredWorldCarver<?>> carvers) {
        var g = new BiomeGenerationSettings.Builder(pf, carvers);
        global(g);   // windswept forest order
        BiomeDefaultFeatures.addDefaultOres(g);
        BiomeDefaultFeatures.addDefaultSoftDisks(g);
        BiomeDefaultFeatures.addMountainForestTrees(g);
        BiomeDefaultFeatures.addBushes(g);
        BiomeDefaultFeatures.addDefaultFlowers(g);
        BiomeDefaultFeatures.addDefaultGrass(g);
        BiomeDefaultFeatures.addDefaultMushrooms(g);
        BiomeDefaultFeatures.addDefaultExtraVegetation(g, true);
        BiomeDefaultFeatures.addExtraEmeralds(g);
        addOurs(g, SURFACE_WATERFALLS, CLIFF_SPRINGS, TREES_GNARLWOOD_SPARSE, PATCH_SPIRE_FERN);
        var spawns = new MobSpawnSettings.Builder();
        BiomeDefaultFeatures.farmAnimals(spawns);
        BiomeDefaultFeatures.commonSpawns(spawns);
        return biome(true, 0.5F, 0.9F, effects(0xa8c4d4, 0x3f8ad8, 0x0a2e5a, 0x8ab8e0, 0x6aa060, 0x5a9050)
                .ambientParticle(new AmbientParticleSettings(ParticleTypes.SPLASH, 0.004F)), spawns, g);
    }

    /** @param variant 0 = Overgrowth, 1 = Misty Overgrowth, 2 = Mushroom Overgrowth */
    private static Biome overgrowth(HolderGetter<PlacedFeature> pf, HolderGetter<ConfiguredWorldCarver<?>> carvers, int variant) {
        var g = new BiomeGenerationSettings.Builder(pf, carvers);
        global(g);   // jungle order
        BiomeDefaultFeatures.addDefaultOres(g);
        BiomeDefaultFeatures.addDefaultSoftDisks(g);
        BiomeDefaultFeatures.addJungleGrass(g);
        BiomeDefaultFeatures.addDefaultMushrooms(g);
        BiomeDefaultFeatures.addDefaultExtraVegetation(g, true);
        BiomeDefaultFeatures.addJungleVines(g);
        Ours surface = variant == 0 ? SURFACE_OVERGROWTH : variant == 1 ? SURFACE_MISTY : SURFACE_MUSHROOM;
        List<Ours> list = new ArrayList<>(List.of(surface, MUD_DISKS, RUIN_PILLAR, PATCH_SPIRE_FERN, PATCH_GLOW_SHRUB, PATCH_GLOW_MOSS, PATCH_MOSS_CARPET, GLOWVINES,
                PATCH_LANTERN_CAP, PATCH_CORAL_CAP, PATCH_BLUEBELL_CAP));
        if (variant == 1) list.addAll(List.of(PATCH_FOGCAP, HUGE_FOGCAP));   // v3.4 (user): fogcaps only where the mist is
        if (variant == 2) list.addAll(List.of(TREES_GNARLWOOD_SPARSE, GIANT_LANTERN, GIANT_CORAL, GIANT_BLUEBELL, MUSHROOMS_DENSE));
        else list.add(TREES_GNARLWOOD);
        addOurs(g, list.toArray(Ours[]::new));
        var spawns = new MobSpawnSettings.Builder();
        BiomeDefaultFeatures.baseJungleSpawns(spawns);
        spawns.addSpawn(MobCategory.CREATURE, 30, new MobSpawnSettings.SpawnerData(EntityType.PARROT, 1, 2));
        // phase 8: Overgrowth monsters (docs/design/mobs.md); Byrdonis is a rare elite; flyconids prefer the mist and mushrooms
        spawns.addSpawn(MobCategory.MONSTER, 40, new MobSpawnSettings.SpawnerData(ModEntities.LEAF_SLIME.get(), 1, 2));
        spawns.addSpawn(MobCategory.MONSTER, 40, new MobSpawnSettings.SpawnerData(ModEntities.TWIG_SLIME.get(), 1, 2));
        spawns.addSpawn(MobCategory.MONSTER, 35, new MobSpawnSettings.SpawnerData(ModEntities.FUZZY_WURM_CRAWLER.get(), 1, 1));
        spawns.addSpawn(MobCategory.MONSTER, 35, new MobSpawnSettings.SpawnerData(ModEntities.NIBBIT.get(), 1, 2));
        spawns.addSpawn(MobCategory.MONSTER, 30, new MobSpawnSettings.SpawnerData(ModEntities.SHRINKER_BEETLE.get(), 1, 1));
        spawns.addSpawn(MobCategory.MONSTER, variant == 0 ? 15 : 60, new MobSpawnSettings.SpawnerData(ModEntities.FLYCONID.get(), 1, 2));
        spawns.addSpawn(MobCategory.MONSTER, 3, new MobSpawnSettings.SpawnerData(ModEntities.BYRDONIS.get(), 1, 1));
        if (variant == 2) spawns.addSpawn(MobCategory.CREATURE, 8, new MobSpawnSettings.SpawnerData(EntityType.MOOSHROOM, 2, 3));
        var effects = variant == 1
                ? effects(0xdfe6e4, 0x3a7a5c, 0x0c2a1e, 0xc8d4d0, 0x4e8f34, 0x3c7f2a).ambientParticle(new AmbientParticleSettings(ParticleTypes.WHITE_ASH, 0.02F))
                : variant == 2
                ? effects(0x9ab09a, 0x3a7a5c, 0x0c2a1e, 0x88a890, 0x5a8f3e, 0x4a7f34).ambientParticle(new AmbientParticleSettings(ParticleTypes.SPORE_BLOSSOM_AIR, 0.004F))
                : effects(0x8db89a, 0x3a7a5c, 0x0c2a1e, 0x78a890, 0x4e8f34, 0x3c7f2a).ambientParticle(new AmbientParticleSettings(ParticleTypes.FIREFLY, 0.002F));
        return biome(true, 0.95F, 0.9F, effects, scripted(spawns, variant == 0 ? ModBiomes.OVERGROWTH : variant == 1 ? ModBiomes.MISTY_OVERGROWTH : ModBiomes.MUSHROOM_OVERGROWTH), g);
    }

    private static Biome cave(HolderGetter<PlacedFeature> pf, HolderGetter<ConfiguredWorldCarver<?>> carvers, ResourceKey<Biome> which) {
        var g = new BiomeGenerationSettings.Builder(pf, carvers);
        global(g);   // dripstone caves order
        // (no plains grass / vegetation: they grew trees on any surface a cave biome reaches - v2.3)
        BiomeDefaultFeatures.addDefaultOres(g, true);
        BiomeDefaultFeatures.addDefaultSoftDisks(g);
        BiomeDefaultFeatures.addDefaultMushrooms(g);
        BiomeDefaultFeatures.addDefaultExtraVegetation(g, false);
        var spawns = new MobSpawnSettings.Builder();
        BiomeDefaultFeatures.commonSpawns(spawns);
        BiomeSpecialEffects.Builder effects;
        if (which == ModBiomes.INK_SPRING_CAVES) {
            // vanilla stone and cave light; dark rock only around the ink pools, whose vents give off white smoke
            addOurs(g, INK_POOLS, PATCH_INK_BUBBLE);
            effects = effects(0xc0d8ff, 0x2a1e3a, 0x0a0612, 0x78a7ff, 0x5a6a50, 0x4a5a40);
        } else if (which == ModBiomes.QUICKSAND_CAVES) {
            addOurs(g, STONE_QUICKSAND, QUICKSAND_POOLS);
            spawns.addSpawn(MobCategory.MONSTER, 40, new MobSpawnSettings.SpawnerData(EntityType.HUSK, 2, 4));
            effects = effects(0xc8a870, 0x3a8a8a, 0x0a2a2a, 0xd0b080, 0xbfb755, 0xaea42a);
        } else {
            // hive caves: normal, sparse (few mounds, hive shrooms), eggs everywhere
            boolean sparse = which == ModBiomes.SPARSE_HIVE_CAVES, eggs = which == ModBiomes.EGG_HIVE_CAVES;
            // eggs lie in clutches plus a few loose ones; hive shrooms grow on the hive soil everywhere (most in the sparse hives)
            addOurs(g, sparse ? HIVE_NESTS_SPARSE : HIVE_NESTS, eggs ? EGG_CLUTCHES_DENSE : EGG_CLUTCHES, sparse ? STONE_SPARSE_HIVE : eggs ? STONE_EGG_HIVE : STONE_HIVE,
                    sparse ? PATCH_HIVE_SHROOM : eggs ? PATCH_HIVE_EGG_DENSE : PATCH_HIVE_EGG);
            if (!sparse) addOurs(g, PATCH_HIVE_SHROOM_FEW);
            addOurs(g, MYCELIUM_PATCHES);   // mycelium spreads around the mushrooms (v3.1)
            // (v3.4: the hive structures are real structures now - worldgen/SpireStructures, tools/structures/build.js)
            if (sparse) addOurs(g, GIANT_HIVE_SHROOMS, SHROOM_GROVES);   // dense mushroom patches (v2.7)   // v2.4: the hive shroom's giant form grows in the mushroom hives
            spawns.addSpawn(MobCategory.MONSTER, 20, new MobSpawnSettings.SpawnerData(EntityType.SPIDER, 2, 4));
            spawns.addSpawn(MobCategory.MONSTER, 10, new MobSpawnSettings.SpawnerData(EntityType.CAVE_SPIDER, 2, 4));
            spawns.addSpawn(MobCategory.MONSTER, 10, new MobSpawnSettings.SpawnerData(EntityType.SILVERFISH, 2, 4));
            // phase 8 batch 3: the Hive (docs/design/mobs.md §10) - a rock bowlbug with workers, exoskeleton packs,
            // pairs of chompers and mytes, the rare Entomancer (eggs most in the egg hives)
            spawns.addSpawn(MobCategory.MONSTER, 30, new MobSpawnSettings.SpawnerData(ModEntities.BOWLBUG_ROCK.get(), 1, 1));
            spawns.addSpawn(MobCategory.MONSTER, eggs ? 40 : 20, new MobSpawnSettings.SpawnerData(ModEntities.BOWLBUG_EGG.get(), 1, 2));
            spawns.addSpawn(MobCategory.MONSTER, 20, new MobSpawnSettings.SpawnerData(ModEntities.BOWLBUG_SILK.get(), 1, 2));
            spawns.addSpawn(MobCategory.MONSTER, 20, new MobSpawnSettings.SpawnerData(ModEntities.BOWLBUG_NECTAR.get(), 1, 2));
            spawns.addSpawn(MobCategory.MONSTER, 35, new MobSpawnSettings.SpawnerData(ModEntities.EXOSKELETON.get(), 3, 4));
            spawns.addSpawn(MobCategory.MONSTER, 25, new MobSpawnSettings.SpawnerData(ModEntities.CHOMPER.get(), 2, 2));
            spawns.addSpawn(MobCategory.MONSTER, sparse ? 35 : 25, new MobSpawnSettings.SpawnerData(ModEntities.MYTE.get(), 2, 2));
            spawns.addSpawn(MobCategory.MONSTER, 3, new MobSpawnSettings.SpawnerData(ModEntities.ENTOMANCER.get(), 1, 1));
            effects = effects(0x6a4a20, 0x7a8a3a, 0x2a2a0c, 0x8a6a30, 0xb0a040, 0x8a8a2c)
                    .ambientParticle(new AmbientParticleSettings(ParticleTypes.FALLING_NECTAR, 0.004F));
        }
        return biome(true, 0.8F, 0.4F, effects, scripted(spawns, which), g);
    }

    private static BiomeSpecialEffects.Builder effects(int fog, int water, int waterFog, int sky, int grass, int foliage) {
        return new BiomeSpecialEffects.Builder().fogColor(fog).waterColor(water).waterFogColor(waterFog).skyColor(sky)
                .grassColorOverride(grass).foliageColorOverride(foliage).dryFoliageColorOverride(foliage)
                .ambientMoodSound(AmbientMoodSettings.LEGACY_CAVE_SETTINGS);
    }

    private static Biome biome(boolean rain, float temperature, float downfall, BiomeSpecialEffects.Builder effects,
            MobSpawnSettings.Builder spawns, BiomeGenerationSettings.Builder gen) {
        return new Biome.BiomeBuilder().hasPrecipitation(rain).temperature(temperature).downfall(downfall)
                .specialEffects(effects.build()).mobSpawnSettings(spawns.build()).generationSettings(gen.build()).build();
    }
}
