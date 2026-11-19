package com.mockingjam.spirecraft.item;

import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.Level;

/**
 * Galactic Dust (Regent relic: "for every 10 Stars spent, gain 10 Block").
 * Stars become experience levels, Block becomes absorption: every 4 levels spent give 4 absorption (vanilla Absorption I),
 * at most 12 levels → 12 absorption (Absorption III), for 2 minutes.
 */
public class GalacticDustItem extends Item {
    public static final int LEVELS_PER_TIER = 4;
    public static final int MAX_TIERS = 3;
    public static final int DURATION = 2400;

    public GalacticDustItem(Properties props) {
        super(props);
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        if (!(level instanceof ServerLevel)) return InteractionResult.SUCCESS;
        int tiers = convert(player);
        if (tiers == 0) {
            player.displayClientMessage(Component.translatable("item.spirecraft.galactic_dust.need_levels", LEVELS_PER_TIER), true);
            return InteractionResult.FAIL;
        }
        player.getItemInHand(hand).consume(1, player);
        level.playSound(null, player.blockPosition(), SoundEvents.AMETHYST_BLOCK_CHIME, SoundSource.PLAYERS, 1.0F, 1.4F);
        return InteractionResult.SUCCESS;
    }

    /** Spends levels and grants absorption. Returns the number of tiers granted (0 = nothing happened). */
    public static int convert(Player player) {
        int tiers = player.hasInfiniteMaterials() ? MAX_TIERS : Math.min(MAX_TIERS, player.experienceLevel / LEVELS_PER_TIER);
        if (tiers == 0) return 0;
        if (!player.hasInfiniteMaterials()) player.giveExperienceLevels(-tiers * LEVELS_PER_TIER);
        player.addEffect(new MobEffectInstance(MobEffects.ABSORPTION, DURATION, tiers - 1));
        return tiers;
    }
}
