package com.mockingjam.spirecraft.worldgen;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mojang.serialization.Codec;
import com.mojang.serialization.MapCodec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.core.registries.Registries;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.tags.BlockTags;
import net.minecraft.util.RandomSource;
import net.minecraft.world.RandomizableContainer;
import net.minecraft.world.level.ChunkPos;
import net.minecraft.world.level.NoiseColumn;
import net.minecraft.world.level.ServerLevelAccessor;
import net.minecraft.world.level.StructureManager;
import net.minecraft.world.level.WorldGenLevel;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.ChestBlock;
import net.minecraft.world.level.block.Rotation;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.chunk.ChunkGenerator;
import net.minecraft.world.level.levelgen.Heightmap;
import net.minecraft.world.level.levelgen.structure.BoundingBox;
import net.minecraft.world.level.levelgen.structure.Structure;
import net.minecraft.world.level.levelgen.structure.StructurePiece;
import net.minecraft.world.level.levelgen.structure.StructureType;
import net.minecraft.world.level.levelgen.structure.TemplateStructurePiece;
import net.minecraft.world.level.levelgen.structure.pieces.StructurePieceSerializationContext;
import net.minecraft.world.level.levelgen.structure.pieces.StructurePieceType;
import net.minecraft.world.level.LevelReader;
import net.minecraft.world.level.levelgen.structure.templatesystem.BlockIgnoreProcessor;
import net.minecraft.world.level.levelgen.structure.templatesystem.LiquidSettings;
import net.minecraft.world.level.levelgen.structure.templatesystem.StructurePlaceSettings;
import net.minecraft.world.level.levelgen.structure.templatesystem.StructureProcessor;
import net.minecraft.world.level.levelgen.structure.templatesystem.StructureProcessorType;
import net.minecraft.world.level.levelgen.structure.templatesystem.StructureTemplate;
import net.minecraft.world.level.levelgen.structure.templatesystem.StructureTemplateManager;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.RegistryObject;

/**
 * v3.4 (user: every structure findable with /locate): the structures that fit the terrain, as real structures.
 * <ul>
 *   <li>{@code spirecraft:cave_template} - one template on a cave floor found in the noise column (beekeeper's dwelling,
 *       bowl bug nests, scrap piles, the fungus shrine, the field of holes), or at a shore (the dock piers).</li>
 *   <li>{@code spirecraft:carved} - cut into the rock chunk by chunk: the Kaiser Crab's cavern and the web nests.
 *       Everything they place is computed from the structure's seed and the block position, so the parts cut in
 *       different chunks fit together.</li>
 * </ul>
 */
public final class SpireStructures {
    private SpireStructures() {}

    public static final DeferredRegister<StructureType<?>> TYPES = DeferredRegister.create(Registries.STRUCTURE_TYPE, SpireCraft.MODID);
    public static final DeferredRegister<StructurePieceType> PIECES = DeferredRegister.create(Registries.STRUCTURE_PIECE, SpireCraft.MODID);

    public static final RegistryObject<StructureType<CaveTemplate>> CAVE_TEMPLATE = TYPES.register("cave_template", () -> () -> CaveTemplate.CODEC);
    public static final RegistryObject<StructureType<Carved>> CARVED = TYPES.register("carved", () -> () -> Carved.CODEC);
    public static final RegistryObject<StructurePieceType> TEMPLATE_PIECE = PIECES.register("template_piece",
            () -> (StructurePieceType.StructureTemplateType) TemplatePiece::new);
    public static final RegistryObject<StructurePieceType> CARVED_PIECE = PIECES.register("carved_piece",
            () -> (StructurePieceType.ContextlessType) CarvedPiece::new);
    public static final DeferredRegister<StructureProcessorType<?>> PROCESSORS = DeferredRegister.create(Registries.STRUCTURE_PROCESSOR, SpireCraft.MODID);
    public static final RegistryObject<StructureProcessorType<HangingPosProcessor>> HANGING_POS = PROCESSORS.register("hanging_pos",
            () -> () -> HangingPosProcessor.CODEC);

    /**
     * Issue #37 (item frames with throwing knives on the Silent's targets): a template's hanging entities carry no
     * {@code block_pos}, so they log "Block-attached entity at invalid position" when placed. This writes the placed
     * position in (Forge hands {@code processEntity} the already rotated and offset position).
     */
    public static final class HangingPosProcessor extends StructureProcessor {
        static final HangingPosProcessor INSTANCE = new HangingPosProcessor();
        static final MapCodec<HangingPosProcessor> CODEC = MapCodec.unit(INSTANCE);

        @Override
        public StructureTemplate.StructureEntityInfo processEntity(LevelReader level, BlockPos seed, StructureTemplate.StructureEntityInfo raw,
                StructureTemplate.StructureEntityInfo info, StructurePlaceSettings settings, StructureTemplate template) {
            if (!info.nbt.contains("Facing") || info.nbt.contains("block_pos")) return info;
            CompoundTag tag = info.nbt.copy();
            tag.store("block_pos", BlockPos.CODEC, info.blockPos);
            return new StructureTemplate.StructureEntityInfo(info.pos, info.blockPos, tag);
        }

        @Override
        protected StructureProcessorType<?> getType() {
            return HANGING_POS.get();
        }
    }

    private static long hash(long seed, int x, int y, int z) {
        long h = seed ^ (x * 3129871L) ^ (z * 116129781L) ^ (long) y * 0x9E3779B97F4A7C15L;
        h = (h ^ (h >>> 33)) * 0xff51afd7ed558ccdL;
        h = (h ^ (h >>> 33)) * 0xc4ceb9fe1a85ec53L;
        return h ^ (h >>> 33);
    }

    private static float rand(long seed, int x, int y, int z) {
        return (hash(seed, x, y, z) >>> 40) / (float) (1L << 24);
    }

    // ------------------------------------------------------------------ template structures
    public static final class CaveTemplate extends Structure {
        public static final MapCodec<CaveTemplate> CODEC = RecordCodecBuilder.mapCodec(i -> i.group(
                settingsCodec(i),
                ResourceLocation.CODEC.listOf().fieldOf("templates").forGetter(s -> s.templates),
                Codec.STRING.fieldOf("mode").forGetter(s -> s.mode),
                Codec.INT.optionalFieldOf("sink", 1).forGetter(s -> s.sink),
                Codec.INT.optionalFieldOf("min_y", -50).forGetter(s -> s.minY),
                Codec.INT.optionalFieldOf("max_y", 40).forGetter(s -> s.maxY),
                Codec.BOOL.optionalFieldOf("ignore_waterlogging", false).forGetter(s -> s.dry)).apply(i, CaveTemplate::new));

        final List<ResourceLocation> templates;
        final String mode;
        final int sink, minY, maxY;
        /** Issue #37 (the Silent's vault flooded): place without taking in the ground water - blocks that can hold water
         * stay dry instead of waterlogging (and spilling) where the template meets an aquifer or the swamp. */
        final boolean dry;

        CaveTemplate(StructureSettings settings, List<ResourceLocation> templates, String mode, int sink, int minY, int maxY, boolean dry) {
            super(settings);
            this.templates = templates;
            this.mode = mode;
            this.sink = sink;
            this.minY = minY;
            this.maxY = maxY;
            this.dry = dry;
        }

        @Override
        public StructureType<?> type() {
            return CAVE_TEMPLATE.get();
        }

        @Override
        protected Optional<GenerationStub> findGenerationPoint(GenerationContext ctx) {
            RandomSource r = ctx.random();
            ResourceLocation id = templates.get(r.nextInt(templates.size()));
            var size = ctx.structureTemplateManager().getOrCreate(id).getSize();
            if (size.getX() == 0) return Optional.empty();
            int x = ctx.chunkPos().getMiddleBlockX(), z = ctx.chunkPos().getMiddleBlockZ();
            if (mode.equals("shore")) return shore(ctx, id, size, x, z);
            if (mode.equals("open_ground")) return openGround(ctx, id, size, x, z);
            if (mode.equals("stilts")) return stilts(ctx, id, size, x, z);
            // a cave floor: air with headroom over solid rock, here and at the template's corners
            NoiseColumn col = ctx.chunkGenerator().getBaseColumn(x, z, ctx.heightAccessor(), ctx.randomState());
            List<Integer> floors = new ArrayList<>();
            for (int y = maxY; y > minY; y--) {
                if (open(col, y) && open(col, y + 1) && open(col, y + 2) && open(col, y + 3) && solid(col, y - 1)) floors.add(y);
            }
            if (floors.isEmpty()) return Optional.empty();
            int y = floors.get(r.nextInt(floors.size()));
            int hw = size.getX() / 2, hd = size.getZ() / 2, ok = 0;
            for (int[] o : new int[][] { { -hw, -hd }, { hw, -hd }, { -hw, hd }, { hw, hd } }) {
                NoiseColumn c = ctx.chunkGenerator().getBaseColumn(x + o[0], z + o[1], ctx.heightAccessor(), ctx.randomState());
                if (open(c, y) || open(c, y + 1)) ok++;
            }
            if (ok < 2) return Optional.empty();
            BlockPos anchor = new BlockPos(x, y, z);
            Rotation rot = Rotation.getRandom(r);
            BlockPos pivot = new BlockPos(hw, sink, hd);
            return Optional.of(new GenerationStub(anchor, b -> b.addPiece(new TemplatePiece(ctx.structureTemplateManager(), id, anchor.subtract(pivot), rot, pivot, dry))));
        }

