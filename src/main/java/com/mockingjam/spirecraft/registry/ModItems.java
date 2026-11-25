package com.mockingjam.spirecraft.registry;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.item.BrimstoneItem;
import com.mockingjam.spirecraft.item.GalacticDustItem;
import com.mockingjam.spirecraft.item.OrichalcumGear;
import com.mockingjam.spirecraft.item.RelicItem;
import com.mockingjam.spirecraft.item.RelicPouchItem;
import com.mockingjam.spirecraft.item.SpireFoods;
import com.mockingjam.spirecraft.weapon.BloodlettingDagger;
import com.mockingjam.spirecraft.weapon.ReapingScythe;
import com.mockingjam.spirecraft.weapon.SovereignBlade;
import com.mockingjam.spirecraft.weapon.SpireWeapon;
import com.mockingjam.spirecraft.weapon.ThrownWeaponItem;
import com.mockingjam.spirecraft.weapon.FlakCannonItem;
import com.mockingjam.spirecraft.weapon.DirgeFlute;
import com.mockingjam.spirecraft.weapon.ChargeCoreItem;
import com.mockingjam.spirecraft.weapon.AbilityWeapon;
import com.mockingjam.spirecraft.weapon.Abilities;
import com.mockingjam.spirecraft.weapon.Slingshot;
import java.util.List;
import java.util.Optional;
import net.minecraft.core.component.DataComponents;
import net.minecraft.tags.DamageTypeTags;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.EquipmentSlotGroup;
import net.minecraft.world.entity.ai.attributes.AttributeModifier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.item.component.BlocksAttacks;
import net.minecraft.world.item.component.ItemAttributeModifiers;
import net.minecraft.world.item.component.Weapon;
import com.mockingjam.spirecraft.weapon.projectile.ShivProjectile;
import com.mockingjam.spirecraft.weapon.projectile.PoisonFlask;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.world.item.ToolMaterial;
import net.minecraft.world.food.FoodProperties;
import java.util.function.Function;
import java.util.function.Supplier;
import net.minecraft.resources.ResourceKey;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.Rarity;
import net.minecraft.world.item.equipment.ArmorType;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

/**
 * All items of the mod. Since 1.21.2 every Item.Properties must carry its registry id, so always go through {@link #register}.
 * Properties are created lazily (some builders, e.g. sword(), read registries and must not run during class init).
 */
public final class ModItems {
    public static final DeferredRegister<Item> ITEMS = DeferredRegister.create(ForgeRegistries.ITEMS, SpireCraft.MODID);

    // ---- Relics (phase 5): active while inside a relic pouch the player carries. docs/design/relics.md ----
    public static final RegistryObject<Item> RELIC_POUCH = register("relic_pouch", RelicPouchItem::new,
            () -> new Item.Properties().stacksTo(1).rarity(Rarity.UNCOMMON));
    /** Tungsten Rod (STS2 rare relic): every HP loss is 1 smaller. */
    public static final RegistryObject<Item> TUNGSTEN_ROD = relic("tungsten_rod", RelicItem.Tier.RARE);
    public static final RegistryObject<Item> BURNING_BLOOD = relic("burning_blood", RelicItem.Tier.STARTER);
    public static final RegistryObject<Item> ANCHOR = relic("anchor", RelicItem.Tier.COMMON);
    public static final RegistryObject<Item> VAJRA = relic("vajra", RelicItem.Tier.COMMON);
    public static final RegistryObject<Item> ODDLY_SMOOTH_STONE = relic("oddly_smooth_stone", RelicItem.Tier.COMMON);
    public static final RegistryObject<Item> BAG_OF_MARBLES = relic("bag_of_marbles", RelicItem.Tier.COMMON);
    public static final RegistryObject<Item> RED_MASK = relic("red_mask", RelicItem.Tier.COMMON);
    public static final RegistryObject<Item> BRONZE_SCALES = relic("bronze_scales", RelicItem.Tier.COMMON);
    public static final RegistryObject<Item> BLOOD_VIAL = relic("blood_vial", RelicItem.Tier.COMMON);
    public static final RegistryObject<Item> RED_SKULL = relic("red_skull", RelicItem.Tier.COMMON);
    public static final RegistryObject<Item> PEN_NIB = relic("pen_nib", RelicItem.Tier.UNCOMMON);
    public static final RegistryObject<Item> MERCURY_HOURGLASS = relic("mercury_hourglass", RelicItem.Tier.UNCOMMON);
    public static final RegistryObject<Item> SHURIKEN = relic("shuriken", RelicItem.Tier.RARE);
    public static final RegistryObject<Item> LIZARD_TAIL = relic("lizard_tail", RelicItem.Tier.RARE);

