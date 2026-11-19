package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.effect.ModEffects;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.network.chat.Component;
import net.minecraft.network.syncher.EntityDataAccessor;
import net.minecraft.network.syncher.EntityDataSerializers;
import net.minecraft.network.syncher.SynchedEntityData;
import net.minecraft.server.level.ServerBossEvent;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.BossEvent;
import net.minecraft.world.damagesource.DamageSource;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.storage.ValueInput;
import net.minecraft.world.level.storage.ValueOutput;
import net.minecraft.world.phys.Vec3;

/**
 * Kaiser Crab, boss (Hive; docs/design/mobs.md §10). STS2 fights its two claws as two enemies - Crusher (Thrash,
 * Enlarging Strike, Bug Sting, Adapt, Guarded Strike) and Rocket (Calculating, Precise Smash, Charge Up, Rocket Claw,
 * Recharge) - with Surrounded (the claw behind you hits 50% harder) and Crab Rage (when one claw dies the other gets
 * Strength and Block). Here: one crab with two health pools, one per claw; a hit counts against the claw on the side it
 * lands; the claws take turns, each running its own cycle; standing behind the crab makes its blows 50% harder; a
 * broken claw stops acting and enrages the other; the crab dies with both claws.
 */
public class KaiserCrab extends SpireMonster {
    private static final EntityDataAccessor<Boolean> CRUSHER_BROKEN = SynchedEntityData.defineId(KaiserCrab.class, EntityDataSerializers.BOOLEAN);
    private static final EntityDataAccessor<Boolean> ROCKET_BROKEN = SynchedEntityData.defineId(KaiserCrab.class, EntityDataSerializers.BOOLEAN);

    // Crusher (the armoured right claw, from the crab's view) 1-5, Rocket (the big purple left claw) 6-10
    public static final int THRASH = 1, ENLARGE = 2, STING = 3, ADAPT = 4, GUARD = 5;
    public static final int CALCULATE = 6, SMASH = 7, CHARGE = 8, ROCKET_CLAW = 9, RECHARGE = 10;
    public static final float CRUSHER_HP = 150, ROCKET_HP = 140, MAX_HEALTH = CRUSHER_HP + ROCKET_HP;
    public static final float THRASH_DAMAGE = 5, ENLARGE_DAMAGE = 2, STING_DAMAGE = 2, GUARD_DAMAGE = 5, CALC_DAMAGE = 1.5F, SMASH_DAMAGE = 7, ROCKET_DAMAGE = 14;
    public static final float BEHIND_BONUS = 1.5F, GUARD_ABSORB = 8, RAGE_ABSORB = 20;
    public static final int RAGE_STRENGTH = 3, STING_TICKS = 120, MARK_TICKS = 200;
    public static final double REACH = 8.0;   // the claws reach far ahead of its body at the STS2 size

    private final ServerBossEvent crusherBar = new ServerBossEvent(Component.translatable("entity.spirecraft.kaiser_crab.crusher"), BossEvent.BossBarColor.BLUE, BossEvent.BossBarOverlay.NOTCHED_10);
    private final ServerBossEvent rocketBar = new ServerBossEvent(Component.translatable("entity.spirecraft.kaiser_crab.rocket"), BossEvent.BossBarColor.PURPLE, BossEvent.BossBarOverlay.NOTCHED_10);
    private float crusher = CRUSHER_HP, rocket = ROCKET_HP;
    private int crusherStep, rocketStep;
    private boolean rocketTurn;

