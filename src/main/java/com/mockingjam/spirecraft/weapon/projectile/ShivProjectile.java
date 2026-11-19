package com.mockingjam.spirecraft.weapon.projectile;

import com.mockingjam.spirecraft.registry.ModEntities;
import com.mockingjam.spirecraft.registry.ModItems;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.projectile.ThrowableItemProjectile;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.BlockHitResult;
import net.minecraft.world.phys.EntityHitResult;

/** A thrown knife (Silent; Dagger Throw): used up when it hits a creature, dropped when it hits a block. */
public class ShivProjectile extends ThrowableItemProjectile {
    public static final float DAMAGE = 4.0F;

    public ShivProjectile(EntityType<? extends ShivProjectile> type, Level level) {
        super(type, level);
    }

    public ShivProjectile(ServerLevel level, LivingEntity owner, ItemStack stack) {
        super(ModEntities.SHIV.get(), owner, level, stack);
    }

    @Override
    protected Item getDefaultItem() {
        return ModItems.THROWING_KNIFE.get();
    }

    @Override
    protected double getDefaultGravity() {
        return 0.02;
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
        if (level() instanceof ServerLevel level) spawnAtLocation(level, new ItemStack(ModItems.THROWING_KNIFE.get()));
        discard();
    }
}
