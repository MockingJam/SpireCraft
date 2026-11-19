package com.mockingjam.spirecraft.block;

import com.mojang.serialization.MapCodec;
import net.minecraft.core.BlockPos;
import net.minecraft.core.particles.BlockParticleOption;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.InsideBlockEffectApplier;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.item.FallingBlockEntity;
import net.minecraft.world.level.BlockGetter;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.pathfinder.PathComputationType;
import net.minecraft.world.phys.Vec3;
import net.minecraft.world.phys.shapes.CollisionContext;
import net.minecraft.world.phys.shapes.EntityCollisionContext;
import net.minecraft.world.phys.shapes.Shapes;
import net.minecraft.world.phys.shapes.VoxelShape;

/**
 * Quicksand (流沙洞): like powder snow without the cold — anything that steps in sinks slowly and can barely move;
 * once its head goes under it starts to suffocate. Falling blocks rest on it; sneaking does not help.
 * v3.3 (user): it falls like sand.
 */
public class QuicksandBlock extends net.minecraft.world.level.block.FallingBlock {
    public static final MapCodec<QuicksandBlock> CODEC = simpleCodec(QuicksandBlock::new);
    public static final float DROWN_DAMAGE = 1.0F;

    public QuicksandBlock(Properties props) {
        super(props);
    }

    @Override
    protected MapCodec<? extends net.minecraft.world.level.block.FallingBlock> codec() {
        return CODEC;
    }

    @Override
    public int getDustColor(BlockState state, BlockGetter level, BlockPos pos) {
        return 0xD8A85C;
    }

    @Override
    protected void entityInside(BlockState state, Level level, BlockPos pos, Entity entity, InsideBlockEffectApplier effects, boolean intersects) {
        // heavy sand: very slow sideways, slow sinking
        entity.makeStuckInBlock(state, new Vec3(0.25, 0.3, 0.25));
        if (level instanceof ServerLevel server && entity instanceof LivingEntity living) {
            BlockPos eye = BlockPos.containing(entity.getX(), entity.getEyeY(), entity.getZ());
            if (level.getBlockState(eye).is(this) && entity.tickCount % 20 == 0) {
                living.hurtServer(server, level.damageSources().inWall(), DROWN_DAMAGE);
            }
        }
        if (level.isClientSide() && level.random.nextInt(4) == 0 && (entity.xOld != entity.getX() || entity.zOld != entity.getZ())) {
            level.addParticle(new BlockParticleOption(ParticleTypes.BLOCK, state), entity.getX(), pos.getY() + 1, entity.getZ(), 0, 0.05, 0);
        }
    }

    @Override
    protected VoxelShape getCollisionShape(BlockState state, BlockGetter level, BlockPos pos, CollisionContext ctx) {
        if (ctx instanceof EntityCollisionContext ec && ec.getEntity() instanceof FallingBlockEntity) return Shapes.block();
        return Shapes.empty();
    }

    @Override
    protected VoxelShape getEntityInsideCollisionShape(BlockState state, BlockGetter level, BlockPos pos, Entity entity) {
        return Shapes.block();
    }

    @Override
    protected boolean isPathfindable(BlockState state, PathComputationType type) {
        return false;
    }
}
