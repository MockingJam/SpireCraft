package com.mockingjam.spirecraft.mob;

import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.damagesource.DamageSource;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.level.Level;

/**
 * Exoskeleton (Hive; STS2: groups of 3-4, Skitter 1x3, Mandibles 8, Enrage +2 Strength, Mandibles always followed by
 * Enrage; Hard to Kill 9 - no hit takes more than 9). A hollow, husk-like bug in packs: skitter (three quick nips) or
 * mandibles, then always an Enrage after the mandibles; no single hit takes more than {@link #HIT_CAP} health.
 */
public class Exoskeleton extends SpireMonster {
    public static final int SKITTER = 1, MANDIBLES = 2, ENRAGE = 3;
    public static final float SKITTER_DAMAGE = 0.5F, MANDIBLES_DAMAGE = 3, HIT_CAP = 4;
    private int last;

    public Exoskeleton(EntityType<? extends Monster> type, Level level) {
        super(type, level);
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, 12).add(Attributes.MOVEMENT_SPEED, 0.3)
                .add(Attributes.ATTACK_DAMAGE, MANDIBLES_DAMAGE).add(Attributes.FOLLOW_RANGE, 20);
    }

    @Override
    protected Move nextMove() {
        // the pack opens on different moves; after Mandibles always Enrage, otherwise Skitter or Mandibles
        int pick = last == 0 ? 1 + getRandom().nextInt(3) : last == MANDIBLES ? ENRAGE : 1 + getRandom().nextInt(2);
        last = pick;
        return move(pick);
    }

    public static Move move(int id) {
        return switch (id) {
            case SKITTER -> new Move(SKITTER, 8, 12, 15, 2.0, new int[] {0, 4, 8}, (level, self, target) -> {
                if (target != null) target.invulnerableTime = 0;
                self.strike(level, target, SKITTER_DAMAGE, 2.0);
            });
            case MANDIBLES -> Move.of(MANDIBLES, 12, 6, 20, 2.0, (level, self, target) -> self.strike(level, target, MANDIBLES_DAMAGE, 2.0));
            default -> Move.of(ENRAGE, 14, 8, 15, 64, (level, self, target) -> {
                level.playSound(null, self.blockPosition(), SoundEvents.SILVERFISH_AMBIENT, SoundSource.HOSTILE, 1.2F, 0.6F);
                self.addStrength(1, 20 * 60 * 10);
            });
        };
    }

    /** Hard to Kill: every hit is capped. */
    @Override
    public boolean hurtServer(ServerLevel level, DamageSource source, float amount) {
        return super.hurtServer(level, source, source.is(net.minecraft.tags.DamageTypeTags.BYPASSES_INVULNERABILITY) ? amount : Math.min(amount, HIT_CAP));
    }
}
