package com.mockingjam.spirecraft.registry;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.mob.Byrdonis;
import com.mockingjam.spirecraft.mob.CeremonialBeast;
import com.mockingjam.spirecraft.mob.Flyconid;
import com.mockingjam.spirecraft.mob.FuzzyWurmCrawler;
import com.mockingjam.spirecraft.mob.Nibbit;
import com.mockingjam.spirecraft.mob.Osty;
import com.mockingjam.spirecraft.mob.ShrinkerBeetle;
import com.mockingjam.spirecraft.mob.SpireSlime;
import com.mockingjam.spirecraft.mob.CorpseSlug;
import com.mockingjam.spirecraft.mob.Toadpole;
import com.mockingjam.spirecraft.mob.TwoTailedRat;
import com.mockingjam.spirecraft.mob.Seapunk;
import com.mockingjam.spirecraft.mob.TerrorEel;
import com.mockingjam.spirecraft.mob.SoulFysh;
import com.mockingjam.spirecraft.weapon.projectile.FlakPellet;
import com.mockingjam.spirecraft.weapon.projectile.PoisonFlask;
import com.mockingjam.spirecraft.weapon.projectile.ShivProjectile;
import com.mockingjam.spirecraft.weapon.projectile.SpireBolt;
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.ResourceKey;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.MobCategory;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.RegistryObject;

/** Projectile entities of the phase 6 weapons. All render as their item (like snowballs). */
public final class ModEntities {
    public static final DeferredRegister<EntityType<?>> ENTITY_TYPES = DeferredRegister.create(Registries.ENTITY_TYPE, SpireCraft.MODID);

    public static final RegistryObject<EntityType<ShivProjectile>> SHIV = projectile("shiv", ShivProjectile::new, 0.25F);
    public static final RegistryObject<EntityType<PoisonFlask>> POISON_FLASK = projectile("poison_flask", PoisonFlask::new, 0.25F);
    public static final RegistryObject<EntityType<FlakPellet>> FLAK_PELLET = projectile("flak_pellet", FlakPellet::new, 0.2F);
    public static final RegistryObject<EntityType<SpireBolt>> SPIRE_BOLT = projectile("spire_bolt", SpireBolt::new, 0.3F);
    /** A Lightning orb's homing strike (particles only). */
    public static final RegistryObject<EntityType<com.mockingjam.spirecraft.weapon.projectile.OrbWisp>> ORB_WISP = ENTITY_TYPES.register("orb_wisp",
            () -> EntityType.Builder.<com.mockingjam.spirecraft.weapon.projectile.OrbWisp>of(com.mockingjam.spirecraft.weapon.projectile.OrbWisp::new, MobCategory.MISC)
                    .noLootTable().noSave().sized(0.4F, 0.4F).clientTrackingRange(8).updateInterval(1)
                    .build(ResourceKey.create(Registries.ENTITY_TYPE, SpireCraft.id("orb_wisp"))));

    // ---- Phase 8 mobs, batch 1 (docs/design/mobs.md): Overgrowth ----
    public static final RegistryObject<EntityType<SpireSlime>> LEAF_SLIME = mob("leaf_slime", (t, l) -> new SpireSlime(t, l, true), MobCategory.MONSTER, 1.4F, 1.0F);
    public static final RegistryObject<EntityType<SpireSlime>> TWIG_SLIME = mob("twig_slime", (t, l) -> new SpireSlime(t, l, false), MobCategory.MONSTER, 1.4F, 1.0F);
    public static final RegistryObject<EntityType<FuzzyWurmCrawler>> FUZZY_WURM_CRAWLER = mob("fuzzy_wurm_crawler", FuzzyWurmCrawler::new, MobCategory.MONSTER, 0.9F, 0.8F);
    public static final RegistryObject<EntityType<Flyconid>> FLYCONID = mob("flyconid", Flyconid::new, MobCategory.MONSTER, 0.8F, 1.7F);
    public static final RegistryObject<EntityType<Nibbit>> NIBBIT = mob("nibbit", Nibbit::new, MobCategory.MONSTER, 0.9F, 0.75F);
    public static final RegistryObject<EntityType<ShrinkerBeetle>> SHRINKER_BEETLE = mob("shrinker_beetle", ShrinkerBeetle::new, MobCategory.MONSTER, 0.9F, 0.6F);
    public static final RegistryObject<EntityType<Byrdonis>> BYRDONIS = mob("byrdonis", Byrdonis::new, MobCategory.MONSTER, 1.3F, 3.2F);   // v5: drawn 1.4x
    public static final RegistryObject<EntityType<CeremonialBeast>> CEREMONIAL_BEAST = mob("ceremonial_beast", CeremonialBeast::new, MobCategory.MONSTER, 2.2F, 3.9F);   // v5: drawn 1.4x
    public static final RegistryObject<EntityType<Osty>> OSTY = mob("osty", Osty::new, MobCategory.CREATURE, 0.9F, 0.7F);

