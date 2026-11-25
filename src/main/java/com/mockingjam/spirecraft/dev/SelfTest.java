package com.mockingjam.spirecraft.dev;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mockingjam.spirecraft.registry.ModItems;
import com.mockingjam.spirecraft.item.BrimstoneItem;
import com.mockingjam.spirecraft.item.GalacticDustItem;
import com.mockingjam.spirecraft.item.OrichalcumGear;
import com.mojang.authlib.GameProfile;
import io.netty.channel.embedded.EmbeddedChannel;
import java.util.UUID;
import net.minecraft.network.Connection;
import net.minecraft.network.protocol.PacketFlow;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.server.network.CommonListenerCookie;
import net.minecraft.world.entity.item.ItemEntity;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.biome.Biomes;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.phys.AABB;
import net.minecraft.world.phys.Vec3;
import com.mockingjam.spirecraft.alchemy.ModPotions;
import com.mockingjam.spirecraft.item.FoodEvents;
import com.mockingjam.spirecraft.item.SpireFoods;
import com.mockingjam.spirecraft.item.RelicPouchItem;
import com.mockingjam.spirecraft.relic.RelicEvents;
import com.mockingjam.spirecraft.weapon.BloodlettingDagger;
import com.mockingjam.spirecraft.weapon.ReapingScythe;
import net.minecraft.world.entity.EquipmentSlot;
import com.mockingjam.spirecraft.weapon.SovereignBlade;
import com.mockingjam.spirecraft.weapon.WeaponEvents;
import com.mockingjam.spirecraft.effect.SpireEffectEvents;
import net.minecraft.world.item.Items;
import net.minecraft.world.item.alchemy.Potion;
import net.minecraft.world.item.alchemy.PotionBrewing;
import net.minecraft.world.item.alchemy.PotionContents;
import net.minecraft.world.item.alchemy.Potions;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.storage.loot.BuiltInLootTables;
import net.minecraft.world.level.storage.loot.LootParams;
import net.minecraft.world.level.storage.loot.LootTable;
import net.minecraft.world.level.storage.loot.parameters.LootContextParamSets;
import net.minecraft.world.level.storage.loot.parameters.LootContextParams;
import java.util.ArrayList;
import net.minecraft.core.component.DataComponents;
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.ResourceKey;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Zombie;
import net.minecraft.world.item.ItemStack;
import java.util.List;
import java.util.function.Consumer;
import net.minecraft.core.BlockPos;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.effect.MobEffect;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.EntitySpawnReason;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.animal.IronGolem;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.event.server.ServerStartedEvent;
import net.minecraftforge.registries.RegistryObject;

/**
 * Headless regression test (effects, phase 3 content and ore generation). Runs only when the environment variable
 * SPIRECRAFT_SELFTEST=1 is set (see tools/selftest.ps1), prints PASS/FAIL lines and stops the server.
 * Iron golems are used because they have no armor and plenty of health.
 */
public final class SelfTest {
    private record Step(int waitTicks, Consumer<ServerLevel> action) {}

    private static final List<Step> STEPS = new ArrayList<>();
    private static final List<String> FAILURES = new ArrayList<>();
    private static int stepIndex;
    private static int wait;
    private static boolean running;

    private static IronGolem a, b; // attacker, victim
    private static float mark;
    private static Zombie zombie;
    private static ServerPlayer player;
    private static Vec3 bossPos;
    private static double baseSpeed, baseKnockback;

    private SelfTest() {}

    public static void registerIfEnabled() {
        if (!"1".equals(System.getenv("SPIRECRAFT_SELFTEST"))) return;
        ServerStartedEvent.BUS.addListener(e -> start(e.getServer()));
        TickEvent.ServerTickEvent.Post.BUS.addListener(e -> tick(e.server()));
    }

    // ---------------------------------------------------------------- test plan
    private static void plan() {
        hitCase("base hit", s -> {}, 4f);
        hitCase("strength 3 stacks: 4+3", s -> give(a, ModEffects.STRENGTH, 2), 7f);
        hitCase("weak: 4*0.75", s -> give(a, ModEffects.WEAK, 0), 3f);
        hitCase("vulnerable: 4*1.5", s -> give(b, ModEffects.VULNERABLE, 0), 6f);
        hitCase("strength3+weak+vulnerable: (4+3)*0.75*1.5", s -> {
            give(a, ModEffects.STRENGTH, 2); give(a, ModEffects.WEAK, 0); give(b, ModEffects.VULNERABLE, 0);
        }, 7.875f);

        // Buffer 2: two hits fully blocked, third goes through.
        step(0, s -> { reset(s); give(b, ModEffects.BUFFER, 1); hit(s, 4); });
        step(1, s -> { check("buffer blocks 1st hit", lost(), 0f); check("buffer 2->1 stacks", ModEffects.stacks(b, ModEffects.BUFFER), 1); hit(s, 4); });
        step(1, s -> { check("buffer blocks 2nd hit", lost(), 0f); check("buffer used up", ModEffects.stacks(b, ModEffects.BUFFER), 0); hit(s, 4); });
        step(1, s -> check("3rd hit goes through", lost(), 4f));

        // Artifact 1: first harmful effect blocked, second applies; beneficial effects never blocked.
        step(0, s -> {
            reset(s); give(b, ModEffects.ARTIFACT, 0);
            give(b, ModEffects.STRENGTH, 0);
            check("artifact ignores buffs", b.hasEffect(ModEffects.holder(ModEffects.STRENGTH)) ? 1 : 0, 1);
            give(b, ModEffects.WEAK, 0);
            check("artifact blocks weak", b.hasEffect(ModEffects.holder(ModEffects.WEAK)) ? 1 : 0, 0);
        });
        step(1, s -> {
            check("artifact used up", ModEffects.stacks(b, ModEffects.ARTIFACT), 0);
            give(b, ModEffects.WEAK, 0);
            check("weak applies after artifact", b.hasEffect(ModEffects.holder(ModEffects.WEAK)) ? 1 : 0, 1);
        });

        // Thorns 3 on victim reflects 3 to a melee attacker.
        step(0, s -> { reset(s); give(b, ModEffects.THORNS, 2); mark = a.getHealth(); hit(s, 4); });
        step(1, s -> check("thorns reflects 3", mark - a.getHealth(), 3f));

        // Dexterity / frail on absorption gain (Absorption I = 4).
        absorptionCase("dexterity 2: 4+2", () -> give(b, ModEffects.DEXTERITY, 1), 6f);
        absorptionCase("frail: floor(4*0.75)", () -> give(b, ModEffects.FRAIL, 0), 3f);
        absorptionCase("dexterity2+frail: floor((4+2)*0.75)", () -> { give(b, ModEffects.DEXTERITY, 1); give(b, ModEffects.FRAIL, 0); }, 4f);

        // Poison 3 stacks: no instant damage; exactly one pulse within the next 100 ticks deals 3 and leaves 2 stacks.
        step(0, s -> { reset(s); b.addEffect(new MobEffectInstance(ModEffects.holder(ModEffects.POISON), 1000, 2)); });
        step(1, s -> check("poison: no damage on application", lost(), 0f)); // may flake 1 in 100 if the pulse lands now
        step(100, s -> {
            int left = ModEffects.stacks(b, ModEffects.POISON);
            float lost = lost();
            report("poison pulse decays (lost " + lost + ", stacks " + left + ")", left == 2 && near(lost, 3));
        });

        contentChecks();
        consumableChecks();
        relicChecks();
        weaponChecks();
        rangedChecks();
        biomeChecks();
        mobChecks();
        underdocksChecks();
        hiveChecks();
        scriptedChecks();
        biomeV2Checks();
        structureChecks();
        orbChecks();

        // Doom: stacks >= health kills.
        step(0, s -> { reset(s); b.setHealth(30); give(b, ModEffects.DOOM, 28); }); // 29 stacks < 30 hp
        step(2, s -> { check("doom below health: alive", b.isAlive() ? 1 : 0, 1); give(b, ModEffects.DOOM, 29); }); // 30 stacks
        step(2, s -> check("doom at health: dead", b.isAlive() ? 1 : 0, 0));
    }

    private static com.mockingjam.spirecraft.mob.CeremonialBeast beast;
    private static net.minecraft.world.entity.animal.Pig pig;
    private static double pigStart;

