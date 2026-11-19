package com.mockingjam.spirecraft.item;

import java.util.List;
import java.util.function.Consumer;
import net.minecraft.ChatFormatting;
import net.minecraft.core.NonNullList;
import net.minecraft.core.component.DataComponents;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.SimpleMenuProvider;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;
import net.minecraft.world.item.component.ItemContainerContents;
import net.minecraft.world.item.component.TooltipDisplay;
import net.minecraft.world.level.Level;

/**
 * Relic Pouch: a bundle-like bag with {@link #SIZE} slots that only takes relics. Relics work while they are in a
 * pouch the player carries. Right-click opens it (vanilla one-row chest screen, see {@link RelicPouchMenu}).
 * Contents are stored in the vanilla {@code minecraft:container} component.
 */
public class RelicPouchItem extends Item {
    public static final int SIZE = 9;

    public RelicPouchItem(Properties props) {
        super(props);
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        if (level instanceof ServerLevel) {
            ItemStack stack = player.getItemInHand(hand);
            player.openMenu(new SimpleMenuProvider((id, inventory, p) -> new RelicPouchMenu(id, inventory, hand), stack.getHoverName()));
            level.playSound(null, player.blockPosition(), SoundEvents.BUNDLE_INSERT, SoundSource.PLAYERS, 0.8F, 0.9F);
        }
        return InteractionResult.SUCCESS;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext context, TooltipDisplay display, Consumer<Component> tooltip, TooltipFlag flag) {
        tooltip.accept(Component.translatable(getDescriptionId() + ".desc").withStyle(ChatFormatting.GRAY));
    }

    /** All {@link #SIZE} slots of a pouch (empty stacks included). */
    public static NonNullList<ItemStack> load(ItemStack pouch) {
        NonNullList<ItemStack> items = NonNullList.withSize(SIZE, ItemStack.EMPTY);
        pouch.getOrDefault(DataComponents.CONTAINER, ItemContainerContents.EMPTY).copyInto(items);
        return items;
    }

    public static void save(ItemStack pouch, List<ItemStack> items) {
        pouch.set(DataComponents.CONTAINER, ItemContainerContents.fromItems(items));
    }

    /** True if the stack may go into a pouch that already holds {@code contents}: a relic not already inside. */
    public static boolean accepts(List<ItemStack> contents, ItemStack stack) {
        if (!(stack.getItem() instanceof RelicItem)) return false;
        for (ItemStack other : contents) if (other.is(stack.getItem())) return false;
        return true;
    }

    /** Puts one relic into the first free slot. Returns false if it is not accepted or the pouch is full. */
    public static boolean insert(ItemStack pouch, ItemStack relic) {
        NonNullList<ItemStack> items = load(pouch);
        if (!accepts(items, relic)) return false;
        for (int i = 0; i < SIZE; i++) {
            if (items.get(i).isEmpty()) {
                items.set(i, relic.copyWithCount(1));
                save(pouch, items);
                return true;
            }
        }
        return false;
    }
}
