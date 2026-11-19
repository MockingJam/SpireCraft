package com.mockingjam.spirecraft.client;

import com.mockingjam.spirecraft.worldgen.ModBiomes;
import net.minecraft.client.Minecraft;
import net.minecraft.world.level.material.FogType;
import net.minecraftforge.client.event.ViewportEvent;

/**
 * Misty Overgrowth (迷雾密林): a light white fog — not darker, just less to see. It fades in and out over a second as the
 * camera enters or leaves the biome. (The v2.3 ink-cave haze is switched off: the ink vents smoke instead.)
 */
public final class BiomeFog {
    public static final float MIST_START = 6.0F, MIST_END = 64.0F;   // v2.4: lighter mist (user)
    public static final float HAZE_START = 4.0F, HAZE_END = 36.0F;
    private static float mist, haze;   // 0 = clear, 1 = full mist / haze

    private BiomeFog() {}

    public static void register() {
        ViewportEvent.RenderFog.BUS.addListener(BiomeFog::onFog);
        ViewportEvent.ComputeFogColor.BUS.addListener(BiomeFog::onColor);
    }

    private static boolean inBiome(net.minecraft.resources.ResourceKey<net.minecraft.world.level.biome.Biome> biome) {
        var mc = Minecraft.getInstance();
        return mc.level != null && mc.gameRenderer.getMainCamera().getEntity() != null
                && mc.level.getBiome(mc.gameRenderer.getMainCamera().getBlockPosition()).is(biome);
    }

    private static boolean onFog(ViewportEvent.RenderFog e) {
        if (e.getType() != FogType.ATMOSPHERIC) return false;
        mist = Math.max(0, Math.min(1, mist + (inBiome(ModBiomes.MISTY_OVERGROWTH) ? 0.02F : -0.02F)));
        haze = 0;   // v2.4: no haze in the ink caves (it tinted everything red); the vents smoke instead
        var data = e.getData();
        if (mist > 0) {
            data.environmentalStart = lerp(data.environmentalStart, MIST_START, mist);
            data.environmentalEnd = lerp(data.environmentalEnd, MIST_END, mist);
        }
        if (haze > 0) {
            data.environmentalStart = lerp(data.environmentalStart, HAZE_START, haze);
            data.environmentalEnd = lerp(data.environmentalEnd, HAZE_END, haze);
        }
        return false;
    }

    private static void onColor(ViewportEvent.ComputeFogColor e) {
        if (haze > 0) {
            // towards a dim violet-black
            e.setRed(e.getRed() + (0.07F - e.getRed()) * haze);
            e.setGreen(e.getGreen() + (0.05F - e.getGreen()) * haze);
            e.setBlue(e.getBlue() + (0.11F - e.getBlue()) * haze);
        }
        if (mist <= 0) return;
        // towards a soft white, keeping the day/night brightness of the original colour
        float bright = Math.max(e.getRed(), Math.max(e.getGreen(), e.getBlue()));
        float w = 0.92F * Math.max(bright, 0.35F);
        e.setRed(e.getRed() + (w - e.getRed()) * mist);
        e.setGreen(e.getGreen() + (w - e.getGreen()) * mist);
        e.setBlue(e.getBlue() + (w * 1.02F - e.getBlue()) * mist);
    }

    private static float lerp(float from, float to, float k) {
        return from + (Math.min(from, to) - from) * k;
    }
}
