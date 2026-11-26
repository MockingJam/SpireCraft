package com.mockingjam.spirecraft.client.mob;

import com.mockingjam.spirecraft.mob.Byrdonis;
import com.mockingjam.spirecraft.mob.CeremonialBeast;
import com.mockingjam.spirecraft.mob.Flyconid;
import com.mockingjam.spirecraft.mob.FuzzyWurmCrawler;
import com.mockingjam.spirecraft.mob.Nibbit;
import com.mockingjam.spirecraft.mob.ShrinkerBeetle;
import com.mockingjam.spirecraft.mob.SpireSlime;
import java.util.function.Function;
import net.minecraft.client.model.EntityModel;
import net.minecraft.client.model.geom.ModelPart;
import net.minecraft.client.renderer.RenderType;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.util.Mth;

/**
 * One model class for every phase 8 mob (geometry from the generated {@code MobLayers}). Animations are procedural,
 * vanilla style: a walk cycle from the limb swing, an idle breath, and a pose per STS2 move driven by the synced
 * move id — wind-up first (the "intent" the player can read), then the strike.
 * Wind-up lengths match the server {@code Move} definitions.
 */
public class SpireMobModel extends EntityModel<SpireMobRenderState> {
    public enum Kind { SLIME, WURM, FLYCONID, NIBBIT, BEETLE, BYRDONIS, BEAST, OSTY, SLUG, TOADPOLE, RAT, SEAPUNK, EEL, FYSH, MERCHANT, BOWLBUG, EXOSKELETON, CHOMPER, MYTE, ENTOMANCER, CRAB, DEMON, SCRIPTED }

    private static final float PI = Mth.PI;
    private final Kind kind;
    private final Function<String, ModelPart> parts;

    /** The data-driven monster this model animates (Kind.SCRIPTED only). */
    private final com.mockingjam.spirecraft.mob.ScriptedDefs.Def def;

    public SpireMobModel(ModelPart root, Kind kind, Function<ResourceLocation, RenderType> renderType) {
        this(root, kind, renderType, null);
    }

    public SpireMobModel(ModelPart root, Kind kind, Function<ResourceLocation, RenderType> renderType, com.mockingjam.spirecraft.mob.ScriptedDefs.Def def) {
        super(root, renderType);
        this.kind = kind;
        this.parts = root.createPartLookup();
        this.def = def;
    }

    private ModelPart p(String name) {
        return parts.apply(name);
    }

    /** 0..1 progress through the wind-up. */
    private static float wind(SpireMobRenderState s, float windup) {
        return windup <= 0 ? 1 : Mth.clamp(s.moveAge / windup, 0, 1);
    }

    /** 0..1..0 bump over {@code len} ticks right after the wind-up (the strike itself). */
    private static float strike(SpireMobRenderState s, float windup, float len) {
        float t = (s.moveAge - windup) / len;
        return t < 0 || t > 1 ? 0 : Mth.sin(t * PI);
    }

    /** Follow-through: after the strike lands, a damped wobble that settles (0 before it, peaks ~1 right after). */
    private static float settle(SpireMobRenderState s, float windup, float len) {
        float t = s.moveAge - windup;
        return t < 0 ? 0 : (float) Math.exp(-t / len) * Mth.cos(t * 0.6F);
    }

    @Override
    public void setupAnim(SpireMobRenderState s) {
        super.setupAnim(s);
        float walk = s.walkAnimationPos, amount = Math.min(1, s.walkAnimationSpeed), age = s.ageInTicks;
        float yaw = s.yRot * Mth.DEG_TO_RAD, pitch = s.xRot * Mth.DEG_TO_RAD;
        switch (kind) {
            case SLIME -> slime(s, walk, amount, age);
            case WURM -> wurm(s, walk, amount, age, yaw);
            case FLYCONID -> flyconid(s, walk, amount, age);
            case NIBBIT -> nibbit(s, walk, amount, age, yaw, pitch);
            case BEETLE -> beetle(s, walk, amount, age, yaw);
            case BYRDONIS -> byrdonis(s, walk, amount, age, yaw);
            case BEAST -> beast(s, walk, amount, age, yaw);
            case OSTY -> osty(s, walk, amount, age, yaw);
            case SLUG -> slug(s, walk, amount, age, yaw);
            case TOADPOLE -> toadpole(s, walk, amount, age, yaw);
            case RAT -> rat(s, walk, amount, age, yaw);
            case SEAPUNK -> seapunk(s, walk, amount, age, yaw);
            case EEL -> eel(s, walk, amount, age, yaw);
            case FYSH -> fysh(s, walk, amount, age, yaw);
            case MERCHANT -> merchant(s, age, yaw, pitch);
            case BOWLBUG -> bowlbug(s, walk, amount, age, yaw);
            case EXOSKELETON -> exoskeleton(s, walk, amount, age, yaw);
            case CHOMPER -> chomper(s, walk, amount, age, yaw);
            case MYTE -> myte(s, walk, amount, age, yaw);
            case ENTOMANCER -> entomancer(s, walk, amount, age, yaw, pitch);
            case CRAB -> crab(s, walk, amount, age, yaw);
            case DEMON -> demon(s, walk, amount, age, yaw);
            case SCRIPTED -> scripted(s, walk, amount, age, yaw, pitch);
        }
    }

    // --- Leaf / Twig Slime: a vanilla slime that squashes as it hops; Tackle squats then lunges. ---
    private void slime(SpireMobRenderState s, float walk, float amount, float age) {
        ModelPart cube = p("cube");
        float squish = Mth.sin(walk * 0.9F) * 0.18F * amount + Mth.sin(age * 0.1F) * 0.03F;
        if (s.move == SpireSlime.TACKLE) {
            float w = wind(s, 10), hit = strike(s, 10, 8);
            squish = -0.3F * w * (1 - hit) + 0.25F * hit;
            cube.z -= hit * 4;
            cube.xRot += hit * 0.3F;
        }
        cube.yScale = 1 + squish;
        cube.xScale = cube.zScale = 1 - squish * 0.5F;
        p("inside").y += squish * 1.5F;   // the core lags behind the jelly
        if (hasPart("sprout")) p("sprout").zRot += Mth.sin(age * 0.15F) * 0.15F;
        for (String twig : new String[] {"twig_a", "twig_b", "twig_c", "twig_d"}) {
            if (hasPart(twig)) p(twig).xRot += Mth.sin(age * 0.12F + twig.charAt(5)) * 0.08F;
        }
    }

    private boolean hasPart(String name) {
        return parts.apply(name) != null;
    }

