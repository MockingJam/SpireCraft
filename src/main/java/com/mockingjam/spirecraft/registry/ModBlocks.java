package com.mockingjam.spirecraft.registry;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.block.GlowvineBlock;
import com.mockingjam.spirecraft.block.GlowvinePlantBlock;
import com.mockingjam.spirecraft.block.StoneSet;
import com.mockingjam.spirecraft.block.ThinBlock;
import com.mockingjam.spirecraft.block.WoodSet;
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.item.DoubleHighBlockItem;
import net.minecraft.world.level.block.DoublePlantBlock;
import net.minecraft.world.level.block.HugeMushroomBlock;
import net.minecraft.world.level.block.MushroomBlock;
import net.minecraft.world.level.levelgen.feature.ConfiguredFeature;
import net.minecraft.world.level.material.PushReaction;
import java.util.function.BiFunction;
import java.util.function.Function;
import net.minecraft.resources.ResourceKey;
import net.minecraft.util.valueproviders.ConstantInt;
import net.minecraft.util.valueproviders.UniformInt;
import net.minecraft.world.item.BlockItem;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.DropExperienceBlock;
import net.minecraft.world.level.block.SoundType;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.minecraft.world.level.block.state.properties.NoteBlockInstrument;
import net.minecraft.world.level.material.MapColor;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

/** All blocks of the mod. {@link #register} also registers the matching BlockItem. */
public final class ModBlocks {
    public static final DeferredRegister<Block> BLOCKS = DeferredRegister.create(ForgeRegistries.BLOCKS, SpireCraft.MODID);