        private static boolean open(NoiseColumn col, int y) {
            BlockState s = col.getBlock(y);
            return s.isAir();
        }

        private static boolean solid(NoiseColumn col, int y) {
            BlockState s = col.getBlock(y);
            return !s.isAir() && s.getFluidState().isEmpty();
        }

        /** A pier: from dry land at the water's edge, pointing out over open water (template +z = out). */
        private Optional<GenerationStub> shore(GenerationContext ctx, ResourceLocation id, net.minecraft.core.Vec3i size, int x, int z) {
            var gen = ctx.chunkGenerator();
            int surface = gen.getBaseHeight(x, z, Heightmap.Types.WORLD_SURFACE_WG, ctx.heightAccessor(), ctx.randomState());
            int floor = gen.getBaseHeight(x, z, Heightmap.Types.OCEAN_FLOOR_WG, ctx.heightAccessor(), ctx.randomState());
            if (surface != floor) return Optional.empty();   // the start must be on land
            for (Direction d : Direction.Plane.HORIZONTAL) {
                boolean water = true;
                int waterTop = 0;
                for (int k = 2; k <= 10 && water; k += 2) {
                    int s2 = gen.getBaseHeight(x + d.getStepX() * k, z + d.getStepZ() * k, Heightmap.Types.WORLD_SURFACE_WG, ctx.heightAccessor(), ctx.randomState());
                    int f2 = gen.getBaseHeight(x + d.getStepX() * k, z + d.getStepZ() * k, Heightmap.Types.OCEAN_FLOOR_WG, ctx.heightAccessor(), ctx.randomState());
                    water = s2 > f2;
                    if (k == 4) waterTop = s2 - 1;
                }
                if (!water || Math.abs(surface - 1 - waterTop) > 2) continue;
                Rotation rot = switch (d) { case WEST -> Rotation.CLOCKWISE_90; case NORTH -> Rotation.CLOCKWISE_180; case EAST -> Rotation.COUNTERCLOCKWISE_90; default -> Rotation.NONE; };
                BlockPos anchor = new BlockPos(x, waterTop + 1, z), pivot = new BlockPos(size.getX() / 2, sink, 0);
                return Optional.of(new GenerationStub(anchor, b -> b.addPiece(new TemplatePiece(ctx.structureTemplateManager(), id, anchor.subtract(pivot), rot, pivot, dry))));
            }
            return Optional.empty();
        }

        private static int height(GenerationContext ctx, int x, int z, Heightmap.Types type) {
            return ctx.chunkGenerator().getBaseHeight(x, z, type, ctx.heightAccessor(), ctx.randomState());
        }

        /**
         * v3.7 (user: the Ironclad camp only on open, fairly flat dry ground, its gate facing the open side): the whole
         * footprint must be dry land within 6 blocks of height; the template's +z side (the gate) is turned to the
         * direction whose ground in front of the gate rises least above the camp.
         */
        private Optional<GenerationStub> openGround(GenerationContext ctx, ResourceLocation id, net.minecraft.core.Vec3i size, int x, int z) {
            int r = Math.max(size.getX(), size.getZ()) / 2 - 1;
            int min = Integer.MAX_VALUE, max = Integer.MIN_VALUE, sum = 0, n = 0;
            for (int dx = -r; dx <= r; dx += 4) for (int dz = -r; dz <= r; dz += 4) {
                if (dx * dx + dz * dz > r * r) continue;
                int s = height(ctx, x + dx, z + dz, Heightmap.Types.WORLD_SURFACE_WG);
                if (s != height(ctx, x + dx, z + dz, Heightmap.Types.OCEAN_FLOOR_WG)) return Optional.empty();   // water
                min = Math.min(min, s);
                max = Math.max(max, s);
                sum += s;
                n++;
            }
            if (max - min > 6) return Optional.empty();
            int ground = Math.round(sum / (float) n);
            Direction best = Direction.SOUTH;
            int bestScore = Integer.MAX_VALUE;
            for (Direction d : Direction.Plane.HORIZONTAL) {
                int score = 0;
                for (int k = r + 3; k <= r + 15; k += 4) for (int side = -6; side <= 6; side += 6) {
                    int px = x + d.getStepX() * k - d.getStepZ() * side, pz = z + d.getStepZ() * k + d.getStepX() * side;
                    score += Math.max(0, height(ctx, px, pz, Heightmap.Types.WORLD_SURFACE_WG) - ground);
                }
                score = score * 4 + ctx.random().nextInt(4);   // ties broken at random
                if (score < bestScore) { bestScore = score; best = d; }
            }
            Rotation rot = switch (best) { case WEST -> Rotation.CLOCKWISE_90; case NORTH -> Rotation.CLOCKWISE_180; case EAST -> Rotation.COUNTERCLOCKWISE_90; default -> Rotation.NONE; };
            BlockPos anchor = new BlockPos(x, ground, z), pivot = new BlockPos(size.getX() / 2, sink, size.getZ() / 2);
            return Optional.of(new GenerationStub(anchor, b -> b.addPiece(new TemplatePiece(ctx.structureTemplateManager(), id, anchor.subtract(pivot), rot, pivot, dry))));
        }

        /**
         * Issue #37 (the Silent's stilt village in the swamp / jungle): the footprint may be shallow water (at most 3
         * deep) or land, but the template's stilts reach {@code sink - 1} blocks below the mean surface, so the floor must
         * not drop further than that, and no ground may rise more than 2 above the mean (v2, user: lower - the deck
         * stands only 2 above it).
         */
        private Optional<GenerationStub> stilts(GenerationContext ctx, ResourceLocation id, net.minecraft.core.Vec3i size, int x, int z) {
            int r = Math.max(size.getX(), size.getZ()) / 2 - 1;
            int minFloor = Integer.MAX_VALUE, maxSurface = Integer.MIN_VALUE, sum = 0, n = 0;
            for (int dx = -r; dx <= r; dx += 4) for (int dz = -r; dz <= r; dz += 4) {
                if (dx * dx + dz * dz > r * r) continue;
                int s = height(ctx, x + dx, z + dz, Heightmap.Types.WORLD_SURFACE_WG), f = height(ctx, x + dx, z + dz, Heightmap.Types.OCEAN_FLOOR_WG);
                if (s - f > 3) return Optional.empty();   // deep water
                minFloor = Math.min(minFloor, f);
                maxSurface = Math.max(maxSurface, s);
                sum += s;
                n++;
            }
            int ground = Math.round(sum / (float) n);
            // the floor may not drop more than 4 below the mean: the stilts reach, and the Silent's vault (6 to 11 below
            // the mean surface) keeps a solid roof of earth
            if (ground - minFloor > Math.min(sink - 1, 4) || maxSurface - ground > 2) return Optional.empty();
            Rotation rot = Rotation.getRandom(ctx.random());
            BlockPos anchor = new BlockPos(x, ground, z), pivot = new BlockPos(size.getX() / 2, sink, size.getZ() / 2);
            return Optional.of(new GenerationStub(anchor, b -> b.addPiece(new TemplatePiece(ctx.structureTemplateManager(), id, anchor.subtract(pivot), rot, pivot, dry))));
        }
    }

    public static final class TemplatePiece extends TemplateStructurePiece {
        private final boolean dry;

        TemplatePiece(StructureTemplateManager manager, ResourceLocation id, BlockPos pos, Rotation rot, BlockPos pivot, boolean dry) {
            super(TEMPLATE_PIECE.get(), 0, manager, id, id.toString(), settings(rot, pivot, dry), pos);
            this.dry = dry;
        }