    // ---- Phase 8 mobs, batch 2 (docs/design/mobs.md §9): Underdocks ----
    public static final RegistryObject<EntityType<CorpseSlug>> CORPSE_SLUG = mob("corpse_slug", CorpseSlug::new, MobCategory.MONSTER, 0.8F, 0.7F);
    public static final RegistryObject<EntityType<Toadpole>> TOADPOLE = mob("toadpole", Toadpole::new, MobCategory.MONSTER, 0.8F, 0.6F);
    public static final RegistryObject<EntityType<TwoTailedRat>> TWO_TAILED_RAT = mob("two_tailed_rat", TwoTailedRat::new, MobCategory.MONSTER, 0.6F, 1.2F);
    public static final RegistryObject<EntityType<Seapunk>> SEAPUNK = mob("seapunk", Seapunk::new, MobCategory.MONSTER, 0.9F, 0.9F);
    public static final RegistryObject<EntityType<TerrorEel>> TERROR_EEL = mob("terror_eel", TerrorEel::new, MobCategory.MONSTER, 1.7F, 1.2F);
    public static final RegistryObject<EntityType<SoulFysh>> SOUL_FYSH = mob("soul_fysh", SoulFysh::new, MobCategory.MONSTER, 3.6F, 4.6F);

    // ---- Phase 8 mobs, batch 3 (docs/design/mobs.md §10): the Hive ----
    public static final RegistryObject<EntityType<com.mockingjam.spirecraft.mob.Bowlbug>> BOWLBUG_ROCK = mob("bowlbug_rock", (t, l) -> new com.mockingjam.spirecraft.mob.Bowlbug(t, l, com.mockingjam.spirecraft.mob.Bowlbug.Kind.ROCK), MobCategory.MONSTER, 1.0F, 1.2F);
    public static final RegistryObject<EntityType<com.mockingjam.spirecraft.mob.Bowlbug>> BOWLBUG_EGG = mob("bowlbug_egg", (t, l) -> new com.mockingjam.spirecraft.mob.Bowlbug(t, l, com.mockingjam.spirecraft.mob.Bowlbug.Kind.EGG), MobCategory.MONSTER, 0.6F, 0.6F);
    public static final RegistryObject<EntityType<com.mockingjam.spirecraft.mob.Bowlbug>> BOWLBUG_SILK = mob("bowlbug_silk", (t, l) -> new com.mockingjam.spirecraft.mob.Bowlbug(t, l, com.mockingjam.spirecraft.mob.Bowlbug.Kind.SILK), MobCategory.MONSTER, 0.9F, 1.0F);
    public static final RegistryObject<EntityType<com.mockingjam.spirecraft.mob.Bowlbug>> BOWLBUG_NECTAR = mob("bowlbug_nectar", (t, l) -> new com.mockingjam.spirecraft.mob.Bowlbug(t, l, com.mockingjam.spirecraft.mob.Bowlbug.Kind.NECTAR), MobCategory.MONSTER, 0.9F, 1.0F);
    public static final RegistryObject<EntityType<com.mockingjam.spirecraft.mob.Exoskeleton>> EXOSKELETON = mob("exoskeleton", com.mockingjam.spirecraft.mob.Exoskeleton::new, MobCategory.MONSTER, 0.7F, 0.9F);
    public static final RegistryObject<EntityType<com.mockingjam.spirecraft.mob.Chomper>> CHOMPER = mob("chomper", com.mockingjam.spirecraft.mob.Chomper::new, MobCategory.MONSTER, 1.0F, 0.9F);
    public static final RegistryObject<EntityType<com.mockingjam.spirecraft.mob.Myte>> MYTE = mob("myte", com.mockingjam.spirecraft.mob.Myte::new, MobCategory.MONSTER, 1.2F, 0.9F);
    public static final RegistryObject<EntityType<com.mockingjam.spirecraft.mob.Entomancer>> ENTOMANCER = mob("entomancer", com.mockingjam.spirecraft.mob.Entomancer::new, MobCategory.MONSTER, 0.7F, 2.2F);
    public static final RegistryObject<EntityType<com.mockingjam.spirecraft.mob.KaiserCrab>> KAISER_CRAB = mob("kaiser_crab", com.mockingjam.spirecraft.mob.KaiserCrab::new, MobCategory.MONSTER, 6.0F, 3.4F);
    public static final RegistryObject<EntityType<com.mockingjam.spirecraft.mob.KnowledgeDemon>> KNOWLEDGE_DEMON = mob("knowledge_demon", com.mockingjam.spirecraft.mob.KnowledgeDemon::new, MobCategory.MONSTER, 2.0F, 4.8F);

