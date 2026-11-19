package com.mockingjam.spirecraft.block;

import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mojang.serialization.MapCodec;
import net.minecraft.core.Direction;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.GrowingPlantBodyBlock;
import net.minecraft.world.level.block.GrowingPlantHeadBlock;
import net.minecraft.world.phys.shapes.VoxelShape;

/** Body segment of a glowvine. */
public class GlowvinePlantBlock extends GrowingPlantBodyBlock {
    public static final MapCodec<GlowvinePlantBlock> CODEC = simpleCodec(GlowvinePlantBlock::new);
    private static final VoxelShape SHAPE = Block.column(14.0, 0.0, 16.0);

    public GlowvinePlantBlock(Properties properties) {
        super(properties, Direction.DOWN, SHAPE, false);
    }

    @Override
    public MapCodec<GlowvinePlantBlock> codec() {
        return CODEC;
    }

    @Override
    protected GrowingPlantHeadBlock getHeadBlock() {
        return (GrowingPlantHeadBlock) ModBlocks.GLOWVINE.get();
    }
}
