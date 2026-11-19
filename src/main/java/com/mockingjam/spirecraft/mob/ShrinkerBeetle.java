package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.effect.ModEffects;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.damagesource.DamageSource;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.level.Level;

/**
 * Shrinker Beetle (Overgrowth; STS2: opens with Shrinker — your attacks deal 30% less until it dies — then Chomp 7 /
 * Stomp 13 alternately). Its Shrink is lifted from everyone it shrank when it dies.
 */
public class ShrinkerBeetle extends SpireMonster {
    public static final int SHRINK = 1, CHOMP = 2, STOMP = 3;
    public static final int SHRINK_TICKS = 600;
    public static final float CHOMP_DAMAGE = 3.0F, STOMP_DAMAGE = 5.0F;
    private int step;
    private final Set<UUID> shrunk = new HashSet<>();

    public ShrinkerBeetle(EntityType<? extends Monster> type, Level level) {
        super(type, level);
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, 18).add(Attributes.MOVEMENT_SPEED, 0.25)
                .add(Attributes.ATTACK_DAMAGE, STOMP_DAMAGE).add(Attributes.ARMOR, 4).add(Attributes.FOLLOW_RANGE, 20);
    }

    @Override
    protected Move nextMove() {
        int s = step++;
        return s == 0 ? shrinker() : s % 2 == 1 ? Move.of(CHOMP, 10, 6, 20, 2.4, (l, self, t) -> self.strike(l, t, CHOMP_DAMAGE, 2.4))
                : Move.of(STOMP, 16, 6, 25, 2.6, (l, self, t) -> self.strike(l, t, STOMP_DAMAGE, 2.6));
    }

    public Move shrinker() {
        return Move.of(SHRINK, 16, 6, 20, 8, (level, self, target) -> shrink(level, target));
    }

    public void shrink(ServerLevel level, LivingEntity target) {
        if (target == null) return;
        debuff(target, ModEffects.SHRINK, SHRINK_TICKS);
        shrunk.add(target.getUUID());
        level.sendParticles(ParticleTypes.ENCHANT, target.getX(), target.getY() + 1, target.getZ(), 30, 0.4, 0.6, 0.4, 0.5);
    }

    @Override
    public void die(DamageSource source) {
        super.die(source);
        if (level() instanceof ServerLevel level) {
            for (UUID id : shrunk) if (level.getEntity(id) instanceof LivingEntity e) e.removeEffect(ModEffects.holder(ModEffects.SHRINK));
        }
    }
}
