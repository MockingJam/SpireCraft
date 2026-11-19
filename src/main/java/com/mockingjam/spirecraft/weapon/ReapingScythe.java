package com.mockingjam.spirecraft.weapon;

import com.mockingjam.spirecraft.effect.ModEffects;
import java.util.List;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.monster.Enemy;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.ItemUseAnimation;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.Vec3;

/**
 * Scythe (Necrobinder; The Scythe + Reap "Retain. Deal 27 damage"). Doom and a sweep on hit (see {@link WeaponEvents});
 * it can also be charged: hold right-click for {@link #CHARGE_TICKS}, release to reap everything hostile in a 90° cone
 * in front ({@link #RANGE} blocks) for {@link #DAMAGE} damage plus Doom.
 */
public class ReapingScythe extends SpireWeapon {
    public static final int CHARGE_TICKS = 20;
    public static final double RANGE = 4.0;
    public static final float DAMAGE = 12.0F;
    public static final int COOLDOWN = 100;

    public ReapingScythe(Properties props) {
        super(props, Character.NECROBINDER);
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        player.startUsingItem(hand);
        return InteractionResult.CONSUME;
    }

    @Override
    public ItemUseAnimation getUseAnimation(ItemStack stack) {
        return ItemUseAnimation.SPEAR;
    }

    @Override
    public int getUseDuration(ItemStack stack, LivingEntity user) {
        return 72000;
    }

    @Override
    public boolean releaseUsing(ItemStack stack, Level level, LivingEntity user, int timeLeft) {
        if (getUseDuration(stack, user) - timeLeft < CHARGE_TICKS || !(level instanceof ServerLevel server) || !(user instanceof Player player)) return false;
        reap(server, player);
        player.getCooldowns().addCooldown(stack, COOLDOWN);
        return true;
    }

    /** Hits every hostile mob in the cone; returns how many were hit (used by the self-test). */
    public static int reap(ServerLevel level, Player player) {
        Vec3 look = player.getLookAngle().multiply(1, 0, 1).normalize();
        List<LivingEntity> targets = level.getEntitiesOfClass(LivingEntity.class, player.getBoundingBox().inflate(RANGE, 1.5, RANGE), e -> {
            if (!(e instanceof Enemy) || !e.isAlive()) return false;
            Vec3 to = e.position().subtract(player.position()).multiply(1, 0, 1);
            return to.length() <= RANGE && (to.lengthSqr() < 0.01 || to.normalize().dot(look) >= Math.cos(Math.toRadians(45)));
        });
        for (LivingEntity target : targets) {
            target.invulnerableTime = 0;
            target.hurtServer(level, player.damageSources().playerAttack(player), DAMAGE);
            ModEffects.addStacks(target, ModEffects.DOOM, WeaponEvents.SCYTHE_DOOM, WeaponEvents.DOOM_DURATION, 999);
        }
        level.sendParticles(ParticleTypes.SWEEP_ATTACK, player.getX() + look.x * 2, player.getY() + 1.0, player.getZ() + look.z * 2, 3, 0.8, 0.2, 0.8, 0);
        level.sendParticles(ParticleTypes.SOUL, player.getX() + look.x * 2, player.getY() + 1.0, player.getZ() + look.z * 2, 12, 1.0, 0.4, 1.0, 0.02);
        level.playSound(null, player.blockPosition(), SoundEvents.PLAYER_ATTACK_SWEEP, SoundSource.PLAYERS, 1.0F, 0.6F);
        return targets.size();
    }
}
