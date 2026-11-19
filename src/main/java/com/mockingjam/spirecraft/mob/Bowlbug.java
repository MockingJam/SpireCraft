package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.weapon.projectile.SpireBolt;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.storage.ValueInput;
import net.minecraft.world.level.storage.ValueOutput;

/**
 * Bowlbugs (Hive; docs/design/mobs.md §10): round bugs carrying a load on their back. One class, four kinds:
 * <ul>
 * <li>Rock - Headbutt every turn; Imbalanced: a headbutt stopped by a shield stuns it (STS2: fully blocked).</li>
 * <li>Egg - Bite and gain Block (here: a bite and a little absorption).</li>
 * <li>Silk - Spin Web (Weak) and Thrash, alternating.</li>
 * <li>Nectar - Thrash, then one Buff (big Strength), then Thrash for good.</li>
 * </ul>
 */
public class Bowlbug extends SpireMonster {
    public enum Kind { ROCK, EGG, SILK, NECTAR }

    public static final int HEADBUTT = 1, DIZZY = 2, BITE = 3, SPIN_WEB = 4, THRASH = 5, BUFF = 6;
    public static final float HEADBUTT_DAMAGE = 6, BITE_DAMAGE = 3, THRASH_DAMAGE = 1.5F;
    public static final int BITE_ABSORB = 3, WEAK_TICKS = 120, DIZZY_TICKS = 60, NECTAR_STRENGTH = 3;

    private final Kind kind;
    private boolean web, buffed;
    private int thrashes;

    public Bowlbug(EntityType<? extends Monster> type, Level level, Kind kind) {
        super(type, level);
        this.kind = kind;
    }

    public Kind kind() {
        return kind;
    }

    public static AttributeSupplier.Builder attributes(Kind kind) {
        double hp = switch (kind) { case ROCK -> 20; case EGG -> 10; case SILK -> 19; case NECTAR -> 16; };
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, hp).add(Attributes.MOVEMENT_SPEED, kind == Kind.ROCK ? 0.23 : 0.26)
                .add(Attributes.ATTACK_DAMAGE, 3).add(Attributes.FOLLOW_RANGE, 20).add(Attributes.ARMOR, kind == Kind.ROCK ? 4 : 0)
                .add(Attributes.KNOCKBACK_RESISTANCE, kind == Kind.ROCK ? 0.5 : 0);
    }

    @Override
    protected Move nextMove() {
        return switch (kind) {
            case ROCK -> move(HEADBUTT);
            case EGG -> move(BITE);
            case SILK -> { web = !web; yield move(web ? SPIN_WEB : THRASH); }
            case NECTAR -> {
                if (!buffed && thrashes >= 1) { buffed = true; yield move(BUFF); }
                thrashes++;
                yield move(THRASH);
            }
        };
    }

    public static Move move(int id) {
        return switch (id) {
            case HEADBUTT -> Move.of(HEADBUTT, 16, 6, 20, 2.2, (level, self, target) -> {
                if (self.strike(level, target, HEADBUTT_DAMAGE, 2.2)) target.knockback(0.8, self.getX() - target.getX(), self.getZ() - target.getZ());
            });
            case DIZZY -> Move.of(DIZZY, 0, DIZZY_TICKS, 10, 64, (level, self, target) -> { });
            case BITE -> Move.of(BITE, 10, 6, 20, 2.0, (level, self, target) -> {
                self.strike(level, target, BITE_DAMAGE, 2.0);
                self.setAbsorptionAmount(Math.max(self.getAbsorptionAmount(), BITE_ABSORB));
            });
            case SPIN_WEB -> Move.of(SPIN_WEB, 14, 6, 20, 10, (level, self, target) ->
                    self.shoot(level, target, new ItemStack(Items.COBWEB), SpireBolt.Kind.WEB, 0.5F, 1.0F));
            case THRASH -> new Move(THRASH, 10, 10, 20, 2.0, new int[] {0, 5}, (level, self, target) -> self.strike(level, target, THRASH_DAMAGE, 2.0));
            default -> Move.of(BUFF, 20, 10, 15, 64, (level, self, target) -> {
                level.playSound(null, self.blockPosition(), SoundEvents.HONEY_DRINK.value(), SoundSource.HOSTILE, 1.0F, 0.8F);
                level.sendParticles(ParticleTypes.FALLING_HONEY, self.getX(), self.getY() + 0.8, self.getZ(), 10, 0.3, 0.2, 0.3, 0);
                self.addStrength(NECTAR_STRENGTH, 20 * 60 * 30);
            });
        };
    }

    /** Imbalanced: a rock bowlbug whose headbutt is stopped by a shield reels for a few seconds. */
    @Override
    protected void blockedByItem(LivingEntity blocker) {
        super.blockedByItem(blocker);
        if (kind == Kind.ROCK && level() instanceof ServerLevel level && moveId() == HEADBUTT) dizzy(level);
    }

    public void dizzy(ServerLevel level) {
        startMove(move(DIZZY));
        level.playSound(null, blockPosition(), SoundEvents.SHIELD_BLOCK.value(), SoundSource.HOSTILE, 1.0F, 0.7F);
        level.sendParticles(ParticleTypes.CRIT, getX(), getY() + 1.0, getZ(), 12, 0.3, 0.2, 0.3, 0.1);
        addEffect(new MobEffectInstance(MobEffects.SLOWNESS, DIZZY_TICKS, 3));
    }

    @Override
    protected void addAdditionalSaveData(ValueOutput out) {
        super.addAdditionalSaveData(out);
        out.putBoolean("Buffed", buffed);
        out.putInt("Thrashes", thrashes);
    }

    @Override
    protected void readAdditionalSaveData(ValueInput in) {
        super.readAdditionalSaveData(in);
        buffed = in.getBooleanOr("Buffed", false);
        thrashes = in.getIntOr("Thrashes", 0);
    }
}
