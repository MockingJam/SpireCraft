package com.mockingjam.spirecraft.weapon;

import java.util.function.Consumer;
import net.minecraft.ChatFormatting;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;
import net.minecraft.world.item.component.TooltipDisplay;

/**
 * A character weapon (phase 6, docs/design/weapons.md). Tooltip: the character, then the effect from
 * {@code <item key>.desc}. Combat behaviour lives in {@link WeaponEvents}; subclasses add right-click abilities.
 */
public class SpireWeapon extends Item {
    /** STS2 characters, for the tooltip. */
    public enum Character { IRONCLAD, SILENT, REGENT, NECROBINDER, DEFECT }

    private final Character character;

    public SpireWeapon(Properties props, Character character) {
        super(props);
        this.character = character;
    }

    public Character character() {
        return character;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext context, TooltipDisplay display, Consumer<Component> tooltip, TooltipFlag flag) {
        tooltip.accept(Component.translatable("character.spirecraft." + character.name().toLowerCase(java.util.Locale.ROOT)).withStyle(ChatFormatting.DARK_AQUA));
        tooltip.accept(Component.translatable(getDescriptionId() + ".desc").withStyle(ChatFormatting.GRAY));
    }

    /** First-person attack animations (spear jab, hammer slam, whip lash); client only. */
    @Override
    public void initializeClient(java.util.function.Consumer<net.minecraftforge.client.extensions.common.IClientItemExtensions> consumer) {
        consumer.accept(com.mockingjam.spirecraft.client.WeaponAnimations.INSTANCE);
    }
}