    // ---- Tungsten (Tungsten Rod) ----
    public static final RegistryObject<Item> RAW_TUNGSTEN = register("raw_tungsten");
    public static final RegistryObject<Item> TUNGSTEN_INGOT = register("tungsten_ingot");
    public static final RegistryObject<Item> TUNGSTEN_ALLOY_INGOT = register("tungsten_alloy_ingot");
    /** v3.4: the automaton alloy (Defect's machines) - copper with gold and quartz. */
    public static final RegistryObject<Item> AUTOMATON_ALLOY_INGOT = register("automaton_alloy_ingot");
    public static final RegistryObject<Item> TUNGSTEN_HELMET = tungstenArmor("tungsten_helmet", ArmorType.HELMET);
    public static final RegistryObject<Item> TUNGSTEN_CHESTPLATE = tungstenArmor("tungsten_chestplate", ArmorType.CHESTPLATE);
    public static final RegistryObject<Item> TUNGSTEN_LEGGINGS = tungstenArmor("tungsten_leggings", ArmorType.LEGGINGS);
    public static final RegistryObject<Item> TUNGSTEN_BOOTS = tungstenArmor("tungsten_boots", ArmorType.BOOTS);

    // ---- Orichalcum (never breaks; attack/speed values follow vanilla diamond tools) ----
    public static final RegistryObject<Item> RAW_ORICHALCUM = register("raw_orichalcum");
    public static final RegistryObject<Item> ORICHALCUM_INGOT = register("orichalcum_ingot", Item::new,
            () -> new Item.Properties().rarity(Rarity.UNCOMMON));
    public static final RegistryObject<Item> ORICHALCUM_SWORD = register("orichalcum_sword", OrichalcumGear.Basic::new,
            () -> new Item.Properties().sword(ModMaterials.ORICHALCUM_TOOL, 3.0F, -2.4F));
    public static final RegistryObject<Item> ORICHALCUM_PICKAXE = register("orichalcum_pickaxe", OrichalcumGear.Basic::new,
            () -> new Item.Properties().pickaxe(ModMaterials.ORICHALCUM_TOOL, 1.0F, -2.8F));
    public static final RegistryObject<Item> ORICHALCUM_AXE = register("orichalcum_axe",
            p -> new OrichalcumGear.Axe(ModMaterials.ORICHALCUM_TOOL, 5.0F, -3.0F, p), Item.Properties::new);
    public static final RegistryObject<Item> ORICHALCUM_SHOVEL = register("orichalcum_shovel",
            p -> new OrichalcumGear.Shovel(ModMaterials.ORICHALCUM_TOOL, 1.5F, -3.0F, p), Item.Properties::new);
    public static final RegistryObject<Item> ORICHALCUM_HOE = register("orichalcum_hoe",
            p -> new OrichalcumGear.Hoe(ModMaterials.ORICHALCUM_TOOL, -3.0F, 0.0F, p), Item.Properties::new);
    public static final RegistryObject<Item> ORICHALCUM_HELMET = orichalcumArmor("orichalcum_helmet", ArmorType.HELMET);
    public static final RegistryObject<Item> ORICHALCUM_CHESTPLATE = orichalcumArmor("orichalcum_chestplate", ArmorType.CHESTPLATE);
    public static final RegistryObject<Item> ORICHALCUM_LEGGINGS = orichalcumArmor("orichalcum_leggings", ArmorType.LEGGINGS);
    public static final RegistryObject<Item> ORICHALCUM_BOOTS = orichalcumArmor("orichalcum_boots", ArmorType.BOOTS);

    // ---- Brimstone (Ironclad) ----
    public static final RegistryObject<Item> BRIMSTONE = register("brimstone", BrimstoneItem::new, Item.Properties::new);

