package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.registry.ModEntities;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.EntitySpawnReason;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.storage.ValueInput;
import net.minecraft.world.level.storage.ValueOutput;

/**
 * Two-Tailed Rat (Underdocks; STS2: Scratch 8, Disease Bite 6, Screech 1 Frail - random, never the same twice; Call for
 * Backup: after two turns a rat may summon one more, once each, three times per pack). A hunched, shaggy rat in packs of
 * three: scratch, a diseased bite (Hunger), a screech (Frail); after a while each rat may squeal for one more rat.
 */
public class TwoTailedRat extends SpireMonster {
    public static final int SCRATCH = 1, BITE = 2, SCREECH = 3, CALL = 4;
    public static final float SCRATCH_DAMAGE = 3.0F, BITE_DAMAGE = 2.0F;
    public static final int HUNGER_TICKS = 100, FRAIL_TICKS = 100, CALL_AFTER = 200, PACK_LIMIT = 6;
    public static final double PACK_RANGE = 16;
    private int last;
    private boolean called;

    public TwoTailedRat(EntityType<? extends Monster> type, Level level) {
        super(type, level);
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, 8).add(Attributes.MOVEMENT_SPEED, 0.32)
                .add(Attributes.ATTACK_DAMAGE, SCRATCH_DAMAGE).add(Attributes.FOLLOW_RANGE, 20);
    }

    @Override
    protected Move nextMove() {
        // call for backup: once per rat, after it has been around a while, while the pack is small enough
        if (!called && tickCount > CALL_AFTER && getRandom().nextInt(3) == 0
                && level().getEntitiesOfClass(TwoTailedRat.class, getBoundingBox().inflate(PACK_RANGE)).size() < PACK_LIMIT) {
            called = true;
            return move(CALL);
        }
        int pick;
        do pick = 1 + getRandom().nextInt(3); while (pick == last);
        last = pick;
        return move(pick);
    }

    public static Move move(int id) {
        return switch (id) {
            case SCRATCH -> Move.of(SCRATCH, 10, 6, 20, 2.0, (level, self, target) -> self.strike(level, target, SCRATCH_DAMAGE, 2.0));
            case BITE -> Move.of(BITE, 10, 6, 20, 2.0, (level, self, target) -> {
                if (self.strike(level, target, BITE_DAMAGE, 2.0)) target.addEffect(new MobEffectInstance(MobEffects.HUNGER, HUNGER_TICKS, 0), self);
            });
            case SCREECH -> Move.of(SCREECH, 12, 8, 25, 8, (level, self, target) -> {
                level.playSound(null, self.blockPosition(), SoundEvents.RABBIT_HURT, SoundSource.HOSTILE, 1.2F, 0.6F);
                self.debuff(target, ModEffects.FRAIL, FRAIL_TICKS);
            });
            default -> Move.of(CALL, 20, 10, 20, 64, (level, self, target) -> {
                level.playSound(null, self.blockPosition(), SoundEvents.RABBIT_AMBIENT, SoundSource.HOSTILE, 1.5F, 0.5F);
                TwoTailedRat rat = ModEntities.TWO_TAILED_RAT.get().create(level, EntitySpawnReason.REINFORCEMENT);
                if (rat == null) return;
                rat.snapTo(self.getX() + self.getRandom().nextGaussian(), self.getY(), self.getZ() + self.getRandom().nextGaussian(), self.getYRot(), 0);
                rat.called = true;   // the newcomer does not call again
                if (target != null) rat.setTarget(target);
                level.addFreshEntity(rat);
            });
        };
    }

    public boolean hasCalled() {
        return called;
    }

    @Override
    protected void addAdditionalSaveData(ValueOutput out) {
        super.addAdditionalSaveData(out);
        out.putBoolean("Called", called);
    }

    @Override
    protected void readAdditionalSaveData(ValueInput in) {
        super.readAdditionalSaveData(in);
        called = in.getBooleanOr("Called", false);
    }
}
