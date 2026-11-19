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
import net.minecraft.world.level.material.Fluids;
import java.util.function.Consumer;

/** Soul Bait (灵魂鱼饵): used at the water of the polluted sea, it calls the Soul Fysh up out of the deep in front of you. */
public class SoulBait extends Item {
    public SoulBait(Properties props) {
        super(props);
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        ItemStack stack = player.getItemInHand(hand);
        if (!(level instanceof ServerLevel server)) return InteractionResult.SUCCESS;
        if (!server.getBiome(player.blockPosition()).is(ModBiomes.POLLUTED_SEA)) {
            player.displayClientMessage(Component.translatable("item.spirecraft.soul_bait.wrong_place"), true);
            return InteractionResult.FAIL;
        }
        if (summon(server, player) == null) {
            player.displayClientMessage(Component.translatable("item.spirecraft.soul_bait.no_water"), true);
            return InteractionResult.FAIL;
        }
        stack.consume(1, player);
        return InteractionResult.SUCCESS;
    }

    /** Spawns the boss in the water 6 blocks ahead, a few blocks down (also used by the self-test); null without water there. */
    public static SoulFysh summon(ServerLevel level, Player player) {
        var look = player.getLookAngle().multiply(1, 0, 1).normalize().scale(6);
        BlockPos at = BlockPos.containing(player.position().add(look));
        for (int dy = 2; dy >= -6; dy--) {
            BlockPos p = at.offset(0, dy, 0);
            if (level.getFluidState(p).is(Fluids.WATER) && level.getFluidState(p.below()).is(Fluids.WATER)) {
                SoulFysh fysh = ModEntities.SOUL_FYSH.get().spawn(level, p.below(), EntitySpawnReason.TRIGGERED);
                if (fysh != null) level.playSound(null, player.blockPosition(), SoundEvents.ELDER_GUARDIAN_AMBIENT, SoundSource.HOSTILE, 2.0F, 0.6F);
                return fysh;
            }
        }
        return null;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext context, TooltipDisplay display, Consumer<Component> tooltip, TooltipFlag flag) {
        tooltip.accept(Component.translatable("item.spirecraft.soul_bait.desc").withStyle(ChatFormatting.GRAY));
    }
}
