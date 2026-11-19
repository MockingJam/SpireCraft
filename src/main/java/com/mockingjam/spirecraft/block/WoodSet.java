package com.mockingjam.spirecraft.block;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.registry.ModBlocks;
import java.util.List;
import java.util.Optional;
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.tags.TagKey;
import net.minecraft.world.item.DoubleHighBlockItem;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.ButtonBlock;
import net.minecraft.world.level.block.DoorBlock;
import net.minecraft.world.level.block.FenceBlock;
import net.minecraft.world.level.block.FenceGateBlock;
import net.minecraft.world.level.block.PressurePlateBlock;
import net.minecraft.world.level.block.RotatedPillarBlock;
import net.minecraft.world.level.block.SaplingBlock;
import net.minecraft.world.level.block.SlabBlock;
import net.minecraft.world.level.block.SoundType;
import net.minecraft.world.level.block.StairBlock;
import net.minecraft.world.level.block.TintedParticleLeavesBlock;
import net.minecraft.world.level.block.TrapDoorBlock;
import net.minecraft.world.level.block.grower.TreeGrower;
import net.minecraft.world.level.block.state.BlockBehaviour.Properties;
import net.minecraft.world.level.block.state.properties.BlockSetType;
import net.minecraft.world.level.block.state.properties.NoteBlockInstrument;
import net.minecraft.world.level.block.state.properties.WoodType;
import net.minecraft.world.level.levelgen.feature.ConfiguredFeature;
import net.minecraft.world.level.material.MapColor;
import net.minecraft.world.level.material.PushReaction;
import net.minecraftforge.registries.RegistryObject;

/**
 * A full vanilla-style wood family (no signs/boats yet). Property values copy the oak blocks in vanilla Blocks.java.
 * {@link #tree} names the configured feature the sapling grows (defined in worldgen datagen).
 */
public final class WoodSet {
    public final String name;
    public final BlockSetType setType;
    public final WoodType woodType;
    public final ResourceKey<ConfiguredFeature<?, ?>> tree;
    public final TreeGrower grower;
    public final TagKey<Block> logsBlockTag;
    public final TagKey<Item> logsItemTag;
    public final RegistryObject<Block> log, strippedLog, wood, strippedWood, planks, slab, stairs, fence, fenceGate,
            door, trapdoor, button, pressurePlate, leaves, sapling;

    public final boolean hasTree, strippable;
    /** Registry names of the log and the wood block (name_log / name_wood, or a mushroom's name_stem / name_hyphae). */
    public final String logName, woodName;

    public WoodSet(String name, MapColor planksColor, MapColor barkColor, boolean megaTree) {
        this(name, planksColor, barkColor, megaTree, true);
    }

    /** @param hasTree false for wood that never grows (rotten wood): no leaves, no sapling (both null). */
    public WoodSet(String name, MapColor planksColor, MapColor barkColor, boolean megaTree, boolean hasTree) {
        this(name, planksColor, barkColor, megaTree, hasTree, true, name + "_log", name + "_wood");
    }