    // ---- Lava Rock (Neow): consumed when a boss dies, doubling its loot ----
    public static final RegistryObject<Item> LAVA_ROCK_SHARD = register("lava_rock_shard");
    public static final RegistryObject<Item> LAVA_ROCK = register("lava_rock", Item::new,
            () -> new Item.Properties().stacksTo(16).rarity(Rarity.RARE));
    /** §11: Relic Fragment (遗物残片) - the smithing template every craftable relic is made with; only elites and bosses drop it. */
    public static final RegistryObject<Item> RELIC_FRAGMENT = register("relic_fragment", Item::new, () -> new Item.Properties().rarity(Rarity.UNCOMMON));
    // §11: calling tokens of the other act bosses (mob/BossSummonItem)
    public static final RegistryObject<Item> BLACK_QUILL = summon("black_quill", "vantom", java.util.List.of(com.mockingjam.spirecraft.worldgen.ModBiomes.OVERGROWTH, com.mockingjam.spirecraft.worldgen.ModBiomes.MISTY_OVERGROWTH, com.mockingjam.spirecraft.worldgen.ModBiomes.MUSHROOM_OVERGROWTH, com.mockingjam.spirecraft.worldgen.ModBiomes.INK_SPRING_CAVES));
    public static final RegistryObject<Item> KIN_IDOL = summon("kin_idol", "kin_priest", com.mockingjam.spirecraft.worldgen.ModBiomes.OVERGROWTHS);
    public static final RegistryObject<Item> STEAM_WHISTLE = summon("steam_whistle", "waterfall_giant", java.util.List.of(com.mockingjam.spirecraft.worldgen.ModBiomes.WATERFALLS, com.mockingjam.spirecraft.worldgen.ModBiomes.STONE_FOREST_DOCKS, com.mockingjam.spirecraft.worldgen.ModBiomes.BEACH_DOCKS));
    public static final RegistryObject<Item> SLUMBER_HORN = summon("slumber_horn", "lagavulin_matriarch", java.util.List.of(com.mockingjam.spirecraft.worldgen.ModBiomes.STONE_FOREST_DOCKS, com.mockingjam.spirecraft.worldgen.ModBiomes.BEACH_DOCKS, com.mockingjam.spirecraft.worldgen.ModBiomes.POLLUTED_SEA));
    public static final RegistryObject<Item> SAND_LURE = summon("sand_lure", "insatiable", java.util.List.of(net.minecraft.world.level.biome.Biomes.DESERT));
    public static final java.util.List<RegistryObject<Item>> BOSS_SUMMONS = java.util.List.of(BLACK_QUILL, KIN_IDOL, STEAM_WHISTLE, SLUMBER_HORN, SAND_LURE);

    private static RegistryObject<Item> summon(String name, String boss, java.util.List<net.minecraft.resources.ResourceKey<net.minecraft.world.level.biome.Biome>> biomes) {
        return register(name, p -> (Item) new com.mockingjam.spirecraft.mob.BossSummonItem(p, boss, biomes), () -> new Item.Properties().stacksTo(16).rarity(Rarity.RARE));
    }

    // ---- Galactic Dust (Regent): experience levels → absorption ----
    public static final RegistryObject<Item> GALACTIC_DUST = register("galactic_dust", GalacticDustItem::new,
            () -> new Item.Properties().rarity(Rarity.UNCOMMON));

    // ---- Phase 4 food (docs/design/consumables.md). Hunger/saturation follow comparable vanilla food. ----
    /** Like sweet berries; first one ever eaten: +2 max health. */
    public static final RegistryObject<Item> STRAWBERRY = register("strawberry", p -> new SpireFoods.Fruit(p, "strawberry", 2),
            () -> new Item.Properties().food(food(2, 0.3F)));
    /** Like an apple; first one ever eaten: +3 max health. */
    public static final RegistryObject<Item> PEAR = register("pear", p -> new SpireFoods.Fruit(p, "pear", 3),
            () -> new Item.Properties().food(food(4, 0.3F)).rarity(Rarity.UNCOMMON));
    /** First one ever eaten: +4 max health. */
    public static final RegistryObject<Item> MANGO = register("mango", p -> new SpireFoods.Fruit(p, "mango", 4),
            () -> new Item.Properties().food(food(6, 0.6F)).rarity(Rarity.RARE));
    /** Like steak; +6 health when eaten at or below half health. */
    public static final RegistryObject<Item> MEAT_ON_THE_BONE = register("meat_on_the_bone", SpireFoods.MeatOnTheBone::new,
            () -> new Item.Properties().food(food(8, 0.8F)));
    public static final RegistryObject<Item> AMETHYST_AUBERGINE = register("amethyst_aubergine", SpireFoods.Aubergine::new,
            () -> new Item.Properties().food(food(4, 0.6F)));

