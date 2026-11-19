package com.mockingjam.spirecraft.client;

import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.network.SpireNetwork;
import com.mockingjam.spirecraft.registry.ModItems;
import com.mockingjam.spirecraft.weapon.Orbs;
import com.mockingjam.spirecraft.weapon.SpireWeapon;
import com.mojang.blaze3d.platform.InputConstants;
import java.util.ArrayList;
import java.util.List;
import net.minecraft.client.KeyMapping;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.Gui;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.renderer.RenderPipelines;
import net.minecraft.network.chat.Component;
import org.lwjgl.glfw.GLFW;

/**
 * Client side of the orb queue: the synced orbs (timers count down locally between syncs), the Evoke key and the
 * orb bar next to the hotbar. Each slot shows the orb, a timer bar, the seconds left and what it does
 * (Lightning: passive → evoke damage; Frost: armor → absorption; Dark: burst damage).
 */
public final class ClientOrbs {
    public static final KeyMapping EVOKE = new KeyMapping("key.spirecraft.evoke_orb", InputConstants.Type.KEYSYM, GLFW.GLFW_KEY_R, KeyMapping.Category.GAMEPLAY);
    private static final List<int[]> ORBS = new ArrayList<>();   // {type, ticks left}

    private ClientOrbs() {}

    public static void accept(int slots, int[] raw) {
        ORBS.clear();
        for (int i = 0; i + 1 < raw.length; i += 2) ORBS.add(new int[] {raw[i], raw[i + 1]});
    }

    public static void tick() {
        for (int[] o : ORBS) if (o[1] > 0) o[1]--;
        while (EVOKE.consumeClick()) {
            if (Minecraft.getInstance().player != null && !ORBS.isEmpty()) SpireNetwork.evokeOrb();
        }
    }

    /** Draw the bar while the player has orbs or holds a Defect item. */
    public static void render(GuiGraphics gg) {
        Minecraft mc = Minecraft.getInstance();
        if (mc.player == null || mc.options.hideGui) return;
        boolean defect = mc.player.getMainHandItem().getItem() instanceof SpireWeapon w && w.character() == SpireWeapon.Character.DEFECT
                || mc.player.getOffhandItem().getItem() instanceof SpireWeapon o && o.character() == SpireWeapon.Character.DEFECT;
        if (ORBS.isEmpty() && !defect) return;
        int slots = Math.max(Orbs.slots(mc.player), ORBS.size());
        int size = 20, gap = 3;
        int x0 = gg.guiWidth() / 2 + 91 + 8, y = gg.guiHeight() - 24;
        var font = mc.font;
        for (int i = 0; i < slots; i++) {
            int x = x0 + i * (size + gap);
            // slot frame: dark glass with a lit top-left edge (vanilla hotbar look)
            gg.fill(x, y, x + size, y + size, 0xA0101018);
            gg.fill(x, y, x + size, y + 1, 0x70FFFFFF);
            gg.fill(x, y, x + 1, y + size, 0x50FFFFFF);
            gg.fill(x, y + size - 1, x + size, y + size, 0x90000000);
            gg.fill(x + size - 1, y, x + size, y + size, 0x90000000);
            if (i >= ORBS.size()) continue;
            int[] o = ORBS.get(i);
            Orbs.Type type = Orbs.Type.values()[o[0]];
            var effect = switch (type) { case LIGHTNING -> ModEffects.LIGHTNING_ORB; case FROST -> ModEffects.FROST_ORB; case DARK -> ModEffects.DARK_ORB; };
            gg.blitSprite(RenderPipelines.GUI_TEXTURED, Gui.getMobEffectSprite(ModEffects.holder(effect)), x + 1, y + 1, 18, 18);
            // timer bar above the slot, in the orb's colour
            float frac = Math.min(1, o[1] / (float) Orbs.lifetime(type));
            int color = 0xFF000000 | Orbs.COLORS[type.ordinal()];
            gg.fill(x, y - 3, x + size, y - 1, 0x80000000);
            gg.fill(x, y - 3, x + Math.round(size * frac), y - 1, color);
            // notes (half-size text): seconds left above, the orb's numbers below
            String secs = (o[1] + 19) / 20 + "s";
            String note = switch (type) {
                case LIGHTNING -> fmt(Orbs.LIGHTNING_PASSIVE) + "/" + fmt(Orbs.LIGHTNING_EVOKE);
                case FROST -> "+" + Orbs.FROST_ARMOR + "❁";
                case DARK -> fmt(Orbs.DARK_DAMAGE) + "✸";
            };
            small(gg, font, secs, x + size / 2, y - 9, 0xFFFFFFFF);
            small(gg, font, note, x + size / 2, y + size + 1, color);
            if (i == 0) small(gg, font, "[" + EVOKE.getTranslatedKeyMessage().getString() + "]", x + size / 2, y + size + 6, 0xFFB0B0B0);
        }
    }

    private static String fmt(float v) {
        return v == Math.round(v) ? String.valueOf(Math.round(v)) : String.valueOf(v);
    }

    private static void small(GuiGraphics gg, net.minecraft.client.gui.Font font, String s, int cx, int y, int color) {
        var pose = gg.pose();
        pose.pushMatrix();
        pose.translate(cx, y);
        pose.scale(0.5F, 0.5F);
        gg.drawString(font, Component.literal(s), -font.width(s) / 2, 0, color, true);
        pose.popMatrix();
    }
}
