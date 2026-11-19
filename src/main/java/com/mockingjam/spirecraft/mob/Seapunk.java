package com.mockingjam.spirecraft.mob;

import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.level.Level;

/**
 * Seapunk (Underdocks; STS2: Sea Kick 11 → Spinning Kick 2×4 → Bubble Burp +7 Block +1 Strength, a fixed cycle). A
 * mound of kelp with a gaping mouth and a crest of leaf-tipped stalks; a sea creature (user) that fights in the water:
 * a kick, a spin that lashes all around it, then a bubble burp (Absorption and Strength).
 */
public class Seapunk extends SeaMonster {
    public static final int KICK = 1, SPIN = 2, BURP = 3;
    public static final float KICK_DAMAGE = 4.5F, SPIN_DAMAGE = 0.8F, BURP_ABSORPTION = 3.0F;
    public static final double SPIN_RADIUS = 2.5;
    private int step;

    public Seapunk(EntityType<? extends Monster> type, Level level) {
        super(type, level);
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, 20).add(Attributes.MOVEMENT_SPEED, 1.0)
                .add(Attributes.ATTACK_DAMAGE, KICK_DAMAGE).add(Attributes.FOLLOW_RANGE, 20);
    }

    @Override
    protected Move nextMove() {
        int id = switch (step++ % 3) { case 0 -> KICK; case 1 -> SPIN; default -> BURP; };
        return move(id);
    }

    public static Move move(int id) {
        return switch (id) {
            case KICK -> Move.of(KICK, 14, 6, 25, 2.5, (level, self, target) -> {
                if (self.strike(level, target, KICK_DAMAGE, 2.5)) target.knockback(0.8, self.getX() - target.getX(), self.getZ() - target.getZ());
            });
            case SPIN -> new Move(SPIN, 12, 16, 25, SPIN_RADIUS, new int[] {0, 4, 8, 12}, (level, self, target) -> {
                level.sendParticles(ParticleTypes.BUBBLE, self.getX(), self.getY() + 0.6, self.getZ(), 10, SPIN_RADIUS / 2, 0.3, SPIN_RADIUS / 2, 0.05);
                for (LivingEntity e : level.getEntitiesOfClass(LivingEntity.class, self.getBoundingBox().inflate(SPIN_RADIUS),
                        e -> e != self && !(e instanceof SpireMonster))) {
                    e.hurtServer(level, self.damageSources().mobAttack(self), SPIN_DAMAGE);
                }
            });
            default -> Move.of(BURP, 12, 10, 20, 64, (level, self, target) -> {
                level.sendParticles(ParticleTypes.BUBBLE_POP, self.getX(), self.getY() + 1, self.getZ(), 20, 0.4, 0.4, 0.4, 0.05);
                self.setAbsorptionAmount(self.getAbsorptionAmount() + BURP_ABSORPTION);
                self.addStrength(1, 20 * 30);
            });
        };
    }
}
