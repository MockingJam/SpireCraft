package com.mockingjam.spirecraft.block;

import com.mojang.serialization.MapCodec;
import net.minecraft.core.BlockPos;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.level.BlockGetter;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.RenderShape;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.StateDefinition;
import net.minecraft.world.level.block.state.properties.BooleanProperty;
import net.minecraft.world.phys.shapes.CollisionContext;
import net.minecraft.world.phys.shapes.Shapes;
import net.minecraft.world.phys.shapes.VoxelShape;

/**
 * Glory gate (荣耀闸门, docs/design/glory.md §1): the bars that drop across a boss arena's ways in when the fight starts.
 * Open (the default, as built) it is nothing at all - invisible, walked through; closed it is a solid grille. A boss
 * waiting in its room (ScriptedDefs.Def#wakeRoom) closes every gate round it when it wakes and opens them when it dies
 * or settles down again.
 */
public class GloryGateBlock extends Block {
    public static final MapCodec<GloryGateBlock> CODEC = simpleCodec(GloryGateBlock::new);
    public static final BooleanProperty CLOSED = BooleanProperty.create("closed");

    public GloryGateBlock(BlockBehaviour.Properties props) {
        super(props);
        registerDefaultState(stateDefinition.any().setValue(CLOSED, false));
    }

    @Override
    protected MapCodec<? extends Block> codec() {
        return CODEC;
    }

    @Override
    protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> b) {
        b.add(CLOSED);
    }

    @Override
    protected RenderShape getRenderShape(BlockState state) {
        return state.getValue(CLOSED) ? RenderShape.MODEL : RenderShape.INVISIBLE;
    }

    @Override
    protected VoxelShape getShape(BlockState state, BlockGetter level, BlockPos pos, CollisionContext ctx) {
        return state.getValue(CLOSED) ? Shapes.block() : Shapes.empty();
    }

    @Override
    protected VoxelShape getCollisionShape(BlockState state, BlockGetter level, BlockPos pos, CollisionContext ctx) {
        return state.getValue(CLOSED) ? Shapes.block() : Shapes.empty();
    }

    @Override
    protected boolean propagatesSkylightDown(BlockState state) {
        return true;
    }

    /** Closes or opens every gate within {@code radius} of {@code centre}; returns how many changed. */
    public static int setAll(ServerLevel level, BlockPos centre, int radius, boolean closed) {
        int n = 0;
        for (BlockPos p : BlockPos.betweenClosed(centre.offset(-radius, -8, -radius), centre.offset(radius, 16, radius))) {
            BlockState s = level.getBlockState(p);
            if (s.getBlock() instanceof GloryGateBlock && s.getValue(CLOSED) != closed) {
                level.setBlock(p, s.setValue(CLOSED, closed), 3);
                n++;
            }
        }
        if (n > 0) level.playSound(null, centre, closed ? SoundEvents.IRON_DOOR_CLOSE : SoundEvents.IRON_DOOR_OPEN, SoundSource.BLOCKS, 2.0F, closed ? 0.6F : 0.8F);
        return n;
    }
}
