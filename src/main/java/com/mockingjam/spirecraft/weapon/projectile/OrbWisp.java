package com.mockingjam.spirecraft.weapon.projectile;

import com.mockingjam.spirecraft.registry.ModEntities;
import com.mockingjam.spirecraft.weapon.Orbs;
import net.minecraft.core.particles.DustParticleOptions;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.network.syncher.EntityDataAccessor;
import net.minecraft.network.syncher.EntityDataSerializers;
import net.minecraft.network.syncher.SynchedEntityData;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.entity.projectile.Projectile;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.storage.ValueInput;
import net.minecraft.world.level.storage.ValueOutput;
import net.minecraft.world.phys.Vec3;

/**
 * A Lightning orb's strike: a ball of yellow lightning that homes in on its target (up, down, round corners — it
 * passes through blocks) trailing sparks like a comet. Evoked ones are bigger and hit harder.
 * Drawn only with particles, client side (no model).
 */
public class OrbWisp extends Projectile {
    private static final EntityDataAccessor<Boolean> BIG = SynchedEntityData.defineId(OrbWisp.class, EntityDataSerializers.BOOLEAN);
    public static final int LIFETIME = 60;
    public static final double SPEED = 0.7;
    private int targetId = -1;
    private float damage;

    public OrbWisp(EntityType<? extends OrbWisp> type, Level level) {
        super(type, level);
        noPhysics = true;
    }

    public static OrbWisp launch(ServerLevel level, Player owner, Vec3 from, LivingEntity target, float damage, boolean big) {
        OrbWisp wisp = new OrbWisp(ModEntities.ORB_WISP.get(), level);
        wisp.setOwner(owner);
        wisp.setPos(from);
        wisp.targetId = target.getId();
        wisp.damage = damage;
        wisp.entityData.set(BIG, big);
        Vec3 dir = target.position().add(0, target.getBbHeight() / 2, 0).subtract(from).normalize();
        wisp.setDeltaMovement(dir.add(0, 0.4, 0).normalize().scale(SPEED * 0.6));   // a little hop out of the orbit first
        level.addFreshEntity(wisp);
        level.playSound(null, from.x, from.y, from.z, SoundEvents.TRIDENT_THUNDER.value(), SoundSource.PLAYERS, big ? 0.35F : 0.15F, 2.0F);
        return wisp;
    }

    @Override
    protected void defineSynchedData(SynchedEntityData.Builder builder) {
        builder.define(BIG, false);
    }

    public boolean isBig() {
        return entityData.get(BIG);
    }

    @Override
    public void tick() {
        super.tick();
        if (level().isClientSide()) {
            trail();
        } else {
            Entity target = level().getEntity(targetId);
            if (!(target instanceof LivingEntity living) || !living.isAlive() || tickCount > LIFETIME) {
                discard();
                return;
            }
            Vec3 aim = living.position().add(0, living.getBbHeight() / 2, 0);
            Vec3 to = aim.subtract(position());
            double dist = to.length();
            double speed = Math.min(SPEED + tickCount * 0.02, 1.2);
            // steer: keep most of the old heading early on so it curves in like a comet
            Vec3 v = getDeltaMovement().scale(0.55).add(to.normalize().scale(speed * 0.45));
            setDeltaMovement(v.normalize().scale(speed));
            if (dist <= Math.max(0.6, speed) + living.getBbWidth() / 2) {
                hit((ServerLevel) level(), living);
                return;
            }
        }
        Vec3 v = getDeltaMovement();
        setPos(getX() + v.x, getY() + v.y, getZ() + v.z);
    }

    private void hit(ServerLevel level, LivingEntity target) {
        Entity owner = getOwner();
        target.invulnerableTime = 0;
        target.hurtServer(level, owner instanceof Player p ? damageSources().indirectMagic(this, p) : damageSources().magic(), damage);
        level.sendParticles(ParticleTypes.ELECTRIC_SPARK, target.getX(), target.getY() + target.getBbHeight() / 2, target.getZ(),
                isBig() ? 30 : 12, 0.3, 0.4, 0.3, 0.25);
        level.sendParticles(new DustParticleOptions(Orbs.COLORS[0], 1.4F), target.getX(), target.getY() + target.getBbHeight() / 2, target.getZ(),
                isBig() ? 14 : 6, 0.25, 0.3, 0.25, 0);
        level.playSound(null, target.blockPosition(), SoundEvents.LIGHTNING_BOLT_IMPACT, SoundSource.PLAYERS, isBig() ? 0.6F : 0.3F, 1.8F);
        discard();
    }

    /** Client: the yellow core and a fading tail of sparks behind it. */
    private void trail() {
        float size = isBig() ? 1.6F : 1.0F;
        Vec3 v = getDeltaMovement();
        level().addParticle(new DustParticleOptions(Orbs.COLORS[0], size), getX(), getY(), getZ(), 0, 0, 0);
        level().addParticle(new DustParticleOptions(0xFFFBE0, size * 0.6F), getX(), getY(), getZ(), 0, 0, 0);
        for (int i = 1; i <= 4; i++) {
            double k = i * 0.22;
            level().addParticle(new DustParticleOptions(i < 3 ? Orbs.COLORS[0] : 0xC9A040, size * (1 - i * 0.18F)),
                    getX() - v.x * k + (random.nextDouble() - 0.5) * 0.08, getY() - v.y * k + (random.nextDouble() - 0.5) * 0.08,
                    getZ() - v.z * k + (random.nextDouble() - 0.5) * 0.08, 0, 0, 0);
        }
        if (random.nextInt(2) == 0) level().addParticle(ParticleTypes.ELECTRIC_SPARK, getX(), getY(), getZ(),
                (random.nextDouble() - 0.5) * 0.2, (random.nextDouble() - 0.5) * 0.2, (random.nextDouble() - 0.5) * 0.2);
    }

    @Override
    protected void readAdditionalSaveData(ValueInput in) {
        discard();   // never persists
    }

    @Override
    protected void addAdditionalSaveData(ValueOutput out) {
    }

    @Override
    public boolean shouldBeSaved() {
        return false;
    }
}