        TemplatePiece(StructureTemplateManager manager, CompoundTag tag) {
            super(TEMPLATE_PIECE.get(), tag, manager, id -> settings(tag.read("Rot", Rotation.LEGACY_CODEC).orElse(Rotation.NONE),
                    new BlockPos(tag.getIntOr("PX", 0), 0, tag.getIntOr("PZ", 0)), tag.getBooleanOr("Dry", false)));
            this.dry = tag.getBooleanOr("Dry", false);
        }

        private static StructurePlaceSettings settings(Rotation rot, BlockPos pivot, boolean dry) {
            return new StructurePlaceSettings().setRotation(rot).setRotationPivot(new BlockPos(pivot.getX(), 0, pivot.getZ()))
                    .addProcessor(BlockIgnoreProcessor.STRUCTURE_BLOCK).addProcessor(HangingPosProcessor.INSTANCE)
                    .setLiquidSettings(dry ? LiquidSettings.IGNORE_WATERLOGGING : LiquidSettings.APPLY_WATERLOGGING);
        }

        @Override
        protected void addAdditionalSaveData(StructurePieceSerializationContext ctx, CompoundTag tag) {
            super.addAdditionalSaveData(ctx, tag);
            tag.store("Rot", Rotation.LEGACY_CODEC, placeSettings.getRotation());
            tag.putInt("PX", placeSettings.getRotationPivot().getX());
            tag.putInt("PZ", placeSettings.getRotationPivot().getZ());
            tag.putBoolean("Dry", dry);
        }

        @Override
        protected void handleDataMarker(String name, BlockPos pos, ServerLevelAccessor level, RandomSource r, BoundingBox box) {
        }
    }

    // ------------------------------------------------------------------ carved structures
    public static final class Carved extends Structure {
        public static final MapCodec<Carved> CODEC = RecordCodecBuilder.mapCodec(i -> i.group(
                settingsCodec(i),
                Codec.STRING.fieldOf("kind").forGetter(s -> s.kind),
                Codec.INT.optionalFieldOf("min_y", -40).forGetter(s -> s.minY),
                Codec.INT.optionalFieldOf("max_y", 10).forGetter(s -> s.maxY)).apply(i, Carved::new));

        final String kind;
        final int minY, maxY;

        Carved(StructureSettings settings, String kind, int minY, int maxY) {
            super(settings);
            this.kind = kind;
            this.minY = minY;
            this.maxY = maxY;
        }

        @Override
        public StructureType<?> type() {
            return CARVED.get();
        }

        private static boolean solidAt(NoiseColumn col, int y) {
            BlockState b = col.getBlock(y);
            return !b.isAir() && b.getFluidState().isEmpty();
        }

        @Override
        protected Optional<GenerationStub> findGenerationPoint(GenerationContext ctx) {
            RandomSource r = ctx.random();
            int x = ctx.chunkPos().getMiddleBlockX(), z = ctx.chunkPos().getMiddleBlockZ();
            if (kind.equals("meteor_crater")) return crater(ctx, x, z);
            int y = minY + r.nextInt(Math.max(1, maxY - minY));
            int surface = ctx.chunkGenerator().getBaseHeight(x, z, Heightmap.Types.WORLD_SURFACE_WG, ctx.heightAccessor(), ctx.randomState());
            boolean kaiser = kind.equals("kaiser_cave");
            if (surface < y + (kaiser ? 34 : 14)) return Optional.empty();
            if (kind.equals("mycelium_shrine") || kind.equals("beekeeper_hollow")) {
                // v3.5 (user): hollowed out inside the rock, not standing in a cave (v3.6: the shrine is a big hall now)
                NoiseColumn col = ctx.chunkGenerator().getBaseColumn(x, z, ctx.heightAccessor(), ctx.randomState());
                int reach = kind.equals("mycelium_shrine") ? 8 : 4;
                for (int dy = -reach; dy <= reach; dy += 2) if (!solidAt(col, y + dy)) return Optional.empty();
            }
            if (kind.equals("web_nest")) {
                // v3.6 (user: never floating - only against a wall or inside it): the middle must be in solid rock and
                // a cave must open within a few blocks to one side, so the nest is set into the cave's wall
                NoiseColumn mid = ctx.chunkGenerator().getBaseColumn(x, z, ctx.heightAccessor(), ctx.randomState());
                NoiseColumn[] sides = new NoiseColumn[4];
                int[][] off = { { 7, 0 }, { -7, 0 }, { 0, 7 }, { 0, -7 } };
                for (int k = 0; k < 4; k++) sides[k] = ctx.chunkGenerator().getBaseColumn(x + off[k][0], z + off[k][1], ctx.heightAccessor(), ctx.randomState());
                int found = Integer.MIN_VALUE;
                for (int tries = 0, yy = y; tries < 12 && found == Integer.MIN_VALUE; tries++, yy = minY + Math.floorMod(yy - minY + 5, Math.max(1, maxY - minY))) {
                    boolean inRock = true;
                    for (int dy = -3; dy <= 3 && inRock; dy++) inRock = solidAt(mid, yy + dy);
                    if (!inRock) continue;
                    for (NoiseColumn sc : sides) if (!solidAt(sc, yy) && sc.getBlock(yy).getFluidState().isEmpty() && solidAt(sc, yy - 4)) { found = yy; break; }
                }
                if (found == Integer.MIN_VALUE) return Optional.empty();
                y = found;
            }
            BlockPos c = new BlockPos(x, y, z);
            long seed = r.nextLong();
            return Optional.of(new GenerationStub(c, b -> b.addPiece(new CarvedPiece(kind, c, seed))));
        }

        /**
         * Issue #36 (the Regent's meteor crater): on open dry ground only. Every sample over the crater and its rim must
         * be land (no water on top) and within 6 blocks of height; the crater is cut relative to their mean height.
         */
        private Optional<GenerationStub> crater(GenerationContext ctx, int x, int z) {
            int min = Integer.MAX_VALUE, max = Integer.MIN_VALUE, sum = 0, n = 0;
            for (int dx = -22; dx <= 22; dx += 4) for (int dz = -22; dz <= 22; dz += 4) {
                if (dx * dx + dz * dz > 22 * 22) continue;
                int s = ctx.chunkGenerator().getBaseHeight(x + dx, z + dz, Heightmap.Types.WORLD_SURFACE_WG, ctx.heightAccessor(), ctx.randomState());
                int f = ctx.chunkGenerator().getBaseHeight(x + dx, z + dz, Heightmap.Types.OCEAN_FLOOR_WG, ctx.heightAccessor(), ctx.randomState());
                if (s != f) return Optional.empty();
                min = Math.min(min, s);
                max = Math.max(max, s);
                sum += s;
                n++;
            }
            if (max - min > 6) return Optional.empty();
            BlockPos c = new BlockPos(x, Math.round(sum / (float) n) - 1, z);   // y: the mean top block
            long seed = ctx.random().nextLong();
            return Optional.of(new GenerationStub(c, b -> b.addPiece(new CarvedPiece(kind, c, seed))));
        }
    }

    public static final class CarvedPiece extends StructurePiece {
        private final String kind;
        private final BlockPos c;
        private final long seed;

        CarvedPiece(String kind, BlockPos c, long seed) {
            super(CARVED_PIECE.get(), 0, kind.equals("kaiser_cave") ? new BoundingBox(c.getX() - 30, c.getY() - 16, c.getZ() - 30, c.getX() + 30, c.getY() + 18, c.getZ() + 30)
                    : kind.equals("meteor_crater") ? new BoundingBox(c.getX() - 30, c.getY() - 15, c.getZ() - 30, c.getX() + 30, c.getY() + 16, c.getZ() + 30)
                    : kind.equals("beekeeper_hollow") ? new BoundingBox(c.getX() - 16, c.getY() - 6, c.getZ() - 12, c.getX() + 16, c.getY() + 7, c.getZ() + 12)
                    : kind.equals("mycelium_shrine") ? new BoundingBox(c.getX() - 15, c.getY() - 7, c.getZ() - 15, c.getX() + 15, c.getY() + 12, c.getZ() + 15)
                    : new BoundingBox(c.getX() - 11, c.getY() - 8, c.getZ() - 11, c.getX() + 11, c.getY() + 11, c.getZ() + 11));
            this.kind = kind;
            this.c = c;
            this.seed = seed;
        }

        CarvedPiece(CompoundTag tag) {
            super(CARVED_PIECE.get(), tag);
            this.kind = tag.getStringOr("Kind", "web_nest");
            this.c = new BlockPos(tag.getIntOr("CX", 0), tag.getIntOr("CY", 0), tag.getIntOr("CZ", 0));
            this.seed = tag.getLongOr("Seed", 0L);
        }

