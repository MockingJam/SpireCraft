package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.registry.ModEntities;
import com.mockingjam.spirecraft.weapon.projectile.SpireBolt;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.Nullable;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.network.syncher.EntityDataAccessor;
import net.minecraft.network.syncher.EntityDataSerializers;
import net.minecraft.network.syncher.SynchedEntityData;
import net.minecraft.server.level.ServerBossEvent;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.BossEvent;
import net.minecraft.world.DifficultyInstance;
import net.minecraft.world.damagesource.DamageSource;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.entity.EntitySpawnReason;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.SpawnGroupData;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.ServerLevelAccessor;
import net.minecraft.world.level.storage.ValueInput;
import net.minecraft.world.level.storage.ValueOutput;
import net.minecraft.world.phys.Vec3;

/**
 * The data-driven STS2 monster (docs/design/mobs.md §11): one class runs every monster described by a
 * {@link ScriptedDefs.Def} - its move list, the intent pattern (opening moves, then a loop of fixed or random picks),
 * and its powers (Slippery, Hard Shell, Plating, Ritual, Curl Up, Skittish, Suck, sleeping, burrowing, Illusion /
 * Reattach revivals, minions and their leader, thieves that run off with your goods, a giant full of steam...).
 */
public class ScriptedMonster extends SpireMonster {
    private static final EntityDataAccessor<Integer> STATE = SynchedEntityData.defineId(ScriptedMonster.class, EntityDataSerializers.INT);
    /** Synced state bits for the renderer. */
    public static final int ASLEEP = 1, BURROWED = 2, DOWN = 4;
    /** The Test Subject's form (0-2) rides in bits 3-4 of the synced state, for the extra heads. */
    public static final int PHASE_SHIFT = 3;

    public final ScriptedDefs.Def def;
    private final ServerBossEvent bossBar;
    private int opener, loop, last, moves, slippery, curl, revivals, ritual, steam, plating, downTicks, sleepHits, hatch;
    private boolean skittishUsed, onceUsed;
    private float shellTaken;
    private int shellWindow;
    private final List<ItemStack> stolen = new ArrayList<>();
    /** Glory G2: what the Lost / the Forgotten took - real levels taken (given back on death) and "debt" levels laid on. */
    private final java.util.Map<java.util.UUID, int[]> stolenStats = new java.util.HashMap<>();
    /** Magi Knight bombs waiting to go off: {x, y, z, ticks left, damage}. */
    private final List<double[]> bombs = new ArrayList<>();
    /** Glory G3: Stock left (the Axebot) and the generation of this cast; the Test Subject's form; Multi-Claw's extra hits; was the target busy with an item last tick. */
    public int stockLeft = -1, stockGen, phase, growCount;
    private boolean targetWasUsing, reviveFull;
    /** Placed by a structure template (its NBT has no state yet): set up like a fresh spawn on the first tick. */
    private boolean fresh;
    private int alone;

    public ScriptedMonster(EntityType<? extends Monster> type, Level level, ScriptedDefs.Def def) {
        super(type, level);
        this.def = def;
        this.slippery = def.slippery;
        this.curl = def.curlUp;
        this.plating = def.plating;
        this.bossBar = def.boss ? new ServerBossEvent(getDisplayName(), def.barColor, BossEvent.BossBarOverlay.PROGRESS) : null;
        xpReward = def.boss ? 200 : def.elite ? 30 : 5;
        if (def.boss || def.elite) setPersistenceRequired();
        if (def.mountsBeetle) goalSelector.addGoal(1, new MountGoal());
    }

    /** The Frog Trainer: walks to the nearest free Rhino Beetle and climbs on. */
    class MountGoal extends net.minecraft.world.entity.ai.goal.Goal {
        private RhinoBeetle beetle;

        MountGoal() {
            setFlags(java.util.EnumSet.of(Flag.MOVE));
        }

        @Override
        public boolean canUse() {
            if (isPassenger() || tickCount % 10 != 0 || (state() & ASLEEP) != 0) return false;
            var all = level().getEntitiesOfClass(RhinoBeetle.class, getBoundingBox().inflate(16), RhinoBeetle::free);
            beetle = all.stream().min(java.util.Comparator.comparingDouble(ScriptedMonster.this::distanceToSqr)).orElse(null);
            return beetle != null;
        }

        @Override
        public boolean canContinueToUse() {
            return !isPassenger() && beetle != null && beetle.free() && distanceToSqr(beetle) < 400;
        }

        @Override
        public void tick() {
            if (beetle == null) return;
            getLookControl().setLookAt(beetle);
            if (distanceToSqr(beetle) < 4.5) {
                startRiding(beetle, true, false);
                if (getTarget() != null) beetle.setTarget(getTarget());
                level().playSound(null, blockPosition(), SoundEvents.FROG_LONG_JUMP, SoundSource.HOSTILE, 1.0F, 1.0F);
                beetle = null;
            } else if (tickCount % 10 == 0) getNavigation().moveTo(beetle, 1.2);
        }
    }

    @Override
    protected void defineSynchedData(SynchedEntityData.Builder builder) {
        super.defineSynchedData(builder);
        builder.define(STATE, 0);
    }

    public int state() {
        return entityData.get(STATE);
    }

    private void setState(int bit, boolean on) {
        entityData.set(STATE, on ? state() | bit : state() & ~bit);
    }

