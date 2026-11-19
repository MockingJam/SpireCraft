package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.registry.ModEntities;
import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import net.minecraft.core.BlockPos;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.tags.BiomeTags;
import net.minecraft.util.Mth;
import net.minecraft.util.datafix.DataFixTypes;
import net.minecraft.world.entity.EntitySpawnReason;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.levelgen.Heightmap;
import net.minecraft.world.level.saveddata.SavedData;
import net.minecraft.world.level.saveddata.SavedDataType;
import net.minecraftforge.event.TickEvent;

/**
 * Brings the Merchant (SpireMerchant) the way the wandering trader comes (vanilla WanderingTraderSpawner, counted
 * separately): every in-game day a 25% / 50% / 75% chance (rising after each miss, back to 25% after a visit), then
 * one in ten, near a random player in the overworld; he stays two days and leaves. Off with doTraderSpawning.
 */
public final class MerchantSpawner {
    private MerchantSpawner() {}

    static final class Data extends SavedData {
        int spawnDelay = 24000, spawnChance = 25;

        static final Codec<Data> CODEC = RecordCodecBuilder.create(i -> i.group(
                Codec.INT.fieldOf("spawn_delay").forGetter(d -> d.spawnDelay),
                Codec.INT.fieldOf("spawn_chance").forGetter(d -> d.spawnChance)).apply(i, (a, b) -> { Data d = new Data(); d.spawnDelay = a; d.spawnChance = b; return d; }));
        static final SavedDataType<Data> TYPE = new SavedDataType<>("spirecraft_merchant", Data::new, CODEC, DataFixTypes.SAVED_DATA_COMMAND_STORAGE);
    }

    private static int tickDelay = 1200;

    public static void register() {
        TickEvent.LevelTickEvent.Post.BUS.addListener(e -> {
            if (e.level() instanceof ServerLevel level && level.dimension() == Level.OVERWORLD) tick(level);
        });
    }

    private static void tick(ServerLevel level) {
        if (!level.getGameRules().getBoolean(net.minecraft.world.level.GameRules.RULE_DO_TRADER_SPAWNING)) return;
        if (--tickDelay > 0) return;
        tickDelay = 1200;
        Data d = level.getDataStorage().computeIfAbsent(Data.TYPE);
        d.spawnDelay -= 1200;
        d.setDirty();
        if (d.spawnDelay > 0) return;
        d.spawnDelay = 24000;
        int chance = d.spawnChance;
        d.spawnChance = Mth.clamp(d.spawnChance + 25, 25, 75);
        if (level.random.nextInt(100) <= chance && level.random.nextInt(10) == 0 && spawn(level) != null) d.spawnChance = 25;
    }

    /** Spawns the Merchant near a random player (also used by the self-test); null if there was no room. */
    public static SpireMerchant spawn(ServerLevel level) {
        Player player = level.getRandomPlayer();
        if (player == null) return null;
        for (int tries = 0; tries < 10; tries++) {
            int x = player.getBlockX() + level.random.nextInt(97) - 48, z = player.getBlockZ() + level.random.nextInt(97) - 48;
            BlockPos p = level.getHeightmapPos(Heightmap.Types.MOTION_BLOCKING_NO_LEAVES, new BlockPos(x, 0, z));
            if (!level.getFluidState(p.below()).isEmpty() || !level.getBlockState(p.below()).isSolid()) continue;
            if (!level.isEmptyBlock(p) || !level.isEmptyBlock(p.above())) continue;
            if (level.getBiome(p).is(BiomeTags.WITHOUT_WANDERING_TRADER_SPAWNS)) continue;
            SpireMerchant m = ModEntities.MERCHANT.get().spawn(level, p, EntitySpawnReason.EVENT);
            if (m == null) continue;
            m.setDespawnDelay(48000);
            m.setWanderTarget(player.blockPosition());
            m.setHomeTo(player.blockPosition(), 16);
            return m;
        }
        return null;
    }
}
