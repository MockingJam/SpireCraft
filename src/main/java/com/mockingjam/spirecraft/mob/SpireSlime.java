package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.effect.ModEffects;
import net.minecraft.network.syncher.EntityDataAccessor;
import net.minecraft.network.syncher.EntityDataSerializers;
import net.minecraft.network.syncher.SynchedEntityData;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.damagesource.DamageSource;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.EntityDimensions;
import net.minecraft.world.entity.EntitySpawnReason;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.Pose;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.storage.ValueInput;
import net.minecraft.world.level.storage.ValueOutput;
import net.minecraft.world.phys.Vec3;

/**
 * Leaf Slime and Twig Slime (Overgrowth). Big ones split into two small ones when they die (like vanilla slimes).
 * Tackle: hop at the target; a leaf slime's goop slows (STS2 "Slimed"), a twig slime's thorns weaken.
 */
public class SpireSlime extends SpireMonster {
    private static final EntityDataAccessor<Boolean> SMALL = SynchedEntityData.defineId(SpireSlime.class, EntityDataSerializers.BOOLEAN);
    public static final int TACKLE = 1;
    public static final float BIG_DAMAGE = 3.0F, SMALL_DAMAGE = 1.5F;
    public static final float BIG_HEALTH = 16.0F, SMALL_HEALTH = 6.0F;

    private final boolean leaf;

    public SpireSlime(EntityType<? extends Monster> type, Level level, boolean leaf) {
        super(type, level);
        this.leaf = leaf;
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, BIG_HEALTH).add(Attributes.MOVEMENT_SPEED, 0.25)
                .add(Attributes.ATTACK_DAMAGE, BIG_DAMAGE).add(Attributes.FOLLOW_RANGE, 16);
    }

    public boolean isLeaf() {
        return leaf;
    }

    public boolean isSmall() {
        return entityData.get(SMALL);
    }

    public void setSmall(boolean small) {
        entityData.set(SMALL, small);
        getAttribute(Attributes.MAX_HEALTH).setBaseValue(small ? SMALL_HEALTH : BIG_HEALTH);
        setHealth(getMaxHealth());
        refreshDimensions();
    }

    @Override
    protected void defineSynchedData(SynchedEntityData.Builder builder) {
        super.defineSynchedData(builder);
        builder.define(SMALL, false);
    }

    @Override
    public void onSyncedDataUpdated(EntityDataAccessor<?> key) {
        super.onSyncedDataUpdated(key);
        if (SMALL.equals(key)) refreshDimensions();
    }

    @Override
    public EntityDimensions getDefaultDimensions(Pose pose) {
        return super.getDefaultDimensions(pose).scale(isSmall() ? 0.5F : 1.0F);
    }

    @Override
    protected void addAdditionalSaveData(ValueOutput out) {
        super.addAdditionalSaveData(out);
        out.putBoolean("Small", isSmall());
    }

    @Override
    protected void readAdditionalSaveData(ValueInput in) {
        super.readAdditionalSaveData(in);
        entityData.set(SMALL, in.getBooleanOr("Small", false));
        refreshDimensions();
    }

    @Override
    protected Move nextMove() {
        return Move.of(TACKLE, 10, 8, 20, 2.4, (level, self, target) -> {
            if (target == null) return;
            Vec3 to = target.position().subtract(position()).normalize();
            setDeltaMovement(to.x * 0.5, 0.35, to.z * 0.5);
            if (strike(level, target, isSmall() ? SMALL_DAMAGE : BIG_DAMAGE, 2.0)) {
                if (leaf) target.addEffect(new MobEffectInstance(MobEffects.SLOWNESS, 60, 1), this);
                else debuff(target, ModEffects.WEAK, 60);
            }
        });
    }

    @Override
    public void die(DamageSource source) {
        super.die(source);
        if (!isSmall() && level() instanceof ServerLevel level) split(level);
    }

    /** Two small slimes of the same kind (also used by the self-test). */
    public void split(ServerLevel level) {
        for (int i = 0; i < 2; i++) {
            @SuppressWarnings("unchecked")
            SpireSlime child = ((EntityType<SpireSlime>) getType()).create(level, EntitySpawnReason.TRIGGERED);
            if (child == null) continue;
            child.setSmall(true);
            child.snapTo(getX() + (i == 0 ? -0.3 : 0.3), getY() + 0.3, getZ(), getYRot(), 0);
            child.setTarget(getTarget());
            level.addFreshEntity(child);
        }
    }
}
