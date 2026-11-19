package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.effect.ModEffects;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerBossEvent;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.BossEvent;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.storage.ValueInput;
import net.minecraft.world.level.storage.ValueOutput;
import net.minecraft.world.phys.Vec3;

/**
 * Ceremonial Beast, boss (Overgrowth). STS2: phase 1 — Stamp sets a Plow threshold, then Plow (18 + 2 Strength) over and
 * over; reaching the threshold stuns it and strips its Strength; phase 2 — Beast Cry (Ringing), Stomp 15, Crush 17 + 3
 * Strength. Minecraft: plow charges until 60% health, a 5-second stun, then cry / stomp / crush.
 */
public class CeremonialBeast extends SpireMonster {
    public static final int PLOW = 1, STUN = 2, CRY = 3, STOMP = 4, CRUSH = 5;
    public static final float MAX_HEALTH = 250, PLOW_THRESHOLD = 0.6F;
    public static final float PLOW_DAMAGE = 8, STOMP_DAMAGE = 6, CRUSH_DAMAGE = 7;
    public static final int STUN_TICKS = 100, RINGING_TICKS = 120;
    public static final double CRY_RADIUS = 16, STOMP_RADIUS = 5;
    private static final int[] PHASE2 = {CRY, STOMP, CRUSH, STOMP, CRUSH};

    private final ServerBossEvent bossBar = new ServerBossEvent(getDisplayName(), BossEvent.BossBarColor.BLUE, BossEvent.BossBarOverlay.PROGRESS);
    private boolean phaseTwo;
    private int step;

    public CeremonialBeast(EntityType<? extends Monster> type, Level level) {
        super(type, level);
        setPersistenceRequired();
        xpReward = 200;
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, MAX_HEALTH).add(Attributes.MOVEMENT_SPEED, 0.3)
                .add(Attributes.ATTACK_DAMAGE, PLOW_DAMAGE).add(Attributes.ARMOR, 8).add(Attributes.KNOCKBACK_RESISTANCE, 0.8)
                .add(Attributes.FOLLOW_RANGE, 40);
    }

    public boolean isPhaseTwo() {
        return phaseTwo;
    }

    @Override
    protected Move nextMove() {
        return phaseTwo ? move(PHASE2[step++ % PHASE2.length]) : move(PLOW);
    }

    public static Move move(int id) {
        return switch (id) {
            case PLOW -> new Move(PLOW, 20, 16, 20, 12, new int[] {0, 7}, (level, self, target) -> {
                if (target == null) return;
                if (self.hitIndex() == 0) {   // charge
                    Vec3 to = target.position().subtract(self.position()).multiply(1, 0, 1).normalize();
                    self.setDeltaMovement(to.x * 1.4, 0.1, to.z * 1.4);
                    return;
                }
                if (self.strike(level, target, PLOW_DAMAGE, 3.2)) target.knockback(1.5, self.getX() - target.getX(), self.getZ() - target.getZ());
                self.addStrength(1, 20 * 60 * 10);
            });
            case STUN -> Move.of(STUN, 0, STUN_TICKS, 10, 64, (level, self, target) -> { });
            case CRY -> Move.of(CRY, 20, 10, 20, CRY_RADIUS, (level, self, target) -> {
                level.playSound(null, self.blockPosition(), SoundEvents.RAVAGER_ROAR, SoundSource.HOSTILE, 3.0F, 0.7F);
                for (Player p : level.getEntitiesOfClass(Player.class, self.getBoundingBox().inflate(CRY_RADIUS))) self.debuff(p, ModEffects.RINGING, RINGING_TICKS);
            });
            case STOMP -> Move.of(STOMP, 16, 8, 25, STOMP_RADIUS, (level, self, target) -> {
                level.sendParticles(ParticleTypes.EXPLOSION, self.getX(), self.getY() + 0.2, self.getZ(), 6, 2, 0.2, 2, 0);
                for (Player p : level.getEntitiesOfClass(Player.class, self.getBoundingBox().inflate(STOMP_RADIUS, 2, STOMP_RADIUS))) {
                    if (p.hurtServer(level, self.damageSources().mobAttack(self), STOMP_DAMAGE)) p.push(0, 0.6, 0);
                }
            });
            default -> Move.of(CRUSH, 14, 8, 25, 3.2, (level, self, target) -> {
                self.strike(level, target, CRUSH_DAMAGE, 3.2);
                self.addStrength(2, 20 * 60 * 10);
            });
        };
    }

    @Override
    protected void customServerAiStep(ServerLevel level) {
        if (!phaseTwo && getHealth() <= getMaxHealth() * PLOW_THRESHOLD) enterPhaseTwo(level);
        super.customServerAiStep(level);
        bossBar.setProgress(getHealth() / getMaxHealth());
    }

    /** Plow threshold reached: stunned, loses all Strength, then the second phase. */
    public void enterPhaseTwo(ServerLevel level) {
        phaseTwo = true;
        removeEffect(ModEffects.holder(ModEffects.STRENGTH));
        startMove(move(STUN));
        level.playSound(null, blockPosition(), SoundEvents.RAVAGER_STUNNED, SoundSource.HOSTILE, 1.5F, 0.8F);
        level.sendParticles(ParticleTypes.CRIT, getX(), getY() + 2.2, getZ(), 30, 0.6, 0.3, 0.6, 0.1);
    }

    @Override
    protected void addAdditionalSaveData(ValueOutput out) {
        super.addAdditionalSaveData(out);
        out.putBoolean("PhaseTwo", phaseTwo);
    }

    @Override
    protected void readAdditionalSaveData(ValueInput in) {
        super.readAdditionalSaveData(in);
        phaseTwo = in.getBooleanOr("PhaseTwo", false);
        if (hasCustomName()) bossBar.setName(getDisplayName());
    }

    @Override
    public void startSeenByPlayer(ServerPlayer player) {
        super.startSeenByPlayer(player);
        bossBar.addPlayer(player);
    }

    @Override
    public void stopSeenByPlayer(ServerPlayer player) {
        super.stopSeenByPlayer(player);
        bossBar.removePlayer(player);
    }

    @Override
    public boolean removeWhenFarAway(double distance) {
        return false;
    }
}