        @Override
        protected void addAdditionalSaveData(StructurePieceSerializationContext ctx, CompoundTag tag) {
            tag.putString("Kind", kind);
            tag.putInt("CX", c.getX());
            tag.putInt("CY", c.getY());
            tag.putInt("CZ", c.getZ());
            tag.putLong("Seed", seed);
        }

        @Override
        public void postProcess(WorldGenLevel level, StructureManager sm, ChunkGenerator gen, RandomSource random, BoundingBox box, ChunkPos chunk, BlockPos pos) {
            switch (kind) {
                case "kaiser_cave" -> kaiser(level, box);
                case "mycelium_shrine" -> shrine(level, box);
                case "beekeeper_hollow" -> beekeeper(level, box);
                case "meteor_crater" -> crater(level, box);
                default -> web(level, box);
            }
        }

        private static void set(WorldGenLevel level, BoundingBox box, BlockPos p, BlockState s) {
            if (box.isInside(p)) level.setBlock(p, s, 2);
        }

        private static boolean carvable(BlockState s) {
            return !s.is(Blocks.BEDROCK) && s.getFluidState().isEmpty() && !s.is(Blocks.SPAWNER) && !s.is(Blocks.CHEST);
        }

        /**
         * The Kaiser Crab's cavern (v3.4 user: more room for the crab, smaller cones, rarer): a hollow about 46-52
         * across and 22-26 high in the hive rock, small stone cones hanging from the roof and rising from the floor,
         * bones, eyed chitin and hive caches on the floor.
         */
        private void kaiser(WorldGenLevel level, BoundingBox box) {
            RandomSource r = RandomSource.create(seed);
            float rx = 23 + r.nextFloat() * 3, ry = 11 + r.nextFloat() * 2, rz = 23 + r.nextFloat() * 3;
            BlockState wall = c.getY() < 0 ? ModBlocks.DEEP_HIVE_ROCK.base.get().defaultBlockState() : ModBlocks.HIVE_ROCK.base.get().defaultBlockState();
            BlockState soil = ModBlocks.HIVE_SOIL.get().defaultBlockState(), air = Blocks.CAVE_AIR.defaultBlockState();
            BlockPos.MutableBlockPos p = new BlockPos.MutableBlockPos();
            for (int x = box.minX(); x <= box.maxX(); x++) for (int z = box.minZ(); z <= box.maxZ(); z++) for (int y = box.minY(); y <= box.maxY(); y++) {
                int dx = x - c.getX(), dy = y - c.getY(), dz = z - c.getZ();
                if (Math.abs(dx) > 30 || Math.abs(dz) > 30 || dy < -16 || dy > 18) continue;
                double n = Math.sin(dx * 0.23 + dz * 0.13) * 0.05 + Math.cos(dz * 0.21 - dy * 0.3) * 0.04;
                double e = (dx / rx) * (dx / rx) + (dy / ry) * (dy / ry) + (dz / rz) * (dz / rz) + n;
                if (e > 1.6) continue;
                p.set(x, y, z);
                BlockState s = level.getBlockState(p);
                // v3.6 (user: the cave cut amethyst geodes in half): geodes near the cavern turn to plain rock
                if (geode(s)) { level.setBlock(p, s.is(Blocks.AMETHYST_CLUSTER) || s.getBlock() instanceof net.minecraft.world.level.block.AmethystClusterBlock ? air : wall, 2); if (e > 1) continue; }
                if (e > 1.2) continue;
                if (!carvable(s)) continue;
                if (e <= 1) level.setBlock(p, dy <= -ry + 1 ? wall : air, 2);
                else if (!s.isAir()) level.setBlock(p, dy < -2 && rand(seed, x, y, z) < 0.3F ? soil : wall, 2);
            }
            // the cones: small, hanging from the roof and standing on the floor. v3.6 (user: some floated): each starts
            // from the cavern's own surface worked out from its shape, and only where the rock beyond it is really solid
            for (int i = 0; i < 30; i++) {
                double a = r.nextDouble() * Math.PI * 2, d = Math.sqrt(r.nextDouble()) * 0.85;
                int x = (int) Math.round(Math.cos(a) * rx * d), z = (int) Math.round(Math.sin(a) * rz * d);
                boolean down = r.nextBoolean();
                float rad = 0.6F + r.nextFloat() * 1.3F;
                int h = 3 + r.nextInt(3) + Math.round(rad * 2);
                int edge = surface(x, z, rx, ry, rz, down);                    // the last air cell under the roof / over the floor
                if (edge == Integer.MIN_VALUE) continue;
                BlockPos base = c.offset(x, edge, z), anchor = down ? base.above() : base.below();
                if (!level.getBlockState(anchor).isSolid()) continue;
                if (!level.getBlockState(base).isAir()) continue;
                for (int j = 0; j < h; j++) {
                    float rr = rad * (1 - (float) j / h) + 0.35F;
                    int ir = (int) Math.ceil(rr);
                    for (int ddx = -ir; ddx <= ir; ddx++) for (int ddz = -ir; ddz <= ir; ddz++) {
                        if (ddx * ddx + ddz * ddz > rr * rr) continue;
                        BlockPos q = base.offset(ddx, down ? -j : j, ddz);
                        if (box.isInside(q) && level.getBlockState(q).isAir()) level.setBlock(q, wall, 2);
                        // the first ring reaches back to the rock where the roof (floor) curves away from it
                        if (j == 0) for (int k = 1; k <= 4; k++) {
                            BlockPos g = down ? q.above(k) : q.below(k);
                            if (!box.isInside(g) || !level.getBlockState(g).isAir()) break;
                            level.setBlock(g, wall, 2);
                        }
                    }
                }
            }
            // v3.5 (user): one or two long bones lying on the floor like a fossil, half sunk in it - not a skeleton
            for (int b = 0, n = 1 + r.nextInt(2); b < n; b++) {
                int len = 7 + r.nextInt(5), bx = r.nextInt(17) - 8, bz = r.nextInt(17) - 8;
                boolean alongX = r.nextBoolean();
                double kk = 1 - (bx / rx) * (bx / rx) - (bz / rz) * (bz / rz);
                if (kk <= 0.2) continue;
                int fy = c.getY() - (int) Math.floor(ry * Math.sqrt(kk)) + 1;
                BlockState shaft = Blocks.BONE_BLOCK.defaultBlockState().setValue(net.minecraft.world.level.block.RotatedPillarBlock.AXIS, alongX ? Direction.Axis.X : Direction.Axis.Z);
                for (int t = 0; t < len; t++) {
                    BlockPos q = new BlockPos(c.getX() + bx + (alongX ? t : 0), fy, c.getZ() + bz + (alongX ? 0 : t));
                    for (int k = 0; k < 4 && box.isInside(q.below()) && level.getBlockState(q.below()).isAir(); k++) q = q.below();
                    if (!box.isInside(q)) continue;
                    level.setBlock(q.below(), shaft, 2);                                  // the shaft, half sunk into the floor
                    if (t == 0 || t == len - 1) {                                          // a knob at each end
                        level.setBlock(q, Blocks.BONE_BLOCK.defaultBlockState(), 2);
                        BlockPos side = alongX ? q.below().south() : q.below().east();
                        if (box.isInside(side)) level.setBlock(side, Blocks.BONE_BLOCK.defaultBlockState(), 2);
                    }
                }
            }
            // the floor: a few skulls (v3.6 user: the bug carcass only in the fungus shrine)
            for (int i = 0; i < 8; i++) {
                int x = r.nextInt(39) - 19, z = r.nextInt(39) - 19;
                double k = 1 - (x / rx) * (x / rx) - (z / rz) * (z / rz);
                int pick = r.nextInt(10);
                if (k <= 0.1) continue;
                BlockPos q = c.offset(x, -(int) Math.floor(ry * Math.sqrt(k)) + 1, z);
                for (int t = 0; t < 4 && box.isInside(q.below()) && level.getBlockState(q.below()).isAir(); t++) q = q.below();
                if (!box.isInside(q) || !level.getBlockState(q).isAir() || level.getBlockState(q.below()).isAir()) continue;
                level.setBlock(q, Blocks.SKELETON_SKULL.defaultBlockState().setValue(net.minecraft.world.level.block.SkullBlock.ROTATION, pick), 2);
            }
            // batch 3: the Kaiser Crab itself waits on the cavern floor (like the elder guardians in a monument),
            // placed once, by the chunk that holds the middle of the floor
            int floor = surface(0, 0, rx, ry, rz, false);
            BlockPos lair = c.offset(0, floor == Integer.MIN_VALUE ? -(int) ry + 2 : floor, 0);
            if (box.isInside(lair)) {
                var crab = com.mockingjam.spirecraft.registry.ModEntities.KAISER_CRAB.get().create(level.getLevel(), net.minecraft.world.entity.EntitySpawnReason.STRUCTURE);
                if (crab != null) {
                    crab.snapTo(lair.getX() + 0.5, lair.getY(), lair.getZ() + 0.5, r.nextFloat() * 360, 0);
                    crab.finalizeSpawn(level, level.getCurrentDifficultyAt(lair), net.minecraft.world.entity.EntitySpawnReason.STRUCTURE, null);
                    level.addFreshEntityWithPassengers(crab);
                }
            }
        }

