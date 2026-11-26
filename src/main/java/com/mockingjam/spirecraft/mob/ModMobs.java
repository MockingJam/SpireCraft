package com.mockingjam.spirecraft.mob;

import static com.mockingjam.spirecraft.registry.ModEntities.*;

import java.util.List;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.SpawnPlacementTypes;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.level.levelgen.Heightmap;
import net.minecraftforge.event.entity.EntityAttributeCreationEvent;
import net.minecraftforge.event.entity.SpawnPlacementRegisterEvent;

/** Attributes and natural-spawn rules of the phase 8 mobs (where they spawn is in the biome JSON, datagen/BiomeData). */
public final class ModMobs {
    private ModMobs() {}

    public static void register() {
        CorpseSlug.register();   // Ravenous
        MerchantSpawner.register();   // the Merchant's visits
        SoulNexusCall.register();     // Glory v2: the Soul Nexus rises after enough kills in the soul sand valley
        EntityAttributeCreationEvent.BUS.addListener(e -> {
            e.put(LEAF_SLIME.get(), SpireSlime.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(TWIG_SLIME.get(), SpireSlime.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(FUZZY_WURM_CRAWLER.get(), FuzzyWurmCrawler.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(FLYCONID.get(), Flyconid.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(NIBBIT.get(), Nibbit.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(SHRINKER_BEETLE.get(), ShrinkerBeetle.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(BYRDONIS.get(), Byrdonis.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(CEREMONIAL_BEAST.get(), CeremonialBeast.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(OSTY.get(), Osty.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(CORPSE_SLUG.get(), CorpseSlug.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(TOADPOLE.get(), Toadpole.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(TWO_TAILED_RAT.get(), TwoTailedRat.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(SEAPUNK.get(), Seapunk.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(TERROR_EEL.get(), TerrorEel.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(SOUL_FYSH.get(), SoulFysh.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(BOWLBUG_ROCK.get(), Bowlbug.attributes(Bowlbug.Kind.ROCK).add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(BOWLBUG_EGG.get(), Bowlbug.attributes(Bowlbug.Kind.EGG).add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(BOWLBUG_SILK.get(), Bowlbug.attributes(Bowlbug.Kind.SILK).add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(BOWLBUG_NECTAR.get(), Bowlbug.attributes(Bowlbug.Kind.NECTAR).add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(EXOSKELETON.get(), Exoskeleton.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(CHOMPER.get(), Chomper.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(MYTE.get(), Myte.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(ENTOMANCER.get(), Entomancer.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(KAISER_CRAB.get(), KaiserCrab.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(KNOWLEDGE_DEMON.get(), KnowledgeDemon.attributes().add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            for (var d : ScriptedDefs.ALL.values())
                e.put(com.mockingjam.spirecraft.registry.ModEntities.SCRIPTED.get(d.name).get(), Monster.createMonsterAttributes()
                        .add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_HEALTH, d.hp).add(net.minecraft.world.entity.ai.attributes.Attributes.MOVEMENT_SPEED, d.speed)
                        .add(net.minecraft.world.entity.ai.attributes.Attributes.ARMOR, d.armor).add(net.minecraft.world.entity.ai.attributes.Attributes.KNOCKBACK_RESISTANCE, d.kb)
                        .add(net.minecraft.world.entity.ai.attributes.Attributes.ATTACK_DAMAGE, 2).add(net.minecraft.world.entity.ai.attributes.Attributes.FOLLOW_RANGE, d.boss ? 40 : 20)
                        // 2026-11-26: vanilla caps absorption at MAX_ABSORPTION (0 by default) - without this every Plating, block
                        // and shield move of the data-driven monsters gave nothing
                        .add(net.minecraft.world.entity.ai.attributes.Attributes.MAX_ABSORPTION, 40).build());
            e.put(com.mockingjam.spirecraft.registry.ModEntities.RHINO_BEETLE.get(), RhinoBeetle.attributes().build());
            e.put(com.mockingjam.spirecraft.registry.ModEntities.MERCHANT.get(), net.minecraft.world.entity.Mob.createMobAttributes()
                    .add(net.minecraft.world.entity.ai.attributes.Attributes.MOVEMENT_SPEED, 0.5).build());
        });
        SpawnPlacementRegisterEvent.BUS.addListener(e -> {
            for (var type : List.<EntityType<? extends Monster>>of(LEAF_SLIME.get(), TWIG_SLIME.get(), FUZZY_WURM_CRAWLER.get(), FLYCONID.get(),
                    NIBBIT.get(), SHRINKER_BEETLE.get(), BYRDONIS.get(), CORPSE_SLUG.get(), TOADPOLE.get(), TWO_TAILED_RAT.get(),
                    BOWLBUG_ROCK.get(), BOWLBUG_EGG.get(), BOWLBUG_SILK.get(), BOWLBUG_NECTAR.get(), EXOSKELETON.get(), CHOMPER.get(), MYTE.get(), ENTOMANCER.get())) {
                register(e, type);
            }
            for (var d : ScriptedDefs.ALL.values()) if (!d.spawns.isEmpty()) register(e, com.mockingjam.spirecraft.registry.ModEntities.SCRIPTED.get(d.name).get());
            // the sea creatures spawn in the water (any light; the elite rarely)
            for (var type : List.<EntityType<? extends Monster>>of(SEAPUNK.get(), TERROR_EEL.get())) water(e, type);
        });
    }

    @SuppressWarnings("unchecked")
    private static <T extends Monster> void water(SpawnPlacementRegisterEvent e, EntityType<?> type) {
        e.register((EntityType<T>) type, SpawnPlacementTypes.IN_WATER, Heightmap.Types.OCEAN_FLOOR,
                (t, level, reason, pos, random) -> level.getFluidState(pos).is(net.minecraft.tags.FluidTags.WATER)
                        && level.getFluidState(pos.above()).is(net.minecraft.tags.FluidTags.WATER)
                        && level.getDifficulty() != net.minecraft.world.Difficulty.PEACEFUL,
                SpawnPlacementRegisterEvent.Operation.REPLACE);
    }

    @SuppressWarnings("unchecked")
    private static <T extends Monster> void register(SpawnPlacementRegisterEvent e, EntityType<?> type) {
        e.register((EntityType<T>) type, SpawnPlacementTypes.ON_GROUND, Heightmap.Types.MOTION_BLOCKING_NO_LEAVES, Monster::checkMonsterSpawnRules,
                SpawnPlacementRegisterEvent.Operation.REPLACE);
    }
}
