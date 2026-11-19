package com.mockingjam.spirecraft.effect;

import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.effect.InstantenousMobEffect;
import net.minecraft.world.effect.MobEffectCategory;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.LivingEntity;
import org.jetbrains.annotations.Nullable;

/**
 * Blood Potion (Ironclad): "heal 20% of Max HP". Unlike vanilla Instant Health (fixed 4 per level) it scales with max health,
 * so it stays useful with high-health builds (fruit bonuses, armor with health).
 */
public class BloodHealEffect extends InstantenousMobEffect {
    public static final float FRACTION_PER_LEVEL = 0.20F;

    public BloodHealEffect(MobEffectCategory category, int color) {
        super(category, color);
    }

    @Override
    public boolean applyEffectTick(ServerLevel level, LivingEntity entity, int amplifier) {
        entity.heal(entity.getMaxHealth() * FRACTION_PER_LEVEL * (amplifier + 1));
        return true;
    }

    @Override
    public void applyInstantenousEffect(ServerLevel level, @Nullable Entity source, @Nullable Entity indirect, LivingEntity entity, int amplifier, double proximity) {
        entity.heal((float) (entity.getMaxHealth() * FRACTION_PER_LEVEL * (amplifier + 1) * proximity));
    }
}