    @Override
    public void onSyncedDataUpdated(EntityDataAccessor<?> key) {
        super.onSyncedDataUpdated(key);
        if (!STATE.equals(key) || !(level() instanceof ServerLevel)) return;
        updateControlFlags();
        if ((state() & ASLEEP) != 0) { getNavigation().stop(); getMoveControl().setWait(); }
    }

    /** Asleep it does not walk, jump or look round (Glory v2 bosses wait in their rooms). Its AI still runs, so it can
     *  see a player walk in and wake (LivingEntity#aiStep skips the whole AI of an {@code isImmobile()} mob). */
    @Override
    protected void updateControlFlags() {
        super.updateControlFlags();
        if ((state() & ASLEEP) == 0) return;
        goalSelector.setControlFlag(net.minecraft.world.entity.ai.goal.Goal.Flag.MOVE, false);
        goalSelector.setControlFlag(net.minecraft.world.entity.ai.goal.Goal.Flag.JUMP, false);
        goalSelector.setControlFlag(net.minecraft.world.entity.ai.goal.Goal.Flag.LOOK, false);
    }

    @Override
    public SpawnGroupData finalizeSpawn(ServerLevelAccessor level, DifficultyInstance difficulty, EntitySpawnReason reason, @Nullable SpawnGroupData data) {
        // set up here, so the structure setup on the first tick must not run as well: a /summon with no NBT loads it
        // from an empty tag first (fresh), and a sleeper woken before that tick would fall asleep again
        fresh = false;
        if (def.artifact > 0) ModEffects.addStacks(this, ModEffects.ARTIFACT, def.artifact, -1, def.artifact);
        if (def.sleep > 0) setState(ASLEEP, true);
        if (def.hatchAfter > 0) hatch = def.hatchAfter;
        // companions that come with it (the Kin Priest's followers, a raiding party, the other cultist)
        if (reason != EntitySpawnReason.REINFORCEMENT && reason != EntitySpawnReason.MOB_SUMMONED) {
            for (var c : def.spawnWith) {
                String name = c.pick(getRandom());
                for (int i = 0; i < c.count(); i++) summon(level.getLevel(), name, getTarget());
            }
        }
        return super.finalizeSpawn(level, difficulty, reason, data);
    }

    @Override
    protected double chaseSpeed() {
        if (def.stationaryWhile != null && ScriptedDefs.allies(this, def.stationaryWhile) > 0) return 0;   // the Queen keeps her throne
        return def.stationary ? 0 : 1.0;
    }

    /** Levels of Strength (0) / Dexterity (1) this thief holds, all players together (the Forgotten's Dread). */
    int stolenTotal(int kind) {
        int n = 0;
        for (int[] v : stolenStats.values()) n += v[kind * 2] + v[kind * 2 + 1];
        return n;
    }

    @Override
    public boolean causeFallDamage(double distance, float multiplier, DamageSource source) {
        return !def.hover && super.causeFallDamage(distance, multiplier, source);
    }

    // ------------------------------------------------------------------------------------------- intents
    @Override
    protected Move nextMove() {
        if ((state() & (ASLEEP | DOWN)) != 0) return move(0);
        int id;
        if (def.picker != null) id = def.picker.pick(this);
        else if (opener < def.opener.length) id = def.opener[opener++].pick(this);
        else id = def.loop[loop++ % def.loop.length].pick(this);
        if ((state() & BURROWED) != 0 && def.burrowMove > 0) id = def.burrowMove;
        last = id;
        moves++;
        return move(id);
    }

    /** The move with this 1-based id ({@code 0}: a dazed / sleeping pause). */
    public Move move(int id) {
        if (id <= 0 || id > def.moves.size()) return Move.of(0, 0, 30, 0, 64, (l, s, t) -> { });
        ScriptedDefs.MoveDef m = def.moves.get(id - 1);
        return new Move(id, m.windup, m.duration(), m.cooldown, m.range(), m.hitTicks(), (level, self, target) -> perform(level, m, target));
    }

    int lastMove() {
        return last;
    }

    boolean onceUsed() {
        return onceUsed;
    }