    /** Phase 9 structures (docs/design/structures.md): every template loads, every structure is registered, a few can be found. */
    private static void structureChecks() {
        step(0, s -> {
            reset(s);
            var manager = s.getServer().getStructureManager();
            int bad = 0;
            for (String t : List.of("byrdonis_nest/1", "byrdonis_nest/2", "camp/desert_1", "camp/desert_2", "camp/desert_3", "camp/plains_1", "camp/plains_2", "camp/plains_3", "camp/savanna_1", "camp/savanna_2", "camp/savanna_3", "camp/snowy_1", "camp/snowy_2", "camp/snowy_3", "camp/taiga_1", "camp/taiga_2", "camp/taiga_3", "ceremonial_ruins/11", "ceremonial_ruins/12", "dock_house/house_2", "dock_house/scriptorium_4", "dock_house/small_1", "dock_house/tall_3", "dock_pier/1", "dock_pier/2", "dock_pier/3", "hive/beekeeper_1", "hive/beekeeper_2", "hive/bowlbug_nest_1", "hive/bowlbug_nest_2", "hive/bowlbug_nest_3", "hive/holes_1", "hive/holes_2", "hive/scrap_pile_1", "hive/scrap_pile_2", "kin/hut_big_13", "kin/hut_oval_14", "kin/hut_ritual_16", "kin/hut_round_11", "kin/hut_round_15", "kin/hut_small_12", "kin/hut_small_17", "kin/path_1", "kin/path_2", "kin/path_3", "kin/path_4", "kin/path_5", "kin/plaza", "kin/tree_21", "kin/tree_22", "lighthouse/1", "lighthouse/2", "overgrowth_camp/1", "overgrowth_camp/2", "ruin_pile/ruin_5", "ruin_pile/ruin_6", "ruin_pile/ruin_7", "ruin_pile/vanilla_1", "ruin_pile/vanilla_2", "ruin_pile/vanilla_3", "ruin_pile/vanilla_4", "sailboat/1", "sailboat/2_w", "sailboat/3", "sea_ruins/1", "sea_ruins/2", "sea_ruins/3_big", "sunken_statue/1", "sunken_statue/2", "sword_statue/1", "sword_statue/2", "sword_statue/3", "wellspring/23", "wellspring/24", "wood_carvings/1",
                    // the ascender buildings (issue #30) and the 2026-11-25 additions
                    "ironclad_camp/1", "ironclad_ruin/1", "silent_gathering/1", "jungle_tribe/1", "necrobinder_giant/1", "forbidden_library/1",
                    "defect_station/1", "automaton_factory/1", "regent_starship/1", "regent_starship/2", "regent_starship/3")) {
                var tpl = manager.get(SpireCraft.id(t));
                if (tpl.isEmpty() || tpl.get().getSize().getX() == 0) { bad++; SpireCraft.LOGGER.info("[SelfTest] template missing: {}", t); }
            }
            check("structures: all 86 templates load", bad, 0);
            var reg = s.registryAccess().lookupOrThrow(Registries.STRUCTURE);
            for (String id : List.of("beekeeper", "beekeeper_hollow", "bowlbug_nest", "byrdonis_nest", "camp_desert", "camp_plains", "camp_savanna", "camp_snowy", "camp_taiga", "ceremonial_ruins", "dock_house", "dock_pier", "kaiser_crab_cave", "kin_village", "lighthouse", "man_sized_holes", "mycelium_shrine", "overgrowth_camp", "overgrowth_ruin_pile", "ruin_pile", "sailboat", "scrap_pile", "sea_ruins", "sunken_statue", "web_nest", "wellspring", "wood_carvings",
                    "ironclad_camp", "ironclad_ruin", "silent_gathering", "jungle_tribe", "regent_crater", "regent_starship", "necrobinder_giant",
                    "forbidden_library", "defect_station", "automaton_factory", "sand_pit")) {
                var holder = reg.get(ResourceKey.create(Registries.STRUCTURE, SpireCraft.id(id)));
                report("structure " + id + " registered", holder.isPresent());
            }
            for (String id : List.of("camp_plains", "ruin_pile", "lighthouse", "sea_ruins", "kin_village", "ceremonial_ruins", "wellspring", "sailboat", "dock_house", "sunken_statue", "byrdonis_nest", "overgrowth_camp", "beekeeper", "dock_pier", "web_nest", "kaiser_crab_cave", "scrap_pile", "mycelium_shrine", "beekeeper_hollow", "man_sized_holes")) {
                var holder = reg.get(ResourceKey.create(Registries.STRUCTURE, SpireCraft.id(id)));
                if (holder.isEmpty()) continue;
                var found = s.getChunkSource().getGenerator().findNearestMapStructure(s, net.minecraft.core.HolderSet.direct(holder.get()), b.blockPosition(), 200, false);
                SpireCraft.LOGGER.info("[SelfTest] nearest {}: {}", id, found == null ? "none" : found.getFirst());
                report("structure " + id + " can be found", found != null);
            }
            // the statue's sword: right-click takes the Sovereign Blade once
            BlockPos sw = b.blockPosition().above(30).east(9);
            s.setBlock(sw, ModBlocks.SWORD_STATUE.get().defaultBlockState(), 3);
            player = mockPlayer(s);
            player.getInventory().clearContent();
            var hit = new net.minecraft.world.phys.BlockHitResult(net.minecraft.world.phys.Vec3.atCenterOf(sw), net.minecraft.core.Direction.NORTH, sw, false);
            s.getBlockState(sw).useWithoutItem(s, player, hit);
            s.getBlockState(sw).useWithoutItem(s, player, hit);
            check("sword statue: gives one Sovereign Blade", player.getInventory().countItem(com.mockingjam.spirecraft.registry.ModItems.SOVEREIGN_BLADE.get()), 1f);
            report("sword statue: empty afterwards", !s.getBlockState(sw).getValue(com.mockingjam.spirecraft.block.SwordStatueBlock.HAS_SWORD));
            // the Merchant: a stock of potions, a relic and materials; he can be brought near a player
            var stock = com.mockingjam.spirecraft.mob.SpireMerchant.stock(s.getRandom());
            report("merchant: 6+ offers, all for emeralds", stock.size() >= 6 && stock.stream().allMatch(o -> o.getCostA().is(net.minecraft.world.item.Items.EMERALD)));
            report("merchant: sells a relic", stock.stream().anyMatch(o -> o.getResult().getItem() instanceof com.mockingjam.spirecraft.item.RelicItem));
            var merchant = com.mockingjam.spirecraft.mob.MerchantSpawner.spawn(s);
            report("merchant: spawns near a player", merchant != null);
            if (merchant != null) {
                report("merchant: leaves after two days", merchant.getDespawnDelay() == 48000);
                report("merchant: has goods", !merchant.getOffers().isEmpty());
                // the curse removal: one curse off, 10 emeralds, once per visit
                player.getAbilities().instabuild = false;
                player.getInventory().clearContent();
                var enchants = s.registryAccess().lookupOrThrow(Registries.ENCHANTMENT);
                ItemStack cursed = new ItemStack(net.minecraft.world.item.Items.IRON_SWORD);
                cursed.enchant(enchants.getOrThrow(net.minecraft.world.item.enchantment.Enchantments.VANISHING_CURSE), 1);
                cursed.enchant(enchants.getOrThrow(net.minecraft.world.item.enchantment.Enchantments.SHARPNESS), 2);
                player.getInventory().add(new ItemStack(net.minecraft.world.item.Items.EMERALD, 12));
                report("merchant: lifts a curse", merchant.purge(player, cursed) && !com.mockingjam.spirecraft.mob.SpireMerchant.cursed(cursed)
                        && net.minecraft.world.item.enchantment.EnchantmentHelper.getItemEnchantmentLevel(enchants.getOrThrow(net.minecraft.world.item.enchantment.Enchantments.SHARPNESS), cursed) == 2);
                check("merchant: the curse costs 10 emeralds", player.getInventory().countItem(net.minecraft.world.item.Items.EMERALD), 2f);
                cursed.enchant(enchants.getOrThrow(net.minecraft.world.item.enchantment.Enchantments.BINDING_CURSE), 1);
                player.getInventory().add(new ItemStack(net.minecraft.world.item.Items.EMERALD, 20));
                report("merchant: only once per visit", !merchant.purge(player, cursed) && com.mockingjam.spirecraft.mob.SpireMerchant.cursed(cursed));
                merchant.discard();
            }
            s.getServer().getPlayerList().remove(player);
        });
    }

    /** Biomes v2 (docs/design/biomes_v2.md): blocks, the ink fluid, polluted water, quicksand, the tall gnarlwood. */
    private static void biomeV2Checks() {
        step(0, s -> {
            reset(s);
            var recipes = s.getServer().getRecipeManager();
            for (String id : List.of("rotten_log", "polished_hive_rock", "hive_rock_bricks", "ink_stained_stone_stairs", "rotten_planks")) {
                report("recipe spirecraft:" + id + " loaded", recipes.byKey(ResourceKey.create(Registries.RECIPE, SpireCraft.id(id))).isPresent());
            }
            report("rotten wood has no sapling", !ModBlocks.ROTTEN.hasTree && ModBlocks.ROTTEN.sapling == null);
            // cave ores: vanilla ores in the hive / ink caves become ores of their stone, with vanilla drops and tiers
            Block hiveIron = com.mockingjam.spirecraft.block.CaveOres.HIVE.swap(net.minecraft.world.level.block.Blocks.IRON_ORE);
            report("hive rock: iron ore becomes hive rock iron ore", hiveIron != null
                    && net.minecraftforge.registries.ForgeRegistries.BLOCKS.getKey(hiveIron).getPath().equals("hive_rock_iron_ore"));
            report("hive rock iron ore needs a stone pickaxe", hiveIron != null && hiveIron.defaultBlockState().is(net.minecraft.tags.BlockTags.NEEDS_STONE_TOOL)
                    && hiveIron.defaultBlockState().is(net.minecraft.tags.BlockTags.IRON_ORES));
            report("hive rock is no longer an ore host", !ModBlocks.HIVE_ROCK.base.get().defaultBlockState().is(net.minecraft.tags.BlockTags.STONE_ORE_REPLACEABLES));
            report("cave ore loot table: hive rock iron ore", hiveIron != null && hiveIron.getLootTable().isPresent()
                    && s.getServer().reloadableRegistries().getLootTable(hiveIron.getLootTable().get()) != net.minecraft.world.level.storage.loot.LootTable.EMPTY);
            BlockPos sp = b.blockPosition().above(40).west(14);
            report("tough eggs: cannot float in the air", !ModBlocks.HIVE_EGG.get().defaultBlockState().canSurvive(s, sp.above(30)));
            // tough eggs stack to four like turtle eggs and never hatch
            BlockPos ep = sp.east(3);
            s.setBlock(ep.below(), net.minecraft.world.level.block.Blocks.STONE.defaultBlockState(), 3);
            s.setBlock(ep, ModBlocks.HIVE_EGG.get().defaultBlockState().setValue(net.minecraft.world.level.block.TurtleEggBlock.EGGS, 4), 3);
            for (int i = 0; i < 200; i++) s.getBlockState(ep).randomTick(s, ep, s.getRandom());
            report("tough eggs: 4 in a block, none hatch", s.getBlockState(ep).is(ModBlocks.HIVE_EGG.get())
                    && s.getBlockState(ep).getValue(net.minecraft.world.level.block.TurtleEggBlock.EGGS) == 4
                    && s.getBlockState(ep).getValue(net.minecraft.world.level.block.TurtleEggBlock.HATCH) == 0);
            var ink = com.mockingjam.spirecraft.fluid.ModFluids.INK.get();
            report("ink flows slowly like lava (tick 30)", ink.getTickDelay(s) == com.mockingjam.spirecraft.fluid.ModFluids.INK_TICK_RATE);
            report("ink bucket holds ink", ((net.minecraft.world.item.BucketItem) com.mockingjam.spirecraft.fluid.ModFluids.INK_BUCKET.get()).getFluid() == ink);
            // the tall gnarlwood (what the sapling grows) is dark-oak tall
            BlockPos g = b.blockPosition().above(60).east(20);
            for (int dx = -1; dx <= 2; dx++) for (int dz = -1; dz <= 2; dz++) s.setBlock(g.offset(dx, -1, dz), net.minecraft.world.level.block.Blocks.GRASS_BLOCK.defaultBlockState(), 3);
            var tree = s.registryAccess().lookupOrThrow(Registries.CONFIGURED_FEATURE).getOrThrow(ModBlocks.GNARLWOOD.tree);
            report("tall gnarlwood places", tree.value().place(s, s.getChunkSource().getGenerator(), s.getRandom(), g));
            int h = 0;
            while (h < 30 && (s.getBlockState(g.above(h)).is(ModBlocks.GNARLWOOD.log.get()) || s.getBlockState(g.above(h).east()).is(ModBlocks.GNARLWOOD.log.get())
                    || s.getBlockState(g.above(h).east(2)).is(ModBlocks.GNARLWOOD.log.get()) || s.getBlockState(g.above(h).west()).is(ModBlocks.GNARLWOOD.log.get())
                    || s.getBlockState(g.above(h).north()).is(ModBlocks.GNARLWOOD.log.get()) || s.getBlockState(g.above(h).south()).is(ModBlocks.GNARLWOOD.log.get())
                    || s.getBlockState(g.above(h).south().east()).is(ModBlocks.GNARLWOOD.log.get()))) h++;
            report("tall gnarlwood is 8-13 high (got " + h + ")", h >= 8 && h <= 13);
            // quicksand: something standing in it barely moves
            BlockPos q = b.blockPosition().north(12);
            s.setBlock(q, ModBlocks.QUICKSAND.get().defaultBlockState(), 3);
            s.setBlock(q.above(), ModBlocks.QUICKSAND.get().defaultBlockState(), 3);
            player = mockPlayer(s);   // entities only tick near a player
            player.teleportTo(q.getX() + 3, q.getY() + 1, q.getZ());
            pig = EntityType.PIG.create(s, net.minecraft.world.entity.EntitySpawnReason.COMMAND);
            pig.snapTo(q.getX() + 0.5, q.getY() + 1.2, q.getZ() + 0.5, 0, 0);
            s.addFreshEntity(pig);
            pigStart = pig.getY();
        });
        step(20, s -> {
            report("quicksand: a pig sinks into it (" + String.format("%.2f", pigStart - pig.getY()) + " blocks in 1 s)", pig.getY() < pigStart - 0.2 && pig.isAlive());
            pig.discard();
            s.getServer().getPlayerList().remove(player);
            // polluted water: the weakness check runs for anything in water in a polluted biome
            report("polluted water tag lists the harbours and the polluted sea",
                    s.registryAccess().lookupOrThrow(Registries.BIOME).getOrThrow(com.mockingjam.spirecraft.worldgen.ModBiomes.POLLUTED_SEA).is(com.mockingjam.spirecraft.worldgen.ModBiomes.POLLUTED_WATER)
                    && s.registryAccess().lookupOrThrow(Registries.BIOME).getOrThrow(com.mockingjam.spirecraft.worldgen.ModBiomes.BEACH_DOCKS).is(com.mockingjam.spirecraft.worldgen.ModBiomes.POLLUTED_WATER));
        });
    }

    private static com.mockingjam.spirecraft.mob.CorpseSlug slug;
    private static com.mockingjam.spirecraft.mob.TerrorEel eel;

