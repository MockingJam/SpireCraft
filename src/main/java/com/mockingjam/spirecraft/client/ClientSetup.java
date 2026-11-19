package com.mockingjam.spirecraft.client;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mockingjam.spirecraft.registry.ModEntities;
import com.mockingjam.spirecraft.weapon.Orbs;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.Gui;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.renderer.RenderPipelines;
import net.minecraft.client.renderer.entity.ThrownItemRenderer;
import net.minecraftforge.client.event.AddGuiOverlayLayersEvent;
import net.minecraftforge.client.event.EntityRenderersEvent;

/** Client-only setup: projectile renderers and the Defect orb bar. Loaded only on the physical client. */
public final class ClientSetup {
    private ClientSetup() {}

    public static void init(net.minecraftforge.eventbus.api.bus.BusGroup modBusGroup) {
        DrippingProperty.register();
        net.minecraftforge.fml.event.lifecycle.FMLClientSetupEvent.getBus(modBusGroup).addListener(e -> e.enqueueWork(ClientSetup::blockRenderLayers));
        EntityRenderersEvent.RegisterRenderers.BUS.addListener(e -> {
            e.registerEntityRenderer(ModEntities.SHIV.get(), ctx -> new FlightItemRenderer<>(ctx, 0.7F, true, shiv -> true));
            e.registerEntityRenderer(ModEntities.POISON_FLASK.get(), ThrownItemRenderer::new);
            e.registerEntityRenderer(ModEntities.FLAK_PELLET.get(), ctx -> new ThrownItemRenderer<>(ctx, 0.5F, false));
            e.registerEntityRenderer(ModEntities.SPIRE_BOLT.get(), ctx -> new FlightItemRenderer<>(ctx, 0.7F, false,
                    bolt -> bolt.getItem().is(com.mockingjam.spirecraft.registry.ModItems.ROCKET_FIST.get())));
            e.registerEntityRenderer(ModEntities.ORB_WISP.get(), net.minecraft.client.renderer.entity.NoopRenderer::new);
            com.mockingjam.spirecraft.client.mob.SpireMobRenderer.registerRenderers(e);
        });
        EntityRenderersEvent.RegisterLayerDefinitions.BUS.addListener(com.mockingjam.spirecraft.client.mob.SpireMobRenderer::registerLayers);
        AddGuiOverlayLayersEvent.BUS.addListener(e -> e.getLayeredDraw().add(SpireCraft.id("orb_bar"), (gg, dt) -> ClientOrbs.render(gg)));
        BiomeFog.register();
        net.minecraftforge.client.event.RegisterKeyMappingsEvent.BUS.addListener(e -> e.register(ClientOrbs.EVOKE));
        net.minecraftforge.event.TickEvent.ClientTickEvent.Post.BUS.addListener(e -> ClientOrbs.tick());
        com.mockingjam.spirecraft.dev.ClientShots.init();   // dev screenshots, only with SPIRECRAFT_SHOTS set
        net.minecraftforge.event.TickEvent.ClientTickEvent.Post.BUS.addListener(e -> lightningRodSparks());
    }

    /** v2.8 (user): the Lightning Rod crackles - electric sparks around anyone holding it, more while blocking. */
    private static void lightningRodSparks() {
        var mc = net.minecraft.client.Minecraft.getInstance();
        if (mc.level == null || mc.isPaused()) return;
        var rod = com.mockingjam.spirecraft.registry.ModItems.LIGHTNING_ROD.get();
        for (var player : mc.level.players()) {
            if (player.distanceToSqr(mc.gameRenderer.getMainCamera().getPosition()) > 48 * 48) continue;
            boolean main = player.getMainHandItem().is(rod), off = player.getOffhandItem().is(rod);
            if (!main && !off) continue;
            boolean blocking = player.isUsingItem() && player.getUseItem().is(rod);
            if (mc.level.random.nextInt(blocking ? 1 : 3) != 0) continue;
            // around the shield: at the side of the holding hand, a little in front
            boolean right = (main ? player.getMainArm() : player.getMainArm().getOpposite()) == net.minecraft.world.entity.HumanoidArm.RIGHT;
            double yaw = Math.toRadians(player.yBodyRot), side = right ? -0.45 : 0.45;
            double x = player.getX() + Math.cos(yaw) * side - Math.sin(yaw) * 0.3, z = player.getZ() + Math.sin(yaw) * side + Math.cos(yaw) * 0.3;
            for (int i = 0; i < (blocking ? 3 : 1); i++) {
                mc.level.addParticle(net.minecraft.core.particles.ParticleTypes.ELECTRIC_SPARK, x + (mc.level.random.nextDouble() - 0.5) * 0.6,
                        player.getY() + 0.6 + mc.level.random.nextDouble() * 0.9, z + (mc.level.random.nextDouble() - 0.5) * 0.6,
                        (mc.level.random.nextDouble() - 0.5) * 0.2, (mc.level.random.nextDouble() - 0.5) * 0.2, (mc.level.random.nextDouble() - 0.5) * 0.2);
            }
        }
    }

    /** Cut-out render layers for the see-through biome blocks (like vanilla ItemBlockRenderTypes). */
    private static void blockRenderLayers() {
        // tough eggs are translucent, like the STS2 egg clusters
        net.minecraft.client.renderer.ItemBlockRenderTypes.setRenderLayer(ModBlocks.HIVE_EGG.get(), net.minecraft.client.renderer.chunk.ChunkSectionLayer.TRANSLUCENT);
        for (var w : com.mockingjam.spirecraft.block.BiomeBlocks.woods()) {
            for (var b : w.hasTree ? java.util.List.of(w.door, w.trapdoor, w.sapling) : java.util.List.of(w.door, w.trapdoor)) {
                net.minecraft.client.renderer.ItemBlockRenderTypes.setRenderLayer(b.get(), net.minecraft.client.renderer.chunk.ChunkSectionLayer.CUTOUT);
            }
            if (w.hasTree) net.minecraft.client.renderer.ItemBlockRenderTypes.setRenderLayer(w.leaves.get(), net.minecraft.client.renderer.chunk.ChunkSectionLayer.CUTOUT_MIPPED);
        }
        for (var b : java.util.List.of(ModBlocks.GLOWVINE, ModBlocks.GLOWVINE_PLANT, ModBlocks.FOGCAP, ModBlocks.SPIRE_FERN,
                ModBlocks.BARNACLES, ModBlocks.HIVE_MYCELIUM_LAYER, ModBlocks.MYCELIUM_THREAD, ModBlocks.PAVING_STONES, ModBlocks.BUG_CARCASS,
                // biomes v2 plants
                ModBlocks.REED, ModBlocks.ROTTEN_SHRUB, ModBlocks.POLLUTED_TUBE_CORAL, ModBlocks.POLLUTED_HORN_CORAL, ModBlocks.POLLUTED_CORAL_FAN,
                ModBlocks.POLLUTED_CORAL_WALL_FAN, ModBlocks.POLLUTED_SEAGRASS, ModBlocks.POLLUTED_KELP, ModBlocks.POLLUTED_KELP_PLANT,
                ModBlocks.LANTERN_CAP, ModBlocks.CORAL_CAP, ModBlocks.BLUEBELL_CAP, ModBlocks.SHELF_FUNGUS, ModBlocks.GLOW_SHRUB,
                ModBlocks.HIVE_SHROOM)) {
            net.minecraft.client.renderer.ItemBlockRenderTypes.setRenderLayer(b.get(), net.minecraft.client.renderer.chunk.ChunkSectionLayer.CUTOUT);
        }
    }

}
