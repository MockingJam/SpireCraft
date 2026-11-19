package com.mockingjam.spirecraft.weapon;

import java.util.List;
import java.util.function.Consumer;
import net.minecraft.ChatFormatting;
import net.minecraft.core.component.DataComponents;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.monster.Enemy;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;
import net.minecraft.world.item.component.CustomData;
import net.minecraft.world.item.component.TooltipDisplay;
import net.minecraft.world.level.Level;

/**
 * Dirge Flute (Necrobinder; Dirge, Capture Spirit, Haunt "whenever you play a Soul, a random enemy loses 7 HP").
 * Gathers a Soul (up to {@link #CAPACITY}) whenever a creature dies within {@link #GATHER_RANGE} blocks of its carrier.
 * Playing it (hold right-click for 2 s, flute at the mouth) releases every Soul: each strikes a random hostile mob nearby for {@link #SOUL_DAMAGE}.
 * Summoning Osty with Souls comes with the mobs in phase 8.
 */
public class DirgeFlute extends SpireWeapon {
    public static final int CAPACITY = 10;
    public static final double GATHER_RANGE = 8.0;
    public static final float SOUL_DAMAGE = 3.0F;
    public static final double RELEASE_RANGE = 10.0;
    public static final int COOLDOWN = 40;
    private static final String KEY = "spirecraft_souls";

    public DirgeFlute(Properties props) {
        super(props, Character.NECROBINDER);
    }

    public static int souls(ItemStack stack) {
        return stack.getOrDefault(DataComponents.CUSTOM_DATA, CustomData.EMPTY).copyTag().getIntOr(KEY, 0);
    }

    public static void setSouls(ItemStack stack, int value) {
        int clamped = Math.max(0, Math.min(CAPACITY, value));
        CustomData.update(DataComponents.CUSTOM_DATA, stack, (CompoundTag tag) -> tag.putInt(KEY, clamped));
    }

    /** Puts one Soul into the first carried flute with room. */
    public static boolean gather(Player player) {
        var inv = player.getInventory();
        for (int i = 0; i < inv.getContainerSize(); i++) {
            ItemStack stack = inv.getItem(i);
            if (stack.getItem() instanceof DirgeFlute && souls(stack) < CAPACITY) {
                setSouls(stack, souls(stack) + 1);
                return true;
            }
        }
        return false;
    }

    /** How long one tune lasts (the flute is held level at the mouth meanwhile; goat-horn pose). */
    public static final int PLAY_TICKS = 40;

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        ItemStack stack = player.getItemInHand(hand);
        if (souls(stack) == 0) return InteractionResult.FAIL;
        player.startUsingItem(hand);
        return InteractionResult.CONSUME;
    }

    @Override
    public net.minecraft.world.item.ItemUseAnimation getUseAnimation(ItemStack stack) {
        return net.minecraft.world.item.ItemUseAnimation.TOOT_HORN;
    }

    @Override
    public int getUseDuration(ItemStack stack, LivingEntity user) {
        return PLAY_TICKS;
    }

    /** While playing: a falling three-note phrase and notes drifting up from the flute. */
    @Override
    public void onUseTick(Level level, LivingEntity user, ItemStack stack, int left) {
        if (!(level instanceof ServerLevel server)) return;
        int played = PLAY_TICKS - left;
        if (played % 10 == 0) {
            float[] tune = {0.75F, 0.67F, 0.6F, 0.5F};
            level.playSound(null, user.blockPosition(), SoundEvents.NOTE_BLOCK_FLUTE.value(), SoundSource.PLAYERS, 0.9F, tune[(played / 10) % tune.length]);
            var look = user.getLookAngle();
            server.sendParticles(ParticleTypes.NOTE, user.getX() + look.x * 0.6, user.getEyeY() - 0.2, user.getZ() + look.z * 0.6, 1, 0.2, 0.1, 0.2, 0.5);
        }
    }

    @Override
    public ItemStack finishUsingItem(ItemStack stack, Level level, LivingEntity user) {
        if (level instanceof ServerLevel server && user instanceof Player player) {
            release(server, player, stack);
            player.getCooldowns().addCooldown(stack, COOLDOWN);
        }
        return stack;
    }

    /** Releases every Soul in the flute; returns the number of strikes that found a target. */
    public static int release(ServerLevel level, Player player, ItemStack flute) {
        int n = souls(flute), hits = 0;
        setSouls(flute, 0);
        List<LivingEntity> foes = level.getEntitiesOfClass(LivingEntity.class, player.getBoundingBox().inflate(RELEASE_RANGE), e -> e instanceof Enemy && e.isAlive());
        for (int i = 0; i < n && !foes.isEmpty(); i++) {
            LivingEntity target = foes.get(level.random.nextInt(foes.size()));
            target.invulnerableTime = 0;
            target.hurtServer(level, player.damageSources().indirectMagic(player, player), SOUL_DAMAGE);
            level.sendParticles(ParticleTypes.SOUL, target.getX(), target.getY() + target.getBbHeight() / 2, target.getZ(), 6, 0.2, 0.3, 0.2, 0.03);
            hits++;
            if (!target.isAlive()) foes.remove(target);
        }
        level.playSound(null, player.blockPosition(), SoundEvents.NOTE_BLOCK_FLUTE.value(), SoundSource.PLAYERS, 1.0F, 0.6F);
        level.playSound(null, player.blockPosition(), SoundEvents.SOUL_ESCAPE.value(), SoundSource.PLAYERS, 1.0F, 1.0F);
        return hits;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext context, TooltipDisplay display, Consumer<Component> tooltip, TooltipFlag flag) {
        super.appendHoverText(stack, context, display, tooltip, flag);
        tooltip.accept(Component.translatable("item.spirecraft.dirge_flute.souls", souls(stack), CAPACITY).withStyle(ChatFormatting.AQUA));
    }
}
