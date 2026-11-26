package com.mockingjam.spirecraft.block;

import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mojang.serialization.MapCodec;
import net.minecraft.core.BlockPos;
import net.minecraft.tags.BlockTags;
import net.minecraft.world.level.BlockGetter;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.DoublePlantBlock;
import net.minecraft.world.level.block.GrowingPlantHeadBlock;
import net.minecraft.world.level.block.KelpBlock;
import net.minecraft.world.level.block.KelpPlantBlock;
import net.minecraft.world.level.block.state.BlockState;

/** Dark harbour / polluted sea plants that only need small changes to vanilla blocks. */
public final class HarbourPlants {
    private HarbourPlants() {}

    /** Reeds: a two-block-tall plant on the muddy shore. */
    public static class Reed extends DoublePlantBlock {
        public static final MapCodec<Reed> CODEC = simpleCodec(Reed::new);

        public Reed(Properties props) {
            super(props);
        }

        @Override
        public MapCodec<? extends DoublePlantBlock> codec() {
            return CODEC;
        }

        /**
         * 2026-11-26 (user: "breaking the top of a reed leaves the bottom standing"): breaking the top half takes the
         * bottom half with it explicitly (and drops the reed once), not only through the neighbour shape update.
         */
        @Override
        public BlockState playerWillDestroy(net.minecraft.world.level.Level level, BlockPos pos, BlockState state, net.minecraft.world.entity.player.Player player) {
            if (!level.isClientSide() && state.getValue(HALF) == net.minecraft.world.level.block.state.properties.DoubleBlockHalf.UPPER) {
                BlockPos below = pos.below();
                BlockState low = level.getBlockState(below);
                if (low.is(this) && low.getValue(HALF) == net.minecraft.world.level.block.state.properties.DoubleBlockHalf.LOWER) {
                    if (!player.preventsBlockDrops()) dropResources(low, level, below, null, player, player.getMainHandItem());
                    level.setBlock(below, Blocks.AIR.defaultBlockState(), 35);
                    level.levelEvent(player, 2001, below, net.minecraft.world.level.block.Block.getId(low));
                }
            }
            return super.playerWillDestroy(level, pos, state, player);
        }

        @Override
        protected boolean mayPlaceOn(BlockState s, BlockGetter level, BlockPos pos) {
            return s.is(Blocks.MUD) || s.is(ModBlocks.SLUDGE.get()) || s.is(Blocks.CLAY) || s.is(Blocks.GRAVEL) || s.is(BlockTags.DIRT) || s.is(BlockTags.SAND);
        }
    }

    /** Polluted kelp (top): grows into polluted kelp plant. */
    public static class Kelp extends KelpBlock {
        public Kelp(Properties props) {
            super(props);
        }

        @Override
        protected Block getBodyBlock() {
            return ModBlocks.POLLUTED_KELP_PLANT.get();
        }
    }

    /** Polluted kelp (stem). */
    public static class KelpPlant extends KelpPlantBlock {
        public KelpPlant(Properties props) {
            super(props);
        }

        @Override
        protected GrowingPlantHeadBlock getHeadBlock() {
            return (GrowingPlantHeadBlock) ModBlocks.POLLUTED_KELP.get();
        }
    }
}
