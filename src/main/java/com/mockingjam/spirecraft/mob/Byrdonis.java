package com.mockingjam.spirecraft.mob;

import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.Vec3;

/**
 * Byrdonis, elite (Overgrowth; STS2: Swoop 17 and Peck 3×3 alternately; Territorial: +1 Strength every turn).
 * A terror bird: a leaping swoop, a triple peck, and +1 Strength after each move (the whole fight).
 */
public class Byrdonis extends SpireMonster {
    public static final int SWOOP = 1, PECK = 2;
    public static final float SWOOP_DAMAGE = 7.0F, PECK_DAMAGE = 1.5F;
    private int step;

    public Byrdonis(EntityType<? extends Monster> type, Level level) {
        super(type, level);
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, 60).add(Attributes.MOVEMENT_SPEED, 0.3)
                .add(Attributes.ATTACK_DAMAGE, SWOOP_DAMAGE).add(Attributes.ARMOR, 4).add(Attributes.KNOCKBACK_RESISTANCE, 0.5)
                .add(Attributes.FOLLOW_RANGE, 24);
    }

    @Override
    protected Move nextMove() {
        return step++ % 2 == 0 ? swoop() : peck();
    }

    public static Move swoop() {
        return new Move(SWOOP, 16, 14, 25, 9, new int[] {0, 8}, (level, self, target) -> {
            if (target == null) return;
            if (self.hitIndex() == 0) {   // leap at the target, strike on landing
                Vec3 to = target.position().subtract(self.position());
                self.setDeltaMovement(to.x * 0.22, 0.6, to.z * 0.22);
                return;
            }
            self.strike(level, target, SWOOP_DAMAGE, 3.0);
            self.addStrength(1, 400);   // Territorial
        });
    }

    public static Move peck() {
        return new Move(PECK, 8, 12, 25, 2.6, new int[] {0, 5, 10}, (level, self, target) -> {
            self.strike(level, target, PECK_DAMAGE, 2.6);
            if (self.hitIndex() == 2) self.addStrength(1, 400);   // Territorial, once per move
        });
    }
}