    // --- Fuzzy Wurm Crawler (v5): a grub crawling flat - the segments ripple; Inhale puffs the pelt up; Acid rears the
    //     front half up (mouth to the sky) and lobs the venom, like STS2's attack. ---
    private void wurm(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart head = p("head");
        head.yRot += yaw * 0.5F;
        String[] body = {"body_1", "body_2", "body_3"};
        for (int i = 0; i < body.length; i++) {
            ModelPart b = p(body[i]);
            b.yRot += Mth.sin(walk * 0.8F - i * 1.2F) * 0.25F * amount + Mth.sin(age * 0.08F - i) * 0.04F;
            b.y += Mth.sin(walk * 0.8F - i * 1.2F + 1.5F) * 0.5F * amount;
        }
        p("hair").yScale = 1 + Mth.sin(age * 0.15F) * 0.03F;
        if (s.move == FuzzyWurmCrawler.INHALE) {
            float w = wind(s, 30), puff = 1 + 0.3F * Mth.sin(w * PI * 0.5F) * (s.moveAge < 34 ? 1 : 0);
            ModelPart hair = p("hair");
            hair.xScale = hair.zScale = puff;
            hair.yScale = 1 + (puff - 1) * 1.3F;
            head.xScale = head.yScale = 1 + (puff - 1) * 0.5F;
        } else if (s.move == FuzzyWurmCrawler.ACID) {
            // rear: the front segments lift (negative xRot raises the front), the mouth tips up; spit: a jolt upward
            float w = wind(s, 14), hit = strike(s, 14, 6), rear = w * (1 - 0.3F * hit);
            p("body_2").xRot -= 0.55F * rear;
            p("body_1").xRot -= 0.45F * rear;
            head.xRot -= 0.35F * rear + 0.35F * hit;
            head.yScale = 1 + 0.15F * hit;
        }
    }

    // --- Flyconid: waddles with swinging arms; Spores shake the cap; Smash slams the cap down. ---
    private void flyconid(SpireMobRenderState s, float walk, float amount, float age) {
        ModelPart stem = p("stem"), cap = p("cap");
        stem.zRot += Mth.cos(walk * 0.6662F) * 0.12F * amount;
        p("arm_l").xRot += Mth.cos(walk * 0.6662F) * 0.8F * amount;
        p("arm_r").xRot += Mth.cos(walk * 0.6662F + PI) * 0.8F * amount;
        p("arm_l").zRot += Mth.sin(age * 0.09F) * 0.06F;
        p("arm_r").zRot -= Mth.sin(age * 0.09F) * 0.06F;
        cap.yScale = 1 + Mth.sin(age * 0.1F) * 0.03F;
        switch (s.move) {
            case Flyconid.SPORES, Flyconid.FRAIL_SPORE -> {
                float windup = s.move == Flyconid.SPORES ? 20 : 14, w = wind(s, windup), hit = strike(s, windup, 8);
                float shake = Mth.sin(age * 2.2F) * 0.12F * w * (1 - hit);
                cap.zRot += shake;
                p("cap_side").zRot += shake;
                p("cap_small").zRot -= shake;
                cap.xScale = cap.zScale = 1 + 0.2F * hit;
                cap.yScale *= 1 - 0.25F * hit;
                p("arm_l").zRot -= 1.2F * w;
                p("arm_r").zRot += 1.2F * w;
            }
            case Flyconid.SMASH -> {
                float w = wind(s, 12), hit = strike(s, 12, 6);
                stem.xRot += -0.35F * w * (1 - hit) + 0.7F * hit;
                p("arm_l").xRot -= 2.4F * w * (1 - hit);
                p("arm_r").xRot -= 2.4F * w * (1 - hit);
            }
            default -> { }
        }
    }

    // --- Nibbit: quadruped trot; Butt lowers the head and charges; Slice snaps the jaw; Hiss rears with jaw wide. ---
    private void nibbit(SpireMobRenderState s, float walk, float amount, float age, float yaw, float pitch) {
        ModelPart head = p("head"), jaw = p("jaw"), body = p("body");
        head.yRot += yaw;
        head.xRot += pitch * 0.5F;
        quadLegs(walk, amount, 1.2F, "leg_fl", "leg_fr", "leg_bl", "leg_br");
        p("tail").yRot += Mth.sin(age * 0.15F) * 0.25F + Mth.sin(walk * 0.6662F) * 0.3F * amount;
        p("tail_tip").yRot += Mth.sin(age * 0.15F - 0.8F) * 0.3F;
        jaw.xRot += Math.max(0, Mth.sin(age * 0.05F)) * 0.08F;
        switch (s.move) {
            case Nibbit.BUTT -> {
                float w = wind(s, 14), hit = strike(s, 14, 6);
                head.xRot += 0.5F * w;
                body.z -= 3 * hit;
                body.y += 1.5F * w * (1 - hit);
            }
            case Nibbit.SLICE -> {
                float w = wind(s, 8), hit = strike(s, 8, 6);
                jaw.xRot += 0.9F * w * (1 - hit);
                head.xRot -= 0.3F * w * (1 - hit) - 0.3F * hit;
                head.yRot += 0.4F * hit;
            }
            case Nibbit.HISS -> {
                float w = wind(s, 20) * (s.moveAge < 26 ? 1 : 0);
                body.xRot -= 0.35F * w;
                head.xRot -= 0.4F * w;
                jaw.xRot += 0.8F * w + Mth.sin(age * 3) * 0.06F * w;
            }
            default -> { }
        }
    }

    /** Vanilla quadruped legs: diagonal pairs swing together. */
    private void quadLegs(float walk, float amount, float swing, String fl, String fr, String bl, String br) {
        float a = Mth.cos(walk * 0.6662F) * swing * amount, b = Mth.cos(walk * 0.6662F + PI) * swing * amount;
        p(fl).xRot += a;
        p(br).xRot += a;
        p(fr).xRot += b;
        p(bl).xRot += b;
    }

    // --- Shrinker Beetle: six scuttling legs; Shrink opens the shell; Chomp bites; Stomp rears and drops. ---
    private void beetle(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart head = p("head"), body = p("body");
        head.yRot += yaw * 0.6F;
        for (int i = 0; i < 3; i++) {
            float phase = walk * 1.3F + i * PI * 2 / 3;
            float l = Mth.cos(phase) * 0.45F * amount, r = Mth.cos(phase + PI) * 0.45F * amount;
            p("leg_l" + i).yRot += l;
            p("leg_r" + i).yRot -= r;
            p("leg_l" + i).zRot += Math.max(0, Mth.sin(phase)) * 0.3F * amount;
            p("leg_r" + i).zRot -= Math.max(0, Mth.sin(phase + PI)) * 0.3F * amount;
        }
        p("antennae").xRot += Mth.sin(age * 0.2F) * 0.1F;
        switch (s.move) {
            case ShrinkerBeetle.SHRINK -> {
                float w = wind(s, 16), hold = s.moveAge < 26 ? w : Math.max(0, 1 - (s.moveAge - 26) / 6F);
                p("shell_l").zRot -= 0.9F * hold;
                p("shell_r").zRot += 0.9F * hold;
                p("shell_l").xRot -= 0.3F * hold;
                p("shell_r").xRot -= 0.3F * hold;
                p("antennae").xRot -= 0.5F * hold;
            }
            case ShrinkerBeetle.CHOMP -> {
                float w = wind(s, 10), hit = strike(s, 10, 6);
                head.xRot += -0.4F * w * (1 - hit) + 0.35F * hit;
                head.z -= 1.5F * hit;
            }
            case ShrinkerBeetle.STOMP -> {
                float w = wind(s, 16), hit = strike(s, 16, 6);
                body.xRot -= 0.5F * w * (1 - hit);
                body.y -= 2 * w * (1 - hit);
            }
            default -> { }
        }
    }

