package com.mockingjam.spirecraft.mob;

import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.AgeableMob;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EntityDimensions;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.PlayerRideableJumping;
import net.minecraft.world.entity.TamableAnimal;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.ai.goal.BreedGoal;
import net.minecraft.world.entity.ai.goal.FloatGoal;
import net.minecraft.world.entity.ai.goal.FollowOwnerGoal;
import net.minecraft.world.entity.ai.goal.FollowParentGoal;
import net.minecraft.world.entity.ai.goal.Goal;
import net.minecraft.world.entity.ai.goal.LookAtPlayerGoal;
import net.minecraft.world.entity.ai.goal.MeleeAttackGoal;
import net.minecraft.world.entity.ai.goal.RandomLookAroundGoal;
import net.minecraft.world.entity.ai.goal.SitWhenOrderedToGoal;
import net.minecraft.world.entity.ai.goal.TemptGoal;
import net.minecraft.world.entity.ai.goal.WaterAvoidingRandomStrollGoal;
import net.minecraft.world.entity.ai.goal.target.HurtByTargetGoal;
import net.minecraft.world.entity.ai.goal.target.NearestAttackableTargetGoal;
import net.minecraft.world.entity.ai.goal.target.OwnerHurtByTargetGoal;
import net.minecraft.world.entity.ai.goal.target.OwnerHurtTargetGoal;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.Vec3;
import org.jetbrains.annotations.Nullable;
import java.util.EnumSet;

/**
 * The Rhino Beetle (犀角甲虫, Glory v2, 2026-11-26): the Frog Knights' mount - a big purple horned beetle. Passive by
 * itself; bred and kept in the beetle training grounds. A Frog Knight or a Frog Trainer near it turns it on players
 * (and a Trainer climbs on its back). Fed melon, sweet berries or apples it breeds, and a player can tame it with them
 * (one in four); a tamed beetle follows and fights for its owner like a wolf and can be ridden - jump (held for power)
 * makes it charge, ramming what is in front of it.
 */
public class RhinoBeetle extends TamableAnimal implements PlayerRideableJumping {
    public static final float RAM = 6.0F;
    private int dashTicks, dashCooldown;
    private float pendingDash;

    public RhinoBeetle(EntityType<? extends TamableAnimal> type, Level level) {
        super(type, level);
    }

    public static AttributeSupplier.Builder attributes() {
        return net.minecraft.world.entity.animal.Animal.createAnimalAttributes().add(Attributes.MAX_HEALTH, 30).add(Attributes.MOVEMENT_SPEED, 0.28)
                .add(Attributes.ATTACK_DAMAGE, 5).add(Attributes.ARMOR, 6).add(Attributes.KNOCKBACK_RESISTANCE, 0.5)
                .add(Attributes.FOLLOW_RANGE, 20).add(Attributes.STEP_HEIGHT, 1.0).add(Attributes.MAX_ABSORPTION, 40);
    }

    @Override
    protected void registerGoals() {
        goalSelector.addGoal(0, new FloatGoal(this));
        goalSelector.addGoal(1, new SitWhenOrderedToGoal(this));
        goalSelector.addGoal(2, new ChargeGoal());
        goalSelector.addGoal(3, new MeleeAttackGoal(this, 1.2, true));
        goalSelector.addGoal(4, new BreedGoal(this, 1.0));
        goalSelector.addGoal(5, new TemptGoal(this, 1.1, this::isFood, false));
        goalSelector.addGoal(6, new FollowOwnerGoal(this, 1.1, 8.0F, 3.0F));
        goalSelector.addGoal(7, new FollowParentGoal(this, 1.1));
        goalSelector.addGoal(8, new WaterAvoidingRandomStrollGoal(this, 0.8));
        goalSelector.addGoal(9, new LookAtPlayerGoal(this, Player.class, 8.0F));
        goalSelector.addGoal(10, new RandomLookAroundGoal(this));
        targetSelector.addGoal(1, new OwnerHurtByTargetGoal(this));
        targetSelector.addGoal(2, new OwnerHurtTargetGoal(this));
        targetSelector.addGoal(3, new HurtByTargetGoal(this));
        // a frog's beetle: turned on players while a Frog Knight or Trainer is near, or carrying one
        targetSelector.addGoal(4, new NearestAttackableTargetGoal<>(this, Player.class, 10, true, false, (p, level) -> commanded()));
    }