    /** Phase 8 batch 2 (docs/design/mobs.md §9): the Underdocks mobs, Ravenous, Call for Backup, Shriek, Beckon, the bait. */
    private static void underdocksChecks() {
        step(0, s -> {
            reset(s);
            java.util.Map<net.minecraftforge.registries.RegistryObject<? extends EntityType<? extends LivingEntity>>, Float> health = new java.util.LinkedHashMap<>();
            health.put(com.mockingjam.spirecraft.registry.ModEntities.CORPSE_SLUG, 12f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.TOADPOLE, 10f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.TWO_TAILED_RAT, 8f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.SEAPUNK, 20f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.TERROR_EEL, 65f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.SOUL_FYSH, 250f);
            for (var e : health.entrySet()) {
                String name = e.getKey().getId().getPath();
                LivingEntity mob = e.getKey().get().create(s, net.minecraft.world.entity.EntitySpawnReason.COMMAND);
                report("mob " + name + ": exists", mob != null);
                if (mob != null) check("mob " + name + ": health", mob.getMaxHealth(), e.getValue());
            }
            // Ravenous: a creature dies next to a Corpse Slug - it eats it (stunned), then gains Strength
            slug = com.mockingjam.spirecraft.registry.ModEntities.CORPSE_SLUG.get().create(s, net.minecraft.world.entity.EntitySpawnReason.COMMAND);
            slug.snapTo(b.getX() + 2, b.getY(), b.getZ(), 0, 0);
            s.addFreshEntity(slug);
            Zombie food = bareZombie(s);
            food.kill(s);
            report("corpse slug: devours a corpse (stunned)", slug.moveId() == com.mockingjam.spirecraft.mob.CorpseSlug.DEVOUR);
            // Terror Eel: half health -> stunned, then Terror (Vulnerable on players)
            eel = com.mockingjam.spirecraft.registry.ModEntities.TERROR_EEL.get().create(s, net.minecraft.world.entity.EntitySpawnReason.COMMAND);
            eel.snapTo(b.getX() - 3, b.getY(), b.getZ(), 0, 0);
            s.addFreshEntity(eel);
            eel.setHealth(30);
            player = mockPlayer(s);
            player.teleportTo(b.getX() - 3, b.getY(), b.getZ() + 3);
        });
        step(CorpseSlugTicks(), s -> {
            check("corpse slug: +2 Strength after eating", com.mockingjam.spirecraft.effect.ModEffects.stacks(slug, com.mockingjam.spirecraft.effect.ModEffects.STRENGTH), 2f);
            slug.discard();
            report("terror eel: shrieked at half health", eel.hasShrieked());
        });
        step(com.mockingjam.spirecraft.mob.TerrorEel.STUN_TICKS + 30, s -> {
            report("terror eel: Terror leaves the player Vulnerable", player.hasEffect(ModEffects.holder(ModEffects.VULNERABLE)));
            eel.discard();
            // Soul Fysh's Beckon: two souls in the inventory; a soul drains health; dispelling costs hunger
            player.removeAllEffects();
            player.setHealth(20);
            player.getInventory().clearContent();
            com.mockingjam.spirecraft.mob.SoulFysh.beckon(player, 2);
            check("soul fysh: beckon puts 2 souls in the inventory", player.getInventory().countItem(com.mockingjam.spirecraft.registry.ModItems.BECKONING_SOUL.get()), 2f);
            int food = player.getFoodData().getFoodLevel();
            ItemStack soul = player.getInventory().getItem(player.getInventory().findSlotMatchingItem(new ItemStack(com.mockingjam.spirecraft.registry.ModItems.BECKONING_SOUL.get())));
            player.setItemInHand(net.minecraft.world.InteractionHand.MAIN_HAND, soul);
            soul.use(s, player, net.minecraft.world.InteractionHand.MAIN_HAND);
            check("beckoning soul: dispelling costs 3 hunger", food - player.getFoodData().getFoodLevel(), 3f);
            // the Soul Bait summons the boss in water
            for (int dx = -2; dx <= 2; dx++) for (int dz = 4; dz <= 9; dz++) for (int dy = -4; dy <= 0; dy++)
                s.setBlock(player.blockPosition().offset(dx, dy, dz), net.minecraft.world.level.block.Blocks.WATER.defaultBlockState(), 3);
            player.snapTo(player.getX(), player.getY(), player.getZ(), 0, 0);   // facing +z
            var fysh = com.mockingjam.spirecraft.mob.SoulBait.summon(s, player);
            report("soul bait: summons the Soul Fysh in water", fysh != null);
            if (fysh != null) fysh.discard();
            s.getServer().getPlayerList().remove(player);
        });
    }

    /** Phase 8 batch 3 (docs/design/mobs.md §10): the Hive mobs, Hard to Kill, Artifact, the crab's claws, the demon's curse. */
    private static void hiveChecks() {
        step(0, s -> {
            reset(s);

            java.util.Map<net.minecraftforge.registries.RegistryObject<? extends EntityType<? extends LivingEntity>>, Float> health = new java.util.LinkedHashMap<>();
            health.put(com.mockingjam.spirecraft.registry.ModEntities.BOWLBUG_ROCK, 20f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.BOWLBUG_EGG, 10f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.BOWLBUG_SILK, 19f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.BOWLBUG_NECTAR, 16f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.EXOSKELETON, 12f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.CHOMPER, 28f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.MYTE, 29f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.ENTOMANCER, 65f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.KAISER_CRAB, 290f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.KNOWLEDGE_DEMON, 300f);
            for (var e : health.entrySet()) {
                String name = e.getKey().getId().getPath();
                LivingEntity mob = e.getKey().get().create(s, net.minecraft.world.entity.EntitySpawnReason.COMMAND);
                report("mob " + name + ": exists", mob != null);
                if (mob != null) check("mob " + name + ": health", mob.getMaxHealth(), e.getValue());
            }
            // Hard to Kill: no hit takes more than 4
            var exo = com.mockingjam.spirecraft.registry.ModEntities.EXOSKELETON.get().spawn(s, b.blockPosition().offset(2, 0, 0), net.minecraft.world.entity.EntitySpawnReason.COMMAND);
            exo.hurtServer(s, s.damageSources().generic(), 10);
            check("exoskeleton: Hard to Kill caps a 10 hit at 4", 12 - exo.getHealth(), com.mockingjam.spirecraft.mob.Exoskeleton.HIT_CAP);
            exo.discard();
            // Artifact 2 from birth
            var chomper = com.mockingjam.spirecraft.registry.ModEntities.CHOMPER.get().spawn(s, b.blockPosition().offset(-2, 0, 0), net.minecraft.world.entity.EntitySpawnReason.COMMAND);
            check("chomper: born with 2 Artifact", ModEffects.stacks(chomper, ModEffects.ARTIFACT), 2f);
            chomper.discard();
            // Imbalanced: a rock bowlbug stopped by a shield is dizzy
            var rock = com.mockingjam.spirecraft.registry.ModEntities.BOWLBUG_ROCK.get().spawn(s, b.blockPosition().offset(0, 0, 3), net.minecraft.world.entity.EntitySpawnReason.COMMAND);
            rock.dizzy(s);
            report("bowlbug (rock): dizzy after being blocked", rock.moveId() == com.mockingjam.spirecraft.mob.Bowlbug.DIZZY);
            rock.discard();
            // the Kaiser Crab: a hit on its right counts against the Crusher; a broken claw enrages the other
            var crab = com.mockingjam.spirecraft.registry.ModEntities.KAISER_CRAB.get().create(s, net.minecraft.world.entity.EntitySpawnReason.COMMAND);
            crab.snapTo(b.getX() + 0.5, b.getY(), b.getZ() + 0.5, 0, 0);   // facing south: its right is west
            crab.yBodyRot = 0;
            s.addFreshEntity(crab);
            Zombie west = bareZombie(s);
            west.teleportTo(b.getX() - 3, b.getY(), b.getZ() + 0.5);
            crab.hurtServer(s, s.damageSources().mobAttack(west), 20);
            report("kaiser crab: a hit from its right side hurts the Crusher", crab.crusherHealth() < com.mockingjam.spirecraft.mob.KaiserCrab.CRUSHER_HP
                    && crab.rocketHealth() == com.mockingjam.spirecraft.mob.KaiserCrab.ROCKET_HP);
            west.discard();
            crab.takeFromClaw(s, crab.position().add(-3, 0, 0), 500);
            report("kaiser crab: the Crusher breaks off", crab.crusherBroken() && !crab.rocketBroken());
            check("kaiser crab: Crab Rage gives the Rocket 3 Strength", ModEffects.stacks(crab, ModEffects.STRENGTH), com.mockingjam.spirecraft.mob.KaiserCrab.RAGE_STRENGTH);
            crab.discard();
            // the Knowledge Demon: a book at a bug carcass calls it (once); the curse is chosen by stance
            BlockPos carcass = b.blockPosition().offset(5, 0, 5);
            s.setBlock(carcass, com.mockingjam.spirecraft.registry.ModBlocks.BUG_CARCASS.get().defaultBlockState(), 3);
            var demon = com.mockingjam.spirecraft.mob.KnowledgeDemon.summon(s, carcass);
            report("knowledge demon: summoned at a bug carcass", demon != null);
            report("knowledge demon: only one at a time", com.mockingjam.spirecraft.mob.KnowledgeDemon.summon(s, carcass) == null);
            player = mockPlayer(s);
            player.teleportTo(b.getX(), b.getY(), b.getZ() + 6);
            com.mockingjam.spirecraft.mob.KnowledgeDemon.curse(player, 1, demon);
            check("knowledge demon: standing takes Disintegration (2nd curse)", ModEffects.stacks(player, ModEffects.DISINTEGRATION), 2f);
            player.removeAllEffects();
            player.setShiftKeyDown(true);
            com.mockingjam.spirecraft.mob.KnowledgeDemon.curse(player, 1, demon);
            report("knowledge demon: sneaking takes Slowness instead", player.hasEffect(MobEffects.SLOWNESS) && !player.hasEffect(ModEffects.holder(ModEffects.DISINTEGRATION)));
            player.setShiftKeyDown(false);
            check("disintegration: 1.5 per pulse at the second curse", com.mockingjam.spirecraft.effect.DisintegrationEffect.damage(1), 1.5f);
            // the Entomancer's Personal Hive: two bees per stack
            var ento = com.mockingjam.spirecraft.registry.ModEntities.ENTOMANCER.get().spawn(s, b.blockPosition().offset(-4, 0, -4), net.minecraft.world.entity.EntitySpawnReason.COMMAND);
            boolean two = ento.releaseBee(s, player) != null && ento.releaseBee(s, player) != null;
            report("entomancer: a hit lets loose a bee (two per hive stack)", two && ento.releaseBee(s, player) == null);
            for (var bee : s.getEntitiesOfClass(net.minecraft.world.entity.animal.Bee.class, ento.getBoundingBox().inflate(20))) bee.discard();
            ento.discard();
            if (demon != null) demon.discard();
            s.setBlock(carcass, net.minecraft.world.level.block.Blocks.AIR.defaultBlockState(), 3);
            s.getServer().getPlayerList().remove(player);
        });
    }

    /** §11: every data-driven monster exists with its health; Slippery, Ritual, theft, Illusion, eggs, the summon tokens. */
    private static void scriptedChecks() {
        step(0, s -> {
            reset(s);
            for (var d : com.mockingjam.spirecraft.mob.ScriptedDefs.ALL.values()) {
                var mob = com.mockingjam.spirecraft.registry.ModEntities.SCRIPTED.get(d.name).get().create(s, net.minecraft.world.entity.EntitySpawnReason.COMMAND);
                report("mob " + d.name + ": exists", mob != null);
                if (mob != null) check("mob " + d.name + ": health", mob.getMaxHealth(), d.hp);
            }
            BlockPos at = b.blockPosition();
            java.util.function.Function<String, com.mockingjam.spirecraft.mob.ScriptedMonster> spawn = n ->
                    com.mockingjam.spirecraft.registry.ModEntities.SCRIPTED.get(n).get().spawn(s, at.offset(3, 0, 3), net.minecraft.world.entity.EntitySpawnReason.COMMAND);
            // Slippery: the Inklet's first blow only grazes it
            var inklet = spawn.apply("inklet");
            inklet.hurtServer(s, s.damageSources().generic(), 5);
            check("inklet: Slippery turns a 5 hit into 1", inklet.getMaxHealth() - inklet.getHealth(), 1f);
            for (var e : s.getEntitiesOfClass(com.mockingjam.spirecraft.mob.ScriptedMonster.class, inklet.getBoundingBox().inflate(8))) e.discard();
            // Illusion: a Parafright knocked down gets back up while its Obscura lives
            var obscura = spawn.apply("obscura");
            var para = obscura.summon(s, "parafright", null);
            para.hurtServer(s, s.damageSources().generic(), 50);
            report("parafright: Illusion - knocked down, not dead", para.isAlive() && (para.state() & com.mockingjam.spirecraft.mob.ScriptedMonster.DOWN) != 0);
            para.discard();
            obscura.discard();
            // a thief: the Gremlin Merc takes your emeralds and drops them when killed
            player = mockPlayer(s);
            player.teleportTo(at.getX() + 4, at.getY(), at.getZ() + 3);
            player.getInventory().clearContent();
            player.getInventory().add(new ItemStack(net.minecraft.world.item.Items.EMERALD, 10));
            var merc = spawn.apply("gremlin_merc");
            merc.forceMove(s, merc.move(1), player);
            check("gremlin merc: Gimme steals 4 emeralds", player.getInventory().countItem(net.minecraft.world.item.Items.EMERALD), 6f);
            check("gremlin merc: holds what it stole", merc.stolen().stream().mapToInt(ItemStack::getCount).sum(), 4f);
            merc.discard();
            // a raiding party comes three strong
            var axe = com.mockingjam.spirecraft.registry.ModEntities.SCRIPTED.get("axe_raider").get().spawn(s, at.offset(-4, 0, -4), net.minecraft.world.entity.EntitySpawnReason.NATURAL);
            check("ruby raiders: a party of three", s.getEntitiesOfClass(com.mockingjam.spirecraft.mob.ScriptedMonster.class, axe.getBoundingBox().inflate(6), m -> m.def.name.endsWith("_raider")).size(), 3f);
            for (var e : s.getEntitiesOfClass(com.mockingjam.spirecraft.mob.ScriptedMonster.class, axe.getBoundingBox().inflate(6))) e.discard();
            // the boss tokens call their boss (the self-test world is not in those biomes, so call directly)
            var token = (com.mockingjam.spirecraft.mob.BossSummonItem) com.mockingjam.spirecraft.registry.ModItems.SAND_LURE.get();
            var boss = token.summon(s, player);
            report("sand lure: calls the Insatiable", boss != null && boss.def.name.equals("insatiable"));
            report("sand lure: only one at a time", token.summon(s, player) == null);
            if (boss != null) boss.discard();
            s.getServer().getPlayerList().remove(player);
        });
    }

