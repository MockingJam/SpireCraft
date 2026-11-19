package com.mockingjam.spirecraft.item;

import com.mockingjam.spirecraft.mob.SoulFysh;
import net.minecraft.ChatFormatting;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.item.ItemEntity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;
import net.minecraft.world.item.component.TooltipDisplay;
import net.minecraft.world.level.Level;
import java.util.function.Consumer;

/**
 * Beckoning Soul (招引之魂): the Soul Fysh's Beckon card as an item it pushes into the player's inventory. Carried, it
 * drains {@link #DRAIN} health every {@link #PERIOD} ticks (Beckon: "lose HP at the end of your turn if it is in your
 * hand"); right-click dispels it for {@link #HUNGER_COST} hunger (playing it costs 1 energy). Thrown away, it comes back
 * to the thrower after {@link #RETURN_TICKS}. With no Soul Fysh within {@link #BOSS_RANGE} blocks it fades by itself.
 */
public class BeckoningSoul extends Item {
    public static final int PERIOD = 120, HUNGER_COST = 3, RETURN_TICKS = 100, CHECK = 100;
    public static final float DRAIN = 1.0F;
    public static final double BOSS_RANGE = 64;

    public BeckoningSoul(Properties props) {
        super(props);
    }

    @Override
    public void inventoryTick(ItemStack stack, ServerLevel level, net.minecraft.world.entity.Entity entity, EquipmentSlot slot) {
        if (!(entity instanceof Player player) || player.getAbilities().instabuild) return;
        if (player.tickCount % CHECK == 0 && level.getEntitiesOfClass(SoulFysh.class, player.getBoundingBox().inflate(BOSS_RANGE)).isEmpty()) {
            stack.setCount(0);   // the fight is over: the soul fades
            return;
        }
        if (player.tickCount % PERIOD == 0) player.hurtServer(level, level.damageSources().magic(), DRAIN * stack.getCount());
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        ItemStack stack = player.getItemInHand(hand);
        if (player.getFoodData().getFoodLevel() < HUNGER_COST && !player.getAbilities().instabuild) {
            player.displayClientMessage(Component.translatable("item.spirecraft.beckoning_soul.hungry"), true);
            return InteractionResult.FAIL;
        }
        if (!level.isClientSide()) {
            player.getFoodData().setFoodLevel(player.getFoodData().getFoodLevel() - HUNGER_COST);
            level.playSound(null, player.blockPosition(), SoundEvents.SOUL_ESCAPE.value(), SoundSource.PLAYERS, 1.0F, 1.4F);
            stack.shrink(1);
        }
        return InteractionResult.SUCCESS;
    }

    /** Thrown away, it drifts back into the thrower's inventory. */
    @Override
    public boolean onEntityItemUpdate(ItemStack stack, ItemEntity entity) {
        if (entity.level() instanceof ServerLevel level && entity.getAge() >= RETURN_TICKS) {
            if (entity.getOwner() instanceof Player owner && owner.isAlive() && owner.level() == level) {
                if (!owner.getInventory().add(stack.copy())) return false;
                entity.discard();
                return true;
            }
            entity.discard();
            return true;
        }
        return false;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext context, TooltipDisplay display, Consumer<Component> tooltip, TooltipFlag flag) {
        tooltip.accept(Component.translatable("item.spirecraft.beckoning_soul.desc").withStyle(ChatFormatting.GRAY));
    }
}