        /**
         * The Regent's meteor crater (issue #36). A star fell here; the Regent forged by it before going on to the Spire.
         * A round bowl 26-32 across and 8-9 deep under a raised rim of thrown-up ground, scorched rock lining it
         * (blackstone, basalt and a little magma round the middle, tuff and gravel further up, the biome's own ground at
         * the lip). The fallen star lies in the middle half sunk in the floor: a mass of meteorite split open along one
         * crack, its core of glowing Orange Dough showing, three end rods standing in the crack like rays of light.
         * More dough clumps lie in the bowl's floor and walls. Rays of ejecta (gravel, coarse dirt, tuff) and meteorite
         * fragments run out over the land around. On a flattened terrace part way down: the Regent's abandoned forge
         * (chipped anvil, smithing table, grindstone, the main chest, two barrels, a lantern); on the far rim a pole
         * with an orange banner.
         * Every shape is worked out from the seed and the column (the natural ground height read from the chunk being
         * cut), so the parts cut in different chunks fit together. All draws from {@code r} come before any placing.
         */
        private void crater(WorldGenLevel level, BoundingBox box) {
            RandomSource r = RandomSource.create(seed);
            float R = 13.5F + r.nextFloat() * 2.5F, rimH = 2.0F + r.nextFloat() * 1.2F, rimW = 7;
            int D = 8 + r.nextInt(2);
            double ph1 = r.nextDouble() * Math.PI * 2, ph2 = r.nextDouble() * Math.PI * 2, crackA = r.nextDouble() * Math.PI, forgeA = r.nextDouble() * Math.PI * 2;
            float ma = 3.4F + r.nextFloat() * 0.8F, mb = 2.8F + r.nextFloat() * 0.5F, mc = 3.0F + r.nextFloat() * 0.8F;
            long lootSeed = r.nextLong();
            int cx = c.getX(), cz = c.getZ(), H = c.getY(), floorY = H - D;
            // the forge terrace, part way down the bowl (flat, radius 3.5)
            int fx = (int) Math.round(Math.cos(forgeA) * R * 0.48), fz = (int) Math.round(Math.sin(forgeA) * R * 0.48);
            double uf = Math.sqrt(fx * fx + fz * fz) / R;
            int forgeY = (int) Math.round(floorY + (D + rimH) * uf * uf);
            BlockState dough = ModBlocks.ORANGE_DOUGH.get().defaultBlockState(), rock = ModBlocks.METEORITE.get().defaultBlockState();
            BlockPos.MutableBlockPos p = new BlockPos.MutableBlockPos();

            for (int x = box.minX(); x <= box.maxX(); x++) for (int z = box.minZ(); z <= box.maxZ(); z++) {
                int dx = x - cx, dz = z - cz;
                double d = Math.sqrt(dx * dx + dz * dz), u = d / R;
                if (u > 1.85) continue;
                int nat = level.getHeight(Heightmap.Types.WORLD_SURFACE_WG, x, z) - 1;   // the natural top block
                if (nat < box.minY() + 4 || nat > box.maxY() - 4) continue;
                BlockState top = level.getBlockState(p.set(x, nat, z)), sub = level.getBlockState(p.set(x, nat - 1, z));
                BlockState surf = top.isSolid() && top.getFluidState().isEmpty() ? top : Blocks.DIRT.defaultBlockState();
                BlockState under = sub.isSolid() && sub.getFluidState().isEmpty() && !sub.is(Blocks.GRASS_BLOCK) ? sub : Blocks.DIRT.defaultBlockState();
                double n = 0.6 * Math.sin(dx * 0.41 + dz * 0.23 + ph1) + 0.45 * Math.cos(dz * 0.37 - dx * 0.19 + ph2);
                double a = Math.atan2(dz, dx), ray = 0.6 * Math.sin(a * 7 + ph1) + 0.4 * Math.sin(a * 13 + ph2);
                if (u <= 1) {
                    boolean terrace = (dx - fx) * (dx - fx) + (dz - fz) * (dz - fz) <= 12.25;
                    double bowl = floorY + (D + rimH) * u * u + n * Math.min(1, u * 1.5);
                    if (d > R - 3) { double w = (d - (R - 3)) / 3; bowl = bowl * (1 - w) + (nat + rimH + n * 0.5) * w; }   // meet the rim
                    int target = terrace ? forgeY : (int) Math.round(Math.max(floorY, bowl));
                    for (int y = target + 1; y <= box.maxY(); y++) {                     // dig out (water too)
                        BlockState s = level.getBlockState(p.set(x, y, z));
                        if (!s.isAir() && clearable(s)) level.setBlock(p, Blocks.AIR.defaultBlockState(), 2);
                    }
                    for (int y = nat + 1; y < target - 3; y++) level.setBlock(p.set(x, y, z), steady(under), 2);   // build up where the ground was low
                    // the lining: the top two layers always, two more where there is no solid rock (holes, an aquifer)
                    for (int k = 0; k <= 3; k++) {
                        BlockState s = level.getBlockState(p.set(x, target - k, z));
                        if (k > 1 && s.isSolid() && s.getFluidState().isEmpty()) continue;
                        if (!clearable(s)) continue;
                        level.setBlock(p, terrace && k == 0 ? (rand(seed, x, target, z) < 0.25F ? Blocks.CRACKED_DEEPSLATE_TILES : Blocks.DEEPSLATE_TILES).defaultBlockState()
                                : crust(u, k, x, target - k, z, surf, under, dough), 2);
                    }
                } else {
                    double t = u * R < R + rimW ? 1 - (d - R) / rimW : 0;                 // the rim: thrown-up ground on the land
                    int target = nat + (int) Math.round(rimH * Math.pow(t, 1.5) + n * 0.5 * t);
                    float q = rand(seed ^ 0x65L, x, 0, z), fall = (float) Math.max(0, 1 - (u - 1) / 0.85);
                    boolean thrown = ray > 0.3 && q < 0.55F * fall;
                    if (target > nat) level.setBlock(p.set(x, nat, z), steady(under), 2);
                    for (int y = nat + 1; y < target; y++) {
                        float q2 = rand(seed, x, y, z);
                        level.setBlock(p.set(x, y, z), q2 < 0.2F ? Blocks.GRAVEL.defaultBlockState() : q2 < 0.3F ? Blocks.COBBLESTONE.defaultBlockState() : steady(under), 2);
                    }
                    if (thrown || target > nat) {
                        float q3 = rand(seed ^ 0x74L, x, 0, z);
                        level.setBlock(p.set(x, target, z), !thrown ? surf : q3 < 0.35F ? Blocks.GRAVEL.defaultBlockState() : q3 < 0.65F ? Blocks.COARSE_DIRT.defaultBlockState()
                                : q3 < 0.85F ? Blocks.TUFF.defaultBlockState() : Blocks.COBBLESTONE.defaultBlockState(), 2);
                    }
                    // fragments of the star thrown out, more of them along the rays
                    float f = rand(seed ^ 0x66L, x, 1, z);
                    if (f < 0.022F * fall * (ray > 0.2 ? 1.6F : 0.6F) && level.getBlockState(p.set(x, target + 1, z)).isAir()) {
                        level.setBlock(p, f < 0.003F ? dough : rock, 2);
                        if (f < 0.007F && level.getBlockState(p.set(x, target + 2, z)).isAir()) level.setBlock(p, rock, 2);
                    }
                }
            }

            // the fallen star: a meteorite mass half sunk in the floor, split open along a crack over its dough core
            double kx = Math.cos(crackA), kz = Math.sin(crackA);
            for (int dx = -6; dx <= 6; dx++) for (int dz = -6; dz <= 6; dz++) for (int dy = -4; dy <= 5; dy++) {
                p.set(cx + dx, floorY + 1 + dy, cz + dz);
                if (!box.isInside(p)) continue;
                double e = (dx / ma) * (dx / ma) + (dy / mb) * (dy / mb) + (dz / mc) * (dz / mc)
                        + 0.12 * Math.sin(dx * 1.3 + dy * 0.7 + ph1) + 0.1 * Math.cos(dz * 1.1 - dy * 0.9 + ph2);
                if (e > 1) continue;
                double split = Math.abs(dx * kz - dz * kx);
                if (dy >= 0 && split < 0.7 + dy * 0.45) { level.setBlock(p, Blocks.AIR.defaultBlockState(), 2); continue; }
                level.setBlock(p, e < 0.45 || rand(seed ^ 0x6dL, p.getX(), p.getY(), p.getZ()) < 0.06F ? dough : rock, 2);
            }
            for (int t = -2; t <= 2; t += 2) {                                             // rays of light from the crack
                p.set(cx + (int) Math.round(t * kx), floorY + 1, cz + (int) Math.round(t * kz));
                if (box.isInside(p) && level.getBlockState(p).isAir() && level.getBlockState(p.below()).isSolid())
                    level.setBlock(p, Blocks.END_ROD.defaultBlockState(), 2);
            }

            // the Regent's forge on the terrace, its front to the middle of the crater
            Direction in = Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? Direction.WEST : Direction.EAST) : (fz > 0 ? Direction.NORTH : Direction.SOUTH);
            Direction side = in.getClockWise(), out = in.getOpposite();
            BlockPos f0 = new BlockPos(cx + fx, forgeY + 1, cz + fz);
            RandomSource lootR = RandomSource.create(lootSeed);
            place(level, box, f0, Blocks.CHIPPED_ANVIL.defaultBlockState().setValue(net.minecraft.world.level.block.AnvilBlock.FACING, side));
            place(level, box, f0.relative(side), Blocks.SMITHING_TABLE.defaultBlockState());
            place(level, box, f0.relative(side.getOpposite()).relative(out), Blocks.GRINDSTONE.defaultBlockState()
                    .setValue(net.minecraft.world.level.block.GrindstoneBlock.FACE, net.minecraft.world.level.block.state.properties.AttachFace.FLOOR)
                    .setValue(net.minecraft.world.level.block.GrindstoneBlock.FACING, side));
            BlockPos chest = f0.relative(side.getOpposite());
            if (place(level, box, chest, Blocks.CHEST.defaultBlockState().setValue(ChestBlock.FACING, in)))
                RandomizableContainer.setBlockEntityLootTable(level, lootR, chest, ResourceKey.create(Registries.LOOT_TABLE, SpireCraft.id("chests/regent_crater")));
            for (BlockPos b : new BlockPos[] { f0.relative(out), f0.relative(out).relative(side) }) {
                if (place(level, box, b, Blocks.BARREL.defaultBlockState().setValue(net.minecraft.world.level.block.BarrelBlock.FACING, Direction.UP)))
                    RandomizableContainer.setBlockEntityLootTable(level, lootR, b, ResourceKey.create(Registries.LOOT_TABLE, SpireCraft.id("chests/regent_supply")));
            }
            place(level, box, f0.relative(out).relative(side).above(), Blocks.LANTERN.defaultBlockState());
            place(level, box, f0.relative(in), Blocks.BLUE_CARPET.defaultBlockState());
            place(level, box, f0.relative(in).relative(side), Blocks.BLUE_CARPET.defaultBlockState());