    // --- Byrdonis: long-legged strut; Swoop beats the wings and dives; Peck jabs three times. ---
    private void byrdonis(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart neck = p("neck"), head = p("head"), body = p("body");
        head.yRot += yaw * 0.6F;
        neck.yRot += yaw * 0.4F;
        p("leg_l").xRot += Mth.cos(walk * 0.6662F) * 1.0F * amount;
        p("leg_r").xRot += Mth.cos(walk * 0.6662F + PI) * 1.0F * amount;
        neck.xRot += Mth.sin(walk * 1.3324F) * 0.15F * amount + Mth.sin(age * 0.08F) * 0.04F;   // head bob
        p("tail").xRot += Mth.sin(age * 0.1F) * 0.06F;
        p("crest").xRot += Mth.sin(age * 0.13F) * 0.05F;
        float flap = 0;
        if (s.move == Byrdonis.SWOOP) {
            float w = wind(s, 16);
            flap = 0.3F + Mth.sin(s.moveAge * 0.9F) * 0.9F;
            body.xRot += 0.35F * w;
            neck.xRot += 0.3F * w;
        } else if (s.move == Byrdonis.PECK) {
            float w = wind(s, 8);
            neck.xRot -= 0.3F * w;
            float t = s.moveAge - 8;
            for (int hit : new int[] {0, 5, 10}) {
                float k = (t - hit) / 4;
                if (k >= 0 && k <= 1) neck.xRot += Mth.sin(k * PI) * 1.1F;
            }
        }
        p("wing_l").zRot -= flap + Mth.sin(age * 0.07F) * 0.03F;
        p("wing_r").zRot += flap + Mth.sin(age * 0.07F) * 0.03F;
    }

    // --- Ceremonial Beast: heavy gait; Plow lowers the antlers and charges; Stun collapses; Cry throws the head up;
    //     Stomp rears on the hind legs; Crush slams the head down. ---
    private void beast(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart body = p("body"), neck = p("neck"), head = p("head");
        head.yRot += yaw * 0.5F;
        quadLegs(walk, amount, 0.7F, "leg_fl", "leg_fr", "leg_bl", "leg_br");
        body.y += Mth.sin(walk * 1.3324F) * 0.6F * amount + Mth.sin(age * 0.06F) * 0.2F;
        switch (s.move) {
            case CeremonialBeast.PLOW -> {
                float w = wind(s, 20), hit = Math.max(strike(s, 20, 8), strike(s, 27, 8));
                neck.xRot += 0.6F * w;
                head.xRot += 0.3F * w + 0.3F * hit;
                p("leg_fl").xRot -= 0.4F * w * (1 - hit);
                body.z -= 3 * hit;
            }
            case CeremonialBeast.STUN -> {
                // collapse over 8 ticks, lie dazed, get up during the last 10 ticks
                float down = Math.min(1, s.moveAge / 8F) * Math.min(1, Math.max(0, (CeremonialBeast.STUN_TICKS - s.moveAge) / 10F));
                body.y += 9 * down;
                for (String leg : new String[] {"leg_fl", "leg_fr", "leg_bl", "leg_br"}) p(leg).xRot += (leg.charAt(4) == 'f' ? -1.4F : 1.4F) * down;
                neck.xRot += 0.5F * down;
                head.zRot += (0.4F + Mth.sin(age * 0.3F) * 0.08F) * down;
            }
            case CeremonialBeast.CRY -> {
                float w = wind(s, 20), hit = strike(s, 20, 10);
                neck.xRot -= 0.8F * Math.max(w * 0.6F, hit);
                head.xRot -= 0.4F * hit;
                head.zRot += Mth.sin(age * 2.5F) * 0.05F * hit;
            }
            case CeremonialBeast.STOMP -> {
                float w = wind(s, 16), hit = strike(s, 16, 8);
                body.xRot -= 0.45F * w * (1 - hit);
                p("leg_fl").xRot -= 0.9F * w * (1 - hit);
                p("leg_fr").xRot -= 0.9F * w * (1 - hit);
                p("leg_bl").xRot += 0.45F * w * (1 - hit);
                p("leg_br").xRot += 0.45F * w * (1 - hit);
            }
            case CeremonialBeast.CRUSH -> {
                float w = wind(s, 14), hit = strike(s, 14, 8);
                neck.xRot += -0.6F * w * (1 - hit) + 0.9F * hit;
                head.xRot += 0.4F * hit;
            }
            default -> { }
        }
    }

    // ================================================================ batch 2: Underdocks
    // --- Corpse Slug: the body ripples front to back as it creeps, the head sways and the horns feel about; Whip lashes
    // the head side to side; Glomp rears back then drops forward on the bite; Goop swells and spits; Devour gulps. ---
    private void slug(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart body = p("body"), head = p("head"), tail = p("tail");
        head.yRot += yaw * 0.4F + Mth.sin(age * 0.05F) * 0.12F;
        float wave = walk * 0.9F;
        body.zScale = 1 + Mth.sin(wave) * 0.06F * amount + Mth.sin(age * 0.07F) * 0.02F;
        head.xRot += Mth.sin(wave + 1.2F) * 0.08F * amount + Mth.sin(age * 0.09F) * 0.05F;
        tail.yRot += Mth.sin(wave - 1.5F) * 0.15F * amount + Mth.sin(age * 0.06F - 1) * 0.08F;
        tail.xRot += Mth.sin(wave - 1.0F) * 0.06F * amount;
        p("antenna_l").zRot += Mth.sin(age * 0.17F) * 0.18F;
        p("antenna_l").xRot += Mth.sin(age * 0.11F + 2) * 0.15F;
        p("antenna_r").zRot -= Mth.sin(age * 0.17F + 1) * 0.18F;
        p("antenna_r").xRot += Mth.sin(age * 0.13F) * 0.15F;
        switch (s.move) {
            case com.mockingjam.spirecraft.mob.CorpseSlug.WHIP -> { float w = wind(s, 12); head.xRot -= 0.3F * w; if (s.moveAge > 12) head.yRot += Mth.sin((s.moveAge - 12) * 0.9F) * 0.6F * (float) Math.exp(-(s.moveAge - 12) / 12F); tail.yRot -= head.yRot * 0.3F; }
            case com.mockingjam.spirecraft.mob.CorpseSlug.GLOMP -> { float w = wind(s, 16), hit = strike(s, 16, 6), f = settle(s, 16, 6); head.xRot += -0.6F * w * (1 - hit) + 0.7F * hit + 0.15F * f; head.z -= 3 * hit; tail.xRot -= 0.2F * hit; }
            case com.mockingjam.spirecraft.mob.CorpseSlug.GOOP -> { float w = wind(s, 14); head.xRot -= 0.5F * w; head.xScale = head.zScale = 1 + 0.12F * w; head.yScale = 1 + 0.25F * strike(s, 14, 6); }
            case com.mockingjam.spirecraft.mob.CorpseSlug.DEVOUR -> { head.xRot += 0.6F + Mth.sin(age * 0.8F) * 0.1F; body.yScale = 1 + Mth.sin(age * 0.6F) * 0.08F; }
            default -> { }
        }
    }

