package com.mockingjam.spirecraft.mob;

import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.AgeableMob;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.TamableAnimal;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.ai.goal.FloatGoal;
import net.minecraft.world.entity.ai.goal.FollowOwnerGoal;
import net.minecraft.world.entity.ai.goal.LookAtPlayerGoal;
import net.minecraft.world.entity.ai.goal.MeleeAttackGoal;
import net.minecraft.world.entity.ai.goal.RandomLookAroundGoal;
import net.minecraft.world.entity.ai.goal.target.HurtByTargetGoal;
import net.minecraft.world.entity.ai.goal.target.OwnerHurtByTargetGoal;
import net.minecraft.world.entity.ai.goal.target.OwnerHurtTargetGoal;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;
import org.jetbrains.annotations.Nullable;

/**
 * Osty, the Necrobinder's animated bone hand (STS2: a summon with its own HP that takes the attacks aimed at her —
 * "Die for You"). Summoned and fed by the Forbidden Grimoire: each Soul adds {@link #HP_PER_SOUL} max health (up to
 * {@link #MAX_HP}). Follows its owner like a tamed wolf and attacks what the owner fights. The damage transfer lives in
 * WeaponEvents.
 */
public class Osty extends TamableAnimal {
    public static final float START_HP = 12, HP_PER_SOUL = 4, MAX_HP = 40, ATTACK = 4;
    public static final double GUARD_RANGE = 8;

    public Osty(EntityType<? extends TamableAnimal> type, Level level) {
        super(type, level);
    }

    public static AttributeSupplier.Builder attributes() {
        return TamableAnimal.createMobAttributes().add(Attributes.MAX_HEALTH, START_HP).add(Attributes.MOVEMENT_SPEED, 0.32)
                .add(Attributes.ATTACK_DAMAGE, ATTACK).add(Attributes.FOLLOW_RANGE, 24);
    }

    @Override
    protected void registerGoals() {
        goalSelector.addGoal(1, new FloatGoal(this));
        goalSelector.addGoal(4, new MeleeAttackGoal(this, 1.2, true));
        goalSelector.addGoal(6, new FollowOwnerGoal(this, 1.1, 6.0F, 2.0F));
        goalSelector.addGoal(9, new LookAtPlayerGoal(this, Player.class, 8.0F));
        goalSelector.addGoal(10, new RandomLookAroundGoal(this));
        targetSelector.addGoal(1, new OwnerHurtByTargetGoal(this));
        targetSelector.addGoal(2, new OwnerHurtTargetGoal(this));
        targetSelector.addGoal(3, new HurtByTargetGoal(this));
    }

    /** "Summon X": more max health (capped), healing by the same amount. Returns the health actually added. */
    public float summon(float hp) {
        var attr = getAttribute(Attributes.MAX_HEALTH);
        float before = (float) attr.getBaseValue();
        float after = Math.min(MAX_HP, before + hp);
        attr.setBaseValue(after);
        heal(after - before + hp);
        return after - before;
    }

    /** The owner's Osty within range, if any. */
    @Nullable
    public static Osty of(ServerLevel level, Player owner, double range) {
        for (Osty o : level.getEntitiesOfClass(Osty.class, owner.getBoundingBox().inflate(range), o -> o.isAlive() && o.isOwnedBy(owner))) return o;
        return null;
    }

    @Override
    public boolean isFood(ItemStack stack) {
        return false;
    }

    @Nullable
    @Override
    public AgeableMob getBreedOffspring(ServerLevel level, AgeableMob other) {
        return null;
    }

    @Override
    public boolean canMate(net.minecraft.world.entity.animal.Animal other) {
        return false;
    }

    @Override
    public boolean wantsToAttack(LivingEntity target, LivingEntity owner) {
        return !(target instanceof Osty o && o.getOwner() == owner) && target != owner;
    }

    /** v5 (user): a burning blue soul flame above the wrist, as particles instead of a model. */
    @Override
    public void aiStep() {
        super.aiStep();
        if (level().isClientSide() && random.nextInt(2) == 0) {
            double yaw = Math.toRadians(yBodyRot), bx = Math.sin(yaw) * 0.05, bz = -Math.cos(yaw) * 0.05;
            level().addParticle(net.minecraft.core.particles.ParticleTypes.SOUL_FIRE_FLAME, getX() + bx + (random.nextDouble() - 0.5) * 0.15,
                    getY() + (isInSittingPose() ? 0.85 : 1.05), getZ() + bz + (random.nextDouble() - 0.5) * 0.15, 0, 0.02, 0);
        }
    }
}