    // ---- Phase 6 weapons v2 (docs/design/weapons.md: the user's 28-weapon roster) ----
    // Shown damage = 1 + material bonus (iron 2) + value; attack speed = 4 + value. Reach adds to entity interaction range.
    // Regent
    public static final RegistryObject<Item> SOVEREIGN_BLADE = register("sovereign_blade", SovereignBlade::new,
            () -> new Item.Properties().sword(ModMaterials.REGAL, 4.0F, -2.4F).rarity(Rarity.UNCOMMON));
    public static final RegistryObject<Item> CRESCENT_SPEAR = register("crescent_spear", p -> new SpireWeapon(p, SpireWeapon.Character.REGENT),
            () -> melee(ToolMaterial.IRON, 3.0F, -2.8F, 1.0));
    public static final RegistryObject<Item> HEIRLOOM_HAMMER = register("heirloom_hammer", p -> new SpireWeapon(p, SpireWeapon.Character.REGENT),
            () -> melee(ToolMaterial.IRON, 6.0F, -3.1F, 0).rarity(Rarity.UNCOMMON));
    public static final RegistryObject<Item> REGENT_STRIKE = weapon("regent_strike", SpireWeapon.Character.REGENT, ToolMaterial.IRON, 2.0F, -2.4F);
    public static final RegistryObject<Item> PHOTON_CUT = weapon("photon_cut", SpireWeapon.Character.REGENT, ToolMaterial.IRON, 3.0F, -2.4F);
    // Necrobinder
    public static final RegistryObject<Item> SCYTHE = register("scythe", ReapingScythe::new, () -> new Item.Properties().sword(ToolMaterial.IRON, 5.0F, -3.0F));
    public static final RegistryObject<Item> SCOURGE = register("scourge", p -> new SpireWeapon(p, SpireWeapon.Character.NECROBINDER),
            () -> melee(ToolMaterial.IRON, 1.0F, -2.8F, 2.0));
    public static final RegistryObject<Item> FORBIDDEN_GRIMOIRE = register("forbidden_grimoire",
            p -> new AbilityWeapon(p, SpireWeapon.Character.NECROBINDER, Abilities::grimoire, Abilities.GRIMOIRE_COOLDOWN),
            () -> new Item.Properties().stacksTo(1).rarity(Rarity.RARE));
    public static final RegistryObject<Item> DIRGE_FLUTE = register("dirge_flute", DirgeFlute::new, () -> new Item.Properties().stacksTo(1));
    public static final RegistryObject<Item> DANSE_MACABRE = register("danse_macabre", p -> new SpireWeapon(p, SpireWeapon.Character.NECROBINDER),
            () -> new Item.Properties().stacksTo(1).rarity(Rarity.UNCOMMON));
    // Silent
    public static final RegistryObject<Item> POISON_FLASK = register("poison_flask", p -> new ThrownWeaponItem(p, SpireWeapon.Character.SILENT,
            PoisonFlask::new, 0.9F, 10, SoundEvents.SPLASH_POTION_THROW), () -> new Item.Properties().stacksTo(8));
    public static final RegistryObject<Item> POISONED_DAGGER = weapon("poisoned_dagger", SpireWeapon.Character.SILENT, ToolMaterial.IRON, 1.0F, -1.8F);
    public static final RegistryObject<Item> INK_DAGGER = register("ink_dagger",
            p -> new AbilityWeapon(p, SpireWeapon.Character.SILENT, Abilities::inkKnives, Abilities.INK_COOLDOWN),
            () -> new Item.Properties().sword(ToolMaterial.IRON, 1.0F, -2.0F));
    public static final RegistryObject<Item> THROWING_KNIFE = register("throwing_knife", p -> new ThrownWeaponItem(p, SpireWeapon.Character.SILENT,
            ShivProjectile::new, 1.7F, 4, SoundEvents.TRIDENT_THROW.value()), () -> new Item.Properties().stacksTo(16));
    public static final RegistryObject<Item> SLINGSHOT = register("slingshot", Slingshot::new, () -> new Item.Properties().durability(384).enchantable(1));
    // Snakebite: a plain, quick blade (no poison) — room for a unique enchantment later
    public static final RegistryObject<Item> SNAKEBITE = weapon("snakebite", SpireWeapon.Character.SILENT, ToolMaterial.IRON, 2.5F, -2.2F);
    // Ironclad
    public static final RegistryObject<Item> CLEAVER = register("cleaver", p -> new SpireWeapon(p, SpireWeapon.Character.IRONCLAD),
            () -> new Item.Properties().sword(ToolMaterial.IRON, 3.5F, -2.6F).component(DataComponents.WEAPON, new Weapon(1, Weapon.AXE_DISABLES_BLOCKING_FOR_SECONDS)));
    public static final RegistryObject<Item> MORNING_STAR = weapon("morning_star", SpireWeapon.Character.IRONCLAD, ModMaterials.TUNGSTEN_WEAPON, 5.5F, -3.1F);
    public static final RegistryObject<Item> INFERNAL_BLADE = register("infernal_blade",
            p -> new AbilityWeapon(p, SpireWeapon.Character.IRONCLAD, Abilities::infernal, Abilities.INFERNAL_COOLDOWN),
            () -> new Item.Properties().sword(ToolMaterial.IRON, 4.0F, -2.6F).rarity(Rarity.UNCOMMON));
    public static final RegistryObject<Item> TANK_SHIELD = register("tank_shield", p -> new SpireWeapon(p, SpireWeapon.Character.IRONCLAD),
            () -> shield(672));
    public static final RegistryObject<Item> BLOODLETTING_DAGGER = register("bloodletting_dagger", BloodlettingDagger::new,
            () -> new Item.Properties().sword(ToolMaterial.IRON, 1.0F, -2.0F));
    public static final RegistryObject<Item> BLUDGEON = register("bludgeon", p -> new SpireWeapon(p, SpireWeapon.Character.IRONCLAD),
            () -> new Item.Properties().sword(ToolMaterial.IRON, 8.0F, -3.4F).component(DataComponents.WEAPON, new Weapon(1, Weapon.AXE_DISABLES_BLOCKING_FOR_SECONDS)));
    // Defect
    public static final RegistryObject<Item> ROCKET_PUNCH = register("rocket_punch",
            p -> new AbilityWeapon(p, SpireWeapon.Character.DEFECT, Abilities::rocketPunch, Abilities.ROCKET_COOLDOWN),
            () -> new Item.Properties().stacksTo(1));
    public static final RegistryObject<Item> ENERGY_CORE = register("energy_core", ChargeCoreItem::new,
            () -> new Item.Properties().stacksTo(1).rarity(Rarity.UNCOMMON));
    public static final RegistryObject<Item> FLAK_CANNON = register("flak_cannon", FlakCannonItem::new,
            () -> new Item.Properties().durability(384).enchantable(10));
    public static final RegistryObject<Item> TESLA_COIL = register("tesla_coil",
            p -> new AbilityWeapon(p, SpireWeapon.Character.DEFECT, Abilities::teslaCoil, Abilities.TESLA_COOLDOWN),
            () -> new Item.Properties().stacksTo(1));
    public static final RegistryObject<Item> SHADOW_SHIELD = register("shadow_shield",
            p -> new AbilityWeapon(p, SpireWeapon.Character.DEFECT, Abilities::shadowShield, Abilities.SHADOW_COOLDOWN),
            () -> new Item.Properties().stacksTo(1).rarity(Rarity.UNCOMMON));
    public static final RegistryObject<Item> LIGHTNING_ROD = register("lightning_rod", p -> new SpireWeapon(p, SpireWeapon.Character.DEFECT),
            () -> shield(336));

