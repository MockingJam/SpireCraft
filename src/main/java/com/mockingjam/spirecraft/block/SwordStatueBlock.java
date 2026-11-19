package com.mockingjam.spirecraft.block;

import com.mockingjam.spirecraft.registry.ModItems;
import com.mojang.serialization.MapCodec;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.BlockGetter;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.HorizontalDirectionalBlock;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.StateDefinition;
import net.minecraft.world.level.block.state.properties.BooleanProperty;
import net.minecraft.world.phys.BlockHitResult;
import net.minecraft.world.phys.shapes.CollisionContext;
import net.minecraft.world.phys.shapes.VoxelShape;

/**
 * The sword held by the statue in the stone (石中剑, docs/design/structures.md): a sword standing point-down under the
 * statue's hands. Right-click takes it (the Sovereign Blade) once; after that the block is empty (invisible, no
 * collision) and the hands hold nothing.
 */
public class SwordStatueBlock extends HorizontalDirectionalBlock {
    public static final MapCodec<SwordStatueBlock> CODEC = simpleCodec(SwordStatueBlock::new);
    public static final BooleanProperty HAS_SWORD = BooleanProperty.create("has_sword");
    private static final VoxelShape SWORD = Block.box(6, 0, 6, 10, 16, 10);

    public SwordStatueBlock(Properties props) {
        super(props);
        registerDefaultState(stateDefinition.any().setValue(FACING, Direction.NORTH).setValue(HAS_SWORD, true));
    }

    @Override
    protected MapCodec<? extends HorizontalDirectionalBlock> codec() {
        return CODEC;
    }

    @Override
    protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> builder) {
        builder.add(FACING, HAS_SWORD);
    }

    @Override
    protected VoxelShape getShape(BlockState state, BlockGetter level, BlockPos pos, CollisionContext ctx) {
        return state.getValue(HAS_SWORD) ? SWORD : net.minecraft.world.phys.shapes.Shapes.empty();
    }

    @Override
    protected VoxelShape getCollisionShape(BlockState state, BlockGetter level, BlockPos pos, CollisionContext ctx) {
        return net.minecraft.world.phys.shapes.Shapes.empty();
    }

    @Override
    protected InteractionResult useWithoutItem(BlockState state, Level level, BlockPos pos, Player player, BlockHitResult hit) {
        if (!state.getValue(HAS_SWORD)) return InteractionResult.PASS;
        if (!level.isClientSide()) {
            level.setBlock(pos, state.setValue(HAS_SWORD, false), 3);
            ItemStack sword = new ItemStack(ModItems.SOVEREIGN_BLADE.get());
            if (!player.getInventory().add(sword)) player.drop(sword, false);
            level.playSound(null, pos, SoundEvents.ARMOR_EQUIP_IRON.value(), SoundSource.BLOCKS, 1.0F, 0.8F);
            level.playSound(null, pos, SoundEvents.GRINDSTONE_USE, SoundSource.BLOCKS, 0.6F, 1.2F);
        }
        return InteractionResult.SUCCESS;
    }

}
