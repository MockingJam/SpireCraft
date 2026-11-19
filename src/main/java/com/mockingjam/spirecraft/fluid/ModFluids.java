package com.mockingjam.spirecraft.fluid;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.registry.ModBlocks;
import com.mockingjam.spirecraft.registry.ModItems;
import java.util.function.Consumer;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.world.item.BucketItem;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.Items;
import net.minecraft.world.level.block.LiquidBlock;
import net.minecraft.world.level.block.SoundType;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.minecraft.world.level.material.FlowingFluid;
import net.minecraft.world.level.material.Fluid;
import net.minecraft.world.level.material.MapColor;
import net.minecraft.world.level.material.PushReaction;
import net.minecraftforge.client.extensions.common.IClientFluidTypeExtensions;
import net.minecraftforge.common.SoundActions;
import net.minecraftforge.fluids.FluidType;
import net.minecraftforge.fluids.ForgeFlowingFluid;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

/**
 * Ink (墨泉, docs/design/biomes_v2.md): a black-violet fluid that flows like lava — slow ticks, short spread, losing
 * two levels per block — and blinds and slows whatever wades in it (see BiomeEffects). It cannot be swum in and
 * does not put out fire... it is not water. Bucketable.
 */
public final class ModFluids {
    public static final DeferredRegister<FluidType> FLUID_TYPES = DeferredRegister.create(ForgeRegistries.Keys.FLUID_TYPES, SpireCraft.MODID);
    public static final DeferredRegister<Fluid> FLUIDS = DeferredRegister.create(ForgeRegistries.FLUIDS, SpireCraft.MODID);

    public static final int INK_TICK_RATE = 30, INK_SLOPE = 2, INK_DECREASE = 2;

    public static final RegistryObject<FluidType> INK_TYPE = FLUID_TYPES.register("ink", () -> new FluidType(FluidType.Properties.create()
            .descriptionId("block.spirecraft.ink").canSwim(false).canDrown(true).canExtinguish(true).canConvertToSource(false)
            .supportsBoating(false).canHydrate(false).density(3000).viscosity(6000).motionScale(0.0023D).fallDistanceModifier(0.5F)
            .sound(SoundActions.BUCKET_FILL, SoundEvents.BUCKET_FILL_LAVA).sound(SoundActions.BUCKET_EMPTY, SoundEvents.BUCKET_EMPTY_LAVA)) {
        @Override
        public void initializeClient(Consumer<IClientFluidTypeExtensions> consumer) {
            consumer.accept(new IClientFluidTypeExtensions() {
                private final ResourceLocation still = SpireCraft.id("block/ink_still"), flow = SpireCraft.id("block/ink_flow");

                @Override
                public ResourceLocation getStillTexture() {
                    return still;
                }

                @Override
                public ResourceLocation getFlowingTexture() {
                    return flow;
                }
            });
        }
    });

    public static final RegistryObject<FlowingFluid> INK = FLUIDS.register("ink", () -> new ForgeFlowingFluid.Source(props()));
    public static final RegistryObject<FlowingFluid> FLOWING_INK = FLUIDS.register("flowing_ink", () -> new ForgeFlowingFluid.Flowing(props()));

    public static final RegistryObject<LiquidBlock> INK_BLOCK = ModBlocks.registerNoItem("ink", p -> new LiquidBlock(INK, p),
            BlockBehaviour.Properties.of().mapColor(MapColor.COLOR_BLACK).replaceable().noCollision().strength(100.0F)
                    .pushReaction(PushReaction.DESTROY).noLootTable().liquid().sound(SoundType.EMPTY));
    public static final RegistryObject<Item> INK_BUCKET = ModItems.register("ink_bucket", p -> new BucketItem(INK.get(), p),
            () -> new Item.Properties().craftRemainder(Items.BUCKET).stacksTo(1));

    private ModFluids() {}

    private static ForgeFlowingFluid.Properties props() {
        return new ForgeFlowingFluid.Properties(INK_TYPE, INK, FLOWING_INK).bucket(INK_BUCKET).block(INK_BLOCK)
                .tickRate(INK_TICK_RATE).slopeFindDistance(INK_SLOPE).levelDecreasePerBlock(INK_DECREASE).explosionResistance(100.0F);
    }

    /** Called from the mod constructor. Touch the class so the block/item registrations land in their registers. */
    public static void register(net.minecraftforge.eventbus.api.bus.BusGroup modBus) {
        FLUID_TYPES.register(modBus);
        FLUIDS.register(modBus);
    }
}