    // --- Toadpole: it hangs in the air, bobbing; the tail beats in a travelling wave (root, then tip); Whirl coils and
    // spins round; Spiken puffs up; Spit jerks the head back then forward, the tail kicking. ---
    private void toadpole(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart body = p("body"), tail = p("tail"), tip = p("tail_tip");
        body.y -= 2 + Mth.sin(age * 0.12F) * 1.0F;
        body.xRot += Mth.sin(age * 0.12F + 1) * 0.06F;
        body.yRot += yaw * 0.3F;
        float beat = age * (0.3F + 0.25F * amount) + walk * 0.8F, swing = 0.25F + 0.3F * amount;
        tail.yRot += Mth.sin(beat) * swing;
        tip.yRot += Mth.sin(beat - 1.1F) * swing * 1.4F;
        switch (s.move) {
            case com.mockingjam.spirecraft.mob.Toadpole.WHIRL -> { float w = wind(s, 12); tail.yRot += 0.9F * w; tip.yRot += 0.9F * w; if (s.moveAge > 12) body.yRot += (s.moveAge - 12) / 10F * Mth.TWO_PI; }
            case com.mockingjam.spirecraft.mob.Toadpole.SPIKEN -> { float w = wind(s, 10), f = settle(s, 10, 8); body.xScale = body.yScale = body.zScale = 1 + 0.2F * w + 0.06F * f; }
            case com.mockingjam.spirecraft.mob.Toadpole.SPIT -> { float w = wind(s, 14), f = settle(s, 14, 6); body.xRot -= 0.35F * w - 0.3F * f; tip.yRot += Mth.sin(s.moveAge * 1.5F) * 0.4F * w; }
            default -> { }
        }
    }

    // --- Two-Tailed Rat: a hunched, bobbing scuttle, the head sniffing and the tail swishing; Scratch rears up and rakes
    // down; Bite lunges with the head; Screech / Call throw the head back, the body shivering. ---
    private void rat(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart body = p("body"), head = p("head"), tail = p("tail");
        head.yRot += yaw * 0.5F;
        head.xRot += Mth.sin(age * 0.6F) * 0.03F + Mth.sin(age * 0.07F) * 0.06F;   // sniffing
        float step = walk * 0.9F;
        p("leg_l").xRot += Mth.cos(step) * 0.9F * amount;
        p("leg_r").xRot += Mth.cos(step + PI) * 0.9F * amount;
        p("leg_l_shin").xRot += Math.max(0, Mth.sin(step)) * 0.5F * amount;
        p("leg_r_shin").xRot += Math.max(0, Mth.sin(step + PI)) * 0.5F * amount;
        p("arm_l").xRot += Mth.cos(step + PI) * 0.4F * amount;
        p("arm_r").xRot += Mth.cos(step) * 0.4F * amount;
        body.y += Math.abs(Mth.sin(step)) * -0.8F * amount;
        body.xRot += Mth.sin(age * 0.09F) * 0.03F;
        tail.yRot += Mth.sin(age * 0.15F) * 0.3F + Mth.sin(step) * 0.25F * amount;
        tail.xRot += Mth.sin(age * 0.11F) * 0.08F;
        switch (s.move) {
            case com.mockingjam.spirecraft.mob.TwoTailedRat.SCRATCH -> { float w = wind(s, 10), hit = strike(s, 10, 6), f = settle(s, 10, 5); p("arm_r").xRot += -1.8F * w * (1 - hit) + 1.0F * hit + 0.2F * f; body.xRot -= 0.25F * w * (1 - hit); }
            case com.mockingjam.spirecraft.mob.TwoTailedRat.BITE -> { float w = wind(s, 10), hit = strike(s, 10, 6); head.xRot += -0.3F * w * (1 - hit) + 0.6F * hit; head.z -= 2 * hit; body.xRot += 0.15F * hit; }
            case com.mockingjam.spirecraft.mob.TwoTailedRat.SCREECH, com.mockingjam.spirecraft.mob.TwoTailedRat.CALL -> { float w = wind(s, 10); head.xRot -= 0.9F * w; body.xRot -= 0.3F * w; body.zRot += Mth.sin(age * 2.2F) * 0.05F * w; }
            default -> { }
        }
    }

    // --- Seapunk: the crest of stalks sways; Kick lunges; Spin whirls it round; Burp puffs it up. ---
    // --- The Merchant: sits on his rug, breathing slowly under the blanket, his masked head turning to follow you. ---
    private void merchant(SpireMobRenderState s, float age, float yaw, float pitch) {
        ModelPart body = p("body"), head = p("head"), tip = p("hood_tip");
        body.yScale = 1 + Mth.sin(age * 0.06F) * 0.02F;
        body.zRot += Mth.sin(age * 0.03F) * 0.02F;
        head.yRot += Mth.clamp(yaw, -1.1F, 1.1F);
        head.xRot += pitch * 0.5F + Mth.sin(age * 0.06F + 1) * 0.02F;
        tip.xRot += Mth.sin(age * 0.05F) * 0.05F;
    }

    // --- Seapunk: the fronds drift as if in a current, each stalk swaying on its own; Kick crouches and lunges; Spin
    // whirls with the stalks flung out; Burp puffs up and the stalks spring. ---
    private void seapunk(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart body = p("body");
        body.yRot += yaw * 0.3F;
        body.yScale = 1 + Mth.sin(age * 0.1F) * 0.03F;
        body.zRot += Mth.sin(walk * 0.7F) * 0.08F * amount;
        float fling = s.move == com.mockingjam.spirecraft.mob.Seapunk.SPIN && s.moveAge > 12 ? 0.5F : 0;
        for (int i = 0; i < 8; i++) {
            ModelPart stalk = p("stalk_" + i);
            stalk.xRot += Mth.sin(age * 0.08F + i * 0.7F) * 0.14F - Mth.sin(walk * 0.7F - 0.6F) * 0.12F * amount;
            stalk.zRot += Mth.cos(age * 0.06F + i) * 0.12F + (stalk.zRot > 0 ? fling : -fling);
        }
        switch (s.move) {
            case com.mockingjam.spirecraft.mob.Seapunk.KICK -> { float w = wind(s, 14), hit = strike(s, 14, 6), f = settle(s, 14, 5); body.yScale -= 0.15F * w * (1 - hit); body.z -= 3 * hit; body.xRot += 0.3F * hit + 0.1F * f; }
            case com.mockingjam.spirecraft.mob.Seapunk.SPIN -> { if (s.moveAge > 12) body.yRot += (s.moveAge - 12) / 16F * 2 * Mth.TWO_PI; }
            case com.mockingjam.spirecraft.mob.Seapunk.BURP -> { float w = strike(s, 12, 10), f = settle(s, 12, 8); body.xScale = body.zScale = 1 + 0.25F * w; body.yScale = 1 + 0.15F * w + 0.05F * f; }
            default -> { }
        }
    }