    /** Phase 10: the Merchant (structures.md §3), a wandering-trader-like visitor. */
    public static final RegistryObject<EntityType<com.mockingjam.spirecraft.mob.SpireMerchant>> MERCHANT = mob("merchant", com.mockingjam.spirecraft.mob.SpireMerchant::new, MobCategory.CREATURE, 0.9F, 1.4F);   // sitting on his rug

    /** Glory v2: the Frog Knights' mount - bred in the beetle training grounds, tameable and rideable. */
    public static final RegistryObject<EntityType<com.mockingjam.spirecraft.mob.RhinoBeetle>> RHINO_BEETLE = mob("rhino_beetle", com.mockingjam.spirecraft.mob.RhinoBeetle::new, MobCategory.CREATURE, 1.3F, 1.0F);

    /** §11: every data-driven STS2 monster (mob/ScriptedDefs), by name. */
    public static final java.util.Map<String, RegistryObject<EntityType<com.mockingjam.spirecraft.mob.ScriptedMonster>>> SCRIPTED = new java.util.LinkedHashMap<>();
    static {
        for (var d : com.mockingjam.spirecraft.mob.ScriptedDefs.ALL.values())
            SCRIPTED.put(d.name, mob(d.name, (t, l) -> new com.mockingjam.spirecraft.mob.ScriptedMonster(t, l, d), MobCategory.MONSTER, d.width, d.height));
    }

    private ModEntities() {}

    private static <T extends Entity> RegistryObject<EntityType<T>> mob(String name, EntityType.EntityFactory<T> factory, MobCategory category, float width, float height) {
        ResourceKey<EntityType<?>> key = ResourceKey.create(Registries.ENTITY_TYPE, SpireCraft.id(name));
        // hitboxes from the size table (tools/mobs/sizes.js, STS2 sizes against the player) where it has the mob
        float w = com.mockingjam.spirecraft.mob.MobSizes.width(name, width), h = com.mockingjam.spirecraft.mob.MobSizes.height(name, height);
        return ENTITY_TYPES.register(name, () -> EntityType.Builder.of(factory, category).sized(w, h).clientTrackingRange(name.equals("kaiser_crab") || name.equals("insatiable") ? 16 : 10).build(key));
    }

    private static <T extends Entity> RegistryObject<EntityType<T>> projectile(String name, EntityType.EntityFactory<T> factory, float size) {
        ResourceKey<EntityType<?>> key = ResourceKey.create(Registries.ENTITY_TYPE, SpireCraft.id(name));
        return ENTITY_TYPES.register(name, () -> EntityType.Builder.of(factory, MobCategory.MISC).noLootTable()
                .sized(size, size).clientTrackingRange(6).updateInterval(5).build(key));
    }
}