    private static int CorpseSlugTicks() {
        return com.mockingjam.spirecraft.mob.CorpseSlug.DEVOUR_TICKS + 5;
    }

    /** Orb timers and the homing lightning (they need game ticks). */
    private static void orbChecks() {
        step(0, s -> {
            reset(s);
            player = mockPlayer(s);
            player.teleportTo(b.getX(), b.getY(), b.getZ() + 3);
            zombie = toughZombie(s);
            zombie.addEffect(new MobEffectInstance(MobEffects.FIRE_RESISTANCE, 2000, 0));   // no daylight burning in the counts
            mark = zombie.getHealth();
            com.mockingjam.spirecraft.weapon.Orbs.channel(s, player, com.mockingjam.spirecraft.weapon.Orbs.Type.LIGHTNING);
            com.mockingjam.spirecraft.weapon.Orbs.evokeFront(s, player);   // a big homing ball (8)
        });
        step(40, s -> {
            check("lightning orb: the homing ball hits for 8", mark - zombie.getHealth(), 8f);
            // the mock player is not ticked by the server: run the orb timer by hand
            zombie.teleportTo(player.getX() + 2, player.getY(), player.getZ());   // the lightning knocked it back
            com.mockingjam.spirecraft.weapon.Orbs.channel(s, player, com.mockingjam.spirecraft.weapon.Orbs.Type.DARK);
            mark = zombie.getHealth();
            for (int i = 0; i < com.mockingjam.spirecraft.weapon.Orbs.DARK_TICKS - 1; i++) com.mockingjam.spirecraft.weapon.Orbs.tick(s, player);
            check("dark orb: nothing before its time", mark - zombie.getHealth(), 0f);
            com.mockingjam.spirecraft.weapon.Orbs.tick(s, player);
            check("dark orb: bursts by itself when its time runs out", mark - zombie.getHealth(), com.mockingjam.spirecraft.weapon.Orbs.DARK_DAMAGE);
            check("dark orb: gone after its burst", com.mockingjam.spirecraft.weapon.Orbs.count(player), 0);
            zombie.discard();
            s.getServer().getPlayerList().remove(player);
        });
    }

    /** Phase 8 (docs/design/mobs.md): every mob exists with its health; slimes split; Shrink comes and goes; the boss turns. */
    private static void mobChecks() {
        step(0, s -> {
            reset(s);
            java.util.Map<net.minecraftforge.registries.RegistryObject<? extends net.minecraft.world.entity.EntityType<? extends LivingEntity>>, Float> health = new java.util.LinkedHashMap<>();
            health.put(com.mockingjam.spirecraft.registry.ModEntities.LEAF_SLIME, 16f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.TWIG_SLIME, 16f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.FUZZY_WURM_CRAWLER, 26f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.FLYCONID, 22f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.NIBBIT, 20f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.SHRINKER_BEETLE, 18f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.BYRDONIS, 60f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.CEREMONIAL_BEAST, 250f);
            health.put(com.mockingjam.spirecraft.registry.ModEntities.OSTY, 12f);
            for (var e : health.entrySet()) {
                String name = e.getKey().getId().getPath();
                LivingEntity mob = e.getKey().get().create(s, net.minecraft.world.entity.EntitySpawnReason.COMMAND);
                report("mob " + name + ": exists", mob != null);
                if (mob != null) check("mob " + name + ": health", mob.getMaxHealth(), e.getValue());
            }
            // Leaf slime: a big one splits into two small ones (6 health)
            var slime = com.mockingjam.spirecraft.registry.ModEntities.LEAF_SLIME.get().create(s, net.minecraft.world.entity.EntitySpawnReason.COMMAND);
            slime.snapTo(b.getX() + 3, b.getY(), b.getZ(), 0, 0);
            s.addFreshEntity(slime);
            slime.split(s);
            var small = s.getEntitiesOfClass(com.mockingjam.spirecraft.mob.SpireSlime.class, slime.getBoundingBox().inflate(3), x -> x.isSmall());
            check("leaf slime: splits into 2 small slimes", small.size(), 2);
            if (!small.isEmpty()) check("leaf slime: a small one has 6 health", small.get(0).getMaxHealth(), 6f);
            small.forEach(net.minecraft.world.entity.Entity::discard);
            slime.discard();
            // Shrinker beetle: Shrink on its target until the beetle dies
            var beetle = com.mockingjam.spirecraft.registry.ModEntities.SHRINKER_BEETLE.get().create(s, net.minecraft.world.entity.EntitySpawnReason.COMMAND);
            beetle.snapTo(b.getX() + 3, b.getY(), b.getZ(), 0, 0);
            s.addFreshEntity(beetle);
            Zombie victim = bareZombie(s);
            beetle.shrink(s, victim);
            report("shrinker beetle: target is shrunk", victim.hasEffect(ModEffects.holder(ModEffects.SHRINK)));
            beetle.die(s.damageSources().generic());
            report("shrinker beetle: shrink ends when it dies", !victim.hasEffect(ModEffects.holder(ModEffects.SHRINK)));
            beetle.discard();
            victim.discard();
            // Ceremonial Beast: below 60 % health it enters phase two (checked on its next AI tick)
            beast = com.mockingjam.spirecraft.registry.ModEntities.CEREMONIAL_BEAST.get().create(s, net.minecraft.world.entity.EntitySpawnReason.COMMAND);
            beast.snapTo(b.getX() + 4, b.getY(), b.getZ(), 0, 0);
            s.addFreshEntity(beast);
            beast.hurtServer(s, s.damageSources().generic(), 110);
        });
        step(3, s -> {
            report("ceremonial beast: phase two below 60%", beast.isPhaseTwo());
            beast.discard();
        });
    }

    /** Phase 7 (docs/design/biomes.md): blocks behave like their vanilla twins; the six biomes are in the overworld. */
    private static void biomeChecks() {
        step(0, s -> {
            var recipes = s.getServer().getRecipeManager();
            for (String id : List.of("gnarlwood_planks", "rotten_door", "hiveshroom_stairs", "stripped_gnarlwood_wood", "ruin_stone",
                    "ruin_stone_bricks", "chiseled_ruin_stone_bricks", "dock_bricks", "polished_harbour_rock",
                    "sludge", "junk_block", "hiveshroom_planks")) {
                report("recipe spirecraft:" + id + " loaded", recipes.byKey(ResourceKey.create(Registries.RECIPE, SpireCraft.id(id))).isPresent());
            }
            var biomes = s.registryAccess().lookupOrThrow(Registries.BIOME);
            var possible = s.getChunkSource().getGenerator().getBiomeSource().possibleBiomes();
            for (var key : com.mockingjam.spirecraft.worldgen.ModBiomes.ALL) {
                report("biome " + key.location().getPath() + " registered", biomes.get(key).isPresent());
                report("overworld can generate " + key.location().getPath(), possible.stream().anyMatch(h -> h.is(key)));
            }
            report("vanilla jungle still generates", possible.stream().anyMatch(h -> h.is(Biomes.JUNGLE)));
            report("gnarlwood planks tagged planks", ModBlocks.GNARLWOOD.planks.get().defaultBlockState().is(net.minecraft.tags.BlockTags.PLANKS));
            report("hive soil counts as dirt", ModBlocks.HIVE_SOIL.get().defaultBlockState().is(net.minecraft.tags.BlockTags.DIRT));

            BlockPos p = b.blockPosition().above(40);
            var axis = net.minecraft.world.level.block.RotatedPillarBlock.AXIS;
            s.setBlock(p, ModBlocks.GNARLWOOD.log.get().defaultBlockState().setValue(axis, net.minecraft.core.Direction.Axis.X), 3);
            ItemStack axe = new ItemStack(Items.IRON_AXE);
            player.setItemInHand(net.minecraft.world.InteractionHand.MAIN_HAND, axe);
            var ctx = new net.minecraft.world.item.context.UseOnContext(s, player, net.minecraft.world.InteractionHand.MAIN_HAND, axe,
                    new net.minecraft.world.phys.BlockHitResult(Vec3.atCenterOf(p), net.minecraft.core.Direction.UP, p, false));
            var stripped = s.getBlockState(p).getToolModifiedState(ctx, net.minecraftforge.common.ToolActions.AXE_STRIP, false);
            report("axe strips gnarlwood log, keeps axis", stripped != null && stripped.is(ModBlocks.GNARLWOOD.strippedLog.get())
                    && stripped.getValue(axis) == net.minecraft.core.Direction.Axis.X);
            report("gnarlwood planks are flammable", ModBlocks.GNARLWOOD.planks.get().defaultBlockState().isFlammable(s, p, net.minecraft.core.Direction.UP));

        });
        for (var key : com.mockingjam.spirecraft.worldgen.ModBiomes.ALL) {
            step(0, s -> {
                var found = s.findClosestBiome3d(h -> h.is(key), BlockPos.ZERO, 6400, 32, 64);
                report("locate " + key.location().getPath() + (found == null ? " (not found)" : " at " + found.getFirst().toShortString()), found != null);
            });
        }
    }

