package com.mockingjam.spirecraft.item;

import com.mockingjam.spirecraft.registry.ModItems;
import java.util.List;
import java.util.Map;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.storage.loot.LootPool;
import net.minecraft.world.level.storage.loot.entries.EmptyLootItem;
import net.minecraft.world.level.storage.loot.entries.LootItem;
import net.minecraft.world.level.storage.loot.functions.SetItemCountFunction;
import net.minecraft.world.level.storage.loot.providers.number.ConstantValue;
import net.minecraft.world.level.storage.loot.providers.number.UniformGenerator;
import net.minecraftforge.event.LootTableLoadEvent;
import net.minecraftforge.event.entity.player.PlayerEvent;

/** Fruit bonuses survive death; fruits are found in vanilla chests (biome plants come in phase 7). */
public final class FoodEvents {
    public static final List<String> FRUITS = List.of("strawberry", "pear", "mango");

    /** Chest loot: table → (fruit, chance per chest, max count). */
    private record ChestLoot(java.util.function.Supplier<Item> item, float chance, int max) {}

    private static final ChestLoot STRAWBERRY = new ChestLoot(() -> ModItems.STRAWBERRY.get(), 0.40F, 3);
    private static final ChestLoot PEAR = new ChestLoot(() -> ModItems.PEAR.get(), 0.25F, 2);
    private static final ChestLoot MANGO = new ChestLoot(() -> ModItems.MANGO.get(), 0.20F, 1);

    private static final Map<String, ChestLoot> CHESTS = Map.ofEntries(
            Map.entry("chests/village/village_plains_house", STRAWBERRY),
            Map.entry("chests/village/village_desert_house", STRAWBERRY),
            Map.entry("chests/village/village_taiga_house", STRAWBERRY),
            Map.entry("chests/village/village_snowy_house", STRAWBERRY),
            Map.entry("chests/village/village_savanna_house", STRAWBERRY),
            Map.entry("chests/simple_dungeon", PEAR),
            Map.entry("chests/abandoned_mineshaft", PEAR),
            Map.entry("chests/ancient_city", MANGO),
            Map.entry("chests/end_city_treasure", MANGO),
            Map.entry("chests/bastion_treasure", MANGO));

    private FoodEvents() {}

    public static void register() {
        PlayerEvent.Clone.BUS.addListener(FoodEvents::onClone);
        LootTableLoadEvent.BUS.addListener(FoodEvents::onLootLoad);
    }

    /** Vanilla only keeps base values on death, so copy our permanent fruit modifiers to the respawned player. */
    private static void onClone(PlayerEvent.Clone event) {
        copyFruitBonuses(event.getOriginal(), event.getEntity());
    }

    public static void copyFruitBonuses(net.minecraft.world.entity.player.Player from, net.minecraft.world.entity.player.Player to) {
        var oldHealth = from.getAttribute(Attributes.MAX_HEALTH);
        var newHealth = to.getAttribute(Attributes.MAX_HEALTH);
        if (oldHealth == null || newHealth == null) return;
        for (String fruit : FRUITS) {
            ResourceLocation id = SpireFoods.Fruit.bonusId(fruit);
            var modifier = oldHealth.getModifier(id);
            if (modifier != null && !newHealth.hasModifier(id)) newHealth.addPermanentModifier(modifier);
        }
    }

    private static void onLootLoad(LootTableLoadEvent event) {
        if (!"minecraft".equals(event.getName().getNamespace())) return;
        ChestLoot loot = CHESTS.get(event.getName().getPath());
        if (loot == null || event.getTable() == null) return;
        int hit = Math.round(loot.chance() * 100);
        event.getTable().addPool(LootPool.lootPool()
                .name("spirecraft_fruit")
                .setRolls(ConstantValue.exactly(1))
                .add(LootItem.lootTableItem(loot.item().get()).setWeight(hit)
                        .apply(SetItemCountFunction.setCount(UniformGenerator.between(1, loot.max()))))
                .add(EmptyLootItem.emptyItem().setWeight(100 - hit))
                .build());
    }
}
