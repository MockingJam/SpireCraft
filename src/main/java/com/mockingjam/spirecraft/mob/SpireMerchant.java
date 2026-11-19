package com.mockingjam.spirecraft.mob;

import com.mockingjam.spirecraft.alchemy.ModPotions;
import com.mockingjam.spirecraft.registry.ModItems;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import net.minecraft.util.RandomSource;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.npc.WanderingTrader;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.item.alchemy.PotionContents;
import net.minecraft.world.item.trading.ItemCost;
import net.minecraft.world.item.trading.MerchantOffer;
import net.minecraft.world.item.trading.MerchantOffers;
import net.minecraft.world.level.Level;
import net.minecraftforge.registries.RegistryObject;

/**
 * The Merchant (STS2 The Merchant, docs/design/structures.md §3): comes and goes like the wandering trader
 * (MerchantSpawner), and sells a random spread of the Spire's goods for emeralds - potions, one or two relics and some
 * materials. Every offer has a few uses and is never restocked: new goods come with the next visit.
 * <p>
 * He sits on his rug (no wandering, the rug keeps its heading) and only turns his head. Once per visit he also takes a
 * curse off an item (STS2's card removal: one per Merchant): sneak + right-click him holding a cursed item, 10 emeralds.
 */
public class SpireMerchant extends WanderingTrader {
    public static final int PURGE_PRICE = 10;
    private boolean purged;

    public SpireMerchant(EntityType<? extends WanderingTrader> type, Level level) {
        super(type, level);
    }

    @Override
    protected void registerGoals() {
        goalSelector.addGoal(0, new net.minecraft.world.entity.ai.goal.FloatGoal(this));
        goalSelector.addGoal(1, new net.minecraft.world.entity.ai.goal.TradeWithPlayerGoal(this));
        goalSelector.addGoal(1, new net.minecraft.world.entity.ai.goal.LookAtTradingPlayerGoal(this));
        goalSelector.addGoal(2, new net.minecraft.world.entity.ai.goal.LookAtPlayerGoal(this, net.minecraft.world.entity.player.Player.class, 8.0F));
        goalSelector.addGoal(3, new net.minecraft.world.entity.ai.goal.RandomLookAroundGoal(this));
    }

    /** The body (and the rug) keeps its heading; only the head turns. */
    @Override
    protected net.minecraft.world.entity.ai.control.BodyRotationControl createBodyControl() {
        return new net.minecraft.world.entity.ai.control.BodyRotationControl(this) {
            @Override
            public void clientTick() {
            }
        };
    }

    @Override
    public boolean isPushable() {
        return false;
    }

    @Override
    public net.minecraft.world.InteractionResult mobInteract(net.minecraft.world.entity.player.Player player, net.minecraft.world.InteractionHand hand) {
        ItemStack held = player.getItemInHand(hand);
        if (isAlive() && !isTrading() && cursed(held)) {
            if (player.isSecondaryUseActive()) {
                if (!level().isClientSide()) purge(player, held);
                return net.minecraft.world.InteractionResult.SUCCESS;
            }
            if (!level().isClientSide() && !purged)
                player.displayClientMessage(net.minecraft.network.chat.Component.translatable("spirecraft.merchant.purge_hint", PURGE_PRICE), true);
        }
        return super.mobInteract(player, hand);
    }

    public static boolean cursed(ItemStack stack) {
        return net.minecraft.world.item.enchantment.EnchantmentHelper.getEnchantmentsForCrafting(stack).keySet().stream()
                .anyMatch(h -> h.is(net.minecraft.tags.EnchantmentTags.CURSE));
    }

    /** Takes one curse off the item, for {@link #PURGE_PRICE} emeralds, once per visit. Returns whether it did. */
    public boolean purge(net.minecraft.world.entity.player.Player player, ItemStack stack) {
        var msg = (java.util.function.Function<String, net.minecraft.network.chat.Component>) k -> net.minecraft.network.chat.Component.translatable(k, PURGE_PRICE);
        if (purged) { player.displayClientMessage(msg.apply("spirecraft.merchant.purge_used"), true); return false; }
        boolean free = player.getAbilities().instabuild;
        var inv = player.getInventory();
        if (!free && net.minecraft.world.ContainerHelper.clearOrCountMatchingItems(inv, i -> i.is(Items.EMERALD), PURGE_PRICE, true) < PURGE_PRICE) {
            player.displayClientMessage(msg.apply("spirecraft.merchant.purge_poor"), true);
            return false;
        }
        var curse = net.minecraft.world.item.enchantment.EnchantmentHelper.getEnchantmentsForCrafting(stack).keySet().stream()
                .filter(h -> h.is(net.minecraft.tags.EnchantmentTags.CURSE)).findFirst();
        if (curse.isEmpty()) return false;
        if (!free) net.minecraft.world.ContainerHelper.clearOrCountMatchingItems(inv, i -> i.is(Items.EMERALD), PURGE_PRICE, false);
        net.minecraft.world.item.enchantment.EnchantmentHelper.updateEnchantments(stack, m -> m.removeIf(h -> h.equals(curse.get())));
        purged = true;
        playSound(net.minecraft.sounds.SoundEvents.GRINDSTONE_USE, 1.0F, 1.0F);
        playSound(net.minecraft.sounds.SoundEvents.WANDERING_TRADER_YES, 1.0F, 1.0F);
        player.displayClientMessage(net.minecraft.network.chat.Component.translatable("spirecraft.merchant.purged", curse.get().value().description()), true);
        return true;
    }

