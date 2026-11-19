package com.mockingjam.spirecraft.client;

import com.mojang.blaze3d.vertex.PoseStack;
import com.mojang.math.Axis;
import java.util.function.Predicate;
import net.minecraft.client.renderer.SubmitNodeCollector;
import net.minecraft.client.renderer.entity.EntityRenderer;
import net.minecraft.client.renderer.entity.EntityRendererProvider;
import net.minecraft.client.renderer.entity.state.EntityRenderState;
import net.minecraft.client.renderer.item.ItemModelResolver;
import net.minecraft.client.renderer.item.ItemStackRenderState;
import net.minecraft.client.renderer.state.CameraRenderState;
import net.minecraft.client.renderer.texture.OverlayTexture;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.projectile.ItemSupplier;
import net.minecraft.world.item.ItemDisplayContext;

/**
 * Renders a thrown item pointed along its flight like an arrow instead of facing the camera.
 * {@code flat}: a 45° item sprite (tip up-right) laid horizontally with the tip forward — the throwing knife.
 * Otherwise the item model's own +X is the front — the Rocket Punch fist.
 * Entities the predicate rejects fall back to the vanilla camera-facing sprite.
 */
public class FlightItemRenderer<T extends Entity & ItemSupplier> extends EntityRenderer<T, FlightItemRenderer.State> {
    private final ItemModelResolver resolver;
    private final float scale;
    private final boolean flat;
    private final Predicate<T> oriented;

    public FlightItemRenderer(EntityRendererProvider.Context ctx, float scale, boolean flat, Predicate<T> oriented) {
        super(ctx);
        this.resolver = ctx.getItemModelResolver();
        this.scale = scale;
        this.flat = flat;
        this.oriented = oriented;
    }

    public static class State extends EntityRenderState {
        public final ItemStackRenderState item = new ItemStackRenderState();
        public float yRot, xRot;
        public boolean oriented;
    }

    @Override
    public State createRenderState() {
        return new State();
    }

    @Override
    public void extractRenderState(T entity, State state, float partialTick) {
        super.extractRenderState(entity, state, partialTick);
        state.oriented = oriented.test(entity);
        state.yRot = entity.getYRot(partialTick);
        state.xRot = entity.getXRot(partialTick);
        resolver.updateForNonLiving(state.item, entity.getItem(), state.oriented ? ItemDisplayContext.NONE : ItemDisplayContext.GROUND, entity);
    }

    @Override
    public void submit(State state, PoseStack pose, SubmitNodeCollector collector, CameraRenderState camera) {
        pose.pushPose();
        if (state.oriented) {
            pose.mulPose(Axis.YP.rotationDegrees(state.yRot - 90.0F));
            pose.mulPose(Axis.ZP.rotationDegrees(state.xRot));
            pose.scale(scale, scale, scale);
            if (flat) {
                pose.mulPose(Axis.XP.rotationDegrees(90.0F));    // lay the sprite plane horizontal
                pose.mulPose(Axis.ZP.rotationDegrees(-45.0F));   // tip (up-right in the sprite) onto +X
            }
        } else {
            pose.mulPose(camera.orientation);
        }
        state.item.submit(pose, collector, state.lightCoords, OverlayTexture.NO_OVERLAY, state.outlineColor);
        pose.popPose();
        super.submit(state, pose, collector, camera);
    }
}
