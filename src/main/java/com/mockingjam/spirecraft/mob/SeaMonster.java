package com.mockingjam.spirecraft.mob;

import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.ai.control.SmoothSwimmingLookControl;
import net.minecraft.world.entity.ai.control.SmoothSwimmingMoveControl;
import net.minecraft.world.entity.ai.goal.LookAtPlayerGoal;
import net.minecraft.world.entity.ai.goal.RandomSwimmingGoal;
import net.minecraft.world.entity.ai.goal.target.HurtByTargetGoal;
import net.minecraft.world.entity.ai.goal.target.NearestAttackableTargetGoal;
import net.minecraft.world.entity.ai.navigation.PathNavigation;
import net.minecraft.world.entity.ai.navigation.WaterBoundPathNavigation;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.Vec3;

/**
 * Base of the Underdocks sea creatures (user, 2026-11-16: the fish - Terror Eel, Soul Fysh - and the Seapunk live in
 * the sea): they swim like dolphins and fight in the water, cannot walk on land and dry out there (1 damage a second
 * after {@link #DRY_TICKS}), and only hunt players who are in or right by the water.
 */
public abstract class SeaMonster extends SpireMonster {
    public static final int DRY_TICKS = 100;
    private int dry;

    protected SeaMonster(EntityType<? extends Monster> type, Level level) {
        super(type, level);
        moveControl = new SmoothSwimmingMoveControl(this, 85, 10, 0.06F, 0.1F, true);
        lookControl = new SmoothSwimmingLookControl(this, 10);
    }

    @Override
    protected PathNavigation createNavigation(Level level) {
        return new WaterBoundPathNavigation(this, level);
    }

    @Override
    protected void registerGoals() {
        goalSelector.addGoal(2, new ApproachGoal());
        goalSelector.addGoal(6, new RandomSwimmingGoal(this, 1.0, 20));
        goalSelector.addGoal(7, new LookAtPlayerGoal(this, Player.class, 8.0F));
        targetSelector.addGoal(1, new HurtByTargetGoal(this));
        targetSelector.addGoal(2, new NearestAttackableTargetGoal<>(this, Player.class, 10, true, false,
                (target, level) -> target.isInWater() || level.getFluidState(target.blockPosition().below()).isSource()
                        || target.distanceToSqr(this) < 16));
    }

    @Override
    public boolean canBreatheUnderwater() {
        return true;
    }

    @Override
    public boolean isPushedByFluid() {
        return false;
    }

    @Override
    public void travel(Vec3 input) {
        if (isInWater()) {
            moveRelative(getSpeed(), input);
            move(net.minecraft.world.entity.MoverType.SELF, getDeltaMovement());
            setDeltaMovement(getDeltaMovement().scale(0.9));
        } else {
            super.travel(input);
        }
    }

    @Override
    protected void customServerAiStep(ServerLevel level) {
        super.customServerAiStep(level);
        // stranded on land: it dries out
        if (isInWater()) dry = 0;
        else if (++dry > DRY_TICKS && tickCount % 20 == 0) hurtServer(level, damageSources().dryOut(), 1.0F);
    }

    @Override
    protected double chaseSpeed() {
        return 1.2;
    }
}
