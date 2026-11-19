package com.mockingjam.spirecraft.datagen;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.block.BiomeBlocks;
import com.mockingjam.spirecraft.block.StoneSet;
import com.mockingjam.spirecraft.block.WoodSet;
import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mockingjam.spirecraft.registry.ModItems;
import com.mockingjam.spirecraft.registry.ModMaterials;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import net.minecraft.core.HolderLookup;
import net.minecraft.core.registries.Registries;
import net.minecraft.data.PackOutput;
import net.minecraft.data.tags.IntrinsicHolderTagsProvider;
import net.minecraft.tags.ItemTags;
import net.minecraft.world.item.Item;
import net.minecraftforge.common.data.ExistingFileHelper;
import org.jetbrains.annotations.Nullable;

/** Item tags. Vanilla tool/armor tags make enchanting tables and anvils treat our gear like vanilla gear. */
public class ModItemTagsProvider extends IntrinsicHolderTagsProvider<Item> {
    public ModItemTagsProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookup, @Nullable ExistingFileHelper existing) {
        super(output, Registries.ITEM, lookup, item -> item.builtInRegistryHolder().key(), SpireCraft.MODID, existing);
    }

    @Override
    protected void addTags(HolderLookup.Provider provider) {
        // Repair materials
        tag(ModMaterials.REPAIRS_TUNGSTEN_ARMOR).add(ModItems.TUNGSTEN_ALLOY_INGOT.get());
        tag(ModMaterials.ORICHALCUM_TOOL_MATERIALS).add(ModItems.ORICHALCUM_INGOT.get());
        tag(ModMaterials.REPAIRS_ORICHALCUM_ARMOR).add(ModItems.ORICHALCUM_INGOT.get());

        // Mechanic tags
        tag(ModMaterials.TUNGSTEN_ARMOR).add(ModItems.TUNGSTEN_HELMET.get(), ModItems.TUNGSTEN_CHESTPLATE.get(),
                ModItems.TUNGSTEN_LEGGINGS.get(), ModItems.TUNGSTEN_BOOTS.get());
        tag(ModMaterials.ORICHALCUM_ARMOR).add(ModItems.ORICHALCUM_HELMET.get(), ModItems.ORICHALCUM_CHESTPLATE.get(),
                ModItems.ORICHALCUM_LEGGINGS.get(), ModItems.ORICHALCUM_BOOTS.get());

        // Phase 6 weapons v2: melee weapons take sword enchantments; everything with durability takes Unbreaking/Mending
        for (var tag : List.of(ItemTags.SWORD_ENCHANTABLE, ItemTags.SHARP_WEAPON_ENCHANTABLE, ItemTags.WEAPON_ENCHANTABLE, ItemTags.FIRE_ASPECT_ENCHANTABLE)) {
            tag(tag).add(ModItems.SOVEREIGN_BLADE.get(), ModItems.CRESCENT_SPEAR.get(), ModItems.HEIRLOOM_HAMMER.get(), ModItems.REGENT_STRIKE.get(), ModItems.PHOTON_CUT.get(), ModItems.SCYTHE.get(), ModItems.SCOURGE.get(), ModItems.POISONED_DAGGER.get(), ModItems.INK_DAGGER.get(), ModItems.SNAKEBITE.get(), ModItems.CLEAVER.get(), ModItems.MORNING_STAR.get(), ModItems.INFERNAL_BLADE.get(), ModItems.BLOODLETTING_DAGGER.get(), ModItems.BLUDGEON.get());
        }
        tag(ItemTags.DURABILITY_ENCHANTABLE).add(ModItems.SOVEREIGN_BLADE.get(), ModItems.CRESCENT_SPEAR.get(), ModItems.HEIRLOOM_HAMMER.get(), ModItems.REGENT_STRIKE.get(), ModItems.PHOTON_CUT.get(), ModItems.SCYTHE.get(), ModItems.SCOURGE.get(), ModItems.POISONED_DAGGER.get(), ModItems.INK_DAGGER.get(), ModItems.SNAKEBITE.get(), ModItems.CLEAVER.get(), ModItems.MORNING_STAR.get(), ModItems.INFERNAL_BLADE.get(), ModItems.BLOODLETTING_DAGGER.get(), ModItems.BLUDGEON.get(), ModItems.FLAK_CANNON.get(), ModItems.SLINGSHOT.get(), ModItems.TANK_SHIELD.get(), ModItems.LIGHTNING_ROD.get());

        // Phase 7 wood & stone (mirror the block tags, so vanilla recipes such as crafting tables, sticks and chests accept them)
        for (WoodSet w : BiomeBlocks.woods()) {
            for (var b : w.logs()) tag(w.logsItemTag).add(b.get().asItem());
            tag(ItemTags.LOGS_THAT_BURN).addTag(w.logsItemTag);
            tag(ItemTags.PLANKS).add(w.planks.get().asItem());
            tag(ItemTags.WOODEN_SLABS).add(w.slab.get().asItem());
            tag(ItemTags.WOODEN_STAIRS).add(w.stairs.get().asItem());
            tag(ItemTags.WOODEN_FENCES).add(w.fence.get().asItem());
            tag(ItemTags.FENCE_GATES).add(w.fenceGate.get().asItem());
            tag(ItemTags.WOODEN_DOORS).add(w.door.get().asItem());
            tag(ItemTags.WOODEN_TRAPDOORS).add(w.trapdoor.get().asItem());
            tag(ItemTags.WOODEN_BUTTONS).add(w.button.get().asItem());
            tag(ItemTags.WOODEN_PRESSURE_PLATES).add(w.pressurePlate.get().asItem());
            if (w.hasTree) {
                tag(ItemTags.LEAVES).add(w.leaves.get().asItem());
                tag(ItemTags.SAPLINGS).add(w.sapling.get().asItem());
            }
        }
        for (StoneSet set : BiomeBlocks.stones()) {
            tag(ItemTags.STAIRS).add(set.stairs.get().asItem());
            tag(ItemTags.SLABS).add(set.slab.get().asItem());
            tag(ItemTags.WALLS).add(set.wall.get().asItem());
        }
        tag(ItemTags.DIRT).add(ModBlocks.HIVE_SOIL.get().asItem());

        // Vanilla tool / armor tags
        tag(ItemTags.SWORDS).add(ModItems.ORICHALCUM_SWORD.get());
        tag(ItemTags.PICKAXES).add(ModItems.ORICHALCUM_PICKAXE.get());
        tag(ItemTags.AXES).add(ModItems.ORICHALCUM_AXE.get());
        tag(ItemTags.SHOVELS).add(ModItems.ORICHALCUM_SHOVEL.get());
        tag(ItemTags.HOES).add(ModItems.ORICHALCUM_HOE.get());
        tag(ItemTags.HEAD_ARMOR).add(ModItems.TUNGSTEN_HELMET.get(), ModItems.ORICHALCUM_HELMET.get());
        tag(ItemTags.CHEST_ARMOR).add(ModItems.TUNGSTEN_CHESTPLATE.get(), ModItems.ORICHALCUM_CHESTPLATE.get());
        tag(ItemTags.LEG_ARMOR).add(ModItems.TUNGSTEN_LEGGINGS.get(), ModItems.ORICHALCUM_LEGGINGS.get());
        tag(ItemTags.FOOT_ARMOR).add(ModItems.TUNGSTEN_BOOTS.get(), ModItems.ORICHALCUM_BOOTS.get());
    }
}
