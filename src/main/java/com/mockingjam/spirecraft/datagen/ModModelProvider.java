package com.mockingjam.spirecraft.datagen;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mockingjam.spirecraft.registry.ModItems;
import com.mockingjam.spirecraft.block.BiomeBlocks;
import com.mockingjam.spirecraft.block.StoneSet;
import com.mockingjam.spirecraft.block.WoodSet;
import java.util.List;
import java.util.Optional;
import net.minecraft.client.data.models.model.ModelTemplate;
import net.minecraft.client.data.models.model.TextureMapping;
import net.minecraft.client.data.models.model.TextureSlot;
import net.minecraft.client.data.models.model.TexturedModel;
import net.minecraft.data.BlockFamily;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.stream.Stream;
import net.minecraft.client.data.models.BlockModelGenerators;
import net.minecraft.client.data.models.ItemModelGenerators;
import net.minecraft.client.data.models.ItemModelOutput;
import net.minecraft.client.data.models.ModelProvider;
import net.minecraft.client.data.models.blockstates.BlockModelDefinitionGenerator;
import net.minecraft.client.data.models.model.ItemModelUtils;
import net.minecraft.client.data.models.model.ModelInstance;
import net.minecraft.client.data.models.model.ModelLocationUtils;
import net.minecraft.client.data.models.model.ModelTemplates;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.data.PackOutput;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.block.Block;

/**
 * Blockstates, block/item models and the 1.21.4+ item definitions (assets/spirecraft/items/*.json).
 * Items with a hand-made Blockbench model are NOT listed here; their JSON lives in src/main/resources.
 */
public class ModModelProvider extends ModelProvider {
    public ModModelProvider(PackOutput output) {
        super(output);
    }

    @Override
    protected Stream<Block> getKnownBlocks() {
        return BuiltInRegistries.BLOCK.stream().filter(b -> SpireCraft.MODID.equals(b.builtInRegistryHolder().key().location().getNamespace()));
    }

    @Override
    protected Stream<Item> getKnownItems() {
        return BuiltInRegistries.ITEM.stream().filter(i -> SpireCraft.MODID.equals(i.builtInRegistryHolder().key().location().getNamespace()));
    }

    @Override
    protected BlockModelGenerators getBlockModelGenerators(BlockStateGeneratorCollector blocks, ItemInfoCollector items, SimpleModelCollector models) {
        return new Blocks(blocks, new TrackingItems(items), models);
    }

    @Override
    protected ItemModelGenerators getItemModelGenerators(ItemInfoCollector items, SimpleModelCollector models) {
        return new Items(items, models);
    }

    static final class Blocks extends BlockModelGenerators {
        Blocks(Consumer<BlockModelDefinitionGenerator> blockStates, ItemModelOutput items, BiConsumer<ResourceLocation, ModelInstance> models) {
            super(blockStates, items, models);
        }

        @Override
        public void run() {
            for (var block : List.of(ModBlocks.WOLFRAMITE_ORE, ModBlocks.DEEPSLATE_WOLFRAMITE_ORE, ModBlocks.TUNGSTEN_ALLOY_BLOCK,
                    ModBlocks.ORICHALCUM_ORE, ModBlocks.ORICHALCUM_BLOCK, ModBlocks.NETHER_BRIMSTONE_ORE, ModBlocks.BRIMSTONE_BLOCK,
                    ModBlocks.LAVA_ROCK_ORE)) {
                cube(block.get());
            }
            biomeBlocks();
            // Every phase 7 block item that no generator above described gets its block model (vanilla's default)
            TrackingItems tracked = (TrackingItems) itemModelOutput;
            for (var block : BiomeBlocks.tabOrder()) {
                Item item = block.get().asItem();
                if (!tracked.seen.contains(item)) itemModelOutput.accept(item, ItemModelUtils.plainModel(ModelLocationUtils.getModelLocation(block.get())));
            }
        }