    /**
     * v3.5: {@code strippable} false for a mushroom's stem (it already looks peeled): no stripped blocks (both null),
     * the stem and hyphae are plain pillars; {@code logName}/{@code woodName} name them (e.g. hiveshroom_stem).
     */
    public WoodSet(String name, MapColor planksColor, MapColor barkColor, boolean megaTree, boolean hasTree, boolean strippable, String logName, String woodName) {
        this.name = name;
        this.hasTree = hasTree;
        this.strippable = strippable;
        this.logName = logName;
        this.woodName = woodName;
        this.setType = BlockSetType.register(new BlockSetType(SpireCraft.MODID + ":" + name));
        this.woodType = WoodType.register(new WoodType(SpireCraft.MODID + ":" + name, setType));
        this.tree = ResourceKey.create(Registries.CONFIGURED_FEATURE, ResourceLocation.fromNamespaceAndPath(SpireCraft.MODID, name));
        this.grower = megaTree
                ? new TreeGrower(SpireCraft.MODID + ":" + name, Optional.of(tree), Optional.empty(), Optional.empty())
                : new TreeGrower(SpireCraft.MODID + ":" + name, Optional.empty(), Optional.of(tree), Optional.empty());
        ResourceLocation tagId = ResourceLocation.fromNamespaceAndPath(SpireCraft.MODID, name + "_logs");
        this.logsBlockTag = TagKey.create(Registries.BLOCK, tagId);
        this.logsItemTag = TagKey.create(Registries.ITEM, tagId);

        if (strippable) {
            strippedLog = ModBlocks.register("stripped_" + name + "_log", RotatedPillarBlock::new, log(planksColor, planksColor));
            strippedWood = ModBlocks.register("stripped_" + name + "_wood", RotatedPillarBlock::new, log(planksColor, planksColor));
            log = ModBlocks.register(logName, p -> new StrippableLogBlock(strippedLog, p), log(planksColor, barkColor));
            wood = ModBlocks.register(woodName, p -> new StrippableLogBlock(strippedWood, p), log(barkColor, barkColor));
        } else {
            strippedLog = null;
            strippedWood = null;
            log = ModBlocks.register(logName, RotatedPillarBlock::new, log(planksColor, barkColor));
            wood = ModBlocks.register(woodName, RotatedPillarBlock::new, log(barkColor, barkColor));
        }
        planks = ModBlocks.register(name + "_planks", Block::new, planks(planksColor));
        slab = ModBlocks.register(name + "_slab", SlabBlock::new, planks(planksColor));
        stairs = ModBlocks.register(name + "_stairs", p -> new StairBlock(planks.get().defaultBlockState(), p), planks(planksColor));
        fence = ModBlocks.register(name + "_fence", FenceBlock::new, planks(planksColor).forceSolidOn());
        fenceGate = ModBlocks.register(name + "_fence_gate", p -> new FenceGateBlock(woodType, p), planks(planksColor).forceSolidOn());
        door = ModBlocks.register(name + "_door", p -> new DoorBlock(setType, p),
                Properties.of().mapColor(planksColor).instrument(NoteBlockInstrument.BASS).strength(3.0F).noOcclusion()
                        .ignitedByLava().pushReaction(PushReaction.DESTROY), DoubleHighBlockItem::new);
        trapdoor = ModBlocks.register(name + "_trapdoor", p -> new TrapDoorBlock(setType, p),
                Properties.of().mapColor(planksColor).instrument(NoteBlockInstrument.BASS).strength(3.0F).noOcclusion()
                        .isValidSpawn((s, l, pos, e) -> false).ignitedByLava());
        button = ModBlocks.register(name + "_button", p -> new ButtonBlock(setType, 30, p),
                Properties.of().noCollision().strength(0.5F).pushReaction(PushReaction.DESTROY));
        pressurePlate = ModBlocks.register(name + "_pressure_plate", p -> new PressurePlateBlock(setType, p),
                Properties.of().mapColor(planksColor).forceSolidOn().instrument(NoteBlockInstrument.BASS).noCollision().strength(0.5F)
                        .ignitedByLava().pushReaction(PushReaction.DESTROY));
        leaves = !hasTree ? null : ModBlocks.register(name + "_leaves", p -> new TintedParticleLeavesBlock(0.01F, p),
                Properties.of().mapColor(MapColor.PLANT).strength(0.2F).randomTicks().sound(SoundType.GRASS).noOcclusion()
                        .isValidSpawn((s, l, pos, e) -> false).isSuffocating((s, l, pos) -> false).isViewBlocking((s, l, pos) -> false)
                        .ignitedByLava().pushReaction(PushReaction.DESTROY).isRedstoneConductor((s, l, pos) -> false));
        sapling = !hasTree ? null : ModBlocks.register(name + "_sapling", p -> new SaplingBlock(grower, p),
                Properties.of().mapColor(MapColor.PLANT).noCollision().randomTicks().instabreak().sound(SoundType.GRASS)
                        .pushReaction(PushReaction.DESTROY));
    }

    private static Properties log(MapColor top, MapColor side) {
        return Properties.of().mapColor(s -> s.getValue(RotatedPillarBlock.AXIS) == net.minecraft.core.Direction.Axis.Y ? top : side)
                .instrument(NoteBlockInstrument.BASS).strength(2.0F).sound(SoundType.WOOD).ignitedByLava();
    }

    private static Properties planks(MapColor color) {
        return Properties.of().mapColor(color).instrument(NoteBlockInstrument.BASS).strength(2.0F, 3.0F).sound(SoundType.WOOD).ignitedByLava();
    }

    public List<RegistryObject<Block>> logs() {
        return strippable ? List.of(log, strippedLog, wood, strippedWood) : List.of(log, wood);
    }

    public List<RegistryObject<Block>> all() {
        List<RegistryObject<Block>> out = new java.util.ArrayList<>(logs());
        out.addAll(List.of(planks, slab, stairs, fence, fenceGate, door, trapdoor, button, pressurePlate));
        if (hasTree) { out.add(leaves); out.add(sapling); }
        return out;
    }
}