    // ---- Phase 8: spawn eggs and the Ceremonial Bell (summons the Overgrowth boss) ----
    public static final RegistryObject<Item> LEAF_SLIME_SPAWN_EGG = egg("leaf_slime", ModEntities.LEAF_SLIME);
    public static final RegistryObject<Item> TWIG_SLIME_SPAWN_EGG = egg("twig_slime", ModEntities.TWIG_SLIME);
    public static final RegistryObject<Item> FUZZY_WURM_CRAWLER_SPAWN_EGG = egg("fuzzy_wurm_crawler", ModEntities.FUZZY_WURM_CRAWLER);
    public static final RegistryObject<Item> FLYCONID_SPAWN_EGG = egg("flyconid", ModEntities.FLYCONID);
    public static final RegistryObject<Item> NIBBIT_SPAWN_EGG = egg("nibbit", ModEntities.NIBBIT);
    public static final RegistryObject<Item> SHRINKER_BEETLE_SPAWN_EGG = egg("shrinker_beetle", ModEntities.SHRINKER_BEETLE);
    public static final RegistryObject<Item> BYRDONIS_SPAWN_EGG = egg("byrdonis", ModEntities.BYRDONIS);
    public static final RegistryObject<Item> CEREMONIAL_BEAST_SPAWN_EGG = egg("ceremonial_beast", ModEntities.CEREMONIAL_BEAST);
    public static final RegistryObject<Item> OSTY_SPAWN_EGG = egg("osty", ModEntities.OSTY);
    /** Ink Bubble (from the ink spring caves): thrown, it bursts on the target — Blindness and Weak (like the ink knives). */
    public static final RegistryObject<Item> INK_BUBBLE = register("ink_bubble", com.mockingjam.spirecraft.item.InkBubbleItem::new,
            () -> new Item.Properties().stacksTo(16));
    // ---- v2.2 ammo: slingshot pebbles, scrap (junk), flak shells
    public static final RegistryObject<Item> PEBBLE = register("pebble");
    public static final RegistryObject<Item> SCRAP = register("scrap");
    /** 2026-11-25: the loose forms of two blocks (four make the block, the block gives four back). */
    public static final RegistryObject<Item> ORANGE_DOUGH_LUMP = register("orange_dough_lump");
    public static final RegistryObject<Item> CORE_CRYSTAL = register("core_crystal");
    /** v3.3: a brick of fired harbour mud (smelted from packed mud); four make dock bricks. */
    public static final RegistryObject<Item> DOCK_BRICK = register("dock_brick");
    public static final RegistryObject<Item> FLAK_SHELL = register("flak_shell");
    /** The Rocket Punch's flying fist (only ever seen as the projectile; 3D model models/item/rocket_fist.json). */
    public static final RegistryObject<Item> ROCKET_FIST = register("rocket_fist", Item::new, () -> new Item.Properties().stacksTo(1));
    // batch 2: Underdocks
    public static final RegistryObject<Item> CORPSE_SLUG_SPAWN_EGG = egg("corpse_slug", ModEntities.CORPSE_SLUG);
    public static final RegistryObject<Item> TOADPOLE_SPAWN_EGG = egg("toadpole", ModEntities.TOADPOLE);
    public static final RegistryObject<Item> TWO_TAILED_RAT_SPAWN_EGG = egg("two_tailed_rat", ModEntities.TWO_TAILED_RAT);
    public static final RegistryObject<Item> SEAPUNK_SPAWN_EGG = egg("seapunk", ModEntities.SEAPUNK);
    public static final RegistryObject<Item> TERROR_EEL_SPAWN_EGG = egg("terror_eel", ModEntities.TERROR_EEL);
    public static final RegistryObject<Item> SOUL_FYSH_SPAWN_EGG = egg("soul_fysh", ModEntities.SOUL_FYSH);
    // batch 3: the Hive
    public static final RegistryObject<Item> BOWLBUG_ROCK_SPAWN_EGG = egg("bowlbug_rock", ModEntities.BOWLBUG_ROCK);
    public static final RegistryObject<Item> BOWLBUG_EGG_SPAWN_EGG = egg("bowlbug_egg", ModEntities.BOWLBUG_EGG);
    public static final RegistryObject<Item> BOWLBUG_SILK_SPAWN_EGG = egg("bowlbug_silk", ModEntities.BOWLBUG_SILK);
    public static final RegistryObject<Item> BOWLBUG_NECTAR_SPAWN_EGG = egg("bowlbug_nectar", ModEntities.BOWLBUG_NECTAR);
    public static final RegistryObject<Item> EXOSKELETON_SPAWN_EGG = egg("exoskeleton", ModEntities.EXOSKELETON);
    public static final RegistryObject<Item> CHOMPER_SPAWN_EGG = egg("chomper", ModEntities.CHOMPER);
    public static final RegistryObject<Item> MYTE_SPAWN_EGG = egg("myte", ModEntities.MYTE);
    public static final RegistryObject<Item> ENTOMANCER_SPAWN_EGG = egg("entomancer", ModEntities.ENTOMANCER);
    public static final RegistryObject<Item> KAISER_CRAB_SPAWN_EGG = egg("kaiser_crab", ModEntities.KAISER_CRAB);
    public static final RegistryObject<Item> KNOWLEDGE_DEMON_SPAWN_EGG = egg("knowledge_demon", ModEntities.KNOWLEDGE_DEMON);
    /** §11: spawn eggs of the data-driven monsters (the entity type is looked up when the item is built). */
    public static final java.util.Map<String, RegistryObject<Item>> SCRIPTED_EGGS = new java.util.LinkedHashMap<>();
    static {
        for (String name : com.mockingjam.spirecraft.mob.ScriptedDefs.ALL.keySet())
            SCRIPTED_EGGS.put(name, register(name + "_spawn_egg", p -> (Item) new net.minecraft.world.item.SpawnEggItem(p),
                    () -> new Item.Properties().spawnEgg(ModEntities.SCRIPTED.get(name).get())));
    }
    public static final java.util.List<RegistryObject<Item>> SPAWN_EGGS = withScripted(LEAF_SLIME_SPAWN_EGG, TWIG_SLIME_SPAWN_EGG,
            FUZZY_WURM_CRAWLER_SPAWN_EGG, FLYCONID_SPAWN_EGG, NIBBIT_SPAWN_EGG, SHRINKER_BEETLE_SPAWN_EGG, BYRDONIS_SPAWN_EGG, CEREMONIAL_BEAST_SPAWN_EGG, OSTY_SPAWN_EGG,
            CORPSE_SLUG_SPAWN_EGG, TOADPOLE_SPAWN_EGG, TWO_TAILED_RAT_SPAWN_EGG, SEAPUNK_SPAWN_EGG, TERROR_EEL_SPAWN_EGG, SOUL_FYSH_SPAWN_EGG,
            BOWLBUG_ROCK_SPAWN_EGG, BOWLBUG_EGG_SPAWN_EGG, BOWLBUG_SILK_SPAWN_EGG, BOWLBUG_NECTAR_SPAWN_EGG, EXOSKELETON_SPAWN_EGG, CHOMPER_SPAWN_EGG, MYTE_SPAWN_EGG, ENTOMANCER_SPAWN_EGG, KAISER_CRAB_SPAWN_EGG, KNOWLEDGE_DEMON_SPAWN_EGG);

