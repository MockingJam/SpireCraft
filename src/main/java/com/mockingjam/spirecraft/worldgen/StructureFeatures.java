package com.mockingjam.spirecraft.worldgen;

import com.mockingjam.spirecraft.block.SwordStatueBlock;
import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import java.util.List;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.tags.BlockTags;
import net.minecraft.util.RandomSource;
import net.minecraft.world.level.ChunkPos;
import net.minecraft.world.level.WorldGenLevel;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.ChestBlock;
import net.minecraft.world.level.block.Rotation;
import net.minecraft.world.level.block.StairBlock;
import net.minecraft.world.RandomizableContainer;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.properties.Half;
import net.minecraft.world.level.levelgen.Heightmap;
import net.minecraft.world.level.levelgen.feature.Feature;
import net.minecraft.world.level.levelgen.feature.FeaturePlaceContext;
import net.minecraft.world.level.levelgen.feature.configurations.FeatureConfiguration;
import net.minecraft.world.level.levelgen.feature.configurations.NoneFeatureConfiguration;
import net.minecraft.world.level.levelgen.structure.BoundingBox;
import net.minecraft.world.level.levelgen.structure.templatesystem.BlockIgnoreProcessor;
import net.minecraft.world.level.levelgen.structure.templatesystem.StructurePlaceSettings;
import net.minecraft.world.level.levelgen.structure.templatesystem.StructureTemplate;
import net.minecraft.world.level.material.Fluids;
import net.minecraft.world.level.storage.loot.LootTable;
import net.minecraftforge.registries.RegistryObject;

/**
 * Phase 9 structures that have to fit the terrain (docs/design/structures.md): template rooms on cave floors and piers
 * at the shore, the Kaiser Crab's cavern, the web nest, and the waterfall room / sword statue added by the cliff springs.
 * The templates themselves are written by tools/structures/build.js.
 */
public final class StructureFeatures {
    private StructureFeatures() {}

    /** templates: one is picked at random; mode: cave_floor or shore; sink: how far the template's y=0 sits below the floor. */
    public record TemplateConfig(List<ResourceLocation> templates, String mode, int sink) implements FeatureConfiguration {
        public static final Codec<TemplateConfig> CODEC = RecordCodecBuilder.create(i -> i.group(
                ResourceLocation.CODEC.listOf().fieldOf("templates").forGetter(TemplateConfig::templates),
                Codec.STRING.fieldOf("mode").forGetter(TemplateConfig::mode),
                Codec.INT.fieldOf("sink").forGetter(TemplateConfig::sink)).apply(i, TemplateConfig::new));
    }

    public static final RegistryObject<Feature<TemplateConfig>> TEMPLATE = ModFeatures.FEATURES.register("template", () -> new TemplateFeature(TemplateConfig.CODEC));

    public static void init() {
    }

    private static boolean solid(WorldGenLevel level, BlockPos p) {
        return level.getBlockState(p).isFaceSturdy(level, p, Direction.UP);
    }

    private static void set(WorldGenLevel level, BlockPos p, BlockState s) {
        level.setBlock(p, s, 2);
    }

    private static boolean rock(BlockState s) {
        return s.is(BlockTags.BASE_STONE_OVERWORLD) || s.is(BlockTags.DIRT) || s.is(Blocks.GRAVEL) || s.is(ModBlocks.HIVE_ROCK.base.get())
                || s.is(ModBlocks.DEEP_HIVE_ROCK.base.get()) || s.is(ModBlocks.HIVE_SOIL.get()) || s.is(BlockTags.BASE_STONE_OVERWORLD);
    }

    private static void chest(WorldGenLevel level, RandomSource r, BlockPos p, Direction facing, String loot) {
        set(level, p, Blocks.CHEST.defaultBlockState().setValue(ChestBlock.FACING, facing));
        RandomizableContainer.setBlockEntityLootTable(level, r, p, ResourceKey.create(net.minecraft.core.registries.Registries.LOOT_TABLE,
                ResourceLocation.fromNamespaceAndPath("spirecraft", "chests/" + loot)));
    }

    private static Rotation rotationFor(Direction d) {   // template +z (south) turned to face d
        return switch (d) {
            case WEST -> Rotation.CLOCKWISE_90;
            case NORTH -> Rotation.CLOCKWISE_180;
            case EAST -> Rotation.COUNTERCLOCKWISE_90;
            default -> Rotation.NONE;
        };
    }

    // ------------------------------------------------------------------ template rooms
    static final class TemplateFeature extends Feature<TemplateConfig> {
        TemplateFeature(Codec<TemplateConfig> c) { super(c); }

