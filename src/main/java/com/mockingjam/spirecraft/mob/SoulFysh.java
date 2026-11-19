package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.registry.ModItems;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerBossEvent;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.BossEvent;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.Vec3;

/**
 * Soul Fysh, boss (Underdocks; STS2: Beckon (2 Beckon cards into the deck) → De-Gas 16 → Gaze 7 + 1 Beckon → Fade (2
 * Intangible) → Scream 13 + 3 Vulnerable, repeating). A translucent ghost fish of the polluted sea (a sea creature -
 * it swims). Beckon pushes Beckoning Souls into the player's inventory (item/BeckoningSoul: they drain health until
 * dispelled with hunger); De-Gas breathes a gas cloud ahead; Gaze hurts and adds one more soul; Fade makes it
 * Intangible; Scream hurts everyone around and leaves them Vulnerable. Summoned with Soul Bait.
 */
public class SoulFysh extends SeaMonster {
    public static final int BECKON = 1, DEGAS = 2, GAZE = 3, FADE = 4, SCREAM = 5;
    public static final float MAX_HEALTH = 250, DEGAS_DAMAGE = 7, GAZE_DAMAGE = 3, SCREAM_DAMAGE = 5.5F;
    public static final double DEGAS_RANGE = 6, SCREAM_RADIUS = 16;
    public static final int FADE_TICKS = 80, VULNERABLE_TICKS = 200;
    private static final int[] CYCLE = {BECKON, DEGAS, GAZE, FADE, SCREAM};

    private final ServerBossEvent bossBar = new ServerBossEvent(getDisplayName(), BossEvent.BossBarColor.GREEN, BossEvent.BossBarOverlay.PROGRESS);
    private int step;

    public SoulFysh(EntityType<? extends Monster> type, Level level) {
        super(type, level);
        setPersistenceRequired();
        xpReward = 200;
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, MAX_HEALTH).add(Attributes.ARMOR, 6).add(Attributes.MOVEMENT_SPEED, 1.2)
                .add(Attributes.ATTACK_DAMAGE, DEGAS_DAMAGE).add(Attributes.KNOCKBACK_RESISTANCE, 0.8).add(Attributes.FOLLOW_RANGE, 40);
    }

    @Override
    protected Move nextMove() {
        return move(CYCLE[step++ % CYCLE.length]);
    }

    /** Puts Beckoning Souls into the player's inventory (dropped at their feet if it is full). */
    public static void beckon(Player player, int count) {
        for (int i = 0; i < count; i++) {
            ItemStack soul = new ItemStack(ModItems.BECKONING_SOUL.get());
            if (!player.getInventory().add(soul)) player.drop(soul, false);
        }
    }

    public static Move move(int id) {
        return switch (id) {
            case BECKON -> Move.of(BECKON, 20, 10, 25, 20, (level, self, target) -> {
                if (target instanceof Player p) beckon(p, 2);
                level.playSound(null, self.blockPosition(), SoundEvents.SOUL_ESCAPE.value(), SoundSource.HOSTILE, 2.0F, 0.6F);
                if (target != null) level.sendParticles(ParticleTypes.SOUL, target.getX(), target.getY() + 1, target.getZ(), 20, 0.4, 0.6, 0.4, 0.02);
            });
            case DEGAS -> Move.of(DEGAS, 18, 10, 25, DEGAS_RANGE, (level, self, target) -> {
                Vec3 look = self.getLookAngle();
                for (int i = 1; i <= 6; i++) {
                    Vec3 c = self.getEyePosition().add(look.scale(i));
                    level.sendParticles(ParticleTypes.SNEEZE, c.x, c.y, c.z, 6, 0.4, 0.4, 0.4, 0.02);
                }
                for (LivingEntity e : level.getEntitiesOfClass(LivingEntity.class, self.getBoundingBox().inflate(DEGAS_RANGE), e -> e instanceof Player)) {
                    Vec3 to = e.position().subtract(self.position()).normalize();
                    if (to.dot(look) > 0.4) e.hurtServer(level, self.damageSources().mobAttack(self), DEGAS_DAMAGE);
                }
            });
            case GAZE -> Move.of(GAZE, 14, 8, 25, 20, (level, self, target) -> {
                if (target == null || !self.hasLineOfSight(target)) return;
                target.hurtServer(level, self.damageSources().indirectMagic(self, self), GAZE_DAMAGE);
                if (target instanceof Player p) beckon(p, 1);
            });
            case FADE -> Move.of(FADE, 10, 10, 20, 64, (level, self, target) -> {
                self.addEffect(new net.minecraft.world.effect.MobEffectInstance(ModEffects.holder(ModEffects.INTANGIBLE), FADE_TICKS, 0));
                level.sendParticles(ParticleTypes.SOUL_FIRE_FLAME, self.getX(), self.getY() + 1, self.getZ(), 30, 0.8, 0.8, 0.8, 0.02);
            });
            default -> Move.of(SCREAM, 20, 10, 25, SCREAM_RADIUS, (level, self, target) -> {
                level.playSound(null, self.blockPosition(), SoundEvents.GHAST_SCREAM, SoundSource.HOSTILE, 3.0F, 0.5F);
                for (Player p : level.getEntitiesOfClass(Player.class, self.getBoundingBox().inflate(SCREAM_RADIUS))) {
                    p.hurtServer(level, self.damageSources().mobAttack(self), SCREAM_DAMAGE);
                    self.debuff(p, ModEffects.VULNERABLE, VULNERABLE_TICKS);
                }
            });
        };
    }

    @Override
    protected void customServerAiStep(ServerLevel level) {
        super.customServerAiStep(level);
        bossBar.setProgress(getHealth() / getMaxHealth());
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
