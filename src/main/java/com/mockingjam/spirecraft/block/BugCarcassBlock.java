package com.mockingjam.spirecraft.block;

import com.mojang.serialization.MapCodec;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.item.context.BlockPlaceContext;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.BlockHitResult;
import net.minecraft.world.level.BlockGetter;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.HorizontalDirectionalBlock;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.StateDefinition;
import net.minecraft.world.phys.shapes.CollisionContext;
import net.minecraft.world.phys.shapes.VoxelShape;

/**
 * The remains of a big bug (v3.5): a low model about one block across, facing where it was placed. Batch 3: offering
 * a book at it summons the Knowledge Demon (the carcass lies in the middle of the fungus shrine).
 */
public class BugCarcassBlock extends HorizontalDirectionalBlock {
    public static final MapCodec<BugCarcassBlock> CODEC = simpleCodec(BugCarcassBlock::new);
    private static final VoxelShape SHAPE = Block.box(1, 0, 1, 15, 7, 15);

    public BugCarcassBlock(Properties props) {
        super(props);
        registerDefaultState(stateDefinition.any().setValue(FACING, Direction.NORTH));
    }

    @Override
    protected MapCodec<? extends HorizontalDirectionalBlock> codec() {
        return CODEC;
    }

    @Override
    protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> builder) {
        builder.add(FACING);
    }

    @Override
    protected VoxelShape getShape(BlockState state, BlockGetter level, BlockPos pos, CollisionContext ctx) {
        return SHAPE;
    }

    @Override
    public BlockState getStateForPlacement(BlockPlaceContext ctx) {
        return defaultBlockState().setValue(FACING, ctx.getHorizontalDirection().getOpposite());
    }

    @Override
    protected InteractionResult useItemOn(ItemStack stack, BlockState state, Level level, BlockPos pos, Player player, InteractionHand hand, BlockHitResult hit) {
        if (!stack.is(Items.BOOK)) return super.useItemOn(stack, state, level, pos, player, hand, hit);
        if (!(level instanceof ServerLevel server)) return InteractionResult.SUCCESS;
        if (com.mockingjam.spirecraft.mob.KnowledgeDemon.summon(server, pos) == null) {
            player.displayClientMessage(Component.translatable("block.spirecraft.bug_carcass.no_demon"), true);
            return InteractionResult.FAIL;
        }
        stack.consume(1, player);
        return InteractionResult.SUCCESS;
    }
}
