package com.mockingjam.spirecraft.weapon.projectile;

import com.mockingjam.spirecraft.registry.ModEntities;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.projectile.ThrowableItemProjectile;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.BlockHitResult;
import net.minecraft.world.phys.EntityHitResult;

/** One iron pellet of the Flak Cannon. Ignores hurt cooldown, so a whole volley lands. */
public class FlakPellet extends ThrowableItemProjectile {
    public static final float DAMAGE = 2.0F;
    private static final int MAX_LIFE = 40;

    public FlakPellet(EntityType<? extends FlakPellet> type, Level level) {
        super(type, level);
    }

    public FlakPellet(ServerLevel level, LivingEntity owner, ItemStack stack) {
        super(ModEntities.FLAK_PELLET.get(), owner, level, stack);
    }

    @Override
    protected Item getDefaultItem() {
        return Items.IRON_NUGGET;
    }

    @Override
    protected double getDefaultGravity() {
        return 0.01;
    }

    @Override
    public void tick() {
        super.tick();
        if (tickCount > MAX_LIFE && !level().isClientSide()) discard();
    }

    @Override
    protected void onHitEntity(EntityHitResult result) {
        if (level() instanceof ServerLevel level && result.getEntity() instanceof LivingEntity target) {
            target.invulnerableTime = 0;
            target.hurtServer(level, damageSources().thrown(this, getOwner()), DAMAGE);
        }
        discard();
    }

    @Override
    protected void onHitBlock(BlockHitResult result) {
        discard();
    }
}
