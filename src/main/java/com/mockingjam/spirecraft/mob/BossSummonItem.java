package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.registry.ModEntities;
import java.util.List;
import java.util.function.Consumer;
import net.minecraft.ChatFormatting;
import net.minecraft.core.BlockPos;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.ResourceKey;
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
import net.minecraft.world.level.biome.Biome;
import net.minecraft.world.level.levelgen.Heightmap;

/**
 * A boss's calling token (§11, like the Ceremonial Bell): used in the boss's own biomes, it calls the boss up 6 blocks
 * in front of you; nothing happens elsewhere, or while that boss is already within 64 blocks.
 */
public class BossSummonItem extends Item {
    private final String boss;
    private final List<ResourceKey<Biome>> biomes;

    public BossSummonItem(Properties props, String boss, List<ResourceKey<Biome>> biomes) {
        super(props);
        this.boss = boss;
        this.biomes = biomes;
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        ItemStack stack = player.getItemInHand(hand);
        if (!(level instanceof ServerLevel server)) return InteractionResult.SUCCESS;
        if (biomes.stream().noneMatch(b -> server.getBiome(player.blockPosition()).is(b))) {
            player.displayClientMessage(Component.translatable(getDescriptionId() + ".wrong_place"), true);
            return InteractionResult.FAIL;
        }
        if (summon(server, player) == null) {
            player.displayClientMessage(Component.translatable("item.spirecraft.boss_summon.busy"), true);
            return InteractionResult.FAIL;
        }
        stack.consume(1, player);
        return InteractionResult.SUCCESS;
    }

    /** Calls the boss up in front of the player (also used by the self-test); null if one is already near. */
    public ScriptedMonster summon(ServerLevel level, Player player) {
        var type = ModEntities.SCRIPTED.get(boss).get();
        if (!level.getEntities(type, player.getBoundingBox().inflate(64), e -> e.isAlive()).isEmpty()) return null;
        var look = player.getLookAngle().multiply(1, 0, 1).normalize().scale(6);
        BlockPos at = BlockPos.containing(player.position().add(look));
        // stand it on the ground: the first open spot from a little above the player down to a little below
        BlockPos spot = at.above(3);
        for (int dy = 3; dy >= -6; dy--) {
            BlockPos p = at.offset(0, dy, 0);
            if (level.getBlockState(p).isAir() && !level.getBlockState(p.below()).isAir()) { spot = p; break; }
        }
        if (level.canSeeSky(at) && spot.getY() > at.getY() + 3) spot = level.getHeightmapPos(Heightmap.Types.MOTION_BLOCKING_NO_LEAVES, at);
        ScriptedMonster mob = type.spawn(level, spot, EntitySpawnReason.TRIGGERED);
        if (mob != null) {
            mob.setTarget(player);
            level.playSound(null, player.blockPosition(), SoundEvents.WITHER_SPAWN, SoundSource.HOSTILE, 1.0F, 0.8F);
        }
        return mob;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext context, TooltipDisplay display, Consumer<Component> tooltip, TooltipFlag flag) {
        tooltip.accept(Component.translatable(getDescriptionId() + ".desc").withStyle(ChatFormatting.GRAY));
    }
}
