package com.mockingjam.spirecraft.datagen;

import java.util.List;
import java.util.Set;
import net.minecraft.data.loot.LootTableProvider;
import net.minecraft.world.level.storage.loot.parameters.LootContextParamSets;
import net.minecraftforge.data.event.GatherDataEvent;

/**
 * Entry point for `runData` (双击 or `gradlew runData`). Output goes to src/generated/resources,
 * which is already part of the resource source set. Never hand-edit generated files.
 */
public final class ModDataGenerators {
    private ModDataGenerators() {}

    public static void gatherData(GatherDataEvent event) {
        var gen = event.getGenerator();
        var output = gen.getPackOutput();
        var lookup = event.getLookupProvider();
        var existing = event.getExistingFileHelper();

        // Client assets (the custom item model property must be known before item definitions are encoded)
        com.mockingjam.spirecraft.client.DrippingProperty.register();
        gen.addProvider(event.includeClient(), new ModModelProvider(output));
        gen.addProvider(event.includeClient(), new ModLanguageProvider.English(output));
        gen.addProvider(event.includeClient(), new ModLanguageProvider.Chinese(output));

        // Server data
        gen.addProvider(event.includeServer(), new ModRecipeProvider.Runner(output, lookup));
        gen.addProvider(event.includeServer(), new LootTableProvider(output, Set.of(),
                List.of(new LootTableProvider.SubProviderEntry(ModBlockLootProvider::new, LootContextParamSets.BLOCK),
                        new LootTableProvider.SubProviderEntry(ModEntityLootProvider::new, LootContextParamSets.ENTITY)), lookup));
        gen.addProvider(event.includeServer(), new ModBlockTagsProvider(output, lookup, existing));
        gen.addProvider(event.includeServer(), new ModItemTagsProvider(output, lookup, existing));
        gen.addProvider(event.includeServer(), new ModEntityTypeTagsProvider(output, lookup, existing));

        // Phase 7 worldgen: features + biomes (registry JSON), biome tags, and the overworld preset override
        var worldgen = gen.addProvider(event.includeServer(), new net.minecraftforge.common.data.DatapackBuiltinEntriesProvider(
                output, lookup, BiomeData.builder(), com.mockingjam.spirecraft.SpireCraft.MODID));
        gen.addProvider(event.includeServer(), new ModBiomeTagsProvider(output, worldgen.getFullRegistries(), existing));
        gen.addProvider(event.includeServer(), new WorldPresetProvider(output));
    }
}
