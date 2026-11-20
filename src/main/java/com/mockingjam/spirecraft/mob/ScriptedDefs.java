package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.registry.ModItems;
import com.mockingjam.spirecraft.weapon.projectile.SpireBolt;
import com.mockingjam.spirecraft.worldgen.ModBiomes;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import net.minecraft.core.Holder;
import net.minecraft.core.particles.ParticleOptions;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.resources.ResourceKey;
import net.minecraft.sounds.SoundEvent;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.util.RandomSource;
import net.minecraft.world.BossEvent;
import net.minecraft.world.effect.MobEffect;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.biome.Biome;
import net.minecraftforge.registries.RegistryObject;

/**
 * Every STS2 monster of the three acts that the hand-written batches did not cover (docs/design/mobs.md §11), as data:
 * health (≈ STS2 × 0.45; elites ≈ × 0.5, at least 40; bosses 250-300), moves (damage ≈ × 0.4), the intent pattern,
 * powers, where and how many spawn, and what they drop. {@link ScriptedMonster} runs them.
 */
public final class ScriptedDefs {
    private ScriptedDefs() {}

    public enum Kind { MELEE, DASH, SHOT, LOB, AOE, SELF }
    /** How the client animates a move (client/mob/SpireMobModel scripted()). */
    public enum Anim { STRIKE, LUNGE, CAST, SLAM, PUFF, CALL, SINK, SHAKE, REST }

    // ======================================================================================== move
    public static final class MoveDef {
        public Kind kind = Kind.SELF;
        public Anim anim = Anim.PUFF;
        public int windup = 14, hits = 1, gap = 5, cooldown = 20;
        public float damage, reach = 2.2F, dash = 1.4F;
        public Supplier<? extends Item> look = () -> Items.SLIME_BALL;
        public SpireBolt.Kind bolt = SpireBolt.Kind.PEBBLE;
        public ParticleOptions particle = ParticleTypes.CLOUD;
        public SoundEvent sound;
        public int strength, absorb, heal, ritual, thorns, summonCount, steam, poison, doom, steal, effectTicks = 120, effectAmp, selfTicks = 100, selfAmp;
        public boolean wail, dropThorns, burrow, flee, explode, wake, hatch, once;
        public String summon;
        public Supplier<Holder<MobEffect>> effect, effect2, selfEffect;

        double range() {
            return switch (kind) { case MELEE -> reach; case DASH -> 10; case SHOT, LOB -> 12; case AOE -> reach; case SELF -> 64; };
        }

        int duration() {
            return kind == Kind.DASH ? 12 : (hits - 1) * gap + 8;
        }

        int[] hitTicks() {
            if (kind == Kind.DASH) return new int[] {0, 6};
            int[] t = new int[hits];
            for (int i = 0; i < hits; i++) t[i] = i * gap;
            return t;
        }

        // fluent setters
        public MoveDef wind(int t) { windup = t; return this; }
        public MoveDef hits(int n, int gapTicks) { hits = n; gap = gapTicks; return this; }
        public MoveDef str(int n) { strength = n; return this; }
        public MoveDef absorb(int n) { absorb = n; return this; }
        public MoveDef heal(int n) { heal = n; return this; }
        public MoveDef ritual(int n) { ritual = n; return this; }
        public MoveDef fx(Supplier<Holder<MobEffect>> e, int ticks) { effect = e; effectTicks = ticks; return this; }
        public MoveDef fx(Supplier<Holder<MobEffect>> e, int ticks, int amp) { effect = e; effectTicks = ticks; effectAmp = amp; return this; }
        public MoveDef fx2(Supplier<Holder<MobEffect>> e) { effect2 = e; return this; }
        public MoveDef self(Supplier<Holder<MobEffect>> e, int ticks, int amp) { selfEffect = e; selfTicks = ticks; selfAmp = amp; return this; }
        public MoveDef poison(int n) { poison = n; return this; }
        public MoveDef doom(int n) { doom = n; return this; }
        public MoveDef steal(int n) { steal = n; return this; }
        public MoveDef summon(String name, int n) { summon = name; summonCount = n; anim = Anim.CALL; return this; }
        public MoveDef thorns(int n) { thorns = n; return this; }
        public MoveDef dropThorns() { dropThorns = true; return this; }
        public MoveDef steam(int n) { steam = n; return this; }
        public MoveDef once() { once = true; return this; }
        public MoveDef wake() { wake = true; return this; }
        public MoveDef wail() { wail = true; anim = Anim.CALL; return this; }
        public MoveDef sound(SoundEvent s) { sound = s; return this; }
        public MoveDef look(Item i, SpireBolt.Kind k) { look = () -> i; bolt = k; return this; }
        public MoveDef particle(ParticleOptions p) { particle = p; return this; }
        public MoveDef anim(Anim a) { anim = a; return this; }
        public MoveDef reach(float r) { reach = r; return this; }
    }

    static MoveDef melee(float dmg) { MoveDef m = new MoveDef(); m.kind = Kind.MELEE; m.damage = dmg; m.anim = Anim.STRIKE; m.windup = 12; return m; }
    static MoveDef dash(float dmg) { MoveDef m = new MoveDef(); m.kind = Kind.DASH; m.damage = dmg; m.anim = Anim.LUNGE; m.windup = 20; m.reach = 2.6F; return m; }
    static MoveDef shot(float dmg, Item look, SpireBolt.Kind bolt) { return shot(dmg, () -> look, bolt); }
    static MoveDef shot(float dmg, Supplier<? extends Item> look, SpireBolt.Kind bolt) { MoveDef m = new MoveDef(); m.kind = Kind.SHOT; m.damage = dmg; m.look = look; m.bolt = bolt; m.anim = Anim.CAST; return m; }
    static MoveDef lob(float dmg, Item look, SpireBolt.Kind bolt) { MoveDef m = new MoveDef(); m.kind = Kind.LOB; m.damage = dmg; m.look = () -> look; m.bolt = bolt; m.anim = Anim.CAST; return m; }
    static MoveDef aoe(float dmg, float radius) { MoveDef m = new MoveDef(); m.kind = Kind.AOE; m.damage = dmg; m.reach = radius; m.anim = Anim.SLAM; m.windup = 18; return m; }
    static MoveDef buff() { return new MoveDef(); }
    static MoveDef rest(int ticks) { MoveDef m = new MoveDef(); m.anim = Anim.REST; m.windup = 0; m.hits = 1; m.gap = ticks; m.cooldown = 0; return m; }

