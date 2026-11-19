package com.mockingjam.spirecraft.weapon;

import com.mockingjam.spirecraft.weapon.projectile.SpireBolt;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.entity.projectile.Projectile;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.ItemUseAnimation;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.Level;

/**
 * Precise Slingshot (Silent; Pinpoint "deal 15 damage"). Hold to draw (full in {@link #FULL_DRAW} ticks, faster than a
 * bow's 20), release to shoot: up to {@link #DAMAGE} damage, ×1.5 against Weak targets. Ammo (v2.2), off hand first:
 * pebbles; fire charges (burn); snowballs (slow, half damage, ×3 on blazes); slime balls (knock back, slow); iron
 * nuggets (+1/3 damage). Not used up in creative.
 */
public class Slingshot extends SpireWeapon {
    public static final int FULL_DRAW = 14;
    public static final float DAMAGE = 6.0F;
    public static final float VELOCITY = 2.2F;

    public Slingshot(Properties props) {
        super(props, Character.SILENT);
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        if (!player.isCreative() && findAmmo(player).isEmpty()) return InteractionResult.FAIL;
        player.startUsingItem(hand);
        return InteractionResult.CONSUME;
    }

    @Override
    public ItemUseAnimation getUseAnimation(ItemStack stack) {
        return ItemUseAnimation.BOW;
    }

    @Override
    public int getUseDuration(ItemStack stack, LivingEntity user) {
        return 72000;
    }

    @Override
    public boolean releaseUsing(ItemStack stack, Level level, LivingEntity user, int timeLeft) {
        float draw = Math.min(1.0F, (getUseDuration(stack, user) - timeLeft) / (float) FULL_DRAW);
        if (draw < 0.2F || !(level instanceof ServerLevel server) || !(user instanceof Player player)) return false;
        ItemStack ammo = findAmmo(player);
        if (ammo.isEmpty() && !player.isCreative()) return false;
        shoot(server, player, draw, ammo.isEmpty() ? new ItemStack(com.mockingjam.spirecraft.registry.ModItems.PEBBLE.get()) : ammo);
        if (!player.isCreative()) ammo.shrink(1);
        stack.hurtAndBreak(1, player, user.getUsedItemHand());
        return true;
    }

    /** Fires one stone at the given draw (0..1); returns it. Used by the self-test too. */
    public static SpireBolt shoot(ServerLevel level, Player player, float draw) {
        return shoot(level, player, draw, new ItemStack(com.mockingjam.spirecraft.registry.ModItems.PEBBLE.get()));
    }

    /** Fires one piece of the given ammo. */
    public static SpireBolt shoot(ServerLevel level, Player player, float draw, ItemStack ammo) {
        SpireBolt.Kind kind = kind(ammo);
        ItemStack look = ammo.copyWithCount(1);
        SpireBolt bolt = Projectile.spawnProjectileFromRotation((l, o, s) -> new SpireBolt(l, o, s, kind, DAMAGE * draw),
                level, look, player, 0.0F, VELOCITY * draw, 0.5F);
        level.playSound(null, player.blockPosition(), SoundEvents.ARROW_SHOOT, SoundSource.PLAYERS, 0.8F, 1.6F);
        return bolt;
    }

    /** Which shot an ammo item makes (null = not slingshot ammo). */
    public static SpireBolt.Kind kind(ItemStack stack) {
        if (stack.is(com.mockingjam.spirecraft.registry.ModItems.PEBBLE.get())) return SpireBolt.Kind.PEBBLE;
        if (stack.is(Items.FIRE_CHARGE)) return SpireBolt.Kind.FIRE;
        if (stack.is(Items.SNOWBALL)) return SpireBolt.Kind.SNOW;
        if (stack.is(Items.SLIME_BALL)) return SpireBolt.Kind.SLIME;
        if (stack.is(Items.IRON_NUGGET)) return SpireBolt.Kind.IRON;
        return null;
    }

    /** Off hand first (like a bow's arrows), then the inventory in slot order. */
    public static ItemStack findAmmo(Player player) {
        if (kind(player.getOffhandItem()) != null) return player.getOffhandItem();
        var inv = player.getInventory();
        for (int i = 0; i < inv.getContainerSize(); i++) {
            ItemStack s = inv.getItem(i);
            if (kind(s) != null) return s;
        }
        return ItemStack.EMPTY;
    }
}
