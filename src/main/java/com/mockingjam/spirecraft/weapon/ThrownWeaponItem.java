package com.mockingjam.spirecraft.weapon;

import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvent;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.entity.projectile.Projectile;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;

/** A stackable throwable (Shiv, Poison Flask): right-click throws one. */
public class ThrownWeaponItem extends SpireWeapon {
    private final Projectile.ProjectileFactory<? extends Projectile> factory;
    private final float velocity;
    private final int cooldown;
    private final SoundEvent sound;

    public ThrownWeaponItem(Properties props, Character character, Projectile.ProjectileFactory<? extends Projectile> factory,
            float velocity, int cooldown, SoundEvent sound) {
        super(props, character);
        this.factory = factory;
        this.velocity = velocity;
        this.cooldown = cooldown;
        this.sound = sound;
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        ItemStack stack = player.getItemInHand(hand);
        if (level instanceof ServerLevel server) {
            Projectile.spawnProjectileFromRotation(factory, server, stack.copyWithCount(1), player, 0.0F, velocity, 1.0F);
            level.playSound(null, player.blockPosition(), sound, SoundSource.PLAYERS, 0.6F, 1.2F);
            player.getCooldowns().addCooldown(stack, cooldown);
            stack.consume(1, player);
        }
        return InteractionResult.SUCCESS;
    }
}
