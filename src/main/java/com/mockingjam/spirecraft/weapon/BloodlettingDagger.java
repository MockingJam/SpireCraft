package com.mockingjam.spirecraft.weapon;

import com.mockingjam.spirecraft.effect.ModEffects;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.level.Level;

/**
 * Bloodletting Dagger (Ironclad; Bloodletting "lose 3 HP, gain energy", Rupture "losing HP gives Strength").
 * Right-click: lose 3 HP, gain Haste I and +1 Strength for 15 s. Not usable at 3 HP or less.
 */
public class BloodlettingDagger extends SpireWeapon {
    public static final float HP_COST = 3.0F;
    public static final int DURATION = 300;
    public static final int COOLDOWN = 200;

    public BloodlettingDagger(Properties props) {
        super(props, Character.IRONCLAD);
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        if (player.getHealth() <= HP_COST) return InteractionResult.FAIL;
        if (level instanceof ServerLevel server) {
            bleed(server, player);
            player.getCooldowns().addCooldown(player.getItemInHand(hand), COOLDOWN);
        }
        return InteractionResult.SUCCESS;
    }

    /** The ability itself; also used by the self-test. */
    public static void bleed(ServerLevel level, Player player) {
        player.invulnerableTime = 0;
        player.hurtServer(level, player.damageSources().magic(), HP_COST);
        player.addEffect(new MobEffectInstance(MobEffects.HASTE, DURATION, 0));
        ModEffects.addStacks(player, ModEffects.STRENGTH, 1, DURATION, 99);
        level.sendParticles(ParticleTypes.DAMAGE_INDICATOR, player.getX(), player.getY() + 1.0, player.getZ(), 6, 0.3, 0.3, 0.3, 0.1);
        level.playSound(null, player.blockPosition(), SoundEvents.PLAYER_HURT_SWEET_BERRY_BUSH, SoundSource.PLAYERS, 1.0F, 0.8F);
    }
}
