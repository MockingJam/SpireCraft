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
        /** Glory G1: lightning strikes instead of a bolt; set the target alight (s); push searing embers into its inventory;
         *  give an ally of the named kind this much absorption. */
        public boolean lightning;
        public int ignite, embers, guardAmount;
        public String guardAlly;
        /** Glory G2: pull the target in (the Frog Knight's tongue); a lingering cloud of the move's effect where the target
         *  stands (the Slimed Berserker's ichor); a delayed blast on the target's spot (the Magi Knight's bomb); steal a
         *  level of Strength / Dexterity (the Lost / the Forgotten); knock the shield out of the target's hands (the Flail
         *  Knight); the move is called off if it takes this much damage while it winds up (the Sculptor's incantation);
         *  strength for the guarded ally (the Queen's Burn Bright for Me); damage + what it has stolen (the Forgotten's Dread). */
        public boolean pull, stealStr, stealDex, shieldBreak, dreadBonus;
        public int cloudTicks, bombDelay, allyStrength;
        public float bombDamage, interruptAt;
        public Supplier<Holder<MobEffect>> effect3;
        /** Glory G3: one more hit each time the move is used (the Test Subject's Multi-Claw); landed hits leave a Wound. */
        public boolean growHits, wound;
        /** Glory G4: grains of Wither Sand pushed into every player in the room (the Aeonglass's Escalate). */
        public int witherSand;
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
        public MoveDef lightning() { lightning = true; return this; }
        public MoveDef ignite(int seconds) { ignite = seconds; return this; }
        public MoveDef embers(int n) { embers = n; return this; }
        public MoveDef guard(String ally, int amount) { guardAlly = ally; guardAmount = amount; return this; }
        public MoveDef pull() { pull = true; return this; }
        public MoveDef cloud(int ticks) { cloudTicks = ticks; return this; }
        public MoveDef bomb(float dmg, int delay) { bombDamage = dmg; bombDelay = delay; return this; }
        public MoveDef stealStr() { stealStr = true; return this; }
        public MoveDef stealDex() { stealDex = true; return this; }
        public MoveDef shieldBreak() { shieldBreak = true; return this; }
        public MoveDef interruptAt(float dmg) { interruptAt = dmg; return this; }
        public MoveDef allyStr(String ally, int n) { guardAlly = ally; allyStrength = n; return this; }
        public MoveDef fx3(Supplier<Holder<MobEffect>> e) { effect3 = e; return this; }
        public MoveDef dread() { dreadBonus = true; return this; }
        public MoveDef growHits() { growHits = true; return this; }
        public MoveDef wound() { wound = true; return this; }
        public MoveDef witherSand(int n) { witherSand = n; return this; }
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
        /** Glory G1: Paper Cuts (each landed hit takes this much max health); Galvanic (players near it carry the effect); immune to fire. */
        public int paperCuts;
        public boolean galvanic, fireproof;
        /** Glory G2: an effect the players near it carry while it lives (Hex, Dampen); it does not move while an ally of
         *  this name lives (the Queen on her throne); effects taken off the players near it when it dies (You're Mine). */
        public Supplier<Holder<MobEffect>> aura;
        public String stationaryWhile;
        /** Glory G3: Stock (the Axebot: when killed, a new one is cast in its place, this many times); phases (the Test
         *  Subject: max health of each form - "killed" it gets up as the next); Enrage (phase 0: stronger whenever its
         *  target blocks, drinks or eats); Nemesis (from this phase on: 3 s of Intangible every 8 s). */
        public int stock, nemesisPhase = -1;
        public float[] phases;
        public boolean enrageOnUse;
        /** Glory v2 (2026-11-26, user: no altars - the boss waits in its room and the fight starts when you walk in): asleep
         *  until a player it can see comes within this many blocks (and up to {@link #wakeAbove} above / 3 below it); then
         *  the glory gates round it drop. With nobody near for 30 s it settles down again, healed, and the gates open. */
        public int wakeRoom, wakeAbove = 8;
        /** Glory v2: looks for a free Rhino Beetle and climbs on its back (the Frog Trainer). */
        public boolean mountsBeetle;
        public final List<Supplier<Holder<MobEffect>>> clearOnDeath = new ArrayList<>();
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
            DESERT = List.of(net.minecraft.world.level.biome.Biomes.DESERT), INK = List.of(ModBiomes.INK_SPRING_CAVES);

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
        ALL.get("tunneler").spawn(10, 1, 1, HIVE).spawn(15, 1, 1, DESERT).drop(Items.FLINT, 1, 2).drop(Items.SAND, 1, 3);

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

    // ============================================================================ Act 3: Glory, batch G1 (docs/design/glory.md)
    // Health ≈ STS2 × 0.35 (elites × 0.45), damage ≈ × 0.4. None spawn naturally: they live in the Glory buildings
    // (the brass works, the electromagnetic laboratory, the forbidden library), placed by the templates and spawners.
    static final Supplier<Holder<MobEffect>> NAUSEA = vanilla(MobEffects.NAUSEA), DARKNESS = vanilla(MobEffects.DARKNESS);

    /** Allies of the named kinds within 16 blocks (alive). */
    static int allies(ScriptedMonster mob, String... names) {
        java.util.Set<String> want = java.util.Set.of(names);
        return mob.level().getEntitiesOfClass(ScriptedMonster.class, mob.getBoundingBox().inflate(16), s -> s != mob && s.isAlive() && want.contains(s.def.name)).size();
    }

    static {
        // ---- the brass machines: the Fabricator and its bots
        def("fabricator", "Fabricator", "制造机").hp(50).speed(0.22F).armor(6).size(1.6F, 1.6F, 1)
                .moves(buff().summon("guardbot|noisebot+zapbot|stabbot", 1).sound(SoundEvents.ANVIL_USE),
                        shot(7, Items.IRON_NUGGET, SpireBolt.Kind.IRON).summon("zapbot|stabbot", 1).anim(Anim.CAST).sound(SoundEvents.SMITHING_TABLE_USE),
                        shot(4.5F, Items.REDSTONE, SpireBolt.Kind.FIRE).wind(18).sound(SoundEvents.BEACON_DEACTIVATE))
                .pattern(seq(), m(1));
        ALL.get("fabricator").picker = mob -> allies(mob, "zapbot", "stabbot", "guardbot", "noisebot") < 4 ? (mob.getRandom().nextBoolean() ? 1 : 2) : 3;
        ALL.get("fabricator").drop(() -> ModItems.AUTOMATON_ALLOY_INGOT.get(), 1, 3).drop(Items.COPPER_INGOT, 1, 4).drop(Items.REDSTONE, 1, 3);
        def("zapbot", "Zapbot", "电击机").hp(7).speed(0.3F).armor(2).size(0.7F, 0.9F, 1)
                .moves(shot(5.5F, Items.LIGHTNING_ROD, SpireBolt.Kind.IRON).str(1).sound(SoundEvents.BEACON_POWER_SELECT)).pattern(seq(), m(1)).minionOf("fabricator");
        ALL.get("zapbot").hover = true;
        ALL.get("zapbot").drop(Items.COPPER_INGOT, 0, 1).drop(Items.REDSTONE, 0, 1);
        def("stabbot", "Stabbot", "刺击机").hp(7).speed(0.32F).armor(2).size(0.7F, 0.8F, 1)
                .moves(melee(4.5F).fx(FRAIL, 100).anim(Anim.LUNGE)).pattern(seq(), m(1)).minionOf("fabricator");
        ALL.get("stabbot").drop(Items.IRON_NUGGET, 1, 3);
        def("guardbot", "Guardbot", "护卫机").hp(6).speed(0.26F).armor(2).size(0.7F, 0.7F, 1)
                .moves(buff().guard("fabricator", 6).sound(SoundEvents.BEACON_ACTIVATE)).pattern(seq(), m(1)).minionOf("fabricator");
        ALL.get("guardbot").moves.get(0).cooldown = 80;
        ALL.get("guardbot").hover = true;
        ALL.get("guardbot").drop(Items.COPPER_INGOT, 0, 1).drop(Items.GLASS_PANE, 0, 1);
        def("noisebot", "Noisebot", "噪音机").hp(7).speed(0.24F).armor(2).size(0.9F, 0.8F, 1)
                .moves(aoe(0, 6).fx(NAUSEA, 60).fx2(DARKNESS).anim(Anim.CALL).particle(ParticleTypes.NOTE).sound(SoundEvents.NOTE_BLOCK_BASS.value())).pattern(seq(), m(1)).minionOf("fabricator");
        ALL.get("noisebot").moves.get(0).cooldown = 100;
        ALL.get("noisebot").drop(Items.NOTE_BLOCK, 0, 1).drop(Items.COPPER_INGOT, 0, 1);

        // ---- the Turret Operator and the Living Shield (always a pair)
        def("turret_operator", "Turret Operator", "炮塔操作员").hp(15).speed(0).armor(2).size(0.9F, 1.1F, 1)
                .moves(shot(1.2F, Items.ARROW, SpireBolt.Kind.IRON).hits(5, 3).sound(SoundEvents.CROSSBOW_SHOOT), shot(1.2F, Items.ARROW, SpireBolt.Kind.IRON).hits(5, 3).sound(SoundEvents.CROSSBOW_SHOOT),
                        buff().str(1).anim(Anim.SHAKE).sound(SoundEvents.CROSSBOW_LOADING_END.value()))
                .pattern(seq(), m(1), m(2), m(3));
        ALL.get("turret_operator").stationary = true;
        ALL.get("turret_operator").drop(Items.ARROW, 2, 6).drop(Items.GUNPOWDER, 0, 2).drop(Items.IRON_NUGGET, 1, 3);
        def("living_shield", "Living Shield", "活体盾牌").hp(20).speed(0.24F).armor(10).size(0.8F, 2.0F, 1)
                .moves(buff().guard("turret_operator", 10).anim(Anim.SHAKE).sound(SoundEvents.SHIELD_BLOCK.value()), melee(2.5F).anim(Anim.STRIKE).sound(SoundEvents.SHIELD_BLOCK.value()),
                        melee(6.5F).str(1).wind(16).anim(Anim.SLAM).sound(SoundEvents.ANVIL_LAND))
                .pattern(seq(), m(1));
        ALL.get("living_shield").picker = mob -> allies(mob, "turret_operator") == 0 ? 3 : (mob.lastMove() == 1 ? 2 : 1);
        ALL.get("living_shield").drop(Items.IRON_INGOT, 0, 2).drop(Items.ARROW, 1, 4).drop(Items.STICK, 1, 3);

        // ---- the Mecha Knight (elite): asleep on its repair rack until someone comes into its hall
        def("mecha_knight", "Mecha Knight", "机甲骑士").hp(135).speed(0.24F).armor(12).size(1.2F, 2.6F, 1).elite()
                .moves(dash(10).wind(24).sound(SoundEvents.IRON_GOLEM_ATTACK),
                        aoe(3, 4.5F).ignite(4).embers(2).particle(ParticleTypes.FLAME).anim(Anim.CAST).sound(SoundEvents.BLAZE_SHOOT),
                        buff().absorb(6).str(2).anim(Anim.SHAKE).sound(SoundEvents.IRON_GOLEM_REPAIR),
                        melee(14).wind(30).reach(4.5F).anim(Anim.SLAM).sound(SoundEvents.ANVIL_LAND))
                .pattern(ids(1), m(2), m(3), m(4));
        ALL.get("mecha_knight").artifact = 3;
        ALL.get("mecha_knight").sleep = 1;
        ALL.get("mecha_knight").pitch = 0.7F;
        ALL.get("mecha_knight").fireproof = true;
        ALL.get("mecha_knight").drop(() -> ModItems.AUTOMATON_ALLOY_INGOT.get(), 3, 6).drop(Items.COPPER_INGOT, 2, 6).drop(Items.BLAZE_POWDER, 1, 2);

        // ---- the Globe Head (the electromagnetic laboratory; a technician in each brass works)
        def("globe_head", "Globe Head", "球头").hp(50).speed(0.24F).armor(4).size(0.7F, 2.0F, 1)
                .moves(melee(5).fx(FRAIL, 120).sound(SoundEvents.TRIDENT_THUNDER.value()), shot(2.5F, Items.LIGHTNING_ROD, SpireBolt.Kind.IRON).hits(3, 8).lightning().anim(Anim.CALL),
                        melee(6.5F).str(1).wind(18).anim(Anim.SLAM).sound(SoundEvents.BEACON_POWER_SELECT))
                .pattern(seq(), m(1), m(2), m(3));
        ALL.get("globe_head").galvanic = true;
        ALL.get("globe_head").drop(Items.COPPER_INGOT, 1, 3).drop(Items.REDSTONE, 1, 3).rareDrop(Items.LIGHTNING_ROD, 0.25F);

        // ---- the Scroll of Biting (the forbidden library), three or four together
        def("scroll_of_biting", "Scroll of Biting", "咬人卷轴").hp(12).speed(0.3F).size(0.7F, 0.9F, 1)
                .moves(melee(5.5F).wind(14).anim(Anim.LUNGE).sound(SoundEvents.BOOK_PAGE_TURN), buff().str(1).anim(Anim.SHAKE).sound(SoundEvents.BOOK_PUT), melee(2).hits(2, 6).sound(SoundEvents.BOOK_PAGE_TURN))
                .pattern(seq(any(1, 2, 3)), m(1), m(2), m(3), weighted(new int[] {1, 3}, new int[] {1, 2}));
        ALL.get("scroll_of_biting").hover = true;
        ALL.get("scroll_of_biting").paperCuts = 1;
        ALL.get("scroll_of_biting").drop(Items.PAPER, 1, 3).drop(Items.PURPLE_DYE, 0, 1).rareDrop(Items.BOOK, 0.2F);
    }

    // ============================================================================ Act 3: Glory, batch G2 (docs/design/glory.md)
    static final Supplier<Holder<MobEffect>> HEX = spire(ModEffects.HEX), DAMPEN = spire(ModEffects.DAMPEN), BOUND = spire(ModEffects.BOUND);

    static {
        // ---- the Knight Gang (elite, three together in the Knights' Keep): asleep in their alcoves until someone comes in
        def("flail_knight", "Flail Knight", "链枷骑士").hp(45).speed(0.24F).armor(10).size(1.0F, 2.1F, 1).elite()
                .moves(dash(6).wind(18).sound(SoundEvents.IRON_GOLEM_ATTACK), buff().str(1).anim(Anim.SHAKE).sound(SoundEvents.ARMOR_EQUIP_IRON.value()),
                        melee(3.6F).hits(2, 6).shieldBreak().reach(3).sound(SoundEvents.CHAIN_HIT))
                .pattern(ids(1), any(1, 2, 3));
        def("spectral_knight", "Spectral Knight", "幽灵骑士").hp(42).speed(0.26F).armor(4).size(0.9F, 2.1F, 1).elite()
                .moves(aoe(0, 16).anim(Anim.CALL).particle(ParticleTypes.SOUL).sound(SoundEvents.SOUL_ESCAPE.value()), melee(6).wind(14).sound(SoundEvents.PLAYER_ATTACK_SWEEP),
                        shot(1.2F, Items.SOUL_LANTERN, SpireBolt.Kind.FIRE).hits(3, 6).ignite(3).sound(SoundEvents.BLAZE_SHOOT))
                .pattern(ids(1), m(2), m(3));
        ALL.get("spectral_knight").aura = HEX;
        ALL.get("spectral_knight").hover = true;
        def("magi_knight", "Magi Knight", "法师骑士").hp(37).speed(0.24F).armor(6).size(0.8F, 2.2F, 1).elite()
                .moves(melee(2.4F).absorb(4).sound(SoundEvents.SHIELD_BLOCK.value()), aoe(0, 16).anim(Anim.CALL).particle(ParticleTypes.ENCHANT).sound(SoundEvents.EVOKER_CAST_SPELL),
                        melee(4).anim(Anim.LUNGE), buff().absorb(4).anim(Anim.SHAKE).sound(SoundEvents.ARMOR_EQUIP_CHAIN.value()),
                        buff().bomb(14, 40).wind(30).anim(Anim.CAST).sound(SoundEvents.EVOKER_PREPARE_ATTACK))
                .pattern(ids(1, 2), m(3), m(4), m(5));
        ALL.get("magi_knight").moves.get(4).kind = Kind.SHOT;   // needs its target in sight to aim the bomb
        ALL.get("magi_knight").moves.get(4).damage = 0;
        ALL.get("magi_knight").aura = DAMPEN;
        for (String k : new String[] {"flail_knight", "spectral_knight", "magi_knight"}) {
            Def d = ALL.get(k);
            d.sleep = 1;
            d.relic = 0;   // the three together: each 30 % a relic, and the Royal Summons
            d.rareDrop(Items.IRON_INGOT, 0.6F);
        }

        // ---- the Frog Knight (the frog outpost; two in the Queen's forecourt)
        def("frog_knight", "Frog Knight", "蛙骑士").hp(65).speed(0.3F).armor(8).size(1.4F, 1.8F, 1)
                .moves(melee(5).reach(6).pull().fx(FRAIL, 120).anim(Anim.LUNGE).sound(SoundEvents.FROG_TONGUE), melee(8.5F).wind(16).reach(3).anim(Anim.SLAM).sound(SoundEvents.TRIDENT_HIT),
                        buff().str(2).anim(Anim.CALL).sound(SoundEvents.FROG_AMBIENT), dash(14).wind(26).once().sound(SoundEvents.RAVAGER_ROAR))
                .pattern(seq(), m(1));
        ALL.get("frog_knight").picker = mob -> {   // Tongue Lash, then Strike Down Evil - For the Queen - (Beetle Charge once, below half) - Tongue Lash
            int last = mob.lastMove();
            if (last == 0 || last == 4) return 1;
            if (last == 1) return 2;
            if (last == 2) return 3;
            return mob.getHealth() < mob.getMaxHealth() / 2 && !mob.onceUsed() ? 4 : 1;
        };
        ALL.get("frog_knight").plating = 6;
        ALL.get("frog_knight").platingDecays = true;
        ALL.get("frog_knight").drop(Items.SLIME_BALL, 0, 2).drop(Items.IRON_NUGGET, 2, 6);
        // ---- the Frog Trainer (Glory v2, the beetle training grounds): a Frog Knight without its mount - it climbs on any
        // free Rhino Beetle near it and rides it at you (the beetle fights by itself; the frog lashes and stabs from its back)
        def("frog_trainer", "Frog Trainer", "青蛙训练师").hp(40).speed(0.3F).armor(6).size(0.8F, 1.5F, 1)
                .moves(melee(4).reach(6).pull().anim(Anim.LUNGE).sound(SoundEvents.FROG_TONGUE), melee(6).wind(14).reach(3.5F).anim(Anim.STRIKE).sound(SoundEvents.TRIDENT_HIT),
                        buff().str(1).anim(Anim.CALL).sound(SoundEvents.FROG_AMBIENT))
                .pattern(seq(), m(1), m(2), m(2), m(3));
        ALL.get("frog_trainer").mountsBeetle = true;
        ALL.get("frog_trainer").drop(Items.SLIME_BALL, 0, 2).drop(Items.LEAD, 0, 1).rareDrop(Items.SADDLE, 0.08F);

        // ---- the Devoted Sculptor (the quarry): its incantation can be broken off by a heavy blow
        def("devoted_sculptor", "Devoted Sculptor", "虔诚的雕刻师").hp(55).speed(0.26F).armor(2).size(0.8F, 2.0F, 1)
                .moves(buff().ritual(1).wind(40).interruptAt(8).anim(Anim.CALL).sound(SoundEvents.PARROT_IMITATE_ILLUSIONER), melee(5).wind(14).anim(Anim.SLAM).sound(SoundEvents.WOOD_HIT))
                .pattern(seq(), m(1));
        ALL.get("devoted_sculptor").picker = mob -> mob.ritual() == 0 && mob.lastMove() != 1 ? 1 : 2;
        ALL.get("devoted_sculptor").moves.get(1).cooldown = 40;
        ALL.get("devoted_sculptor").drop(Items.FEATHER, 1, 3).drop(Items.STICK, 1, 3).rareDrop(Items.CLAY_BALL, 0.5F);

        // ---- the Slimed Berserker (the old baths)
        def("slimed_berserker", "Slimed Berserker", "黏液狂战士").hp(90).speed(0.2F).armor(2).size(2.2F, 1.6F, 1)
                .moves(buff().cloud(160).fx(SLOW, 60, 1).anim(Anim.PUFF).sound(SoundEvents.SLIME_SQUISH), melee(1.6F).hits(4, 4).reach(3).anim(Anim.SHAKE).sound(SoundEvents.SLIME_ATTACK),
                        melee(0.5F).fx(WEAK, 160).str(1).reach(3).anim(Anim.CALL).sound(SoundEvents.SLIME_SQUISH), melee(12).wind(24).reach(3.5F).anim(Anim.SLAM).sound(SoundEvents.SLIME_BLOCK_FALL))
                .pattern(seq(), m(1), m(2), m(3), m(4));
        ALL.get("slimed_berserker").pitch = 0.7F;
        ALL.get("slimed_berserker").drop(Items.SLIME_BALL, 3, 8).rareDrop(Items.SLIME_BLOCK, 0.3F);

        // ---- the Lost and the Forgotten (the forgotten ruins): the Lost always brings the Forgotten
        def("the_lost", "The Lost", "迷失者").hp(33).speed(0.24F).armor(2).size(0.6F, 0.9F, 1)
                .moves(aoe(0, 6).stealStr().anim(Anim.PUFF).particle(ParticleTypes.LARGE_SMOKE).sound(SoundEvents.FIRE_EXTINGUISH),
                        shot(1.6F, Items.GLOWSTONE_DUST, SpireBolt.Kind.SPORE).hits(2, 6).sound(SoundEvents.ILLUSIONER_CAST_SPELL))
                .pattern(seq(), m(1), m(2));   // v2 (user): only one of the pair in a hall
        ALL.get("the_lost").hover = true;
        ALL.get("the_lost").drop(Items.STICK, 1, 3).rareDrop(Items.CARVED_PUMPKIN, 0.2F);
        def("the_forgotten", "The Forgotten", "遗忘者").hp(37).speed(0.24F).armor(4).size(0.7F, 0.7F, 1)
                .moves(aoe(0, 6).stealDex().absorb(3).anim(Anim.PUFF).particle(ParticleTypes.CAMPFIRE_COSY_SMOKE).sound(SoundEvents.FIRE_EXTINGUISH),
                        melee(5).dread().wind(16).anim(Anim.LUNGE).sound(SoundEvents.CHAIN_HIT))
                .pattern(seq(), m(1), m(2));
        ALL.get("the_forgotten").hover = true;
        ALL.get("the_forgotten").drop(Items.IRON_NUGGET, 1, 4).rareDrop(Items.CHAINMAIL_HELMET, 0.1F);

        // ---- the Queen (boss, her palace) and the Torch Head Amalgam she calls with her
        def("queen", "Queen", "女王").hp(300).speed(0.24F).armor(8).size(0.9F, 2.8F, 1).boss(BossEvent.BossBarColor.PURPLE)
                .moves(aoe(0, 24).fx(BOUND, 20 * 60 * 20).anim(Anim.CALL).particle(ParticleTypes.SOUL).sound(SoundEvents.CHAIN_PLACE),
                        aoe(0, 24).fx(WEAK, 20 * 60 * 20).fx2(VULNERABLE).fx3(FRAIL).anim(Anim.CALL).particle(ParticleTypes.WITCH).sound(SoundEvents.EVOKER_PREPARE_WOLOLO),
                        buff().absorb(8).allyStr("torch_head_amalgam", 1).anim(Anim.CAST).sound(SoundEvents.FIRECHARGE_USE),
                        melee(1.6F).hits(5, 4).reach(3).anim(Anim.STRIKE).sound(SoundEvents.PLAYER_ATTACK_SWEEP),
                        melee(6).wind(30).reach(3.5F).fx(SLOW, 60, 2).anim(Anim.SLAM).sound(SoundEvents.ANVIL_LAND),
                        buff().str(1).anim(Anim.CALL).sound(SoundEvents.RAVAGER_ROAR))
                .pattern(seq(), m(1)).with(1, "torch_head_amalgam");
        ALL.get("queen").picker = mob -> {   // her two curses; Burn Bright for Me while her Amalgam lives; then Enrage - Off with Your Head - Execution
            int last = mob.lastMove();
            if (last == 0) return 1;
            if (last == 1) return 2;
            if (allies(mob, "torch_head_amalgam") > 0) return 3;
            return last == 6 ? 4 : last == 4 ? 5 : 6;
        };
        ALL.get("queen").stationaryWhile = "torch_head_amalgam";
        ALL.get("queen").clearOnDeath.addAll(List.of(BOUND, WEAK, VULNERABLE, FRAIL));
        ALL.get("queen").pitch = 0.8F;
        ALL.get("queen").sleep = 1;          // v2: she waits on the top floor of her keep; the fight starts when you walk in
        ALL.get("queen").wakeRoom = 14;
        ALL.get("queen").drop(Items.AMETHYST_SHARD, 4, 8).drop(Items.GOLD_INGOT, 3, 6).drop(Items.EMERALD, 2, 5);
        def("torch_head_amalgam", "Torch Head Amalgam", "火炬头融合体").hp(150).speed(0.26F).armor(6).size(1.6F, 2.2F, 1).boss(BossEvent.BossBarColor.GREEN)
                .moves(dash(10).wind(22).sound(SoundEvents.RAVAGER_ATTACK), melee(7).reach(3).anim(Anim.LUNGE).sound(SoundEvents.RAVAGER_ATTACK),
                        shot(3.2F, Items.BLAZE_POWDER, SpireBolt.Kind.FIRE).hits(3, 6).ignite(2).sound(SoundEvents.BLAZE_SHOOT), melee(5.5F).reach(3).sound(SoundEvents.RAVAGER_ATTACK))
                .pattern(ids(1, 2), m(3), m(4), m(4));
        ALL.get("torch_head_amalgam").relic = 0;
        ALL.get("torch_head_amalgam").minionOf("queen");
        ALL.get("torch_head_amalgam").fireproof = true;
        ALL.get("torch_head_amalgam").sleep = 1;
        ALL.get("torch_head_amalgam").wakeRoom = 14;
        ALL.get("torch_head_amalgam").drop(Items.STICK, 2, 6).drop(Items.SOUL_TORCH, 2, 5);
    }

    // ============================================================================ Act 3: Glory, batch G4 (docs/design/glory.md)
    static {
        // ---- the Owl Magistrate (the Owl Court, in the overworld): Scrutinize - Peck - Judicial Flight - Verdict
        def("owl_magistrate", "Owl Magistrate", "枭法官").hp(80).speed(0.26F).armor(4).size(1.0F, 1.9F, 1)
                .moves(shot(6.5F, Items.ENDER_EYE, SpireBolt.Kind.SPORE).wind(24).anim(Anim.CAST).sound(SoundEvents.ENDER_EYE_LAUNCH),
                        melee(1.6F).hits(6, 4).reach(2.8F).anim(Anim.STRIKE).sound(SoundEvents.PARROT_IMITATE_VEX),
                        buff().self(vanilla(MobEffects.RESISTANCE), 140, 2).anim(Anim.CALL).sound(SoundEvents.PHANTOM_FLAP),
                        dash(13).wind(30).fx(VULNERABLE, 200).anim(Anim.LUNGE).sound(SoundEvents.PHANTOM_SWOOP))
                .pattern(seq(), m(1), m(2), m(3), m(4));
        ALL.get("owl_magistrate").drop(Items.FEATHER, 2, 5).drop(Items.PAPER, 1, 3).rareDrop(Items.BOOK, 0.3F);
        // ---- the Aeonglass (boss, the top of the Aeon Spire in the End): floats in place and turns; Ebb - Gaze - Escalate;
        // Wither presence: every sixth attack or item use near it pushes a grain of Wither Sand (GloryEffectEvents)
        def("aeonglass", "Aeonglass", "永世沙漏").hp(380).speed(0).armor(10).size(1.8F, 3.0F, 1).boss(BossEvent.BossBarColor.BLUE)
                .moves(aoe(9, 7).absorb(12).wind(26).anim(Anim.SLAM).particle(ParticleTypes.FALLING_DRIPSTONE_LAVA).sound(SoundEvents.SAND_FALL),
                        shot(4.4F, Items.PRISMARINE_CRYSTALS, SpireBolt.Kind.SPORE).hits(2, 10).wind(24).anim(Anim.CAST).sound(SoundEvents.BEACON_ACTIVATE),
                        buff().str(1).witherSand(1).anim(Anim.CALL).sound(SoundEvents.BELL_RESONATE))
                .pattern(seq(), m(1), m(2), m(3));
        ALL.get("aeonglass").artifact = 3;
        ALL.get("aeonglass").stationary = true;
        ALL.get("aeonglass").hover = true;
        ALL.get("aeonglass").sleep = 1;
        ALL.get("aeonglass").wakeRoom = 12;
        ALL.get("aeonglass").drop(Items.GLASS, 4, 8).drop(Items.PRISMARINE_CRYSTALS, 4, 10).drop(Items.GOLD_INGOT, 4, 8).drop(Items.ENDER_PEARL, 2, 4);
    }

    // ============================================================================ Act 3: Glory, batch G3 - the Nether (docs/design/glory.md)
    static {
        // ---- the Axebot (the foundry): cast iron, fireproof; Stock 2 - killed, another is cast in its place
        def("axebot", "Axebot", "斧头机器人").hp(25).speed(0.24F).armor(6).size(1.0F, 1.9F, 1)
                .moves(melee(5.5F).wind(16).fx(WEAK, 100).fx2(FRAIL).anim(Anim.SLAM).sound(SoundEvents.ANVIL_LAND), melee(4).hits(2, 6).anim(Anim.STRIKE).sound(SoundEvents.IRON_GOLEM_ATTACK))
                .pattern(seq(), m(1), m(2));
        ALL.get("axebot").stock = 2;
        ALL.get("axebot").fireproof = true;
        // v2 (user): cast from netherite scrap - a little of it comes back out of the last one broken
        ALL.get("axebot").drop(Items.IRON_NUGGET, 2, 6).rareDrop(Items.NETHERITE_SCRAP, 0.12F).rareDrop(Items.GOLD_NUGGET, 0.4F);

        // ---- the Soul Nexus (elite, its sanctum in the soul sand valley): rooted, it never moves
        def("soul_nexus", "Soul Nexus", "灵魂枢纽").hp(105).speed(0).armor(4).size(1.2F, 2.4F, 1).elite()
                .moves(shot(11.6F, Items.REDSTONE, SpireBolt.Kind.FIRE).wind(24).anim(Anim.CAST).sound(SoundEvents.BEACON_DEACTIVATE),
                        shot(2.4F, Items.AMETHYST_SHARD, SpireBolt.Kind.SPORE).hits(4, 5).anim(Anim.SHAKE).sound(SoundEvents.SOUL_ESCAPE.value()),
                        melee(7).reach(10).fx(VULNERABLE, 160).fx2(WEAK).heal(7).anim(Anim.CAST).sound(SoundEvents.WITHER_AMBIENT))
                .pattern(ids(1), any(1, 2, 3));
        ALL.get("soul_nexus").stationary = true;
        ALL.get("soul_nexus").hover = true;
        ALL.get("soul_nexus").drop(Items.SOUL_SOIL, 1, 3).drop(Items.GHAST_TEAR, 0, 2).rareDrop(Items.NETHERITE_SCRAP, 0.25F);

        // ---- the Test Subject (boss, the Proving Pit): three forms - it adapts, gets up bigger, with another head
        def("test_subject", "Test Subject", "实验体").hp(80).speed(0.3F).armor(6).size(1.6F, 1.6F, 1).boss(BossEvent.BossBarColor.YELLOW)
                .moves(melee(8).reach(3).anim(Anim.LUNGE).sound(SoundEvents.RAVAGER_ATTACK), melee(5.5F).reach(3).fx(VULNERABLE, 100).anim(Anim.SLAM).sound(SoundEvents.RAVAGER_ATTACK),
                        melee(4).hits(8, 4).growHits().wound().reach(3).anim(Anim.SHAKE).sound(SoundEvents.PLAYER_ATTACK_SWEEP),
                        melee(4).hits(3, 5).reach(3).anim(Anim.STRIKE).sound(SoundEvents.PLAYER_ATTACK_SWEEP), dash(18).wind(30).sound(SoundEvents.RAVAGER_ROAR),
                        aoe(0, 5).ignite(4).embers(2).str(1).anim(Anim.CALL).particle(ParticleTypes.FLAME).sound(SoundEvents.BLAZE_SHOOT))
                .pattern(seq(), m(1));
        ALL.get("test_subject").picker = mob -> {   // form 1: Bite / Skull Bash; form 2: Multi-Claw; form 3: Lacerate - Big Pounce - Burning Growl
            int last = mob.lastMove();
            if (mob.phase == 0) return last == 1 ? 2 : 1;
            if (mob.phase == 1) return 3;
            return last == 4 ? 5 : last == 5 ? 6 : 4;
        };
        ALL.get("test_subject").phases = new float[] {80, 160, 240};
        ALL.get("test_subject").enrageOnUse = true;
        ALL.get("test_subject").nemesisPhase = 2;
        ALL.get("test_subject").reviveTicks = 60;
        ALL.get("test_subject").pitch = 0.8F;
        ALL.get("test_subject").sleep = 1;   // v2: chained in its holding cell; it wakes when someone steps in
        ALL.get("test_subject").wakeRoom = 9;
        ALL.get("test_subject").wakeAbove = 6;
        ALL.get("test_subject").drop(Items.LEATHER, 3, 6).drop(Items.TURTLE_SCUTE, 1, 3).drop(Items.GOLD_INGOT, 3, 6);
    }

    public static Def get(String name) {
        return ALL.get(name);
    }
}
