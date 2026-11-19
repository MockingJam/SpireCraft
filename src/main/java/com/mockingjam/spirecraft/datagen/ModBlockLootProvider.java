package com.mockingjam.spirecraft.datagen;

import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mockingjam.spirecraft.registry.ModItems;
import com.mockingjam.spirecraft.block.BiomeBlocks;
import com.mockingjam.spirecraft.block.StoneSet;
import com.mockingjam.spirecraft.block.WoodSet;
import java.util.List;
import java.util.Set;
import net.minecraft.core.HolderLookup;
import net.minecraft.core.registries.Registries;
import net.minecraft.data.loot.BlockLootSubProvider;
import net.minecraft.world.flag.FeatureFlags;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.enchantment.Enchantments;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.storage.loot.LootTable;
import net.minecraft.world.level.storage.loot.entries.LootItem;
import net.minecraft.world.level.storage.loot.entries.LootPoolEntryContainer;
import net.minecraft.world.level.storage.loot.functions.ApplyBonusCount;
import net.minecraft.world.level.storage.loot.functions.SetItemCountFunction;
import net.minecraft.world.level.storage.loot.providers.number.UniformGenerator;
import net.minecraftforge.registries.RegistryObject;

/** Block drops. Every block in ModBlocks must get a loot table here, otherwise runData fails validation. */
public class ModBlockLootProvider extends BlockLootSubProvider {
    public ModBlockLootProvider(HolderLookup.Provider registries) {
        super(Set.of(), FeatureFlags.REGISTRY.allFlags(), registries);
    }

