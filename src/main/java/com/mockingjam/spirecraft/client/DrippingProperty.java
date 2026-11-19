package com.mockingjam.spirecraft.client;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.registry.ModItems;
import com.mockingjam.spirecraft.weapon.BloodlettingDagger;
import com.mojang.serialization.MapCodec;
import java.lang.reflect.Field;
import java.util.Map;
import java.util.WeakHashMap;
import javax.annotation.Nullable;
import net.minecraft.client.multiplayer.ClientLevel;
import net.minecraft.client.renderer.item.properties.conditional.ConditionalItemModelProperties;
import net.minecraft.client.renderer.item.properties.conditional.ConditionalItemModelProperty;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.util.ExtraCodecs;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemDisplayContext;
import net.minecraft.world.item.ItemStack;

/**
 * Item model condition {@code spirecraft:dripping}: the liquid daggers seep and drip for a moment after each swing;
 * the Bloodletting dagger right after its self-harm (its cooldown has just started). Client-only, nothing is synced.
 */
public record DrippingProperty() implements ConditionalItemModelProperty {
    public static final ResourceLocation ID = SpireCraft.id("dripping");
    public static final MapCodec<DrippingProperty> MAP_CODEC = MapCodec.unit(new DrippingProperty());
    /** How long the drip animation keeps playing after a swing / the self-harm (ticks). */
    public static final int DRIP_TICKS = 12;
    private static final Map<LivingEntity, Long> LAST_SWING = new WeakHashMap<>();

    @Override
    public boolean get(ItemStack stack, @Nullable ClientLevel level, @Nullable LivingEntity holder, int seed, ItemDisplayContext context) {
        if (holder == null) return false;
        if (stack.is(ModItems.BLOODLETTING_DAGGER.get())) {
            return holder instanceof Player player
                    && player.getCooldowns().getCooldownPercent(stack, 0) > 1 - (float) DRIP_TICKS / BloodlettingDagger.COOLDOWN;
        }
        long now = holder.level().getGameTime();
        if (holder.swinging) LAST_SWING.put(holder, now);
        Long last = LAST_SWING.get(holder);
        return last != null && now - last < DRIP_TICKS;
    }

    @Override
    public MapCodec<DrippingProperty> type() {
        return MAP_CODEC;
    }

    /** Vanilla has no registration hook for model properties: add ours to the (private) id mapper. Idempotent. */
    @SuppressWarnings("unchecked")
    public static void register() {
        try {
            for (Field field : ConditionalItemModelProperties.class.getDeclaredFields()) {
                if (!ExtraCodecs.LateBoundIdMapper.class.isAssignableFrom(field.getType())) continue;
                field.setAccessible(true);
                var mapper = (ExtraCodecs.LateBoundIdMapper<ResourceLocation, MapCodec<? extends ConditionalItemModelProperty>>) field.get(null);
                try {
                    mapper.put(ID, MAP_CODEC);
                } catch (IllegalArgumentException alreadyThere) {
                    // registered by an earlier call (client + datagen share the JVM)
                }
                return;
            }
            throw new IllegalStateException("ConditionalItemModelProperties id mapper not found");
        } catch (IllegalAccessException e) {
            throw new IllegalStateException(e);
        }
    }
}
