package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.weapon.projectile.SpireBolt;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.storage.ValueInput;
import net.minecraft.world.level.storage.ValueOutput;

/**
 * Myte (Hive; STS2 "Mass of Mytes": always two, Toxic Cornucopia (2 Toxic cards) -> Bite 13 -> Suck 4 + 2 Strength,
 * one opening on Toxic, the other on Suck). A spiny orange mite on long legs: spits poison, bites, then sucks blood
 * (a small hit that heals it and makes it stronger).
 */
public class Myte extends SpireMonster {
    public static final int TOXIC = 1, BITE = 2, SUCK = 3;
    public static final float BITE_DAMAGE = 5, SUCK_DAMAGE = 2, SUCK_HEAL = 2;
    private int step = -1;

    public Myte(EntityType<? extends Monster> type, Level level) {
        super(type, level);
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, 29).add(Attributes.MOVEMENT_SPEED, 0.27)
                .add(Attributes.ATTACK_DAMAGE, BITE_DAMAGE).add(Attributes.ARMOR, 2).add(Attributes.FOLLOW_RANGE, 20);
    }

    @Override
    protected Move nextMove() {
        if (step < 0) step = getRandom().nextBoolean() ? 0 : 2;   // a pair opens on Toxic or on Suck
        int pick = 1 + step;
        step = (step + 1) % 3;
        return move(pick);
    }

    public static Move move(int id) {
        return switch (id) {
            case TOXIC -> Move.of(TOXIC, 14, 6, 20, 10, (level, self, target) ->
                    self.lob(level, target, new ItemStack(Items.SLIME_BALL), SpireBolt.Kind.ACID, 0.5F, 0.8));
            case BITE -> Move.of(BITE, 14, 6, 20, 2.2, (level, self, target) -> self.strike(level, target, BITE_DAMAGE, 2.2));
            default -> Move.of(SUCK, 10, 12, 20, 2.2, (level, self, target) -> {
                if (self.strike(level, target, SUCK_DAMAGE, 2.2)) self.heal(SUCK_HEAL);
                self.addStrength(1, 20 * 60 * 10);
            });
        };
    }

    @Override
    protected void addAdditionalSaveData(ValueOutput out) {
        super.addAdditionalSaveData(out);
        out.putInt("Step", step);
    }

    @Override
    protected void readAdditionalSaveData(ValueInput in) {
        super.readAdditionalSaveData(in);
        step = in.getIntOr("Step", -1);
    }
}