        private void biomeBlocks() {
            for (WoodSet w : BiomeBlocks.woods()) {
                woodProvider(w.log.get()).logWithHorizontal(w.log.get()).wood(w.wood.get());
                if (w.strippable) woodProvider(w.strippedLog.get()).logWithHorizontal(w.strippedLog.get()).wood(w.strippedWood.get());
                if (w.hasTree) {
                    createTrivialBlock(w.leaves.get(), TexturedModel.LEAVES);
                    createCrossBlockWithDefaultItem(w.sapling.get(), PlantType.NOT_TINTED);
                }
                family(w.planks.get()).generateFor(new BlockFamily.Builder(w.planks.get())
                        .button(w.button.get()).fence(w.fence.get()).fenceGate(w.fenceGate.get()).pressurePlate(w.pressurePlate.get())
                        .slab(w.slab.get()).stairs(w.stairs.get()).door(w.door.get()).trapdoor(w.trapdoor.get())
                        .recipeGroupPrefix("wooden").recipeUnlockedBy("has_planks").getFamily());
            }
            for (StoneSet set : BiomeBlocks.stones()) {
                family(set.base.get()).generateFor(new BlockFamily.Builder(set.base.get())
                        .stairs(set.stairs.get()).slab(set.slab.get()).wall(set.wall.get()).getFamily());
            }
            for (var block : List.of(ModBlocks.CRACKED_RUIN_STONE_BRICKS, ModBlocks.CHISELED_RUIN_STONE_BRICKS, ModBlocks.CRACKED_DOCK_BRICKS,
                    ModBlocks.SLUDGE, ModBlocks.HIVE_SOIL, ModBlocks.JUNK_BLOCK)) {
                createTrivialCube(block.get());
            }
            // v3.5: paving stones (a carpet of flat stones), the fungus layer and threads, the bug carcass, the Byrdonis egg
            Block paving = ModBlocks.PAVING_STONES.get();
            blockStateOutput.accept(createSimpleBlock(paving, plainVariant(TexturedModel.CARPET.get(paving).create(paving, modelOutput))));
            createMultiface(ModBlocks.HIVE_MYCELIUM_LAYER.get());
            createCrossBlockWithDefaultItem(ModBlocks.MYCELIUM_THREAD.get(), PlantType.NOT_TINTED);
            createNonTemplateHorizontalBlock(ModBlocks.BUG_CARCASS.get());
            itemModelOutput.accept(ModBlocks.BUG_CARCASS.get().asItem(), ItemModelUtils.plainModel(SpireCraft.id("block/bug_carcass")));
            createNonTemplateModelBlock(ModBlocks.BYRDONIS_EGG.get());
            itemModelOutput.accept(ModBlocks.BYRDONIS_EGG.get().asItem(), ItemModelUtils.plainModel(SpireCraft.id("block/byrdonis_egg")));
            // Hanging glowvines
            createCrossBlockWithDefaultItem(ModBlocks.GLOWVINE.get(), PlantType.NOT_TINTED);
            createCrossBlock(ModBlocks.GLOWVINE_PLANT.get(), PlantType.NOT_TINTED);
            // Fogcap mushroom, its huge-mushroom cap, the fern
            createCrossBlockWithDefaultItem(ModBlocks.FOGCAP.get(), PlantType.NOT_TINTED);
            createMushroomBlock(ModBlocks.FOGCAP_BLOCK.get());
            createDoublePlantWithDefaultItem(ModBlocks.SPIRE_FERN.get(), PlantType.NOT_TINTED);
            // Barnacle spire: a dripstone-like column (tip / frustum / middle / base); tough eggs: 1–4 eggs like turtle eggs;
            // iron pipe (hand-made model)
            Block eggs = ModBlocks.HIVE_EGG.get();
            TextureMapping eggTex = TextureMapping.cube(eggs);
            ResourceLocation[] eggModels = {
                    ModelTemplates.TURTLE_EGG.create(SpireCraft.id("block/hive_egg"), eggTex, modelOutput),
                    ModelTemplates.TWO_TURTLE_EGGS.create(SpireCraft.id("block/two_hive_eggs"), eggTex, modelOutput),
                    ModelTemplates.THREE_TURTLE_EGGS.create(SpireCraft.id("block/three_hive_eggs"), eggTex, modelOutput),
                    ModelTemplates.FOUR_TURTLE_EGGS.create(SpireCraft.id("block/four_hive_eggs"), eggTex, modelOutput) };
            blockStateOutput.accept(net.minecraft.client.data.models.blockstates.MultiVariantGenerator.dispatch(eggs).with(
                    net.minecraft.client.data.models.blockstates.PropertyDispatch.initial(
                            net.minecraft.world.level.block.state.properties.BlockStateProperties.EGGS,
                            net.minecraft.world.level.block.state.properties.BlockStateProperties.HATCH)
                            .generate((n, hatch) -> createRotatedVariants(plainModel(eggModels[n - 1])))));
            registerSimpleFlatItemModel(eggs.asItem());
            // the cave stones' ores
            for (var ore : com.mockingjam.spirecraft.block.CaveOres.allOres()) cube(ore.get());
            // v2.3: dark sand; the ink vent (its own top, deep ink stone sides)
            cube(ModBlocks.DARK_SAND.get());
            cube(ModBlocks.CRACKED_INK_STONE.get());
            createMultiface(ModBlocks.BARNACLES.get());
            Block myc = ModBlocks.HIVE_MYCELIUM.get();
            blockStateOutput.accept(createSimpleBlock(myc, plainVariant(ModelTemplates.CUBE_BOTTOM_TOP.create(myc, new TextureMapping()
                    .put(TextureSlot.TOP, TextureMapping.getBlockTexture(myc, "_top")).put(TextureSlot.SIDE, TextureMapping.getBlockTexture(myc, "_side"))
                    .put(TextureSlot.BOTTOM, TextureMapping.getBlockTexture(ModBlocks.HIVE_SOIL.get())), modelOutput))));
            itemModelOutput.accept(myc.asItem(), ItemModelUtils.plainModel(ModelLocationUtils.getModelLocation(myc)));
            Block vent = ModBlocks.INK_VENT.get();
            blockStateOutput.accept(createSimpleBlock(vent, plainVariant(ModelTemplates.CUBE_COLUMN.create(vent,
                    new TextureMapping().put(TextureSlot.END, TextureMapping.getBlockTexture(vent, "_top"))
                            .put(TextureSlot.SIDE, TextureMapping.getBlockTexture(ModBlocks.INK_STAINED_STONE.base.get())), modelOutput))));
            itemModelOutput.accept(vent.asItem(), ItemModelUtils.plainModel(ModelLocationUtils.getModelLocation(vent)));
            biomesV2();
        }

