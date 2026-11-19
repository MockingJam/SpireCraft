package com.mockingjam.spirecraft.registry;

import com.mockingjam.spirecraft.SpireCraft;
import java.util.EnumMap;
import java.util.Map;
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.ResourceKey;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.tags.BlockTags;
import net.minecraft.tags.TagKey;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.EquipmentSlotGroup;
import net.minecraft.world.entity.ai.attributes.AttributeModifier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ToolMaterial;
import net.minecraft.world.item.component.ItemAttributeModifiers;
import net.minecraft.world.item.equipment.ArmorMaterial;
import net.minecraft.world.item.equipment.ArmorType;
import net.minecraft.world.item.equipment.EquipmentAsset;
import net.minecraft.world.item.equipment.EquipmentAssets;

/**
 * Tool and armor tiers plus the tags the material mechanics rely on.
 * Numbers are balanced against vanilla, see docs/design/materials.md.
 */
public final class ModMaterials {
    // ---- Tags ----
    public static final TagKey<Item> REPAIRS_TUNGSTEN_ARMOR = itemTag("repairs_tungsten_armor");
    public static final TagKey<Item> ORICHALCUM_TOOL_MATERIALS = itemTag("orichalcum_tool_materials");
    public static final TagKey<Item> REPAIRS_ORICHALCUM_ARMOR = itemTag("repairs_orichalcum_armor");
    /** Worn pieces are counted for the flat damage reduction. */
    public static final TagKey<Item> TUNGSTEN_ARMOR = itemTag("tungsten_armor");
    /** Worn (non-dormant) pieces are counted for the orichalcum shield. */
    public static final TagKey<Item> ORICHALCUM_ARMOR = itemTag("orichalcum_armor");
    /** Bosses affected by Lava Rock (and any future boss-only rule). */
    public static final TagKey<EntityType<?>> BOSSES = TagKey.create(Registries.ENTITY_TYPE, SpireCraft.id("bosses"));

    // ---- Tungsten: iron-level defense, flat damage reduction, heavy ----
    public static final ResourceKey<EquipmentAsset> TUNGSTEN_ASSET = asset("tungsten");
    public static final ArmorMaterial TUNGSTEN_ARMOR_MATERIAL = new ArmorMaterial(
            20, defense(2, 5, 6, 2, 5), 9, SoundEvents.ARMOR_EQUIP_IRON, 0.0F, 0.05F, REPAIRS_TUNGSTEN_ARMOR, TUNGSTEN_ASSET);
    public static final float TUNGSTEN_REDUCTION_PER_PIECE = 0.25F;
    public static final double TUNGSTEN_SPEED_PER_PIECE = -0.02;

    // ---- Orichalcum: a diamond alternative that never breaks ----
    public static final ToolMaterial ORICHALCUM_TOOL = new ToolMaterial(
            BlockTags.INCORRECT_FOR_DIAMOND_TOOL, 1200, 8.0F, 3.0F, 12, ORICHALCUM_TOOL_MATERIALS);
    public static final ResourceKey<EquipmentAsset> ORICHALCUM_ASSET = asset("orichalcum");
    public static final ArmorMaterial ORICHALCUM_ARMOR_MATERIAL = new ArmorMaterial(
            28, defense(3, 6, 8, 3, 11), 12, SoundEvents.ARMOR_EQUIP_NETHERITE, 1.5F, 0.0F, REPAIRS_ORICHALCUM_ARMOR, ORICHALCUM_ASSET);

    // ---- Phase 6 weapon materials ----
    /** Tungsten alloy weapons: between iron and diamond, heavy-hitting. */
    public static final ToolMaterial TUNGSTEN_WEAPON = new ToolMaterial(
            BlockTags.INCORRECT_FOR_IRON_TOOL, 1000, 6.0F, 2.5F, 10, REPAIRS_TUNGSTEN_ARMOR);
    /** Regent's gold-and-orichalcum blades: iron-level, very enchantable like gold. */
    public static final ToolMaterial REGAL = new ToolMaterial(
            BlockTags.INCORRECT_FOR_IRON_TOOL, 800, 6.0F, 2.0F, 18, net.minecraft.tags.ItemTags.GOLD_TOOL_MATERIALS);

    private ModMaterials() {}

    /** Armor attributes of the material plus one extra modifier for that slot. */
    public static ItemAttributeModifiers armorAttributes(ArmorMaterial material, ArmorType type, String name,
            net.minecraft.core.Holder<net.minecraft.world.entity.ai.attributes.Attribute> attribute, double amount, AttributeModifier.Operation op) {
        return material.createAttributes(type).withModifierAdded(attribute,
                new AttributeModifier(SpireCraft.id("armor." + name + "." + type.getName()), amount, op),
                EquipmentSlotGroup.bySlot(type.getSlot()));
    }

    public static ItemAttributeModifiers tungstenArmor(ArmorType type) {
        return armorAttributes(TUNGSTEN_ARMOR_MATERIAL, type, "tungsten_weight", Attributes.MOVEMENT_SPEED,
                TUNGSTEN_SPEED_PER_PIECE, AttributeModifier.Operation.ADD_MULTIPLIED_TOTAL);
    }

    /** +1 max absorption per piece, so the orichalcum shield has room to grow. */
    public static ItemAttributeModifiers orichalcumArmor(ArmorType type) {
        return armorAttributes(ORICHALCUM_ARMOR_MATERIAL, type, "orichalcum_shield", Attributes.MAX_ABSORPTION,
                1.0, AttributeModifier.Operation.ADD_VALUE);
    }

    private static TagKey<Item> itemTag(String name) {
        return TagKey.create(Registries.ITEM, SpireCraft.id(name));
    }

    private static ResourceKey<EquipmentAsset> asset(String name) {
        return ResourceKey.create(EquipmentAssets.ROOT_ID, SpireCraft.id(name));
    }

    private static Map<ArmorType, Integer> defense(int boots, int leggings, int chestplate, int helmet, int body) {
        Map<ArmorType, Integer> map = new EnumMap<>(ArmorType.class);
        map.put(ArmorType.BOOTS, boots);
        map.put(ArmorType.LEGGINGS, leggings);
        map.put(ArmorType.CHESTPLATE, chestplate);
        map.put(ArmorType.HELMET, helmet);
        map.put(ArmorType.BODY, body);
        return map;
    }
}
