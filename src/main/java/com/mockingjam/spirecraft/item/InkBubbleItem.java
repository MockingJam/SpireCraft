package com.mockingjam.spirecraft.item;

import com.mockingjam.spirecraft.weapon.projectile.SpireBolt;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.entity.projectile.Projectile;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;

/** Ink Bubble: thrown like a snowball; it bursts on whatever it hits (Blindness + Weak, 1 damage). */
public class InkBubbleItem extends Item {
    public static final float DAMAGE = 1.0F;

    public InkBubbleItem(Properties props) {
        super(props);
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        ItemStack stack = player.getItemInHand(hand);
        level.playSound(null, player.getX(), player.getY(), player.getZ(), SoundEvents.SNOWBALL_THROW, SoundSource.NEUTRAL, 0.5F, 0.6F);
        if (level instanceof ServerLevel server) {
            Projectile.spawnProjectileFromRotation((l, o, s) -> new SpireBolt(l, o, s, SpireBolt.Kind.INK, DAMAGE), server,
                    stack.copyWithCount(1), player, 0.0F, 1.5F, 1.0F);
        }
        stack.consume(1, player);
        return InteractionResult.SUCCESS;
    }
}