    /** Phase 3 materials (docs/design/materials.md): recipes, gear rules, consumables, ore generation. */
    private static void contentChecks() {
        step(0, s -> {
            var recipes = s.getServer().getRecipeManager();
            for (String id : List.of("tungsten_alloy_ingot", "tungsten_ingot_from_smelting_raw_tungsten", "tungsten_chestplate",
                    "orichalcum_pickaxe", "orichalcum_ingot_from_blasting_raw_orichalcum", "gunpowder_from_brimstone", "lava_rock", "amethyst_aubergine", "tungsten_rod", "relic_pouch", "anchor_smithing", "vajra_smithing", "oddly_smooth_stone_smithing", "bronze_scales_smithing", "mercury_hourglass_smithing", "bag_of_marbles_smithing", "red_mask_smithing", "blood_vial_smithing", "red_skull_smithing", "pen_nib_smithing", "burning_blood_smithing", "black_quill", "kin_idol", "steam_whistle", "slumber_horn", "sand_lure", "hive_comb", "hive_cache",
                    "brimstone_block")) {
                report("recipe spirecraft:" + id + " loaded", recipes.byKey(ResourceKey.create(Registries.RECIPE, SpireCraft.id(id))).isPresent());
            }
        });

        // Tungsten: full set -> magic (armor-bypassing) 4 dmg loses 3; 8% slower; +0.2 knockback resistance.
        step(0, s -> {
            reset(s);
            zombie = bareZombie(s);
            baseSpeed = zombie.getAttributeValue(Attributes.MOVEMENT_SPEED);
            baseKnockback = zombie.getAttributeValue(Attributes.KNOCKBACK_RESISTANCE);
            wear(zombie, ModItems.TUNGSTEN_HELMET.get(), ModItems.TUNGSTEN_CHESTPLATE.get(), ModItems.TUNGSTEN_LEGGINGS.get(), ModItems.TUNGSTEN_BOOTS.get());
        });
        step(2, s -> {
            check("tungsten speed x0.92", (float) (zombie.getAttributeValue(Attributes.MOVEMENT_SPEED) / baseSpeed), 0.92f);
            check("tungsten knockback +0.2", (float) (zombie.getAttributeValue(Attributes.KNOCKBACK_RESISTANCE) - baseKnockback), 0.2f);
            mark = zombie.getHealth();
            zombie.invulnerableTime = 0;
            zombie.hurtServer(s, zombie.damageSources().magic(), 4);
            check("tungsten full set: 4 dmg -> lose 3", mark - zombie.getHealth(), 3f);
            zombie.discard();
        });

        // Orichalcum: never breaks; dormant at 1 durability; repair restores.
        step(0, s -> {
            ItemStack pick = new ItemStack(ModItems.ORICHALCUM_PICKAXE.get());
            check("orichalcum pickaxe durability = 1200", pick.getMaxDamage(), 1200);
            pick.setDamageValue(pick.getMaxDamage() - 3);
            pick.hurtAndBreak(50, s, null, item -> {});
            report("orichalcum pickaxe survives heavy damage", !pick.isEmpty());
            check("orichalcum stops at 1 durability left", pick.getMaxDamage() - pick.getDamageValue(), 1);
            report("dormant pickaxe loses tool component", !pick.has(DataComponents.TOOL));
            pick.setDamageValue(0);
            OrichalcumGear.syncDormancy(pick);
            report("repaired pickaxe regains tool component", pick.has(DataComponents.TOOL));
        });

        // Orichalcum shield: full set, never attacked -> 4 absorption within one sync (every 20 ticks).
        step(0, s -> {
            reset(s);
            zombie = bareZombie(s);
            wear(zombie, ModItems.ORICHALCUM_HELMET.get(), ModItems.ORICHALCUM_CHESTPLATE.get(), ModItems.ORICHALCUM_LEGGINGS.get(), ModItems.ORICHALCUM_BOOTS.get());
        });
        step(25, s -> {
            check("orichalcum full set shield = 4", zombie.getAbsorptionAmount(), 4f);
            zombie.setAbsorptionAmount(0);
            zombie.invulnerableTime = 0;
            zombie.hurtServer(s, zombie.damageSources().magic(), 1);
        });
        step(40, s -> check("no shield within 8 s of being attacked", zombie.getAbsorptionAmount(), 0f));
        step(140, s -> {
            check("shield returns after 8 quiet seconds", zombie.getAbsorptionAmount(), 4f);
            zombie.discard();
        });

        // Brimstone: user +2 Strength stacks, nearby enemy +1, non-enemy (iron golem b) untouched.
        step(0, s -> {
            reset(s);
            zombie = bareZombie(s);
            int empowered = BrimstoneItem.ignite(s, a);
            check("brimstone empowers 1 enemy", empowered, 1);
            check("brimstone user strength = 2", ModEffects.stacks(a, ModEffects.STRENGTH), 2);
            check("brimstone enemy strength = 1", ModEffects.stacks(zombie, ModEffects.STRENGTH), 1);
            check("brimstone ignores non-enemies", ModEffects.stacks(b, ModEffects.STRENGTH), 0);
            zombie.discard();
        });

        // Galactic dust (mock player): 13 levels -> spends 12, gains 12 absorption.
        step(0, s -> {
            player = mockPlayer(s);
            player.setExperienceLevels(13);
            check("galactic dust tiers", GalacticDustItem.convert(player), 3);
            check("galactic dust spends 12 levels", player.experienceLevel, 1);
            check("galactic dust grants 12 absorption", player.getAbsorptionAmount(), 12f);
            check("galactic dust needs 4 levels", GalacticDustItem.convert(player), 0);

            player.setAbsorptionAmount(0);
            player.removeAllEffects();
            player.setHealth(20);
        });

        // Lava rock: killing a boss consumes one and duplicates every drop.
        step(0, s -> {
            reset(s);
            player.getInventory().clearContent();
            player.getInventory().add(new ItemStack(ModItems.LAVA_ROCK.get(), 2));
            var boss = EntityType.ELDER_GUARDIAN.spawn(s, b.blockPosition().above(), EntitySpawnReason.COMMAND);
            bossPos = boss.position();
            boss.hurtServer(s, boss.damageSources().playerAttack(player), 10000);
            report("elder guardian died", !boss.isAlive());
        });
        step(1, s -> {
            check("lava rock consumed once", player.getInventory().countItem(ModItems.LAVA_ROCK.get()), 1);
            var drops = s.getEntitiesOfClass(ItemEntity.class, new AABB(bossPos, bossPos).inflate(4));
            var counts = new java.util.HashMap<String, Integer>();
            for (ItemEntity e : drops) counts.merge(e.getItem().getItem().toString() + "x" + e.getItem().getCount(), 1, Integer::sum);
            SpireCraft.LOGGER.info("[SelfTest] boss drops with lava rock: {}", counts);
            report("boss drops come in pairs", !counts.isEmpty() && counts.values().stream().allMatch(n -> n % 2 == 0));
            drops.forEach(ItemEntity::discard);
            s.getServer().getPlayerList().remove(player);
        });

        // Ore generation in real terrain.
        step(0, s -> {
            BlockPos spawn = s.getRespawnData().pos();
            int[] ow = countOres(s, spawn, 4, -64, 64, ModBlocks.WOLFRAMITE_ORE.get(), ModBlocks.DEEPSLATE_WOLFRAMITE_ORE.get(), ModBlocks.ORICHALCUM_ORE.get());
            SpireCraft.LOGGER.info("[SelfTest] overworld, 16 chunks: wolframite={} (+deepslate {}), orichalcum={}", ow[0], ow[1], ow[2]);
            report("wolframite ore generates", ow[0] + ow[1] > 0);
            report("orichalcum ore generates", ow[2] > 0);

            ServerLevel nether = s.getServer().getLevel(Level.NETHER);
            int[] ne = countOres(nether, BlockPos.ZERO, 4, 10, 117, ModBlocks.NETHER_BRIMSTONE_ORE.get());
            SpireCraft.LOGGER.info("[SelfTest] nether, 16 chunks: brimstone={}", ne[0]);
            report("brimstone ore generates", ne[0] > 0);

            var deltas = nether.findClosestBiome3d(h -> h.is(Biomes.BASALT_DELTAS), BlockPos.ZERO, 3000, 32, 64);
            if (deltas == null) {
                report("basalt deltas found within 3000 blocks (seed-dependent)", false);
            } else {
                int[] lr = countOres(nether, deltas.getFirst(), 2, 10, 117, ModBlocks.LAVA_ROCK_ORE.get());
                SpireCraft.LOGGER.info("[SelfTest] basalt deltas at {}, 4 chunks: lava rock ore={}", deltas.getFirst(), lr[0]);
                report("lava rock ore generates in basalt deltas", lr[0] > 0);
            }
        });
    }

    /** Phase 4 (docs/design/consumables.md): brewing, new effects, fruits, meat, aubergine crop, chest loot. */
    private static void consumableChecks() {
        step(0, s -> {
            var brewing = s.getServer().potionBrewing();
            var awkward = PotionContents.createItemStack(Items.POTION, Potions.AWKWARD);
            checkMix(brewing, ModItems.BRIMSTONE.get(), awkward, ModPotions.STRENGTH, "awkward + brimstone = strength");
            var strength = PotionContents.createItemStack(Items.POTION, ModPotions.holder(ModPotions.STRENGTH));
            checkMix(brewing, Items.FERMENTED_SPIDER_EYE, strength, ModPotions.WEAK, "strength + fermented eye = weak");
            checkMix(brewing, Items.GLOWSTONE_DUST, strength, ModPotions.STRONG_STRENGTH, "strength + glowstone = strong");
            checkMix(brewing, Items.ECHO_SHARD, awkward, ModPotions.GHOST_IN_A_JAR, "awkward + echo shard = ghost in a jar");
            checkMix(brewing, ModItems.TUNGSTEN_INGOT.get(), awkward, ModPotions.BLOCK, "awkward + tungsten ingot = block");
            var splash = brewing.mix(new ItemStack(Items.GUNPOWDER), strength);
            report("strength potion + gunpowder = splash", splash.is(Items.SPLASH_POTION));
        });

        // Intangible caps HP loss at 1; Blood heal restores 20% max health.
        step(0, s -> {
            reset(s);
            give(b, ModEffects.INTANGIBLE, 0);
            hit(s, 10);
        });
        step(1, s -> {
            check("intangible: 10 dmg -> lose 1", lost(), 1f);
            b.setHealth(50);
            ModEffects.BLOOD_HEAL.get().applyInstantenousEffect(s, null, null, b, 0, 1.0);
            check("blood heal: 50 + 20% of 100", b.getHealth(), 70f);
        });

        // Fruits: +max health once per player; survives respawn copy. Meat on the Bone extra heal.
        step(0, s -> {
            player = mockPlayer(s);
            var strawberry = (SpireFoods.Fruit) ModItems.STRAWBERRY.get();
            double before = player.getMaxHealth();
            report("first strawberry grants bonus", strawberry.applyBonus(player));
            check("strawberry: max health +2", (float) (player.getMaxHealth() - before), 2f);
            report("second strawberry grants nothing", !strawberry.applyBonus(player));
            ((SpireFoods.Fruit) ModItems.MANGO.get()).applyBonus(player);
            check("strawberry + mango: +6", (float) (player.getMaxHealth() - before), 6f);
            ServerPlayer respawned = mockPlayer(s);
            FoodEvents.copyFruitBonuses(player, respawned);
            check("fruit bonuses copied on respawn", (float) (respawned.getMaxHealth() - before), 6f);
            s.getServer().getPlayerList().remove(respawned);

            player.setHealth(8);
            ModItems.MEAT_ON_THE_BONE.get().finishUsingItem(new ItemStack(ModItems.MEAT_ON_THE_BONE.get()), s, player);
            check("meat on the bone at low health: +6", player.getHealth(), 14f);
            player.setHealth(20);
            ModItems.MEAT_ON_THE_BONE.get().finishUsingItem(new ItemStack(ModItems.MEAT_ON_THE_BONE.get()), s, player);
            check("meat on the bone above half: no extra", player.getHealth(), 20f);
        });

        // Aubergine: Prosperity → a slain zombie drops 1–3 gold nuggets.
        step(0, s -> {
            reset(s);
            ModItems.AMETHYST_AUBERGINE.get().finishUsingItem(new ItemStack(ModItems.AMETHYST_AUBERGINE.get()), s, player);
            report("aubergine grants prosperity", player.hasEffect(ModEffects.holder(ModEffects.PROSPERITY)));
            zombie = bareZombie(s);
            bossPos = zombie.position();
            zombie.hurtServer(s, zombie.damageSources().playerAttack(player), 1000);
        });
        step(1, s -> {
            int nuggets = 0;
            for (ItemEntity e : s.getEntitiesOfClass(ItemEntity.class, new AABB(bossPos, bossPos).inflate(3))) {
                if (e.getItem().is(Items.GOLD_NUGGET)) nuggets += e.getItem().getCount();
                e.discard();
            }
            report("prosperity kill drops 1-3 gold nuggets (got " + nuggets + ")", nuggets >= 1 && nuggets <= 3);
            s.getServer().getPlayerList().remove(player);
        });

        // Fruits appear in vanilla chests: roll the dungeon table and a village house table.
        step(0, s -> {
            check("dungeon chests: pear rate ~25% (x100)", 100f * lootRate(s, BuiltInLootTables.SIMPLE_DUNGEON, ModItems.PEAR.get()), 25f, 10f);
            check("village house: strawberry rate ~40% (x100)", 100f * lootRate(s, BuiltInLootTables.VILLAGE_PLAINS_HOUSE, ModItems.STRAWBERRY.get()), 40f, 10f);
            check("ancient city: mango rate ~20% (x100)", 100f * lootRate(s, BuiltInLootTables.ANCIENT_CITY, ModItems.MANGO.get()), 20f, 10f);
        });
    }

