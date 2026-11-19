package com.mockingjam.spirecraft.datagen;

import static com.mockingjam.spirecraft.worldgen.ModBiomes.*;

import com.mockingjam.spirecraft.SpireCraft;
import java.util.concurrent.CompletableFuture;
import net.minecraft.core.HolderLookup;
import net.minecraft.data.PackOutput;
import net.minecraft.data.tags.BiomeTagsProvider;
import net.minecraft.tags.BiomeTags;
import net.minecraftforge.common.data.ExistingFileHelper;
import org.jetbrains.annotations.Nullable;

/** Puts the phase 7 biomes into the vanilla tags their host biomes are in (overworld, underground structures, ...). */
public class ModBiomeTagsProvider extends BiomeTagsProvider {
    public ModBiomeTagsProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookup, @Nullable ExistingFileHelper existing) {
        super(output, lookup, SpireCraft.MODID, existing);
    }

    @Override
    protected void addTags(HolderLookup.Provider provider) {
        // every v2 biome is an overworld biome with the usual underground structures
        for (var tag : java.util.List.of(BiomeTags.IS_OVERWORLD, BiomeTags.HAS_MINESHAFT, BiomeTags.HAS_TRIAL_CHAMBERS,
                BiomeTags.HAS_STRONGHOLD, BiomeTags.STRONGHOLD_BIASED_TO)) {
            for (var b : ALL) tag(tag).add(b);
        }
        tag(BiomeTags.IS_JUNGLE).add(OVERGROWTH, MISTY_OVERGROWTH, MUSHROOM_OVERGROWTH);
        tag(BiomeTags.HAS_RUINED_PORTAL_JUNGLE).add(OVERGROWTH, MISTY_OVERGROWTH, MUSHROOM_OVERGROWTH);
        tag(BiomeTags.HAS_RUINED_PORTAL_SWAMP).add(STONE_FOREST_DOCKS, BEACH_DOCKS);
        tag(BiomeTags.HAS_RUINED_PORTAL_OCEAN).add(POLLUTED_SEA);
        tag(BiomeTags.HAS_RUINED_PORTAL_MOUNTAIN).add(WATERFALLS);
        tag(BiomeTags.IS_OCEAN).add(POLLUTED_SEA);
        tag(BiomeTags.HAS_SHIPWRECK).add(POLLUTED_SEA);
        tag(BiomeTags.HAS_OCEAN_RUIN_WARM).add(POLLUTED_SEA);
        tag(BiomeTags.HAS_SHIPWRECK_BEACHED).add(BEACH_DOCKS);
        tag(BiomeTags.HAS_BURIED_TREASURE).add(BEACH_DOCKS);
        tag(BiomeTags.IS_MOUNTAIN).add(WATERFALLS);
        // polluted water: wading in it gives Weakness
        tag(POLLUTED_WATER).add(STONE_FOREST_DOCKS, BEACH_DOCKS, POLLUTED_SEA);
    }
}
