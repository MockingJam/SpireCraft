package com.mockingjam.spirecraft.mob;

import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.level.Level;

/**
 * Nibbit (Overgrowth; STS2: Butt 12 → Hesitant Slice 6 + 5 Block → Hiss +2 Strength, in order). A four-legged lizard:
 * a knock-back headbutt, a slash that also shields it, a hiss that makes it stronger.
 */
public class Nibbit extends SpireMonster {
    public static final int BUTT = 1, SLICE = 2, HISS = 3;
    public static final float BUTT_DAMAGE = 5.0F, SLICE_DAMAGE = 3.0F;
    private int step;

    public Nibbit(EntityType<? extends Monster> type, Level level) {
        super(type, level);
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, 20).add(Attributes.MOVEMENT_SPEED, 0.27)
                .add(Attributes.ATTACK_DAMAGE, BUTT_DAMAGE).add(Attributes.FOLLOW_RANGE, 20);
    }

    @Override
    protected Move nextMove() {
        return move(1 + step++ % 3);
    }

    public static Move move(int id) {
        return switch (id) {
            case BUTT -> Move.of(BUTT, 14, 6, 20, 2.6, (level, self, target) -> {
                if (self.strike(level, target, BUTT_DAMAGE, 2.6)) target.knockback(1.0, self.getX() - target.getX(), self.getZ() - target.getZ());
            });
            case SLICE -> Move.of(SLICE, 8, 6, 20, 2.4, (level, self, target) -> {
                self.strike(level, target, SLICE_DAMAGE, 2.4);
                self.addEffect(new MobEffectInstance(MobEffects.ABSORPTION, 200, 0));   // "gains Block"
            });
            default -> Move.of(HISS, 20, 6, 15, 64, (level, self, target) -> self.addStrength(1, 600));
        };
    }
}
