package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.weapon.projectile.SpireBolt;
import net.minecraft.network.syncher.EntityDataAccessor;
import net.minecraft.network.syncher.EntityDataSerializers;
import net.minecraft.network.syncher.SynchedEntityData;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.ai.goal.FloatGoal;
import net.minecraft.world.entity.ai.goal.Goal;
import net.minecraft.world.entity.ai.goal.LookAtPlayerGoal;
import net.minecraft.world.entity.ai.goal.RandomLookAroundGoal;
import net.minecraft.world.entity.ai.goal.WaterAvoidingRandomStrollGoal;
import net.minecraft.world.entity.ai.goal.target.HurtByTargetGoal;
import net.minecraft.world.entity.ai.goal.target.NearestAttackableTargetGoal;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.Vec3;
import java.util.EnumSet;

/**
 * Base of the STS2 monsters (docs/design/mobs.md). Instead of vanilla melee, each monster runs a move cycle like the
 * STS2 intents: it plans its next {@link Move}, walks into that move's range, telegraphs it for {@code windup} ticks
 * (clients animate it from the synced move id), then acts and rests for {@code cooldown} ticks before planning again.
 */
public abstract class SpireMonster extends Monster {
    private static final EntityDataAccessor<Integer> MOVE = SynchedEntityData.defineId(SpireMonster.class, EntityDataSerializers.INT);

    private Move planned;
    private Move current;
    private int moveTicks;
    private int rest;
    private int hitIndex;
    /** Client: tickCount when the synced move last changed (for animation progress). */
    public int moveStartTick;

    protected SpireMonster(EntityType<? extends Monster> type, Level level) {
        super(type, level);
    }

    @Override
    protected void defineSynchedData(SynchedEntityData.Builder builder) {
        super.defineSynchedData(builder);
        builder.define(MOVE, 0);
    }

    @Override
    public void onSyncedDataUpdated(EntityDataAccessor<?> key) {
        super.onSyncedDataUpdated(key);
        if (MOVE.equals(key)) moveStartTick = tickCount;
    }

    /** The move currently being performed (0 = none); synced to clients for animation. */
    public int moveId() {
        return entityData.get(MOVE);
    }

    @Override
    protected void registerGoals() {
        goalSelector.addGoal(0, new FloatGoal(this));
        goalSelector.addGoal(2, new ApproachGoal());
        goalSelector.addGoal(6, new WaterAvoidingRandomStrollGoal(this, 0.8));
        goalSelector.addGoal(7, new LookAtPlayerGoal(this, Player.class, 8.0F));
        goalSelector.addGoal(8, new RandomLookAroundGoal(this));
        targetSelector.addGoal(1, new HurtByTargetGoal(this));
        targetSelector.addGoal(2, new NearestAttackableTargetGoal<>(this, Player.class, true));
    }

    /** Chooses the next move (the STS2 intent). Called when the previous one is over. */
    protected abstract Move nextMove();

    /** Movement speed multiplier used while closing in on the target. */
    protected double chaseSpeed() {
        return 1.0;
    }

    @Override
    protected void customServerAiStep(ServerLevel level) {
        super.customServerAiStep(level);
        LivingEntity target = getTarget();
        if (current != null) {
            moveTicks++;
            if (target != null) getLookControl().setLookAt(target, 30, 30);
            int[] hits = current.hitTicks();
            for (hitIndex = 0; hitIndex < hits.length; hitIndex++) if (moveTicks == current.windup() + hits[hitIndex]) current.action().act(level, this, target);
            if (moveTicks >= current.windup() + current.duration()) {
                rest = current.cooldown();
                current = null;
                planned = null;
                entityData.set(MOVE, 0);
            }
            return;
        }
        if (rest > 0) { rest--; return; }
        if (target == null || !target.isAlive()) return;
        if (planned == null) planned = nextMove();
        if (distanceTo(target) <= planned.range() && (planned.range() > 30 || hasLineOfSight(target))) {
            current = planned;
            moveTicks = 0;
            getNavigation().stop();
            entityData.set(MOVE, current.id());
        }
    }