    static Supplier<Holder<MobEffect>> spire(RegistryObject<MobEffect> e) { return () -> ModEffects.holder(e); }
    static Supplier<Holder<MobEffect>> vanilla(Holder<MobEffect> e) { return () -> e; }
    static final Supplier<Holder<MobEffect>> WEAK = spire(ModEffects.WEAK), FRAIL = spire(ModEffects.FRAIL), VULNERABLE = spire(ModEffects.VULNERABLE),
            RINGING = spire(ModEffects.RINGING), SLOW = vanilla(MobEffects.SLOWNESS), FATIGUE = vanilla(MobEffects.MINING_FATIGUE),
            WITHER = vanilla(MobEffects.WITHER), RESIST = vanilla(MobEffects.RESISTANCE), BLIND = vanilla(MobEffects.BLINDNESS);

    // ======================================================================================== pattern
    /** One step of the intent pattern: a fixed move, or a weighted random pick among several (optionally never twice running). */
    public record Pick(int[] ids, int[] weights, boolean noRepeat) {
        int pick(ScriptedMonster mob) {
            for (int tries = 0; tries < 8; tries++) {
                int total = 0;
                for (int w : weights) total += w;
                int r = mob.getRandom().nextInt(total), id = ids[ids.length - 1];
                for (int i = 0; i < ids.length; i++) { r -= weights[i]; if (r < 0) { id = ids[i]; break; } }
                if (noRepeat && id == mob.lastMove() && ids.length > 1) continue;
                if (mob.def.moves.get(id - 1).once && mob.onceUsed()) continue;
                return id;
            }
            return ids[0];
        }
    }

    static Pick m(int id) { return new Pick(new int[] {id}, new int[] {1}, false); }
    static Pick any(int... ids) { int[] w = new int[ids.length]; java.util.Arrays.fill(w, 1); return new Pick(ids, w, true); }
    static Pick weighted(int[] ids, int[] weights) { return new Pick(ids, weights, true); }
    static Pick[] seq(Pick... picks) { return picks; }
    static Pick[] ids(int... ids) { Pick[] p = new Pick[ids.length]; for (int i = 0; i < ids.length; i++) p[i] = m(ids[i]); return p; }

    @FunctionalInterface
    public interface Picker { int pick(ScriptedMonster mob); }

    /** Monsters that come along (or appear on death): {@code count} of one name picked from {@code names}. */
    public record Companion(String[] names, int count) {
        String pick(RandomSource r) { return names[r.nextInt(names.length)]; }
    }

    public record Spawn(List<ResourceKey<Biome>> biomes, int weight, int min, int max) {}
    public record Drop(Supplier<? extends Item> item, int min, int max, float chance, boolean byPlayer) {}

    // ======================================================================================== monster
    public static final class Def {
        public final String name, en, zh;
        public float hp = 20, speed = 0.25F, armor, kb, width = 0.8F, height = 1.0F, scale = 1, pitch = 1;
        public boolean boss, elite, stationary, hover, illusion, platingDecays, sleepPlatingLost, steamExplodes, slowStacks, carriesLoot;
        public BossEvent.BossBarColor barColor = BossEvent.BossBarColor.RED;
        public final List<MoveDef> moves = new ArrayList<>();
        public Pick[] opener = {}, loop = {};
        public Picker picker;
        public int slippery, hitCap, shellCap, curlUp, skittish, plating, artifact, suck, sleep, revives, reviveTicks = 60, reviveHealth, fleeAfter, hatchAfter, burrowMove;
        public String leader, hatchInto;
        public final List<Companion> spawnWith = new ArrayList<>(), deathSummon = new ArrayList<>();
        public final List<Spawn> spawns = new ArrayList<>();
        public final List<Drop> loot = new ArrayList<>();
        /** 0 none, 1 common relic 50 %, 2 rare relic always. */
        public int relic;

        Def(String name, String en, String zh) { this.name = name; this.en = en; this.zh = zh; }

        Def hp(float h) { hp = h; return this; }
        Def speed(float s) { speed = s; return this; }
        Def armor(float a) { armor = a; return this; }
        Def size(float w, float h, float drawScale) { width = w; height = h; scale = drawScale; return this; }
        Def moves(MoveDef... ms) { moves.addAll(List.of(ms)); return this; }
        Def pattern(Pick[] open, Pick... lp) { opener = open; loop = lp; return this; }
        Def elite() { elite = true; relic = 1; kb = 0.4F; return this; }
        Def boss(BossEvent.BossBarColor c) { boss = true; barColor = c; relic = 2; kb = 0.9F; return this; }
        Def spawn(int weight, int min, int max, List<ResourceKey<Biome>> biomes) { spawns.add(new Spawn(biomes, weight, min, max)); return this; }
        Def drop(Supplier<? extends Item> item, int min, int max) { loot.add(new Drop(item, min, max, 1, false)); return this; }
        Def drop(Item item, int min, int max) { return drop(() -> item, min, max); }
        Def rareDrop(Item item, float chance) { loot.add(new Drop(() -> item, 1, 1, chance, true)); return this; }
        Def with(int count, String... names) { spawnWith.add(new Companion(names, count)); return this; }
        Def onDeath(int count, String... names) { deathSummon.add(new Companion(names, count)); return this; }
        Def minionOf(String l) { leader = l; return this; }
    }

    public static final Map<String, Def> ALL = new LinkedHashMap<>();