        /** Biomes v2 blocks (docs/design/biomes_v2.md). */
        private void biomesV2() {
            // reeds (v2.3): the wheat-style "#" model instead of a cross, so a reed reads as a thick tuft of stalks
            Block reed = ModBlocks.REED.get();
            ResourceLocation reedTop = ModelTemplates.CROP.createWithSuffix(reed, "_top", TextureMapping.crop(TextureMapping.getBlockTexture(reed, "_top")), modelOutput);
            ResourceLocation reedBottom = ModelTemplates.CROP.createWithSuffix(reed, "_bottom", TextureMapping.crop(TextureMapping.getBlockTexture(reed, "_bottom")), modelOutput);
            blockStateOutput.accept(net.minecraft.client.data.models.blockstates.MultiVariantGenerator.dispatch(reed).with(
                    net.minecraft.client.data.models.blockstates.PropertyDispatch.initial(net.minecraft.world.level.block.state.properties.BlockStateProperties.DOUBLE_BLOCK_HALF)
                            .select(net.minecraft.world.level.block.state.properties.DoubleBlockHalf.UPPER, plainVariant(reedTop))
                            .select(net.minecraft.world.level.block.state.properties.DoubleBlockHalf.LOWER, plainVariant(reedBottom))));
            registerSimpleFlatItemModel(reed, "_top");
            for (var plant : List.of(ModBlocks.ROTTEN_SHRUB, ModBlocks.LANTERN_CAP, ModBlocks.CORAL_CAP, ModBlocks.BLUEBELL_CAP, ModBlocks.GLOW_SHRUB,
                    ModBlocks.HIVE_SHROOM, ModBlocks.POLLUTED_TUBE_CORAL, ModBlocks.POLLUTED_HORN_CORAL)) {
                createCrossBlockWithDefaultItem(plant.get(), PlantType.NOT_TINTED);
            }
            createCoralFans(ModBlocks.POLLUTED_CORAL_FAN.get(), ModBlocks.POLLUTED_CORAL_WALL_FAN.get());
            createTrivialBlock(ModBlocks.POLLUTED_SEAGRASS.get(), TexturedModel.SEAGRASS);
            registerSimpleFlatItemModel(ModBlocks.POLLUTED_SEAGRASS.get());
            createGrowingPlant(ModBlocks.POLLUTED_KELP.get(), ModBlocks.POLLUTED_KELP_PLANT.get(), PlantType.NOT_TINTED);
            registerSimpleFlatItemModel(ModBlocks.POLLUTED_KELP.get());
            for (var cube : List.of(ModBlocks.POLLUTED_CORAL_BLOCK, ModBlocks.HIVE_COMB, ModBlocks.HIVE_CACHE, ModBlocks.QUICKSAND)) createTrivialCube(cube.get());
            for (var cap : List.of(ModBlocks.LANTERN_CAP_BLOCK, ModBlocks.CORAL_CAP_BLOCK, ModBlocks.BLUEBELL_CAP_BLOCK, ModBlocks.HIVE_SHROOM_BLOCK)) createMushroomBlock(cap.get());
            Block carpet = ModBlocks.GLOW_MOSS_CARPET.get();
            blockStateOutput.accept(createSimpleBlock(carpet, plainVariant(TexturedModel.CARPET.get(carpet).create(carpet, modelOutput))));
            // shelf fungus and the ink bubble: hand-made models (models/block/*.json); the ink fluid: particle only
            createNonTemplateHorizontalBlock(ModBlocks.SHELF_FUNGUS.get());
            registerSimpleFlatItemModel(ModBlocks.SHELF_FUNGUS.get().asItem());
            createNonTemplateModelBlock(ModBlocks.INK_BUBBLE.get());
            // phase 9: silk hive; the statue's sword (hand-made models: the sword, and an empty one once it is taken)
            createTrivialCube(ModBlocks.SILK_HIVE.get());
            // v3.3: thatch (+ stairs, slab), twig nest, webbed hive soil, the hive building blocks
            family(ModBlocks.THATCH.get()).generateFor(new BlockFamily.Builder(ModBlocks.THATCH.get()).stairs(ModBlocks.THATCH_STAIRS.get()).slab(ModBlocks.THATCH_SLAB.get()).getFamily());
            for (var cube : List.of(ModBlocks.AUTOMATON_ALLOY_BLOCK, ModBlocks.TARNISHED_AUTOMATON_ALLOY_BLOCK, ModBlocks.DERELICT_AUTOMATON_ALLOY_BLOCK,
                    ModBlocks.CORE_CRYSTAL_BLOCK, ModBlocks.CRACKED_CORE_CRYSTAL_BLOCK, ModBlocks.ORANGE_DOUGH,
                    ModBlocks.POLISHED_AUTOMATON_ALLOY, ModBlocks.POLISHED_ORANGE_DOUGH, ModBlocks.ORANGE_DOUGH_BRICKS, ModBlocks.STAR_LAMP, ModBlocks.STAR_GLASS)) {
                createTrivialCube(cube.get());
                itemModelOutput.accept(cube.get().asItem(), ItemModelUtils.plainModel(ModelLocationUtils.getModelLocation(cube.get())));
            }
            for (var cube : List.of(ModBlocks.TWIG_NEST, ModBlocks.WEBBED_HIVE_SOIL, ModBlocks.PACKED_HIVE_SOIL, ModBlocks.CRACKED_HIVE_ROCK_BRICKS, ModBlocks.CHISELED_HIVE_ROCK_BRICKS)) {
                createTrivialCube(cube.get());
            }
            itemModelOutput.accept(ModBlocks.SILK_HIVE.get().asItem(), ItemModelUtils.plainModel(ModelLocationUtils.getModelLocation(ModBlocks.SILK_HIVE.get())));
            // the harbour rock spire: pointed-dripstone models by direction and thickness, a flat item
            Block spire = ModBlocks.HARBOUR_ROCK_SPIRE.get();
            blockStateOutput.accept(net.minecraft.client.data.models.blockstates.MultiVariantGenerator.dispatch(spire).with(
                    net.minecraft.client.data.models.blockstates.PropertyDispatch.initial(com.mockingjam.spirecraft.block.HarbourSpireBlock.TIP_DIRECTION,
                                    com.mockingjam.spirecraft.block.HarbourSpireBlock.THICKNESS)
                            .generate((dir, t) -> {
                                String suffix = "_" + dir.getSerializedName() + "_" + t.getSerializedName();
                                return plainVariant(ModelTemplates.POINTED_DRIPSTONE.createWithSuffix(spire, suffix,
                                        TextureMapping.cross(TextureMapping.getBlockTexture(spire, suffix)), modelOutput));
                            })));
            itemModelOutput.accept(spire.asItem(), ItemModelUtils.plainModel(ModelTemplates.FLAT_ITEM.create(ModelLocationUtils.getModelLocation(spire.asItem()),
                    TextureMapping.layer0(SpireCraft.id("item/harbour_rock_spire")), modelOutput)));
            // the brass lamp: off / on models by its LIT state, like the redstone lamp
            Block lamp = ModBlocks.AUTOMATON_ALLOY_LAMP.get();
            var lampOff = ModelTemplates.CUBE_ALL.create(lamp, TextureMapping.cube(lamp), modelOutput);
            var lampOn = ModelTemplates.CUBE_ALL.createWithSuffix(lamp, "_on", TextureMapping.cube(TextureMapping.getBlockTexture(lamp, "_on")), modelOutput);
            blockStateOutput.accept(net.minecraft.client.data.models.blockstates.MultiVariantGenerator.dispatch(lamp).with(
                    net.minecraft.client.data.models.blockstates.PropertyDispatch.initial(net.minecraft.world.level.block.state.properties.BlockStateProperties.LIT)
                            .generate(lit -> plainVariant(lit ? lampOn : lampOff))));
            itemModelOutput.accept(lamp.asItem(), ItemModelUtils.plainModel(lampOff));
            Block sword = ModBlocks.SWORD_STATUE.get();
            blockStateOutput.accept(net.minecraft.client.data.models.blockstates.MultiVariantGenerator.dispatch(sword).with(
                    net.minecraft.client.data.models.blockstates.PropertyDispatch.initial(com.mockingjam.spirecraft.block.SwordStatueBlock.FACING,
                                    com.mockingjam.spirecraft.block.SwordStatueBlock.HAS_SWORD)
                            .generate((f, has) -> {
                                var v = plainVariant(SpireCraft.id(has ? "block/sword_statue" : "block/sword_statue_empty"));
                                return switch (f) { case EAST -> v.with(Y_ROT_90); case SOUTH -> v.with(Y_ROT_180); case WEST -> v.with(Y_ROT_270); default -> v; };
                            })));
            itemModelOutput.accept(sword.asItem(), ItemModelUtils.plainModel(SpireCraft.id("block/sword_statue")));
            Block ink = com.mockingjam.spirecraft.fluid.ModFluids.INK_BLOCK.get();
            blockStateOutput.accept(createSimpleBlock(ink, plainVariant(ModelTemplates.PARTICLE_ONLY.create(ink,
                    new TextureMapping().put(TextureSlot.PARTICLE, SpireCraft.id("block/ink_still")), modelOutput))));
        }