    // ---------------------------------------------------------------- phase 5: relics
    private static ItemStack pouchWith(Item... relics) {
        ItemStack pouch = new ItemStack(ModItems.RELIC_POUCH.get());
        for (Item relic : relics) RelicPouchItem.insert(pouch, new ItemStack(relic));
        return pouch;
    }

    private static void relicChecks() {
        // Pouch rules
        step(0, s -> {
            ItemStack pouch = new ItemStack(ModItems.RELIC_POUCH.get());
            report("pouch takes a relic", RelicPouchItem.insert(pouch, new ItemStack(ModItems.ANCHOR.get())));
            report("pouch rejects a duplicate relic", !RelicPouchItem.insert(pouch, new ItemStack(ModItems.ANCHOR.get())));
            report("pouch rejects non-relics", !RelicPouchItem.insert(pouch, new ItemStack(Items.DIAMOND)));
            for (var r : List.of(ModItems.VAJRA, ModItems.RED_MASK, ModItems.BLOOD_VIAL, ModItems.PEN_NIB, ModItems.SHURIKEN,
                    ModItems.LIZARD_TAIL, ModItems.RED_SKULL, ModItems.BRONZE_SCALES)) RelicPouchItem.insert(pouch, new ItemStack(r.get()));
            report("pouch holds 9", RelicPouchItem.load(pouch).stream().filter(st -> !st.isEmpty()).count() == 9);
            report("full pouch rejects a 10th", !RelicPouchItem.insert(pouch, new ItemStack(ModItems.BAG_OF_MARBLES.get())));
        });

        // Tungsten Rod only works inside a pouch
        step(0, s -> {
            reset(s);
            player = mockPlayer(s);
            player.getInventory().add(new ItemStack(ModItems.TUNGSTEN_ROD.get()));
            player.invulnerableTime = 0;
            player.hurtServer(s, player.damageSources().magic(), 4);
            check("loose tungsten rod: magic 4 -> lose 4", 20 - player.getHealth(), 4f);
            player.getInventory().clearContent();
            player.getInventory().add(pouchWith(ModItems.TUNGSTEN_ROD.get()));
            player.setHealth(20);
            player.invulnerableTime = 0;
            player.hurtServer(s, player.damageSources().magic(), 4);
            check("tungsten rod in pouch: magic 4 -> lose 3", 20 - player.getHealth(), 3f);
            player.getInventory().clearContent();
        });

        // Start of combat: anchor, blood vial, vajra, smooth stone, bronze scales, bag of marbles, red mask
        step(0, s -> {
            player.removeAllEffects();
            player.setHealth(10);
            player.getInventory().add(pouchWith(ModItems.ANCHOR.get(), ModItems.BLOOD_VIAL.get(), ModItems.VAJRA.get(),
                    ModItems.ODDLY_SMOOTH_STONE.get(), ModItems.BRONZE_SCALES.get(), ModItems.BAG_OF_MARBLES.get(),
                    ModItems.RED_MASK.get(), ModItems.BURNING_BLOOD.get()));
            player.teleportTo(b.getX(), b.getY(), b.getZ() + 2);
            zombie = bareZombie(s);
            zombie.teleportTo(player.getX() + 2, player.getY(), player.getZ());
            zombie.hurtServer(s, zombie.damageSources().playerAttack(player), 1);
            report("combat started", RelicEvents.combat(player).active());
            check("anchor: absorption effect", player.hasEffect(MobEffects.ABSORPTION) ? 1 : 0, 1);
            check("blood vial: 10 -> 12 health", player.getHealth(), 12f);
            check("vajra: strength 1", ModEffects.stacks(player, ModEffects.STRENGTH), 1);
            check("smooth stone: dexterity 1", ModEffects.stacks(player, ModEffects.DEXTERITY), 1);
            check("bronze scales: thorns 1", ModEffects.stacks(player, ModEffects.THORNS), 1);
            report("bag of marbles: zombie vulnerable", zombie.hasEffect(ModEffects.holder(ModEffects.VULNERABLE)));
            report("red mask: zombie weak", zombie.hasEffect(ModEffects.holder(ModEffects.WEAK)));
            // a second hit inside the same fight does not trigger the start again
            zombie.invulnerableTime = 0;
            zombie.hurtServer(s, zombie.damageSources().playerAttack(player), 1);
            check("no second trigger: health still 12", player.getHealth(), 12f);
            zombie.invulnerableTime = 0;
            zombie.hurtServer(s, zombie.damageSources().playerAttack(player), 1000);
            report("zombie killed", !zombie.isAlive());
            player.setHealth(10);
        });
        // Burning Blood: 10 s after the fight (with a kill), heal 4
        step(RelicEvents.COMBAT_GAP + 5, s -> {
            RelicEvents.tick(player);
            report("combat ended", !RelicEvents.combat(player).active());
            check("burning blood: 10 -> 14 health", player.getHealth(), 14f);
        });

        // Red Skull: +2 strength at or below half health
        step(0, s -> {
            player.getInventory().clearContent();
            player.removeAllEffects();
            player.getInventory().add(pouchWith(ModItems.RED_SKULL.get()));
            player.setHealth(20);
            check("red skull above half: +0", SpireEffectEvents.extraStrength.applyAsInt(player), 0);
            player.setHealth(10);
            check("red skull at half: +2", SpireEffectEvents.extraStrength.applyAsInt(player), 2);
        });

        // Pen Nib (10th attack doubled) and Shuriken (3 quick attacks -> +1 strength)
        step(0, s -> {
            player.getInventory().clearContent();
            player.removeAllEffects();
            player.getPersistentData().remove("spirecraft.pen_nib");
            player.getInventory().add(pouchWith(ModItems.PEN_NIB.get(), ModItems.SHURIKEN.get()));
            zombie = bareZombie(s);
            zombie.getAttribute(Attributes.MAX_HEALTH).setBaseValue(200);
            zombie.setHealth(200);
            float ninth = 0, tenth = 0;
            for (int i = 1; i <= 10; i++) {
                player.removeEffect(ModEffects.holder(ModEffects.STRENGTH)); // keep shuriken strength out of the pen nib numbers
                float before = zombie.getHealth();
                zombie.invulnerableTime = 0;
                zombie.hurtServer(s, zombie.damageSources().playerAttack(player), 4);
                if (i == 9) ninth = before - zombie.getHealth();
                if (i == 10) tenth = before - zombie.getHealth();
            }
            check("pen nib: 10th hit doubled (ratio)", tenth / ninth, 2f);
            check("pen nib counter restarts", RelicEvents.penNibCount(player), 0);
            player.removeEffect(ModEffects.holder(ModEffects.STRENGTH));
            for (int i = 0; i < 3; i++) {
                zombie.invulnerableTime = 0;
                zombie.hurtServer(s, zombie.damageSources().playerAttack(player), 1);
            }
            check("shuriken: 3 quick attacks -> strength 1", ModEffects.stacks(player, ModEffects.STRENGTH), 1);
        });

        // Mercury Hourglass: every 3 s in combat, 1 damage to foes within 6 blocks
        step(0, s -> {
            player.getInventory().clearContent();
            player.getInventory().add(pouchWith(ModItems.MERCURY_HOURGLASS.get()));
            zombie.teleportTo(player.getX() + 2, player.getY(), player.getZ());
            zombie.invulnerableTime = 0;
            zombie.hurtServer(s, zombie.damageSources().playerAttack(player), 1); // in combat
            float before = zombie.getHealth();
            zombie.invulnerableTime = 0;
            player.tickCount = RelicEvents.MERCURY_PERIOD * 100;
            RelicEvents.tick(player);
            check("mercury hourglass: 1 damage", before - zombie.getHealth(), 1f);
            zombie.discard();
        });

        // Lizard Tail: survive one fatal hit at 50% health, then it needs to regrow
        step(0, s -> {
            player.getInventory().clearContent();
            player.removeAllEffects();
            player.getPersistentData().remove("spirecraft.lizard_tail_ready");
            player.getInventory().add(pouchWith(ModItems.LIZARD_TAIL.get()));
            player.setHealth(20);
            player.invulnerableTime = 0;
            player.hurtServer(s, player.damageSources().magic(), 1000);
            report("lizard tail: survived a fatal hit", player.isAlive());
            check("lizard tail: health = 50% of max", player.getHealth(), 10f);
            report("lizard tail: now regrowing", !RelicEvents.lizardTailReady(player, s));
            player.getInventory().clearContent();
            s.getServer().getPlayerList().remove(player);
        });

        // Relics in vanilla chests
        step(0, s -> {
            check("dungeon: common relic rate ~12% (x100)", 100f * lootRateAny(s, BuiltInLootTables.SIMPLE_DUNGEON,
                    ModItems.ANCHOR.get(), ModItems.VAJRA.get(), ModItems.ODDLY_SMOOTH_STONE.get(), ModItems.BAG_OF_MARBLES.get(),
                    ModItems.RED_MASK.get(), ModItems.BRONZE_SCALES.get(), ModItems.BLOOD_VIAL.get()), 12f, 6f);
            check("fortress: ironclad relic rate ~15% (x100)", 100f * lootRateAny(s, BuiltInLootTables.NETHER_BRIDGE,
                    ModItems.BURNING_BLOOD.get(), ModItems.RED_SKULL.get()), 15f, 6f);
            check("ancient city: rare relic rate ~8% (x100)", 100f * lootRateAny(s, BuiltInLootTables.ANCIENT_CITY,
                    ModItems.SHURIKEN.get(), ModItems.LIZARD_TAIL.get()), 8f, 5f);
        });
    }

    /** Fraction of 400 rolls of a chest table that contain any of the items. */
    private static float lootRateAny(ServerLevel level, ResourceKey<LootTable> table, Item... items) {
        var loot = level.getServer().reloadableRegistries().getLootTable(table);
        var params = new LootParams.Builder(level).withParameter(LootContextParams.ORIGIN, Vec3.ZERO).create(LootContextParamSets.CHEST);
        int hits = 0;
        for (int i = 0; i < 400; i++) {
            if (loot.getRandomItems(params).stream().anyMatch(st -> java.util.Arrays.stream(items).anyMatch(st::is))) hits++;
        }
        return hits / 400f;
    }

    // ---------------------------------------------------------------- phase 6: melee weapons
    private static float hitWith(ServerLevel s, ItemStack weapon, LivingEntity target, float amount) {
        player.setItemInHand(net.minecraft.world.InteractionHand.MAIN_HAND, weapon);
        float before = target.getHealth();
        target.invulnerableTime = 0;
        target.hurtServer(s, target.damageSources().playerAttack(player), amount);
        return before - target.getHealth();
    }

    private static Zombie toughZombie(ServerLevel s) {
        Zombie z = bareZombie(s);
        z.getAttribute(Attributes.MAX_HEALTH).setBaseValue(200);
        z.setHealth(200);
        z.addEffect(new MobEffectInstance(MobEffects.FIRE_RESISTANCE, 100000, 0));   // daylight burning added stray damage
        z.getAttribute(Attributes.ARMOR).setBaseValue(0);
        return z;
    }

