package com.mockingjam.spirecraft.block;

import com.mockingjam.spirecraft.registry.ModBlocks;
import java.util.List;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.SlabBlock;
import net.minecraft.world.level.block.StairBlock;
import net.minecraft.world.level.block.WallBlock;
import net.minecraft.world.level.block.state.BlockBehaviour.Properties;
import net.minecraftforge.registries.RegistryObject;

/** A base block with its stairs, slab and wall (like vanilla stone bricks). */
public final class StoneSet {
    public final String name;
    public final RegistryObject<Block> base, stairs, slab, wall;

    /** @param baseName registry name of the full block; derived blocks drop a trailing "s" (bricks → brick_stairs). */
    public StoneSet(String baseName, java.util.function.Supplier<Properties> props) {
        this.name = baseName;
        String stem = baseName.endsWith("bricks") || baseName.endsWith("tiles") ? baseName.substring(0, baseName.length() - 1)
                : baseName.endsWith("_block") ? baseName.substring(0, baseName.length() - 6) : baseName;
        base = ModBlocks.register(baseName, Block::new, props.get());
        stairs = ModBlocks.register(stem + "_stairs", p -> new StairBlock(base.get().defaultBlockState(), p), props.get());
        slab = ModBlocks.register(stem + "_slab", SlabBlock::new, props.get());
        wall = ModBlocks.register(stem + "_wall", WallBlock::new, props.get().forceSolidOn());
    }

    public List<RegistryObject<Block>> all() {
        return List.of(base, stairs, slab, wall);
    }
}
