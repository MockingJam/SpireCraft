package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.effect.ModEffects;
import net.minecraft.core.particles.ItemParticleOption;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.Level;
import net.minecraftforge.event.entity.living.LivingDeathEvent;

/**
 * Corpse Slug (Underdocks; STS2: Whip Slap 3×2 → Glomp 8 → Goop 2 Frail, a fixed cycle, each slug of a group starting on
 * a different move; Ravenous: when another creature dies it eats it, is stunned, then gains Strength). A blue sea slug
 * that comes in twos and threes.
 */
public class CorpseSlug extends SpireMonster {
    public static final int WHIP = 1, GLOMP = 2, GOOP = 3, DEVOUR = 4;
    public static final float WHIP_DAMAGE = 1.5F, GLOMP_DAMAGE = 3.0F;
    public static final int FRAIL_TICKS = 120, DEVOUR_TICKS = 40, RAVENOUS_STRENGTH = 2;
    public static final double RAVENOUS_RANGE = 8;
    private int step;

    public CorpseSlug(EntityType<? extends Monster> type, Level level) {
        super(type, level);
        step = level.getRandom().nextInt(3);   // the slugs of a group start on different moves
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, 12).add(Attributes.MOVEMENT_SPEED, 0.18)
                .add(Attributes.ATTACK_DAMAGE, GLOMP_DAMAGE).add(Attributes.FOLLOW_RANGE, 20);
    }

    /** Ravenous: every Corpse Slug near a creature that dies goes to eat it (stunned, then stronger). */
    public static void register() {
        LivingDeathEvent.BUS.addListener(e -> {
            LivingEntity dead = e.getEntity();
            if (!(dead.level() instanceof ServerLevel level) || dead instanceof Player) return false;
            for (CorpseSlug slug : level.getEntitiesOfClass(CorpseSlug.class, dead.getBoundingBox().inflate(RAVENOUS_RANGE))) {
                if (slug != dead && slug.isAlive()) slug.devour(level, dead);
            }
            return false;
        });
    }

    public void devour(ServerLevel level, LivingEntity corpse) {
        getNavigation().moveTo(corpse.getX(), corpse.getY(), corpse.getZ(), 1.2);
        level.sendParticles(new ItemParticleOption(ParticleTypes.ITEM, new ItemStack(Items.ROTTEN_FLESH)), corpse.getX(), corpse.getY() + 0.5,
                corpse.getZ(), 12, 0.3, 0.3, 0.3, 0.1);
        level.playSound(null, blockPosition(), SoundEvents.GENERIC_EAT.value(), SoundSource.HOSTILE, 1.0F, 0.6F);
        startMove(devourMove());
    }

    @Override
    protected Move nextMove() {
        int id = switch (step++ % 3) { case 0 -> WHIP; case 1 -> GLOMP; default -> GOOP; };
        return move(id);
    }

    public static Move devourMove() {
        // stunned while it eats, the Strength comes at the end
        return new Move(DEVOUR, 0, DEVOUR_TICKS, 10, 64, new int[] {DEVOUR_TICKS - 1},
                (level, self, target) -> self.addStrength(RAVENOUS_STRENGTH, 20 * 60 * 20));
    }

    public static Move move(int id) {
        return switch (id) {
            case WHIP -> new Move(WHIP, 12, 12, 25, 2.5, new int[] {0, 6}, (level, self, target) -> self.strike(level, target, WHIP_DAMAGE, 2.5));
            case GLOMP -> Move.of(GLOMP, 16, 6, 25, 2.2, (level, self, target) -> self.strike(level, target, GLOMP_DAMAGE, 2.2));
            default -> Move.of(GOOP, 14, 6, 25, 6, (level, self, target) -> {
                if (target == null) return;
                level.sendParticles(ParticleTypes.ITEM_SLIME, target.getX(), target.getY() + 1, target.getZ(), 15, 0.3, 0.4, 0.3, 0.05);
                self.debuff(target, ModEffects.FRAIL, FRAIL_TICKS);
            });
        };
    }
}
