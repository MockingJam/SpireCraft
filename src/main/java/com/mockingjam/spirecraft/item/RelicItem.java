package com.mockingjam.spirecraft.item;

import com.mockingjam.spirecraft.relic.Relics;
import java.util.function.Consumer;
import net.minecraft.ChatFormatting;
import net.minecraft.network.chat.Component;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.TooltipFlag;
import net.minecraft.world.item.component.TooltipDisplay;

/**
 * A relic: a single, unstackable item that works while it sits in a {@link RelicPouchItem relic pouch} carried by
 * the player. Tooltip: STS rarity, then the effect from {@code <item key>.desc}. Design: docs/design/relics.md.
 */
public class RelicItem extends Item {
    /** STS2 relic rarities. */
    public enum Tier {
        STARTER(ChatFormatting.GRAY), COMMON(ChatFormatting.WHITE), UNCOMMON(ChatFormatting.AQUA), RARE(ChatFormatting.GOLD),
        SHOP(ChatFormatting.GREEN), EVENT(ChatFormatting.LIGHT_PURPLE), ANCIENT(ChatFormatting.DARK_PURPLE);

        public final ChatFormatting color;

        Tier(ChatFormatting color) {
            this.color = color;
        }

        public String key() {
            return "relic.spirecraft.tier." + name().toLowerCase(java.util.Locale.ROOT);
        }
    }

    private final Tier tier;

    public RelicItem(Properties props, Tier tier) {
        super(props);
        this.tier = tier;
    }

    public Tier tier() {
        return tier;
    }

    @Override
    public void appendHoverText(ItemStack stack, TooltipContext context, TooltipDisplay display, Consumer<Component> tooltip, TooltipFlag flag) {
        tooltip.accept(Component.translatable(tier.key()).withStyle(tier.color));
        tooltip.accept(Component.translatable(getDescriptionId() + ".desc").withStyle(ChatFormatting.GRAY));
        tooltip.accept(Component.translatable("relic.spirecraft.hint").withStyle(ChatFormatting.DARK_GRAY, ChatFormatting.ITALIC));
    }

    /** True when the relic is active for the player (in a carried relic pouch). */
    public static boolean carries(Player player, Item relic) {
        return Relics.has(player, relic);
    }
}
