package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mockingjam.spirecraft.weapon.projectile.SpireBolt;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;

/**
 * Flyconid (Overgrowth / Fog Hollow; STS2: Weakening Spores 2 Vulnerable, Frail Spores 8 + 2 Frail, Smash 11; random,
 * never the same twice, opens with Frail Spores (2/3) or Smash (1/3)). A drifting mushroom: a Vulnerable spore cloud,
 * a Frail spore shot, a close smash.
 */
public class Flyconid extends SpireMonster {
    public static final int SPORES = 1, FRAIL_SPORE = 2, SMASH = 3;
    public static final double CLOUD_RADIUS = 4.0;
    public static final int CLOUD_VULNERABLE = 120;
    public static final float SPORE_DAMAGE = 3.0F, SMASH_DAMAGE = 5.0F;
    private int last;

    public Flyconid(EntityType<? extends Monster> type, Level level) {
        super(type, level);
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, 22).add(Attributes.MOVEMENT_SPEED, 0.2)
                .add(Attributes.ATTACK_DAMAGE, SMASH_DAMAGE).add(Attributes.FOLLOW_RANGE, 20);
    }

    @Override
    public boolean causeFallDamage(double distance, float multiplier, net.minecraft.world.damagesource.DamageSource source) {
        return false;   // it drifts
    }

    @Override
    protected Move nextMove() {
        int pick;
        do {
            float r = getRandom().nextFloat();
            pick = last == 0 ? (r < 2 / 3F ? FRAIL_SPORE : SMASH) : (r < 0.5F ? SPORES : r < 5 / 6F ? FRAIL_SPORE : SMASH);
        } while (pick == last);
        last = pick;
        return move(pick);
    }

    public static Move move(int id) {
        return switch (id) {
            case SPORES -> Move.of(SPORES, 20, 10, 30, CLOUD_RADIUS, (level, self, target) -> {
                level.sendParticles(ParticleTypes.SPORE_BLOSSOM_AIR, self.getX(), self.getY() + 1.5, self.getZ(), 60, CLOUD_RADIUS / 2, 1, CLOUD_RADIUS / 2, 0);
                for (Player p : level.getEntitiesOfClass(Player.class, self.getBoundingBox().inflate(CLOUD_RADIUS))) self.debuff(p, ModEffects.VULNERABLE, CLOUD_VULNERABLE);
            });
            case FRAIL_SPORE -> Move.of(FRAIL_SPORE, 14, 6, 30, 10, (level, self, target) ->
                    self.shoot(level, target, new ItemStack(ModBlocks.FOGCAP.get()), SpireBolt.Kind.SPORE, SPORE_DAMAGE, 1.0F));
            default -> Move.of(SMASH, 12, 6, 25, 2.5, (level, self, target) -> self.strike(level, target, SMASH_DAMAGE, 2.5));
        };
    }
}
