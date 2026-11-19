package com.mockingjam.spirecraft.item;

import com.mockingjam.spirecraft.registry.ModItems;
import com.mockingjam.spirecraft.registry.ModMaterials;
import java.util.ArrayList;
import java.util.Map;
import java.util.WeakHashMap;
import net.minecraft.core.registries.Registries;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.item.ItemEntity;
import net.minecraft.world.entity.monster.Phantom;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.enchantment.EnchantmentHelper;
import net.minecraft.world.item.enchantment.Enchantments;
import net.minecraftforge.event.entity.living.LivingAttackEvent;
import net.minecraftforge.event.entity.living.LivingDamageEvent;
import net.minecraftforge.event.entity.living.LivingDropsEvent;
import net.minecraftforge.event.entity.living.LivingEvent;
import net.minecraftforge.event.entity.living.LivingExperienceDropEvent;

/** Runtime rules of the phase 3 materials. Design: docs/design/materials.md. Server thread only. */
public final class MaterialEvents {
    public static final int ORICHALCUM_QUIET_TICKS = 160; // 8 s without being attacked
    public static final float GALACTIC_DUST_CHANCE = 0.33F;
    public static final float GALACTIC_DUST_PER_LOOTING = 0.10F;

    private static final EquipmentSlot[] ARMOR_SLOTS = {EquipmentSlot.HEAD, EquipmentSlot.CHEST, EquipmentSlot.LEGS, EquipmentSlot.FEET};
    private static final Map<LivingEntity, Long> LAST_ATTACKED = new WeakHashMap<>();
    private static final Map<LivingEntity, Boolean> DOUBLE_XP = new WeakHashMap<>();

    private MaterialEvents() {}

    public static void register() {
        LivingDamageEvent.BUS.addListener(MaterialEvents::onDamage);
        LivingAttackEvent.BUS.addListener(MaterialEvents::onAttacked);
        LivingEvent.LivingTickEvent.BUS.addListener(MaterialEvents::onLivingTick);
        LivingDropsEvent.BUS.addListener(MaterialEvents::onDrops);
        LivingExperienceDropEvent.BUS.addListener(MaterialEvents::onExperience);
    }

    // ---------------------------------------------------------------- tungsten
    public static int wornPieces(LivingEntity entity, net.minecraft.tags.TagKey<net.minecraft.world.item.Item> tag, boolean skipDormant) {
        int n = 0;
        for (EquipmentSlot slot : ARMOR_SLOTS) {
            ItemStack stack = entity.getItemBySlot(slot);
            if (stack.is(tag) && !(skipDormant && OrichalcumGear.isDormant(stack))) n++;
        }
        return n;
    }

    /** Fires with the HP that is about to be lost (after armor and absorption) — exactly the Tungsten Rod rule. */
    private static void onDamage(LivingDamageEvent event) {
        int pieces = wornPieces(event.getEntity(), ModMaterials.TUNGSTEN_ARMOR, false);
        if (pieces > 0 && event.getAmount() > 0) {
            event.setAmount(Math.max(0, event.getAmount() - pieces * ModMaterials.TUNGSTEN_REDUCTION_PER_PIECE));
        }
        // Tungsten Rod (STS2 relic): "whenever you would lose HP, lose 1 less" — the completed tungsten chain.
        if (event.getAmount() > 0 && event.getEntity() instanceof Player player && RelicItem.carries(player, ModItems.TUNGSTEN_ROD.get())) {
            event.setAmount(Math.max(0, event.getAmount() - TUNGSTEN_ROD_REDUCTION));
        }
    }

    public static final float TUNGSTEN_ROD_REDUCTION = 1.0F;

    // ---------------------------------------------------------------- orichalcum
    private static void onAttacked(LivingAttackEvent event) {
        if (event.getEntity().level() instanceof ServerLevel level && event.getAmount() > 0) {
            LAST_ATTACKED.put(event.getEntity(), level.getGameTime());
        }
    }

    private static void onLivingTick(LivingEvent.LivingTickEvent event) {
        LivingEntity entity = event.getEntity();
        if (!(entity.level() instanceof ServerLevel level) || entity.tickCount % 20 != 0) return;

        // Keep worn orichalcum in sync even for mobs (players also sync through inventoryTick).
        for (EquipmentSlot slot : ARMOR_SLOTS) {
            ItemStack stack = entity.getItemBySlot(slot);
            if (stack.is(ModMaterials.ORICHALCUM_ARMOR)) OrichalcumGear.syncDormancy(stack);
        }

        int pieces = wornPieces(entity, ModMaterials.ORICHALCUM_ARMOR, true);
        if (pieces == 0 || entity.getAbsorptionAmount() > 0) return;
        long quietSince = LAST_ATTACKED.getOrDefault(entity, Long.MIN_VALUE / 2);
        if (level.getGameTime() - quietSince >= ORICHALCUM_QUIET_TICKS) {
            entity.setAbsorptionAmount(pieces); // capped by MAX_ABSORPTION, which each piece raises by 1
        }
    }

    // ---------------------------------------------------------------- lava rock & galactic dust drops
    private static void onDrops(LivingDropsEvent event) {
        LivingEntity dead = event.getEntity();
        if (!(dead.level() instanceof ServerLevel level)) return;

        if (dead.getType().is(ModMaterials.BOSSES) && event.getSource().getEntity() instanceof Player killer && consumeLavaRock(killer)) {
            var copies = new ArrayList<ItemEntity>();
            for (ItemEntity drop : event.getDrops()) {
                copies.add(new ItemEntity(level, drop.getX(), drop.getY(), drop.getZ(), drop.getItem().copy()));
            }
            event.getDrops().addAll(copies);
            DOUBLE_XP.put(dead, Boolean.TRUE);
        }

        if (dead instanceof Phantom) {
            float chance = GALACTIC_DUST_CHANCE;
            if (event.getSource().getEntity() instanceof LivingEntity killer) {
                var looting = level.registryAccess().lookupOrThrow(Registries.ENCHANTMENT).getOrThrow(Enchantments.LOOTING);
                chance += GALACTIC_DUST_PER_LOOTING * EnchantmentHelper.getEnchantmentLevel(looting, killer);
            }
            if (level.random.nextFloat() < chance) {
                event.getDrops().add(new ItemEntity(level, dead.getX(), dead.getY(), dead.getZ(), new ItemStack(ModItems.GALACTIC_DUST.get())));
            }
        }
    }

    /** Removes one Lava Rock from the player's inventory. */
    public static boolean consumeLavaRock(Player player) {
        var inventory = player.getInventory();
        for (int i = 0; i < inventory.getContainerSize(); i++) {
            ItemStack stack = inventory.getItem(i);
            if (stack.is(ModItems.LAVA_ROCK.get())) {
                stack.shrink(1);
                return true;
            }
        }
        return false;
    }

    private static void onExperience(LivingExperienceDropEvent event) {
        if (DOUBLE_XP.remove(event.getEntity()) != null) {
            event.setDroppedExperience(event.getDroppedExperience() * 2);
        }
    }
}