    /** Does what one move says: its damage (melee, shot, lobbed, all round, a charge), then its side effects. */
    private void perform(ServerLevel level, ScriptedDefs.MoveDef m, LivingEntity target) {
        if (m.once) onceUsed = true;
        int count = m.hitTicks().length;
        boolean first = hitIndex() == 0, lastHit = hitIndex() == count - 1;
        if (m.sound != null && first) level.playSound(null, blockPosition(), m.sound, SoundSource.HOSTILE, def.boss ? 2.0F : 1.0F, def.pitch);
        if (target != null && m.hits > 1) target.invulnerableTime = 0;
        float dmg = m.damage + (m.dreadBonus ? stolenTotal(1) : 0);
        if (m.growHits && hitIndex() >= 3 + growCount) { if (lastHit) growCount++; return; }
        boolean landed = false;
        switch (m.kind) {
            case MELEE -> landed = dmg > 0 && strike(level, target, dmg, m.reach);
            case DASH -> {
                if (first && target != null) {
                    Vec3 to = target.position().subtract(position()).multiply(1, 0, 1).normalize();
                    setDeltaMovement(to.x * m.dash, 0.15, to.z * m.dash);
                    return;
                }
                landed = strike(level, target, dmg, m.reach);
                if (landed && target != null) target.knockback(1.0, getX() - target.getX(), getZ() - target.getZ());
            }
            case SHOT -> {
                if (m.lightning) landed = lightning(level, target, dmg);
                else if (dmg > 0 || m.hasTargetEffects()) carry(level, m, lastHit, shoot(level, target, new ItemStack(m.look.get()), m.bolt, dmg, 1.2F));
            }
            case LOB -> carry(level, m, lastHit, lob(level, target, new ItemStack(m.look.get()), m.bolt, dmg, getBbHeight() * 0.8));
            case AOE -> {
                level.sendParticles(m.particle, getX(), getY() + 0.5, getZ(), 40, m.reach / 2, 0.5, m.reach / 2, 0.02);
                for (Player p : level.getEntitiesOfClass(Player.class, getBoundingBox().inflate(m.reach, 2, m.reach), p -> !p.isSpectator())) {
                    if (dmg > 0) p.hurtServer(level, damageSources().mobAttack(this), dmg);
                    applyEffects(level, m, p);
                }
            }
            case SELF -> { }
        }
        // Lightning applies on a direct hit; other shots and lobs apply on impact, and AOE applies to each player above.
        boolean direct = switch (m.kind) { case MELEE, DASH -> landed; case SHOT -> m.lightning && landed; case SELF -> true; case LOB, AOE -> false; };
        if (lastHit && target != null && direct) applyEffects(level, m, target);
        if (landed && def.suck > 0) addStrength(def.suck, 20 * 60 * 10);   // Suck: stronger with every wound it opens
        // Paper Cuts (Scroll of Biting): every bite that lands takes a little of your max health
        if (landed && m.wound && target != null) ModEffects.addStacks(target, ModEffects.WOUND, 1, 300, 5);   // Painful Stabs
        if (landed && def.paperCuts > 0 && target instanceof Player) ModEffects.addStacks(target, ModEffects.PAPER_CUTS, def.paperCuts, 20 * 60 * 20, 6);
        if (!lastHit) return;
        // what it does for itself
        if (m.strength > 0) addStrength(m.strength, 20 * 60 * 10);
        if (m.absorb > 0) setAbsorptionAmount(Math.max(getAbsorptionAmount(), m.absorb));
        if (m.heal > 0) heal(m.heal);
        if (m.ritual > 0) ritual += m.ritual;
        if (m.wail) for (SpireMonster ally : level.getEntitiesOfClass(SpireMonster.class, getBoundingBox().inflate(16))) ally.addStrength(1, 20 * 60 * 10);
        if (m.selfEffect != null) addEffect(new MobEffectInstance(m.selfEffect.get(), m.selfTicks, m.selfAmp));
        if (m.thorns > 0) ModEffects.addStacks(this, ModEffects.THORNS, m.thorns, 200, 10);
        if (m.dropThorns) removeEffect(ModEffects.holder(ModEffects.THORNS));
        // summons: "a|b+c|d" = one of a or b, and one of c or d (the Fabricator: a defensive and an aggressive bot)
        if (m.summon != null) for (String group : m.summon.split("[+]")) {
            String[] names = group.split("[|]");
            for (int i = 0; i < m.summonCount; i++) summon(level, names[getRandom().nextInt(names.length)], target);
        }
        if (m.guardAlly != null) {   // the Guardbot / the Living Shield: a shield of absorption on the ally it serves
            var ally = level.getEntitiesOfClass(ScriptedMonster.class, getBoundingBox().inflate(16), s -> s.isAlive() && s.def.name.equals(m.guardAlly)).stream().findFirst();
            ally.ifPresent(a -> {
                if (m.guardAmount > 0) a.setAbsorptionAmount(Math.max(a.getAbsorptionAmount(), m.guardAmount));
                if (m.allyStrength > 0) a.addStrength(m.allyStrength, 20 * 60 * 10);   // the Queen's Burn Bright for Me
                level.sendParticles(ParticleTypes.ELECTRIC_SPARK, a.getX(), a.getY() + a.getBbHeight() * 0.6, a.getZ(), 12, 0.4, 0.4, 0.4, 0.05);
            });
        }
        if (m.steam > 0) steam += m.steam;
        if (m.witherSand > 0) {   // Escalate: more sand into every player in the room, and each grain burns harder from now on
            growCount++;
            for (Player p : level.getEntitiesOfClass(Player.class, getBoundingBox().inflate(24), p -> p.isAlive() && !p.isSpectator()))
                com.mockingjam.spirecraft.item.WitherSand.give(p, m.witherSand);
        }
        // the Slimed Berserker's ichor: a puddle that lingers where the target stands
        if (m.cloudTicks > 0 && target != null && distanceTo(target) < 16) {
            var cloud = new net.minecraft.world.entity.AreaEffectCloud(level, target.getX(), target.getY(), target.getZ());
            cloud.setOwner(this);
            cloud.setRadius(2.8F);
            cloud.setDuration(m.cloudTicks);
            cloud.setRadiusPerTick(-0.002F);
            cloud.setCustomParticle(ParticleTypes.ITEM_SLIME);
            if (m.effect != null) cloud.addEffect(new MobEffectInstance(m.effect.get(), 60, m.effectAmp));
            level.addFreshEntity(cloud);
        }
        // the Magi Knight's bomb: it marks the spot now and goes off a little later
        if (m.bombDelay > 0 && target != null) {
            bombs.add(new double[] {target.getX(), target.getY(), target.getZ(), m.bombDelay, m.bombDamage});
            level.sendParticles(ParticleTypes.ENCHANT, target.getX(), target.getY() + 0.1, target.getZ(), 60, 1.5, 0.05, 1.5, 0.2);
        }
        if (m.burrow) { setState(BURROWED, true); setAbsorptionAmount(m.absorb); }
        if (m.flee) flee(level);
        if (m.explode) { level.sendParticles(ParticleTypes.EXPLOSION, getX(), getY() + 0.5, getZ(), 3, 0.5, 0.3, 0.5, 0); discard(); }
        if (m.wake) setState(ASLEEP, false);
        if (m.hatch) hatchNow(level);
    }

