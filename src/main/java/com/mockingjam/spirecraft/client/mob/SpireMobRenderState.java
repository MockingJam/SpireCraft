package com.mockingjam.spirecraft.client.mob;

import net.minecraft.client.renderer.entity.state.LivingEntityRenderState;

/** Render state shared by every SpireCraft mob: the current STS2 move and how long it has been running. */
public class SpireMobRenderState extends LivingEntityRenderState {
    /** Move id from {@code SpireMonster.moveId()} (0 = idle / walking). */
    public int move;
    /** Ticks (with partial tick) since the move started. */
    public float moveAge;
    /** Slime split state. */
    public boolean small;
    /** Osty: sitting, and its attack swing 0..1. */
    public boolean sitting;
    public float attack;
    /** Kaiser Crab: which claws are broken off. */
    public boolean crusherBroken, rocketBroken;
    /** Data-driven monsters: their state bits (ScriptedMonster.ASLEEP / BURROWED / DOWN). */
    public int scriptedState;
}
