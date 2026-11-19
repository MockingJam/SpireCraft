package com.mockingjam.spirecraft.datagen;

import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mockingjam.spirecraft.registry.ModEntities;
import com.mockingjam.spirecraft.relic.RelicEvents;
import java.util.List;
import java.util.stream.Stream;
import net.minecraft.core.HolderLookup;
import net.minecraft.data.loot.EntityLootSubProvider;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.flag.FeatureFlags;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.ItemLike;
import net.minecraft.world.level.storage.loot.LootPool;
import net.minecraft.world.level.storage.loot.LootTable;
import net.minecraft.world.level.storage.loot.entries.LootItem;
import net.minecraft.world.level.storage.loot.functions.EnchantedCountIncreaseFunction;
import net.minecraft.world.level.storage.loot.functions.SetItemCountFunction;
import net.minecraft.world.level.storage.loot.predicates.LootItemKilledByPlayerCondition;
import net.minecraft.world.level.storage.loot.predicates.LootItemRandomChanceCondition;
import net.minecraft.world.level.storage.loot.providers.number.ConstantValue;
import net.minecraft.world.level.storage.loot.providers.number.UniformGenerator;
import net.minecraftforge.registries.RegistryObject;

/** Phase 8 mob drops (docs/design/mobs.md). Elites and the boss pull from the phase 5 relic pools. */
public class ModEntityLootProvider extends EntityLootSubProvider {
    public ModEntityLootProvider(HolderLookup.Provider registries) {
        super(FeatureFlags.REGISTRY.allFlags(), registries);
    }

    @Override
    protected Stream<EntityType<?>> getKnownEntityTypes() {
        return Stream.concat(Stream.of(ModEntities.LEAF_SLIME, ModEntities.TWIG_SLIME, ModEntities.FUZZY_WURM_CRAWLER, ModEntities.FLYCONID,
                ModEntities.NIBBIT, ModEntities.SHRINKER_BEETLE, ModEntities.BYRDONIS, ModEntities.CEREMONIAL_BEAST, ModEntities.OSTY,
                ModEntities.CORPSE_SLUG, ModEntities.TOADPOLE, ModEntities.TWO_TAILED_RAT, ModEntities.SEAPUNK, ModEntities.TERROR_EEL, ModEntities.SOUL_FYSH,
                ModEntities.BOWLBUG_ROCK, ModEntities.BOWLBUG_EGG, ModEntities.BOWLBUG_SILK, ModEntities.BOWLBUG_NECTAR, ModEntities.EXOSKELETON, ModEntities.CHOMPER,
                ModEntities.MYTE, ModEntities.ENTOMANCER, ModEntities.KAISER_CRAB, ModEntities.KNOWLEDGE_DEMON)
                .<EntityType<?>>map(RegistryObject::get),
                ModEntities.SCRIPTED.values().stream().map(RegistryObject::get));
    }