    /** A shot or lob with effects of its own: they ride on the bolt (the last one of the move) instead of the bolt kind's. */
    private void carry(ServerLevel level, ScriptedDefs.MoveDef m, boolean lastHit, @Nullable SpireBolt bolt) {
        if (bolt == null || !m.hasTargetEffects()) return;
        bolt.carry(lastHit ? t -> applyEffects(level, m, t) : null, true);
    }

    private void applyEffects(ServerLevel level, ScriptedDefs.MoveDef m, LivingEntity t) {
        if (m.effect != null) t.addEffect(new MobEffectInstance(m.effect.get(), m.effectTicks, m.effectAmp), this);
        if (m.effect2 != null) t.addEffect(new MobEffectInstance(m.effect2.get(), m.effectTicks, 0), this);
        if (m.poison > 0) ModEffects.addStacks(t, ModEffects.POISON, m.poison, 1200, 30);
        if (m.doom > 0) ModEffects.addStacks(t, ModEffects.DOOM, m.doom, 20 * 60, 99);
        if (m.steal > 0 && t instanceof Player p && !isRemoved()) steal(p, m.steal);
        if (m.effect3 != null) t.addEffect(new MobEffectInstance(m.effect3.get(), m.effectTicks, 0), this);
        if (m.pull) {   // the Frog Knight's tongue drags you in
            t.setDeltaMovement(position().subtract(t.position()).normalize().scale(1.1).add(0, 0.35, 0));
            if (t instanceof net.minecraft.server.level.ServerPlayer sp) sp.hurtMarked = true;
        }
        if (m.shieldBreak && t instanceof Player p && p.isBlocking()) {   // the flail wraps round the shield and tears it aside
            p.getCooldowns().addCooldown(p.getUseItem(), 100);
            p.stopUsingItem();
            level().playSound(null, p.blockPosition(), SoundEvents.SHIELD_BREAK.value(), SoundSource.PLAYERS, 1.0F, 0.9F);
        }
        if ((m.stealStr || m.stealDex) && t instanceof Player p) stealStat(p, m.stealStr ? 0 : 1);
        if (m.ignite > 0) t.igniteForSeconds(m.ignite);
        if (m.embers > 0 && t instanceof Player p) com.mockingjam.spirecraft.item.SearingEmber.give(p, m.embers);
    }

    /** The Lost / the Forgotten: one level of Strength (0) or Dexterity (1) off the player - a real one if they have it, else a debt. */
    private void stealStat(Player p, int kind) {
        var real = kind == 0 ? ModEffects.STRENGTH : ModEffects.DEXTERITY;
        var debt = kind == 0 ? ModEffects.STOLEN_STRENGTH : ModEffects.STOLEN_SPEED;
        int[] v = stolenStats.computeIfAbsent(p.getUUID(), u -> new int[4]);
        int have = ModEffects.stacks(p, real);
        if (have > 0) {
            var inst = p.getEffect(ModEffects.holder(real));
            int dur = inst == null ? 600 : inst.getDuration();
            p.removeEffect(ModEffects.holder(real));
            if (have > 1) p.addEffect(new MobEffectInstance(ModEffects.holder(real), dur, have - 2));
            v[kind * 2]++;
        } else {
            ModEffects.addStacks(p, debt, 1, 20 * 60 * 10, 5);
            v[kind * 2 + 1]++;
        }
        if (kind == 0) addStrength(1, 20 * 60 * 10);
        else ModEffects.addStacks(this, ModEffects.DEXTERITY, 1, 20 * 60 * 10, 99);
    }

    /** On the thief's death: the debts are cancelled and the real levels go back. */
    private void returnStolen(ServerLevel level) {
        for (var e : stolenStats.entrySet()) {
            Player p = level.getPlayerByUUID(e.getKey());
            if (p == null) continue;
            int[] v = e.getValue();
            if (v[1] > 0) p.removeEffect(ModEffects.holder(ModEffects.STOLEN_STRENGTH));
            if (v[3] > 0) p.removeEffect(ModEffects.holder(ModEffects.STOLEN_SPEED));
            if (v[0] > 0) ModEffects.addStacks(p, ModEffects.STRENGTH, v[0], 20 * 60 * 2, 99);
            if (v[2] > 0) ModEffects.addStacks(p, ModEffects.DEXTERITY, v[2], 20 * 60 * 2, 99);
        }
        stolenStats.clear();
    }

    /** The Globe Head's thunder: a bolt of (harmless) lightning on the target, and the shock it gives. */
    private boolean lightning(ServerLevel level, LivingEntity target, float dmg) {
        if (target == null || distanceTo(target) > 16) return false;
        var bolt = net.minecraft.world.entity.EntityType.LIGHTNING_BOLT.create(level, EntitySpawnReason.TRIGGERED);
        if (bolt != null) {
            bolt.snapTo(target.getX() + getRandom().nextGaussian() * 0.6, target.getY(), target.getZ() + getRandom().nextGaussian() * 0.6);
            bolt.setVisualOnly(true);
            level.addFreshEntity(bolt);
        }
        return target.hurtServer(level, damageSources().lightningBolt(), dmg);
    }

