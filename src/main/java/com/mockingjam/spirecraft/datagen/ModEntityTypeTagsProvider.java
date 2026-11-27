package com.mockingjam.spirecraft.datagen;

import com.mockingjam.spirecraft.SpireCraft;
import com.mockingjam.spirecraft.mob.ScriptedDefs;
import com.mockingjam.spirecraft.registry.ModEntities;
import com.mockingjam.spirecraft.registry.ModMaterials;
import java.util.concurrent.CompletableFuture;
import net.minecraft.core.HolderLookup;
import net.minecraft.data.PackOutput;
import net.minecraft.data.tags.EntityTypeTagsProvider;
import net.minecraft.world.entity.EntityType;
import net.minecraftforge.common.data.ExistingFileHelper;
import org.jetbrains.annotations.Nullable;

/**
 * Entity type tags: {@code spirecraft:bosses} (Lava Rock and other boss-only rules) and {@code spirecraft:elites}
 * (#26 一-11). The data-driven monsters join from their definitions ({@code def.boss} / {@code def.elite}).
 */
public class ModEntityTypeTagsProvider extends EntityTypeTagsProvider {
    public ModEntityTypeTagsProvider(PackOutput output, CompletableFuture<HolderLookup.Provider> lookup, @Nullable ExistingFileHelper existing) {
        super(output, lookup, SpireCraft.MODID, existing);
    }

    @Override
    protected void addTags(HolderLookup.Provider provider) {
        tag(ModMaterials.BOSSES).add(EntityType.WITHER, EntityType.ENDER_DRAGON, EntityType.ELDER_GUARDIAN, EntityType.WARDEN,
                ModEntities.CEREMONIAL_BEAST.get(), ModEntities.SOUL_FYSH.get(), ModEntities.KAISER_CRAB.get(), ModEntities.KNOWLEDGE_DEMON.get());
        tag(ModMaterials.ELITES).add(ModEntities.BYRDONIS.get(), ModEntities.TERROR_EEL.get(), ModEntities.ENTOMANCER.get());
        for (var d : ScriptedDefs.ALL.values()) {
            if (d.boss) tag(ModMaterials.BOSSES).add(ModEntities.SCRIPTED.get(d.name).get());
            else if (d.elite) tag(ModMaterials.ELITES).add(ModEntities.SCRIPTED.get(d.name).get());
        }
    }
}