            // the banner pole on the far rim, its flag turned to the crater
            int px = cx - (int) Math.round(Math.cos(forgeA) * (R + 2)), pz = cz - (int) Math.round(Math.sin(forgeA) * (R + 2));
            if (box.isInside(new BlockPos(px, box.minY(), pz))) {
                int base = box.maxY() - 6;                                              // the first air over the (built-up) rim
                while (base > box.minY() && !level.getBlockState(p.set(px, base - 1, pz)).isSolid()) base--;
                for (int h = 0; h < 5; h++) place(level, box, new BlockPos(px, base + h, pz), Blocks.STRIPPED_DARK_OAK_LOG.defaultBlockState());
                int rot = Math.floorMod((int) Math.round((Math.atan2(cz - pz, cx - px) * 180 / Math.PI - 90) / 22.5), 16);   // 0 = south, clockwise
                place(level, box, new BlockPos(px, base + 5, pz), Blocks.ORANGE_BANNER.defaultBlockState().setValue(net.minecraft.world.level.block.BannerBlock.ROTATION, rot));
            }
        }

        private static boolean clearable(BlockState s) {
            return !s.is(Blocks.BEDROCK) && !s.is(Blocks.SPAWNER) && !s.is(Blocks.CHEST);
        }

        private static boolean place(WorldGenLevel level, BoundingBox box, BlockPos p, BlockState s) {
            if (!box.isInside(p)) return false;
            level.setBlock(p, s, 2);
            return true;
        }

        /** A block that will not fall: sand and gravel under the crater become sandstone / cobblestone. */
        private static BlockState steady(BlockState s) {
            if (!(s.getBlock() instanceof net.minecraft.world.level.block.FallingBlock)) return s;
            if (s.is(Blocks.SAND)) return Blocks.SANDSTONE.defaultBlockState();
            if (s.is(Blocks.RED_SAND)) return Blocks.RED_SANDSTONE.defaultBlockState();
            return Blocks.COBBLESTONE.defaultBlockState();
        }

        /** The crater's lining at relative radius u, layer k down from the surface: scorched in the middle, the land's own ground at the lip. */
        private BlockState crust(double u, int k, int x, int y, int z, BlockState surf, BlockState under, BlockState dough) {
            float q = rand(seed, x, y, z);
            if (k == 0 && (u < 0.45 ? q < 0.12F : u < 0.92 && q < 0.03F)) return dough;     // clumps lying in the pit
            if (k > 0 && u > 0.66) return steady(under);
            if (u < 0.32) return (q < 0.45F ? Blocks.BLACKSTONE : q < 0.7F ? Blocks.BASALT : q < 0.78F ? Blocks.MAGMA_BLOCK : Blocks.TUFF).defaultBlockState();
            if (u < 0.66) return k > 0 ? (q < 0.6F ? Blocks.TUFF : Blocks.BLACKSTONE).defaultBlockState()
                    : (q < 0.4F ? Blocks.TUFF : q < 0.6F ? Blocks.BLACKSTONE : q < 0.85F ? Blocks.GRAVEL : Blocks.COBBLESTONE).defaultBlockState();
            if (u > 0.85 && q < 0.4F) return surf;
            return q < 0.3F ? Blocks.GRAVEL.defaultBlockState() : q < 0.6F ? Blocks.COARSE_DIRT.defaultBlockState() : q < 0.85F ? steady(under) : Blocks.COBBLESTONE.defaultBlockState();
        }

        private static boolean geode(BlockState s) {
            return s.is(Blocks.AMETHYST_BLOCK) || s.is(Blocks.BUDDING_AMETHYST) || s.is(Blocks.CALCITE) || s.is(Blocks.SMOOTH_BASALT)
                    || s.getBlock() instanceof net.minecraft.world.level.block.AmethystClusterBlock;
        }

        /** The cavern's own surface in a column (worked out from its shape, so every chunk agrees): the highest air
         * cell under the roof (up) or the lowest over the flattened floor (down = false), or MIN_VALUE if none. */
        private int surface(int x, int z, float rx, float ry, float rz, boolean up) {
            if (up) {
                int last = Integer.MIN_VALUE;
                for (int dy = 0; dy <= 18; dy++) { if (kaiserE(x, dy, z, rx, ry, rz) <= 1) last = dy; else break; }
                return last;
            }
            int last = Integer.MIN_VALUE;
            for (int dy = 0; dy >= -16; dy--) { if (kaiserE(x, dy, z, rx, ry, rz) <= 1 && dy > -ry + 1) last = dy; else break; }
            return last;
        }

        private static double kaiserE(int dx, int dy, int dz, float rx, float ry, float rz) {
            double n = Math.sin(dx * 0.23 + dz * 0.13) * 0.05 + Math.cos(dz * 0.21 - dy * 0.3) * 0.04;
            return (dx / rx) * (dx / rx) + (dy / ry) * (dy / ry) + (dz / rz) * (dz / rz) + n;
        }

        /** Sets the fungus mat on every solid face round an air cell (multiface: one face per wall it touches). */
        private static void mat(WorldGenLevel level, BoundingBox box, BlockPos p, float chance, long seed) {
            if (!box.isInside(p) || !level.getBlockState(p).isAir() || rand(seed ^ 0x6d61L, p.getX(), p.getY(), p.getZ()) > chance) return;
            BlockState st = ModBlocks.HIVE_MYCELIUM_LAYER.get().defaultBlockState();
            boolean any = false;
            for (Direction d : Direction.values()) {
                BlockPos n = p.relative(d);
                if (box.isInside(n) && level.getBlockState(n).isFaceSturdy(level, n, d.getOpposite())) {
                    st = st.setValue(net.minecraft.world.level.block.MultifaceBlock.getFaceProperty(d), true);
                    any = true;
                }
            }
            if (any) level.setBlock(p, st, 2);
        }