    @Override
    public void generate() {
        add(ModEntities.LEAF_SLIME.get(), LootTable.lootTable()
                .withPool(drop(Items.SLIME_BALL, 0, 2))
                .withPool(drop(ModBlocks.GNARLWOOD.leaves.get(), 0, 1)));
        add(ModEntities.TWIG_SLIME.get(), LootTable.lootTable()
                .withPool(drop(Items.SLIME_BALL, 0, 2))
                .withPool(drop(Items.STICK, 0, 3)));
        add(ModEntities.FUZZY_WURM_CRAWLER.get(), LootTable.lootTable()
                .withPool(drop(Items.STRING, 0, 2))
                .withPool(drop(Items.SPIDER_EYE, 0, 1).when(LootItemKilledByPlayerCondition.killedByPlayer())));
        add(ModEntities.FLYCONID.get(), LootTable.lootTable()
                .withPool(drop(ModBlocks.FOGCAP.get(), 0, 2))
                .withPool(drop(Items.BONE_MEAL, 0, 2)));
        add(ModEntities.NIBBIT.get(), LootTable.lootTable()
                .withPool(drop(Items.LEATHER, 0, 2))
                .withPool(drop(Items.BEEF, 1, 2)));
        add(ModEntities.SHRINKER_BEETLE.get(), LootTable.lootTable()
                .withPool(drop(Items.SPIDER_EYE, 0, 1)));
        // Elite: feathers and chicken, and a 50 % chance of a common relic
        add(ModEntities.BYRDONIS.get(), LootTable.lootTable()
                .withPool(drop(com.mockingjam.spirecraft.registry.ModItems.RELIC_FRAGMENT.get(), 1, 1).when(LootItemKilledByPlayerCondition.killedByPlayer()).when(LootItemRandomChanceCondition.randomChance(0.3F)))
                .withPool(drop(Items.FEATHER, 2, 5))
                .withPool(drop(Items.CHICKEN, 1, 3))
                .withPool(relic(RelicEvents.COMMON).when(LootItemKilledByPlayerCondition.killedByPlayer())
                        .when(LootItemRandomChanceCondition.randomChance(0.5F))));
        // Boss: a rare relic every time
        add(ModEntities.CEREMONIAL_BEAST.get(), LootTable.lootTable()
                .withPool(drop(com.mockingjam.spirecraft.registry.ModItems.RELIC_FRAGMENT.get(), 2, 3))
                .withPool(relic(RelicEvents.RARE))
                .withPool(drop(Items.BONE, 3, 6))
                .withPool(drop(Items.LEATHER, 3, 6)));
        add(ModEntities.OSTY.get(), LootTable.lootTable());
        // batch 2: Underdocks
        add(ModEntities.CORPSE_SLUG.get(), LootTable.lootTable()
                .withPool(drop(Items.SLIME_BALL, 0, 2))
                .withPool(drop(Items.KELP, 0, 2)));
        add(ModEntities.TOADPOLE.get(), LootTable.lootTable()
                .withPool(drop(Items.SLIME_BALL, 0, 1))
                .withPool(drop(Items.PRISMARINE_SHARD, 0, 1).when(LootItemKilledByPlayerCondition.killedByPlayer())));
        add(ModEntities.TWO_TAILED_RAT.get(), LootTable.lootTable()
                .withPool(drop(Items.ROTTEN_FLESH, 0, 1))
                .withPool(drop(Items.STRING, 0, 1)));
        add(ModEntities.SEAPUNK.get(), LootTable.lootTable()
                .withPool(drop(Items.KELP, 1, 3))
                .withPool(drop(Items.SEAGRASS, 0, 2))
                .withPool(drop(Items.SLIME_BALL, 0, 1)));
        // Elite: fish and prismarine, and a 50 % chance of a common relic
        add(ModEntities.TERROR_EEL.get(), LootTable.lootTable()
                .withPool(drop(com.mockingjam.spirecraft.registry.ModItems.RELIC_FRAGMENT.get(), 1, 1).when(LootItemKilledByPlayerCondition.killedByPlayer()).when(LootItemRandomChanceCondition.randomChance(0.3F)))
                .withPool(drop(Items.COD, 1, 3))
                .withPool(drop(Items.SALMON, 0, 2))
                .withPool(drop(Items.PRISMARINE_SHARD, 1, 3))
                .withPool(relic(RelicEvents.COMMON).when(LootItemKilledByPlayerCondition.killedByPlayer())
                        .when(LootItemRandomChanceCondition.randomChance(0.5F))));
        // Boss: a rare relic every time, and its bladder
        add(ModEntities.SOUL_FYSH.get(), LootTable.lootTable()
                .withPool(drop(com.mockingjam.spirecraft.registry.ModItems.RELIC_FRAGMENT.get(), 2, 3))
                .withPool(relic(RelicEvents.RARE))
                .withPool(drop(com.mockingjam.spirecraft.registry.ModItems.SOUL_FYSH_BLADDER.get(), 1, 1))
                .withPool(drop(Items.PRISMARINE_CRYSTALS, 3, 6)));
        // batch 3: the Hive
        add(ModEntities.BOWLBUG_ROCK.get(), LootTable.lootTable()
                .withPool(drop(Items.COBBLESTONE, 1, 3))
                .withPool(drop(Items.FLINT, 0, 1)));
        add(ModEntities.BOWLBUG_EGG.get(), LootTable.lootTable()
                .withPool(drop(ModBlocks.HIVE_EGG.get(), 0, 1).when(LootItemKilledByPlayerCondition.killedByPlayer())));
        add(ModEntities.BOWLBUG_SILK.get(), LootTable.lootTable()
                .withPool(drop(Items.STRING, 1, 3)));
        add(ModEntities.BOWLBUG_NECTAR.get(), LootTable.lootTable()
                .withPool(drop(Items.HONEYCOMB, 0, 2))
                .withPool(drop(Items.HONEY_BOTTLE, 1, 1).when(LootItemRandomChanceCondition.randomChance(0.25F))));
        add(ModEntities.EXOSKELETON.get(), LootTable.lootTable()
                .withPool(drop(Items.BONE_MEAL, 0, 2))
                .withPool(drop(Items.STRING, 0, 1)));
        add(ModEntities.CHOMPER.get(), LootTable.lootTable()
                .withPool(drop(Items.GOLD_NUGGET, 1, 4))
                .withPool(drop(Items.COPPER_INGOT, 0, 1).when(LootItemKilledByPlayerCondition.killedByPlayer())));
        add(ModEntities.MYTE.get(), LootTable.lootTable()
                .withPool(drop(Items.SPIDER_EYE, 0, 1))
                .withPool(drop(Items.STRING, 0, 2)));
        // Elite: honeycomb and honey, and a 50 % chance of a common relic
        add(ModEntities.ENTOMANCER.get(), LootTable.lootTable()
                .withPool(drop(com.mockingjam.spirecraft.registry.ModItems.RELIC_FRAGMENT.get(), 1, 1).when(LootItemKilledByPlayerCondition.killedByPlayer()).when(LootItemRandomChanceCondition.randomChance(0.3F)))
                .withPool(drop(Items.HONEYCOMB, 2, 4))
                .withPool(drop(Items.HONEY_BOTTLE, 1, 2))
                .withPool(relic(RelicEvents.COMMON).when(LootItemKilledByPlayerCondition.killedByPlayer())
                        .when(LootItemRandomChanceCondition.randomChance(0.5F))));
        // Bosses: a rare relic every time
        add(ModEntities.KAISER_CRAB.get(), LootTable.lootTable()
                .withPool(drop(com.mockingjam.spirecraft.registry.ModItems.RELIC_FRAGMENT.get(), 2, 3))
                .withPool(relic(RelicEvents.RARE))
                .withPool(drop(Items.COPPER_INGOT, 4, 8))
                .withPool(drop(Items.IRON_INGOT, 2, 5)));
        add(ModEntities.KNOWLEDGE_DEMON.get(), LootTable.lootTable()
                .withPool(drop(com.mockingjam.spirecraft.registry.ModItems.RELIC_FRAGMENT.get(), 2, 3))
                .withPool(relic(RelicEvents.RARE))
                .withPool(LootPool.lootPool().setRolls(ConstantValue.exactly(1)).add(LootItem.lootTableItem(Items.BOOK)
                        .apply(net.minecraft.world.level.storage.loot.functions.EnchantRandomlyFunction.randomApplicableEnchantment(registries))))
                .withPool(drop(Items.PAPER, 3, 8)));
        scripted();
    }