    private static java.util.List<RegistryObject<Item>> withScripted(RegistryObject<Item>... eggs) {
        var all = new java.util.ArrayList<>(java.util.List.of(eggs));
        all.addAll(SCRIPTED_EGGS.values());
        return java.util.List.copyOf(all);
    }
    /** The Soul Fysh's Beckon (招引之魂): drains health while carried, dispelled with hunger. */
    public static final RegistryObject<Item> BECKONING_SOUL = register("beckoning_soul", com.mockingjam.spirecraft.item.BeckoningSoul::new,
            () -> new Item.Properties().stacksTo(1).rarity(Rarity.UNCOMMON));
    /** Summons the Soul Fysh in the polluted sea. */
    public static final RegistryObject<Item> SOUL_BAIT = register("soul_bait", com.mockingjam.spirecraft.mob.SoulBait::new,
            () -> new Item.Properties().stacksTo(16).rarity(Rarity.RARE));
    /** The Soul Fysh's boss material. */
    public static final RegistryObject<Item> SOUL_FYSH_BLADDER = register("soul_fysh_bladder", Item::new, () -> new Item.Properties().rarity(Rarity.RARE));
    public static final RegistryObject<Item> CEREMONIAL_BELL = register("ceremonial_bell", com.mockingjam.spirecraft.mob.CeremonialBell::new,
            () -> new Item.Properties().stacksTo(16).rarity(Rarity.RARE));

