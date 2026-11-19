package com.mockingjam.spirecraft.mob;

import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.LivingEntity;

/**
 * One STS2 intent as a Minecraft move: telegraphed for {@code windup} ticks, then {@code action} runs at each of
 * {@code hitTicks} (relative to the end of the windup), the move lasts {@code duration} ticks after the windup and is
 * followed by {@code cooldown} ticks of rest. {@code range} is how close the monster must be to start it (≥ 32 means
 * anywhere, no line of sight needed — used for self buffs). {@code id} is synced to clients for the animation.
 */
public record Move(int id, int windup, int duration, int cooldown, double range, int[] hitTicks, Action action) {
    @FunctionalInterface
    public interface Action {
        void act(ServerLevel level, SpireMonster self, LivingEntity target);
    }

    public static Move of(int id, int windup, int duration, int cooldown, double range, Action action) {
        return new Move(id, windup, duration, cooldown, range, new int[] {0}, action);
    }
}
