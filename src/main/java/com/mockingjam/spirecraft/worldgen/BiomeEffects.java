package com.mockingjam.spirecraft.worldgen;

import com.mockingjam.spirecraft.fluid.ModFluids;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.player.Player;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.event.entity.living.LivingEvent;

/**
 * Gameplay effects of the v2 biomes (docs/design/biomes_v2.md):
 * <ul>
 *   <li>Polluted water — wading or swimming in water inside a {@link ModBiomes#POLLUTED_WATER} biome gives Weakness.</li>
 *   <li>Ink — anything in the ink fluid is blinded, slowed and weakened (no damage); right above an ink vent the
 *       bubbling ink scalds ({@link #VENT_DAMAGE} a second) and pushes up (v2.3).</li>
 * </ul>
 * The misty forest's fog is client-side (client/BiomeFog).
 */
public final class BiomeEffects {
    public static final int POLLUTED_WEAKNESS = 120, CHECK_PERIOD = 10;
    public static final int INK_BLINDNESS = 60, INK_SLOWNESS = 40, INK_WEAKNESS = 100;
    public static final float VENT_DAMAGE = 2.0F;

    private BiomeEffects() {}

    public static void register() {
        TickEvent.PlayerTickEvent.Post.BUS.addListener(e -> tick(e.player()));
        LivingEvent.LivingTickEvent.BUS.addListener(e -> { if (!(e.getEntity() instanceof Player)) tick(e.getEntity()); return false; });
    }

    /** Applies the water/ink effects to one entity (server side, every {@link #CHECK_PERIOD} ticks). */
    public static void tick(LivingEntity entity) {
        if (entity.level().isClientSide() || entity.tickCount % CHECK_PERIOD != 0) return;
        if (entity.isInWater() && entity.level().getBiome(entity.blockPosition()).is(ModBiomes.POLLUTED_WATER)) {
            entity.addEffect(new MobEffectInstance(MobEffects.WEAKNESS, POLLUTED_WEAKNESS, 0, false, true, true));
        }
        if (entity.isInFluidType(ModFluids.INK_TYPE.get())) {
            entity.addEffect(new MobEffectInstance(MobEffects.BLINDNESS, INK_BLINDNESS, 0, false, true, true));
            entity.addEffect(new MobEffectInstance(MobEffects.SLOWNESS, INK_SLOWNESS, 1, false, true, true));
            entity.addEffect(new MobEffectInstance(MobEffects.WEAKNESS, INK_WEAKNESS, 0, false, true, true));
            if (entity.tickCount % 20 == 0 && entity.level() instanceof net.minecraft.server.level.ServerLevel server
                    && com.mockingjam.spirecraft.block.InkVentBlock.ventBelow(server, entity.blockPosition(), com.mockingjam.spirecraft.registry.ModBlocks.INK_VENT.get())) {
                entity.hurtServer(server, server.damageSources().hotFloor(), VENT_DAMAGE);
                entity.push(0, 0.25, 0);
            }
        }
    }
}