    private static void weaponChecks() {
        step(0, s -> {
            reset(s);
            player = mockPlayer(s);
            player.teleportTo(b.getX(), b.getY(), b.getZ() + 2);
            zombie = toughZombie(s);
            zombie.teleportTo(player.getX() + 1.5, player.getY(), player.getZ());

            // Morning star (Bash): only a fully charged swing applies Vulnerable
            WeaponEvents.setCharged(player, false);
            hitWith(s, new ItemStack(ModItems.MORNING_STAR.get()), zombie, 4);
            report("morning star: weak swing, no vulnerable", !zombie.hasEffect(ModEffects.holder(ModEffects.VULNERABLE)));
            WeaponEvents.setCharged(player, true);
            hitWith(s, new ItemStack(ModItems.MORNING_STAR.get()), zombie, 4);
            report("morning star: charged swing -> vulnerable", zombie.hasEffect(ModEffects.holder(ModEffects.VULNERABLE)));
            zombie.removeAllEffects();

            // Bludgeon: a charged blow x1.5; Infernal Blade: fire, and the armed hit x1.5
            check("bludgeon: charged 4 -> 6", hitWith(s, new ItemStack(ModItems.BLUDGEON.get()), zombie, 4), 6f);
            WeaponEvents.setCharged(player, false);
            check("bludgeon: weak swing stays 4", hitWith(s, new ItemStack(ModItems.BLUDGEON.get()), zombie, 4), 4f);
            zombie.clearFire();
            hitWith(s, new ItemStack(ModItems.INFERNAL_BLADE.get()), zombie, 2);
            report("infernal blade: sets the target on fire", zombie.getRemainingFireTicks() > 0);
            com.mockingjam.spirecraft.weapon.Abilities.infernal(s, player, ItemStack.EMPTY);
            check("infernal blade: armed hit 4 -> 6", hitWith(s, new ItemStack(ModItems.INFERNAL_BLADE.get()), zombie, 4), 6f);
            check("infernal blade: the charge is used up", hitWith(s, new ItemStack(ModItems.INFERNAL_BLADE.get()), zombie, 4), 4f);
            zombie.clearFire();
            zombie.removeAllEffects();

            // Poison weapons: dagger 2 per hit; kris 1 per hit, +5 when armed; ink dagger: Weak
            hitWith(s, new ItemStack(ModItems.POISONED_DAGGER.get()), zombie, 1);
            hitWith(s, new ItemStack(ModItems.POISONED_DAGGER.get()), zombie, 1);
            check("poisoned dagger: 2 hits -> 4 poison", ModEffects.stacks(zombie, ModEffects.POISON), 4);
            zombie.removeAllEffects();
            hitWith(s, new ItemStack(ModItems.SNAKEBITE.get()), zombie, 1);
            check("snakebite: a plain blade, no poison", ModEffects.stacks(zombie, ModEffects.POISON), 0);
            zombie.removeAllEffects();
            hitWith(s, new ItemStack(ModItems.INK_DAGGER.get()), zombie, 1);
            report("ink dagger: hit makes the target weak", zombie.hasEffect(ModEffects.holder(ModEffects.WEAK)));
            zombie.removeAllEffects();

            // Sovereign blade: forge from kills, +1 damage per 15 forge; the Regent's strike feeds it
            ItemStack blade = new ItemStack(ModItems.SOVEREIGN_BLADE.get());
            float plain = hitWith(s, blade, zombie, 4);
            SovereignBlade.addForge(blade, 30);
            check("sovereign blade: 30 forge -> +2", hitWith(s, blade, zombie, 4) - plain, 2f);
            SovereignBlade.addForge(blade, 1000);
            check("sovereign blade: bonus capped at +5", SovereignBlade.bonusDamage(blade), 5);
            ItemStack fresh = new ItemStack(ModItems.SOVEREIGN_BLADE.get());
            player.setItemInHand(net.minecraft.world.InteractionHand.MAIN_HAND, fresh);
            Zombie victim = bareZombie(s);
            victim.hurtServer(s, victim.damageSources().playerAttack(player), 1000);
            check("sovereign blade: a kill adds 1 forge", SovereignBlade.forge(fresh), 1);
            player.getInventory().add(fresh);
            WeaponEvents.setCharged(player, true);
            hitWith(s, new ItemStack(ModItems.REGENT_STRIKE.get()), zombie, 2);
            ItemStack carried = ItemStack.EMPTY;
            for (int i = 0; i < player.getInventory().getContainerSize(); i++) if (player.getInventory().getItem(i).is(ModItems.SOVEREIGN_BLADE.get())) carried = player.getInventory().getItem(i);
            check("regent strike: charged hit forges the carried blade", SovereignBlade.forge(carried), 2);
            // Crescent spear: +0.5 per other Regent weapon carried
            player.getInventory().add(new ItemStack(ModItems.PHOTON_CUT.get()));
            check("crescent spear: 3 regent weapons carried (blade, strike in hand, photon cut) -> +1.5", com.mockingjam.spirecraft.weapon.WeaponEvents.spearBonus(player), 1.5f);
            player.getInventory().clearContent();
            // Photon cut: part of the hit ignores armour
            zombie.getAttribute(Attributes.ARMOR).setBaseValue(10);
            float pierced = com.mockingjam.spirecraft.weapon.WeaponEvents.photonPierce(zombie, 10, zombie.damageSources().playerAttack(player));
            report("photon cut: armoured target gets a raised pre-armour hit (" + pierced + ")", pierced > 10.5F);
            zombie.getAttribute(Attributes.ARMOR).setBaseValue(0);
            check("photon cut: no armour, no change", com.mockingjam.spirecraft.weapon.WeaponEvents.photonPierce(zombie, 10, zombie.damageSources().playerAttack(player)), 10f);

            // Scythe: 2 doom, half-damage sweep; charged reap hits hostiles in front. Scourge: 4 doom
            Zombie neighbour = toughZombie(s);
            neighbour.teleportTo(zombie.getX(), zombie.getY(), zombie.getZ() + 1.2);
            float neighbourBefore = neighbour.getHealth();
            hitWith(s, new ItemStack(ModItems.SCYTHE.get()), zombie, 6);
            check("scythe: 2 doom", ModEffects.stacks(zombie, ModEffects.DOOM), 2);
            check("scythe: sweep deals half (6 -> 3)", neighbourBefore - neighbour.getHealth(), 3f);
            player.setYRot(-90);
            player.setXRot(0);
            int reaped = ReapingScythe.reap(s, player);
            report("scythe: reap hits both zombies in front (got " + reaped + ")", reaped == 2);
            neighbour.discard();
            zombie.removeAllEffects();
            hitWith(s, new ItemStack(ModItems.SCOURGE.get()), zombie, 1);
            check("scourge: 4 doom", ModEffects.stacks(zombie, ModEffects.DOOM), 4);
            zombie.removeAllEffects();

            // Heirloom hammer copies a drop; tank shield allies; danse macabre absorption
            var drops = new java.util.ArrayList<ItemEntity>();
            drops.add(new ItemEntity(s, zombie.getX(), zombie.getY(), zombie.getZ(), new ItemStack(Items.ROTTEN_FLESH)));
            com.mockingjam.spirecraft.weapon.WeaponEvents.heirloom(s, drops);
            check("heirloom hammer: a drop is doubled", drops.size(), 2);
            report("tank shield: villagers are allies, zombies are not",
                    com.mockingjam.spirecraft.weapon.WeaponEvents.isAlly(EntityType.VILLAGER.create(s, EntitySpawnReason.COMMAND)) && !com.mockingjam.spirecraft.weapon.WeaponEvents.isAlly(zombie));
            player.setItemSlot(EquipmentSlot.OFFHAND, new ItemStack(ModItems.DANSE_MACABRE.get()));
            player.setAbsorptionAmount(0);
            com.mockingjam.spirecraft.weapon.Abilities.danseMacabre(player);
            com.mockingjam.spirecraft.weapon.Abilities.danseMacabre(player);
            check("danse macabre: two triggers -> 4 absorption", player.getAbsorptionAmount(), 4f);
            for (int i = 0; i < 5; i++) com.mockingjam.spirecraft.weapon.Abilities.danseMacabre(player);
            check("danse macabre: capped at 6", player.getAbsorptionAmount(), 6f);
            player.setItemSlot(EquipmentSlot.OFFHAND, ItemStack.EMPTY);
            player.removeAllEffects();

            // Bloodletting dagger: lose 3 HP, gain Strength and Haste
            player.setHealth(20);
            BloodlettingDagger.bleed(s, player);
            check("bloodletting: 20 -> 17 health", player.getHealth(), 17f);
            check("bloodletting: +1 strength", ModEffects.stacks(player, ModEffects.STRENGTH), 1);
            report("bloodletting: haste", player.hasEffect(MobEffects.HASTE));
            zombie.discard();
            s.getServer().getPlayerList().remove(player);
        });
    }

