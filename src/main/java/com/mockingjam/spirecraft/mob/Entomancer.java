package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.weapon.projectile.SpireBolt;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.damagesource.DamageSource;
import net.minecraft.world.entity.EntitySpawnReason;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.animal.Bee;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.storage.ValueInput;
import net.minecraft.world.level.storage.ValueOutput;
import net.minecraft.world.phys.Vec3;

/**
 * Entomancer, elite (Hive; STS2: Beeeees! 3x7 -> Spear! 18 -> Pheromone Spit (+1 Personal Hive, +1 Strength; +2
 * Strength once the hive is at 3), repeating; Personal Hive: each Attack hit on it adds Dazed). A figure in a spotted
 * yellow hive-cloak with a sun-headed spear: a volley of stings, a long spear thrust, pheromones; every melee hit on
 * it lets loose an angry (vanilla) bee at the attacker, up to two bees per hive stack.
 */
public class Entomancer extends SpireMonster {
    public static final int BEES = 1, SPEAR = 2, PHEROMONE = 3;
    public static final float STING_DAMAGE = 1, SPEAR_DAMAGE = 7;
    public static final int MAX_HIVE = 3, STINGS = 7;
    public static final double SPEAR_REACH = 3.5, BEE_RANGE = 16;
    private int step, hive = 1;

    public Entomancer(EntityType<? extends Monster> type, Level level) {
        super(type, level);
        xpReward = 30;
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, 65).add(Attributes.MOVEMENT_SPEED, 0.26)
                .add(Attributes.ATTACK_DAMAGE, SPEAR_DAMAGE).add(Attributes.ARMOR, 4).add(Attributes.FOLLOW_RANGE, 24);
    }

    public int hive() {
        return hive;
    }

    @Override
    protected Move nextMove() {
        int pick = 1 + step;
        step = (step + 1) % 3;
        return move(pick);
    }

    public static Move move(int id) {
        return switch (id) {
            case BEES -> {
                int[] hits = new int[STINGS];
                for (int i = 0; i < STINGS; i++) hits[i] = i * 3;
                yield new Move(BEES, 20, STINGS * 3, 20, 12, hits, (level, self, target) -> {
                    if (target != null) target.invulnerableTime = 0;
                    if (self.hitIndex() == 0) level.playSound(null, self.blockPosition(), SoundEvents.BEEHIVE_EXIT, SoundSource.HOSTILE, 1.5F, 0.8F);
                    self.shoot(level, target, new ItemStack(Items.HONEYCOMB), SpireBolt.Kind.STING, STING_DAMAGE, 1.4F);
                });
            }
            case SPEAR -> Move.of(SPEAR, 18, 8, 20, SPEAR_REACH, (level, self, target) -> {
                if (target == null) return;
                Vec3 to = target.position().subtract(self.position()).multiply(1, 0, 1).normalize();
                self.setDeltaMovement(to.x * 0.5, 0.05, to.z * 0.5);
                self.strike(level, target, SPEAR_DAMAGE, SPEAR_REACH);
            });
            default -> Move.of(PHEROMONE, 20, 10, 15, 64, (level, self, target) -> {
                Entomancer e = (Entomancer) self;
                level.playSound(null, self.blockPosition(), SoundEvents.BEEHIVE_WORK, SoundSource.HOSTILE, 1.5F, 0.7F);
                level.sendParticles(ParticleTypes.FALLING_NECTAR, self.getX(), self.getY() + 1.8, self.getZ(), 16, 0.4, 0.3, 0.4, 0);
                self.addStrength(e.hive >= MAX_HIVE ? 2 : 1, 20 * 60 * 10);
                e.hive = Math.min(MAX_HIVE, e.hive + 1);
            });
        };
    }

    /** Personal Hive: a melee hit shakes loose an angry bee that goes for the attacker. */
    @Override
    public boolean hurtServer(ServerLevel level, DamageSource source, float amount) {
        boolean hurt = super.hurtServer(level, source, amount);
        if (hurt && source.getEntity() instanceof LivingEntity attacker && source.getDirectEntity() == attacker && attacker != this) releaseBee(level, attacker);
        return hurt;
    }

    /** Releases one bee at the target if the hive allows another (two per stack nearby); returns it or null. */
    public Bee releaseBee(ServerLevel level, LivingEntity target) {
        if (level.getEntitiesOfClass(Bee.class, getBoundingBox().inflate(BEE_RANGE), Bee::isAngry).size() >= 2 * hive) return null;
        Bee bee = EntityType.BEE.create(level, EntitySpawnReason.MOB_SUMMONED);
        if (bee == null) return null;
        bee.snapTo(getX(), getY() + 1.6, getZ(), getYRot(), 0);
        bee.setPersistentAngerTarget(target.getUUID());
        bee.startPersistentAngerTimer();
        bee.setTarget(target);
        level.addFreshEntity(bee);
        level.playSound(null, blockPosition(), SoundEvents.BEE_LOOP_AGGRESSIVE, SoundSource.HOSTILE, 1.0F, 1.0F);
        return bee;
    }

    @Override
    protected void addAdditionalSaveData(ValueOutput out) {
        super.addAdditionalSaveData(out);
        out.putInt("Hive", hive);
        out.putInt("Step", step);
    }

    @Override
    protected void readAdditionalSaveData(ValueInput in) {
        super.readAdditionalSaveData(in);
        hive = in.getIntOr("Hive", 1);
        step = in.getIntOr("Step", 0);
    }
}
