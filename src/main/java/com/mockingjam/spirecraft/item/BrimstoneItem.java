package com.mockingjam.spirecraft.item;

import com.mockingjam.spirecraft.effect.ModEffects;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.monster.Enemy;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.Level;

/**
 * Brimstone (Ironclad's shop relic: "gain 2 Strength, ALL enemies gain 1 Strength").
 * Right-click to ignite one: the user gets 2 Strength stacks, every hostile mob within {@link #RADIUS} blocks gets 1.
 */
public class BrimstoneItem extends Item {
    public static final int DURATION = 600;   // 30 s
    public static final int COOLDOWN = 400;   // 20 s
    public static final double RADIUS = 16.0;

    public BrimstoneItem(Properties props) {
        super(props);
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        var stack = player.getItemInHand(hand);
        if (level instanceof ServerLevel server) {
            ignite(server, player);
            stack.consume(1, player);
            player.getCooldowns().addCooldown(stack, COOLDOWN);
        }
        return InteractionResult.SUCCESS;
    }

    /** The relic effect itself; also used by the self-test. Returns how many enemies were empowered. */
    public static int ignite(ServerLevel level, LivingEntity user) {
        var strength = ModEffects.holder(ModEffects.STRENGTH);
        user.addEffect(new MobEffectInstance(strength, DURATION, 1));
        var enemies = level.getEntitiesOfClass(LivingEntity.class, user.getBoundingBox().inflate(RADIUS),
                e -> e instanceof Enemy && e.isAlive() && e != user);
        for (LivingEntity enemy : enemies) {
            enemy.addEffect(new MobEffectInstance(strength, DURATION, 0), user);
        }
        level.sendParticles(ParticleTypes.LARGE_SMOKE, user.getX(), user.getY() + 1.0, user.getZ(), 20, 0.4, 0.4, 0.4, 0.02);
        level.sendParticles(ParticleTypes.FLAME, user.getX(), user.getY() + 1.0, user.getZ(), 12, 0.3, 0.3, 0.3, 0.02);
        level.playSound(null, user.blockPosition(), SoundEvents.FIRECHARGE_USE, SoundSource.PLAYERS, 1.0F, 0.8F);
        return enemies.size();
    }
}