    // --- Terror Eel: an S wave runs from head to tail (each part a beat behind), the fins rippling; Crash coils back
    // and strikes; Thrash shakes the head, the body whipping after it; Stun goes limp and rolls; Terror rears, jaws wide. ---
    private void eel(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart body = p("body"), head = p("head"), b2 = p("body_2"), tail = p("tail"), tip = p("tail_tip");
        float wave = 0.22F + 0.25F * amount, t = age * 0.22F + walk;
        head.yRot += Mth.sin(t) * wave * 0.5F + yaw * 0.3F;
        b2.yRot += Mth.sin(t - 1.2F) * wave;
        tail.yRot += Mth.sin(t - 2.4F) * wave;
        tip.yRot += Mth.sin(t - 3.6F) * wave * 1.3F;
        tail.xRot += Mth.sin(age * 0.07F) * 0.08F;
        tip.xRot += Mth.sin(age * 0.07F - 1) * 0.12F;
        switch (s.move) {
            case com.mockingjam.spirecraft.mob.TerrorEel.CRASH -> { float w = wind(s, 16), hit = strike(s, 16, 8), f = settle(s, 16, 6); body.z += 3 * w * (1 - hit) - 6 * hit; head.xRot -= 0.35F * w * (1 - hit) - 0.1F * f; b2.yRot += 0.4F * w * (1 - hit); tail.yRot -= 0.6F * w * (1 - hit); }
            case com.mockingjam.spirecraft.mob.TerrorEel.THRASH -> { if (s.moveAge > 12) { float k = Mth.sin((s.moveAge - 12) * 1.3F); head.yRot += k * 0.6F; b2.yRot -= k * 0.4F; tail.yRot += k * 0.5F; } }
            case com.mockingjam.spirecraft.mob.TerrorEel.STUN -> { body.zRot += 0.6F + Mth.sin(age * 0.2F) * 0.1F; head.xRot += 0.2F; tip.yRot *= 0.2F; }
            case com.mockingjam.spirecraft.mob.TerrorEel.TERROR -> { float w = wind(s, 10); head.xRot -= 0.9F * w; head.yScale = 1 + 0.2F * w; body.xRot -= 0.2F * w; tip.xRot += 0.6F * w; }
            default -> { }
        }
    }

    // --- Soul Fysh: it hangs and sways like a sunfish, steering with the long dorsal and anal fins beating together and
    // the clavus sculling; the pectorals flutter; Scream / Gaze rear the head; De-Gas puffs the lips; Fade sinks and
    // tilts; Beckon rocks. ---
    private void fysh(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart body = p("body"), head = p("head");
        body.y += Mth.sin(age * 0.06F) * 1.5F;
        body.zRot += Mth.sin(age * 0.045F) * 0.06F;
        float fin = Mth.sin(age * 0.18F + walk) * (0.25F + 0.3F * amount);
        p("fin_top").zRot += fin;
        p("fin_bottom").zRot -= fin;
        p("tail").yRot += Mth.sin(age * 0.18F + walk - 1.2F) * (0.2F + 0.25F * amount);
        p("jaw").xRot += Math.max(0, Mth.sin(age * 0.05F)) * 0.15F;   // the mouth gapes slowly
        p("fin_l").yRot -= Mth.sin(age * 0.35F) * 0.35F;
        p("fin_r").yRot += Mth.sin(age * 0.35F + 0.5F) * 0.35F;
        switch (s.move) {
            case com.mockingjam.spirecraft.mob.SoulFysh.SCREAM, com.mockingjam.spirecraft.mob.SoulFysh.GAZE -> { float w = wind(s, 18), f = settle(s, 18, 8); body.xRot -= 0.2F * w + 0.05F * f; p("jaw").xRot += 0.7F * w; }
            case com.mockingjam.spirecraft.mob.SoulFysh.DEGAS -> { float w = wind(s, 18); head.zScale = 1 + 0.5F * w; head.yScale = 1 + 0.3F * w; body.z += 1.5F * w; }
            case com.mockingjam.spirecraft.mob.SoulFysh.FADE -> { float w = wind(s, 10); body.y += 3 * w; body.zRot += 0.3F * w; }
            case com.mockingjam.spirecraft.mob.SoulFysh.BECKON -> body.xRot += 0.15F * Mth.sin(s.moveAge * 0.4F);
            default -> { }
        }
    }

    // --- Osty: a skeletal hand that walks on its fingertips; the attack is a poke; the wrist flame flickers. ---
    private void osty(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart palm = p("palm");   // (v5: the wrist flame is a particle effect now, mob/Osty)
        palm.yRot += yaw * 0.3F;
        for (int i = 0; i < 4; i++) {
            float phase = walk * 1.1F + (i % 2) * PI;
            p("finger_" + i).xRot += Mth.cos(phase) * 0.7F * amount;
        }
        p("thumb").zRot += Mth.sin(walk * 1.1F) * 0.3F * amount;
        palm.y += Math.abs(Mth.sin(walk * 1.1F)) * -0.8F * amount + Mth.sin(age * 0.1F) * 0.2F;
        if (s.sitting) {
            palm.y += 3;
            for (int i = 0; i < 4; i++) p("finger_" + i).xRot -= 0.9F;
        }
        if (s.attack > 0) {
            float poke = Mth.sin(s.attack * PI);
            p("finger_1").xRot -= 1.6F * poke;
            p("finger_2").xRot -= 1.3F * poke;
            palm.xRot += 0.4F * poke;
            palm.z -= 2 * poke;
        }
    }
    // ================================================================================== batch 3: the Hive
    /** Legs that swing forward/back about y (spider style): alternate sides and alternate pairs. */
    private void scuttle(float walk, float amount, float swing, String... legs) {
        for (int i = 0; i < legs.length; i++) {
            float phase = walk * 1.2F + (i % 2) * PI + (i / 2) * 0.9F;
            p(legs[i]).yRot += Mth.cos(phase) * swing * amount;
            p(legs[i]).zRot += Math.max(0, Mth.sin(phase)) * 0.25F * amount * (legs[i].contains("l") ? -1 : 1);
        }
    }

    // --- Bowlbugs: a waddle under the load; Headbutt rears back and lunges; Dizzy reels; Bite snaps the mandibles;
    // Spin Web / Thrash shake; Buff drinks from the sac (the sac swells). ---
    private void bowlbug(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart body = p("body"), head = p("head"), load = p("load");
        head.yRot += yaw * 0.3F;
        quadLegs(walk * 1.4F, amount, 0.9F, "leg_fl", "leg_fr", "leg_bl", "leg_br");
        body.zRot += Mth.sin(walk * 0.7F) * 0.06F * amount;
        load.zRot += Mth.sin(walk * 0.7F + 0.9F) * 0.07F * amount;   // the load sways a beat behind the body
        load.xRot += Mth.sin(walk * 1.4F + 0.9F) * 0.04F * amount;
        head.xRot += Mth.sin(age * 0.08F) * 0.05F;
        body.y += Mth.sin(age * 0.1F) * 0.2F;
        float mand = Mth.sin(age * 0.2F) * 0.08F;
        p("mandible_l").yRot += mand;
        p("mandible_r").yRot -= mand;
        switch (s.move) {
            case com.mockingjam.spirecraft.mob.Bowlbug.HEADBUTT -> { float w = wind(s, 16), hit = strike(s, 16, 6), f = settle(s, 16, 6); body.z += 2.5F * w * (1 - hit) - 4 * hit; body.xRot -= 0.2F * w * (1 - hit) - 0.3F * hit; load.xRot += 0.25F * hit - 0.1F * f; load.z += 1.5F * hit; }
            case com.mockingjam.spirecraft.mob.Bowlbug.DIZZY -> { body.zRot += Mth.sin(s.moveAge * 0.5F) * 0.25F; head.yRot += Mth.sin(s.moveAge * 0.7F) * 0.4F; }
            case com.mockingjam.spirecraft.mob.Bowlbug.BITE -> { float w = wind(s, 10), hit = strike(s, 10, 6); p("mandible_l").yRot -= 0.6F * w * (1 - hit); p("mandible_r").yRot += 0.6F * w * (1 - hit); body.z -= 2 * hit; }
            case com.mockingjam.spirecraft.mob.Bowlbug.SPIN_WEB -> { float w = wind(s, 14); body.xRot -= 0.25F * w; load.xRot += 0.15F * Mth.sin(s.moveAge * 0.8F) * w; }
            case com.mockingjam.spirecraft.mob.Bowlbug.THRASH -> { if (s.moveAge > 10) body.yRot += Mth.sin((s.moveAge - 10) * 1.2F) * 0.45F; }
            case com.mockingjam.spirecraft.mob.Bowlbug.BUFF -> { float w = wind(s, 20); load.xScale = load.zScale = 1 + 0.15F * w * (1 + Mth.sin(s.moveAge * 0.6F) * 0.3F); head.xRot -= 0.3F * w; }
            default -> { }
        }
    }

