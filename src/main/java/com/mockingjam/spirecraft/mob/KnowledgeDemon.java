package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.registry.ModEntities;
import com.mockingjam.spirecraft.weapon.projectile.SpireBolt;
import java.util.List;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Holder;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerBossEvent;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.BossEvent;
import net.minecraft.world.effect.MobEffect;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.EntitySpawnReason;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.storage.ValueInput;
import net.minecraft.world.level.storage.ValueOutput;
import net.minecraft.world.phys.AABB;

/**
 * Knowledge Demon, boss (Hive; docs/design/mobs.md §10). STS2: Curse of Knowledge (each player picks one of two
 * debuffs: Disintegration, or Mind Rot / Sloth / Waste Away) -> Slap 17 -> Knowledge Overwhelming 8x3 -> Ponder (11,
 * heal 30, +2 Strength), repeating; after the third curse it stops cursing. Minecraft: the choice is made by stance -
 * standing when the curse lands gives Disintegration, sneaking gives the other debuff (told on the action bar during
 * the wind-up). Summoned by offering a book at a bug carcass (the one in the fungus shrine).
 */
public class KnowledgeDemon extends SpireMonster {
    public static final int CURSE = 1, SLAP = 2, OVERWHELM = 3, PONDER = 4;
    public static final float MAX_HEALTH = 300, SLAP_DAMAGE = 7, PAGE_DAMAGE = 3.5F, PONDER_DAMAGE = 4.5F, PONDER_HEAL = 15;
    public static final int CURSE_TICKS = 600, CURSES = 3, CURSE_WINDUP = 60;
    public static final double CURSE_RADIUS = 24;
    private static final int[] CYCLE = {CURSE, SLAP, OVERWHELM, PONDER};

    private final ServerBossEvent bossBar = new ServerBossEvent(getDisplayName(), BossEvent.BossBarColor.YELLOW, BossEvent.BossBarOverlay.PROGRESS);
    private int step, curses;

