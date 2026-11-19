package com.mockingjam.spirecraft.block;

import com.mojang.serialization.MapCodec;
import net.minecraft.core.BlockPos;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.util.RandomSource;
import net.minecraft.world.level.block.TurtleEggBlock;
import net.minecraft.world.level.block.state.BlockState;

/**
 * Tough Egg (STS2 Hive: laid by the Ovicopter): a glossy, translucent pale-teal egg. Stacks 1–4 per block exactly like
 * turtle eggs (same models and placing), but never hatches turtles — it will hatch Ovicopter brood once that mob exists.
 */
public class ToughEggBlock extends TurtleEggBlock {
    public static final MapCodec<TurtleEggBlock> CODEC = simpleCodec(ToughEggBlock::new);

    public ToughEggBlock(Properties props) {
        super(props);
    }

    @Override
    public MapCodec<TurtleEggBlock> codec() {
        return CODEC;
    }

    /** No hatching (and no turtles). */
    @Override
    protected void randomTick(BlockState state, ServerLevel level, BlockPos pos, RandomSource random) {
    }

    /** v2.4: eggs need ground under them (turtle eggs can float - and the egg patches placed some in mid-air). */
    @Override
    protected boolean canSurvive(BlockState state, net.minecraft.world.level.LevelReader level, BlockPos pos) {
        BlockPos below = pos.below();
        return level.getBlockState(below).isFaceSturdy(level, below, net.minecraft.core.Direction.UP);
    }

    @Override
    protected BlockState updateShape(BlockState state, net.minecraft.world.level.LevelReader level, net.minecraft.world.level.ScheduledTickAccess ticks,
            BlockPos pos, net.minecraft.core.Direction dir, BlockPos neighbourPos, BlockState neighbour, RandomSource random) {
        return dir == net.minecraft.core.Direction.DOWN && !canSurvive(state, level, pos) ? net.minecraft.world.level.block.Blocks.AIR.defaultBlockState()
                : super.updateShape(state, level, ticks, pos, dir, neighbourPos, neighbour, random);
    }

    @Override
    public void onPlace(BlockState state, net.minecraft.world.level.Level level, BlockPos pos, BlockState old, boolean moved) {
        // turtle eggs remember being placed on sand to speed up hatching; ours never hatch
    }
}
