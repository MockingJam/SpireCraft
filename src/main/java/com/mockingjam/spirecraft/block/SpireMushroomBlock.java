package com.mockingjam.spirecraft.block;

import com.mockingjam.spirecraft.SpireCraft;
import com.mojang.serialization.MapCodec;
import net.minecraft.core.BlockPos;
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.ResourceKey;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.util.RandomSource;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.LevelReader;
import net.minecraft.world.level.block.BonemealableBlock;
import net.minecraft.world.level.block.VegetationBlock;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.levelgen.feature.ConfiguredFeature;

/**
 * The v2 mushrooms with bone meal (v2.3, user): like vanilla mushrooms, bone meal has a 40% chance to grow the giant
 * version (lantern cap, coral cap, bluebell cap, and since v2.4 the hive shroom -> their giant mushrooms). With no
 * giant feature given, bone meal spreads 1-3 more around it instead.
 */
public class SpireMushroomBlock extends SpirePlantBlock implements BonemealableBlock {
    private final String giant;
    private final MapCodec<SpireMushroomBlock> codec;

    /** @param giant the configured feature (spirecraft:<giant>) bone meal grows, or null to spread instead */
    public SpireMushroomBlock(Ground ground, int width, int height, String giant, Properties props) {
        super(ground, width, height, props);
        this.giant = giant;
        this.codec = simpleCodec(p -> new SpireMushroomBlock(ground, width, height, giant, p));
    }

    @Override
    protected MapCodec<? extends VegetationBlock> codec() {
        return codec;
    }

    @Override
    public boolean isValidBonemealTarget(LevelReader level, BlockPos pos, BlockState state) {
        return true;
    }

    @Override
    public boolean isBonemealSuccess(Level level, RandomSource random, BlockPos pos, BlockState state) {
        return random.nextFloat() < 0.4F;
    }

    @Override
    public void performBonemeal(ServerLevel level, RandomSource random, BlockPos pos, BlockState state) {
        if (giant == null) {
            for (int i = 0, placed = 0; i < 12 && placed < 1 + random.nextInt(3); i++) {
                BlockPos p = pos.offset(random.nextInt(5) - 2, random.nextInt(3) - 1, random.nextInt(5) - 2);
                if (level.isEmptyBlock(p) && state.canSurvive(level, p)) {
                    level.setBlock(p, state, 3);
                    placed++;
                }
            }
            return;
        }
        var feature = level.registryAccess().lookupOrThrow(Registries.CONFIGURED_FEATURE)
                .get(ResourceKey.create(Registries.CONFIGURED_FEATURE, SpireCraft.id(giant)));
        if (feature.isEmpty()) return;
        level.removeBlock(pos, false);
        if (!feature.get().value().place(level, level.getChunkSource().getGenerator(), random, pos)) level.setBlock(pos, state, 3);
    }
}
