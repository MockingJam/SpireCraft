package com.mockingjam.spirecraft.client.mob;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.client.model.MobLayers;
import com.mockingjam.spirecraft.mob.Osty;
import com.mockingjam.spirecraft.mob.SpireMonster;
import com.mockingjam.spirecraft.mob.SpireSlime;
import com.mockingjam.spirecraft.registry.ModEntities;
import com.mojang.blaze3d.vertex.PoseStack;
import java.util.function.Supplier;
import net.minecraft.client.model.geom.ModelLayerLocation;
import net.minecraft.client.model.geom.builders.LayerDefinition;
import net.minecraft.client.renderer.RenderType;
import net.minecraft.client.renderer.entity.EntityRendererProvider;
import net.minecraft.client.renderer.entity.MobRenderer;
import net.minecraft.client.renderer.entity.layers.EyesLayer;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.Mob;
import net.minecraftforge.client.event.EntityRenderersEvent;

/** The one renderer for all phase 8 mobs: model kind, texture, scale and render type per mob. */
public class SpireMobRenderer<T extends Mob> extends MobRenderer<T, SpireMobRenderState, SpireMobModel> {
    private final ResourceLocation texture;
    private final float scale;

    private SpireMobRenderer(EntityRendererProvider.Context ctx, Spec spec) {
        super(ctx, new SpireMobModel(ctx.bakeLayer(spec.layer), spec.kind, spec.translucent ? RenderType::entityTranslucent : RenderType::entityCutoutNoCull,
                spec.kind == SpireMobModel.Kind.SCRIPTED ? com.mockingjam.spirecraft.mob.ScriptedDefs.get(spec.name) : null), spec.shadow);
        this.texture = SpireCraft.id("textures/entity/" + spec.name + ".png");
        this.scale = com.mockingjam.spirecraft.mob.MobSizes.scale(spec.name, spec.scale);   // sizes against the player (tools/mobs/sizes.js)
        this.shadowRadius = Math.min(3.0F, com.mockingjam.spirecraft.mob.MobSizes.width(spec.name, spec.shadow / 0.6F) * 0.6F);
        if (spec.glow) {
            RenderType glow = RenderType.eyes(SpireCraft.id("textures/entity/" + spec.name + "_glow.png"));
            addLayer(new EyesLayer<>(this) {
                @Override
                public RenderType renderType() {
                    return glow;
                }
            });
        }
    }

    @Override
    public SpireMobRenderState createRenderState() {
        return new SpireMobRenderState();
    }

    @Override
    public void extractRenderState(T mob, SpireMobRenderState state, float partialTick) {
        super.extractRenderState(mob, state, partialTick);
        if (mob instanceof SpireMonster m) {
            state.move = m.moveId();
            state.moveAge = m.tickCount - m.moveStartTick + partialTick;
        } else {
            state.move = 0;
            state.moveAge = 0;
        }
        state.small = mob instanceof SpireSlime slime && slime.isSmall();
        state.sitting = mob instanceof net.minecraft.world.entity.TamableAnimal tame && tame.isInSittingPose();
        state.riding = mob.isPassenger();
        state.attack = mob.getAttackAnim(partialTick);
        state.scriptedState = mob instanceof com.mockingjam.spirecraft.mob.ScriptedMonster sm ? sm.state() : 0;
        state.crusherBroken = mob instanceof com.mockingjam.spirecraft.mob.KaiserCrab crab && crab.crusherBroken();
        state.rocketBroken = mob instanceof com.mockingjam.spirecraft.mob.KaiserCrab crab2 && crab2.rocketBroken();
    }

    @Override
    protected void scale(SpireMobRenderState state, PoseStack pose) {
        float s = state.small ? scale * 0.5F : scale;
        if (s != 1) pose.scale(s, s, s);
    }

    @Override
    public ResourceLocation getTextureLocation(SpireMobRenderState state) {
        return texture;
    }

    // ---------------------------------------------------------------------------------------------------------------

    private record Spec(String name, SpireMobModel.Kind kind, Supplier<LayerDefinition> mesh, float scale, float shadow,
                        boolean translucent, boolean glow, ModelLayerLocation layer) {
        Spec(String name, SpireMobModel.Kind kind, Supplier<LayerDefinition> mesh, float scale, float shadow, boolean translucent, boolean glow) {
            this(name, kind, mesh, scale, shadow, translucent, glow, new ModelLayerLocation(SpireCraft.id(name), "main"));
        }
    }