    private static RegistryObject<Item> egg(String mob, RegistryObject<? extends net.minecraft.world.entity.EntityType<? extends net.minecraft.world.entity.Mob>> type) {
        return register(mob + "_spawn_egg", net.minecraft.world.item.SpawnEggItem::new, () -> new Item.Properties().spawnEgg(type.get()));
    }

    private static RegistryObject<Item> weapon(String name, SpireWeapon.Character character, ToolMaterial material, float damage, float speed) {
        return register(name, p -> new SpireWeapon(p, character), () -> new Item.Properties().sword(material, damage, speed));
    }

    /** Sword properties plus extra reach (entity interaction range) for spears and whips. */
    private static Item.Properties melee(ToolMaterial material, float damage, float speed, double reach) {
        Item.Properties p = new Item.Properties().sword(material, damage, speed);
        if (reach == 0) return p;
        return p.attributes(ItemAttributeModifiers.builder()
                .add(Attributes.ATTACK_DAMAGE, new AttributeModifier(Item.BASE_ATTACK_DAMAGE_ID, damage + material.attackDamageBonus(), AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.MAINHAND)
                .add(Attributes.ATTACK_SPEED, new AttributeModifier(Item.BASE_ATTACK_SPEED_ID, speed, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.MAINHAND)
                .add(Attributes.ENTITY_INTERACTION_RANGE, new AttributeModifier(SpireCraft.id("weapon_reach"), reach, AttributeModifier.Operation.ADD_VALUE), EquipmentSlotGroup.MAINHAND)
                .build());
    }

    /** A shield that blocks like the vanilla one (90° front, full reduction), off-hand friendly. */
    private static Item.Properties shield(int durability) {
        return new Item.Properties().durability(durability).equippableUnswappable(EquipmentSlot.OFFHAND)
                .component(DataComponents.BLOCKS_ATTACKS, new BlocksAttacks(0.25F, 1.0F,
                        List.of(new BlocksAttacks.DamageReduction(90.0F, Optional.empty(), 0.0F, 1.0F)),
                        new BlocksAttacks.ItemDamageFunction(3.0F, 1.0F, 1.0F), Optional.of(DamageTypeTags.BYPASSES_SHIELD),
                        Optional.of(SoundEvents.SHIELD_BLOCK), Optional.of(SoundEvents.SHIELD_BREAK)))
                .component(DataComponents.BREAK_SOUND, SoundEvents.SHIELD_BREAK);
    }

    private ModItems() {}

    private static FoodProperties food(int nutrition, float saturation) {
        return new FoodProperties.Builder().nutrition(nutrition).saturationModifier(saturation).build();
    }

    public static <T extends Item> RegistryObject<T> register(String name, Function<Item.Properties, T> factory, Supplier<Item.Properties> props) {
        ResourceKey<Item> key = ITEMS.key(name);
        return ITEMS.register(name, () -> factory.apply(props.get().setId(key)));
    }

    private static RegistryObject<Item> relic(String name, RelicItem.Tier tier) {
        Rarity rarity = switch (tier) {
            case STARTER, COMMON -> Rarity.COMMON;
            case UNCOMMON, SHOP, EVENT -> Rarity.UNCOMMON;
            case RARE -> Rarity.RARE;
            case ANCIENT -> Rarity.EPIC;
        };
        return register(name, p -> new RelicItem(p, tier), () -> new Item.Properties().stacksTo(1).rarity(rarity));
    }

    public static RegistryObject<Item> register(String name) {
        return register(name, Item::new, Item.Properties::new);
    }

    private static RegistryObject<Item> tungstenArmor(String name, ArmorType type) {
        return register(name, Item::new, () -> new Item.Properties()
                .humanoidArmor(ModMaterials.TUNGSTEN_ARMOR_MATERIAL, type)
                .attributes(ModMaterials.tungstenArmor(type)));
    }

    private static RegistryObject<Item> orichalcumArmor(String name, ArmorType type) {
        return register(name, OrichalcumGear.Basic::new, () -> new Item.Properties()
                .humanoidArmor(ModMaterials.ORICHALCUM_ARMOR_MATERIAL, type)
                .attributes(ModMaterials.orichalcumArmor(type)));
    }
}