        @Override
        public boolean place(FeaturePlaceContext<TemplateConfig> ctx) {
            WorldGenLevel level = ctx.level();
            RandomSource r = ctx.random();
            TemplateConfig cfg = ctx.config();
            var manager = level.getLevel().getServer().getStructureManager();
            StructureTemplate t = manager.getOrCreate(cfg.templates().get(r.nextInt(cfg.templates().size())));
            var size = t.getSize();
            if (size.getX() == 0) return false;
            ChunkPos cp = new ChunkPos(ctx.origin());
            StructurePlaceSettings settings = new StructurePlaceSettings().setRandom(r).addProcessor(BlockIgnoreProcessor.STRUCTURE_BLOCK)
                    .setBoundingBox(new BoundingBox(cp.getMinBlockX() - 16, level.getMinY(), cp.getMinBlockZ() - 16, cp.getMaxBlockX() + 16, level.getMaxY(), cp.getMaxBlockZ() + 16));
            BlockPos anchor, pivot;
            if (cfg.mode().equals("shore")) {
                // a pier: from dry land at the water's edge, pointing out over open water
                BlockPos o = level.getHeightmapPos(Heightmap.Types.WORLD_SURFACE_WG, ctx.origin());
                if (!level.getFluidState(o.below()).isEmpty()) return false;
                Direction out = null;
                for (Direction d : Direction.Plane.HORIZONTAL) {
                    boolean water = true;
                    for (int k = 2; k <= 10 && water; k += 2) {
                        BlockPos q = level.getHeightmapPos(Heightmap.Types.WORLD_SURFACE_WG, o.relative(d, k)).below();
                        water = level.getFluidState(q).is(Fluids.WATER);
                    }
                    if (water) { out = d; break; }
                }
                if (out == null) return false;
                int waterTop = level.getHeightmapPos(Heightmap.Types.WORLD_SURFACE_WG, o.relative(out, 4)).getY() - 1;
                if (Math.abs(o.getY() - 1 - waterTop) > 2) return false;
                settings.setRotation(rotationFor(out)).setRotationPivot(new BlockPos(size.getX() / 2, 0, 0));
                pivot = new BlockPos(size.getX() / 2, cfg.sink(), 0);
                anchor = new BlockPos(o.getX(), waterTop + 1, o.getZ());   // v3.3: the pier starts on the land
            } else {
                // a cave floor with room above most of the footprint
                BlockPos f = ctx.origin();
                if (!solid(level, f.below()) || !level.isEmptyBlock(f)) return false;
                int open = 0;
                for (int dx = -size.getX() / 2; dx <= size.getX() / 2; dx += Math.max(1, size.getX() / 2))
                    for (int dz = -size.getZ() / 2; dz <= size.getZ() / 2; dz += Math.max(1, size.getZ() / 2)) {
                        BlockPos q = f.offset(dx, 0, dz);
                        if (!level.getBlockState(q).isSolid() && level.getFluidState(q).isEmpty() && level.getFluidState(q.above()).isEmpty()) open++;
                    }
                if (open < 5) return false;
                settings.setRotation(Rotation.getRandom(r)).setRotationPivot(new BlockPos(size.getX() / 2, 0, size.getZ() / 2));
                pivot = new BlockPos(size.getX() / 2, cfg.sink(), size.getZ() / 2);
                anchor = f;
            }
            BlockPos offset = anchor.subtract(pivot);
            t.placeInWorld(level, offset, offset, settings, r, 2);
            return true;
        }
    }

    // (v3.4: the Kaiser Crab cavern and the web nests are structures now - SpireStructures)

    // ------------------------------------------------------------------ waterfall room and sword statue (from CliffSpring)
    /**
     * The room behind a tall waterfall (STS2 Waterfall of Obvious Secrets): the cave pocket gets furnished either as a
     * camp (campfire, bedroll, barrel, chest) or as a meditation room (moss floor, candles, a lectern with a book).
     */
    static void furnishWaterfallRoom(WorldGenLevel level, RandomSource r, BlockPos c, Direction toFall) {
        // the floor under the pocket's middle
        BlockPos f = c;
        for (int k = 0; k < 5 && level.getBlockState(f.below()).isAir(); k++) f = f.below();
        if (!level.getBlockState(f).isAir() || !solid(level, f.below())) return;
        Direction back = toFall.getOpposite(), side = toFall.getClockWise();
        boolean camp = r.nextBoolean();
        if (camp) {
            set(level, f.below(), Blocks.STONE.defaultBlockState());
            set(level, f, Blocks.CAMPFIRE.defaultBlockState());
            place(level, f.relative(side, 2), Blocks.RED_CARPET.defaultBlockState());
            place(level, f.relative(side, 2).relative(back), Blocks.RED_CARPET.defaultBlockState());
            place(level, f.relative(side.getOpposite(), 2), Blocks.BARREL.defaultBlockState());
            BlockPos ch = f.relative(back, 2);
            if (level.getBlockState(ch).isAir() && solid(level, ch.below())) chest(level, r, ch, toFall, "camp");
        } else {
            for (int dx = -2; dx <= 2; dx++) for (int dz = -2; dz <= 2; dz++) {
                BlockPos q = f.offset(dx, 0, dz);
                if (level.getBlockState(q).isAir() && solid(level, q.below())) set(level, q, Blocks.MOSS_CARPET.defaultBlockState());
            }
            BlockPos lectern = f.relative(back, 2);
            if (level.getBlockState(lectern).is(Blocks.MOSS_CARPET) || level.getBlockState(lectern).isAir())
                set(level, lectern, Blocks.LECTERN.defaultBlockState().setValue(net.minecraft.world.level.block.LecternBlock.FACING, toFall));
            for (BlockPos q : List.of(f.relative(side, 2), f.relative(side.getOpposite(), 2), f.relative(back, 2).relative(side, 2)))
                if (level.getBlockState(q).is(Blocks.MOSS_CARPET) || level.getBlockState(q).isAir() && solid(level, q.below()))
                    set(level, q, Blocks.CANDLE.defaultBlockState().setValue(net.minecraft.world.level.block.CandleBlock.CANDLES, 1 + r.nextInt(4))
                            .setValue(net.minecraft.world.level.block.CandleBlock.LIT, true));
            set(level, f, Blocks.MOSS_CARPET.defaultBlockState());
        }
    }