    public KnowledgeDemon(EntityType<? extends Monster> type, Level level) {
        super(type, level);
        setPersistenceRequired();
        xpReward = 200;
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, MAX_HEALTH).add(Attributes.MOVEMENT_SPEED, 0.2)
                .add(Attributes.ATTACK_DAMAGE, SLAP_DAMAGE).add(Attributes.ARMOR, 6).add(Attributes.KNOCKBACK_RESISTANCE, 0.9)
                .add(Attributes.FOLLOW_RANGE, 40);
    }

    public int curses() {
        return curses;
    }

    @Override
    public boolean causeFallDamage(double distance, float multiplier, net.minecraft.world.damagesource.DamageSource source) {
        return false;   // it hovers
    }

    @Override
    protected Move nextMove() {
        int pick;
        do pick = CYCLE[step++ % CYCLE.length]; while (pick == CURSE && curses >= CURSES);
        return move(pick);
    }

    /** The other debuff of curse set {@code n} (0-2): Mind Rot, Sloth, Waste Away. */
    public static Holder<MobEffect> alternative(int n) {
        return n == 0 ? MobEffects.MINING_FATIGUE : n == 1 ? MobEffects.SLOWNESS : MobEffects.WEAKNESS;
    }

    /** Lands curse set {@code n} on one player: Disintegration standing, the other debuff sneaking. */
    public static void curse(Player p, int n, KnowledgeDemon by) {
        if (p.isShiftKeyDown()) p.addEffect(new MobEffectInstance(alternative(n), CURSE_TICKS, n == 1 ? 1 : 0), by);
        else p.addEffect(new MobEffectInstance(ModEffects.holder(ModEffects.DISINTEGRATION), CURSE_TICKS, n), by);
    }

    private List<Player> near(ServerLevel level) {
        return level.getEntitiesOfClass(Player.class, getBoundingBox().inflate(CURSE_RADIUS), p -> !p.isSpectator());
    }

    public static Move move(int id) {
        return switch (id) {
            case CURSE -> new Move(CURSE, CURSE_WINDUP, 10, 20, CURSE_RADIUS, new int[] {0}, (level, self, target) -> {
                KnowledgeDemon d = (KnowledgeDemon) self;
                level.playSound(null, self.blockPosition(), SoundEvents.EVOKER_CAST_SPELL, SoundSource.HOSTILE, 2.0F, 0.5F);
                for (Player p : d.near(level)) {
                    curse(p, Math.min(d.curses, CURSES - 1), d);
                    level.sendParticles(ParticleTypes.ENCHANT, p.getX(), p.getY() + 1.2, p.getZ(), 30, 0.4, 0.6, 0.4, 0.5);
                }
                d.curses++;
            });
            case SLAP -> Move.of(SLAP, 14, 8, 20, 4.5, (level, self, target) -> {
                if (self.strike(level, target, SLAP_DAMAGE, 4.5)) target.knockback(1.2, self.getX() - target.getX(), self.getZ() - target.getZ());
            });
            case OVERWHELM -> new Move(OVERWHELM, 16, 16, 20, 16, new int[] {0, 6, 12}, (level, self, target) -> {
                if (target != null) target.invulnerableTime = 0;
                self.shoot(level, target, new ItemStack(Items.PAPER), SpireBolt.Kind.PAGE, PAGE_DAMAGE, 1.3F);
            });
            default -> Move.of(PONDER, 20, 12, 20, 16, (level, self, target) -> {
                if (target != null && self.hasLineOfSight(target)) target.hurtServer(level, self.damageSources().indirectMagic(self, self), PONDER_DAMAGE);
                self.heal(PONDER_HEAL);
                self.addStrength(1, 20 * 60 * 10);
                level.sendParticles(ParticleTypes.HAPPY_VILLAGER, self.getX(), self.getY() + 2, self.getZ(), 12, 0.6, 0.6, 0.6, 0);
            });
        };
    }

    @Override
    protected void customServerAiStep(ServerLevel level) {
        super.customServerAiStep(level);
        bossBar.setProgress(getHealth() / getMaxHealth());
        // during the curse's wind-up, tell the players their choice
        if (moveId() == CURSE && tickCount % 10 == 0) {
            int n = Math.min(curses, CURSES - 1);
            Component msg = Component.translatable("entity.spirecraft.knowledge_demon.curse", Component.translatable("effect.spirecraft.disintegration"),
                    Component.translatable(alternative(n).value().getDescriptionId()));
            for (Player p : near(level)) p.displayClientMessage(msg, true);
            level.sendParticles(ParticleTypes.ENCHANT, getX(), getY() + 2.5, getZ(), 10, 0.8, 0.8, 0.8, 1.0);
        }
    }

    /** Offering a book at a bug carcass: the demon rises over it (none if one is already within 64 blocks). */
    public static KnowledgeDemon summon(ServerLevel level, BlockPos carcass) {
        if (!level.getEntitiesOfClass(KnowledgeDemon.class, new AABB(carcass).inflate(64)).isEmpty()) return null;
        KnowledgeDemon demon = ModEntities.KNOWLEDGE_DEMON.get().spawn(level, carcass.above(), EntitySpawnReason.TRIGGERED);
        if (demon != null) {
            level.playSound(null, carcass, SoundEvents.ENCHANTMENT_TABLE_USE, SoundSource.HOSTILE, 2.0F, 0.5F);
            level.sendParticles(ParticleTypes.ENCHANT, carcass.getX() + 0.5, carcass.getY() + 1.5, carcass.getZ() + 0.5, 80, 0.8, 1.2, 0.8, 1.0);
        }
        return demon;
    }

    @Override
    protected void addAdditionalSaveData(ValueOutput out) {
        super.addAdditionalSaveData(out);
        out.putInt("Step", step);
        out.putInt("Curses", curses);
    }

    @Override
    protected void readAdditionalSaveData(ValueInput in) {
        super.readAdditionalSaveData(in);
        step = in.getIntOr("Step", 0);
        curses = in.getIntOr("Curses", 0);
        if (hasCustomName()) bossBar.setName(getDisplayName());
    }

    @Override
    public void startSeenByPlayer(ServerPlayer player) {
        super.startSeenByPlayer(player);
        bossBar.addPlayer(player);
    }

    @Override
    public void stopSeenByPlayer(ServerPlayer player) {
        super.stopSeenByPlayer(player);
        bossBar.removePlayer(player);
    }

    @Override
    public boolean removeWhenFarAway(double distance) {
        return false;
    }
}
