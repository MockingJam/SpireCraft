package com.mockingjam.spirecraft.effect;

import net.minecraft.world.effect.MobEffect;
import net.minecraft.world.effect.MobEffectCategory;

/**
 * Plain marker effect. Most Spire effects have no per-tick behaviour of their own;
 * their rules live in {@link SpireEffectEvents} so that all damage maths sits in one place.
 * Stacks (STS "layers") = amplifier + 1.
 */
public class SpireEffect extends MobEffect {
    public SpireEffect(MobEffectCategory category, int color) {
        super(category, color);
    }
}
