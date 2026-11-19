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

    public final ScriptedDefs.Def def;
    private final ServerBossEvent bossBar;
    private int opener, loop, last, moves, slippery, curl, revivals, ritual, steam, plating, downTicks, sleepHits, hatch;
    private boolean skittishUsed, onceUsed;
    private float shellTaken;
    private int shellWindow;
    private final List<ItemStack> stolen = new ArrayList<>();

    public ScriptedMonster(EntityType<? extends Monster> type, Level level, ScriptedDefs.Def def) {
        super(type, level);
        this.def = def;
        this.slippery = def.slippery;
        this.curl = def.curlUp;
        this.plating = def.plating;
        this.bossBar = def.boss ? new ServerBossEvent(getDisplayName(), def.barColor, BossEvent.BossBarOverlay.PROGRESS) : null;
        xpReward = def.boss ? 200 : def.elite ? 30 : 5;
        if (def.boss || def.elite) setPersistenceRequired();
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
    public SpawnGroupData finalizeSpawn(ServerLevelAccessor level, DifficultyInstance difficulty, EntitySpawnReason reason, @Nullable SpawnGroupData data) {
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
        return def.stationary ? 0 : 1.0;
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
        boolean first = hitIndex() == 0, lastHit = hitIndex() == m.hits - 1;
        if (m.sound != null && first) level.playSound(null, blockPosition(), m.sound, SoundSource.HOSTILE, def.boss ? 2.0F : 1.0F, def.pitch);
        if (target != null && m.hits > 1) target.invulnerableTime = 0;
        float dmg = m.damage;
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
            case SHOT -> { if (dmg > 0 || m.effect != null) shoot(level, target, new ItemStack(m.look.get()), m.bolt, dmg, 1.2F); }
            case LOB -> lob(level, target, new ItemStack(m.look.get()), m.bolt, dmg, getBbHeight() * 0.8);
            case AOE -> {
                level.sendParticles(m.particle, getX(), getY() + 0.5, getZ(), 40, m.reach / 2, 0.5, m.reach / 2, 0.02);
                for (Player p : level.getEntitiesOfClass(Player.class, getBoundingBox().inflate(m.reach, 2, m.reach), p -> !p.isSpectator())) {
                    if (dmg > 0) p.hurtServer(level, damageSources().mobAttack(this), dmg);
                    applyEffects(level, m, p);
                }
            }
            case SELF -> { }
        }
        // what goes on the target: once per move, on the last hit (only if it landed, for melee and charges)
        boolean reach = m.kind == ScriptedDefs.Kind.MELEE || m.kind == ScriptedDefs.Kind.DASH ? landed : true;
        if (lastHit && target != null && m.kind != ScriptedDefs.Kind.AOE && m.kind != ScriptedDefs.Kind.SHOT && m.kind != ScriptedDefs.Kind.LOB && reach) applyEffects(level, m, target);
        if (landed && def.suck > 0) addStrength(def.suck, 20 * 60 * 10);   // Suck: stronger with every wound it opens
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
        if (m.summon != null) for (int i = 0; i < m.summonCount; i++) summon(level, m.summon, target);
        if (m.steam > 0) steam += m.steam;
        if (m.burrow) { setState(BURROWED, true); setAbsorptionAmount(m.absorb); }
        if (m.flee) flee(level);
        if (m.explode) { level.sendParticles(ParticleTypes.EXPLOSION, getX(), getY() + 0.5, getZ(), 3, 0.5, 0.3, 0.5, 0); discard(); }
        if (m.wake) setState(ASLEEP, false);
        if (m.hatch) hatchNow(level);
    }

    private void applyEffects(ServerLevel level, ScriptedDefs.MoveDef m, LivingEntity t) {
        if (m.effect != null) t.addEffect(new MobEffectInstance(m.effect.get(), m.effectTicks, m.effectAmp), this);
        if (m.effect2 != null) t.addEffect(new MobEffectInstance(m.effect2.get(), m.effectTicks, 0), this);
        if (m.poison > 0) ModEffects.addStacks(t, ModEffects.POISON, m.poison, 1200, 30);
        if (m.doom > 0) ModEffects.addStacks(t, ModEffects.DOOM, m.doom, 20 * 60, 99);
        if (m.steal > 0 && t instanceof Player p) steal(p, m.steal);
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
    @Override
    protected void customServerAiStep(ServerLevel level) {
        int before = moveId();
        super.customServerAiStep(level);
        if (before != 0 && moveId() == 0) onMoveDone();
        if (bossBar != null) bossBar.setProgress(getHealth() / getMaxHealth());
        if (++shellWindow >= 100) { shellWindow = 0; shellTaken = 0; }
        // asleep: wakes when the target has been close a while (or when hit enough - see hurtServer)
        if ((state() & ASLEEP) != 0 && getTarget() != null && tickCount % 20 == 0 && ++sleepHits > def.sleep * 5) wake(level);
        // knocked down (Illusion / Reattach): back up at full strength after a while
        if ((state() & DOWN) != 0 && --downTicks <= 0) {
            setState(DOWN, false);
            setInvisible(false);
            setHealth(def.reviveHealth > 0 ? def.reviveHealth : getMaxHealth());
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
    }

    @Override
    public boolean hurtServer(ServerLevel level, DamageSource source, float amount) {
        if ((state() & DOWN) != 0) return false;
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
        if (hurt && (state() & ASLEEP) != 0 && ++sleepHits >= def.sleep) wake(level);
        if (hurt && (state() & BURROWED) != 0 && getAbsorptionAmount() <= 0) {        // dug out: dazed
            setState(BURROWED, false);
            startMove(move(0));
        }
        return hurt;
    }

    /** Lethal damage: Illusion / Reattach knock it down instead; the steam giant blows up. */
    @Override
    protected void actuallyHurt(ServerLevel level, DamageSource source, float amount) {
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

    @Override
    public void die(DamageSource source) {
        if (level() instanceof ServerLevel level) for (var c : def.deathSummon) for (int i = 0; i < c.count(); i++) summon(level, c.pick(getRandom()), getTarget());
        super.die(source);
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
        out.putInt("State", state());
        out.putInt("Ritual", ritual);
        out.putInt("Steam", steam);
        out.putInt("Plating", plating);
        out.putInt("Slippery", slippery);
        out.putInt("Revivals", revivals);
        out.putBoolean("Once", onceUsed);
    }

    @Override
    protected void readAdditionalSaveData(ValueInput in) {
        super.readAdditionalSaveData(in);
        opener = in.getIntOr("Opener", 0);
        loop = in.getIntOr("Loop", 0);
        entityData.set(STATE, in.getIntOr("State", 0) & ~DOWN);
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
