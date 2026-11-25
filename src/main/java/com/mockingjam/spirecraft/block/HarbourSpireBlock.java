package com.mockingjam.spirecraft.block;

import com.mojang.serialization.MapCodec;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.util.RandomSource;
import net.minecraft.world.item.context.BlockPlaceContext;
import net.minecraft.world.level.BlockGetter;
import net.minecraft.world.level.LevelReader;
import net.minecraft.world.level.ScheduledTickAccess;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.SimpleWaterloggedBlock;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.StateDefinition;
import net.minecraft.world.level.block.state.properties.BlockStateProperties;
import net.minecraft.world.level.block.state.properties.BooleanProperty;
import net.minecraft.world.level.block.state.properties.DripstoneThickness;
import net.minecraft.world.level.block.state.properties.EnumProperty;
import net.minecraft.world.level.material.FluidState;
import net.minecraft.world.level.material.Fluids;
import net.minecraft.world.phys.shapes.CollisionContext;
import net.minecraft.world.phys.shapes.VoxelShape;

/**
 * Harbour rock spire (港岩石锥, 2026-11-25, user: the dark harbour's stone cones are back): a spike of harbour rock that
 * stacks like pointed dripstone - tip, tip-merge, frustum, middle, base - pointing up or down, but never drips, grows
 * or falls. Vanilla's dripstone shape logic only knows vanilla dripstone, so the thickness rules are kept here for this
 * block (same rules as {@code PointedDripstoneBlock.calculateDripstoneThickness}).
 */
public class HarbourSpireBlock extends Block implements SimpleWaterloggedBlock {
    public static final MapCodec<HarbourSpireBlock> CODEC = simpleCodec(HarbourSpireBlock::new);
    public static final EnumProperty<Direction> TIP_DIRECTION = BlockStateProperties.VERTICAL_DIRECTION;
    public static final EnumProperty<DripstoneThickness> THICKNESS = BlockStateProperties.DRIPSTONE_THICKNESS;
    public static final BooleanProperty WATERLOGGED = BlockStateProperties.WATERLOGGED;
    private static final VoxelShape TIP_MERGE = Block.box(5, 0, 5, 11, 16, 11), TIP_UP = Block.box(5, 0, 5, 11, 11, 11),
            TIP_DOWN = Block.box(5, 5, 5, 11, 16, 11), FRUSTUM = Block.box(4, 0, 4, 12, 16, 12), MIDDLE = Block.box(3, 0, 3, 13, 16, 13),
            BASE = Block.box(2, 0, 2, 14, 16, 14);

    public HarbourSpireBlock(BlockBehaviour.Properties props) {
        super(props);
        registerDefaultState(stateDefinition.any().setValue(TIP_DIRECTION, Direction.UP).setValue(THICKNESS, DripstoneThickness.TIP).setValue(WATERLOGGED, false));
    }

    @Override
    protected MapCodec<? extends Block> codec() {
        return CODEC;
    }

    @Override
    protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> b) {
        b.add(TIP_DIRECTION, THICKNESS, WATERLOGGED);
    }

    private boolean isSpire(BlockState s, Direction dir) {
        return s.is(this) && s.getValue(TIP_DIRECTION) == dir;
    }

    /** Its root: the block it grows from (below an upward spire, above a downward one) - sturdy rock or more spire. */
    @Override
    protected boolean canSurvive(BlockState state, LevelReader level, BlockPos pos) {
        Direction dir = state.getValue(TIP_DIRECTION);
        BlockPos root = pos.relative(dir.getOpposite());
        BlockState rs = level.getBlockState(root);
        return rs.isFaceSturdy(level, root, dir) || isSpire(rs, dir);
    }

    private DripstoneThickness thickness(LevelReader level, BlockPos pos, Direction dir, boolean merge) {
        Direction back = dir.getOpposite();
        BlockState ahead = level.getBlockState(pos.relative(dir));
        if (isSpire(ahead, back)) return merge || ahead.getValue(THICKNESS) == DripstoneThickness.TIP_MERGE ? DripstoneThickness.TIP_MERGE : DripstoneThickness.TIP;
        if (!isSpire(ahead, dir)) return DripstoneThickness.TIP;
        DripstoneThickness t = ahead.getValue(THICKNESS);
        if (t != DripstoneThickness.TIP && t != DripstoneThickness.TIP_MERGE) return isSpire(level.getBlockState(pos.relative(back)), dir) ? DripstoneThickness.MIDDLE : DripstoneThickness.BASE;
        return DripstoneThickness.FRUSTUM;
    }

    @Override
    public BlockState getStateForPlacement(BlockPlaceContext ctx) {
        LevelReader level = ctx.getLevel();
        BlockPos pos = ctx.getClickedPos();
        Direction dir = ctx.getNearestLookingVerticalDirection().getOpposite();
        BlockState s = defaultBlockState().setValue(TIP_DIRECTION, dir);
        if (!canSurvive(s, level, pos)) {
            dir = dir.getOpposite();
            s = s.setValue(TIP_DIRECTION, dir);
            if (!canSurvive(s, level, pos)) return null;
        }
        return s.setValue(THICKNESS, thickness(level, pos, dir, !ctx.isSecondaryUseActive()))
                .setValue(WATERLOGGED, level.getFluidState(pos).getType() == Fluids.WATER);
    }

    @Override
    protected BlockState updateShape(BlockState state, LevelReader level, ScheduledTickAccess ticks, BlockPos pos, Direction from, BlockPos fromPos, BlockState fromState, RandomSource r) {
        if (state.getValue(WATERLOGGED)) ticks.scheduleTick(pos, Fluids.WATER, Fluids.WATER.getTickDelay(level));
        if (from.getAxis() != Direction.Axis.Y) return state;
        if (!canSurvive(state, level, pos)) {
            ticks.scheduleTick(pos, this, 1);   // breaks off on the next tick
            return state;
        }
        Direction dir = state.getValue(TIP_DIRECTION);
        return state.setValue(THICKNESS, thickness(level, pos, dir, state.getValue(THICKNESS) == DripstoneThickness.TIP_MERGE));
    }

    @Override
    protected void tick(BlockState state, net.minecraft.server.level.ServerLevel level, BlockPos pos, RandomSource r) {
        if (!canSurvive(state, level, pos)) level.destroyBlock(pos, true);
    }

    @Override
    protected FluidState getFluidState(BlockState state) {
        return state.getValue(WATERLOGGED) ? Fluids.WATER.getSource(false) : super.getFluidState(state);
    }

    @Override
    protected VoxelShape getShape(BlockState state, BlockGetter level, BlockPos pos, CollisionContext ctx) {
        return switch (state.getValue(THICKNESS)) {
            case TIP_MERGE -> TIP_MERGE;
            case TIP -> state.getValue(TIP_DIRECTION) == Direction.DOWN ? TIP_DOWN : TIP_UP;
            case FRUSTUM -> FRUSTUM;
            case MIDDLE -> MIDDLE;
            case BASE -> BASE;
        };
    }
}
