package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.effect.ModEffects;
import javax.annotation.Nullable;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.DifficultyInstance;
import net.minecraft.world.entity.EntitySpawnReason;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.SpawnGroupData;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.ServerLevelAccessor;
import net.minecraft.world.level.storage.ValueInput;
import net.minecraft.world.level.storage.ValueOutput;

/**
 * Chomper (Hive; STS2 "An Automaton Pair": always two, Clamp 8x2 and Screech - 3 Dazed - alternating, one opening on
 * each; Artifact 2). A brass automaton bug with a jagged clamp jaw and a glowing cyan orb: clamp (two bites) and a
 * screech that leaves players Ringing (the Dazed cards clog the hand: slower attacks); born with 2 Artifact.
 */
public class Chomper extends SpireMonster {
    public static final int CLAMP = 1, SCREECH = 2;
    public static final float CLAMP_DAMAGE = 3;
    public static final int RINGING_TICKS = 80, ARTIFACT = 2;
    public static final double SCREECH_RADIUS = 16;
    private int next;

    public Chomper(EntityType<? extends Monster> type, Level level) {
        super(type, level);
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, 28).add(Attributes.MOVEMENT_SPEED, 0.25)
                .add(Attributes.ATTACK_DAMAGE, CLAMP_DAMAGE).add(Attributes.ARMOR, 6).add(Attributes.FOLLOW_RANGE, 20);
    }

    @Override
    public SpawnGroupData finalizeSpawn(ServerLevelAccessor level, DifficultyInstance difficulty, EntitySpawnReason reason, @Nullable SpawnGroupData data) {
        ModEffects.addStacks(this, ModEffects.ARTIFACT, ARTIFACT, -1, ARTIFACT);
        next = getRandom().nextBoolean() ? CLAMP : SCREECH;   // the pair opens on different moves (by chance)
        return super.finalizeSpawn(level, difficulty, reason, data);
    }

    @Override
    protected Move nextMove() {
        if (next == 0) next = CLAMP;
        int pick = next;
        next = pick == CLAMP ? SCREECH : CLAMP;
        return move(pick);
    }

    public static Move move(int id) {
        return switch (id) {
            case CLAMP -> new Move(CLAMP, 12, 10, 20, 2.2, new int[] {0, 6}, (level, self, target) -> {
                if (target != null) target.invulnerableTime = 0;
                self.strike(level, target, CLAMP_DAMAGE, 2.2);
            });
            default -> Move.of(SCREECH, 16, 10, 20, SCREECH_RADIUS, (level, self, target) -> {
                level.playSound(null, self.blockPosition(), SoundEvents.IRON_GOLEM_DAMAGE, SoundSource.HOSTILE, 1.5F, 1.6F);
                for (Player p : level.getEntitiesOfClass(Player.class, self.getBoundingBox().inflate(SCREECH_RADIUS))) self.debuff(p, ModEffects.RINGING, RINGING_TICKS);
            });
        };
    }

    @Override
    protected void addAdditionalSaveData(ValueOutput out) {
        super.addAdditionalSaveData(out);
        out.putInt("NextMove", next);
    }

    @Override
    protected void readAdditionalSaveData(ValueInput in) {
        super.readAdditionalSaveData(in);
        next = in.getIntOr("NextMove", 0);
    }
}
