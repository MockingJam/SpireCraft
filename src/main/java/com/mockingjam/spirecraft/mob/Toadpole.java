package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.effect.ModEffects;
import com.mockingjam.spirecraft.weapon.projectile.SpireBolt;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.Level;

/**
 * Toadpole (Underdocks; STS2: Whirl 7 → Spiken +2 Thorns → Spike Spit 3×3, losing 2 Thorns; a fixed cycle). A big
 * teal tadpole that hovers just off the ground (and swims), in pairs: a spinning bump, then it bristles with spines
 * (Thorns), then spits them.
 */
public class Toadpole extends SpireMonster {
    public static final int WHIRL = 1, SPIKEN = 2, SPIT = 3;
    public static final float WHIRL_DAMAGE = 3.0F, SPINE_DAMAGE = 1.0F;
    public static final int THORNS_TICKS = 200;
    private int step;

    public Toadpole(EntityType<? extends Monster> type, Level level) {
        super(type, level);
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, 10).add(Attributes.MOVEMENT_SPEED, 0.22)
                .add(Attributes.ATTACK_DAMAGE, WHIRL_DAMAGE).add(Attributes.FOLLOW_RANGE, 20);
    }

    @Override
    public boolean canBreatheUnderwater() {
        return true;
    }

    @Override
    public boolean causeFallDamage(double distance, float multiplier, net.minecraft.world.damagesource.DamageSource source) {
        return false;   // it hovers
    }

    @Override
    protected Move nextMove() {
        int id = switch (step++ % 3) { case 0 -> WHIRL; case 1 -> SPIKEN; default -> SPIT; };
        return move(id);
    }

    public static Move move(int id) {
        return switch (id) {
            case WHIRL -> Move.of(WHIRL, 12, 10, 25, 2.2, (level, self, target) -> self.strike(level, target, WHIRL_DAMAGE, 2.2));
            case SPIKEN -> Move.of(SPIKEN, 10, 10, 20, 64, (level, self, target) ->
                    com.mockingjam.spirecraft.effect.ModEffects.addStacks(self, ModEffects.THORNS, 1, THORNS_TICKS, 5));
            default -> new Move(SPIT, 14, 14, 30, 10, new int[] {0, 5, 10}, (level, self, target) -> {
                self.shoot(level, target, new ItemStack(Items.PRISMARINE_SHARD), SpireBolt.Kind.PEBBLE, SPINE_DAMAGE, 1.2F);
                if (self.hitIndex() == 2) self.removeEffect(ModEffects.holder(ModEffects.THORNS));   // the spines are spent
            });
        };
    }
}
