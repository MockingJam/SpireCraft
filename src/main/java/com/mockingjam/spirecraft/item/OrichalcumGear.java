package com.mockingjam.spirecraft.item;

import java.util.function.Consumer;
import net.minecraft.core.component.DataComponents;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.item.AxeItem;
import net.minecraft.world.item.HoeItem;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.ShovelItem;
import net.minecraft.world.item.ToolMaterial;
import net.minecraft.world.item.component.ItemAttributeModifiers;
import org.jetbrains.annotations.Nullable;

/**
 * "Seemingly indestructible": orichalcum gear never breaks. Durability stops at 1 point left; at that point the stack is
 * dormant — its attribute modifiers (attack, armor, shield room) and tool component are removed, so it mines at hand
 * speed and gives no protection. Repairing it (anvil, mending, crafting) restores everything on the next sync.
 * Enchantments keep working while dormant.
 */
public final class OrichalcumGear {
    private OrichalcumGear() {}

    public static boolean isDormant(ItemStack stack) {
        return stack.isDamageableItem() && stack.getDamageValue() >= stack.getMaxDamage() - 1;
    }

    /** Never let damage reach max durability. */
    public static int capDamage(ItemStack stack, int damage) {
        int room = stack.getMaxDamage() - 1 - stack.getDamageValue();
        return Math.max(0, Math.min(damage, room));
    }

    /** Make the stack's components match its dormant state. Cheap when nothing changes. */
    public static void syncDormancy(ItemStack stack) {
        var defaults = stack.getItem().components();
        if (isDormant(stack)) {
            if (!ItemAttributeModifiers.EMPTY.equals(stack.get(DataComponents.ATTRIBUTE_MODIFIERS))) {
                stack.set(DataComponents.ATTRIBUTE_MODIFIERS, ItemAttributeModifiers.EMPTY);
            }
            if (stack.has(DataComponents.TOOL)) stack.remove(DataComponents.TOOL);
        } else {
            var attributes = defaults.get(DataComponents.ATTRIBUTE_MODIFIERS);
            if (attributes != null && !attributes.equals(stack.get(DataComponents.ATTRIBUTE_MODIFIERS))) {
                stack.set(DataComponents.ATTRIBUTE_MODIFIERS, attributes);
            }
            var tool = defaults.get(DataComponents.TOOL);
            if (tool != null && !stack.has(DataComponents.TOOL)) stack.set(DataComponents.TOOL, tool);
        }
    }

    private static int damage(ItemStack stack, int damage) {
        int capped = capDamage(stack, damage);
        if (stack.getDamageValue() + capped >= stack.getMaxDamage() - 1) {
            // Probably goes dormant with this hit: strip now. If Unbreaking saves it, the next sync restores the components.
            stack.set(DataComponents.ATTRIBUTE_MODIFIERS, ItemAttributeModifiers.EMPTY);
            stack.remove(DataComponents.TOOL);
        }
        return capped;
    }

    /** Sword, pickaxe and armor pieces (configured entirely through Item.Properties). */
    public static class Basic extends Item {
        public Basic(Properties props) {
            super(props);
        }

        @Override
        public int damageItem(ItemStack stack, int damage, ServerLevel level, @Nullable ServerPlayer player, boolean canBreak, Consumer<Item> onBroken) {
            return OrichalcumGear.damage(stack, damage);
        }

        @Override
        public void inventoryTick(ItemStack stack, ServerLevel level, Entity entity, @Nullable EquipmentSlot slot) {
            syncDormancy(stack);
        }
    }

    public static class Axe extends AxeItem {
        public Axe(ToolMaterial material, float attackDamage, float attackSpeed, Properties props) {
            super(material, attackDamage, attackSpeed, props);
        }

        @Override
        public int damageItem(ItemStack stack, int damage, ServerLevel level, @Nullable ServerPlayer player, boolean canBreak, Consumer<Item> onBroken) {
            return OrichalcumGear.damage(stack, damage);
        }

        @Override
        public void inventoryTick(ItemStack stack, ServerLevel level, Entity entity, @Nullable EquipmentSlot slot) {
            syncDormancy(stack);
        }
    }

    public static class Shovel extends ShovelItem {
        public Shovel(ToolMaterial material, float attackDamage, float attackSpeed, Properties props) {
            super(material, attackDamage, attackSpeed, props);
        }

        @Override
        public int damageItem(ItemStack stack, int damage, ServerLevel level, @Nullable ServerPlayer player, boolean canBreak, Consumer<Item> onBroken) {
            return OrichalcumGear.damage(stack, damage);
        }

        @Override
        public void inventoryTick(ItemStack stack, ServerLevel level, Entity entity, @Nullable EquipmentSlot slot) {
            syncDormancy(stack);
        }
    }

    public static class Hoe extends HoeItem {
        public Hoe(ToolMaterial material, float attackDamage, float attackSpeed, Properties props) {
            super(material, attackDamage, attackSpeed, props);
        }

        @Override
        public int damageItem(ItemStack stack, int damage, ServerLevel level, @Nullable ServerPlayer player, boolean canBreak, Consumer<Item> onBroken) {
            return OrichalcumGear.damage(stack, damage);
        }

        @Override
        public void inventoryTick(ItemStack stack, ServerLevel level, Entity entity, @Nullable EquipmentSlot slot) {
            syncDormancy(stack);
        }
    }
}
