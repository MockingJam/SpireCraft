package com.mockingjam.spirecraft.item;

import com.mockingjam.spirecraft.mob.ScriptedMonster;
import com.mockingjam.spirecraft.registry.ModItems;
import java.util.function.Consumer;
import net.minecraft.ChatFormatting;
import net.minecraft.core.BlockPos;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.item.ItemEntity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;
import net.minecraft.world.item.component.TooltipDisplay;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.Blocks;

/**
 * Wither Sand (凋零之沙, Glory G4: the Aeonglass's Wither presence). Every sixth attack or item use near an awake
 * Aeonglass drops a grain into the player's inventory, and its Escalate pushes more. Carried, it costs
 * {@link #DRAIN} health every {@link #PERIOD} ticks, more after each Escalate. Thrown away it comes back to the
 * thrower; it can only be poured out (right-click) standing in one of the hourglass light pillars of the Aeonglass's
 * room (a column of end rods). With no Aeonglass within {@link #RANGE} it runs out by itself.
 */
public class WitherSand extends Item {
    public static final int PERIOD = 100, RETURN_TICKS = 100, CHECK = 100;
    public static final float DRAIN = 1.0F, PER_ESCALATE = 0.5F;
    public static final double RANGE = 64;

    public WitherSand(Properties props) {
        super(props);
    }

    public static void give(Player player, int n) {
        if (player.getAbilities().instabuild) return;
        for (int i = 0; i < n; i++) {
            ItemStack s = new ItemStack(ModItems.WITHER_SAND.get());
            if (!player.getInventory().add(s)) player.drop(s, false);
        }
        player.level().playSound(null, player.blockPosition(), SoundEvents.SAND_BREAK, SoundSource.HOSTILE, 1.0F, 0.6F);
    }

    /** The nearest Aeonglass (for its Escalate count), or null. */
    public static ScriptedMonster aeonglass(Level level, Entity near) {
        return level.getEntitiesOfClass(ScriptedMonster.class, near.getBoundingBox().inflate(RANGE), m -> m.isAlive() && m.def.name.equals("aeonglass"))
                .stream().findFirst().orElse(null);
    }

    /** Standing in a light pillar: an end rod within 2 blocks across and from just below the feet to 4 above. */
    public static boolean inPillar(Level level, Player player) {
        BlockPos at = player.blockPosition();
        for (BlockPos p : BlockPos.betweenClosed(at.offset(-2, -1, -2), at.offset(2, 4, 2)))
            if (level.getBlockState(p).is(Blocks.END_ROD)) return true;
        return false;
    }

    @Override
    public void inventoryTick(ItemStack stack, ServerLevel level, Entity entity, EquipmentSlot slot) {
        if (!(entity instanceof Player player) || player.getAbilities().instabuild) return;
        if (player.tickCount % PERIOD != 0 && player.tickCount % CHECK != 0) return;
        ScriptedMonster aeon = aeonglass(level, player);
        if (aeon == null) { stack.setCount(0); return; }   // the hourglass is broken: the sand runs out
        if (player.tickCount % PERIOD == 0)
            player.hurtServer(level, level.damageSources().wither(), (DRAIN + PER_ESCALATE * aeon.growCount) * stack.getCount());
    }

    @Override
    public InteractionResult use(Level level, Player player, InteractionHand hand) {
        ItemStack stack = player.getItemInHand(hand);
        if (!inPillar(level, player)) {
            player.displayClientMessage(Component.translatable("item.spirecraft.wither_sand.pillar"), true);
            return InteractionResult.FAIL;
        }
        if (level instanceof ServerLevel sl) {
            sl.sendParticles(ParticleTypes.ASH, player.getX(), player.getY() + 1, player.getZ(), 20, 0.3, 0.5, 0.3, 0.02);
            sl.playSound(null, player.blockPosition(), SoundEvents.SAND_FALL, SoundSource.PLAYERS, 1.0F, 1.2F);
            stack.shrink(stack.getCount());
        }
        return InteractionResult.SUCCESS;
    }

    @Override
    public boolean onEntityItemUpdate(ItemStack stack, ItemEntity entity) {
        if (entity.level() instanceof ServerLevel level && entity.getAge() >= RETURN_TICKS) {
            if (entity.getOwner() instanceof Player owner && owner.isAlive() && owner.level() == level && aeonglass(level, owner) != null) {
                if (!owner.getInventory().add(stack.copy())) return false;
            }
            entity.discard();
            return true;
        }
        return false;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext ctx, TooltipDisplay display, Consumer<Component> tooltip, TooltipFlag flag) {
        tooltip.accept(Component.translatable("item.spirecraft.wither_sand.desc").withStyle(ChatFormatting.DARK_AQUA));
    }
}
