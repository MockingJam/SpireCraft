package com.mockingjam.spirecraft.block;

import com.mojang.serialization.MapCodec;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.util.RandomSource;
import net.minecraft.world.level.BlockGetter;
import net.minecraft.world.level.LevelReader;
import net.minecraft.world.level.ScheduledTickAccess;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.shapes.CollisionContext;
import net.minecraft.world.phys.shapes.VoxelShape;

/** A strand of fungal thread (v3.5): hangs from a sturdy ceiling or from another strand; breaks when that goes. */
public class MyceliumThreadBlock extends Block {
    public static final MapCodec<MyceliumThreadBlock> CODEC = simpleCodec(MyceliumThreadBlock::new);
    private static final VoxelShape SHAPE = Block.box(6, 0, 6, 10, 16, 10);

    public MyceliumThreadBlock(Properties props) {
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

    @Override
    protected boolean canSurvive(BlockState state, LevelReader level, BlockPos pos) {
        BlockState above = level.getBlockState(pos.above());
        return above.is(this) || above.isFaceSturdy(level, pos.above(), Direction.DOWN);
    }

    @Override
    protected BlockState updateShape(BlockState state, LevelReader level, ScheduledTickAccess ticks, BlockPos pos, Direction dir, BlockPos nPos, BlockState nState, RandomSource r) {
        return dir == Direction.UP && !canSurvive(state, level, pos) ? Blocks.AIR.defaultBlockState() : state;
    }
}