    /** §11: the data-driven monsters' drops, from their definitions (elites: 50 % common relic; bosses: a rare relic). */
    private void scripted() {
        for (var d : com.mockingjam.spirecraft.mob.ScriptedDefs.ALL.values()) {
            var table = LootTable.lootTable();
            for (var drop : d.loot) {
                var pool = drop(drop.item().get(), drop.min(), drop.max());
                if (drop.chance() < 1) pool.when(LootItemRandomChanceCondition.randomChance(drop.chance()));
                if (drop.byPlayer()) pool.when(LootItemKilledByPlayerCondition.killedByPlayer());
                table.withPool(pool);
            }
            if (d.relic == 2) table.withPool(relic(RelicEvents.RARE)).withPool(drop(com.mockingjam.spirecraft.registry.ModItems.RELIC_FRAGMENT.get(), 2, 3));
            if (d.elite) table.withPool(drop(com.mockingjam.spirecraft.registry.ModItems.RELIC_FRAGMENT.get(), 1, 1).when(LootItemKilledByPlayerCondition.killedByPlayer()).when(LootItemRandomChanceCondition.randomChance(0.3F)));
            else if (d.elite) table.withPool(relic(RelicEvents.COMMON).when(LootItemKilledByPlayerCondition.killedByPlayer())
                    .when(LootItemRandomChanceCondition.randomChance(d.relic == 1 ? 0.5F : 0.15F)));
            add(ModEntities.SCRIPTED.get(d.name).get(), table);
        }
    }

    private LootPool.Builder drop(ItemLike item, float min, float max) {
        return LootPool.lootPool().setRolls(ConstantValue.exactly(1))
                .add(LootItem.lootTableItem(item)
                        .apply(SetItemCountFunction.setCount(UniformGenerator.between(min, max)))
                        .apply(EnchantedCountIncreaseFunction.lootingMultiplier(registries, UniformGenerator.between(0, 1))));
    }

    private static LootPool.Builder relic(List<RegistryObject<Item>> pool) {
        var builder = LootPool.lootPool().setRolls(ConstantValue.exactly(1));
        for (var relic : pool) builder.add(LootItem.lootTableItem(relic.get()));
        return builder;
    }
}