    /** A thief's hands: up to {@code max} of the first emeralds / gold / diamonds it finds (it drops them when killed). */
    private void steal(Player p, int max) {
        for (Item want : new Item[] {Items.EMERALD, Items.GOLD_INGOT, Items.DIAMOND, Items.GOLD_NUGGET}) {
            int slot = p.getInventory().findSlotMatchingItem(new ItemStack(want));
            if (slot < 0) continue;
            stolen.add(p.getInventory().removeItem(slot, max));
            level().playSound(null, blockPosition(), SoundEvents.ITEM_PICKUP, SoundSource.HOSTILE, 1.0F, 0.6F);
            return;
        }
    }

    public List<ItemStack> stolen() {
        return stolen;
    }

    private void flee(ServerLevel level) {
        level.sendParticles(ParticleTypes.POOF, getX(), getY() + 0.5, getZ(), 20, 0.4, 0.4, 0.4, 0.05);
        level.playSound(null, blockPosition(), SoundEvents.FOX_SNIFF, SoundSource.HOSTILE, 1.0F, 1.6F);
        stolen.clear();   // it got away with them
        discard();
    }

    /** Calls up one more monster of the named kind beside it, already after the same target. */
    public ScriptedMonster summon(ServerLevel level, String name, @Nullable LivingEntity target) {
        var type = ModEntities.SCRIPTED.get(name);
        if (type == null) return null;
        ScriptedMonster mob = type.get().create(level, EntitySpawnReason.MOB_SUMMONED);
        if (mob == null) return null;
        mob.snapTo(getX() + getRandom().nextGaussian() * 1.2, getY(), getZ() + getRandom().nextGaussian() * 1.2, getYRot(), 0);
        mob.finalizeSpawn(level, level.getCurrentDifficultyAt(blockPosition()), EntitySpawnReason.MOB_SUMMONED, null);
        if (target != null) mob.setTarget(target);
        if (!stolen.isEmpty() && mob.def.carriesLoot) { mob.stolen.addAll(stolen); stolen.clear(); }
        level.addFreshEntity(mob);
        level.sendParticles(ParticleTypes.POOF, mob.getX(), mob.getY() + 0.5, mob.getZ(), 10, 0.3, 0.3, 0.3, 0.02);
        return mob;
    }

    private void hatchNow(ServerLevel level) {
        if (def.hatchInto == null) return;
        level.playSound(null, blockPosition(), SoundEvents.TURTLE_EGG_HATCH, SoundSource.HOSTILE, 1.0F, 0.8F);
        summon(level, def.hatchInto, getTarget());
        discard();
    }

    // ------------------------------------------------------------------------------------------- powers
    /** Glory v2: a boss waiting in its room wakes when a player it can see walks in. */
    public void watchRoom(ServerLevel level) {
        if (def.wakeRoom <= 0) return;
        boolean asleep = (state() & ASLEEP) != 0;
        if (bossBar != null) bossBar.setVisible(!asleep);
        if (tickCount % 10 != 0) return;
        var box = getBoundingBox().inflate(def.wakeRoom * (asleep ? 1 : 2), def.wakeAbove, def.wakeRoom * (asleep ? 1 : 2));
        var near = level.getEntitiesOfClass(Player.class, box, p -> p.isAlive() && !p.isSpectator() && !p.isCreative() && p.getY() > getY() - 3);
        if (asleep) {
            for (Player p : near) if (Math.hypot(p.getX() - getX(), p.getZ() - getZ()) <= def.wakeRoom && hasLineOfSight(p)) { setTarget(p); wake(level); return; }
            return;
        }
        if (!near.isEmpty()) { alone = 0; return; }
        if ((alone += 10) < 600) return;
        // nobody left in the room for 30 s: it settles down again, healed, and lets the way open
        alone = 0;
        setTarget(null);
        removeAllEffects();
        setHealth(getMaxHealth());
        setState(ASLEEP, true);
        sleepHits = 0;
        com.mockingjam.spirecraft.block.GloryGateBlock.setAll(level, blockPosition(), 40, false);
    }