    private static final Spec LEAF_SLIME = new Spec("leaf_slime", SpireMobModel.Kind.SLIME, MobLayers::leafSlime, 2.0F, 0.6F, true, false);
    private static final Spec TWIG_SLIME = new Spec("twig_slime", SpireMobModel.Kind.SLIME, MobLayers::twigSlime, 2.0F, 0.6F, true, false);
    private static final Spec WURM = new Spec("fuzzy_wurm_crawler", SpireMobModel.Kind.WURM, MobLayers::fuzzyWurmCrawler, 1, 0.45F, false, false);
    private static final Spec FLYCONID = new Spec("flyconid", SpireMobModel.Kind.FLYCONID, MobLayers::flyconid, 1, 0.45F, false, false);
    private static final Spec NIBBIT = new Spec("nibbit", SpireMobModel.Kind.NIBBIT, MobLayers::nibbit, 1, 0.45F, false, false);
    private static final Spec BEETLE = new Spec("shrinker_beetle", SpireMobModel.Kind.BEETLE, MobLayers::shrinkerBeetle, 1, 0.45F, false, false);
    private static final Spec BYRDONIS = new Spec("byrdonis", SpireMobModel.Kind.BYRDONIS, MobLayers::byrdonis, 1.4F, 0.85F, false, false);   // v5: taller than a man
    private static final Spec BEAST = new Spec("ceremonial_beast", SpireMobModel.Kind.BEAST, MobLayers::ceremonialBeast, 1.4F, 1.4F, false, true);
    private static final Spec OSTY = new Spec("osty", SpireMobModel.Kind.OSTY, MobLayers::osty, 1, 0.4F, false, true);
    private static final Spec SLUG = new Spec("corpse_slug", SpireMobModel.Kind.SLUG, MobLayers::corpseSlug, 1, 0.45F, false, false);
    private static final Spec TOADPOLE = new Spec("toadpole", SpireMobModel.Kind.TOADPOLE, MobLayers::toadpole, 1, 0.4F, true, false);
    private static final Spec RAT = new Spec("two_tailed_rat", SpireMobModel.Kind.RAT, MobLayers::twoTailedRat, 1, 0.4F, false, false);
    private static final Spec SEAPUNK = new Spec("seapunk", SpireMobModel.Kind.SEAPUNK, MobLayers::seapunk, 1, 0.5F, false, false);
    private static final Spec EEL = new Spec("terror_eel", SpireMobModel.Kind.EEL, MobLayers::terrorEel, 1.6F, 0.85F, false, false);
    private static final Spec FYSH = new Spec("soul_fysh", SpireMobModel.Kind.FYSH, MobLayers::soulFysh, 1.8F, 1.6F, true, true);
    private static final Spec MERCHANT = new Spec("merchant", SpireMobModel.Kind.MERCHANT, MobLayers::merchant, 1, 0.9F, false, false);
    // batch 3: the Hive
    private static final Spec BOWLBUG_ROCK = new Spec("bowlbug_rock", SpireMobModel.Kind.BOWLBUG, MobLayers::bowlbugRock, 1, 0.6F, false, false);
    private static final Spec BOWLBUG_EGG = new Spec("bowlbug_egg", SpireMobModel.Kind.BOWLBUG, MobLayers::bowlbugEgg, 0.6F, 0.35F, false, false);
    private static final Spec BOWLBUG_SILK = new Spec("bowlbug_silk", SpireMobModel.Kind.BOWLBUG, MobLayers::bowlbugSilk, 0.9F, 0.55F, false, false);
    private static final Spec BOWLBUG_NECTAR = new Spec("bowlbug_nectar", SpireMobModel.Kind.BOWLBUG, MobLayers::bowlbugNectar, 0.9F, 0.55F, true, false);
    private static final Spec EXOSKELETON = new Spec("exoskeleton", SpireMobModel.Kind.EXOSKELETON, MobLayers::exoskeleton, 1, 0.4F, true, false);
    private static final Spec CHOMPER = new Spec("chomper", SpireMobModel.Kind.CHOMPER, MobLayers::chomper, 1, 0.55F, false, true);
    private static final Spec MYTE = new Spec("myte", SpireMobModel.Kind.MYTE, MobLayers::myte, 1, 0.65F, false, false);
    private static final Spec ENTOMANCER = new Spec("entomancer", SpireMobModel.Kind.ENTOMANCER, MobLayers::entomancer, 1.15F, 0.55F, false, false);
    private static final Spec KAISER_CRAB = new Spec("kaiser_crab", SpireMobModel.Kind.CRAB, MobLayers::kaiserCrab, 1.5F, 3.0F, false, true);
    private static final Spec KNOWLEDGE_DEMON = new Spec("knowledge_demon", SpireMobModel.Kind.DEMON, MobLayers::knowledgeDemon, 1.4F, 1.2F, false, false);
    private static final Spec RHINO_BEETLE = new Spec("rhino_beetle", SpireMobModel.Kind.SCRIPTED, MobLayers::rhinoBeetle, 1, 0.8F, false, false);
    private static final Spec[] ALL = {RHINO_BEETLE, LEAF_SLIME, TWIG_SLIME, WURM, FLYCONID, NIBBIT, BEETLE, BYRDONIS, BEAST, OSTY, SLUG, TOADPOLE, RAT, SEAPUNK, EEL, FYSH, MERCHANT,
            BOWLBUG_ROCK, BOWLBUG_EGG, BOWLBUG_SILK, BOWLBUG_NECTAR, EXOSKELETON, CHOMPER, MYTE, ENTOMANCER, KAISER_CRAB, KNOWLEDGE_DEMON};