    @Override
    protected void generate() {
        // Raw-material ores: one item, Fortune multiplies (like iron ore).
        add(ModBlocks.WOLFRAMITE_ORE.get(), b -> createOreDrop(b, ModItems.RAW_TUNGSTEN.get()));
        add(ModBlocks.DEEPSLATE_WOLFRAMITE_ORE.get(), b -> createOreDrop(b, ModItems.RAW_TUNGSTEN.get()));
        add(ModBlocks.ORICHALCUM_ORE.get(), b -> createOreDrop(b, ModItems.RAW_ORICHALCUM.get()));
        add(ModBlocks.LAVA_ROCK_ORE.get(), b -> createOreDrop(b, ModItems.LAVA_ROCK_SHARD.get()));
        // Brimstone: 2–4, +1 per Fortune level (like nether quartz / redstone).
        add(ModBlocks.NETHER_BRIMSTONE_ORE.get(), b -> createMultiOreDrops(b, ModItems.BRIMSTONE.get(), 2, 4));

        dropSelf(ModBlocks.TUNGSTEN_ALLOY_BLOCK.get());
        dropSelf(ModBlocks.ORICHALCUM_BLOCK.get());
        for (var b : java.util.List.of(ModBlocks.AUTOMATON_ALLOY_BLOCK, ModBlocks.TARNISHED_AUTOMATON_ALLOY_BLOCK, ModBlocks.DERELICT_AUTOMATON_ALLOY_BLOCK,
                ModBlocks.CORE_CRYSTAL_BLOCK)) dropSelf(b.get());
        // the cracked crystal breaks into prismarine crystals (silk touch keeps it)
        add(ModBlocks.CRACKED_CORE_CRYSTAL_BLOCK.get(), b -> createSilkTouchDispatchTable(b, applyExplosionDecay(b, net.minecraft.world.level.storage.loot.entries.LootItem.lootTableItem(net.minecraft.world.item.Items.PRISMARINE_CRYSTALS)
                .apply(net.minecraft.world.level.storage.loot.functions.SetItemCountFunction.setCount(net.minecraft.world.level.storage.loot.providers.number.UniformGenerator.between(1, 3))))));
        dropSelf(ModBlocks.BRIMSTONE_BLOCK.get());

        // ---- Phase 7 biome blocks: same rules as their vanilla counterparts ----
        for (WoodSet w : BiomeBlocks.woods()) {
            for (var b : w.logs()) dropSelf(b.get());
            for (var b : List.of(w.planks, w.stairs, w.fence, w.fenceGate, w.trapdoor, w.button, w.pressurePlate)) {
                dropSelf(b.get());
            }
            if (w.hasTree) dropSelf(w.sapling.get());
            add(w.slab.get(), this::createSlabItemTable);
            add(w.door.get(), this::createDoorTable);
            if (w.hasTree) add(w.leaves.get(), b -> createLeavesDrops(b, w.sapling.get(), NORMAL_LEAVES_SAPLING_CHANCES));
        }
        dropSelf(ModBlocks.DARK_SAND.get());
        dropSelf(ModBlocks.CRACKED_INK_STONE.get());
        // barnacles: silk touch keeps them (one per face), otherwise they crumble to a bone meal
        add(ModBlocks.HIVE_MYCELIUM_LAYER.get(), b -> createMultifaceBlockDrops(b, hasSilkTouch()));
        add(ModBlocks.MYCELIUM_THREAD.get(), b -> createShearsOnlyDrop(b));
        add(ModBlocks.BARNACLES.get(), b -> createMultifaceBlockDrops(b, hasSilkTouch()).withPool(net.minecraft.world.level.storage.loot.LootPool.lootPool()
                .add(net.minecraft.world.level.storage.loot.entries.LootItem.lootTableItem(net.minecraft.world.item.Items.BONE_MEAL)).when(doesNotHaveSilkTouch())));
        add(ModBlocks.HIVE_MYCELIUM.get(), b -> createSingleItemTableWithSilkTouch(b, ModBlocks.HIVE_SOIL.get()));
        dropSelf(ModBlocks.INK_VENT.get());
        dropSelf(ModBlocks.SILK_HIVE.get());
        for (var b : java.util.List.of(ModBlocks.THATCH, ModBlocks.THATCH_STAIRS, ModBlocks.TWIG_NEST, ModBlocks.WEBBED_HIVE_SOIL, ModBlocks.PACKED_HIVE_SOIL,
                ModBlocks.CRACKED_HIVE_ROCK_BRICKS, ModBlocks.CHISELED_HIVE_ROCK_BRICKS)) dropSelf(b.get());
        add(ModBlocks.THATCH_SLAB.get(), createSlabItemTable(ModBlocks.THATCH_SLAB.get()));
        // the cave stones' ores drop what the vanilla ore they replace drops
        for (var e : com.mockingjam.spirecraft.block.CaveOres.kinds().entrySet()) {
            Block b = e.getKey();
            add(b, switch (e.getValue()) {
                case COAL -> createOreDrop(b, net.minecraft.world.item.Items.COAL);
                case IRON -> createOreDrop(b, net.minecraft.world.item.Items.RAW_IRON);
                case COPPER -> createCopperOreDrops(b);
                case GOLD -> createOreDrop(b, net.minecraft.world.item.Items.RAW_GOLD);
                case REDSTONE -> createRedstoneOreDrops(b);
                case LAPIS -> createLapisOreDrops(b);
                case DIAMOND -> createOreDrop(b, net.minecraft.world.item.Items.DIAMOND);
                case EMERALD -> createOreDrop(b, net.minecraft.world.item.Items.EMERALD);
                case WOLFRAMITE -> createOreDrop(b, ModItems.RAW_TUNGSTEN.get());
                case ORICHALCUM -> createOreDrop(b, ModItems.RAW_ORICHALCUM.get());
            });
        }
        for (StoneSet set : BiomeBlocks.stones()) {
            dropSelf(set.base.get());
            dropSelf(set.stairs.get());
            dropSelf(set.wall.get());
            add(set.slab.get(), this::createSlabItemTable);
        }
        for (var b : List.of(ModBlocks.CRACKED_RUIN_STONE_BRICKS, ModBlocks.CHISELED_RUIN_STONE_BRICKS, ModBlocks.PAVING_STONES, ModBlocks.JUNK_BLOCK, ModBlocks.BUG_CARCASS, ModBlocks.BYRDONIS_EGG,
                ModBlocks.FOGCAP, ModBlocks.CRACKED_DOCK_BRICKS, ModBlocks.SLUDGE,
                ModBlocks.HIVE_SOIL, ModBlocks.HIVE_EGG)) {
            dropSelf(b.get());
        }
        add(ModBlocks.GLOWVINE.get(), createShearsOnlyDrop(ModBlocks.GLOWVINE.get()));
        add(ModBlocks.GLOWVINE_PLANT.get(), createShearsOnlyDrop(ModBlocks.GLOWVINE.get()));
        add(ModBlocks.FOGCAP_BLOCK.get(), b -> createMushroomBlockDrop(b, ModBlocks.FOGCAP.get()));
        add(ModBlocks.SPIRE_FERN.get(), b -> createDoublePlantShearsDrop(b));

        // ---- Biomes v2 ----
        add(ModBlocks.REED.get(), b -> createSinglePropConditionTable(b, net.minecraft.world.level.block.DoublePlantBlock.HALF,
                net.minecraft.world.level.block.state.properties.DoubleBlockHalf.LOWER));
        add(ModBlocks.ROTTEN_SHRUB.get(), b -> createShearsDispatchTable(b, (net.minecraft.world.level.storage.loot.entries.LootPoolEntryContainer.Builder<?>) applyExplosionDecay(b,
                net.minecraft.world.level.storage.loot.entries.LootItem.lootTableItem(net.minecraft.world.item.Items.STICK)
                        .apply(net.minecraft.world.level.storage.loot.functions.SetItemCountFunction.setCount(net.minecraft.world.level.storage.loot.providers.number.UniformGenerator.between(0, 2))))));
        dropSelf(ModBlocks.POLLUTED_CORAL_BLOCK.get());
        for (var coral : List.of(ModBlocks.POLLUTED_TUBE_CORAL, ModBlocks.POLLUTED_HORN_CORAL, ModBlocks.POLLUTED_CORAL_FAN)) dropWhenSilkTouch(coral.get());
        add(ModBlocks.POLLUTED_CORAL_WALL_FAN.get(), createSilkTouchOnlyTable(ModBlocks.POLLUTED_CORAL_FAN.get()));
        add(ModBlocks.POLLUTED_SEAGRASS.get(), createShearsOnlyDrop(ModBlocks.POLLUTED_SEAGRASS.get()));
        dropSelf(ModBlocks.POLLUTED_KELP.get());
        dropOther(ModBlocks.POLLUTED_KELP_PLANT.get(), ModBlocks.POLLUTED_KELP.get());
        for (var b : List.of(ModBlocks.LANTERN_CAP, ModBlocks.CORAL_CAP, ModBlocks.BLUEBELL_CAP, ModBlocks.SHELF_FUNGUS, ModBlocks.GLOW_SHRUB,
                ModBlocks.GLOW_MOSS_CARPET, ModBlocks.HIVE_COMB, ModBlocks.HIVE_SHROOM, ModBlocks.QUICKSAND)) {
            dropSelf(b.get());
        }
        add(ModBlocks.LANTERN_CAP_BLOCK.get(), b -> createMushroomBlockDrop(b, ModBlocks.LANTERN_CAP.get()));
        add(ModBlocks.CORAL_CAP_BLOCK.get(), b -> createMushroomBlockDrop(b, ModBlocks.CORAL_CAP.get()));
        add(ModBlocks.BLUEBELL_CAP_BLOCK.get(), b -> createMushroomBlockDrop(b, ModBlocks.BLUEBELL_CAP.get()));
        add(ModBlocks.HIVE_SHROOM_BLOCK.get(), b -> createMushroomBlockDrop(b, ModBlocks.HIVE_SHROOM.get()));
        // ink bubble: 40 % an Ink Bubble item
        add(ModBlocks.INK_BUBBLE.get(), net.minecraft.world.level.storage.loot.LootTable.lootTable().withPool(net.minecraft.world.level.storage.loot.LootPool.lootPool()
                .setRolls(net.minecraft.world.level.storage.loot.providers.number.ConstantValue.exactly(1))
                .add(net.minecraft.world.level.storage.loot.entries.LootItem.lootTableItem(com.mockingjam.spirecraft.registry.ModItems.INK_BUBBLE.get()))
                .when(net.minecraft.world.level.storage.loot.predicates.LootItemRandomChanceCondition.randomChance(0.4F))));
        // hive cache: a share of the hive's hoard
        add(ModBlocks.HIVE_CACHE.get(), hiveCache());

    }