    /** Untamed and with a frog rider, or a Frog Knight / Trainer within 12 blocks: it fights for them. */
    public boolean commanded() {
        if (isTame() || isBaby()) return false;
        if (getFirstPassenger() instanceof ScriptedMonster) return true;
        return !level().getEntitiesOfClass(ScriptedMonster.class, getBoundingBox().inflate(12),
                m -> m.isAlive() && (m.def.name.equals("frog_knight") || m.def.name.equals("frog_trainer"))).isEmpty();
    }

    /** A beetle a Frog Trainer can climb on: untamed, grown, nobody on it. */
    public boolean free() {
        return isAlive() && !isTame() && !isBaby() && !isVehicle();
    }

    @Override
    public boolean isFood(ItemStack stack) {
        return stack.is(Items.MELON_SLICE) || stack.is(Items.SWEET_BERRIES) || stack.is(Items.APPLE);
    }

    @Nullable
    @Override
    public AgeableMob getBreedOffspring(ServerLevel level, AgeableMob other) {
        return com.mockingjam.spirecraft.registry.ModEntities.RHINO_BEETLE.get().create(level, net.minecraft.world.entity.EntitySpawnReason.BREEDING);
    }

    @Override
    public InteractionResult mobInteract(Player player, InteractionHand hand) {
        ItemStack stack = player.getItemInHand(hand);
        if (!isTame() && isFood(stack) && !isBaby() && !isVehicle()) {
            // taming: one in four, as a wolf with bones
            if (!level().isClientSide()) {
                stack.consume(1, player);
                if (random.nextInt(4) == 0) {
                    tame(player);
                    setTarget(null);
                    navigation.stop();
                    level().broadcastEntityEvent(this, (byte) 7);
                } else level().broadcastEntityEvent(this, (byte) 6);
            }
            return InteractionResult.SUCCESS;
        }
        if (isTame() && isOwnedBy(player) && !isFood(stack)) {
            if (player.isSecondaryUseActive()) {
                if (!level().isClientSide()) { setOrderedToSit(!isOrderedToSit()); navigation.stop(); setTarget(null); }
                return InteractionResult.SUCCESS;
            }
            if (!isBaby() && !isVehicle()) {
                if (!level().isClientSide()) { setOrderedToSit(false); setInSittingPose(false); player.startRiding(this); }
                return InteractionResult.SUCCESS;
            }
        }
        return super.mobInteract(player, hand);
    }

    @Override
    public boolean wantsToAttack(LivingEntity target, LivingEntity owner) {
        return target != owner && !(target instanceof TamableAnimal t && t.isOwnedBy(owner));
    }

    // ------------------------------------------------------------------------------------------- riding
    @Nullable
    @Override
    public LivingEntity getControllingPassenger() {
        // only its owner steers it; a frog on its back rides along while the beetle fights by itself
        return getFirstPassenger() instanceof Player p && isTame() && isOwnedBy(p) ? p : null;
    }

    @Override
    protected Vec3 getPassengerAttachmentPoint(Entity passenger, EntityDimensions dims, float scale) {
        return new Vec3(0, dims.height() * 0.92, 0.15 * scale);
    }

    @Override
    protected Vec3 getRiddenInput(Player player, Vec3 input) {
        float side = player.xxa * 0.5F, fwd = player.zza;
        if (fwd <= 0) fwd *= 0.3F;
        return new Vec3(side, 0, fwd);
    }

