package com.mockingjam.spirecraft.weapon;

import java.util.function.Consumer;
import net.minecraft.ChatFormatting;
import net.minecraft.core.component.DataComponents;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;
import net.minecraft.world.item.component.CustomData;
import net.minecraft.world.item.component.TooltipDisplay;

/**
 * Sovereign Blade (Regent; the blade STS2 strengthens with "Forge"). Every hostile mob it kills adds 1 Forge;
 * every {@link #FORGE_PER_DAMAGE} Forge permanently adds +1 damage, up to {@link #MAX_BONUS}. Stored on the stack.
 */
public class SovereignBlade extends SpireWeapon {
    public static final int FORGE_PER_DAMAGE = 15;
    public static final int MAX_BONUS = 5;
    private static final String KEY = "spirecraft_forge";

    public SovereignBlade(Properties props) {
        super(props, Character.REGENT);
    }

    public static int forge(ItemStack stack) {
        return stack.getOrDefault(DataComponents.CUSTOM_DATA, CustomData.EMPTY).copyTag().getIntOr(KEY, 0);
    }

    public static void addForge(ItemStack stack, int amount) {
        int value = Math.min(FORGE_PER_DAMAGE * MAX_BONUS, forge(stack) + amount);
        CustomData.update(DataComponents.CUSTOM_DATA, stack, (CompoundTag tag) -> tag.putInt(KEY, value));
    }

    public static int bonusDamage(ItemStack stack) {
        return Math.min(MAX_BONUS, forge(stack) / FORGE_PER_DAMAGE);
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext context, TooltipDisplay display, Consumer<Component> tooltip, TooltipFlag flag) {
        super.appendHoverText(stack, context, display, tooltip, flag);
        tooltip.accept(Component.translatable("item.spirecraft.sovereign_blade.forge", forge(stack), FORGE_PER_DAMAGE * MAX_BONUS,
                bonusDamage(stack)).withStyle(ChatFormatting.GOLD));
    }
}
