package com.mockingjam.spirecraft.block;

import com.mockingjam.spirecraft.fluid.ModFluids;
import com.mojang.serialization.MapCodec;
import net.minecraft.core.BlockPos;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.util.RandomSource;
import net.minecraft.world.level.BlockGetter;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockState;

/**
 * Ink vent (墨泉喷口, v2.3): sits on the floor of an ink pool and keeps bubbling - bubbles burst and white smoke rises where
 * the column reaches the surface, and now and then a spurt of ink. Anything in the ink right above a vent is scalded
 * (worldgen/BiomeEffects); the rest of the pool only slows and blinds.
 */
public class InkVentBlock extends Block {
    public static final MapCodec<InkVentBlock> CODEC = simpleCodec(InkVentBlock::new);
    /** How far up a vent reaches through the ink. */
    public static final int REACH = 8;

    public InkVentBlock(Properties props) {
        super(props);
    }

    @Override
    protected MapCodec<? extends Block> codec() {
        return CODEC;
    }

    /** Whether a vent sits below {@code pos} in the same column within {@link #REACH} blocks, under ink all the way. */
    public static boolean ventBelow(BlockGetter level, BlockPos pos, Block vent) {
        BlockPos.MutableBlockPos p = pos.mutable();
        for (int i = 0; i <= REACH; i++) {
            BlockState s = level.getBlockState(p);
            if (s.is(vent)) return true;
            if (i > 0 && !s.getFluidState().getType().isSame(ModFluids.INK.get())) return false;
            p.move(0, -1, 0);
        }
        return false;
    }

    @Override
    public void animateTick(BlockState state, Level level, BlockPos pos, RandomSource random) {
        // find the top of the ink column above the vent
        BlockPos.MutableBlockPos p = pos.above().mutable();
        int depth = 0;
        while (depth < REACH && level.getFluidState(p).getType().isSame(ModFluids.INK.get())) {
            p.move(0, 1, 0);
            depth++;
        }
        if (depth == 0) return;
        double x = pos.getX() + 0.5, z = pos.getZ() + 0.5, top = p.getY() + 0.05;
        for (int i = 0; i < 3; i++) {
            level.addParticle(ParticleTypes.BUBBLE_POP, x + random.nextGaussian() * 0.3, top, z + random.nextGaussian() * 0.3, 0, 0.04, 0);
        }
        // a faint white smoke drifting up from the pool (v2.4, user)
        if (random.nextInt(3) == 0) {
            level.addParticle(ParticleTypes.WHITE_SMOKE, x + random.nextGaussian() * 0.6, top + 0.1, z + random.nextGaussian() * 0.6, 0, 0.03, 0);
        }
        if (random.nextInt(6) == 0) {
            // a spurt of ink
            for (int i = 0; i < 6; i++) {
                level.addParticle(ParticleTypes.SQUID_INK, x, top + 0.1, z, random.nextGaussian() * 0.05, 0.25 + random.nextFloat() * 0.2, random.nextGaussian() * 0.05);
            }
        }
        if (random.nextInt(10) == 0) {
            level.playLocalSound(x, top, z, SoundEvents.BUBBLE_COLUMN_UPWARDS_AMBIENT, SoundSource.BLOCKS, 0.6F, 0.6F + random.nextFloat() * 0.2F, false);
        }
    }
}