    @Override
    protected void addAdditionalSaveData(net.minecraft.world.level.storage.ValueOutput out) {
        super.addAdditionalSaveData(out);
        out.putBoolean("Purged", purged);
    }

    @Override
    protected void readAdditionalSaveData(net.minecraft.world.level.storage.ValueInput in) {
        super.readAdditionalSaveData(in);
        purged = in.getBooleanOr("Purged", false);
    }

    private static final List<RegistryObject<net.minecraft.world.item.alchemy.Potion>> POTIONS = List.of(ModPotions.STRENGTH, ModPotions.DEXTERITY,
            ModPotions.BLOCK, ModPotions.LIQUID_BRONZE, ModPotions.LUCKY_TONIC, ModPotions.BLOOD, ModPotions.FLEX, ModPotions.WEAK,
            ModPotions.VULNERABLE, ModPotions.POISON, ModPotions.FYSH_OIL, ModPotions.LONG_STRENGTH, ModPotions.LONG_DEXTERITY);
    private static final List<RegistryObject<Item>> COMMON_RELICS = List.of(ModItems.ANCHOR, ModItems.VAJRA, ModItems.ODDLY_SMOOTH_STONE,
            ModItems.BAG_OF_MARBLES, ModItems.RED_MASK, ModItems.BRONZE_SCALES, ModItems.BLOOD_VIAL, ModItems.RED_SKULL);
    private static final List<RegistryObject<Item>> UNCOMMON_RELICS = List.of(ModItems.PEN_NIB, ModItems.MERCURY_HOURGLASS);
    private static final List<RegistryObject<Item>> RARE_RELICS = List.of(ModItems.TUNGSTEN_ROD, ModItems.SHURIKEN, ModItems.LIZARD_TAIL);

    private static MerchantOffer sell(int emeralds, ItemStack result, int uses) {
        return new MerchantOffer(new ItemCost(Items.EMERALD, emeralds), Optional.empty(), result, uses, 1, 0.05F);
    }

    private static <T> List<T> pick(List<T> from, int n, RandomSource r) {
        List<T> copy = new ArrayList<>(from), out = new ArrayList<>();
        for (int i = 0; i < n && !copy.isEmpty(); i++) out.add(copy.remove(r.nextInt(copy.size())));
        return out;
    }

    /** One visit's stock (static so the self-test can check it). */
    public static MerchantOffers stock(RandomSource r) {
        MerchantOffers offers = new MerchantOffers();
        for (var potion : pick(POTIONS, 3 + r.nextInt(3), r))
            offers.add(sell(4 + r.nextInt(5), PotionContents.createItemStack(Items.POTION, ModPotions.holder(potion)), 2));
        // relics: one common for sure, sometimes an uncommon, rarely a rare
        offers.add(sell(12 + r.nextInt(7), new ItemStack(COMMON_RELICS.get(r.nextInt(COMMON_RELICS.size())).get()), 1));
        if (r.nextInt(2) == 0) offers.add(sell(20 + r.nextInt(9), new ItemStack(UNCOMMON_RELICS.get(r.nextInt(UNCOMMON_RELICS.size())).get()), 1));
        if (r.nextInt(5) == 0) offers.add(sell(30 + r.nextInt(11), new ItemStack(RARE_RELICS.get(r.nextInt(RARE_RELICS.size())).get()), 1));
        // materials
        List<MerchantOffer> mats = List.of(
                sell(3, new ItemStack(ModItems.BRIMSTONE.get(), 2), 4),
                sell(5, new ItemStack(ModItems.GALACTIC_DUST.get(), 1), 3),
                sell(6, new ItemStack(ModItems.TUNGSTEN_INGOT.get(), 1), 3),
                sell(6, new ItemStack(ModItems.ORICHALCUM_INGOT.get(), 1), 3),
                sell(2, new ItemStack(ModItems.STRAWBERRY.get(), 3), 4),
                sell(4, new ItemStack(ModItems.MEAT_ON_THE_BONE.get(), 1), 2));
        offers.addAll(pick(mats, 2 + r.nextInt(2), r));
        return offers;
    }

    @Override
    protected void updateTrades() {
        getOffers().addAll(stock(getRandom()));
    }
}