    // --- Exoskeleton: a skittering husk; Skitter darts in three times; Mandibles lunges with the head; Enrage rears up, wings buzzing. ---
    private void exoskeleton(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart body = p("body"), head = p("head"), thorax = p("thorax");
        head.yRot += yaw * 0.4F;
        scuttle(walk, amount, 0.6F, "leg_fore_l", "leg_fore_r", "leg_mid_l", "leg_mid_r", "leg_hind_l", "leg_hind_r");
        float buzz = Mth.sin(age * 0.9F) * 0.06F;
        body.xRot += Mth.sin(age * 0.1F) * 0.04F;
        head.xRot += Mth.sin(age * 0.13F) * 0.08F;
        p("wing_l").zRot -= buzz;
        p("wing_r").zRot += buzz;
        switch (s.move) {
            case com.mockingjam.spirecraft.mob.Exoskeleton.SKITTER -> { if (s.moveAge > 8) body.z -= 2.5F * Math.abs(Mth.sin((s.moveAge - 8) * PI / 4)); }
            case com.mockingjam.spirecraft.mob.Exoskeleton.MANDIBLES -> { float w = wind(s, 12), hit = strike(s, 12, 6); thorax.xRot -= 0.3F * w * (1 - hit); head.xRot += 0.7F * hit; body.z -= 2 * hit; }
            case com.mockingjam.spirecraft.mob.Exoskeleton.ENRAGE -> { float w = wind(s, 14); body.xRot -= 0.45F * w; p("wing_l").zRot -= 0.6F * w + buzz * 4; p("wing_r").zRot += 0.6F * w + buzz * 4; }
            default -> { }
        }
    }

    // --- Chomper: a clanking walk, the jaw chattering; Clamp gapes and slams twice; Screech opens wide, shaking. ---
    private void chomper(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart upper = p("jaw_upper"), lower = p("jaw_lower"), body = p("body");
        body.yRot += yaw * 0.3F;
        quadLegs(walk, amount, 0.8F, "leg_fl", "leg_fr", "leg_bl", "leg_br");
        body.y += Math.abs(Mth.sin(walk * 0.66F)) * -0.6F * amount;
        float chatter = Math.max(0, Mth.sin(age * 0.3F)) * 0.06F;
        upper.xRot -= chatter;
        lower.xRot += chatter;
        switch (s.move) {
            case com.mockingjam.spirecraft.mob.Chomper.CLAMP -> {
                float w = wind(s, 12), t = s.moveAge - 12, open = t < 0 ? w : t < 3 ? 0 : t < 6 ? (t - 3) / 3 : t < 9 ? 0 : 0;
                upper.xRot -= 0.6F * open;
                lower.xRot += 0.4F * open;
                body.z -= t >= 0 && t < 10 ? 1.5F : 0;
            }
            case com.mockingjam.spirecraft.mob.Chomper.SCREECH -> { float w = wind(s, 16); upper.xRot -= 0.8F * w; lower.xRot += 0.5F * w; p("helmet").zRot += Mth.sin(s.moveAge * 1.5F) * 0.12F * w; }
            default -> { }
        }
    }

    // --- Myte: six legs scuttling; Toxic tips the body up and spits; Bite snaps the pincers; Suck dips and pulses. ---
    private void myte(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart body = p("body"), head = p("head");
        head.yRot += yaw * 0.3F;
        scuttle(walk, amount, 0.5F, "leg_l0", "leg_r0", "leg_l1", "leg_r1", "leg_l2", "leg_r2");
        body.y += Mth.sin(age * 0.08F) * 0.3F;
        float pinch = Mth.sin(age * 0.15F) * 0.1F;
        p("claw_l").yRot += pinch;
        p("claw_r").yRot -= pinch;
        switch (s.move) {
            case com.mockingjam.spirecraft.mob.Myte.TOXIC -> { float w = wind(s, 14), hit = strike(s, 14, 6); body.xRot -= 0.35F * w * (1 - hit) + 0.2F * hit; }
            case com.mockingjam.spirecraft.mob.Myte.BITE -> { float w = wind(s, 14), hit = strike(s, 14, 6); p("claw_l").yRot += 0.6F * w * (1 - hit) - 0.3F * hit; p("claw_r").yRot -= 0.6F * w * (1 - hit) - 0.3F * hit; body.z -= 2 * hit; }
            case com.mockingjam.spirecraft.mob.Myte.SUCK -> { float w = wind(s, 10); body.xRot += 0.2F * w; body.yScale = 1 + 0.08F * Mth.sin(s.moveAge * 0.8F) * w; }
            default -> { }
        }
    }

    // --- Entomancer: a man's walk with the cloak swinging; Bees! raises the free hand; Spear! draws back and thrusts;
    // Pheromone tips the head back. ---
    private void entomancer(SpireMobRenderState s, float walk, float amount, float age, float yaw, float pitch) {
        ModelPart head = p("head"), armL = p("arm_l"), armR = p("arm_r");
        head.yRot += yaw;
        head.xRot += pitch;
        p("leg_l").xRot += Mth.cos(walk * 0.6662F) * 1.2F * amount;
        p("leg_r").xRot += Mth.cos(walk * 0.6662F + PI) * 1.2F * amount;
        armL.xRot += Mth.cos(walk * 0.6662F + PI) * 0.8F * amount;
        armR.xRot += Mth.cos(walk * 0.6662F) * 0.3F * amount;
        p("cloak").xRot += 0.25F * amount + Mth.sin(age * 0.07F) * 0.05F + Mth.sin(walk * 1.33F) * 0.05F * amount;   // trails behind when walking
        p("body").y += Math.abs(Mth.sin(walk * 0.6662F)) * -0.4F * amount;
        p("spear").xRot += Mth.sin(age * 0.05F) * 0.04F;
        switch (s.move) {
            case com.mockingjam.spirecraft.mob.Entomancer.BEES -> { float w = wind(s, 20); armL.xRot -= 2.4F * w; armL.zRot -= 0.3F * w + Mth.sin(s.moveAge * 0.9F) * 0.1F * w; }
            case com.mockingjam.spirecraft.mob.Entomancer.SPEAR -> { float w = wind(s, 18), hit = strike(s, 18, 6); armR.xRot += 0.5F * w * (1 - hit) - 0.9F * hit; armR.z += 2 * w * (1 - hit) - 4 * hit; }
            case com.mockingjam.spirecraft.mob.Entomancer.PHEROMONE -> { float w = wind(s, 20); head.xRot -= 0.6F * w; armL.xRot -= 0.8F * w; armR.xRot -= 0.4F * w; }
            default -> { }
        }
    }

