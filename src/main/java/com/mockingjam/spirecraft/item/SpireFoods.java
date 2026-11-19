package com.mockingjam.spirecraft.item;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.effect.ModEffects;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.ai.attributes.AttributeModifier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;

/** Food items with STS2 relic effects. Design: docs/design/consumables.md. */
public final class SpireFoods {
    private SpireFoods() {}

    /**
     * Strawberry / Pear / Mango: the first one a player ever eats permanently raises max health (like picking up the relic).
     * The attribute modifier itself (one fixed id per fruit) is the "already eaten" record; FoodEvents copies it on respawn.
     */
    public static class Fruit extends Item {
        private final ResourceLocation bonusId;
        private final double bonus;

        public Fruit(Properties props, String fruit, double bonus) {
            super(props);
            this.bonusId = bonusId(fruit);
            this.bonus = bonus;
        }

        public static ResourceLocation bonusId(String fruit) {
            return SpireCraft.id("fruit_bonus." + fruit);
        }

        @Override
        public ItemStack finishUsingItem(ItemStack stack, Level level, LivingEntity entity) {
            if (!level.isClientSide() && entity instanceof Player player) applyBonus(player);
            return super.finishUsingItem(stack, level, entity);
        }

        /** Returns true when the bonus was granted now (false if this player already had it). */
        public boolean applyBonus(Player player) {
            var maxHealth = player.getAttribute(Attributes.MAX_HEALTH);
            if (maxHealth == null || maxHealth.hasModifier(bonusId)) return false;
            maxHealth.addPermanentModifier(new AttributeModifier(bonusId, bonus, AttributeModifier.Operation.ADD_VALUE));
            player.heal((float) bonus);
            player.displayClientMessage(Component.translatable("message.spirecraft.fruit_bonus", getName(getDefaultInstance()), (int) bonus), true);
            return true;
        }
    }

    /** Meat on the Bone: eaten at or below half health, it heals an extra {@link #EXTRA_HEAL}. */
    public static class MeatOnTheBone extends Item {
        public static final float EXTRA_HEAL = 6.0F;

        public MeatOnTheBone(Properties props) {
            super(props);
        }

        @Override
        public ItemStack finishUsingItem(ItemStack stack, Level level, LivingEntity entity) {
            if (!level.isClientSide() && entity.getHealth() <= entity.getMaxHealth() / 2) entity.heal(EXTRA_HEAL);
            return super.finishUsingItem(stack, level, entity);
        }
    }

    /** Amethyst Aubergine: grants Prosperity (slain mobs drop extra gold nuggets). */
    public static class Aubergine extends Item {
        public static final int PROSPERITY_TICKS = 1200;

        public Aubergine(Properties props) {
            super(props);
        }

        @Override
        public ItemStack finishUsingItem(ItemStack stack, Level level, LivingEntity entity) {
            if (!level.isClientSide()) entity.addEffect(new MobEffectInstance(ModEffects.holder(ModEffects.PROSPERITY), PROSPERITY_TICKS, 0));
            return super.finishUsingItem(stack, level, entity);
        }
    }
}