        private static final ModelTemplate PATH_TEMPLATE = new ModelTemplate(Optional.of(ResourceLocation.withDefaultNamespace("block/dirt_path")),
                Optional.empty(), TextureSlot.TOP, TextureSlot.SIDE, TextureSlot.BOTTOM, TextureSlot.PARTICLE);

        /** Full cube with one texture, plus its block-item definition (vanilla's default hook would also emit vanilla items). */
        private void cube(Block block) {
            createTrivialCube(block);
            itemModelOutput.accept(block.asItem(), ItemModelUtils.plainModel(ModelLocationUtils.getModelLocation(block)));
        }
    }

/** Records which items got a definition, so leftovers can get the plain block model. */
    static final class TrackingItems implements ItemModelOutput {
        final ItemModelOutput delegate;
        final java.util.Set<Item> seen = new java.util.HashSet<>();

        TrackingItems(ItemModelOutput delegate) {
            this.delegate = delegate;
        }

        @Override
        public void accept(Item item, net.minecraft.client.renderer.item.ItemModel.Unbaked model) {
            seen.add(item);
            delegate.accept(item, model);
        }

        @Override
        public void copy(Item from, Item to) {
            seen.add(to);
            delegate.copy(from, to);
        }
    }

    static final class Items extends ItemModelGenerators {
        Items(ItemModelOutput items, BiConsumer<ResourceLocation, ModelInstance> models) {
            super(items, models);
        }

