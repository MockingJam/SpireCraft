package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.registry.ModEntities;
import net.minecraft.core.BlockPos;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.entity.EntitySpawnReason;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.level.biome.Biomes;
import net.minecraftforge.event.entity.living.LivingDeathEvent;

/**
 * The Soul Nexus (Glory v2, 2026-11-26, user: "no fight site for it - it appears in the soul sand valley after you kill
 * some of its creatures"): every skeleton, ghast, enderman or wither skeleton a player kills in a soul sand valley adds
 * to that player's count; at {@link #NEEDED} the souls of the dead gather and a Soul Nexus rises from the soul sand a
 * few blocks away. The count starts over, and none rises while one is already near.
 */
public final class SoulNexusCall {
    public static final int NEEDED = 15, WARN = 10;
    private static final String KEY = "spirecraft_soul_kills";

    private SoulNexusCall() {}

    public static void register() {
        LivingDeathEvent.BUS.addListener(SoulNexusCall::onDeath);
    }

    private static void onDeath(LivingDeathEvent e) {
        if (!(e.getSource().getEntity() instanceof ServerPlayer player) || !(player.level() instanceof ServerLevel level)) return;
        EntityType<?> t = e.getEntity().getType();
        if (t != EntityType.SKELETON && t != EntityType.GHAST && t != EntityType.ENDERMAN && t != EntityType.WITHER_SKELETON) return;
        if (!level.getBiome(e.getEntity().blockPosition()).is(Biomes.SOUL_SAND_VALLEY)) return;
        count(level, player, e.getEntity().blockPosition());
    }

    /** One more soul for this player (public for the self-test); returns the new count, 0 when a Nexus rose. */
    public static int count(ServerLevel level, ServerPlayer player, BlockPos where) {
        var data = player.getPersistentData();
        int n = data.getIntOr(KEY, 0) + 1;
        level.sendParticles(ParticleTypes.SOUL, where.getX() + 0.5, where.getY() + 1, where.getZ() + 0.5, 8, 0.3, 0.5, 0.3, 0.02);
        if (n == WARN) player.displayClientMessage(Component.translatable("entity.spirecraft.soul_nexus.gathering"), true);
        if (n < NEEDED) { data.putInt(KEY, n); return n; }
        var type = ModEntities.SCRIPTED.get("soul_nexus").get();
        if (!level.getEntities(type, player.getBoundingBox().inflate(64), m -> m.isAlive()).isEmpty()) { data.putInt(KEY, NEEDED - 3); return NEEDED - 3; }
        data.putInt(KEY, 0);
        // somewhere 6 to 12 blocks off on the valley floor, else right where the last one fell
        BlockPos at = where;
        var r = level.getRandom();
        for (int i = 0; i < 12; i++) {
            double a = r.nextDouble() * Math.PI * 2, d = 6 + r.nextDouble() * 6;
            BlockPos p = player.blockPosition().offset((int) (Math.cos(a) * d), 0, (int) (Math.sin(a) * d));
            for (int dy = 4; dy >= -6; dy--) {
                BlockPos q = p.above(dy);
                if (level.getBlockState(q).isAir() && level.getBlockState(q.above()).isAir() && level.getBlockState(q.above(2)).isAir() && level.getBlockState(q.below()).isSolid()) { at = q; i = 99; break; }
            }
        }
        var nexus = type.spawn(level, at, EntitySpawnReason.EVENT);
        if (nexus != null) {
            nexus.setTarget(player);
            level.sendParticles(ParticleTypes.SOUL_FIRE_FLAME, at.getX() + 0.5, at.getY() + 1, at.getZ() + 0.5, 60, 0.6, 1.2, 0.6, 0.05);
            level.playSound(null, at, SoundEvents.WITHER_SPAWN, SoundSource.HOSTILE, 0.8F, 1.4F);
            player.displayClientMessage(Component.translatable("entity.spirecraft.soul_nexus.risen"), true);
        }
        return 0;
    }

}
