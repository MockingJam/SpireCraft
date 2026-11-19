package com.mockingjam.spirecraft.relic;

import com.mockingjam.spirecraft.item.RelicPouchItem;
import java.util.HashSet;
import java.util.Set;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraftforge.registries.RegistryObject;

/** Which relics are active for a player: the ones inside the relic pouches in their inventory (each counted once). */
public final class Relics {
    private Relics() {}

    public static Set<Item> active(Player player) {
        Set<Item> relics = new HashSet<>();
        var inventory = player.getInventory();
        for (int i = 0; i < inventory.getContainerSize(); i++) {
            ItemStack stack = inventory.getItem(i);
            if (stack.getItem() instanceof RelicPouchItem) {
                for (ItemStack relic : RelicPouchItem.load(stack)) if (!relic.isEmpty()) relics.add(relic.getItem());
            }
        }
        return relics;
    }

    public static boolean has(Player player, Item relic) {
        var inventory = player.getInventory();
        for (int i = 0; i < inventory.getContainerSize(); i++) {
            ItemStack stack = inventory.getItem(i);
            if (stack.getItem() instanceof RelicPouchItem) {
                for (ItemStack inside : RelicPouchItem.load(stack)) if (inside.is(relic)) return true;
            }
        }
        return false;
    }

    public static boolean has(Player player, RegistryObject<Item> relic) {
        return has(player, relic.get());
    }
}