        /**
         * v2.1 weapon visuals. Shields: the inventory icon stays the drawn sprite, in the world they are the 3D
         * models from tools/shield3d.js (raised while blocking, like vanilla). Rocket Punch: an empty launcher while the
         * fist is out (on cooldown). Liquid daggers: an animated dripping sprite right after a swing / the self-harm.
         */
        private void weaponStates() {
            for (var shield : List.of(ModItems.TANK_SHIELD, ModItems.LIGHTNING_ROD)) {
                Item item = shield.get();
                ResourceLocation icon = createFlatItemModel(item, ModelTemplates.FLAT_ITEM);
                ResourceLocation model = ModelLocationUtils.getModelLocation(item, "_3d");
                itemModelOutput.accept(item, ItemModelUtils.select(new net.minecraft.client.renderer.item.properties.select.DisplayContext(),
                        ItemModelUtils.conditional(ItemModelUtils.isUsingItem(),
                                ItemModelUtils.plainModel(model.withSuffix("_blocking")), ItemModelUtils.plainModel(model)),
                        ItemModelUtils.when(net.minecraft.world.item.ItemDisplayContext.GUI, ItemModelUtils.plainModel(icon))));
            }
            // Dirge Flute: held level at the mouth while it is played (models/item/dirge_flute_playing.json)
            Item flute = ModItems.DIRGE_FLUTE.get();
            itemModelOutput.accept(flute, ItemModelUtils.conditional(ItemModelUtils.isUsingItem(),
                    ItemModelUtils.plainModel(SpireCraft.id("item/dirge_flute_playing")),
                    ItemModelUtils.plainModel(createFlatItemModel(flute, ModelTemplates.FLAT_HANDHELD_ITEM))));
            // guns: held like any handheld weapon, but with the sprite mirrored (tools/mirror_guns.js) so the muzzle
            // points forward; the inventory / ground / frame icon is the drawing as it is
            itemModelOutput.accept(ModItems.FLAK_CANNON.get(), gun(ModItems.FLAK_CANNON.get(), ""));
            Item launcher = ModItems.ROCKET_PUNCH.get();
            itemModelOutput.accept(launcher, ItemModelUtils.rangeSelect(new net.minecraft.client.renderer.item.properties.numeric.Cooldown(),
                    gun(launcher, ""), ItemModelUtils.override(gun(launcher, "_empty"), 0.0001F)));
            itemModelOutput.accept(ModItems.ROCKET_FIST.get(), ItemModelUtils.plainModel(SpireCraft.id("item/rocket_fist")));
            for (var dagger : List.of(ModItems.POISONED_DAGGER, ModItems.INK_DAGGER, ModItems.BLOODLETTING_DAGGER)) {
                Item item = dagger.get();
                // inventory: the original drawing with its drops; in hand: liquid on the blade, dripping after a swing
                itemModelOutput.accept(item, ItemModelUtils.select(new net.minecraft.client.renderer.item.properties.select.DisplayContext(),
                        ItemModelUtils.conditional(new com.mockingjam.spirecraft.client.DrippingProperty(),
                                ItemModelUtils.plainModel(createFlatItemModel(item, "_drip", ModelTemplates.FLAT_HANDHELD_ITEM)),
                                ItemModelUtils.plainModel(createFlatItemModel(item, ModelTemplates.FLAT_HANDHELD_ITEM))),
                        ItemModelUtils.when(net.minecraft.world.item.ItemDisplayContext.GUI,
                                ItemModelUtils.plainModel(createFlatItemModel(item, "_icon", ModelTemplates.FLAT_ITEM)))));
            }
        }

