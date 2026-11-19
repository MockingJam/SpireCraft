package com.mockingjam.spirecraft.effect;

import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.effect.MobEffectCategory;
import net.minecraft.world.entity.LivingEntity;

/**
 * Spire poison: every {@link #INTERVAL} ticks deal (stacks) magic damage, then lose one stack.
 * Unlike vanilla poison it can kill. The pulse follows the entity's own tick counter, so applying
 * poison never deals damage instantly (first pulse 0–5 s later, like the start of the next STS turn).
 */
public class SpirePoisonEffect extends SpireEffect {
    public static final int INTERVAL = 100; // 5 seconds = one STS "turn"

    public SpirePoisonEffect(MobEffectCategory category, int color) {
        super(category, color);
    }

    @Override
    public boolean shouldApplyEffectTickThisTick(int remainingDuration, int amplifier) {
        return true; // timing is decided per entity in applyEffectTick
    }

    @Override
    public boolean applyEffectTick(ServerLevel level, LivingEntity entity, int amplifier) {
        if (entity.tickCount % INTERVAL != 0) return true;
        entity.hurtServer(level, entity.damageSources().magic(), amplifier + 1);
        // Changing the active effect map here would break the effect tick loop, so the decay is queued.
        StackChanges.queueDecrement(entity, ModEffects.holder(ModEffects.POISON));
        return true;
    }
}
