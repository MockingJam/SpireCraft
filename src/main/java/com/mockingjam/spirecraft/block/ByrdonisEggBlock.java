package com.mockingjam.spirecraft.block;

import com.mojang.serialization.MapCodec;
import net.minecraft.core.BlockPos;
import net.minecraft.world.level.BlockGetter;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.shapes.CollisionContext;
import net.minecraft.world.phys.shapes.VoxelShape;

/** A Byrdonis egg (v3.5, STS2 Byrdonis Nest): v3.6: smaller than a sniffer egg, square in section; it does not hatch. */
public class ByrdonisEggBlock extends Block {
    public static final MapCodec<ByrdonisEggBlock> CODEC = simpleCodec(ByrdonisEggBlock::new);
    private static final VoxelShape SHAPE = Block.box(3, 0, 3, 13, 13, 13);

    public ByrdonisEggBlock(Properties props) {
        super(props);
    }

    @Override
    protected MapCodec<? extends Block> codec() {
        return CODEC;
    }

    @Override
    protected VoxelShape getShape(BlockState state, BlockGetter level, BlockPos pos, CollisionContext ctx) {
        return SHAPE;
    }
}