    @Override
    protected void customServerAiStep(ServerLevel level) {
        if (fresh) {
            fresh = false;
            if (def.artifact > 0) ModEffects.addStacks(this, ModEffects.ARTIFACT, def.artifact, -1, def.artifact);
            if (def.sleep > 0) setState(ASLEEP, true);
        }
        watchRoom(level);
        boolean asleep = (state() & ASLEEP) != 0;
        int before = moveId();
        if (!asleep) super.customServerAiStep(level);   // asleep: no intents (its pause would only turn its head to you)
        if (before != 0 && moveId() == 0) onMoveDone();
        if (bossBar != null) bossBar.setProgress(getHealth() / getMaxHealth());
        // bombs counting down: a ring of warning on the ground, then the blast
        for (var it = bombs.iterator(); it.hasNext(); ) {
            double[] b = it.next();
            if (--b[3] % 5 == 0) level.sendParticles(ParticleTypes.WITCH, b[0], b[1] + 0.1, b[2], 12, 1.2, 0.02, 1.2, 0.01);
            if (b[3] > 0) continue;
            level.sendParticles(ParticleTypes.EXPLOSION, b[0], b[1] + 0.5, b[2], 3, 0.6, 0.3, 0.6, 0);
            level.playSound(null, net.minecraft.core.BlockPos.containing(b[0], b[1], b[2]), SoundEvents.GENERIC_EXPLODE.value(), SoundSource.HOSTILE, 1.5F, 1.2F);
            for (Player p : level.getEntitiesOfClass(Player.class, new net.minecraft.world.phys.AABB(b[0] - 2.5, b[1] - 1, b[2] - 2.5, b[0] + 2.5, b[1] + 3, b[2] + 2.5)))
                p.hurtServer(level, damageSources().indirectMagic(this, this), (float) b[4]);
            it.remove();
        }
        // Enrage (the Test Subject's first form): it grows stronger whenever its target raises a shield, drinks or eats
        if (def.enrageOnUse && phase == 0 && !asleep && getTarget() != null) {
            boolean using = getTarget().isUsingItem();
            if (using && !targetWasUsing) addStrength(1, 20 * 60 * 10);
            targetWasUsing = using;
        }
        // Nemesis (its last form): every 8 s it turns Intangible for 3 s
        if (def.nemesisPhase >= 0 && phase >= def.nemesisPhase && !asleep && tickCount % 160 == 0) {
            addEffect(new MobEffectInstance(ModEffects.holder(ModEffects.INTANGIBLE), 60, 0));
            level.sendParticles(ParticleTypes.REVERSE_PORTAL, getX(), getY() + 1, getZ(), 30, 0.6, 0.6, 0.6, 0.02);
        }
        // an aura the players near it carry while it lives (Hex, Dampen) - not while it sleeps
        if (def.aura != null && tickCount % 20 == 0 && !asleep)
            for (Player p : level.getEntitiesOfClass(Player.class, getBoundingBox().inflate(16), p -> !p.isSpectator() && !p.isCreative()))
                p.addEffect(new MobEffectInstance(def.aura.get(), 40, 0, false, true, true), this);
        // Galvanic (Globe Head): the players near it carry the charge (SpireEffectEvents: a new buff shocks them)
        if (def.galvanic && tickCount % 20 == 0)
            for (Player p : level.getEntitiesOfClass(Player.class, getBoundingBox().inflate(16), p -> !p.isSpectator() && !p.isCreative()))
                p.addEffect(new MobEffectInstance(ModEffects.holder(ModEffects.GALVANIC), 40, 0, false, true, true), this);
        if (++shellWindow >= 100) { shellWindow = 0; shellTaken = 0; }
        // asleep: wakes when the target has been close a while (or when hit enough - see hurtServer)
        if (def.wakeRoom <= 0 && (state() & ASLEEP) != 0 && getTarget() != null && tickCount % 20 == 0 && ++sleepHits > def.sleep * 5) wake(level);
        // knocked down (Illusion / Reattach): back up at full strength after a while
        if ((state() & DOWN) != 0 && --downTicks <= 0) {
            setState(DOWN, false);
            setInvisible(false);
            setHealth(reviveFull || def.reviveHealth <= 0 ? getMaxHealth() : def.reviveHealth);
            reviveFull = false;
            level.sendParticles(ParticleTypes.ENCHANT, getX(), getY() + 1, getZ(), 30, 0.4, 0.6, 0.4, 0.5);
        }
        // eggs hatch on their own
        if (hatch > 0 && --hatch == 0) hatchNow(level);
        // a minion without its leader runs off
        if (def.leader != null && tickCount > 100 && tickCount % 40 == 0) {
            var leader = ModEntities.SCRIPTED.get(def.leader);
            if (leader != null && level.getEntities(leader.get(), getBoundingBox().inflate(32), LivingEntity::isAlive).isEmpty()) flee(level);
        }
        if (def.fleeAfter > 0 && tickCount > def.fleeAfter) flee(level);
    }

    private void onMoveDone() {
        skittishUsed = false;
        if (ritual > 0) addStrength(ritual, 20 * 60 * 10);   // Ritual: stronger after every move
        if (plating > 0) {                                     // Plating: a fresh shell after every move, a little thinner each time
            setAbsorptionAmount(Math.max(getAbsorptionAmount(), plating));
            if (def.platingDecays) plating--;
        }
    }

    private void wake(ServerLevel level) {
        if ((state() & ASLEEP) == 0) return;
        setState(ASLEEP, false);
        if (def.sleepPlatingLost) plating = 0;
        level.playSound(null, blockPosition(), SoundEvents.RAVAGER_ROAR, SoundSource.HOSTILE, def.boss ? 2.5F : 1.0F, def.pitch);
        if (def.wakeRoom > 0) {   // the fight starts: the gates drop
            alone = 0;
            com.mockingjam.spirecraft.block.GloryGateBlock.setAll(level, blockPosition(), 40, true);
        }
    }

