package com.mockingjam.spirecraft.weapon.projectile;

import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.registry.ModEntities;
import java.util.function.Consumer;
import javax.annotation.Nullable;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.projectile.ThrowableItemProjectile;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.BlockHitResult;
import net.minecraft.world.phys.EntityHitResult;

/**
 * One projectile type for the small shots of the v2 weapons; it renders as whatever item stack it carries.
 * INK: an inky knife from the Ink Dagger (Blade of Ink) — damage, Blindness and Weak.
 * FIST: the Rocket Punch fist — damage and a strong knockback, flies straight.
 * PEBBLE: a Slingshot stone — damage, ×1.5 against Weak targets (Pinpoint / Tracking).
 * ACID: Fuzzy Wurm Crawler spit — damage and 2 Poison. SPORE: Flyconid spore — damage and Frail.
 * Slingshot ammo (v2.2): FIRE (fire charge) sets the target alight; SNOW (snowball) half damage + Slowness II, ×3 on
 * blazes; SLIME (slime ball) knocks back and slows; IRON (iron nugget) +1/3 damage. All but SNOW keep the Weak bonus.
 */
public class SpireBolt extends ThrowableItemProjectile {
    public enum Kind { INK, FIST, PEBBLE, ACID, SPORE, FIRE, SNOW, SLIME, IRON, WEB, STING, PAGE }

    public static final int INK_BLIND = 40, INK_WEAK = 60;
    public static final double FIST_KNOCKBACK = 1.2;
    public static final float WEAK_BONUS = 1.5F;
    public static final int ACID_POISON = 2, SPORE_FRAIL = 100;
    public static final int FIRE_SECONDS = 5, SNOW_SLOW = 60, SLIME_SLOW = 40;
    public static final float SNOW_RATIO = 0.5F, SNOW_BLAZE = 3.0F, IRON_RATIO = 4.0F / 3.0F;
    public static final double SLIME_KNOCKBACK = 0.9;
    /** Batch 3 (Hive): a silk bowlbug's web (Weak + a moment of Slowness); the Entomancer's stings and the Knowledge Demon's pages are plain hits. */
    public static final int WEB_WEAK = 120, WEB_SLOW = 40;

    private Kind kind = Kind.PEBBLE;
    private float damage;
    /** A scripted monster's move with effects of its own (ScriptedMonster.carry): its bolts skip this kind's default
     *  effect, and the move's last bolt applies the move's effects on impact. Not saved. */
    @Nullable private Consumer<LivingEntity> moveEffects;
    private boolean replaceKindEffect;

    public SpireBolt carry(@Nullable Consumer<LivingEntity> effects, boolean replaceKindEffect) {
        this.moveEffects = effects;
        this.replaceKindEffect = replaceKindEffect;
        return this;
    }

    public SpireBolt(EntityType<? extends SpireBolt> type, Level level) {
        super(type, level);
    }

    public SpireBolt(ServerLevel level, LivingEntity owner, ItemStack look, Kind kind, float damage) {
        super(ModEntities.SPIRE_BOLT.get(), owner, level, look);
        this.kind = kind;
        this.damage = damage;
    }

    @Override
    protected Item getDefaultItem() {
        return Items.COBBLESTONE;
    }

    @Override
    protected double getDefaultGravity() {
        return switch (kind) {
            case FIST, STING, PAGE -> 0.0;
            case WEB -> 0.02;
            case INK -> 0.02;
            case PEBBLE, ACID, SPORE, FIRE, SNOW, SLIME, IRON -> 0.03;
        };
    }

    @Override
    public void tick() {
        super.tick();
        if (!level().isClientSide() && tickCount > 80) discard();
    }

    @Override
    protected void onHitEntity(EntityHitResult result) {
        if (level() instanceof ServerLevel level && result.getEntity() instanceof LivingEntity target && target != getOwner()) {
            hit(level, target);
        }
        discard();
    }

    /** Applies this bolt's effect to a target (also used directly by the self-test). */
    public void hit(ServerLevel level, LivingEntity target) {
        float amount = damage;
        boolean sling = kind == Kind.PEBBLE || kind == Kind.FIRE || kind == Kind.SLIME || kind == Kind.IRON;
        if (sling && (target.hasEffect(ModEffects.holder(ModEffects.WEAK)) || target.hasEffect(MobEffects.WEAKNESS))) amount *= WEAK_BONUS;
        if (kind == Kind.IRON) amount *= IRON_RATIO;
        if (kind == Kind.SNOW) amount *= target instanceof net.minecraft.world.entity.monster.Blaze ? SNOW_BLAZE : SNOW_RATIO;
        target.invulnerableTime = 0;
        target.hurtServer(level, damageSources().thrown(this, getOwner()), amount);
        if (!replaceKindEffect) switch (kind) {
            case INK -> {
                target.addEffect(new MobEffectInstance(MobEffects.BLINDNESS, INK_BLIND, 0), getOwner());
                target.addEffect(new MobEffectInstance(ModEffects.holder(ModEffects.WEAK), INK_WEAK, 0), getOwner());
            }
            case FIST -> target.knockback(FIST_KNOCKBACK, -getDeltaMovement().x, -getDeltaMovement().z);
            case PEBBLE, IRON, STING, PAGE -> { }
            case WEB -> {
                target.addEffect(new MobEffectInstance(ModEffects.holder(ModEffects.WEAK), WEB_WEAK, 0), getOwner());
                target.addEffect(new MobEffectInstance(MobEffects.SLOWNESS, WEB_SLOW, 0), getOwner());
            }
            case FIRE -> target.igniteForSeconds(FIRE_SECONDS);
            case SNOW -> target.addEffect(new MobEffectInstance(MobEffects.SLOWNESS, SNOW_SLOW, 1), getOwner());
            case SLIME -> {
                target.knockback(SLIME_KNOCKBACK, -getDeltaMovement().x, -getDeltaMovement().z);
                target.addEffect(new MobEffectInstance(MobEffects.SLOWNESS, SLIME_SLOW, 0), getOwner());
            }
            case ACID -> ModEffects.addStacks(target, ModEffects.POISON, ACID_POISON, 1200, 30);
            case SPORE -> target.addEffect(new MobEffectInstance(ModEffects.holder(ModEffects.FRAIL), SPORE_FRAIL, 0), getOwner());
        }
        if (moveEffects != null) moveEffects.accept(target);
    }

    @Override
    protected void onHitBlock(BlockHitResult result) {
        discard();
    }
}
