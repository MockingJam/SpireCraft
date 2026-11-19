package com.mockingjam.spirecraft.weapon;

import com.mockingjam.spirecraft.weapon.projectile.FlakPellet;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.entity.projectile.Projectile;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.Level;

/**
 * Flak Cannon (Defect; Barrage "5 damage for each Channeled Orb", Flak Cannon). Fires a spread of {@link #BASE_PELLETS}
 * iron pellets, plus one per channeled orb. Each shot uses one iron nugget (none in creative).
 */
public class FlakCannonItem extends SpireWeapon {
    public static final int BASE_PELLETS = 5;
    public static final int COOLDOWN = 30;

    public FlakCannonItem(Properties props) {
        super(props, Character.DEFECT);
    }

    public static int pellets(Player player) {
        return BASE_PELLETS + Orbs.count(player);
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        ItemStack stack = player.getItemInHand(hand);
        boolean creative = player.getAbilities().instabuild;
        int ammo = player.getInventory().findSlotMatchingItem(new ItemStack(com.mockingjam.spirecraft.registry.ModItems.FLAK_SHELL.get()));
        if (!creative && ammo < 0) {
            level.playSound(null, player.blockPosition(), SoundEvents.DISPENSER_FAIL, SoundSource.PLAYERS, 0.6F, 1.2F);
            return InteractionResult.FAIL;
        }
        if (level instanceof ServerLevel server) {
            fire(server, player);
            if (!creative) player.getInventory().getItem(ammo).shrink(1);
            player.getCooldowns().addCooldown(stack, COOLDOWN);
            stack.hurtAndBreak(1, player, hand);
        }
        return InteractionResult.SUCCESS;
    }

    /** Fires one volley; returns the number of pellets (used by the self-test). */
    public static int fire(ServerLevel level, Player player) {
        int n = pellets(player);
        for (int i = 0; i < n; i++) {
            Projectile.spawnProjectileFromRotation(FlakPellet::new, level, new ItemStack(Items.IRON_NUGGET), player, 0.0F, 2.2F, 9.0F);
        }
        level.playSound(null, player.blockPosition(), SoundEvents.CROSSBOW_SHOOT, SoundSource.PLAYERS, 1.0F, 0.7F);
        level.playSound(null, player.blockPosition(), SoundEvents.GENERIC_EXPLODE.value(), SoundSource.PLAYERS, 0.3F, 1.8F);
        return n;
    }
}
