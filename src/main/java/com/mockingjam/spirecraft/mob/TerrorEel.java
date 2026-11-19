package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.effect.ModEffects;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.storage.ValueInput;
import net.minecraft.world.level.storage.ValueOutput;

/**
 * Terror Eel, elite (Underdocks; STS2: Crash 16 and Thrash 3×3 (+6 Vigor) alternate; at half HP Shriek - stunned for a
 * turn, then Terror: 99 Vulnerable). A sea creature (user): it lives in the water. Crash rams and knocks back; Thrash
 * bites three times and makes the next Crash harder; at half health it stuns itself, then shrieks Vulnerable onto every
 * player around for a minute.
 */
public class TerrorEel extends SeaMonster {
    public static final int CRASH = 1, THRASH = 2, STUN = 3, TERROR = 4;
    public static final float CRASH_DAMAGE = 6.5F, THRASH_DAMAGE = 1.2F, VIGOR = 2.5F, SHRIEK_AT = 0.5F;
    public static final int STUN_TICKS = 60, TERROR_TICKS = 1200;
    public static final double TERROR_RADIUS = 16;
    private boolean thrashNext, vigor, shrieked;

    public TerrorEel(EntityType<? extends Monster> type, Level level) {
        super(type, level);
        xpReward = 25;
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, 65).add(Attributes.ARMOR, 4).add(Attributes.MOVEMENT_SPEED, 1.3)
                .add(Attributes.ATTACK_DAMAGE, CRASH_DAMAGE).add(Attributes.KNOCKBACK_RESISTANCE, 0.5).add(Attributes.FOLLOW_RANGE, 32);
    }

    @Override
    protected Move nextMove() {
        boolean thrash = thrashNext;
        thrashNext = !thrashNext;
        return move(thrash ? THRASH : CRASH);
    }

    public static Move move(int id) {
        return switch (id) {
            case CRASH -> Move.of(CRASH, 16, 8, 25, 3.0, (level, self, target) -> {
                TerrorEel eel = (TerrorEel) self;
                float dmg = CRASH_DAMAGE + (eel.vigor ? VIGOR : 0);
                eel.vigor = false;
                if (self.strike(level, target, dmg, 3.0)) target.knockback(1.2, self.getX() - target.getX(), self.getZ() - target.getZ());
            });
            case THRASH -> new Move(THRASH, 12, 14, 25, 2.8, new int[] {0, 5, 10}, (level, self, target) -> {
                self.strike(level, target, THRASH_DAMAGE, 2.8);
                if (self.hitIndex() == 2) ((TerrorEel) self).vigor = true;
            });
            case STUN -> Move.of(STUN, 0, STUN_TICKS, 0, 64, (level, self, target) -> { });
            default -> Move.of(TERROR, 10, 10, 20, 64, (level, self, target) -> {
                level.playSound(null, self.blockPosition(), SoundEvents.ELDER_GUARDIAN_CURSE, SoundSource.HOSTILE, 1.5F, 0.8F);
                level.sendParticles(ParticleTypes.SONIC_BOOM, self.getX(), self.getY() + 0.8, self.getZ(), 1, 0, 0, 0, 0);
                for (Player p : level.getEntitiesOfClass(Player.class, self.getBoundingBox().inflate(TERROR_RADIUS))) self.debuff(p, ModEffects.VULNERABLE, TERROR_TICKS);
            });
        };
    }

    @Override
    protected void customServerAiStep(ServerLevel level) {
        if (!shrieked && getHealth() <= getMaxHealth() * SHRIEK_AT) shriek(level);
        super.customServerAiStep(level);
    }

    /** Half health: stunned, then the Terror shriek (planned right after the stun). */
    public void shriek(ServerLevel level) {
        shrieked = true;
        startMove(new Move(STUN, 0, STUN_TICKS, 0, 64, new int[] {STUN_TICKS - 1}, (l, self, target) -> ((TerrorEel) self).startTerror()));
        level.sendParticles(ParticleTypes.CRIT, getX(), getY() + 1, getZ(), 20, 0.5, 0.3, 0.5, 0.1);
    }

    private void startTerror() {
        // queued as the next move once the stun is over
        thrashNext = false;
        startMoveLater = true;
    }

    private boolean startMoveLater;

    @Override
    public void tick() {
        super.tick();
        if (startMoveLater && !isActing() && !level().isClientSide()) {
            startMoveLater = false;
            startMove(move(TERROR));
        }
    }

    public boolean hasShrieked() {
        return shrieked;
    }

    @Override
    protected void addAdditionalSaveData(ValueOutput out) {
        super.addAdditionalSaveData(out);
        out.putBoolean("Shrieked", shrieked);
    }

    @Override
    protected void readAdditionalSaveData(ValueInput in) {
        super.readAdditionalSaveData(in);
        shrieked = in.getBooleanOr("Shrieked", false);
    }
}