    @Override
    public boolean hurtServer(ServerLevel level, DamageSource source, float amount) {
        if ((state() & DOWN) != 0) return false;
        if (def.fireproof && source.is(net.minecraft.tags.DamageTypeTags.IS_FIRE)) return false;   // cast in the foundry / built for its own flames
        // a heavy blow breaks off a move that can be interrupted (the Sculptor's incantation)
        int mid = moveId();
        if (mid > 0 && mid <= def.moves.size() && def.moves.get(mid - 1).interruptAt > 0 && amount >= def.moves.get(mid - 1).interruptAt) {
            startMove(move(0));
            level.playSound(null, blockPosition(), SoundEvents.SHIELD_BLOCK.value(), SoundSource.HOSTILE, 1.0F, 0.6F);
        }
        boolean bypass = source.is(net.minecraft.tags.DamageTypeTags.BYPASSES_INVULNERABILITY);
        if (!bypass) {
            if (slippery > 0) { slippery--; amount = Math.min(amount, 1); }          // Slippery: the next blows only graze it
            if (def.hitCap > 0) amount = Math.min(amount, def.hitCap);                // Hard to Kill
            if (def.shellCap > 0) {                                                   // Hardened Shell: so much per 5 seconds
                amount = Math.min(amount, Math.max(0, def.shellCap - shellTaken));
                shellTaken += amount;
                if (amount <= 0) return false;
            }
            if (curl > 0) { setAbsorptionAmount(Math.max(getAbsorptionAmount(), curl)); curl = 0; }   // Curl Up, once
            if (def.skittish > 0 && !skittishUsed) { skittishUsed = true; setAbsorptionAmount(Math.max(getAbsorptionAmount(), def.skittish)); }
            if (def.slowStacks && ModEffects.stacks(this, ModEffects.VULNERABLE) == 0) addEffect(new MobEffectInstance(ModEffects.holder(ModEffects.VULNERABLE), 100, 0));
        }
        boolean hurt = super.hurtServer(level, source, amount);
        // not when that blow killed it: die() has already opened the gates, and wake() would drop them again
        if (hurt && isAlive() && (state() & ASLEEP) != 0 && ++sleepHits >= def.sleep) wake(level);
        if (hurt && (state() & BURROWED) != 0 && getAbsorptionAmount() <= 0) {        // dug out: dazed
            setState(BURROWED, false);
            startMove(move(0));
        }
        return hurt;
    }

    /** Lethal damage: Illusion / Reattach knock it down instead; the steam giant blows up. */
    @Override
    protected void actuallyHurt(ServerLevel level, DamageSource source, float amount) {
        if (def.phases != null && phase < def.phases.length - 1 && amount >= getHealth() + getAbsorptionAmount()
                && !source.is(net.minecraft.tags.DamageTypeTags.BYPASSES_INVULNERABILITY)) {
            nextPhase(level);
            return;
        }
        if (amount >= getHealth() + getAbsorptionAmount() && !source.is(net.minecraft.tags.DamageTypeTags.BYPASSES_INVULNERABILITY)) {
            boolean leaderAlive = def.leader == null || !level.getEntities(ModEntities.SCRIPTED.get(def.leader).get(), getBoundingBox().inflate(32), LivingEntity::isAlive).isEmpty();
            if ((def.illusion && leaderAlive) || revivals < def.revives) {
                revivals++;
                setHealth(1);
                setAbsorptionAmount(0);
                setState(DOWN, true);
                downTicks = def.reviveTicks;
                startMove(move(0));
                level.sendParticles(ParticleTypes.LARGE_SMOKE, getX(), getY() + 0.5, getZ(), 20, 0.4, 0.4, 0.4, 0.02);
                return;
            }
            if (def.steamExplodes && steam > 0) {
                float boom = Math.min(16, 4 + steam * 0.4F);
                level.sendParticles(ParticleTypes.CLOUD, getX(), getY() + 1, getZ(), 120, 3, 1.5, 3, 0.2);
                level.playSound(null, blockPosition(), SoundEvents.GENERIC_EXPLODE.value(), SoundSource.HOSTILE, 3.0F, 0.7F);
                for (Player p : level.getEntitiesOfClass(Player.class, getBoundingBox().inflate(6))) p.hurtServer(level, damageSources().explosion(this, this), boom);
                steam = 0;
            }
        }
        super.actuallyHurt(level, source, amount);
    }

    @Override
    protected void dropCustomDeathLoot(ServerLevel level, DamageSource source, boolean recentlyHit) {
        super.dropCustomDeathLoot(level, source, recentlyHit);
        for (ItemStack s : stolen) spawnAtLocation(level, s);   // killed before it got away: your goods back
        stolen.clear();
    }

    /** The Test Subject adapts: it falls, everything on it is cleared, and it rises as its next, bigger form. */
    public void nextPhase(ServerLevel level) {
        phase++;
        removeAllEffects();
        setAbsorptionAmount(0);
        getAttribute(net.minecraft.world.entity.ai.attributes.Attributes.MAX_HEALTH).setBaseValue(def.phases[phase]);
        setHealth(getMaxHealth());
        entityData.set(STATE, (state() & ~(3 << PHASE_SHIFT)) | (phase << PHASE_SHIFT));
        setState(DOWN, true);
        downTicks = def.reviveTicks;
        reviveFull = true;
        startMove(move(0));
        level.sendParticles(ParticleTypes.LARGE_SMOKE, getX(), getY() + 0.5, getZ(), 30, 0.6, 0.4, 0.6, 0.02);
        level.playSound(null, blockPosition(), SoundEvents.RAVAGER_ROAR, SoundSource.HOSTILE, 2.0F, 0.6F + phase * 0.1F);
    }

    @Override
    public void die(DamageSource source) {
        // Stock (the Axebot): another is cast where this one fell, a little tougher, booting up angry
        if (level() instanceof ServerLevel sl && def.stock > 0) {
            int left = stockLeft < 0 ? def.stock : stockLeft;
            if (left > 0) {
                ScriptedMonster next = summon(sl, def.name, getTarget());
                if (next != null) {
                    next.stockLeft = left - 1;
                    next.stockGen = stockGen + 1;
                    var hp = next.getAttribute(net.minecraft.world.entity.ai.attributes.Attributes.MAX_HEALTH);
                    hp.setBaseValue(hp.getBaseValue() + 4 * next.stockGen);
                    next.setHealth(next.getMaxHealth());
                    next.setAbsorptionAmount(4);
                    next.addStrength(next.stockGen, 20 * 60 * 10);
                    sl.sendParticles(ParticleTypes.LAVA, next.getX(), next.getY() + 1, next.getZ(), 12, 0.4, 0.6, 0.4, 0.1);
                }
            }
        }
        if (level() instanceof ServerLevel sl) {
            returnStolen(sl);
            if (!def.clearOnDeath.isEmpty()) for (Player p : sl.getEntitiesOfClass(Player.class, getBoundingBox().inflate(48)))
                for (var e : def.clearOnDeath) p.removeEffect(e.get());
        }
        if (level() instanceof ServerLevel level) for (var c : def.deathSummon) for (int i = 0; i < c.count(); i++) summon(level, c.pick(getRandom()), getTarget());
        if (def.wakeRoom > 0 && phase >= (def.phases == null ? 0 : def.phases.length - 1) && level() instanceof ServerLevel level)
            releaseRoom(level);
        super.die(source);
    }

