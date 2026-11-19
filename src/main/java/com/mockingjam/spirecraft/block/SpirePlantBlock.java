package com.mockingjam.spirecraft.block;

import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mojang.serialization.MapCodec;
import net.minecraft.core.BlockPos;
import net.minecraft.tags.BlockTags;
import net.minecraft.world.level.BlockGetter;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.VegetationBlock;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.shapes.CollisionContext;
import net.minecraft.world.phys.shapes.VoxelShape;

/**
 * Small plants of the v2 biomes (docs/design/biomes_v2.md): the new mushrooms, the glow shrub, the dark-harbour dry
 * shrub and the hive shroom. A plain vegetation block (no growth) that survives on the ground of its biome.
 */
public class SpirePlantBlock extends VegetationBlock {
    /** What a plant can stand on. */
    public enum Ground {
        /** Forest floor: grass, dirt family, moss, mycelium, podzol, mud. */
        FOREST,
        /** Dark harbour shore: mud, sludge, gravel, clay, dirt. */
        SHORE,
        /** Hive caves: hive rock, comb, stone, deepslate, dirt. */
        HIVE
    }

    private final Ground ground;
    private final VoxelShape shape;
    private final MapCodec<SpirePlantBlock> codec;

    public SpirePlantBlock(Ground ground, int width, int height, Properties props) {
        super(props);
        this.ground = ground;
        double m = (16 - width) / 2.0;
        this.shape = Block.box(m, 0, m, 16 - m, height, 16 - m);
        this.codec = simpleCodec(p -> new SpirePlantBlock(ground, width, height, p));
    }

    @Override
    protected MapCodec<? extends VegetationBlock> codec() {
        return codec;
    }

    @Override
    protected VoxelShape getShape(BlockState state, BlockGetter level, BlockPos pos, CollisionContext context) {
        return shape;
    }

    @Override
    protected boolean mayPlaceOn(BlockState s, BlockGetter level, BlockPos pos) {
        return switch (ground) {
            case FOREST -> s.is(BlockTags.DIRT) || s.is(Blocks.MOSS_BLOCK) || s.is(Blocks.MYCELIUM) || s.is(Blocks.MUD);
            case SHORE -> s.is(Blocks.MUD) || s.is(ModBlocks.SLUDGE.get()) || s.is(Blocks.GRAVEL) || s.is(Blocks.CLAY) || s.is(BlockTags.DIRT) || s.is(BlockTags.SAND);
            case HIVE -> s.is(ModBlocks.HIVE_SOIL.get()) || s.is(ModBlocks.HIVE_MYCELIUM.get()) || s.is(ModBlocks.HIVE_ROCK.base.get()) || s.is(ModBlocks.HIVE_COMB.get()) || s.is(BlockTags.BASE_STONE_OVERWORLD) || s.is(BlockTags.DIRT);
        };
    }
}