    public KaiserCrab(EntityType<? extends Monster> type, Level level) {
        super(type, level);
        setPersistenceRequired();
        xpReward = 200;
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, MAX_HEALTH).add(Attributes.MOVEMENT_SPEED, 0.22)
                .add(Attributes.ATTACK_DAMAGE, SMASH_DAMAGE).add(Attributes.ARMOR, 10).add(Attributes.KNOCKBACK_RESISTANCE, 1.0)
                .add(Attributes.FOLLOW_RANGE, 40).add(Attributes.STEP_HEIGHT, 1.5);
    }

    @Override
    protected void defineSynchedData(SynchedEntityData.Builder builder) {
        super.defineSynchedData(builder);
        builder.define(CRUSHER_BROKEN, false);
        builder.define(ROCKET_BROKEN, false);
    }

    public boolean crusherBroken() {
        return entityData.get(CRUSHER_BROKEN);
    }

    public boolean rocketBroken() {
        return entityData.get(ROCKET_BROKEN);
    }

    public float crusherHealth() {
        return crusher;
    }

    public float rocketHealth() {
        return rocket;
    }

    @Override
    protected Move nextMove() {
        boolean rocketGoes = crusherBroken() || (!rocketBroken() && rocketTurn);
        rocketTurn = !rocketTurn;
        if (rocketGoes) return move(CALCULATE + rocketStep++ % 5);
        return move(THRASH + crusherStep++ % 5);
    }

    /** Surrounded: the crab hits half again as hard at someone standing behind it. */
    public float sided(LivingEntity target, float damage) {
        if (target == null) return damage;
        Vec3 fwd = Vec3.directionFromRotation(0, yBodyRot), to = target.position().subtract(position()).multiply(1, 0, 1).normalize();
        return fwd.dot(to) < -0.3 ? damage * BEHIND_BONUS : damage;
    }

    private static boolean hit(ServerLevel level, SpireMonster self, LivingEntity target, float damage) {
        return self.strike(level, target, ((KaiserCrab) self).sided(target, damage), REACH);
    }

    public static Move move(int id) {
        return switch (id) {
            case THRASH -> Move.of(THRASH, 16, 8, 20, REACH, (level, self, target) -> hit(level, self, target, THRASH_DAMAGE));
            case ENLARGE -> Move.of(ENLARGE, 12, 8, 20, REACH, (level, self, target) -> {
                hit(level, self, target, ENLARGE_DAMAGE);
                self.addStrength(1, 20 * 60 * 10);
            });
            case STING -> new Move(STING, 14, 12, 20, REACH, new int[] {0, 6}, (level, self, target) -> {
                if (target != null) target.invulnerableTime = 0;
                if (hit(level, self, target, STING_DAMAGE) && self.hitIndex() == 1) {
                    self.debuff(target, ModEffects.WEAK, STING_TICKS);
                    self.debuff(target, ModEffects.FRAIL, STING_TICKS);
                }
            });
            case ADAPT -> Move.of(ADAPT, 16, 8, 15, 64, (level, self, target) -> {
                level.playSound(null, self.blockPosition(), SoundEvents.ARMOR_EQUIP_NETHERITE.value(), SoundSource.HOSTILE, 1.5F, 0.6F);
                self.addStrength(1, 20 * 60 * 10);
            });
            case GUARD -> Move.of(GUARD, 14, 8, 20, REACH, (level, self, target) -> {
                hit(level, self, target, GUARD_DAMAGE);
                self.setAbsorptionAmount(Math.max(self.getAbsorptionAmount(), GUARD_ABSORB));
            });
            case CALCULATE -> Move.of(CALCULATE, 14, 8, 20, 24, (level, self, target) -> {
                if (target == null || !self.hasLineOfSight(target)) return;
                target.hurtServer(level, self.damageSources().mobAttack(self), ((KaiserCrab) self).sided(target, CALC_DAMAGE));
                target.addEffect(new MobEffectInstance(MobEffects.GLOWING, MARK_TICKS, 0), self);   // the target is marked
            });
            case SMASH -> Move.of(SMASH, 18, 8, 20, REACH, (level, self, target) -> {
                if (hit(level, self, target, SMASH_DAMAGE)) target.knockback(1.0, self.getX() - target.getX(), self.getZ() - target.getZ());
            });
            case CHARGE -> Move.of(CHARGE, 16, 8, 15, 64, (level, self, target) -> {
                level.playSound(null, self.blockPosition(), SoundEvents.BEACON_POWER_SELECT, SoundSource.HOSTILE, 1.5F, 0.6F);
                level.sendParticles(ParticleTypes.ELECTRIC_SPARK, self.getX(), self.getY() + 1.5, self.getZ(), 20, 1.0, 0.5, 1.0, 0.1);
                self.addStrength(1, 20 * 60 * 10);
            });
            // the rocket claw: a long wind-up, then the crab hurls itself forward claw first
            case ROCKET_CLAW -> new Move(ROCKET_CLAW, 40, 14, 25, 12, new int[] {0, 5}, (level, self, target) -> {
                if (target == null) return;
                if (self.hitIndex() == 0) {
                    Vec3 to = target.position().subtract(self.position()).multiply(1, 0, 1).normalize();
                    self.setDeltaMovement(to.x * 2.0, 0.15, to.z * 2.0);
                    level.playSound(null, self.blockPosition(), SoundEvents.FIREWORK_ROCKET_LAUNCH, SoundSource.HOSTILE, 2.0F, 0.5F);
                    return;
                }
                if (hit(level, self, target, ROCKET_DAMAGE)) target.knockback(2.0, self.getX() - target.getX(), self.getZ() - target.getZ());
            });
            default -> Move.of(RECHARGE, 0, 40, 10, 64, (level, self, target) -> { });
        };
    }

    /** A hit counts against the claw on the side it lands (the other one if that claw is already gone). */
    @Override
    public boolean hurtServer(ServerLevel level, DamageSource source, float amount) {
        float before = getHealth();
        boolean hurt = super.hurtServer(level, source, amount);
        float lost = before - getHealth();
        if (lost > 0) takeFromClaw(level, source.getSourcePosition(), lost);
        return hurt;
    }

    /** Whether a point lies on the Crusher's side (the crab's right). */
    public boolean crusherSide(Vec3 from) {
        if (from == null) return getRandom().nextBoolean();
        Vec3 fwd = Vec3.directionFromRotation(0, yBodyRot), right = new Vec3(-fwd.z, 0, fwd.x);
        return from.subtract(position()).dot(right) >= 0;
    }

    public void takeFromClaw(ServerLevel level, Vec3 from, float lost) {
        boolean toCrusher = crusherBroken() ? false : rocketBroken() || crusherSide(from);
        // a claw's pool stops at 0 (what is left of the blow is spent breaking it); the crab dies with its health
        if (toCrusher) crusher = Math.max(0, crusher - lost); else rocket = Math.max(0, rocket - lost);
        if (crusher <= 0 && !crusherBroken()) breakClaw(level, true);
        if (rocket <= 0 && !rocketBroken()) breakClaw(level, false);
    }

    /** Crab Rage: one claw is broken off; the other gets Strength and a shell of absorption. */
    private void breakClaw(ServerLevel level, boolean isCrusher) {
        entityData.set(isCrusher ? CRUSHER_BROKEN : ROCKET_BROKEN, true);
        level.playSound(null, blockPosition(), SoundEvents.TURTLE_EGG_CRACK, SoundSource.HOSTILE, 3.0F, 0.5F);
        level.sendParticles(ParticleTypes.EXPLOSION, getX(), getY() + 1.2, getZ(), 4, 1.5, 0.4, 1.5, 0);
        if (isAlive() && !(crusherBroken() && rocketBroken())) {
            addStrength(RAGE_STRENGTH, 20 * 60 * 10);
            setAbsorptionAmount(Math.max(getAbsorptionAmount(), RAGE_ABSORB));
            level.playSound(null, blockPosition(), SoundEvents.RAVAGER_ROAR, SoundSource.HOSTILE, 3.0F, 1.4F);
        }
    }

    @Override
    protected void customServerAiStep(ServerLevel level) {
        super.customServerAiStep(level);
        crusherBar.setProgress(Math.max(0, crusher / CRUSHER_HP));
        rocketBar.setProgress(Math.max(0, rocket / ROCKET_HP));
    }

    @Override
    protected void addAdditionalSaveData(ValueOutput out) {
        super.addAdditionalSaveData(out);
        out.putFloat("Crusher", crusher);
        out.putFloat("Rocket", rocket);
        out.putInt("CrusherStep", crusherStep);
        out.putInt("RocketStep", rocketStep);
        out.putBoolean("CrusherBroken", crusherBroken());
        out.putBoolean("RocketBroken", rocketBroken());
    }

    @Override
    protected void readAdditionalSaveData(ValueInput in) {
        super.readAdditionalSaveData(in);
        crusher = in.getFloatOr("Crusher", CRUSHER_HP);
        rocket = in.getFloatOr("Rocket", ROCKET_HP);
        crusherStep = in.getIntOr("CrusherStep", 0);
        rocketStep = in.getIntOr("RocketStep", 0);
        entityData.set(CRUSHER_BROKEN, in.getBooleanOr("CrusherBroken", false));
        entityData.set(ROCKET_BROKEN, in.getBooleanOr("RocketBroken", false));
    }

    @Override
    public void startSeenByPlayer(ServerPlayer player) {
        super.startSeenByPlayer(player);
        crusherBar.addPlayer(player);
        rocketBar.addPlayer(player);
    }

    @Override
    public void stopSeenByPlayer(ServerPlayer player) {
        super.stopSeenByPlayer(player);
        crusherBar.removePlayer(player);
        rocketBar.removePlayer(player);
    }

    @Override
    public boolean removeWhenFarAway(double distance) {
        return false;
    }
}