        private net.minecraft.client.renderer.item.ItemModel.Unbaked gun(Item item, String suffix) {
            ResourceLocation icon = createFlatItemModel(item, suffix, ModelTemplates.FLAT_ITEM);
            ResourceLocation held = ModelTemplates.FLAT_HANDHELD_ITEM.create(ModelLocationUtils.getModelLocation(item, suffix + "_held"),
                    TextureMapping.layer0(TextureMapping.getItemTexture(item, suffix + "_held")), modelOutput);
            return ItemModelUtils.select(new net.minecraft.client.renderer.item.properties.select.DisplayContext(), ItemModelUtils.plainModel(held),
                    ItemModelUtils.when(List.of(net.minecraft.world.item.ItemDisplayContext.GUI, net.minecraft.world.item.ItemDisplayContext.GROUND,
                            net.minecraft.world.item.ItemDisplayContext.FIXED), ItemModelUtils.plainModel(icon)));
        }

        @Override
        public void run() {
            generateFlatItem(ModItems.BURNING_BLOOD.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(ModItems.TUNGSTEN_ROD.get(), ModelTemplates.FLAT_HANDHELD_ITEM);
            for (var weapon : List.of(ModItems.SOVEREIGN_BLADE, ModItems.CRESCENT_SPEAR, ModItems.HEIRLOOM_HAMMER, ModItems.REGENT_STRIKE, ModItems.PHOTON_CUT, ModItems.SCYTHE, ModItems.SCOURGE, ModItems.FORBIDDEN_GRIMOIRE, ModItems.DANSE_MACABRE, ModItems.POISON_FLASK, ModItems.THROWING_KNIFE, ModItems.SLINGSHOT, ModItems.SNAKEBITE, ModItems.CLEAVER, ModItems.MORNING_STAR, ModItems.INFERNAL_BLADE, ModItems.BLUDGEON, ModItems.ENERGY_CORE, ModItems.TESLA_COIL, ModItems.SHADOW_SHIELD)) {
                generateFlatItem(weapon.get(), ModelTemplates.FLAT_HANDHELD_ITEM);
            }
            weaponStates();
            for (var ammo : List.of(ModItems.PEBBLE, ModItems.SCRAP, ModItems.ORANGE_DOUGH_LUMP, ModItems.CORE_CRYSTAL, ModItems.FLAK_SHELL, ModItems.INK_BUBBLE, ModItems.DOCK_BRICK, ModItems.AUTOMATON_ALLOY_INGOT)) generateFlatItem(ammo.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(com.mockingjam.spirecraft.fluid.ModFluids.INK_BUCKET.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(ModItems.RELIC_POUCH.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(ModItems.ANCHOR.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(ModItems.VAJRA.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(ModItems.ODDLY_SMOOTH_STONE.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(ModItems.BAG_OF_MARBLES.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(ModItems.RED_MASK.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(ModItems.BRONZE_SCALES.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(ModItems.BLOOD_VIAL.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(ModItems.RED_SKULL.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(ModItems.PEN_NIB.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(ModItems.MERCURY_HOURGLASS.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(ModItems.SHURIKEN.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(ModItems.LIZARD_TAIL.get(), ModelTemplates.FLAT_ITEM);
            for (var egg : ModItems.SPAWN_EGGS) generateFlatItem(egg.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(ModItems.CEREMONIAL_BELL.get(), ModelTemplates.FLAT_ITEM);
            for (var it : ModItems.BOSS_SUMMONS) generateFlatItem(it.get(), ModelTemplates.FLAT_ITEM);
            generateFlatItem(ModItems.RELIC_FRAGMENT.get(), ModelTemplates.FLAT_ITEM);
            for (var it : List.of(ModItems.BECKONING_SOUL, ModItems.SOUL_BAIT, ModItems.SOUL_FYSH_BLADDER)) generateFlatItem(it.get(), ModelTemplates.FLAT_ITEM);

            for (var item : List.of(ModItems.RAW_TUNGSTEN, ModItems.TUNGSTEN_INGOT, ModItems.TUNGSTEN_ALLOY_INGOT,
                    ModItems.RAW_ORICHALCUM, ModItems.ORICHALCUM_INGOT, ModItems.BRIMSTONE, ModItems.LAVA_ROCK_SHARD,
                    ModItems.LAVA_ROCK, ModItems.GALACTIC_DUST,
                    ModItems.STRAWBERRY, ModItems.PEAR, ModItems.MANGO, ModItems.MEAT_ON_THE_BONE, ModItems.AMETHYST_AUBERGINE,
                    ModItems.TUNGSTEN_HELMET, ModItems.TUNGSTEN_CHESTPLATE, ModItems.TUNGSTEN_LEGGINGS, ModItems.TUNGSTEN_BOOTS,
                    ModItems.ORICHALCUM_HELMET, ModItems.ORICHALCUM_CHESTPLATE, ModItems.ORICHALCUM_LEGGINGS, ModItems.ORICHALCUM_BOOTS)) {
                generateFlatItem(item.get(), ModelTemplates.FLAT_ITEM);
            }
            for (var tool : List.of(ModItems.ORICHALCUM_SWORD, ModItems.ORICHALCUM_PICKAXE, ModItems.ORICHALCUM_AXE,
                    ModItems.ORICHALCUM_SHOVEL, ModItems.ORICHALCUM_HOE)) {
                generateFlatItem(tool.get(), ModelTemplates.FLAT_HANDHELD_ITEM);
            }
        }
    }
}
