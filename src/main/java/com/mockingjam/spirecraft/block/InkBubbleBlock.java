package com.mockingjam.spirecraft.block;

import com.mojang.serialization.MapCodec;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.util.RandomSource;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.InsideBlockEffectApplier;
import net.minecraft.world.entity.projectile.Projectile;
import net.minecraft.world.level.BlockGetter;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.LevelReader;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.BlockHitResult;
import net.minecraft.world.phys.shapes.CollisionContext;
import net.minecraft.world.phys.shapes.VoxelShape;

/**
 * Ink bubble (墨泉洞穴): a glossy black-violet bubble sitting on the cave floor near the ink springs. It bursts as soon
 * as anything touches it or a projectile hits it; its loot table gives an Ink Bubble item 40 % of the time.
 * (The Inklet that may pop out comes with the Inklet mob in a later batch.)
 */
public class InkBubbleBlock extends Block {
    public static final MapCodec<InkBubbleBlock> CODEC = simpleCodec(InkBubbleBlock::new);
    private static final VoxelShape SHAPE = Block.box(3, 0, 3, 13, 10, 13);

    public InkBubbleBlock(Properties props) {
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
        // v2.4: ink bubbles only grow on the ink-burnt rock around the springs
        BlockState below = level.getBlockState(pos.below());
        return (below.is(com.mockingjam.spirecraft.registry.ModBlocks.INK_STAINED_STONE.base.get())
                || below.is(com.mockingjam.spirecraft.registry.ModBlocks.CRACKED_INK_STONE.get()))
                && below.isFaceSturdy(level, pos.below(), Direction.UP);
    }

    @Override
    protected BlockState updateShape(BlockState state, LevelReader level, net.minecraft.world.level.ScheduledTickAccess ticks, BlockPos pos,
            Direction dir, BlockPos neighbourPos, BlockState neighbour, RandomSource random) {
        return dir == Direction.DOWN && !canSurvive(state, level, pos) ? net.minecraft.world.level.block.Blocks.AIR.defaultBlockState() : state;
    }

    @Override
    protected void entityInside(BlockState state, Level level, BlockPos pos, Entity entity, InsideBlockEffectApplier effects, boolean intersects) {
        if (level instanceof ServerLevel server) burst(server, pos);
    }

    @Override
    protected void onProjectileHit(Level level, BlockState state, BlockHitResult hit, Projectile projectile) {
        if (level instanceof ServerLevel server) burst(server, hit.getBlockPos());
    }

    public static void burst(ServerLevel level, BlockPos pos) {
        level.destroyBlock(pos, true);
        level.sendParticles(ParticleTypes.SQUID_INK, pos.getX() + 0.5, pos.getY() + 0.4, pos.getZ() + 0.5, 8, 0.2, 0.2, 0.2, 0.02);
        level.playSound(null, pos, SoundEvents.BUBBLE_POP, SoundSource.BLOCKS, 1.0F, 0.7F);
    }
}