    /** The hive cache's hoard: bones, honey, gold, scrap, and sometimes a common relic or a potion of capacity. */
    private LootTable.Builder hiveCache() {
        var items = net.minecraft.world.item.Items.class;
        var pool = net.minecraft.world.level.storage.loot.LootPool.lootPool().setRolls(net.minecraft.world.level.storage.loot.providers.number.UniformGenerator.between(3, 5))
                .add(net.minecraft.world.level.storage.loot.entries.LootItem.lootTableItem(net.minecraft.world.item.Items.BONE).setWeight(20)
                        .apply(net.minecraft.world.level.storage.loot.functions.SetItemCountFunction.setCount(net.minecraft.world.level.storage.loot.providers.number.UniformGenerator.between(1, 4))))
                .add(net.minecraft.world.level.storage.loot.entries.LootItem.lootTableItem(net.minecraft.world.item.Items.HONEYCOMB).setWeight(15)
                        .apply(net.minecraft.world.level.storage.loot.functions.SetItemCountFunction.setCount(net.minecraft.world.level.storage.loot.providers.number.UniformGenerator.between(1, 3))))
                .add(net.minecraft.world.level.storage.loot.entries.LootItem.lootTableItem(net.minecraft.world.item.Items.HONEY_BOTTLE).setWeight(8))
                .add(net.minecraft.world.level.storage.loot.entries.LootItem.lootTableItem(net.minecraft.world.item.Items.GOLD_NUGGET).setWeight(15)
                        .apply(net.minecraft.world.level.storage.loot.functions.SetItemCountFunction.setCount(net.minecraft.world.level.storage.loot.providers.number.UniformGenerator.between(2, 6))))
                .add(net.minecraft.world.level.storage.loot.entries.LootItem.lootTableItem(com.mockingjam.spirecraft.registry.ModItems.SCRAP.get()).setWeight(12)
                        .apply(net.minecraft.world.level.storage.loot.functions.SetItemCountFunction.setCount(net.minecraft.world.level.storage.loot.providers.number.UniformGenerator.between(1, 3))))
                .add(net.minecraft.world.level.storage.loot.entries.LootItem.lootTableItem(com.mockingjam.spirecraft.registry.ModBlocks.HIVE_EGG.get()).setWeight(6));
        var relics = net.minecraft.world.level.storage.loot.LootPool.lootPool().setRolls(net.minecraft.world.level.storage.loot.providers.number.ConstantValue.exactly(1))
                .when(net.minecraft.world.level.storage.loot.predicates.LootItemRandomChanceCondition.randomChance(0.15F));
        for (var relic : com.mockingjam.spirecraft.relic.RelicEvents.COMMON) relics.add(net.minecraft.world.level.storage.loot.entries.LootItem.lootTableItem(relic.get()));
        return LootTable.lootTable().withPool(pool).withPool(relics);
    }

    /** min–max items, +1 per Fortune level, silk touch drops the ore. */
    private LootTable.Builder createMultiOreDrops(Block block, Item drop, float min, float max) {
        var enchantments = registries.lookupOrThrow(Registries.ENCHANTMENT);
        return createSilkTouchDispatchTable(block, (LootPoolEntryContainer.Builder<?>) applyExplosionDecay(block,
                LootItem.lootTableItem(drop)
                        .apply(SetItemCountFunction.setCount(UniformGenerator.between(min, max)))
                        .apply(ApplyBonusCount.addUniformBonusCount(enchantments.getOrThrow(Enchantments.FORTUNE)))));
    }

    @Override
    protected Iterable<Block> getKnownBlocks() {
        return ModBlocks.BLOCKS.getEntries().stream().<Block>map(RegistryObject::get).toList();
    }
}