    static Def def(String name, String en, String zh) {
        Def d = new Def(name, en, zh);
        ALL.put(name, d);
        return d;
    }

    // biome groups
    static final List<ResourceKey<Biome>> OG = ModBiomes.OVERGROWTHS, MISTY = List.of(ModBiomes.MISTY_OVERGROWTH), MUSHROOM = List.of(ModBiomes.MUSHROOM_OVERGROWTH),
            OG_PLAIN = List.of(ModBiomes.OVERGROWTH, ModBiomes.MUSHROOM_OVERGROWTH), DOCKS = List.of(ModBiomes.STONE_FOREST_DOCKS, ModBiomes.BEACH_DOCKS),
            STONE_DOCKS = List.of(ModBiomes.STONE_FOREST_DOCKS), BEACH = List.of(ModBiomes.BEACH_DOCKS), SEA_SHORE = List.of(ModBiomes.BEACH_DOCKS, ModBiomes.POLLUTED_SEA),
            HIVE = List.of(ModBiomes.HIVE_CAVES, ModBiomes.SPARSE_HIVE_CAVES, ModBiomes.EGG_HIVE_CAVES), EGG_HIVE = List.of(ModBiomes.EGG_HIVE_CAVES),
            QUICKSAND = List.of(ModBiomes.QUICKSAND_CAVES), INK = List.of(ModBiomes.INK_SPRING_CAVES);

