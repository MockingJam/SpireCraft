package com.mockingjam.spirecraft.block;

import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mojang.serialization.MapCodec;
import net.minecraft.core.Direction;
import net.minecraft.util.RandomSource;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.GrowingPlantHeadBlock;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.shapes.VoxelShape;

/** Tip of a hanging glowvine (Overgrowth). Grows downwards like weeping vines; the body block is {@link GlowvinePlantBlock}. */
public class GlowvineBlock extends GrowingPlantHeadBlock {
    public static final MapCodec<GlowvineBlock> CODEC = simpleCodec(GlowvineBlock::new);
    private static final VoxelShape SHAPE = Block.column(8.0, 9.0, 16.0);

    public GlowvineBlock(Properties properties) {
        super(properties, Direction.DOWN, SHAPE, false, 0.1);
    }

    @Override
    public MapCodec<GlowvineBlock> codec() {
        return CODEC;
    }

    @Override
    protected int getBlocksToGrowWhenBonemealed(RandomSource random) {
        return 1 + random.nextInt(2);
    }

    @Override
    protected Block getBodyBlock() {
        return ModBlocks.GLOWVINE_PLANT.get();
    }

    @Override
    protected boolean canGrowInto(BlockState state) {
        return state.isAir();
    }
}