    @Override
    protected float getRiddenSpeed(Player player) {
        return (float) getAttributeValue(Attributes.MOVEMENT_SPEED);
    }

    @Override
    protected void tickRidden(Player player, Vec3 input) {
        super.tickRidden(player, input);
        setRot(player.getYRot(), player.getXRot() * 0.5F);
        yRotO = yBodyRot = yHeadRot = getYRot();
        if (pendingDash > 0) {   // the charge, on the side that moves it (the rider's client)
            Vec3 look = Vec3.directionFromRotation(0, getYRot());
            setDeltaMovement(getDeltaMovement().add(look.scale(0.6 + 1.2 * pendingDash)));
            pendingDash = 0;
        }
    }

    @Override
    public void onPlayerJump(int power) {
        if (dashCooldown <= 0) pendingDash = Math.max(0.2F, Math.min(1, power / 100F));
    }

    @Override
    public boolean canJump() {
        return dashCooldown <= 0 && onGround();
    }

    @Override
    public void handleStartJump(int power) {
        if (dashCooldown > 0) return;
        dashTicks = 12;
        dashCooldown = 50;
        playSound(SoundEvents.RAVAGER_ROAR, 0.6F, 1.6F);
    }

    @Override
    public void handleStopJump() {
    }

    @Override
    public int getJumpCooldown() {
        return dashCooldown;
    }

    /** A charge: forward hard, ramming what it runs into. */
    public void charge(LivingEntity target) {
        Vec3 d = target.position().subtract(position()).multiply(1, 0, 1).normalize();
        setDeltaMovement(d.scale(1.3).add(0, 0.1, 0));
        dashTicks = 14;
        dashCooldown = 80;
        playSound(SoundEvents.RAVAGER_ROAR, 0.8F, 1.5F);
    }

    @Override
    public void tick() {
        super.tick();
        if (dashCooldown > 0) dashCooldown--;
        if (dashTicks > 0 && level() instanceof ServerLevel level) {
            dashTicks--;
            level.sendParticles(ParticleTypes.CLOUD, getX(), getY() + 0.2, getZ(), 2, 0.3, 0.05, 0.3, 0.01);
            LivingEntity rider = getControllingPassenger();
            for (LivingEntity e : level.getEntitiesOfClass(LivingEntity.class, getBoundingBox().inflate(0.4), e -> e != this && !isPassengerOfSameVehicle(e) && e != rider && !(e == getOwner()) && e.isAlive())) {
                if (isTame() && e instanceof TamableAnimal t && t.isOwnedBy(getOwner())) continue;
                if (!isTame() && !(e instanceof Player) && e != getTarget()) continue;   // a frog's beetle rams players
                if (e.hurtServer(level, damageSources().mobAttack(this), RAM)) {
                    Vec3 push = e.position().subtract(position()).multiply(1, 0, 1).normalize().scale(1.2);
                    e.push(push.x, 0.45, push.z);
                    level.playSound(null, blockPosition(), SoundEvents.PLAYER_ATTACK_KNOCKBACK, SoundSource.NEUTRAL, 1.0F, 0.7F);
                    dashTicks = 0;
                }
            }
        }
    }

    /** Charges at its target from 4 to 12 blocks away, now and then. */
    class ChargeGoal extends Goal {
        ChargeGoal() {
            setFlags(EnumSet.of(Flag.MOVE, Flag.LOOK));
        }

        @Override
        public boolean canUse() {
            LivingEntity t = getTarget();
            if (t == null || !t.isAlive() || dashCooldown > 0 || !onGround() || getControllingPassenger() != null) return false;
            double d = distanceToSqr(t);
            return d > 16 && d < 144 && hasLineOfSight(t) && random.nextInt(10) == 0;
        }

        @Override
        public void start() {
            LivingEntity t = getTarget();
            if (t == null) return;
            getLookControl().setLookAt(t, 30, 30);
            charge(t);
        }

        @Override
        public boolean canContinueToUse() {
            return dashTicks > 0;
        }
    }
}
