package com.mockingjam.spirecraft.client;

import com.mockingjam.spirecraft.registry.ModItems;
import com.mojang.blaze3d.vertex.PoseStack;
import com.mojang.math.Axis;
import net.minecraft.client.player.LocalPlayer;
import net.minecraft.util.Mth;
import net.minecraft.world.entity.HumanoidArm;
import net.minecraft.world.item.ItemStack;
import net.minecraftforge.client.extensions.common.IClientItemExtensions;

/**
 * First-person attack animations for weapons whose swing should not be the vanilla sword arc (v2.1):
 * the Crescent Spear jabs straight forward, the hammers (Heirloom Hammer, Bludgeon) lift and slam down, the Morning
 * Star whirls once on its chain and is flung out, and the Scourge whip winds back and cracks across the view. Idle / equip poses are the vanilla ones.
 */
public final class WeaponAnimations implements IClientItemExtensions {
    public static final WeaponAnimations INSTANCE = new WeaponAnimations();

    private WeaponAnimations() {}

    @Override
    public boolean applyForgeHandTransform(PoseStack pose, LocalPlayer player, HumanoidArm arm, ItemStack stack, float partialTick, float equip, float swing) {
        int side = arm == HumanoidArm.RIGHT ? 1 : -1;
        if (player.isUsingItem() && player.getUseItem() == stack && (stack.is(ModItems.TANK_SHIELD.get()) || stack.is(ModItems.LIGHTNING_ROD.get()))) {
            // raised like a vanilla shield: vanilla gives every other blocking item the sword-block twist, which laid
            // our shields flat; the raised pose itself is the _blocking model's display transform
            rest(pose, side, equip);
            return true;
        }
        if (player.isUsingItem() || !animated(stack)) return false;
        // v2.3: these weapons stay up after a blow (vanilla lowers the item while the attack recharges, which hid
        // the animations)
        if (player.getAttackStrengthScale(partialTick) < 1) equip = 0;
        if (swing <= 0) {
            rest(pose, side, equip);
            return true;
        }
        if (stack.is(ModItems.CRESCENT_SPEAR.get())) {
            spear(pose, side, equip, swing);
        } else if (stack.is(ModItems.MORNING_STAR.get())) {
            flail(pose, side, equip, swing);
        } else if (stack.is(ModItems.HEIRLOOM_HAMMER.get()) || stack.is(ModItems.BLUDGEON.get())) {
            hammer(pose, side, equip, swing);
        } else if (stack.is(ModItems.SCOURGE.get())) {
            whip(pose, side, equip, swing);
        } else {
            return false;
        }
        return true;
    }

    private static boolean animated(ItemStack stack) {
        return stack.is(ModItems.CRESCENT_SPEAR.get()) || stack.is(ModItems.MORNING_STAR.get()) || stack.is(ModItems.HEIRLOOM_HAMMER.get())
                || stack.is(ModItems.BLUDGEON.get()) || stack.is(ModItems.SCOURGE.get());
    }

    /** Vanilla resting position of the item in hand (ItemInHandRenderer#applyItemArmTransform). */
    private static void rest(PoseStack pose, int side, float equip) {
        pose.translate(side * 0.56F, -0.52F + equip * -0.6F, -0.72F);
    }

    /** Jab: a short pull back, then the point drives straight out at the crosshair and returns. */
    private static void spear(PoseStack pose, int side, float equip, float t) {
        float pull = t < 0.2F ? Mth.sin(t / 0.2F * Mth.HALF_PI) : 1 - Mth.clamp((t - 0.2F) / 0.15F, 0, 1);
        float thrust = t < 0.2F ? 0 : Mth.sin(Mth.clamp((t - 0.2F) / 0.8F, 0, 1) * Mth.PI);
        float aim = Mth.sin(Math.min(1, t * 4) * Mth.HALF_PI) * (1 - Mth.clamp((t - 0.75F) / 0.25F, 0, 1));
        rest(pose, side, equip);
        // the sprite keeps facing the camera (turning it edge-on made the spear vanish); it drops to a level
        // carry, slides in towards the crosshair and drives forward
        pose.translate(-side * 0.18F * aim, -0.05F * aim, 0.12F * pull - 0.55F * thrust);
        pose.mulPose(Axis.ZP.rotationDegrees(side * 25 * aim));     // tip leans in towards the crosshair
    }

    /** Overhead blow: lift back, then a fast heavy slam down, then recover. */
    private static void hammer(PoseStack pose, int side, float equip, float t) {
        float angle, drop;
        if (t < 0.35F) {
            float a = Mth.sin(t / 0.35F * Mth.HALF_PI);
            angle = 45 * a;
            drop = -0.1F * a;
        } else {
            float u = (t - 0.35F) / 0.65F;
            float slam = Mth.sin(Math.min(1, u * 2.2F) * Mth.HALF_PI);
            float back = u > 0.55F ? (u - 0.55F) / 0.45F : 0;
            float k = 1 - back * back;
            angle = (45 - 150 * slam) * k;
            drop = (-0.1F + 0.35F * slam) * k;
        }
        rest(pose, side, equip);
        pose.translate(0, -drop, -0.15F * Math.abs(angle) / 105);
        pose.translate(0, -0.25F, 0);
        pose.mulPose(Axis.XP.rotationDegrees(angle));
        pose.translate(0, 0.25F, 0);
    }

    /** Lash: wind back over the shoulder, crack across the view (fast), follow through low and settle. */
    private static void whip(PoseStack pose, int side, float equip, float t) {
        float wind = t < 0.3F ? Mth.sin(t / 0.3F * Mth.HALF_PI) : 1 - Mth.clamp((t - 0.3F) / 0.12F, 0, 1);
        float lash = t < 0.3F ? 0 : Mth.sin(Mth.clamp((t - 0.3F) / 0.25F, 0, 1) * Mth.HALF_PI);
        float settle = 1 - Mth.clamp((t - 0.7F) / 0.3F, 0, 1);
        rest(pose, side, equip);
        pose.translate(side * (0.25F * wind - 0.6F * lash * settle), 0.25F * wind - 0.15F * lash * settle, -0.35F * lash * settle);
        pose.mulPose(Axis.ZP.rotationDegrees(side * (70 * wind - 120 * lash * settle)));
        pose.mulPose(Axis.YP.rotationDegrees(side * (30 * wind - 60 * lash * settle)));
        pose.mulPose(Axis.XP.rotationDegrees(40 * wind - 50 * lash * settle));
    }

    /** Flail: the head whirls once round the hand on its chain (lifted), then is flung down and forward. */
    private static void flail(PoseStack pose, int side, float equip, float t) {
        rest(pose, side, equip);
        if (t < 0.55F) {
            float u = t / 0.55F;
            float lift = Mth.sin(Math.min(1, u * 3) * Mth.HALF_PI);
            pose.translate(-side * 0.1F * lift, 0.2F * lift, -0.1F * lift);
            pose.translate(0, -0.3F, 0);                                      // pivot at the grip
            pose.mulPose(Axis.ZP.rotationDegrees(-side * 360 * u * u));       // speeds up as it spins
            pose.translate(0, 0.3F, 0);
        } else {
            float u = (t - 0.55F) / 0.45F;
            float cast = Mth.sin(u * Mth.PI);
            pose.translate(-side * 0.15F * cast, 0.1F * (1 - u) - 0.15F * cast, -0.45F * cast);
            pose.translate(0, -0.3F, 0);
            pose.mulPose(Axis.XP.rotationDegrees(-110 * cast));
            pose.translate(0, 0.3F, 0);
        }
    }
}
