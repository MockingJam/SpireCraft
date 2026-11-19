package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.weapon.projectile.SpireBolt;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.Level;

/**
 * Fuzzy Wurm Crawler (Overgrowth; STS2: Acid Goop → Inhale (+7 Strength) → Acid Goop, repeating, Strength stacking).
 * A slow crawler that spits acid (2 damage + 2 Poison) and puffs up to gain Strength that lasts until it dies.
 */
public class FuzzyWurmCrawler extends SpireMonster {
    public static final int ACID = 1, INHALE = 2;
    public static final float ACID_DAMAGE = 2.0F;
    public static final int INHALE_STRENGTH = 2;
    private int step;

    public FuzzyWurmCrawler(EntityType<? extends Monster> type, Level level) {
        super(type, level);
    }

    public static AttributeSupplier.Builder attributes() {
        return Monster.createMonsterAttributes().add(Attributes.MAX_HEALTH, 26).add(Attributes.MOVEMENT_SPEED, 0.17)
                .add(Attributes.ATTACK_DAMAGE, ACID_DAMAGE).add(Attributes.FOLLOW_RANGE, 20);
    }

    @Override
    protected Move nextMove() {
        int s = step++ % 3;   // Acid, Inhale, Acid
        return s == 1 ? inhale() : acid();
    }

    public static Move acid() {
        return Move.of(ACID, 14, 6, 30, 10, (level, self, target) ->
                self.lob(level, target, new ItemStack(Items.SLIME_BALL), SpireBolt.Kind.ACID, ACID_DAMAGE, 1.0));   // reared up, lobbed high (v5)
    }

    public static Move inhale() {
        return Move.of(INHALE, 30, 4, 20, 64, (level, self, target) -> self.addStrength(INHALE_STRENGTH, 20 * 60 * 20));
    }
}
