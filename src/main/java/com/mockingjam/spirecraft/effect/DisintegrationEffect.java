package com.mockingjam.spirecraft.effect;

import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.effect.MobEffectCategory;
import net.minecraft.world.entity.LivingEntity;

/**
 * Disintegration (Knowledge Demon's curse; STS2 "at the end of your turn, take X damage"): every {@link #INTERVAL}
 * ticks, 1 / 1.5 / 2 magic damage for the first / second / third curse (amplifier 0-2).
 */
public class DisintegrationEffect extends SpireEffect {
    public static final int INTERVAL = 80;

    public DisintegrationEffect(MobEffectCategory category, int color) {
        super(category, color);
    }

    public static float damage(int amplifier) {
        return 1.0F + 0.5F * amplifier;
    }

    @Override
    public boolean shouldApplyEffectTickThisTick(int remainingDuration, int amplifier) {
        return true;
    }

    @Override
    public boolean applyEffectTick(ServerLevel level, LivingEntity entity, int amplifier) {
        if (entity.tickCount % INTERVAL == 0) entity.hurtServer(level, entity.damageSources().magic(), damage(amplifier));
        return true;
    }
}