        /**
         * The fungus shrine (盘根冥想室). v3.6 (user: higher and bigger - picture it as the Knowledge Demon's arena): a
         * round domed hall inside the rock, 19-23 across and about 11 high over a flat floor of hive mycelium. Fungus
         * colonies keep to the edge of the floor, the middle is clear; the white mat runs up the walls in a few faint
         * streaks; hiveshroom stems hang from the roof with a shroomlight at the foot of each (only where the roof is
         * really there); the bug's remains lie in the middle - the only bug carcass anywhere.
         */
        private void shrine(WorldGenLevel level, BoundingBox box) {
            RandomSource r = RandomSource.create(seed);
            float rad = 9.5F + r.nextFloat() * 1.5F, hgt = 10.5F + r.nextFloat();
            int fy = c.getY() - 5;                                          // the floor
            double phase = r.nextDouble() * 6;
            BlockState myc = ModBlocks.HIVE_MYCELIUM.get().defaultBlockState();
            BlockPos.MutableBlockPos p = new BlockPos.MutableBlockPos();
            for (int x = box.minX(); x <= box.maxX(); x++) for (int z = box.minZ(); z <= box.maxZ(); z++) for (int y = box.minY(); y <= box.maxY(); y++) {
                int dx = x - c.getX(), dz = z - c.getZ(), h = y - fy;
                double hr = Math.sqrt(dx * dx + dz * dz) / rad;
                double e = Math.sqrt(hr * hr + (h > 0 ? (h / hgt) * (h / hgt) : 0)) + 0.04 * Math.sin(dx * 0.7 + dz * 0.5 + h * 0.4);
                if (e > 1.15 || h < -2) continue;
                p.set(x, y, z);
                if (!carvable(level.getBlockState(p))) continue;
                if (h <= 0) { if (e < 1.05) level.setBlock(p, myc, 2); }
                else if (e < 1) level.setBlock(p, Blocks.CAVE_AIR.defaultBlockState(), 2);
            }
            // colonies round the edge of the floor, the mat in faint streaks up the walls
            for (int x = box.minX(); x <= box.maxX(); x++) for (int z = box.minZ(); z <= box.maxZ(); z++) for (int y = box.minY(); y <= box.maxY(); y++) {
                int dx = x - c.getX(), dz = z - c.getZ(), h = y - fy;
                double hr = Math.sqrt(dx * dx + dz * dz) / rad;
                if (hr > 1.1 || h < 1 || h > hgt + 1) continue;
                p.set(x, y, z);
                if (!level.getBlockState(p).isAir()) continue;
                if (h == 1 && hr > 0.6 && level.getBlockState(p.below()).is(ModBlocks.HIVE_MYCELIUM.get()) && rand(seed, x, y, z) < 0.35F)
                    level.setBlock(p, rand(seed, x, 1, z) < 0.7F ? ModBlocks.HIVE_SHROOM.get().defaultBlockState() : Blocks.BROWN_MUSHROOM.defaultBlockState(), 2);
                else if (h > 1) {
                    double a = Math.atan2(dz, dx), streak = Math.sin(a * 6 + h * 0.18 + phase) + 0.35 * Math.sin(a * 13 - h * 0.3);
                    if (streak > 0.95) mat(level, box, p.immutable(), 0.8F, seed);
                }
            }
            // shroomlights at the feet of hiveshroom stems hanging from the roof
            BlockState stem = ModBlocks.HIVESHROOM.log.get().defaultBlockState();
            for (int i = 0; i < 7; i++) {
                double a = r.nextDouble() * Math.PI * 2, d = 0.25 + r.nextDouble() * 0.45;
                int x = c.getX() + (int) Math.round(Math.cos(a) * rad * d), z = c.getZ() + (int) Math.round(Math.sin(a) * rad * d), len = 2 + r.nextInt(4);
                int dx = x - c.getX(), dz = z - c.getZ();
                int top = Integer.MIN_VALUE;                                 // the highest air cell under the roof (from the shape)
                for (int h = 1; h <= hgt + 2; h++) {
                    double hr = Math.sqrt(dx * dx + dz * dz) / rad;
                    double e = Math.sqrt(hr * hr + (h / hgt) * (h / hgt)) + 0.04 * Math.sin(dx * 0.7 + dz * 0.5 + h * 0.4);
                    if (e < 1) top = fy + h; else break;
                }
                if (top == Integer.MIN_VALUE || top - fy < len + 3) continue;
                BlockPos t = new BlockPos(x, top, z);
                if (!box.isInside(t) || !level.getBlockState(t.above()).isSolid()) continue;   // no roof there: no lamp
                for (int k = 0; k <= len; k++) {
                    BlockPos q = t.below(k);
                    if (!level.getBlockState(q).isAir() && !level.getBlockState(q).is(ModBlocks.HIVE_MYCELIUM_LAYER.get())) break;
                    level.setBlock(q, k == len ? Blocks.SHROOMLIGHT.defaultBlockState() : stem, 2);
                }
            }
            // the bug's remains in the middle, fungus round it
            BlockPos mid = new BlockPos(c.getX(), fy + 1, c.getZ());
            if (box.isInside(mid)) {
                level.setBlock(mid, ModBlocks.BUG_CARCASS.get().defaultBlockState().setValue(com.mockingjam.spirecraft.block.BugCarcassBlock.FACING, Direction.Plane.HORIZONTAL.getRandomDirection(r)), 2);
                for (Direction d : Direction.Plane.HORIZONTAL) if (r.nextBoolean() && box.isInside(mid.relative(d)) && level.getBlockState(mid.relative(d)).isAir())
                    level.setBlock(mid.relative(d), ModBlocks.HIVE_SHROOM.get().defaultBlockState(), 2);
            }
        }

