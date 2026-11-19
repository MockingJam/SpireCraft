package com.mockingjam.spirecraft.network;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.weapon.Orbs;
import java.util.List;
import net.minecraft.network.RegistryFriendlyByteBuf;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraftforge.network.ChannelBuilder;
import net.minecraftforge.network.NetworkDirection;
import net.minecraftforge.network.PacketDistributor;
import net.minecraftforge.network.SimpleChannel;

/** SpireCraft's packets: the orb queue (server → its player) and the Evoke key (client → server). */
public final class SpireNetwork {
    private SpireNetwork() {}

    /** The player's orbs: (type ordinal, ticks left) pairs, oldest first. */
    public record OrbSync(int slots, int[] orbs) {
        static void encode(OrbSync m, RegistryFriendlyByteBuf buf) {
            buf.writeVarInt(m.slots);
            buf.writeVarIntArray(m.orbs);
        }

        static OrbSync decode(RegistryFriendlyByteBuf buf) {
            return new OrbSync(buf.readVarInt(), buf.readVarIntArray());
        }
    }

    /** The Evoke key was pressed. */
    public record EvokeOrb() {}

    public static final SimpleChannel CHANNEL = ChannelBuilder.named(SpireCraft.id("main")).networkProtocolVersion(1).simpleChannel()
            .messageBuilder(OrbSync.class, NetworkDirection.PLAY_TO_CLIENT)
            .encoder(OrbSync::encode).decoder(OrbSync::decode)
            .consumerMainThread((m, ctx) -> com.mockingjam.spirecraft.client.ClientOrbs.accept(m.slots(), m.orbs()))
            .add()
            .messageBuilder(EvokeOrb.class, NetworkDirection.PLAY_TO_SERVER)
            .encoder((m, buf) -> { }).decoder(buf -> new EvokeOrb())
            .consumerMainThread((m, ctx) -> {
                ServerPlayer player = ctx.getSender();
                if (player != null && player.level() instanceof ServerLevel level) Orbs.evokeFront(level, player);
            })
            .add();

    /** Touch the class during mod construction so the channel exists before any connection. */
    public static void init() {
    }

    public static void syncOrbs(ServerPlayer player, int slots, List<Orbs.Orb> orbs) {
        int[] raw = new int[orbs.size() * 2];
        for (int i = 0; i < orbs.size(); i++) {
            raw[2 * i] = orbs.get(i).type().ordinal();
            raw[2 * i + 1] = orbs.get(i).left();
        }
        CHANNEL.send(new OrbSync(slots, raw), PacketDistributor.PLAYER.with(player));
    }

    public static void evokeOrb() {
        CHANNEL.send(new EvokeOrb(), PacketDistributor.SERVER.noArg());
    }
}