    // ---- Phase 3 ores & storage blocks (docs/design/materials.md). Hardness values mirror the vanilla counterpart. ----
    /** Like iron ore: drops raw material, no XP (XP comes from smelting). */
    public static final RegistryObject<Block> WOLFRAMITE_ORE = register("wolframite_ore",
            p -> new DropExperienceBlock(ConstantInt.of(0), p), stoneOre());
    public static final RegistryObject<Block> DEEPSLATE_WOLFRAMITE_ORE = register("deepslate_wolframite_ore",
            p -> new DropExperienceBlock(ConstantInt.of(0), p), deepslateOre());
    public static final RegistryObject<Block> TUNGSTEN_ALLOY_BLOCK = register("tungsten_alloy_block", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_GRAY).requiresCorrectToolForDrops().strength(6.0F, 8.0F).sound(SoundType.NETHERITE_BLOCK));

    /** v3.5: compressed scrap (nine scrap make one); what the scrap piles are mostly made of. */
    public static final RegistryObject<Block> JUNK_BLOCK = register("junk_block", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.TERRACOTTA_BROWN).requiresCorrectToolForDrops().strength(2.0F, 4.0F).sound(SoundType.NETHERITE_BLOCK));
    /** v3.5: white fungal threads growing over walls like lichen (the fungus shrine). */
    public static final RegistryObject<Block> HIVE_MYCELIUM_LAYER = register("hive_mycelium_layer", net.minecraft.world.level.block.MultifaceBlock::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.WOOL).noCollision().strength(0.2F).sound(SoundType.MOSS_CARPET).pushReaction(PushReaction.DESTROY).replaceable());
    /** v3.5: a strand of fungal thread hanging from a ceiling (shroomlights hang on them). */
    public static final RegistryObject<Block> MYCELIUM_THREAD = register("mycelium_thread", com.mockingjam.spirecraft.block.MyceliumThreadBlock::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.WOOL).noCollision().instabreak().sound(SoundType.MOSS_CARPET).pushReaction(PushReaction.DESTROY));
    /** v3.5: the dried remains of a big bug, fungus sprouting from it (placeable, about a block in size). */
    public static final RegistryObject<Block> BUG_CARCASS = register("bug_carcass", com.mockingjam.spirecraft.block.BugCarcassBlock::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.TERRACOTTA_WHITE).strength(0.8F).sound(SoundType.BONE_BLOCK).noOcclusion());
    /** v3.5: a Byrdonis egg (STS2 Byrdonis Nest): big as a sniffer egg, cream with raspberry spots. */
    public static final RegistryObject<Block> BYRDONIS_EGG = register("byrdonis_egg", com.mockingjam.spirecraft.block.ByrdonisEggBlock::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.TERRACOTTA_WHITE).strength(0.5F).sound(SoundType.METAL).noOcclusion());

    /** v3.4: the automaton alloy (STS Defect's machines: copper with gold and quartz, pale brass) - plain, tarnished, derelict. */
    public static final RegistryObject<Block> AUTOMATON_ALLOY_BLOCK = register("automaton_alloy_block", Block::new, BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_YELLOW).requiresCorrectToolForDrops().strength(5.0F, 6.0F).sound(SoundType.COPPER));
    public static final RegistryObject<Block> TARNISHED_AUTOMATON_ALLOY_BLOCK = register("tarnished_automaton_alloy_block", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.TERRACOTTA_GREEN).requiresCorrectToolForDrops().strength(5.0F, 6.0F).sound(SoundType.COPPER));
    public static final RegistryObject<Block> DERELICT_AUTOMATON_ALLOY_BLOCK = register("derelict_automaton_alloy_block", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.TERRACOTTA_GREEN).requiresCorrectToolForDrops().strength(4.0F, 6.0F).sound(SoundType.COPPER));
    /** v3.4: the energy core's own crystal (sky blue, glowing) and a cracked, dimmer piece of it. */
    public static final RegistryObject<Block> CORE_CRYSTAL_BLOCK = register("core_crystal_block", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_LIGHT_BLUE).requiresCorrectToolForDrops().strength(1.5F).sound(SoundType.AMETHYST).lightLevel(s -> 12));
    public static final RegistryObject<Block> CRACKED_CORE_CRYSTAL_BLOCK = register("cracked_core_crystal_block", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_LIGHT_BLUE).requiresCorrectToolForDrops().strength(1.2F).sound(SoundType.AMETHYST).lightLevel(s -> 5));

    /** Deepslate only (the orichalcum vein never reaches stone layers). */
    public static final RegistryObject<Block> ORICHALCUM_ORE = register("orichalcum_ore",
            p -> new DropExperienceBlock(ConstantInt.of(0), p), deepslateOre());
    public static final RegistryObject<Block> ORICHALCUM_BLOCK = register("orichalcum_block", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_GREEN).requiresCorrectToolForDrops().strength(5.0F, 6.0F).sound(SoundType.METAL));

    /** Like nether quartz ore. */
    public static final RegistryObject<Block> NETHER_BRIMSTONE_ORE = register("nether_brimstone_ore",
            p -> new DropExperienceBlock(UniformInt.of(2, 5), p),
            BlockBehaviour.Properties.of().mapColor(MapColor.NETHER).instrument(NoteBlockInstrument.BASEDRUM)
                    .requiresCorrectToolForDrops().strength(3.0F, 3.0F).sound(SoundType.NETHER_ORE));
    /** Burns forever once lit (infiniburn tags), like netherrack. */
    public static final RegistryObject<Block> BRIMSTONE_BLOCK = register("brimstone_block", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_YELLOW).instrument(NoteBlockInstrument.BASEDRUM)
                    .requiresCorrectToolForDrops().strength(1.5F, 3.0F).sound(SoundType.NETHERRACK));

    /** Replaces basalt in basalt deltas. */
    public static final RegistryObject<Block> LAVA_ROCK_ORE = register("lava_rock_ore",
            p -> new DropExperienceBlock(UniformInt.of(1, 3), p),
            BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_BLACK).instrument(NoteBlockInstrument.BASEDRUM)
                    .requiresCorrectToolForDrops().strength(3.0F, 4.2F).lightLevel(s -> 4).sound(SoundType.BASALT));

    // ---- Phase 7 biome blocks (docs/design/biomes.md) ----
    // Overgrowth
    public static final WoodSet GNARLWOOD = new WoodSet("gnarlwood", MapColor.TERRACOTTA_GREEN, MapColor.COLOR_BROWN, true);
    public static final StoneSet RUIN_STONE = new StoneSet("ruin_stone", () -> stone(MapColor.COLOR_GREEN));
    public static final StoneSet RUIN_STONE_BRICKS = new StoneSet("ruin_stone_bricks", () -> stone(MapColor.COLOR_GREEN));
    public static final RegistryObject<Block> CRACKED_RUIN_STONE_BRICKS = register("cracked_ruin_stone_bricks", Block::new, stone(MapColor.COLOR_GREEN));
    public static final RegistryObject<Block> CHISELED_RUIN_STONE_BRICKS = register("chiseled_ruin_stone_bricks", Block::new, stone(MapColor.COLOR_GREEN));
    /** v3.5: flat stones laid on the ground like a carpet (paths, the Kin plaza) - replaces the flagstone path block. */
    public static final RegistryObject<Block> PAVING_STONES = register("paving_stones", net.minecraft.world.level.block.CarpetBlock::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.STONE).strength(0.6F).sound(SoundType.STONE).noOcclusion().pushReaction(PushReaction.DESTROY));
    public static final RegistryObject<Block> GLOWVINE = register("glowvine", GlowvineBlock::new, vine());
    public static final RegistryObject<Block> GLOWVINE_PLANT = registerNoItem("glowvine_plant", GlowvinePlantBlock::new, vine());
    public static final ResourceKey<ConfiguredFeature<?, ?>> HUGE_FOGCAP_FEATURE = ResourceKey.create(Registries.CONFIGURED_FEATURE,
            ResourceLocation.fromNamespaceAndPath(SpireCraft.MODID, "huge_fogcap"));
    public static final RegistryObject<Block> FOGCAP = register("fogcap", p -> new com.mockingjam.spirecraft.block.FogcapBlock(HUGE_FOGCAP_FEATURE, p),
            BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_LIGHT_BLUE).noCollision().randomTicks().instabreak().sound(SoundType.GRASS)
                    .lightLevel(s -> 1).hasPostProcess((s, l, pos) -> true).pushReaction(PushReaction.DESTROY));
    public static final RegistryObject<Block> FOGCAP_BLOCK = register("fogcap_block", HugeMushroomBlock::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_LIGHT_BLUE).instrument(NoteBlockInstrument.BASS).strength(0.2F).sound(SoundType.WOOD).ignitedByLava());
    public static final RegistryObject<Block> SPIRE_FERN = register("spire_fern", DoublePlantBlock::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.PLANT).replaceable().noCollision().instabreak().sound(SoundType.GRASS)
                    .offsetType(BlockBehaviour.OffsetType.XZ).ignitedByLava().pushReaction(PushReaction.DESTROY), DoubleHighBlockItem::new);

    // Underdocks
    public static final StoneSet DOCK_BRICKS = new StoneSet("dock_bricks", () -> stone(MapColor.COLOR_PURPLE).strength(2.0F, 6.0F));
    public static final RegistryObject<Block> CRACKED_DOCK_BRICKS = register("cracked_dock_bricks", Block::new, stone(MapColor.COLOR_PURPLE).strength(2.0F, 6.0F));
    /** v2.4: the harbours' rock; barnacles grow on it as a layer block (BARNACLES). */
    public static final StoneSet HARBOUR_ROCK = new StoneSet("harbour_rock", () -> stone(MapColor.COLOR_BLUE).sound(SoundType.TUFF));
    /** v3.2: barnacle rock is gone (barnacles are a layer block now); its polished form is polished harbour rock. */
    public static final StoneSet POLISHED_HARBOUR_ROCK = new StoneSet("polished_harbour_rock", () -> stone(MapColor.COLOR_BLUE).sound(SoundType.POLISHED_TUFF));
    /** Like mud, but slows walkers down (half of soul sand's slowdown). */
    public static final RegistryObject<Block> SLUDGE = register("sludge", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.TERRACOTTA_PURPLE).strength(0.5F).speedFactor(0.7F).jumpFactor(0.8F).sound(SoundType.MUD));
    // v2.3: the dark harbours' ground (no light sand or gravel there) and the vents at the bottom of the ink pools
    public static final RegistryObject<Block> DARK_SAND = register("dark_sand", p -> new net.minecraft.world.level.block.ColoredFallingBlock(new net.minecraft.util.ColorRGBA(0x47433c), p),
            BlockBehaviour.Properties.of().mapColor(MapColor.TERRACOTTA_GRAY).instrument(net.minecraft.world.level.block.state.properties.NoteBlockInstrument.SNARE).strength(0.5F).sound(SoundType.SAND));
    public static final RegistryObject<Block> INK_VENT = register("ink_vent", com.mockingjam.spirecraft.block.InkVentBlock::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_BLACK).requiresCorrectToolForDrops().strength(1.5F, 6.0F).sound(SoundType.TUFF).lightLevel(st -> 3));

    // Hive
    /** v3.5: the giant hive shroom's stem - pale beige mushroom wood; it cannot be stripped (it looks peeled already). */
    public static final WoodSet HIVESHROOM = new WoodSet("hiveshroom", MapColor.SAND, MapColor.SAND, false, false, false, "hiveshroom_stem", "hiveshroom_hyphae");
    public static final RegistryObject<Block> HIVE_SOIL = register("hive_soil", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.GOLD).strength(0.5F).sound(SoundType.GRAVEL));
    /** Tough Egg (STS2 Ovicopter): stacks 1–4 like turtle eggs, translucent pale teal; never hatches turtles. */
    public static final RegistryObject<Block> HIVE_EGG = register("hive_egg", com.mockingjam.spirecraft.block.ToughEggBlock::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_LIGHT_BLUE).forceSolidOn().strength(0.5F).sound(SoundType.METAL).noOcclusion()
                    .pushReaction(PushReaction.DESTROY));

    // ---- Biomes v2 (docs/design/biomes_v2.md) ----
    // Dark harbours + polluted sea (blue-black palette)
    /** Rotten wood: never grows (no leaves, no sapling); crafted from any logs + rotten flesh. */
    public static final WoodSet ROTTEN = new WoodSet("rotten", MapColor.COLOR_BLACK, MapColor.TERRACOTTA_BLACK, false, false);
    public static final RegistryObject<Block> REED = register("reed", com.mockingjam.spirecraft.block.HarbourPlants.Reed::new,
            plant(MapColor.TERRACOTTA_BROWN), DoubleHighBlockItem::new);
    public static final RegistryObject<Block> ROTTEN_SHRUB = register("rotten_shrub",
            p -> new com.mockingjam.spirecraft.block.SpirePlantBlock(com.mockingjam.spirecraft.block.SpirePlantBlock.Ground.SHORE, 12, 13, p),
            plant(MapColor.TERRACOTTA_BLACK));
    public static final RegistryObject<Block> POLLUTED_CORAL_BLOCK = register("polluted_coral_block", Block::new,
            stone(MapColor.TERRACOTTA_PURPLE).sound(SoundType.CORAL_BLOCK));
    public static final RegistryObject<Block> POLLUTED_TUBE_CORAL = register("polluted_tube_coral", net.minecraft.world.level.block.BaseCoralPlantBlock::new, coral());
    public static final RegistryObject<Block> POLLUTED_HORN_CORAL = register("polluted_horn_coral", net.minecraft.world.level.block.BaseCoralPlantBlock::new, coral());
    public static final RegistryObject<Block> POLLUTED_CORAL_WALL_FAN = registerNoItem("polluted_coral_wall_fan", net.minecraft.world.level.block.BaseCoralWallFanBlock::new, coral());
    public static final RegistryObject<Block> POLLUTED_CORAL_FAN = register("polluted_coral_fan", net.minecraft.world.level.block.BaseCoralFanBlock::new, coral(),
            (b, p) -> new net.minecraft.world.item.StandingAndWallBlockItem(b, POLLUTED_CORAL_WALL_FAN.get(), net.minecraft.core.Direction.DOWN, p));
    public static final RegistryObject<Block> POLLUTED_SEAGRASS = register("polluted_seagrass", net.minecraft.world.level.block.SeagrassBlock::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.WATER).replaceable().noCollision().instabreak().sound(SoundType.WET_GRASS).pushReaction(PushReaction.DESTROY));
    public static final RegistryObject<Block> POLLUTED_KELP_PLANT = registerNoItem("polluted_kelp_plant", com.mockingjam.spirecraft.block.HarbourPlants.KelpPlant::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.WATER).noCollision().instabreak().sound(SoundType.WET_GRASS).pushReaction(PushReaction.DESTROY));
    public static final RegistryObject<Block> POLLUTED_KELP = register("polluted_kelp", com.mockingjam.spirecraft.block.HarbourPlants.Kelp::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.WATER).noCollision().randomTicks().instabreak().sound(SoundType.WET_GRASS).pushReaction(PushReaction.DESTROY));

    // Overgrowth family: mushrooms, glowing plants, giant-mushroom caps
    public static final RegistryObject<Block> LANTERN_CAP = register("lantern_cap", p -> new com.mockingjam.spirecraft.block.SpireMushroomBlock(com.mockingjam.spirecraft.block.SpirePlantBlock.Ground.FOREST, 10, 10, "giant_lantern_cap", p), plant(MapColor.COLOR_YELLOW).lightLevel(s -> 8));
    public static final RegistryObject<Block> CORAL_CAP = register("coral_cap", p -> new com.mockingjam.spirecraft.block.SpireMushroomBlock(com.mockingjam.spirecraft.block.SpirePlantBlock.Ground.FOREST, 12, 10, "giant_coral_cap", p), plant(MapColor.COLOR_ORANGE));
    public static final RegistryObject<Block> BLUEBELL_CAP = register("bluebell_cap", p -> new com.mockingjam.spirecraft.block.SpireMushroomBlock(com.mockingjam.spirecraft.block.SpirePlantBlock.Ground.FOREST, 10, 13, "giant_bluebell", p), plant(MapColor.COLOR_LIGHT_BLUE).lightLevel(s -> 2));
    public static final RegistryObject<Block> SHELF_FUNGUS = register("shelf_fungus", com.mockingjam.spirecraft.block.ShelfFungusBlock::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.TERRACOTTA_ORANGE).noCollision().instabreak().sound(SoundType.FUNGUS).pushReaction(PushReaction.DESTROY));
    public static final RegistryObject<Block> GLOW_SHRUB = register("glow_shrub", p -> forestPlant(14, 12, p), plant(MapColor.PLANT).lightLevel(s -> 10));
    public static final RegistryObject<Block> GLOW_MOSS_CARPET = register("glow_moss_carpet", net.minecraft.world.level.block.CarpetBlock::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_GREEN).strength(0.1F).sound(SoundType.MOSS_CARPET).lightLevel(s -> 4).pushReaction(PushReaction.DESTROY));
    public static final RegistryObject<Block> LANTERN_CAP_BLOCK = register("lantern_cap_block", HugeMushroomBlock::new, capBlock(MapColor.COLOR_YELLOW).lightLevel(s -> 12));
    public static final RegistryObject<Block> CORAL_CAP_BLOCK = register("coral_cap_block", HugeMushroomBlock::new, capBlock(MapColor.COLOR_ORANGE));
    // v2.4: the giant hive shroom of the sparse ("mushroom") hive caves
    public static final RegistryObject<Block> HIVE_SHROOM_BLOCK = register("hive_shroom_block", HugeMushroomBlock::new, capBlock(MapColor.COLOR_YELLOW).lightLevel(s -> 9));
    public static final RegistryObject<Block> BLUEBELL_CAP_BLOCK = register("bluebell_cap_block", HugeMushroomBlock::new, capBlock(MapColor.COLOR_LIGHT_BLUE).lightLevel(s -> 6));

    // Ink spring caves (the ink fluid itself lives in fluid/ModFluids)
    /** Deep ink stone: what deepslate becomes inside the ink spring caves. */
    public static final StoneSet INK_STAINED_STONE = new StoneSet("ink_stained_stone", () -> stone(MapColor.COLOR_BLACK).sound(SoundType.DEEPSLATE));
    /** v2.8: barnacles as a thin layer on rock faces (like glow lichen); a hoe scrapes them off as bone meal, silk touch keeps them. */
    public static final RegistryObject<Block> BARNACLES = register("barnacles", net.minecraft.world.level.block.MultifaceBlock::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_LIGHT_GRAY).noCollision().strength(0.3F).sound(SoundType.BONE_BLOCK).pushReaction(PushReaction.DESTROY));
    /** v2.8: hive soil overgrown with pale fungal threads (the mushroom hives). */
    public static final RegistryObject<Block> HIVE_MYCELIUM = register("hive_mycelium", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.TERRACOTTA_YELLOW).strength(0.6F).sound(SoundType.NYLIUM));
    /** v2.7: the rock right against the ink, crazed with fine heat cracks. */
    public static final RegistryObject<Block> CRACKED_INK_STONE = register("cracked_ink_stone", Block::new, stone(MapColor.COLOR_BLACK).sound(SoundType.DEEPSLATE));
    public static final RegistryObject<Block> INK_BUBBLE = registerNoItem("ink_bubble", com.mockingjam.spirecraft.block.InkBubbleBlock::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_PURPLE).noCollision().noOcclusion().instabreak().sound(SoundType.SLIME_BLOCK)
                    .lightLevel(s -> 3).pushReaction(PushReaction.DESTROY));

    // Hive caves
    public static final StoneSet HIVE_ROCK = new StoneSet("hive_rock", () -> stone(MapColor.TERRACOTTA_ORANGE).sound(SoundType.TUFF));
    public static final StoneSet POLISHED_HIVE_ROCK = new StoneSet("polished_hive_rock", () -> stone(MapColor.TERRACOTTA_ORANGE).sound(SoundType.POLISHED_TUFF));
    /** Deep hive rock: what deepslate becomes inside the hive caves. */
    public static final StoneSet DEEP_HIVE_ROCK = new StoneSet("deep_hive_rock", () -> stone(MapColor.TERRACOTTA_BROWN).strength(3.0F, 6.0F).sound(SoundType.DEEPSLATE));
    public static final StoneSet HIVE_ROCK_BRICKS = new StoneSet("hive_rock_bricks", () -> stone(MapColor.TERRACOTTA_ORANGE).sound(SoundType.TUFF_BRICKS));
    public static final RegistryObject<Block> HIVE_COMB = register("hive_comb", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_ORANGE).strength(0.8F).sound(SoundType.CORAL_BLOCK));
    /** Hive cache: break it for a share of the hive's hoard (loot table). */
    public static final RegistryObject<Block> HIVE_CACHE = register("hive_cache", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_ORANGE).strength(1.0F).sound(SoundType.CORAL_BLOCK));
    public static final RegistryObject<Block> HIVE_SHROOM = register("hive_shroom",
            p -> new com.mockingjam.spirecraft.block.SpireMushroomBlock(com.mockingjam.spirecraft.block.SpirePlantBlock.Ground.HIVE, 10, 9, "giant_hive_shroom", p),
            plant(MapColor.COLOR_YELLOW).lightLevel(s -> 3));

    // Phase 9 structures (docs/design/structures.md)
    /** v3.3: the Kin's roofs - golden ochre thatch (STS2 Kin colours), with stairs and slabs for pitched roofs. */
    public static final RegistryObject<Block> THATCH = register("thatch", Block::new, BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_YELLOW).strength(0.5F).sound(SoundType.GRASS).ignitedByLava());
    public static final RegistryObject<Block> THATCH_STAIRS = register("thatch_stairs", p -> new net.minecraft.world.level.block.StairBlock(THATCH.get().defaultBlockState(), p), BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_YELLOW).strength(0.5F).sound(SoundType.GRASS).ignitedByLava());
    public static final RegistryObject<Block> THATCH_SLAB = register("thatch_slab", net.minecraft.world.level.block.SlabBlock::new, BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_YELLOW).strength(0.5F).sound(SoundType.GRASS).ignitedByLava());
    /** v3.3: woven twigs - the Byrdonis nest. */
    public static final RegistryObject<Block> TWIG_NEST = register("twig_nest", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.WOOD).strength(0.6F).sound(SoundType.MANGROVE_ROOTS).ignitedByLava());   // v3.6 (user): solid again, twigs packed tight
    /** v3.3: hive soil hardened with silk - the outside of the web nests, the base of the bowl bug nests. */
    public static final RegistryObject<Block> WEBBED_HIVE_SOIL = register("webbed_hive_soil", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.DIRT).strength(1.2F).sound(SoundType.ROOTED_DIRT));
    /** v3.3: hive building blocks after the vanilla ones (packed mud, mud bricks, cracked / chiseled stone bricks). */
    public static final RegistryObject<Block> PACKED_HIVE_SOIL = register("packed_hive_soil", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.DIRT).strength(1.0F, 3.0F).sound(SoundType.PACKED_MUD));
    public static final StoneSet HIVE_SOIL_BRICKS = new StoneSet("hive_soil_bricks", () -> BlockBehaviour.Properties.of().mapColor(MapColor.DIRT)
            .requiresCorrectToolForDrops().strength(1.5F, 3.0F).sound(SoundType.MUD_BRICKS));
    public static final RegistryObject<Block> CRACKED_HIVE_ROCK_BRICKS = register("cracked_hive_rock_bricks", Block::new, stone(MapColor.TERRACOTTA_ORANGE).sound(SoundType.TUFF_BRICKS));
    public static final RegistryObject<Block> CHISELED_HIVE_ROCK_BRICKS = register("chiseled_hive_rock_bricks", Block::new, stone(MapColor.TERRACOTTA_ORANGE).sound(SoundType.TUFF_BRICKS));
    /** Silk hive: the silk-wrapped walls of the web nests (盘丝巢穴). */
    public static final RegistryObject<Block> SILK_HIVE = register("silk_hive", Block::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.WOOL).strength(0.8F).sound(SoundType.WOOL));
    /** The sword in the statue's hands (石中剑): take it with a right-click. */
    public static final RegistryObject<Block> SWORD_STATUE = register("sword_statue", com.mockingjam.spirecraft.block.SwordStatueBlock::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.METAL).strength(-1.0F, 3600000.0F).noOcclusion().noLootTable().sound(SoundType.METAL));

    // Quicksand caves
    public static final RegistryObject<Block> QUICKSAND = register("quicksand", com.mockingjam.spirecraft.block.QuicksandBlock::new,
            BlockBehaviour.Properties.of().mapColor(MapColor.SAND).strength(0.5F).sound(SoundType.SAND).dynamicShape().noOcclusion()
                    .isRedstoneConductor((s, l, p) -> false).isSuffocating((s, l, p) -> false).isViewBlocking((s, l, p) -> true));

    private ModBlocks() {}

    private static BlockBehaviour.Properties plant(MapColor color) {
        return BlockBehaviour.Properties.of().mapColor(color).replaceable().noCollision().instabreak().sound(SoundType.GRASS)
                .offsetType(BlockBehaviour.OffsetType.XZ).ignitedByLava().pushReaction(PushReaction.DESTROY);
    }

    private static BlockBehaviour.Properties coral() {
        return BlockBehaviour.Properties.of().mapColor(MapColor.TERRACOTTA_PURPLE).forceSolidOn().instrument(NoteBlockInstrument.BASEDRUM)
                .requiresCorrectToolForDrops().noCollision().instabreak();
    }

    private static BlockBehaviour.Properties capBlock(MapColor color) {
        return BlockBehaviour.Properties.of().mapColor(color).instrument(NoteBlockInstrument.BASS).strength(0.2F).sound(SoundType.WOOD).ignitedByLava();
    }

    private static com.mockingjam.spirecraft.block.SpirePlantBlock forestPlant(int width, int height, BlockBehaviour.Properties p) {
        return new com.mockingjam.spirecraft.block.SpirePlantBlock(com.mockingjam.spirecraft.block.SpirePlantBlock.Ground.FOREST, width, height, p);
    }

    private static BlockBehaviour.Properties stone(MapColor color) {
        return BlockBehaviour.Properties.of().mapColor(color).instrument(NoteBlockInstrument.BASEDRUM).requiresCorrectToolForDrops().strength(1.5F, 6.0F);
    }

    private static BlockBehaviour.Properties vine() {
        return BlockBehaviour.Properties.of().mapColor(MapColor.PLANT).randomTicks().noCollision().instabreak().sound(SoundType.CAVE_VINES)
                .lightLevel(s -> 7).pushReaction(PushReaction.DESTROY);
    }

    public static <T extends Block> RegistryObject<T> registerNoItem(String name, Function<BlockBehaviour.Properties, T> factory, BlockBehaviour.Properties props) {
        ResourceKey<Block> key = BLOCKS.key(name);
        return BLOCKS.register(name, () -> factory.apply(props.setId(key)));
    }

    private static BlockBehaviour.Properties stoneOre() {
        return BlockBehaviour.Properties.of().mapColor(MapColor.STONE).instrument(NoteBlockInstrument.BASEDRUM)
                .requiresCorrectToolForDrops().strength(3.0F, 3.0F);
    }

    private static BlockBehaviour.Properties deepslateOre() {
        return BlockBehaviour.Properties.of().mapColor(MapColor.DEEPSLATE).instrument(NoteBlockInstrument.BASEDRUM)
                .requiresCorrectToolForDrops().strength(4.5F, 3.0F).sound(SoundType.DEEPSLATE);
    }

    public static <T extends Block> RegistryObject<T> register(String name, Function<BlockBehaviour.Properties, T> factory, BlockBehaviour.Properties props) {
        return register(name, factory, props, BlockItem::new);
    }

    public static <T extends Block> RegistryObject<T> register(String name, Function<BlockBehaviour.Properties, T> factory,
            BlockBehaviour.Properties props, BiFunction<Block, Item.Properties, ? extends Item> itemFactory) {
        ResourceKey<Block> key = BLOCKS.key(name);
        RegistryObject<T> block = BLOCKS.register(name, () -> factory.apply(props.setId(key)));
        ModItems.register(name, p -> itemFactory.apply(block.get(), p.useBlockDescriptionPrefix()), Item.Properties::new);
        return block;
    }
}
