package com.mockingjam.spirecraft.weapon.projectile;

import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.registry.ModEntities;
import com.mockingjam.spirecraft.registry.ModItems;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.monster.Enemy;
import net.minecraft.world.entity.projectile.ThrowableItemProjectile;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.HitResult;

/**
 * Bouncing poison flask (Silent; Bouncing Flask "apply 3 Poison to a random enemy 3 times"). Each impact poisons every
 * hostile mob within {@link #RADIUS} blocks; it bounces {@link #BOUNCES} times, then shatters.
 */
public class PoisonFlask extends ThrowableItemProjectile {
    public static final int BOUNCES = 3;
    public static final int POISON = 3;
    public static final double RADIUS = 3.0;

    private int impacts;

    public PoisonFlask(EntityType<? extends PoisonFlask> type, Level level) {
        super(type, level);
    }

    public PoisonFlask(ServerLevel level, LivingEntity owner, ItemStack stack) {
        super(ModEntities.POISON_FLASK.get(), owner, level, stack);
    }

    @Override
    protected Item getDefaultItem() {
        return ModItems.POISON_FLASK.get();
    }

    @Override
    protected void onHit(HitResult result) {
        if (!(level() instanceof ServerLevel level)) return;
        splash(level, this, getOwner() instanceof LivingEntity owner ? owner : null);
        if (++impacts >= BOUNCES) {
            level.playSound(null, blockPosition(), SoundEvents.SPLASH_POTION_BREAK, SoundSource.NEUTRAL, 1.0F, 1.0F);
            discard();
            return;
        }
        var v = getDeltaMovement();
        setDeltaMovement(v.x * 0.6, 0.45, v.z * 0.6);
        level.playSound(null, blockPosition(), SoundEvents.GLASS_HIT, SoundSource.NEUTRAL, 0.8F, 1.4F);
    }

    /** One impact: poison every hostile mob around the flask. Returns how many were poisoned (for the self-test). */
    public static int splash(ServerLevel level, net.minecraft.world.entity.Entity at, LivingEntity owner) {
        var targets = level.getEntitiesOfClass(LivingEntity.class, at.getBoundingBox().inflate(RADIUS), e -> e instanceof Enemy && e.isAlive());
        for (LivingEntity target : targets) ModEffects.addStacks(target, ModEffects.POISON, POISON, 1200, 30);
        level.sendParticles(ParticleTypes.ITEM_SLIME, at.getX(), at.getY(), at.getZ(), 12, 0.6, 0.3, 0.6, 0.05);
        return targets.size();
    }
}