    // --- Kaiser Crab: a slow sideways shuffle; each claw winds up for its own moves (the Rocket claw drawn far back
    // before it fires); broken claws are gone. ---
    private void crab(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart body = p("body"), crusher = p("claw_crusher"), rocket = p("claw_rocket");
        crusher.visible = !s.crusherBroken;
        rocket.visible = !s.rocketBroken;
        for (int i = 0; i < 4; i++) {
            float ph = walk * 1.0F + i * 0.8F;
            p("leg_l" + i).zRot -= Math.max(0, Mth.sin(ph)) * 0.35F * amount;
            p("leg_r" + i).zRot += Math.max(0, Mth.sin(ph + PI)) * 0.35F * amount;
        }
        body.y += Mth.sin(age * 0.07F) * 0.25F;
        body.zRot += Mth.sin(walk * 0.5F) * 0.04F * amount;
        for (int i = 0; i < 4; i++) { p("leg_l" + i + "_tip").zRot -= Math.max(0, Mth.sin(walk + i * 0.8F)) * 0.3F * amount; p("leg_r" + i + "_tip").zRot += Math.max(0, Mth.sin(walk + i * 0.8F + PI)) * 0.3F * amount; }
        p("eye_l").zRot += Mth.sin(age * 0.13F) * 0.15F;
        p("eye_r").zRot -= Mth.sin(age * 0.11F + 1) * 0.15F;
        crusher.yRot += Mth.sin(age * 0.05F) * 0.04F;
        rocket.yRot -= Mth.sin(age * 0.05F + 1) * 0.04F;
        p("face").y += Mth.sin(age * 0.2F) * 0.15F;
        float w, hit;
        switch (s.move) {
            case com.mockingjam.spirecraft.mob.KaiserCrab.THRASH, com.mockingjam.spirecraft.mob.KaiserCrab.ENLARGE, com.mockingjam.spirecraft.mob.KaiserCrab.GUARD -> {
                w = wind(s, 14); hit = strike(s, 14, 8); crusher.xRot -= 0.5F * w * (1 - hit) - 0.3F * hit; crusher.yRot += 0.5F * hit; }
            case com.mockingjam.spirecraft.mob.KaiserCrab.STING -> { if (s.moveAge > 14) crusher.yRot += Mth.sin((s.moveAge - 14) * 1.0F) * 0.4F; else crusher.xRot -= 0.3F * wind(s, 14); }
            case com.mockingjam.spirecraft.mob.KaiserCrab.ADAPT -> { w = wind(s, 16); crusher.xRot -= 0.6F * w; body.xRot -= 0.1F * w; }
            case com.mockingjam.spirecraft.mob.KaiserCrab.CALCULATE -> { w = wind(s, 14); rocket.xRot -= 0.3F * w; p("face").xRot -= 0.2F * w; }
            case com.mockingjam.spirecraft.mob.KaiserCrab.SMASH -> { w = wind(s, 18); hit = strike(s, 18, 8); rocket.xRot -= 0.9F * w * (1 - hit) - 0.4F * hit; }
            case com.mockingjam.spirecraft.mob.KaiserCrab.CHARGE -> { w = wind(s, 16); rocket.zRot -= 0.2F * w * (1 + Mth.sin(s.moveAge * 1.4F) * 0.4F); }
            case com.mockingjam.spirecraft.mob.KaiserCrab.ROCKET_CLAW -> { w = wind(s, 40); hit = strike(s, 40, 10); rocket.zRot += Mth.sin(s.moveAge * 2.5F) * 0.04F * w * (1 - hit); rocket.yRot += 0.7F * w * (1 - hit) - 0.5F * hit; rocket.z += 3 * w * (1 - hit) - 6 * hit; body.yRot += 0.15F * w * (1 - hit); }
            case com.mockingjam.spirecraft.mob.KaiserCrab.RECHARGE -> { rocket.xRot += 0.25F; rocket.y += 1; }
            default -> { }
        }
    }