    /** Starts a move immediately, interrupting whatever was going on (e.g. a boss being stunned). */
    protected void startMove(Move move) {
        current = move;
        planned = move;
        moveTicks = 0;
        getNavigation().stop();
        entityData.set(MOVE, move.id());
    }

    /** Which of the current move's hits is running (0-based), for multi-step moves. */
    public int hitIndex() {
        return hitIndex;
    }

    /** True while a move is being telegraphed or performed (no walking then). */
    public boolean isActing() {
        return current != null;
    }

    /** Range of the planned move (for the approach goal). */
    protected double plannedRange() {
        return planned == null ? 2.0 : planned.range();
    }

    /** For the self-test: forces a move right now against the given target. */
    public void forceMove(ServerLevel level, Move move, LivingEntity target) {
        for (hitIndex = 0; hitIndex < move.hitTicks().length; hitIndex++) {
            if (target != null) target.invulnerableTime = 0;
            move.action().act(level, this, target);
        }
    }

    // ------------------------------------------------------------------ helpers for moves
    /** A melee hit that lands if the target is still within reach; returns whether it hit. */
    public boolean strike(ServerLevel level, LivingEntity target, float damage, double reach) {
        if (target == null || distanceTo(target) > reach + target.getBbWidth() / 2) return false;
        return target.hurtServer(level, damageSources().mobAttack(this), damage);
    }

    public void addStrength(int stacks, int duration) {
        ModEffects.addStacks(this, ModEffects.STRENGTH, stacks, duration, 99);
    }

    public void debuff(LivingEntity target, net.minecraftforge.registries.RegistryObject<net.minecraft.world.effect.MobEffect> effect, int ticks) {
        if (target != null) target.addEffect(new MobEffectInstance(ModEffects.holder(effect), ticks, 0), this);
    }

    /** Fires a small bolt at the target (rendered as {@code look}). */
    public SpireBolt shoot(ServerLevel level, LivingEntity target, ItemStack look, SpireBolt.Kind kind, float damage, float speed) {
        if (target == null) return null;
        SpireBolt bolt = new SpireBolt(level, this, look, kind, damage);
        Vec3 to = target.getEyePosition().subtract(getEyePosition());
        bolt.setPos(getX(), getEyeY() - 0.1, getZ());
        bolt.shoot(to.x, to.y + to.horizontalDistance() * 0.08, to.z, speed, 1.0F);
        level.addFreshEntity(bolt);
        return bolt;
    }

    /**
     * Lob a projectile in a high arc that comes down on the target (v5: the Wurm's acid): from {@code height} blocks
     * above the feet, with the horizontal speed fixed and the vertical speed solved for the projectile's gravity.
     */
    public SpireBolt lob(ServerLevel level, LivingEntity target, ItemStack look, SpireBolt.Kind kind, float damage, double height) {
        if (target == null) return null;
        SpireBolt bolt = new SpireBolt(level, this, look, kind, damage);
        bolt.setPos(getX(), getY() + height, getZ());
        Vec3 to = target.position().add(0, target.getBbHeight() * 0.5, 0).subtract(bolt.position());
        double dist = to.horizontalDistance(), vh = 0.45, t = Math.max(4, dist / vh), g = 0.03;
        double vy = (to.y + 0.5 * g * t * t) / t;
        bolt.setDeltaMovement(to.x / Math.max(0.01, dist) * vh, vy, to.z / Math.max(0.01, dist) * vh);
        level.addFreshEntity(bolt);
        return bolt;
    }

    /** Walks toward the target until the planned move is in range; stands still while acting. */
    class ApproachGoal extends Goal {
        ApproachGoal() {
            setFlags(EnumSet.of(Flag.MOVE, Flag.LOOK));
        }

        @Override
        public boolean canUse() {
            return getTarget() != null && getTarget().isAlive();
        }

        @Override
        public void tick() {
            LivingEntity target = getTarget();
            if (target == null) return;
            getLookControl().setLookAt(target, 30, 30);
            if (isActing()) { getNavigation().stop(); return; }
            double range = Math.max(1.5, plannedRange() * 0.8);
            if (distanceTo(target) > range || !hasLineOfSight(target)) getNavigation().moveTo(target, chaseSpeed());
            else getNavigation().stop();
        }
    }

}