    /** Glory v2: the way out opens only when no other boss of the room is still alive, asleep or not (the Queen outlives
     *  her Amalgam; they share the throne room). Its own minions do not hold the gates: without their leader they run off. */
    private void releaseRoom(ServerLevel level) {
        boolean another = !level.getEntitiesOfClass(ScriptedMonster.class, getBoundingBox().inflate(40),
                s -> s != this && s.isAlive() && s.def.wakeRoom > 0 && !def.name.equals(s.def.leader)).isEmpty();
        if (!another) com.mockingjam.spirecraft.block.GloryGateBlock.setAll(level, blockPosition(), 40, false);
    }

    // ------------------------------------------------------------------------------------------- boss bar, saving
    @Override
    public void startSeenByPlayer(ServerPlayer player) {
        super.startSeenByPlayer(player);
        if (bossBar != null) bossBar.addPlayer(player);
    }

    @Override
    public void stopSeenByPlayer(ServerPlayer player) {
        super.stopSeenByPlayer(player);
        if (bossBar != null) bossBar.removePlayer(player);
    }

    @Override
    public boolean removeWhenFarAway(double distance) {
        return !def.boss && !def.elite && def.leader == null && super.removeWhenFarAway(distance);
    }

    @Override
    protected void addAdditionalSaveData(ValueOutput out) {
        super.addAdditionalSaveData(out);
        out.putInt("Opener", opener);
        out.putInt("Loop", loop);
        // still fresh: worldgen saves a template's entities into the proto-chunk before they ever tick; without State
        // they are set up (asleep, Artifact) on their first tick once the chunk loads, instead of waking up as State 0
        if (!fresh) out.putInt("State", state());
        out.putInt("Ritual", ritual);
        out.putInt("Steam", steam);
        out.putInt("Plating", plating);
        out.putInt("Slippery", slippery);
        out.putInt("Revivals", revivals);
        out.putBoolean("Once", onceUsed);
        out.putInt("Phase", phase);
        out.putInt("StockLeft", stockLeft);
        out.putInt("StockGen", stockGen);
        out.putInt("GrowCount", growCount);
        out.putInt("Curl", curl);
        out.putInt("DownTicks", downTicks);
        out.putBoolean("ReviveFull", reviveFull);
        out.putInt("Hatch", hatch);
        var items = out.list("Stolen", ItemStack.CODEC);
        for (ItemStack item : stolen) if (!item.isEmpty()) items.add(item);
        var stats = out.childrenList("StolenStats");
        stolenStats.forEach((uuid, v) -> {
            var child = stats.addChild();
            child.store("Player", net.minecraft.core.UUIDUtil.CODEC, uuid);
            child.putIntArray("Levels", v);
        });
    }

    @Override
    protected void readAdditionalSaveData(ValueInput in) {
        super.readAdditionalSaveData(in);
        opener = in.getIntOr("Opener", 0);
        loop = in.getIntOr("Loop", 0);
        int st = in.getIntOr("State", -1);
        fresh = st < 0;   // placed by a structure: set up on the first tick
        entityData.set(STATE, Math.max(0, st));
        phase = in.getIntOr("Phase", st < 0 ? 0 : (st >> PHASE_SHIFT) & 3);
        stockLeft = in.getIntOr("StockLeft", -1);
        stockGen = in.getIntOr("StockGen", 0);
        growCount = in.getIntOr("GrowCount", 0);
        curl = in.getIntOr("Curl", def.curlUp);
        downTicks = in.getIntOr("DownTicks", def.reviveTicks);
        reviveFull = in.getBooleanOr("ReviveFull", false);
        hatch = in.getIntOr("Hatch", def.hatchAfter);
        stolen.clear();
        in.listOrEmpty("Stolen", ItemStack.CODEC).forEach(stolen::add);
        stolenStats.clear();
        for (var child : in.childrenListOrEmpty("StolenStats")) {
            var uuid = child.read("Player", net.minecraft.core.UUIDUtil.CODEC);
            var levels = child.getIntArray("Levels");
            if (uuid.isPresent() && levels.isPresent() && levels.get().length == 4) stolenStats.put(uuid.get(), levels.get());
        }
        ritual = in.getIntOr("Ritual", 0);
        steam = in.getIntOr("Steam", 0);
        plating = in.getIntOr("Plating", def.plating);
        slippery = in.getIntOr("Slippery", def.slippery);
        revivals = in.getIntOr("Revivals", 0);
        onceUsed = in.getBooleanOr("Once", false);
        if (bossBar != null && hasCustomName()) bossBar.setName(getDisplayName());
    }

    // ------------------------------------------------------------------------------------------- for the self-test
    public int ritual() {
        return ritual;
    }

    public int steam() {
        return steam;
    }

    public int slippery() {
        return slippery;
    }
}