    /** §11: the data-driven monsters, one spec each (shadow from the hitbox, scale from the definition). */
    private static final java.util.List<Spec> SCRIPTED = com.mockingjam.spirecraft.mob.ScriptedDefs.ALL.values().stream()
            .map(d -> new Spec(d.name, SpireMobModel.Kind.SCRIPTED, MobLayers.BY_NAME.get(d.name), d.scale, Math.min(2.5F, d.width * 0.6F),
                    MobLayers.TRANSLUCENT.contains(d.name), MobLayers.GLOW.contains(d.name))).toList();

    public static void registerLayers(EntityRenderersEvent.RegisterLayerDefinitions e) {
        for (Spec spec : ALL) e.registerLayerDefinition(spec.layer, spec.mesh);
        for (Spec spec : SCRIPTED) e.registerLayerDefinition(spec.layer, spec.mesh);
    }

    public static void registerRenderers(EntityRenderersEvent.RegisterRenderers e) {
        register(e, ModEntities.LEAF_SLIME.get(), LEAF_SLIME);
        register(e, ModEntities.TWIG_SLIME.get(), TWIG_SLIME);
        register(e, ModEntities.FUZZY_WURM_CRAWLER.get(), WURM);
        register(e, ModEntities.FLYCONID.get(), FLYCONID);
        register(e, ModEntities.NIBBIT.get(), NIBBIT);
        register(e, ModEntities.SHRINKER_BEETLE.get(), BEETLE);
        register(e, ModEntities.BYRDONIS.get(), BYRDONIS);
        register(e, ModEntities.CEREMONIAL_BEAST.get(), BEAST);
        register(e, ModEntities.OSTY.get(), OSTY);
        register(e, ModEntities.CORPSE_SLUG.get(), SLUG);
        register(e, ModEntities.TOADPOLE.get(), TOADPOLE);
        register(e, ModEntities.TWO_TAILED_RAT.get(), RAT);
        register(e, ModEntities.SEAPUNK.get(), SEAPUNK);
        register(e, ModEntities.TERROR_EEL.get(), EEL);
        register(e, ModEntities.SOUL_FYSH.get(), FYSH);
        register(e, ModEntities.MERCHANT.get(), MERCHANT);
        register(e, ModEntities.RHINO_BEETLE.get(), RHINO_BEETLE);
        for (Spec spec : SCRIPTED) register(e, ModEntities.SCRIPTED.get(spec.name).get(), spec);
        register(e, ModEntities.BOWLBUG_ROCK.get(), BOWLBUG_ROCK);
        register(e, ModEntities.BOWLBUG_EGG.get(), BOWLBUG_EGG);
        register(e, ModEntities.BOWLBUG_SILK.get(), BOWLBUG_SILK);
        register(e, ModEntities.BOWLBUG_NECTAR.get(), BOWLBUG_NECTAR);
        register(e, ModEntities.EXOSKELETON.get(), EXOSKELETON);
        register(e, ModEntities.CHOMPER.get(), CHOMPER);
        register(e, ModEntities.MYTE.get(), MYTE);
        register(e, ModEntities.ENTOMANCER.get(), ENTOMANCER);
        register(e, ModEntities.KAISER_CRAB.get(), KAISER_CRAB);
        register(e, ModEntities.KNOWLEDGE_DEMON.get(), KNOWLEDGE_DEMON);
    }

    private static <T extends Mob> void register(EntityRenderersEvent.RegisterRenderers e, EntityType<T> type, Spec spec) {
        e.registerEntityRenderer(type, ctx -> new SpireMobRenderer<T>(ctx, spec));
    }

}