    private static void rangedChecks() {
        // Throwing knife: a real projectile dropped onto a zombie
        step(0, s -> {
            reset(s);
            player = mockPlayer(s);
            player.teleportTo(b.getX(), b.getY(), b.getZ() + 2);
            zombie = toughZombie(s);
            mark = zombie.getHealth();
            var knife = new com.mockingjam.spirecraft.weapon.projectile.ShivProjectile(s, player, new ItemStack(ModItems.THROWING_KNIFE.get()));
            knife.setPos(zombie.getX(), zombie.getY() + 3, zombie.getZ());
            knife.setDeltaMovement(0, -1.2, 0);
            s.addFreshEntity(knife);
        });
        step(15, s -> check("throwing knife: 4 damage", mark - zombie.getHealth(), 4f));

        step(0, s -> {
            zombie.removeAllEffects();
            check("poison flask: one bounce poisons the zombie", com.mockingjam.spirecraft.weapon.projectile.PoisonFlask.splash(s, zombie, player), 1);
            check("poison flask: 3 poison", ModEffects.stacks(zombie, ModEffects.POISON), 3);
            zombie.removeAllEffects();

            // Small bolts: rocket fist, slingshot pebble (x1.5 on Weak), ink knife (blind + weak)
            float before = zombie.getHealth();
            new com.mockingjam.spirecraft.weapon.projectile.SpireBolt(s, player, ItemStack.EMPTY, com.mockingjam.spirecraft.weapon.projectile.SpireBolt.Kind.FIST, 8).hit(s, zombie);
            check("rocket punch: fist 8 damage", before - zombie.getHealth(), 8f);
            before = zombie.getHealth();
            new com.mockingjam.spirecraft.weapon.projectile.SpireBolt(s, player, ItemStack.EMPTY, com.mockingjam.spirecraft.weapon.projectile.SpireBolt.Kind.PEBBLE, 6).hit(s, zombie);
            check("slingshot: pebble 6", before - zombie.getHealth(), 6f);
            zombie.addEffect(new MobEffectInstance(ModEffects.holder(ModEffects.WEAK), 200, 0));
            before = zombie.getHealth();
            new com.mockingjam.spirecraft.weapon.projectile.SpireBolt(s, player, ItemStack.EMPTY, com.mockingjam.spirecraft.weapon.projectile.SpireBolt.Kind.PEBBLE, 6).hit(s, zombie);
            check("slingshot: pebble on a weak target 9", before - zombie.getHealth(), 9f);
            zombie.removeAllEffects();
            new com.mockingjam.spirecraft.weapon.projectile.SpireBolt(s, player, ItemStack.EMPTY, com.mockingjam.spirecraft.weapon.projectile.SpireBolt.Kind.INK, 3).hit(s, zombie);
            report("ink knife: blind and weak", zombie.hasEffect(MobEffects.BLINDNESS) && zombie.hasEffect(ModEffects.holder(ModEffects.WEAK)));
            zombie.removeAllEffects();

            // Orbs (v2.2 queue): flak pellets, slots from energy cores, FIFO, frost armor, tesla
            check("flak cannon: 5 pellets with no orbs", com.mockingjam.spirecraft.weapon.FlakCannonItem.pellets(player), 5);
            check("orbs: 1 slot without an energy core", com.mockingjam.spirecraft.weapon.Orbs.slots(player), 1);
            player.getInventory().add(new ItemStack(ModItems.ENERGY_CORE.get()));
            player.getInventory().add(new ItemStack(ModItems.ENERGY_CORE.get()));
            check("orbs: +1 slot per energy core", com.mockingjam.spirecraft.weapon.Orbs.slots(player), 3);
            com.mockingjam.spirecraft.weapon.Orbs.channel(s, player, com.mockingjam.spirecraft.weapon.Orbs.Type.LIGHTNING);
            com.mockingjam.spirecraft.weapon.Orbs.channel(s, player, com.mockingjam.spirecraft.weapon.Orbs.Type.LIGHTNING);
            com.mockingjam.spirecraft.weapon.Orbs.channel(s, player, com.mockingjam.spirecraft.weapon.Orbs.Type.FROST);
            check("energy core: 2 lightning", com.mockingjam.spirecraft.weapon.Orbs.count(player, com.mockingjam.spirecraft.weapon.Orbs.Type.LIGHTNING), 2);
            check("energy core: 1 frost", com.mockingjam.spirecraft.weapon.Orbs.count(player, com.mockingjam.spirecraft.weapon.Orbs.Type.FROST), 1);
            check("frost orb: +2 armor", (float) player.getAttributeValue(Attributes.ARMOR), 2f);
            check("flak cannon: +1 pellet per orb", com.mockingjam.spirecraft.weapon.FlakCannonItem.pellets(player), 8);
            zombie.teleportTo(player.getX() + 2, player.getY(), player.getZ());
            before = zombie.getHealth();
            check("tesla coil: arcs to the zombie", com.mockingjam.spirecraft.weapon.Abilities.tesla(s, player), 1);
            check("tesla coil: 3 damage", before - zombie.getHealth(), 3f);
            com.mockingjam.spirecraft.weapon.Orbs.channel(s, player, com.mockingjam.spirecraft.weapon.Orbs.Type.FROST);   // full: the oldest (lightning) is evoked first
            check("orbs: first in, first out", com.mockingjam.spirecraft.weapon.Orbs.get(player).get(0).type().ordinal(), com.mockingjam.spirecraft.weapon.Orbs.Type.LIGHTNING.ordinal());
            check("orbs: still 3 after channeling into full slots", com.mockingjam.spirecraft.weapon.Orbs.count(player), 3);
            check("orbs: 2 frost now", com.mockingjam.spirecraft.weapon.Orbs.count(player, com.mockingjam.spirecraft.weapon.Orbs.Type.FROST), 2);
            check("frost orbs: +4 armor", (float) player.getAttributeValue(Attributes.ARMOR), 4f);
            report("orbs: an evoked lightning orb flies at the zombie",
                    !s.getEntitiesOfClass(com.mockingjam.spirecraft.weapon.projectile.OrbWisp.class, player.getBoundingBox().inflate(4)).isEmpty());
            com.mockingjam.spirecraft.weapon.Orbs.clear(player);
            check("orbs: cleared, armor back to 0", (float) player.getAttributeValue(Attributes.ARMOR), 0f);
            player.removeAllEffects();
            com.mockingjam.spirecraft.weapon.Abilities.shadowShield(s, player, ItemStack.EMPTY);
            check("shadow shield: channels a dark orb", com.mockingjam.spirecraft.weapon.Orbs.count(player, com.mockingjam.spirecraft.weapon.Orbs.Type.DARK), 1);
            report("shadow shield: absorption", player.hasEffect(MobEffects.ABSORPTION));
            before = zombie.getHealth();
            com.mockingjam.spirecraft.weapon.Orbs.evokeFront(s, player);
            check("dark orb: evoked burst deals 20 around the player", before - zombie.getHealth(), com.mockingjam.spirecraft.weapon.Orbs.DARK_DAMAGE);
            check("dark orb: gone after evoking", com.mockingjam.spirecraft.weapon.Orbs.count(player), 0);
            player.removeAllEffects();
            player.getInventory().clearContent();

            // Dirge flute gathers souls; the grimoire spends 3 of them on a bone servant
            ItemStack flute = new ItemStack(ModItems.DIRGE_FLUTE.get());
            player.getInventory().add(flute);
            Zombie victim = bareZombie(s);
            victim.teleportTo(player.getX() + 1, player.getY(), player.getZ());
            victim.hurtServer(s, victim.damageSources().magic(), 1000);
            ItemStack held = ItemStack.EMPTY;
            for (int i = 0; i < player.getInventory().getContainerSize(); i++) if (player.getInventory().getItem(i).is(ModItems.DIRGE_FLUTE.get())) held = player.getInventory().getItem(i);
            check("dirge flute: a death nearby gathers 1 soul", com.mockingjam.spirecraft.weapon.DirgeFlute.souls(held), 1);
            com.mockingjam.spirecraft.weapon.DirgeFlute.setSouls(held, 3);
            before = zombie.getHealth();
            check("dirge flute: 3 souls strike", com.mockingjam.spirecraft.weapon.DirgeFlute.release(s, player, held), 3);
            check("dirge flute: 3 x 3 damage", before - zombie.getHealth(), 9f);
            com.mockingjam.spirecraft.weapon.DirgeFlute.setSouls(held, 4);
            report("grimoire: summons Osty for 3 souls", com.mockingjam.spirecraft.weapon.Abilities.grimoire(s, player, ItemStack.EMPTY));
            check("grimoire: 1 soul left", com.mockingjam.spirecraft.weapon.DirgeFlute.souls(held), 1);
            var osty = com.mockingjam.spirecraft.mob.Osty.of(s, player, 8);
            report("grimoire: Osty is near and owned by the player", osty != null);
            if (osty != null) {
                check("osty: starts with 12 health", osty.getMaxHealth(), 12f);
                com.mockingjam.spirecraft.weapon.Abilities.grimoire(s, player, ItemStack.EMPTY);   // the last soul: Summon 4
                check("osty: 1 soul adds 4 max health", osty.getMaxHealth(), 16f);
                // Die for You: a 10-damage attack on the player goes to Osty; a 30-damage one leaves the overflow
                check("osty: takes a 10-damage hit for the player", com.mockingjam.spirecraft.weapon.WeaponEvents.dieForYou(s, osty, zombie.damageSources().mobAttack(zombie), 10), 0f);
                check("osty: 16 - 10 = 6 health left", osty.getHealth(), 6f);
                check("osty: overflow past its health reaches the player", com.mockingjam.spirecraft.weapon.WeaponEvents.dieForYou(s, osty, zombie.damageSources().mobAttack(zombie), 20), 14f);
                osty.discard();
            }
            player.getInventory().clearContent();
            zombie.discard();
            s.getServer().getPlayerList().remove(player);
        });
    }

    private static void checkMix(PotionBrewing brewing, Item ingredient, ItemStack input, RegistryObject<Potion> expected, String name) {
        var out = brewing.mix(new ItemStack(ingredient), input);
        var contents = out.get(DataComponents.POTION_CONTENTS);
        report(name, contents != null && contents.is(ModPotions.holder(expected)));
    }

    /** Fraction of 400 rolls of a chest table that contain the item. */
    private static float lootRate(ServerLevel level, ResourceKey<LootTable> table, Item item) {
        var loot = level.getServer().reloadableRegistries().getLootTable(table);
        var params = new LootParams.Builder(level).withParameter(LootContextParams.ORIGIN, Vec3.ZERO).create(LootContextParamSets.CHEST);
        int hits = 0;
        for (int i = 0; i < 400; i++) {
            if (loot.getRandomItems(params).stream().anyMatch(st -> st.is(item))) hits++;
        }
        return hits / 400f;
    }

    private static void check(String name, float actual, float expected, float tolerance) {
        report(name + " (expected " + expected + "±" + tolerance + ", got " + actual + ")", Math.abs(actual - expected) <= tolerance);
    }

    private static Zombie bareZombie(ServerLevel level) {
        Zombie z = EntityType.ZOMBIE.spawn(level, b.blockPosition().north(3), EntitySpawnReason.COMMAND);
        z.setNoAi(true);
        z.setBaby(false);
        for (EquipmentSlot slot : EquipmentSlot.values()) z.setItemSlot(slot, ItemStack.EMPTY);
        return z;
    }

    private static void wear(LivingEntity e, Item helmet, Item chest, Item legs, Item boots) {
        e.setItemSlot(EquipmentSlot.HEAD, new ItemStack(helmet));
        e.setItemSlot(EquipmentSlot.CHEST, new ItemStack(chest));
        e.setItemSlot(EquipmentSlot.LEGS, new ItemStack(legs));
        e.setItemSlot(EquipmentSlot.FEET, new ItemStack(boots));
    }

    /** Counts the given blocks (index = argument order) in an r x r chunk square around a position. */
    private static int[] countOres(ServerLevel level, BlockPos center, int r, int minY, int maxY, Block... blocks) {
        int[] counts = new int[blocks.length];
        var pos = new BlockPos.MutableBlockPos();
        int cx = center.getX() >> 4, cz = center.getZ() >> 4;
        for (int dx = -r / 2; dx < r - r / 2; dx++) for (int dz = -r / 2; dz < r - r / 2; dz++) {
            var chunk = level.getChunk(cx + dx, cz + dz);
            for (int x = 0; x < 16; x++) for (int z = 0; z < 16; z++) for (int y = minY; y <= maxY; y++) {
                var block = chunk.getBlockState(pos.set(x, y, z)).getBlock();
                for (int i = 0; i < blocks.length; i++) if (block == blocks[i]) counts[i]++;
            }
        }
        return counts;
    }

    /** Same approach as vanilla GameTestHelper#makeMockServerPlayerInLevel, but survival. */
    private static ServerPlayer mockPlayer(ServerLevel level) {
        var cookie = CommonListenerCookie.createInitial(new GameProfile(UUID.randomUUID(), "selftest"), false);
        ServerPlayer p = new ServerPlayer(level.getServer(), level, cookie.gameProfile(), cookie.clientInformation());
        Connection connection = new Connection(PacketFlow.SERVERBOUND);
        new EmbeddedChannel(connection);
        level.getServer().getPlayerList().placeNewPlayer(connection, p, cookie);
        p.setClientLoaded(true);   // a real client reports this; until then the server treats the player as invulnerable
        return p;
    }

    // ---------------------------------------------------------------- helpers
    private static void hitCase(String name, Consumer<ServerLevel> setup, float expected) {
        step(0, s -> { reset(s); setup.accept(s); hit(s, 4); });
        step(1, s -> check(name, lost(), expected));
    }

    private static void absorptionCase(String name, Runnable setup, float expected) {
        step(0, s -> { reset(s); setup.run(); });
        // Gains are detected tick-to-tick, so the golem must have ticked at least once first
        // (right after server start a freshly forced chunk can take a few ticks to start ticking entities).
        step(20, s -> b.addEffect(new MobEffectInstance(MobEffects.ABSORPTION, 600, 0)));
        step(2, s -> check(name, b.getAbsorptionAmount(), expected));
    }

    private static void step(int waitTicks, Consumer<ServerLevel> action) {
        STEPS.add(new Step(waitTicks, action));
    }

    private static void reset(ServerLevel level) {
        if (a != null) a.discard();
        if (b != null) b.discard();
        // Both golems stay inside the force-loaded chunk.
        BlockPos pos = level.getRespawnData().pos();
        BlockPos base = new BlockPos((pos.getX() & ~15) + 8, pos.getY() + 2, (pos.getZ() & ~15) + 8);
        a = EntityType.IRON_GOLEM.spawn(level, base.east(3), EntitySpawnReason.COMMAND);
        b = EntityType.IRON_GOLEM.spawn(level, base.west(3), EntitySpawnReason.COMMAND);
        a.setNoAi(true);
        b.setNoAi(true);
        mark = b.getHealth();
    }

    private static void give(LivingEntity e, RegistryObject<MobEffect> effect, int amplifier) {
        e.addEffect(new MobEffectInstance(ModEffects.holder(effect), 600, amplifier));
    }

    private static void hit(ServerLevel level, float amount) {
        b.invulnerableTime = 0;
        a.invulnerableTime = 0;
        mark = b.getHealth();
        b.hurtServer(level, b.damageSources().mobAttack(a), amount);
    }

    private static float lost() {
        return mark - b.getHealth();
    }

    private static boolean near(float x, float y) {
        return Math.abs(x - y) < 0.01f;
    }

    private static void check(String name, float actual, float expected) {
        report(name + " (expected " + expected + ", got " + actual + ")", near(actual, expected));
    }

    private static void report(String name, boolean ok) {
        SpireCraft.LOGGER.info("[SelfTest] {} {}", ok ? "PASS" : "FAIL", name);
        if (!ok) FAILURES.add(name);
    }

    // ---------------------------------------------------------------- runner
    private static void start(MinecraftServer server) {
        // No player is online, so force-load the test chunk or its entities never tick (no effect ticks, no LivingTickEvent).
        BlockPos spawn = server.overworld().getRespawnData().pos();
        server.overworld().setChunkForced(spawn.getX() >> 4, spawn.getZ() >> 4, true);
        plan();
        running = true;
        wait = 20;
        SpireCraft.LOGGER.info("[SelfTest] starting {} steps", STEPS.size());
    }

    private static void tick(MinecraftServer server) {
        if (!running || --wait > 0) return;
        ServerLevel level = server.overworld();
        if (stepIndex < STEPS.size()) {
            try {
                STEPS.get(stepIndex).action().accept(level);
            } catch (RuntimeException ex) {
                report("step " + stepIndex + " threw " + ex, false);
            }
            stepIndex++;
            wait = stepIndex < STEPS.size() ? Math.max(1, STEPS.get(stepIndex).waitTicks()) : 1;
            return;
        }
        running = false;
        SpireCraft.LOGGER.info("[SelfTest] DONE: {} failure(s) {}", FAILURES.size(), FAILURES);
        server.halt(false);
    }
}