    // --- Knowledge Demon: it hovers over its egg-stone, six arms weaving; Curse spreads every arm wide; Slap swings an
    // arm; Overwhelming reaches forward three times; Ponder folds the arms in. ---
    private void demon(SpireMobRenderState s, float walk, float amount, float age, float yaw) {
        ModelPart body = p("body"), head = p("head");
        body.y -= 1.5F + Mth.sin(age * 0.06F) * 1.0F;
        body.zRot += Mth.sin(age * 0.04F) * 0.04F;
        head.yRot += Mth.sin(age * 0.03F) * 0.15F;
        p("stone").y += Mth.sin(age * 0.06F + 0.8F) * 0.3F;
        body.yRot += yaw * 0.3F;
        p("halo").zRot += age * 0.01F;
        for (int i = 0; i < 3; i++) {
            float wave = Mth.sin(age * 0.08F + i * 1.3F) * 0.2F;
            p("arm_l" + i).zRot += wave;
            p("arm_r" + i).zRot -= wave;
            p("arm_l" + i + "_fore").zRot += Mth.sin(age * 0.1F + i) * 0.25F;
            p("arm_r" + i + "_fore").zRot -= Mth.sin(age * 0.1F + i + 1) * 0.25F;
        }
        float w, hit;
        switch (s.move) {
            case com.mockingjam.spirecraft.mob.KnowledgeDemon.CURSE -> {
                w = wind(s, 60);
                for (int i = 0; i < 3; i++) { p("arm_l" + i).zRot -= 0.5F * w; p("arm_r" + i).zRot += 0.5F * w; }
                head.xRot -= 0.3F * w;
            }
            case com.mockingjam.spirecraft.mob.KnowledgeDemon.SLAP -> { w = wind(s, 14); hit = strike(s, 14, 6); p("arm_r1").yRot += 1.2F * w * (1 - hit) - 1.4F * hit; }
            case com.mockingjam.spirecraft.mob.KnowledgeDemon.OVERWHELM -> { w = wind(s, 16); for (int i = 0; i < 3; i++) { p("arm_l" + i).yRot -= 0.8F * w; p("arm_r" + i).yRot += 0.8F * w; } }
            case com.mockingjam.spirecraft.mob.KnowledgeDemon.PONDER -> { w = wind(s, 20); for (int i = 0; i < 3; i++) { p("arm_l" + i).yRot += 0.9F * w; p("arm_r" + i).yRot -= 0.9F * w; } head.xRot += 0.3F * w; }
            default -> { }
        }
    }
    // ================================================================================== §11: data-driven monsters
    /**
     * One animation for every data-driven monster, driven by its bone names (see tools/mobs/specs_scripted.js): legs
     * walk in pairs, quadruped diagonals or scuttle; tails, worm segments, tentacles and capes trail with a phase lag;
     * wings flutter; orbiting parts circle; hovering bodies bob. Each move is played from its Anim style with a
     * wind-up (anticipation), the strike, and a damped settle afterwards. Sleeping, burrowed and knocked-down states
     * have their own poses.
     */
    private void scripted(SpireMobRenderState s, float walk, float amount, float age, float yaw, float pitch) {
        // def is null for the non-scripted mobs that share these generic animations (the Rhino Beetle)
        ModelPart body = p("body"), head = p("head"), root = body != null ? body : head;
        if (root == null) return;
        boolean hover = def != null && def.hover;
        if (s.sitting) root.y += 2;
        if (s.riding) {   // sitting on a mount: thighs forward, shins down
            for (String n : new String[] { "leg_l", "leg_r" }) { ModelPart l = p(n); if (l != null) { l.xRot = -1.35F; l.yRot = n.endsWith("l") ? 0.25F : -0.25F; } }
            for (String n : new String[] { "leg_l_low", "leg_r_low" }) { ModelPart l = p(n); if (l != null) l.xRot = 1.2F; }
            amount = 0;
        }
        // the Test Subject grows a head with each form it adapts into (Glory G3)
        int form = (s.scriptedState >> com.mockingjam.spirecraft.mob.ScriptedMonster.PHASE_SHIFT) & 3;
        ModelPart head2 = p("head_2"), head3 = p("head_3");
        if (head2 != null) head2.visible = form >= 1;
        if (head3 != null) head3.visible = form >= 2;
        if (head != null && head != root) { head.yRot += yaw * 0.6F; head.xRot += pitch * 0.5F + Mth.sin(age * 0.08F) * 0.04F; }
        if (hover) root.y -= 2 + Mth.sin(age * 0.1F) * 1.2F;
        else root.y += Mth.sin(age * 0.1F) * 0.25F - Math.abs(Mth.sin(walk * 0.6662F)) * 0.6F * amount;
        // legs
        swing(p("leg_l"), Mth.cos(walk * 0.6662F) * 1.1F * amount);
        swing(p("leg_r"), Mth.cos(walk * 0.6662F + PI) * 1.1F * amount);
        if (s.move == 0) {
            swing(p("arm_l"), Mth.cos(walk * 0.6662F + PI) * 0.8F * amount + Mth.sin(age * 0.067F) * 0.04F);
            swing(p("arm_r"), Mth.cos(walk * 0.6662F) * 0.8F * amount - Mth.sin(age * 0.067F) * 0.04F);
        }
        swing(p("leg_fl"), Mth.cos(walk * 0.6662F) * 1.0F * amount);
        swing(p("leg_br"), Mth.cos(walk * 0.6662F) * 1.0F * amount);
        swing(p("leg_fr"), Mth.cos(walk * 0.6662F + PI) * 1.0F * amount);
        swing(p("leg_bl"), Mth.cos(walk * 0.6662F + PI) * 1.0F * amount);
        for (int i = 0; i < 4; i++) {
            float phase = walk * 1.2F + (i % 2) * PI + i * 0.9F;
            ModelPart l = p("leg_l" + i), r = p("leg_r" + i);
            if (l != null) { l.yRot += Mth.cos(phase) * 0.5F * amount; l.zRot -= Math.max(0, Mth.sin(phase)) * 0.25F * amount; }
            if (r != null) { r.yRot += Mth.cos(phase + PI) * 0.5F * amount; r.zRot += Math.max(0, Mth.sin(phase + PI)) * 0.25F * amount; }
        }
        // trailing parts
        float t = age * 0.15F + walk * 0.6F;
        ModelPart tail = p("tail"), tail1 = p("tail_1");
        if (tail != null) tail.yRot += Mth.sin(t) * (0.2F + 0.25F * amount);
        if (tail1 != null) tail1.yRot += Mth.sin(t - 1.0F) * (0.25F + 0.3F * amount);
        for (int i = 1; i <= 8; i++) { ModelPart seg = p("seg_" + i); if (seg != null) seg.yRot += Mth.sin(t - i * 0.8F) * (0.12F + 0.15F * amount); }
        for (int i = 0; i < 8; i++) { ModelPart tent = p("tent_" + i); if (tent != null) { tent.xRot += Mth.sin(age * 0.09F + i * 1.3F) * 0.15F; tent.zRot += Mth.cos(age * 0.07F + i) * 0.12F; } }
        ModelPart cape = p("cape");
        if (cape != null) cape.xRot += 0.25F * amount + Mth.sin(age * 0.07F) * 0.05F;
        float flap = Mth.sin(age * (hover ? 1.6F : 0.3F)) * (hover ? 0.5F : 0.08F);
        ModelPart wl = p("wing_l"), wr = p("wing_r");
        if (wl != null) wl.zRot -= flap;
        if (wr != null) wr.zRot += flap;
        ModelPart orbit = p("orbit");
        if (orbit != null) orbit.yRot += age * 0.05F;
        ModelPart jaw = p("jaw");
        if (jaw != null) jaw.xRot += Math.max(0, Mth.sin(age * 0.12F)) * 0.12F;
        // states
        int st = s.scriptedState;
        if ((st & com.mockingjam.spirecraft.mob.ScriptedMonster.ASLEEP) != 0) { root.y += 2; root.xRot += 0.12F; if (head != null && head != root) head.xRot += 0.4F; root.yScale = 1 + Mth.sin(age * 0.05F) * 0.03F; return; }
        if ((st & com.mockingjam.spirecraft.mob.ScriptedMonster.BURROWED) != 0) root.y += 14 + Mth.sin(age * 0.3F) * 0.5F;
        if ((st & com.mockingjam.spirecraft.mob.ScriptedMonster.DOWN) != 0) { root.zRot += 1.4F; root.y += 3; return; }
        // the move being made
        if (def == null || s.move <= 0 || s.move > def.moves.size()) return;
        var m = def.moves.get(s.move - 1);
        float wu = m.windup, w = wind(s, wu), hit = strike(s, wu, 6), f = settle(s, wu, 6);
        ModelPart al = p("arm_l"), ar = p("arm_r");
        switch (m.anim) {
            case STRIKE -> {
                if (ar != null) ar.xRot += -2.0F * w * (1 - hit) + 0.8F * hit + 0.2F * f;
                else if (head != null) head.xRot += -0.4F * w * (1 - hit) + 0.6F * hit;
                root.z -= 2 * hit;
            }
            case LUNGE -> { root.z += 3 * w * (1 - hit) - 5 * hit; root.xRot += -0.2F * w * (1 - hit) + 0.25F * hit + 0.05F * f; }
            case CAST -> { root.xRot -= 0.25F * w * (1 - hit) - 0.15F * f; swing(al, -1.2F * w); swing(ar, -1.2F * w); if (head != null && head != root) head.xRot -= 0.3F * w; }
            case SLAM -> { swing(al, -2.6F * w * (1 - hit)); swing(ar, -2.6F * w * (1 - hit)); root.y -= 2 * w * (1 - hit) - 1.5F * hit; root.xRot += 0.2F * hit; }
            case PUFF -> { float k = 1 + 0.15F * w + 0.05F * f; root.xScale = root.zScale = k; root.yScale = 1 + 0.1F * w; }
            case CALL -> { if (head != null && head != root) head.xRot -= 0.7F * w; if (al != null) al.zRot += 0.9F * w; if (ar != null) ar.zRot -= 0.9F * w; root.xRot -= 0.1F * w; }
            case SINK -> root.y += 4 * w;
            case SHAKE -> root.yRot += Mth.sin(s.moveAge * 1.4F) * 0.3F * Math.max(w, s.moveAge > wu ? 1 : 0);
            case REST -> { }
        }
    }

    private static void swing(ModelPart part, float x) {
        if (part != null) part.xRot += x;
    }
}
