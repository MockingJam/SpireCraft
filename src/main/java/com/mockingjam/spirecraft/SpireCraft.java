package com.mockingjam.spirecraft;

import com.mockingjam.spirecraft.alchemy.ModPotions;
import com.mockingjam.spirecraft.datagen.ModDataGenerators;
import com.mockingjam.spirecraft.item.FoodEvents;
import net.minecraftforge.event.brewing.BrewingRecipeRegisterEvent;
import com.mockingjam.spirecraft.dev.SelfTest;
import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.effect.SpireEffectEvents;
import com.mockingjam.spirecraft.item.MaterialEvents;
import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mockingjam.spirecraft.registry.ModCreativeTabs;
import com.mockingjam.spirecraft.registry.ModItems;
import com.mojang.logging.LogUtils;
import net.minecraft.resources.ResourceLocation;
import net.minecraftforge.data.event.GatherDataEvent;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.config.ModConfig;
import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;
import org.slf4j.Logger;

@Mod(SpireCraft.MODID)
public final class SpireCraft {
    public static final String MODID = "spirecraft";
    public static final Logger LOGGER = LogUtils.getLogger();

    public SpireCraft(FMLJavaModLoadingContext context) {
        var modBusGroup = context.getModBusGroup();

        // Blocks first: ModBlocks also queues the BlockItems into ModItems.ITEMS.
        com.mockingjam.spirecraft.fluid.ModFluids.register(modBusGroup);   // queues the ink block/bucket into BLOCKS/ITEMS
        com.mockingjam.spirecraft.worldgen.V2Features.init();
        com.mockingjam.spirecraft.worldgen.StructureFeatures.init();
        com.mockingjam.spirecraft.block.CaveOres.init();
        ModBlocks.BLOCKS.register(modBusGroup);
        ModItems.ITEMS.register(modBusGroup);
        ModCreativeTabs.TABS.register(modBusGroup);
        ModEffects.EFFECTS.register(modBusGroup);
        ModPotions.POTIONS.register(modBusGroup);
        com.mockingjam.spirecraft.registry.ModEntities.ENTITY_TYPES.register(modBusGroup);
        com.mockingjam.spirecraft.mob.ModMobs.register();
        com.mockingjam.spirecraft.network.SpireNetwork.init();
        if (net.minecraftforge.fml.loading.FMLEnvironment.dist.isClient()) com.mockingjam.spirecraft.client.ClientSetup.init(modBusGroup);
        com.mockingjam.spirecraft.worldgen.ModFeatures.FEATURES.register(modBusGroup);
        com.mockingjam.spirecraft.worldgen.DryJigsawStructure.TYPES.register(modBusGroup);
        com.mockingjam.spirecraft.worldgen.SpireStructures.TYPES.register(modBusGroup);
        com.mockingjam.spirecraft.worldgen.SpireStructures.PIECES.register(modBusGroup);
        net.minecraftforge.fml.event.lifecycle.FMLCommonSetupEvent.getBus(modBusGroup)
                .addListener(e -> e.enqueueWork(com.mockingjam.spirecraft.block.BiomeBlocks::commonSetup));

        SpireEffectEvents.register();
        MaterialEvents.register();
        FoodEvents.register();
        com.mockingjam.spirecraft.relic.RelicEvents.register();
        com.mockingjam.spirecraft.weapon.WeaponEvents.register();
        com.mockingjam.spirecraft.worldgen.BiomeEffects.register();
        BrewingRecipeRegisterEvent.BUS.addListener(ModPotions::registerBrewing);
        SelfTest.registerIfEnabled();

        GatherDataEvent.getBus(modBusGroup).addListener(ModDataGenerators::gatherData);

        context.registerConfig(ModConfig.Type.COMMON, Config.SPEC);
    }

    public static ResourceLocation id(String path) {
        return ResourceLocation.fromNamespaceAndPath(MODID, path);
    }
}
