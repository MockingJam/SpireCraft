package com.mockingjam.spirecraft.weapon;

import java.util.function.Consumer;
import net.minecraft.ChatFormatting;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;
import net.minecraft.world.item.component.TooltipDisplay;
import net.minecraft.world.level.Level;

/**
 * Energy Core (Defect; the Cracked Core relic; Zap = channel Lightning, Cold Snap = channel Frost).
 * Right-click channels a Lightning orb, sneak + right-click a Frost orb. Every Energy Core carried adds an orb slot.
 * The orbs themselves live in {@link Orbs}.
 */
public class ChargeCoreItem extends SpireWeapon {
    public static final int COOLDOWN = 20;

    public ChargeCoreItem(Properties props) {
        super(props, Character.DEFECT);
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        if (level instanceof ServerLevel server) {
            Orbs.channel(server, player, player.isShiftKeyDown() ? Orbs.Type.FROST : Orbs.Type.LIGHTNING);
            player.getCooldowns().addCooldown(player.getItemInHand(hand), COOLDOWN);
        }
        return InteractionResult.SUCCESS;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext context, TooltipDisplay display, Consumer<Component> tooltip, TooltipFlag flag) {
        super.appendHoverText(stack, context, display, tooltip, flag);
        tooltip.accept(Component.translatable("item.spirecraft.energy_core.orb.lightning",
                fmt(Orbs.LIGHTNING_PASSIVE), Orbs.PASSIVE_PERIOD / 20, fmt(Orbs.LIGHTNING_EVOKE), Orbs.LIGHTNING_TICKS / 20).withStyle(ChatFormatting.YELLOW));
        tooltip.accept(Component.translatable("item.spirecraft.energy_core.orb.frost",
                Orbs.FROST_ARMOR, Orbs.FROST_EVOKE_TICKS / 20, Orbs.FROST_TICKS / 20).withStyle(ChatFormatting.AQUA));
        tooltip.accept(Component.translatable("item.spirecraft.energy_core.orb.dark",
                fmt(Orbs.DARK_DAMAGE), (int) Orbs.DARK_RADIUS, Orbs.DARK_TICKS / 20).withStyle(ChatFormatting.LIGHT_PURPLE));
        tooltip.accept(Component.translatable("item.spirecraft.energy_core.orb.slots", Orbs.MAX_SLOTS).withStyle(ChatFormatting.DARK_GRAY));
    }

    private static String fmt(float v) {
        return v == Math.round(v) ? String.valueOf(Math.round(v)) : String.valueOf(v);
    }
}