    static {
        // ============================================================================ Act 1: the Overgrowth
        def("inklet", "Inklet", "墨宝").hp(6).speed(0.3F).size(0.6F, 0.7F, 1)
                .moves(melee(1.2F), melee(0.8F).hits(3, 4).anim(Anim.SHAKE), shot(4, () -> ModItems.INK_BUBBLE.get(), SpireBolt.Kind.INK).wind(16))
                .pattern(seq(any(1, 2)), m(1), any(3, 2));
        ALL.get("inklet").slippery = 1;
        ALL.get("inklet").spawn(20, 3, 3, OG).spawn(30, 3, 3, INK).drop(() -> ModItems.INK_BUBBLE.get(), 0, 1).drop(Items.INK_SAC, 0, 1);

        def("fogmog", "Fogmog", "雾菇").hp(33).speed(0.22F).size(1.0F, 1.6F, 1)
                .moves(buff().summon("eye_with_teeth", 1).sound(SoundEvents.SPORE_BLOSSOM_PLACE), melee(3.2F).str(1), melee(5.6F).wind(16).anim(Anim.LUNGE))
                .pattern(ids(1, 2), weighted(new int[] {2, 3}, new int[] {2, 3}));
        ALL.get("fogmog").spawn(25, 1, 1, MISTY).spawn(6, 1, 1, MUSHROOM).drop(Items.BROWN_MUSHROOM, 1, 3).drop(Items.RED_MUSHROOM, 0, 2).drop(Items.BONE_MEAL, 0, 2);
        def("eye_with_teeth", "Eye With Teeth", "利齿之眼").hp(6).speed(0.3F).size(0.6F, 0.6F, 1)
                .moves(shot(0, Items.ENDER_EYE, SpireBolt.Kind.SPORE).fx(RINGING, 60)).pattern(seq(), m(1)).minionOf("fogmog");
        ALL.get("eye_with_teeth").illusion = true;
        ALL.get("eye_with_teeth").reviveTicks = 100;
        ALL.get("eye_with_teeth").hover = true;
        ALL.get("eye_with_teeth").drop(Items.SPIDER_EYE, 0, 1);

        def("mawler", "Mawler", "蛮兽").hp(32).speed(0.3F).size(1.1F, 1.3F, 1)
                .moves(melee(1.6F).hits(2, 6), melee(5.6F).wind(16).anim(Anim.LUNGE), aoe(0, 8).fx(VULNERABLE, 120).once().anim(Anim.CALL).sound(SoundEvents.RAVAGER_ROAR))
                .pattern(ids(1), any(1, 2, 3));
        ALL.get("mawler").spawn(20, 1, 1, OG_PLAIN).drop(Items.LEATHER, 1, 2).drop(Items.BEEF, 1, 2).drop(Items.BONE, 0, 2);

        def("snapping_jaxfruit", "Snapping Jaxfruit", "闪光贾克斯果").hp(14).speed(0).size(0.9F, 1.1F, 1)
                .moves(shot(1.2F, Items.GLOW_BERRIES, SpireBolt.Kind.PEBBLE).str(1).sound(SoundEvents.CAVE_VINES_PICK_BERRIES)).pattern(seq(), m(1));
        ALL.get("snapping_jaxfruit").stationary = true;
        ALL.get("snapping_jaxfruit").spawn(20, 1, 2, OG).drop(Items.GLOW_BERRIES, 1, 3).drop(Items.MELON_SLICE, 0, 2);

        def("slithering_strangler", "Slithering Strangler", "蛇行扼杀者").hp(24).speed(0.28F).size(0.9F, 0.7F, 1)
                .moves(melee(0).poison(3).reach(3).anim(Anim.LUNGE), melee(2.8F).absorb(2), melee(4.8F).wind(16).reach(3))
                .pattern(ids(1), any(3, 2), m(1));
        ALL.get("slithering_strangler").spawn(20, 1, 1, OG).drop(Items.VINE, 1, 3).drop(Items.STRING, 0, 2);

        def("vine_shambler", "Vine Shambler", "藤蔓蹒跚者").hp(27).speed(0.2F).size(1.0F, 2.0F, 1)
                .moves(melee(2.4F).hits(2, 6), melee(3.2F).fx(SLOW, 80, 1).reach(3.5F), melee(6.4F).wind(18).anim(Anim.LUNGE))
                .pattern(seq(), m(1), m(2), m(3));
        ALL.get("vine_shambler").spawn(15, 1, 1, OG).drop(Items.VINE, 2, 4).drop(Items.MOSS_BLOCK, 0, 1).drop(Items.STICK, 1, 3);

        def("cubex_construct", "Cubex Construct", "方柱构装体").hp(29).speed(0.18F).armor(6).size(1.0F, 1.0F, 1)
                .moves(buff().str(1).sound(SoundEvents.BEACON_POWER_SELECT), shot(2.8F, Items.IRON_NUGGET, SpireBolt.Kind.IRON).str(1), shot(2, Items.IRON_NUGGET, SpireBolt.Kind.IRON).hits(2, 6))
                .pattern(ids(1), m(2), m(2), m(3));
        ALL.get("cubex_construct").artifact = 1;
        ALL.get("cubex_construct").spawn(8, 1, 1, OG).drop(Items.IRON_NUGGET, 2, 6).drop(Items.REDSTONE, 1, 3).drop(() -> ModItems.SCRAP.get(), 0, 2);

        // the Ruby Raiders: a party of three of the five, never two alike
        String[] raiders = {"axe_raider", "assassin_raider", "brute_raider", "crossbow_raider", "tracker_raider"};
        def("axe_raider", "Ruby Raider (Axe)", "劫掠者斧手").hp(9).speed(0.27F).size(0.6F, 1.9F, 1)
                .moves(melee(2).absorb(2), melee(4.8F).wind(18).anim(Anim.SLAM)).pattern(seq(), m(1), m(1), m(2));
        def("assassin_raider", "Ruby Raider (Assassin)", "劫掠者刺客").hp(9).speed(0.32F).size(0.6F, 1.9F, 1)
                .moves(shot(4, Items.IRON_NUGGET, SpireBolt.Kind.IRON).wind(18)).pattern(seq(), m(1));
        def("brute_raider", "Ruby Raider (Brute)", "劫掠者暴徒").hp(14).speed(0.24F).size(0.8F, 2.0F, 1)
                .moves(melee(2.8F), buff().str(1).sound(SoundEvents.PILLAGER_CELEBRATE)).pattern(seq(), m(1), m(2));
        def("crossbow_raider", "Ruby Raider (Crossbow)", "劫掠者弩手").hp(9).speed(0.25F).size(0.6F, 1.9F, 1)
                .moves(buff().absorb(1).sound(SoundEvents.CROSSBOW_LOADING_END.value()), shot(5.6F, Items.ARROW, SpireBolt.Kind.IRON).sound(SoundEvents.CROSSBOW_SHOOT)).pattern(seq(), m(1), m(2));
        def("tracker_raider", "Ruby Raider (Tracker)", "劫掠者追踪手").hp(10).speed(0.28F).size(0.6F, 1.9F, 1)
                .moves(shot(0, Items.STRING, SpireBolt.Kind.PEBBLE).fx(FRAIL, 160), melee(0.4F).hits(8, 3).reach(6).anim(Anim.CALL).sound(SoundEvents.RAVAGER_ROAR))
                .pattern(ids(1), m(2));
        for (String r : raiders) {
            Def d = ALL.get(r);
            List<String> others = new ArrayList<>(List.of(raiders));
            others.remove(r);
            d.with(1, others.subList(0, 2).toArray(String[]::new)).with(1, others.subList(2, 4).toArray(String[]::new));
            d.spawn(4, 1, 1, OG_PLAIN).drop(Items.EMERALD, 0, 1).drop(Items.LEATHER, 0, 1).rareDrop(Items.RED_DYE, 0.3F);
        }

        def("wriggler", "Wriggler", "扭动虫").hp(8).speed(0.25F).size(0.6F, 0.4F, 1)
                .moves(melee(2.4F), buff().str(1).poison(1).anim(Anim.SHAKE)).pattern(seq(any(1, 2)), m(1), m(2));
        ALL.get("wriggler").spawn(10, 3, 4, MUSHROOM).drop(Items.SLIME_BALL, 0, 1).drop(Items.ROTTEN_FLESH, 0, 1);

        def("bygone_effigy", "Bygone Effigy", "旧日雕像").hp(57).speed(0.2F).armor(6).size(1.0F, 2.6F, 1.3F).elite()
                .moves(rest(20), buff().str(4).wake().sound(SoundEvents.IRON_GOLEM_REPAIR), melee(5.2F).wind(16).anim(Anim.SLAM))
                .pattern(ids(1, 2), m(3));
        ALL.get("bygone_effigy").sleep = 3;
        ALL.get("bygone_effigy").slowStacks = true;
        ALL.get("bygone_effigy").spawn(2, 1, 1, OG).drop(Items.MOSSY_COBBLESTONE, 2, 5).drop(Items.GOLD_NUGGET, 2, 6);

        def("phrog_parasite", "Phrog Parasite", "异蛙寄生虫").hp(40).speed(0.26F).size(1.0F, 1.2F, 1.2F).elite()
                .moves(lob(0, Items.SLIME_BALL, SpireBolt.Kind.ACID).poison(3), melee(1.6F).hits(4, 4).reach(3)).pattern(seq(), m(1), m(2))
                .onDeath(4, "wriggler");
        ALL.get("phrog_parasite").spawn(2, 1, 1, MUSHROOM).spawn(1, 1, 1, OG_PLAIN).drop(Items.SLIME_BALL, 2, 4).drop(Items.FERMENTED_SPIDER_EYE, 0, 1);

        def("vantom", "Vantom", "墨影幻灵").hp(260).speed(0.26F).armor(6).size(2.2F, 3.8F, 1.45F).boss(BossEvent.BossBarColor.PURPLE)
                .moves(shot(2.8F, () -> ModItems.INK_BUBBLE.get(), SpireBolt.Kind.INK), melee(2.4F).hits(2, 6).reach(4.5F).anim(Anim.LUNGE),
                        melee(11).wind(30).reach(4.5F).fx(WITHER, 100).anim(Anim.SLAM).sound(SoundEvents.WITHER_SHOOT), buff().str(1).sound(SoundEvents.SCULK_SHRIEKER_SHRIEK))
                .pattern(seq(), m(1), m(2), m(3), m(4));
        ALL.get("vantom").slippery = 9;
        ALL.get("vantom").hover = true;
        ALL.get("vantom").drop(() -> ModItems.INK_BUBBLE.get(), 4, 8).drop(Items.INK_SAC, 4, 8).drop(Items.ECHO_SHARD, 1, 2);

        def("kin_priest", "Kin Priest", "同族神官").hp(250).speed(0.24F).armor(4).size(1.8F, 2.6F, 1.5F).boss(BossEvent.BossBarColor.GREEN)
                .moves(shot(3.6F, Items.SLIME_BALL, SpireBolt.Kind.SPORE).fx(FRAIL, 160), shot(3.6F, Items.INK_SAC, SpireBolt.Kind.INK).fx(WEAK, 160),
                        shot(1.2F, Items.GLOWSTONE_DUST, SpireBolt.Kind.FIRE).hits(3, 5), buff().str(1).sound(SoundEvents.EVOKER_PREPARE_SUMMON))
                .pattern(seq(), m(1), m(2), m(3), m(4)).with(2, "kin_follower");
        ALL.get("kin_priest").drop(Items.TOTEM_OF_UNDYING, 0, 1).drop(Items.GOLD_INGOT, 2, 5).drop(Items.BONE, 2, 5);
        def("kin_follower", "Kin Follower", "同族信徒").hp(26).speed(0.28F).size(0.6F, 1.9F, 1)
                .moves(melee(2), shot(0.8F, Items.BONE, SpireBolt.Kind.PEBBLE).hits(2, 8), buff().str(1).anim(Anim.SHAKE).sound(SoundEvents.PILLAGER_CELEBRATE))
                .pattern(seq(any(1, 3)), m(1), m(2), m(3));
        ALL.get("kin_follower").minionOf("kin_priest").drop(Items.BONE, 0, 2).drop(Items.FEATHER, 0, 2);

        // ============================================================================ Act 1: the Underdocks
        def("sludge_spinner", "Sludge Spinner", "淤泥旋螺").hp(17).speed(0.27F).size(0.9F, 0.8F, 1)
                .moves(shot(3.2F, Items.SLIME_BALL, SpireBolt.Kind.SLIME).fx(WEAK, 120), melee(4.4F).wind(16).anim(Anim.SLAM), melee(2.4F).str(1).anim(Anim.SHAKE))
                .pattern(ids(1), any(1, 2, 3));
        ALL.get("sludge_spinner").spawn(25, 1, 1, DOCKS).drop(Items.SLIME_BALL, 1, 2).drop(Items.STRING, 0, 2);

        def("calcified_cultist", "Calcified Cultist", "钙化邪教徒").hp(18).speed(0.25F).size(0.6F, 1.9F, 1)
                .moves(buff().ritual(1).anim(Anim.CALL).sound(SoundEvents.EVOKER_CAST_SPELL), melee(3.6F)).pattern(ids(1), m(2)).with(1, "damp_cultist");
        ALL.get("calcified_cultist").spawn(15, 1, 1, DOCKS).drop(Items.BONE_MEAL, 1, 3).drop(Items.CALCITE, 0, 2).drop(Items.FEATHER, 0, 2);
        def("damp_cultist", "Damp Cultist", "潮湿邪教徒").hp(23).speed(0.25F).size(0.6F, 1.9F, 1)
                .moves(buff().ritual(2).anim(Anim.CALL).sound(SoundEvents.EVOKER_CAST_SPELL), melee(0.5F)).pattern(ids(1), m(2));
        ALL.get("damp_cultist").drop(Items.KELP, 1, 2).drop(Items.FEATHER, 0, 2);

        def("living_fog", "Living Fog", "活雾").hp(36).speed(0.2F).size(1.4F, 1.6F, 1)
                .moves(aoe(3.2F, 4).fx(FATIGUE, 120, 1).particle(ParticleTypes.CAMPFIRE_COSY_SMOKE), shot(2, Items.GUNPOWDER, SpireBolt.Kind.PEBBLE).summon("gas_bomb", 1),
                        aoe(3.2F, 5).particle(ParticleTypes.LARGE_SMOKE).sound(SoundEvents.FIRECHARGE_USE))
                .pattern(ids(1), m(2), m(3));
        ALL.get("living_fog").hover = true;
        ALL.get("living_fog").spawn(12, 1, 1, DOCKS).spawn(10, 1, 1, MISTY).drop(Items.GUNPOWDER, 1, 3).drop(Items.WHITE_DYE, 0, 1);
        def("gas_bomb", "Gas Bomb", "气态炸弹").hp(6).speed(0.3F).size(0.6F, 0.6F, 1)
                .moves(aoe(3.2F, 3).particle(ParticleTypes.EXPLOSION).sound(SoundEvents.GENERIC_EXPLODE.value())).pattern(seq(), m(1)).minionOf("living_fog");
        ALL.get("gas_bomb").moves.get(0).explode = true;
        ALL.get("gas_bomb").moves.get(0).windup = 30;
        ALL.get("gas_bomb").hover = true;
        ALL.get("gas_bomb").drop(Items.GUNPOWDER, 0, 1);

        def("fossil_stalker", "Fossil Stalker", "化石追踪者").hp(23).speed(0.3F).size(1.0F, 1.0F, 1)
                .moves(melee(4.8F).wind(14).anim(Anim.LUNGE), melee(3.6F).fx(FRAIL, 120), melee(1.2F).hits(2, 5))
                .pattern(ids(1), any(1, 2, 3));
        ALL.get("fossil_stalker").suck = 1;
        ALL.get("fossil_stalker").spawn(15, 1, 1, STONE_DOCKS).drop(Items.BONE, 1, 3).drop(() -> ModItems.PEBBLE.get(), 1, 3);

        def("gremlin_merc", "Gremlin Merc", "地精佣兵").hp(21).speed(0.28F).size(0.7F, 1.4F, 1)
                .moves(melee(2.8F).hits(2, 6).steal(4), melee(2.4F).hits(2, 6).fx(WEAK, 120), melee(3.2F).str(1).anim(Anim.SHAKE))
                .pattern(seq(), m(1), m(2), m(3)).onDeath(1, "fat_gremlin").onDeath(1, "sneaky_gremlin");
        ALL.get("gremlin_merc").spawn(12, 1, 1, DOCKS).drop(Items.GOLD_NUGGET, 1, 4).drop(Items.LEATHER, 0, 1);
        def("fat_gremlin", "Fat Gremlin", "胖地精").hp(7).speed(0.32F).size(0.7F, 0.9F, 1).moves(rest(40)).pattern(seq(), m(1));
        ALL.get("fat_gremlin").carriesLoot = true;
        ALL.get("fat_gremlin").fleeAfter = 200;
        ALL.get("fat_gremlin").drop(Items.GOLD_NUGGET, 0, 2);
        def("sneaky_gremlin", "Sneaky Gremlin", "卑鄙地精").hp(6).speed(0.34F).size(0.5F, 0.9F, 1).moves(rest(20), melee(3.6F)).pattern(ids(1), m(2));
        ALL.get("sneaky_gremlin").drop(Items.GOLD_NUGGET, 0, 1);

        def("haunted_ship", "Haunted Ship", "幽灵船").hp(28).speed(0.22F).size(1.6F, 2.2F, 1)
                .moves(aoe(0, 10).fx(WEAK, 120).fx2(RINGING).anim(Anim.CALL).particle(ParticleTypes.SOUL).sound(SoundEvents.SOUL_ESCAPE.value()), melee(5.2F).reach(3.2F).wind(16), melee(1.6F).hits(3, 5).anim(Anim.SLAM).reach(3.2F))
                .pattern(ids(1), m(2), m(3));
        ALL.get("haunted_ship").hover = true;
        ALL.get("haunted_ship").spawn(6, 1, 1, SEA_SHORE).drop(Items.OAK_PLANKS, 2, 5).drop(Items.STRING, 1, 3).rareDrop(Items.NAUTILUS_SHELL, 0.15F);

        def("punch_construct", "Punch Construct", "拳击构装体").hp(25).speed(0.24F).armor(4).size(0.9F, 1.6F, 1)
                .moves(buff().absorb(4).sound(SoundEvents.IRON_GOLEM_REPAIR), melee(2).hits(2, 5).fx(FRAIL, 120), melee(5.6F).wind(18).anim(Anim.LUNGE))
                .pattern(seq(), m(1), m(2), m(3));
        ALL.get("punch_construct").artifact = 1;
        ALL.get("punch_construct").spawn(8, 1, 1, DOCKS).drop(Items.COPPER_INGOT, 1, 3).drop(() -> ModItems.SCRAP.get(), 0, 2);

        def("sewer_clam", "Sewer Clam", "下水道蚌").hp(25).speed(0.12F).size(1.0F, 0.8F, 1)
                .moves(shot(4, Items.PRISMARINE_CRYSTALS, SpireBolt.Kind.PEBBLE).sound(SoundEvents.BUBBLE_COLUMN_UPWARDS_INSIDE), buff().str(2).anim(Anim.PUFF))
                .pattern(ids(1), m(2), m(1));
        ALL.get("sewer_clam").plating = 4;
        ALL.get("sewer_clam").platingDecays = true;
        ALL.get("sewer_clam").spawn(15, 1, 1, SEA_SHORE).drop(Items.PRISMARINE_CRYSTALS, 0, 2).drop(Items.KELP, 0, 2).rareDrop(Items.PEARLESCENT_FROGLIGHT, 0.1F);

        def("skulking_colony", "Skulking Colony", "鬼祟珊瑚群").hp(45).speed(0.28F).armor(4).size(1.2F, 1.0F, 1.2F).elite()
                .moves(dash(5.6F), melee(3.6F).str(1), melee(2.8F).hits(2, 5).reach(2.8F)).pattern(seq(), m(1), m(1), m(2), m(3));
        ALL.get("skulking_colony").shellCap = 6;
        ALL.get("skulking_colony").spawn(3, 1, 1, DOCKS).drop(Items.NAUTILUS_SHELL, 0, 1).drop(Items.PRISMARINE_SHARD, 1, 3);

        def("phantasmal_gardener", "Phantasmal Gardener", "花园幽灵鳗").hp(14).speed(0.28F).size(0.6F, 1.0F, 1).elite()
                .moves(melee(2), melee(2.8F).reach(3), melee(0.4F).hits(3, 4).anim(Anim.SHAKE), buff().str(1).anim(Anim.PUFF))
                .pattern(seq(any(1, 2, 3, 4)), m(1), m(2), m(3), m(4));
        ALL.get("phantasmal_gardener").skittish = 2;
        ALL.get("phantasmal_gardener").hover = true;
        ALL.get("phantasmal_gardener").relic = 0;   // four together: the group is the elite, one of them carries the relic chance below
        ALL.get("phantasmal_gardener").spawn(3, 4, 4, STONE_DOCKS).drop(Items.SOUL_SOIL, 0, 1).drop(Items.GLOW_INK_SAC, 0, 1);

        def("waterfall_giant", "Waterfall Giant", "瀑布巨兽").hp(270).speed(0.2F).armor(8).size(3.6F, 4.4F, 1.7F).boss(BossEvent.BossBarColor.BLUE)
                .moves(buff().steam(15).sound(SoundEvents.BUBBLE_COLUMN_WHIRLPOOL_AMBIENT).anim(Anim.PUFF), aoe(6, 5).fx(WEAK, 120).steam(3).sound(SoundEvents.GENERIC_EXPLODE.value()),
                        dash(4).steam(3), buff().heal(10).steam(3).sound(SoundEvents.GENERIC_DRINK.value()),
                        shot(8, Items.PRISMARINE_CRYSTALS, SpireBolt.Kind.FIST).steam(3).wind(24).sound(SoundEvents.BUCKET_EMPTY), melee(5.2F).reach(4.5F).steam(3))
                .pattern(ids(1), m(2), m(3), m(4), m(5), m(6));
        ALL.get("waterfall_giant").steamExplodes = true;
        ALL.get("waterfall_giant").pitch = 0.6F;
        ALL.get("waterfall_giant").drop(Items.PRISMARINE_CRYSTALS, 4, 8).drop(Items.HEART_OF_THE_SEA, 0, 1).drop(Items.COPPER_BLOCK, 1, 2);

        def("lagavulin_matriarch", "Lagavulin Matriarch", "乐加维林族母").hp(250).speed(0.22F).armor(10).size(3.2F, 3.6F, 1.45F).boss(BossEvent.BossBarColor.RED)
                .moves(melee(7.6F).wind(18).reach(3.5F), melee(3.6F).hits(2, 6).reach(3.5F), melee(4.8F).absorb(5).reach(3.5F),
                        shot(0, Items.SOUL_SAND, SpireBolt.Kind.INK).fx(WEAK, 200).fx2(FRAIL).str(1).anim(Anim.CALL).sound(SoundEvents.SOUL_ESCAPE.value()))
                .pattern(seq(), m(1), m(2), m(3), m(4));
        ALL.get("lagavulin_matriarch").sleep = 3;
        ALL.get("lagavulin_matriarch").plating = 12;
        ALL.get("lagavulin_matriarch").sleepPlatingLost = true;
        ALL.get("lagavulin_matriarch").pitch = 0.7F;
        ALL.get("lagavulin_matriarch").drop(Items.IRON_INGOT, 4, 8).drop(Items.SOUL_SAND, 2, 4).drop(Items.NETHERITE_SCRAP, 0, 1);

        // ============================================================================ Act 2: the Hive
        def("ovicopter", "Ovicopter", "直飞产卵虫").hp(57).speed(0.25F).size(1.4F, 1.6F, 1.2F)
                .moves(buff().summon("tough_egg", 3).sound(SoundEvents.TURTLE_LAY_EGG), melee(6.4F).wind(16).anim(Anim.SLAM), melee(2.8F).fx(VULNERABLE, 120), buff().str(1).sound(SoundEvents.HONEY_DRINK.value()))
                .pattern(ids(1, 2, 3));
        ALL.get("ovicopter").picker = mob -> {   // Lay Eggs - Smash - Tenderizer, then lay again while 3 or fewer eggs/hatchlings are about, else feed
            int done = mob.lastMove();
            if (done == 0) return 1;
            if (done == 1) return 2;
            if (done == 2) return 3;
            if (done == 3) {
                var level = mob.level();
                int brood = level.getEntitiesOfClass(ScriptedMonster.class, mob.getBoundingBox().inflate(16), s -> s.def.name.equals("tough_egg") || s.def.name.equals("hatchling")).size();
                return brood <= 3 ? 1 : 4;
            }
            return 2;
        };
        ALL.get("ovicopter").hover = true;
        ALL.get("ovicopter").spawn(12, 1, 1, HIVE).spawn(20, 1, 1, EGG_HIVE).drop(Items.HONEYCOMB, 0, 2).drop(Items.PHANTOM_MEMBRANE, 0, 1);
        def("tough_egg", "Tough Egg", "结实的卵").hp(7).speed(0).size(0.6F, 0.7F, 1).moves(rest(40)).pattern(seq(), m(1));
        ALL.get("tough_egg").stationary = true;
        ALL.get("tough_egg").hatchAfter = 160;
        ALL.get("tough_egg").hatchInto = "hatchling";
        ALL.get("tough_egg").drop(Items.EGG, 0, 1);
        def("hatchling", "Hatchling", "幼虫").hp(9).speed(0.3F).size(0.5F, 0.5F, 1).moves(melee(1.6F)).pattern(seq(), m(1));
        ALL.get("hatchling").drop(Items.STRING, 0, 1);

        def("tunneler", "Tunneler", "地道虫").hp(39).speed(0.26F).size(1.0F, 1.0F, 1)
                .moves(melee(5.2F), buff().absorb(13).anim(Anim.SINK).sound(SoundEvents.SNIFFER_DIGGING), dash(9.6F).wind(24).reach(2.8F).anim(Anim.LUNGE))
                .pattern(ids(1, 2), m(3));
        ALL.get("tunneler").moves.get(1).burrow = true;
        ALL.get("tunneler").burrowMove = 3;
        ALL.get("tunneler").spawn(10, 1, 1, HIVE).spawn(15, 1, 1, QUICKSAND).drop(Items.FLINT, 1, 2).drop(Items.SAND, 1, 3);

        def("thieving_hopper", "Thieving Hopper", "偷窃草蜢").hp(36).speed(0.34F).size(0.8F, 1.0F, 1)
                .moves(melee(6.8F).steal(6), buff().self(RESIST, 100, 1).anim(Anim.SHAKE), melee(8.4F).wind(18).anim(Anim.LUNGE), melee(5.6F), buff())
                .pattern(seq(), m(1), m(2), m(3), m(4), m(5));
        ALL.get("thieving_hopper").moves.get(4).flee = true;
        ALL.get("thieving_hopper").spawn(8, 1, 1, HIVE).drop(Items.RABBIT_HIDE, 0, 2).drop(Items.EMERALD, 0, 1);

        def("hunter_killer", "Hunter Killer", "猎人杀手").hp(54).speed(0.3F).armor(4).size(1.2F, 1.2F, 1.1F)
                .moves(lob(0, Items.SLIME_BALL, SpireBolt.Kind.SLIME).fx(WEAK, 160).fx2(FRAIL), melee(6.8F).wind(16).anim(Anim.LUNGE), melee(2.8F).hits(3, 4))
                .pattern(ids(1), weighted(new int[] {2, 3}, new int[] {1, 2}));
        ALL.get("hunter_killer").spawn(8, 1, 1, HIVE).drop(Items.SPIDER_EYE, 1, 2).drop(Items.STRING, 1, 3);

        def("louse_progenitor", "Louse Progenitor", "虱虫之祖").hp(60).speed(0.22F).armor(4).size(1.4F, 1.2F, 1.2F)
                .moves(shot(3.6F, Items.COBWEB, SpireBolt.Kind.WEB).fx(FRAIL, 120), buff().absorb(6).str(2).anim(Anim.SINK), dash(5.6F))
                .pattern(seq(), m(1), m(2), m(3));
        ALL.get("louse_progenitor").curlUp = 6;
        ALL.get("louse_progenitor").spawn(8, 1, 1, HIVE).drop(Items.STRING, 2, 4).drop(Items.COBWEB, 0, 1);

        def("slumbering_beetle", "Slumbering Beetle", "熟睡甲虫").hp(39).speed(0.24F).armor(6).size(1.3F, 1.1F, 1.1F)
                .moves(dash(6.4F).str(1)).pattern(seq(), m(1));
        ALL.get("slumbering_beetle").sleep = 3;
        ALL.get("slumbering_beetle").plating = 7;
        ALL.get("slumbering_beetle").sleepPlatingLost = true;
        ALL.get("slumbering_beetle").spawn(8, 1, 1, HIVE).drop(Items.TURTLE_SCUTE, 0, 1).drop(Items.SLIME_BALL, 0, 1);

        def("spiny_toad", "Spiny Toad", "棘刺蟾蜍").hp(53).speed(0.24F).size(1.2F, 1.1F, 1.2F)
                .moves(buff().thorns(2).anim(Anim.PUFF).sound(SoundEvents.PUFFER_FISH_BLOW_UP), aoe(9.2F, 4).dropThorns().particle(ParticleTypes.CRIT).sound(SoundEvents.PUFFER_FISH_STING), melee(6.8F).reach(5).wind(14).anim(Anim.LUNGE))
                .pattern(seq(), m(1), m(2), m(3));
        ALL.get("spiny_toad").spawn(10, 1, 1, HIVE).spawn(8, 1, 1, MUSHROOM).drop(Items.SLIME_BALL, 1, 2).rareDrop(Items.OCHRE_FROGLIGHT, 0.15F);

        def("obscura", "The Obscura", "胧光怪").hp(55).speed(0.22F).size(1.0F, 2.2F, 1.2F)
                .moves(buff().summon("parafright", 1).sound(SoundEvents.ILLUSIONER_PREPARE_MIRROR), shot(4.4F, Items.ENDER_EYE, SpireBolt.Kind.INK), buff().wail().sound(SoundEvents.GHAST_SCREAM), melee(2.8F).absorb(3))
                .pattern(ids(1), any(2, 3, 4));
        ALL.get("obscura").hover = true;
        ALL.get("obscura").spawn(8, 1, 1, HIVE).drop(Items.ENDER_PEARL, 0, 1).drop(Items.BLACK_DYE, 0, 2);
        def("parafright", "Parafright", "寄生惧魔").hp(9).speed(0.3F).size(0.8F, 1.4F, 1).moves(melee(6.4F).wind(16).anim(Anim.SLAM)).pattern(seq(), m(1)).minionOf("obscura");
        ALL.get("parafright").illusion = true;
        ALL.get("parafright").reviveTicks = 100;
        ALL.get("parafright").hover = true;
        ALL.get("parafright").drop(Items.PHANTOM_MEMBRANE, 0, 1);

        def("decimillipede", "Decimillipede", "残杀千足虫").hp(63).speed(0.3F).armor(4).size(1.0F, 0.8F, 1.2F).elite()
                .moves(melee(2.4F).str(1), melee(2).hits(2, 5), aoe(3.6F, 3).fx(WEAK, 120).particle(ParticleTypes.SNEEZE))
                .pattern(seq(any(1, 2, 3)), m(1), m(2), m(3));
        ALL.get("decimillipede").revives = 2;
        ALL.get("decimillipede").reviveHealth = 11;
        ALL.get("decimillipede").reviveTicks = 40;
        ALL.get("decimillipede").spawn(3, 1, 1, HIVE).drop(Items.STRING, 2, 4).drop(Items.SPIDER_EYE, 1, 2);

        def("infested_prism", "Infested Prism", "感染棱柱").hp(75).speed(0.18F).armor(6).size(1.4F, 2.0F, 1.2F).elite()
                .moves(melee(6.8F).wind(14), aoe(2.4F, 3.5F).hits(3, 5).particle(ParticleTypes.CRIT).anim(Anim.SHAKE), melee(4).fx(VULNERABLE, 120).anim(Anim.PUFF))
                .pattern(seq(), m(1), m(1), m(2), m(3));
        ALL.get("infested_prism").hover = true;
        ALL.get("infested_prism").spawn(3, 1, 1, HIVE).drop(Items.HONEYCOMB, 2, 4).drop(Items.AMETHYST_SHARD, 2, 5);

        def("insatiable", "The Insatiable", "无厌沙虫").hp(280).speed(0.24F).armor(8).size(3.2F, 4.2F, 1.6F).boss(BossEvent.BossBarColor.YELLOW)
                .moves(aoe(0, 16).fx(SLOW, 120, 2).doom(8).anim(Anim.CALL).particle(ParticleTypes.CLOUD).sound(SoundEvents.SAND_BREAK),
                        melee(3.2F).hits(2, 6).reach(4), dash(11.2F).wind(26).reach(4), buff().str(1).anim(Anim.SHAKE).sound(SoundEvents.RAVAGER_AMBIENT))
                .pattern(ids(1), m(2), m(3), m(4), m(2));
        ALL.get("insatiable").pitch = 0.6F;
        ALL.get("insatiable").drop(Items.SAND, 8, 16).drop(Items.GOLD_INGOT, 3, 6).drop(Items.SNIFFER_EGG, 0, 1);
    }

    public static Def get(String name) {
        return ALL.get(name);
    }
}