    private static void place(WorldGenLevel level, BlockPos p, BlockState s) {
        if (level.getBlockState(p).isAir() && solid(level, p.below())) set(level, p, s);
    }

    /**
     * The sword in the stone (石中剑, v3.2 user: a statue holding a sword): on a mossy islet in the middle of the bottom
     * pool of a stepped fall stands a robed stone figure, hands together in front, gripping a sword that points down.
     * The sword block can be taken (SwordStatueBlock).
     */
    /**
     * v3.4 (user: lower the chance, no repeats): the world is cut into regions of 24 x 24 chunks; each region has one
     * spot (from the world seed) and a sword statue may only stand within two chunks of it - so at most one per
     * region, and only where a stepped fall happens to end near that spot.
     */
    static boolean swordStatueAllowed(WorldGenLevel level, BlockPos pos) {
        int cx = pos.getX() >> 4, cz = pos.getZ() >> 4, rx = Math.floorDiv(cx, 24), rz = Math.floorDiv(cz, 24);
        RandomSource pick = RandomSource.create(level.getSeed() ^ (rx * 341873128712L + rz * 132897987541L) ^ 0x5157A7E5L);
        int sx = rx * 24 + 2 + pick.nextInt(20), sz = rz * 24 + 2 + pick.nextInt(20);
        return Math.abs(cx - sx) <= 2 && Math.abs(cz - sz) <= 2;
    }

    static void swordStatue(WorldGenLevel level, RandomSource r, BlockPos water, Direction facing) {
        // v3.3 (user: more detail, more variety): one of several statue templates (tools/structures/build.js,
        // sword_statue/*) on a 5x5 mossy islet; the template's front (-z) turns to face down the slope
        for (int dx = -2; dx <= 2; dx++) for (int dz = -2; dz <= 2; dz++) {
            if (Math.abs(dx) == 2 && Math.abs(dz) == 2) continue;
            for (int k = -3; k <= -1; k++) set(level, water.offset(dx, k, dz), Blocks.MOSSY_COBBLESTONE.defaultBlockState());
        }
        placeTemplate(level, r, SpireCraft_id("sword_statue/" + (1 + r.nextInt(3))), water, new BlockPos(2, 0, 3), rotationFor(facing.getOpposite()));
    }

    private static ResourceLocation SpireCraft_id(String path) {
        return ResourceLocation.fromNamespaceAndPath("spirecraft", path);
    }

    /** Places a template so that its point {@code pivot} lands on {@code at}, turned by {@code rot} about that point. */
    static boolean placeTemplate(WorldGenLevel level, RandomSource r, ResourceLocation id, BlockPos at, BlockPos pivot, Rotation rot) {
        StructureTemplate t = level.getLevel().getServer().getStructureManager().getOrCreate(id);
        if (t.getSize().getX() == 0) return false;
        ChunkPos cp = new ChunkPos(at);
        StructurePlaceSettings settings = new StructurePlaceSettings().setRandom(r).addProcessor(BlockIgnoreProcessor.STRUCTURE_BLOCK)
                .setRotation(rot).setRotationPivot(pivot)
                .setBoundingBox(new BoundingBox(cp.getMinBlockX() - 16, level.getMinY(), cp.getMinBlockZ() - 16, cp.getMaxBlockX() + 16, level.getMaxY(), cp.getMaxBlockZ() + 16));
        BlockPos offset = at.subtract(pivot);
        return t.placeInWorld(level, offset, offset, settings, r, 2);
    }
}
