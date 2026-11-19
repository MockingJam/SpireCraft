package com.mockingjam.spirecraft.weapon;

import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;

/**
 * A character weapon with a right-click ability and a cooldown (see {@link Abilities}). Melee stats, if any, come from
 * the item properties; the ability only runs on the server and only starts the cooldown when it actually did something.
 */
public class AbilityWeapon extends SpireWeapon {
    /** Runs the ability; returns whether it was used (and the cooldown should start). */
    @FunctionalInterface
    public interface Ability {
        boolean use(ServerLevel level, Player player, ItemStack stack);
    }

    private final Ability ability;
    private final int cooldown;

    public AbilityWeapon(Properties props, Character character, Ability ability, int cooldown) {
        super(props, character);
        this.ability = ability;
        this.cooldown = cooldown;
    }

    public int cooldown() {
        return cooldown;
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        ItemStack stack = player.getItemInHand(hand);
        if (level instanceof ServerLevel server) {
            if (!ability.use(server, player, stack)) return InteractionResult.FAIL;
            player.getCooldowns().addCooldown(stack, cooldown);
            if (cooldown >= Abilities.DANSE_MIN_COOLDOWN) Abilities.danseMacabre(player);
        }
        return InteractionResult.SUCCESS;
    }
}
