package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.registry.ModEntities;
import com.mockingjam.spirecraft.worldgen.ModBiomes;
import net.minecraft.ChatFormatting;
import net.minecraft.core.BlockPos;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.EntitySpawnReason;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;
import net.minecraft.world.item.component.TooltipDisplay;
import net.minecraft.world.level.Level;
import java.util.function.Consumer;

/** Ceremonial Bell: rung in the Overgrowth (or Fog Hollow), it calls the Ceremonial Beast a few blocks ahead. */
public class CeremonialBell extends Item {
    public CeremonialBell(Properties props) {
        super(props);
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        ItemStack stack = player.getItemInHand(hand);
        if (!(level instanceof ServerLevel server)) return InteractionResult.SUCCESS;
        var biome = server.getBiome(player.blockPosition());
        if (!ModBiomes.OVERGROWTHS.stream().anyMatch(biome::is)) {
            player.displayClientMessage(Component.translatable("item.spirecraft.ceremonial_bell.wrong_place"), true);
            return InteractionResult.FAIL;
        }
        if (summon(server, player) == null) return InteractionResult.FAIL;
        stack.consume(1, player);
        return InteractionResult.SUCCESS;
    }

    /** Spawns the boss 6 blocks in front of the player (also used by the self-test). */
    public static CeremonialBeast summon(ServerLevel level, Player player) {
        var look = player.getLookAngle().multiply(1, 0, 1).normalize().scale(6);
        BlockPos at = BlockPos.containing(player.position().add(look));
        at = level.getHeightmapPos(net.minecraft.world.level.levelgen.Heightmap.Types.MOTION_BLOCKING_NO_LEAVES, at);
        CeremonialBeast beast = ModEntities.CEREMONIAL_BEAST.get().spawn(level, at, EntitySpawnReason.TRIGGERED);
        if (beast != null) level.playSound(null, player.blockPosition(), SoundEvents.BELL_BLOCK, SoundSource.PLAYERS, 2.0F, 0.6F);
        return beast;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext context, TooltipDisplay display, Consumer<Component> tooltip, TooltipFlag flag) {
        tooltip.accept(Component.translatable("item.spirecraft.ceremonial_bell.desc").withStyle(ChatFormatting.GRAY));
    }
}
