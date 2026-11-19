package com.mockingjam.spirecraft.item;

import java.util.ArrayList;
import java.util.List;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.SimpleContainer;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.inventory.AbstractContainerMenu;
import net.minecraft.world.inventory.ClickType;
import net.minecraft.world.inventory.MenuType;
import net.minecraft.world.inventory.Slot;
import net.minecraft.world.item.ItemStack;

/**
 * Server-side menu of an open relic pouch. Uses the vanilla {@link MenuType#GENERIC_9x1} type with the same slot
 * layout as a one-row chest, so the client shows the vanilla screen and no client code is needed. The server decides
 * what may go in (relics only, one of each) and keeps the held pouch locked while it is open.
 */
public class RelicPouchMenu extends AbstractContainerMenu {
    private static final int POUCH_SLOTS = RelicPouchItem.SIZE;

    private final Player player;
    private final InteractionHand hand;
    private final int lockedHotbarSlot;
    private final SimpleContainer pouch = new SimpleContainer(POUCH_SLOTS);

    public RelicPouchMenu(int id, Inventory inventory, InteractionHand hand) {
        super(MenuType.GENERIC_9x1, id);
        this.player = inventory.player;
        this.hand = hand;
        this.lockedHotbarSlot = hand == InteractionHand.MAIN_HAND ? inventory.getSelectedSlot() : -1;

        var items = RelicPouchItem.load(player.getItemInHand(hand));
        for (int i = 0; i < POUCH_SLOTS; i++) pouch.setItem(i, items.get(i));
        pouch.addListener(c -> writeBack());

        for (int i = 0; i < POUCH_SLOTS; i++) {
            addSlot(new Slot(pouch, i, 8 + i * 18, 18) {
                @Override
                public boolean mayPlace(ItemStack stack) {
                    List<ItemStack> others = new ArrayList<>();
                    for (int j = 0; j < POUCH_SLOTS; j++) if (j != getContainerSlot()) others.add(pouch.getItem(j));
                    return RelicPouchItem.accepts(others, stack);
                }

                @Override
                public int getMaxStackSize() {
                    return 1;
                }
            });
        }
        int top = 18 + 18 + 13;
        for (int row = 0; row < 3; row++) {
            for (int col = 0; col < 9; col++) addSlot(new Slot(inventory, col + (row + 1) * 9, 8 + col * 18, top + row * 18));
        }
        for (int col = 0; col < 9; col++) {
            boolean locked = col == lockedHotbarSlot;
            addSlot(new Slot(inventory, col, 8 + col * 18, top + 58) {
                @Override
                public boolean mayPickup(Player p) {
                    return !locked;
                }

                @Override
                public boolean mayPlace(ItemStack stack) {
                    return !locked;
                }
            });
        }
    }

    private void writeBack() {
        ItemStack held = player.getItemInHand(hand);
        if (!(held.getItem() instanceof RelicPouchItem)) return;
        List<ItemStack> items = new ArrayList<>(POUCH_SLOTS);
        for (int i = 0; i < POUCH_SLOTS; i++) items.add(pouch.getItem(i).copy());
        RelicPouchItem.save(held, items);
    }

    @Override
    public void clicked(int slotId, int button, ClickType type, Player clicker) {
        // Number keys / offhand swap must not move the open pouch away.
        if (type == ClickType.SWAP && (button == lockedHotbarSlot || (hand == InteractionHand.OFF_HAND && button == Inventory.SLOT_OFFHAND))) return;
        super.clicked(slotId, button, type, clicker);
    }

    @Override
    public boolean stillValid(Player p) {
        return p.getItemInHand(hand).getItem() instanceof RelicPouchItem;
    }

    @Override
    public ItemStack quickMoveStack(Player p, int index) {
        Slot slot = slots.get(index);
        if (!slot.hasItem()) return ItemStack.EMPTY;
        ItemStack stack = slot.getItem();
        ItemStack copy = stack.copy();
        if (index < POUCH_SLOTS) {
            if (!moveItemStackTo(stack, POUCH_SLOTS, slots.size(), true)) return ItemStack.EMPTY;
        } else if (!moveItemStackTo(stack, 0, POUCH_SLOTS, false)) {
            return ItemStack.EMPTY;
        }
        if (stack.isEmpty()) slot.setByPlayer(ItemStack.EMPTY);
        else slot.setChanged();
        return copy;
    }
}
