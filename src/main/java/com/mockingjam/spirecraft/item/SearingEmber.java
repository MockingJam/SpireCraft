package com.mockingjam.spirecraft.item;

import com.mockingjam.spirecraft.registry.ModItems;
import java.util.function.Consumer;
import net.minecraft.ChatFormatting;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.item.ItemEntity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;
import net.minecraft.world.item.component.TooltipDisplay;

/**
 * Searing Ember (灼热余烬, Glory: the Mecha Knight's and the Test Subject's Burn cards): pushed into the player's
 * inventory by a flame attack. Carried, it burns for {@link #BURN} every {@link #PERIOD} ticks ("take damage at the end
 * of your turn while it is in your hand"); it cools down by itself after {@link #LIFE} ticks. Thrown away it fizzles out
 * on the ground a few seconds later - the cost is the moment it takes to get rid of it.
 */
public class SearingEmber extends Item {
    public static final int PERIOD = 100, LIFE = 20 * 30, FIZZLE = 60;
    public static final float BURN = 1.0F;

    public SearingEmber(Properties props) {
        super(props);
    }

    /** Puts {@code count} embers into the player's inventory (dropped at their feet when it is full). */
    public static void give(Player player, int count) {
        if (player.getAbilities().instabuild) return;
        for (int i = 0; i < count; i++) {
            ItemStack ember = new ItemStack(ModItems.SEARING_EMBER.get());
            if (!player.getInventory().add(ember)) player.drop(ember, false);
        }
        player.level().playSound(null, player.blockPosition(), SoundEvents.FIRECHARGE_USE, SoundSource.HOSTILE, 0.8F, 1.4F);
    }

    @Override
    public void inventoryTick(ItemStack stack, ServerLevel level, Entity entity, EquipmentSlot slot) {
        if (!(entity instanceof Player player) || player.getAbilities().instabuild) return;
        var data = net.minecraft.core.component.DataComponents.CUSTOM_DATA;
        int age = stack.getOrDefault(data, net.minecraft.world.item.component.CustomData.EMPTY).copyTag().getIntOr("ember_age", 0) + 1;
        if (age >= LIFE) { stack.setCount(0); return; }   // cooled down
        net.minecraft.world.item.component.CustomData.update(data, stack, tag -> tag.putInt("ember_age", age));
        if (age % PERIOD == 0) {
            player.hurtServer(level, level.damageSources().onFire(), BURN * stack.getCount());
            level.playSound(null, player.blockPosition(), SoundEvents.FIRE_EXTINGUISH, SoundSource.PLAYERS, 0.5F, 1.6F);
        }
    }

    @Override
    public boolean onEntityItemUpdate(ItemStack stack, ItemEntity entity) {
        if (!entity.level().isClientSide() && entity.getAge() > FIZZLE) {
            if (entity.level() instanceof ServerLevel level) level.sendParticles(net.minecraft.core.particles.ParticleTypes.SMOKE, entity.getX(), entity.getY() + 0.2, entity.getZ(), 6, 0.1, 0.1, 0.1, 0.01);
            entity.discard();
            return true;
        }
        return false;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext ctx, TooltipDisplay display, Consumer<Component> tooltip, TooltipFlag flag) {
        tooltip.accept(Component.translatable("item.spirecraft.searing_ember.desc").withStyle(ChatFormatting.GOLD));
    }
}
