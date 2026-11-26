package com.mockingjam.spirecraft.effect;

import java.util.ArrayList;
import java.util.Map;
import java.util.UUID;
import java.util.WeakHashMap;
import net.minecraft.world.effect.MobEffectCategory;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.entity.player.Player;
import net.minecraftforge.event.entity.living.LivingEvent;
import net.minecraftforge.event.entity.player.AttackEntityEvent;

/**
 * The Glory effects that need a game rule (docs/design/glory.md §3):
 * <ul>
 *   <li>Hex (Spectral Knight): every buff runs down twice as fast - each second it loses one more second.</li>
 *   <li>Bound (the Queen's Chains of Binding): change what is in your hand and for 1.5 s you can neither strike nor use
 *       it - the new item goes on cooldown and blows are refused.</li>
 * </ul>
 */
public final class GloryEffectEvents {
    private GloryEffectEvents() {}

    public static final int BOUND_LOCK = 30;
    private static final Map<UUID, Integer> LAST_SLOT = new java.util.HashMap<>();
    private static final Map<Player, Integer> LOCKED_UNTIL = new WeakHashMap<>();
    /** Set while Hex rewrites a buff, so the re-added effect is not taken for a new one (Galvanic). */
    public static boolean rewriting;

    public static void register() {
        LivingEvent.LivingTickEvent.BUS.addListener(GloryEffectEvents::onTick);
        // Wound: every stack takes a fifth off any healing
        net.minecraftforge.event.entity.living.LivingHealEvent.BUS.addListener(e -> {
            int stacks = ModEffects.stacks(e.getEntity(), ModEffects.WOUND);
            if (stacks > 0) e.setAmount(e.getAmount() * Math.max(0, 1 - 0.2F * stacks));
        });
        // Wither presence (the Aeonglass, G4): every sixth attack or item use near it adds a grain of Wither Sand
        net.minecraftforge.event.entity.living.LivingEntityUseItemEvent.Start.BUS.addListener((net.minecraftforge.event.entity.living.LivingEntityUseItemEvent.Start e) -> {
            if (e.getEntity() instanceof Player p) witherPresence(p);
            return false;
        });
        AttackEntityEvent.BUS.addListener((AttackEntityEvent e) -> {
            witherPresence(e.getEntity());
            Integer until = LOCKED_UNTIL.get(e.getEntity());
            return until != null && e.getEntity().tickCount < until;   // still bound: the blow does not land
        });
    }

    private static final java.util.Map<java.util.UUID, Integer> PRESENCE = new java.util.HashMap<>();

    /** Counts a player's attacks and item uses near an awake Aeonglass; every sixth one adds a grain of Wither Sand. */
    public static void witherPresence(Player p) {
        if (p.level().isClientSide() || p.getAbilities().instabuild) return;
        var aeon = com.mockingjam.spirecraft.item.WitherSand.aeonglass(p.level(), p);
        if (aeon == null || (aeon.state() & com.mockingjam.spirecraft.mob.ScriptedMonster.ASLEEP) != 0 || aeon.distanceTo(p) > 32) return;
        int n = PRESENCE.merge(p.getUUID(), 1, Integer::sum);
        if (n % 6 == 0) com.mockingjam.spirecraft.item.WitherSand.give(p, 1);
    }

    private static void onTick(LivingEvent.LivingTickEvent e) {
        if (!(e.getEntity() instanceof Player p) || p.level().isClientSide()) return;
        // Bound: watch the selected slot
        if (p.hasEffect(ModEffects.holder(ModEffects.BOUND))) {
            int slot = p.getInventory().getSelectedSlot();
            Integer last = LAST_SLOT.put(p.getUUID(), slot);
            if (last != null && last != slot) {
                LOCKED_UNTIL.put(p, p.tickCount + BOUND_LOCK);
                if (!p.getMainHandItem().isEmpty()) p.getCooldowns().addCooldown(p.getMainHandItem(), BOUND_LOCK);
                p.resetAttackStrengthTicker();
            }
        } else LAST_SLOT.remove(p.getUUID());
        // Hex: one extra second off every buff each second
        if (p.tickCount % 20 == 0 && p.hasEffect(ModEffects.holder(ModEffects.HEX))) {
            for (MobEffectInstance inst : new ArrayList<>(p.getActiveEffects())) {
                if (inst.getEffect().value().getCategory() != MobEffectCategory.BENEFICIAL || inst.isInfiniteDuration() || inst.getDuration() <= 20) continue;
                rewriting = true;
                try {
                    p.removeEffect(inst.getEffect());
                    p.addEffect(new MobEffectInstance(inst.getEffect(), inst.getDuration() - 20, inst.getAmplifier(), inst.isAmbient(), inst.isVisible(), inst.showIcon()));
                } finally {
                    rewriting = false;
                }
            }
        }
    }
}
