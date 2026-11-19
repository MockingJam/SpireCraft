package com.mockingjam.spirecraft.effect;

import java.util.HashMap;
import java.util.Map;
import java.util.WeakHashMap;
import net.minecraft.core.Holder;
import net.minecraft.world.effect.MobEffect;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.entity.LivingEntity;

/**
 * Stack consumption (buffer, artifact, poison decay) is queued and applied at the end of the server tick,
 * because it is usually triggered from inside the entity's own effect or damage processing.
 * Server thread only.
 */
public final class StackChanges {
    private static final Map<LivingEntity, Map<Holder<MobEffect>, Integer>> PENDING = new WeakHashMap<>();
    /** True while we re-apply an effect ourselves, so Artifact does not block it. */
    private static boolean internalApply;

    private StackChanges() {}

    public static void queueDecrement(LivingEntity entity, Holder<MobEffect> effect) {
        PENDING.computeIfAbsent(entity, e -> new HashMap<>()).merge(effect, 1, Integer::sum);
    }

    /** Stacks left after the decrements already queued this tick. */
    public static int availableStacks(LivingEntity entity, Holder<MobEffect> effect) {
        MobEffectInstance instance = entity.getEffect(effect);
        if (instance == null) return 0;
        int pending = PENDING.getOrDefault(entity, Map.of()).getOrDefault(effect, 0);
        return instance.getAmplifier() + 1 - pending;
    }

    public static boolean isInternalApply() {
        return internalApply;
    }

    static void flush() {
        if (PENDING.isEmpty()) return;
        var snapshot = new HashMap<>(PENDING);
        PENDING.clear();
        snapshot.forEach((entity, changes) -> changes.forEach((effect, amount) -> apply(entity, effect, amount)));
    }

    private static void apply(LivingEntity entity, Holder<MobEffect> effect, int amount) {
        MobEffectInstance old = entity.getEffect(effect);
        if (old == null || !entity.isAlive()) return;
        int newAmplifier = old.getAmplifier() - amount;
        entity.removeEffect(effect);
        if (newAmplifier < 0 || old.getDuration() <= 0) return;
        internalApply = true;
        try {
            entity.addEffect(new MobEffectInstance(effect, old.getDuration(), newAmplifier, old.isAmbient(), old.isVisible(), old.showIcon()));
        } finally {
            internalApply = false;
        }
    }
}
