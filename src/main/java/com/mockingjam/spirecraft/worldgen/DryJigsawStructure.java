package com.mockingjam.spirecraft.worldgen;

import com.mockingjam.spirecraft.SpireCraft;
import com.mojang.serialization.MapCodec;
import java.util.Optional;
import net.minecraft.core.registries.Registries;
import net.minecraft.world.level.levelgen.Heightmap;
import net.minecraft.world.level.levelgen.structure.Structure;
import net.minecraft.world.level.levelgen.structure.StructureType;
import net.minecraft.world.level.levelgen.structure.structures.JigsawStructure;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.RegistryObject;

/**
 * A jigsaw structure that never starts on water (v3.3 user: camps and the Kin village not in the water): the same JSON
 * as minecraft:jigsaw, but the start is refused when there is water at the middle of the start chunk or at any of the
 * four points 6 blocks around it.
 */
public final class DryJigsawStructure extends Structure {
    public static final DeferredRegister<StructureType<?>> TYPES = DeferredRegister.create(Registries.STRUCTURE_TYPE, SpireCraft.MODID);
    public static final MapCodec<DryJigsawStructure> CODEC = JigsawStructure.CODEC.xmap(DryJigsawStructure::new, d -> d.inner);
    public static final RegistryObject<StructureType<DryJigsawStructure>> TYPE = TYPES.register("dry_jigsaw", () -> () -> CODEC);

    private final JigsawStructure inner;

    private DryJigsawStructure(JigsawStructure inner) {
        super(inner.modifiableStructureInfo().getOriginalStructureInfo().structureSettings());
        this.inner = inner;
    }

    /** v3.6 (user: the Byrdonis nest still stood in water): a grid over the whole footprint - templates run +x / +z from the chunk middle */
    private static final int[][] AROUND;
    static {
        java.util.List<int[]> l = new java.util.ArrayList<>();
        for (int dx = -8; dx <= 20; dx += 4) for (int dz = -8; dz <= 20; dz += 4) l.add(new int[] { dx, dz });
        AROUND = l.toArray(new int[0][]);
    }

    @Override
    protected Optional<GenerationStub> findGenerationPoint(GenerationContext ctx) {
        int cx = ctx.chunkPos().getMiddleBlockX(), cz = ctx.chunkPos().getMiddleBlockZ();
        for (int[] o : AROUND) {
            int surface = ctx.chunkGenerator().getBaseHeight(cx + o[0], cz + o[1], Heightmap.Types.WORLD_SURFACE_WG, ctx.heightAccessor(), ctx.randomState());
            int floor = ctx.chunkGenerator().getBaseHeight(cx + o[0], cz + o[1], Heightmap.Types.OCEAN_FLOOR_WG, ctx.heightAccessor(), ctx.randomState());
            if (surface != floor) return Optional.empty();   // water above the ground here
        }
        return inner.findValidGenerationPoint(ctx);
    }

    @Override
    public StructureType<?> type() {
        return TYPE.get();
    }
}