        /**
         * The beekeeper's hollow (v3.5 user: the second kind, dug into the rock like the shrine): an irregular cave room
         * with a floor of packed hive soil and soil bricks, hiveshroom-wood furniture, torch posts, a lantern on a chain,
         * a comb nest bulging out of one wall and a short tunnel out of the other side.
         */
        private void beekeeper(WorldGenLevel level, BoundingBox box) {
            RandomSource r = RandomSource.create(seed);
            float rx = 5.5F + r.nextFloat(), ry = 2.8F, rz = 4.2F + r.nextFloat();
            int floorY = c.getY() - 2;
            BlockPos.MutableBlockPos p = new BlockPos.MutableBlockPos();
            for (int x = box.minX(); x <= box.maxX(); x++) for (int z = box.minZ(); z <= box.maxZ(); z++) for (int y = box.minY(); y <= box.maxY(); y++) {
                int dx = x - c.getX(), dy = y - c.getY(), dz = z - c.getZ();
                double n = 0.12 * Math.sin(dx * 0.8 + dz * 0.5) + 0.1 * Math.cos(dz * 0.9 - dx * 0.3);
                double e = (dx / rx) * (dx / rx) + (Math.max(dy, -2) / ry) * (Math.max(dy, -2) / ry) + (dz / rz) * (dz / rz) + n;
                p.set(x, y, z);
                if (!carvable(level.getBlockState(p))) continue;
                if (y == floorY - 1 && e < 1.15) level.setBlock(p, rand(seed, x, y, z) < 0.5F ? ModBlocks.PACKED_HIVE_SOIL.get().defaultBlockState() : ModBlocks.HIVE_SOIL_BRICKS.base.get().defaultBlockState(), 2);
                else if (y >= floorY && e < 1) level.setBlock(p, Blocks.CAVE_AIR.defaultBlockState(), 2);
            }
            // a tunnel out (2 high), running -x until it meets open air or 9 blocks
            for (int t = (int) rx; t < (int) rx + 9; t++) for (int h = 0; h < 2; h++) {
                BlockPos q = new BlockPos(c.getX() - t, floorY + h, c.getZ());
                if (box.isInside(q) && carvable(level.getBlockState(q))) level.setBlock(q, Blocks.CAVE_AIR.defaultBlockState(), 2);
            }
            // the comb nest bulging out of the +x wall: comb round a honey core, a cache inside
            for (int dx = -3; dx <= 3; dx++) for (int dy = -2; dy <= 2; dy++) for (int dz = -3; dz <= 3; dz++) {
                double e = Math.sqrt(dx * dx / 6.0 + dy * dy / 3.5 + dz * dz / 6.0);
                BlockPos q = new BlockPos(c.getX() + (int) rx + 1 + dx, floorY + 1 + dy, c.getZ() + dz);
                if (e > 1 || !box.isInside(q)) continue;
                level.setBlock(q, e < 0.5 ? (dy == -1 ? ModBlocks.HIVE_CACHE.get().defaultBlockState() : Blocks.HONEY_BLOCK.defaultBlockState()) : rand(seed, q.getX(), q.getY(), q.getZ()) < 0.12F ? Blocks.HONEY_BLOCK.defaultBlockState() : ModBlocks.HIVE_COMB.get().defaultBlockState(), 2);
            }
            // furniture (each only where the floor is open)
            var W = ModBlocks.HIVESHROOM;
            Object[][] items = {
                { -3, -2, Blocks.RED_BED.defaultBlockState().setValue(net.minecraft.world.level.block.BedBlock.FACING, Direction.NORTH).setValue(net.minecraft.world.level.block.BedBlock.PART, net.minecraft.world.level.block.state.properties.BedPart.HEAD) },
                { -3, -1, Blocks.RED_BED.defaultBlockState().setValue(net.minecraft.world.level.block.BedBlock.FACING, Direction.NORTH) },
                { -2, -2, Blocks.BARREL.defaultBlockState() }, { 2, -2, Blocks.CRAFTING_TABLE.defaultBlockState() },
                { 3, -2, Blocks.SMOKER.defaultBlockState() }, { 0, 1, W.fence.get().defaultBlockState() }, { 1, 1, W.fence.get().defaultBlockState() },
                { 0, 2, W.stairs.get().defaultBlockState().setValue(net.minecraft.world.level.block.StairBlock.FACING, Direction.SOUTH) },
                { 2, 3, Blocks.CAULDRON.defaultBlockState() }, { -2, 3, Blocks.BARREL.defaultBlockState() } };
            for (Object[] it : items) {
                BlockPos q = new BlockPos(c.getX() + (int) it[0], floorY, c.getZ() + (int) it[1]);
                if (box.isInside(q) && level.getBlockState(q).isAir() && !level.getBlockState(q.below()).isAir()) level.setBlock(q, (BlockState) it[2], 2);
            }
            for (int[] tp : new int[][] { { 0, 1 }, { 1, 1 } }) {   // the table top and a candle
                BlockPos q = new BlockPos(c.getX() + tp[0], floorY + 1, c.getZ() + tp[1]);
                if (box.isInside(q) && level.getBlockState(q).isAir()) level.setBlock(q, tp[0] == 0 ? W.pressurePlate.get().defaultBlockState() : Blocks.CANDLE.defaultBlockState().setValue(net.minecraft.world.level.block.CandleBlock.LIT, true), 2);
            }
            BlockPos chest = new BlockPos(c.getX() - 1, floorY, c.getZ() + 3);
            if (box.isInside(chest) && level.getBlockState(chest).isAir()) {
                level.setBlock(chest, Blocks.CHEST.defaultBlockState().setValue(ChestBlock.FACING, Direction.NORTH), 2);
                RandomizableContainer.setBlockEntityLootTable(level, r, chest, ResourceKey.create(Registries.LOOT_TABLE, SpireCraft.id("chests/beekeeper")));
            }
            // torch posts in two corners, a lantern hanging from the roof
            for (int[] tp : new int[][] { { -4, 2 }, { 3, -3 } }) for (int h = 0; h < 3; h++) {
                BlockPos q = new BlockPos(c.getX() + tp[0], floorY + h, c.getZ() + tp[1]);
                if (box.isInside(q) && level.getBlockState(q).isAir()) level.setBlock(q, h == 0 ? ModBlocks.CHISELED_HIVE_ROCK_BRICKS.get().defaultBlockState() : h == 1 ? ModBlocks.HIVE_ROCK_BRICKS.wall.get().defaultBlockState() : Blocks.TORCH.defaultBlockState(), 2);
            }
            BlockPos lamp = new BlockPos(c.getX() + 1, floorY + 3, c.getZ());
            for (int k = 0; k < 3 && box.isInside(lamp.above()) && level.getBlockState(lamp.above()).isAir(); k++) lamp = lamp.above();
            if (box.isInside(lamp) && level.getBlockState(lamp).isAir()) {
                level.setBlock(lamp, Blocks.IRON_CHAIN.defaultBlockState(), 2);
                if (box.isInside(lamp.below()) && level.getBlockState(lamp.below()).isAir()) level.setBlock(lamp.below(), Blocks.LANTERN.defaultBlockState().setValue(net.minecraft.world.level.block.LanternBlock.HANGING, true), 2);
            }
        }

        /**
         * A web nest (STS2 Zen Weaver). v3.6 (user: no silk on the outside - only hardened soil; never floating): it is
         * set into a cave wall (see findGenerationPoint). Inside the hollow a lining of silk; where the hollow reaches
         * the open cave its side is closed with webbed hive soil instead (the outside), with a gap low on that side to
         * get in; round it all a shell of webbed hive soil in the rock.
         */
        private void web(WorldGenLevel level, BoundingBox box) {
            RandomSource r = RandomSource.create(seed);
            float rad = 5 + r.nextFloat() * 2;
            BlockState silk = ModBlocks.SILK_HIVE.get().defaultBlockState(), webbed = ModBlocks.WEBBED_HIVE_SOIL.get().defaultBlockState();
            int floorDy = -(int) Math.floor(rad * 0.86 / Math.sqrt(1.6)) + 1;
            BlockPos.MutableBlockPos p = new BlockPos.MutableBlockPos();
            for (int x = box.minX(); x <= box.maxX(); x++) for (int z = box.minZ(); z <= box.maxZ(); z++) for (int y = box.minY(); y <= box.maxY(); y++) {
                int dx = x - c.getX(), dy = y - c.getY(), dz = z - c.getZ();
                double e = Math.sqrt(dx * dx + dy * dy * 1.6 + dz * dz) / rad;
                if (e > 1.45) continue;
                p.set(x, y, z);
                BlockState s = level.getBlockState(p);
                if (!carvable(s)) continue;
                if (e < 0.86) level.setBlock(p, Blocks.CAVE_AIR.defaultBlockState(), 2);
                else if (e < 1.0) {
                    if (!s.isAir()) level.setBlock(p, silk, 2);                                          // the lining, in the rock
                    else if (!(dy >= floorDy && dy <= floorDy + 1 && rand(seed ^ 3, x, 0, z) < 0.5F)) level.setBlock(p, webbed, 2);   // the open side: a soil wall, gaps low down
                }
                else if (!s.isAir()) level.setBlock(p, rand(seed, x, y, z) < 0.25F ? ModBlocks.HIVE_SOIL.get().defaultBlockState() : webbed, 2);
            }
            // cobwebs on the lining (each cell decides for itself, so the chunks agree)
            for (int x = box.minX(); x <= box.maxX(); x++) for (int z = box.minZ(); z <= box.maxZ(); z++) for (int y = box.minY(); y <= box.maxY(); y++) {
                int dx = x - c.getX(), dy = y - c.getY(), dz = z - c.getZ();
                double e = Math.sqrt(dx * dx + dy * dy * 1.6 + dz * dz) / rad;
                if (e >= 0.86 || e < 0.62) continue;
                p.set(x, y, z);
                if (level.getBlockState(p).isAir() && rand(seed ^ 7, x, y, z) < 0.35F) level.setBlock(p, Blocks.COBWEB.defaultBlockState(), 2);
            }
            // cocoons from the roof
            int roof = (int) Math.floor(rad * 0.86 / Math.sqrt(1.6)) - 1;
            for (int i = 0; i < 5; i++) {
                BlockPos q = c.offset(r.nextInt(7) - 3, roof, r.nextInt(7) - 3);
                int len = 2 + r.nextInt(2);
                for (int k = 0; k < len; k++) if (box.isInside(q.below(k)) && !level.getBlockState(q.below(k)).isSolid())
                    level.setBlock(q.below(k), k == len - 1 ? Blocks.COBWEB.defaultBlockState() : silk, 2);   // v3.5: cocoons of silk, no wool
            }
            int floor = -(int) Math.floor(rad * 0.86 / Math.sqrt(1.6)) + 1;   // (v3.5: no chest in the web nest)
            BlockPos sp = c.offset(2, floor, 1);
            if (r.nextBoolean() && box.isInside(sp)) {
                level.setBlock(sp, Blocks.SPAWNER.defaultBlockState(), 2);
                if (level.getBlockEntity(sp) instanceof net.minecraft.world.level.block.entity.SpawnerBlockEntity be)
                    be.setEntityId(net.minecraft.world.entity.EntityType.CAVE_SPIDER, r);
            }
        }
    }
}
