package com.mockingjam.spirecraft.datagen;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.mockingjam.spirecraft.worldgen.ModBiomes;
import com.mojang.datafixers.util.Pair;
import com.mojang.serialization.JsonOps;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;
import java.util.function.Function;
import net.minecraft.data.CachedOutput;
import net.minecraft.data.DataProvider;
import net.minecraft.data.PackOutput;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.level.biome.Biome;
import net.minecraft.world.level.biome.Biomes;
import net.minecraft.world.level.biome.Climate;
import net.minecraft.world.level.biome.OverworldBiomeBuilder;

/**
 * Overrides {@code minecraft:normal} so the overworld uses an explicit multi-noise biome list: vanilla's own list
 * (collected from OverworldBiomeBuilder) with a slice of some host biomes handed to our biomes. No mixin, no
 * TerraBlender; only new worlds are affected (docs/design/biomes.md §5). Nether and End stay vanilla.
 */
public class WorldPresetProvider implements DataProvider {
    private final PackOutput output;

    public WorldPresetProvider(PackOutput output) {
        this.output = output;
    }

    /** Which climate axis a slice is cut along. */
    enum Axis {
        TEMPERATURE, HUMIDITY, CONTINENTALNESS, EROSION, WEIRDNESS
    }

    /** Hand {@code share} of every {@code host} point (its top or bottom part along {@code axis}) to {@code target}. */
    record Slice(ResourceKey<Biome> host, ResourceKey<Biome> target, Axis axis, float share, boolean top) {}

    static final List<Slice> SLICES = List.of(
            // dark harbours and the polluted sea
            // v2.3: smaller again (user: the stone forest covered too many chunks)
            new Slice(Biomes.SWAMP, ModBiomes.STONE_FOREST_DOCKS, Axis.CONTINENTALNESS, 0.15F, false),   // the swamp nearest the coast
            new Slice(Biomes.MANGROVE_SWAMP, ModBiomes.STONE_FOREST_DOCKS, Axis.CONTINENTALNESS, 0.1F, false),
            new Slice(Biomes.BEACH, ModBiomes.BEACH_DOCKS, Axis.HUMIDITY, 0.3F, true),
            // the polluted sea: whole lukewarm oceans (deep and shallow) and the wettest part of the plain oceans, so it forms wide areas
            // (v2.3: a little less - some polluted seas were too big)
            new Slice(Biomes.LUKEWARM_OCEAN, ModBiomes.POLLUTED_SEA, Axis.HUMIDITY, 0.65F, true),
            new Slice(Biomes.DEEP_LUKEWARM_OCEAN, ModBiomes.POLLUTED_SEA, Axis.HUMIDITY, 0.65F, true),
            new Slice(Biomes.OCEAN, ModBiomes.POLLUTED_SEA, Axis.HUMIDITY, 0.3F, true),
            // waterfalls: the wettest windswept (cliffy) land
            new Slice(Biomes.WINDSWEPT_FOREST, ModBiomes.WATERFALLS, Axis.HUMIDITY, 0.6F, true),
            new Slice(Biomes.WINDSWEPT_HILLS, ModBiomes.WATERFALLS, Axis.HUMIDITY, 0.3F, true),
            // the overgrowth family stands on its own (not next to jungles): most of the dark forest and the wettest
            // plain forest; the hilliest part (low erosion) goes back to dark forest so it stays flat
            // v2.4 (user): every dark forest becomes overgrowth (so no woodland mansion stands next to one - mansions
            // only spawn in dark forests and pale gardens); plus the wettest plain and birch forests
            new Slice(Biomes.DARK_FOREST, ModBiomes.OVERGROWTH, Axis.HUMIDITY, 1.0F, true),
            // (v2.4: bigger again - the user wants overgrowths as wide as a mangrove swamp)
            new Slice(Biomes.FOREST, ModBiomes.OVERGROWTH, Axis.HUMIDITY, 0.8F, true),
            new Slice(Biomes.BIRCH_FOREST, ModBiomes.OVERGROWTH, Axis.HUMIDITY, 0.6F, true),
            new Slice(ModBiomes.OVERGROWTH, ModBiomes.MISTY_OVERGROWTH, Axis.WEIRDNESS, 0.33F, true),
            new Slice(ModBiomes.OVERGROWTH, ModBiomes.MUSHROOM_OVERGROWTH, Axis.WEIRDNESS, 0.33F, false),
            // ink spring caves: part of the dripstone caves
            new Slice(Biomes.DRIPSTONE_CAVES, ModBiomes.INK_SPRING_CAVES, Axis.HUMIDITY, 0.3F, true));

    /** Cave biomes under a surface biome: copies of the host's climate points at cave depth (like lush/dripstone caves). */
    /** A cave biome under {@code share} of a surface biome's points (the top of their weirdness range); the rest keeps normal caves. */
    record CaveCopy(ResourceKey<Biome> host, ResourceKey<Biome> target, float share) {}

    static final List<CaveCopy> CAVE_COPIES = List.of(
            // v2.3: under part of each host only (user: the hive and other caves covered too many chunks)
            // (v3.2: no quicksand caves - quicksand lies on the desert surface instead, data/spirecraft/forge/biome_modifier)
            // v3.2 (user): about as common as lush caves, a little more at most
            new CaveCopy(Biomes.SAVANNA, ModBiomes.HIVE_CAVES, 0.15F),
            new CaveCopy(Biomes.SAVANNA_PLATEAU, ModBiomes.HIVE_CAVES, 0.15F),
            new CaveCopy(Biomes.BADLANDS, ModBiomes.HIVE_CAVES, 0.15F));

    /** Applied to the cave copies: sparse and egg hives are the two weirdness extremes of the hive caves. */
    static final List<Slice> CAVE_SLICES = List.of(
            new Slice(ModBiomes.HIVE_CAVES, ModBiomes.SPARSE_HIVE_CAVES, Axis.WEIRDNESS, 0.3F, false),
            new Slice(ModBiomes.HIVE_CAVES, ModBiomes.EGG_HIVE_CAVES, Axis.WEIRDNESS, 0.3F, true));

    /** Cave depth, as vanilla uses for lush and dripstone caves. */
    static final Climate.Parameter CAVE_DEPTH = Climate.Parameter.span(0.2F, 0.9F);

    /** Vanilla's overworld parameter list (OverworldBiomeBuilder.addBiomes is protected, hence the reflection). */
    @SuppressWarnings("unchecked")
    static List<Pair<Climate.ParameterPoint, ResourceKey<Biome>>> vanillaPoints() {
        List<Pair<Climate.ParameterPoint, ResourceKey<Biome>>> points = new ArrayList<>();
        try {
            Method m = OverworldBiomeBuilder.class.getDeclaredMethod("addBiomes", Consumer.class);
            m.setAccessible(true);
            m.invoke(new OverworldBiomeBuilder(), (Consumer<Pair<Climate.ParameterPoint, ResourceKey<Biome>>>) points::add);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("cannot read OverworldBiomeBuilder.addBiomes", e);
        }
        return points;
    }

    /** Vanilla points with all {@link #SLICES} applied. */
    public static List<Pair<Climate.ParameterPoint, ResourceKey<Biome>>> slicedPoints() {
        List<Pair<Climate.ParameterPoint, ResourceKey<Biome>>> vanilla = vanillaPoints();
        // cave copies first, so they win ties against vanilla cave biomes
        List<Pair<Climate.ParameterPoint, ResourceKey<Biome>>> caves = new ArrayList<>();
        for (CaveCopy copy : CAVE_COPIES) {
            for (var pair : vanilla) {
                Climate.ParameterPoint p = pair.getFirst();
                if (!pair.getSecond().equals(copy.host()) || p.depth().min() != 0 || p.depth().max() != 0) continue;   // the surface point only
                Climate.Parameter w = p.weirdness();
                long cut = w.max() - (long) ((w.max() - w.min()) * copy.share());
                caves.add(Pair.of(new Climate.ParameterPoint(p.temperature(), p.humidity(), p.continentalness(), p.erosion(), CAVE_DEPTH,
                        new Climate.Parameter(cut, w.max()), p.offset()), copy.target()));
            }
        }
        caves = slice(caves, CAVE_SLICES);
        List<Pair<Climate.ParameterPoint, ResourceKey<Biome>>> all = new ArrayList<>(caves);
        all.addAll(slice(vanilla, SLICES));
        return all;
    }

    static List<Pair<Climate.ParameterPoint, ResourceKey<Biome>>> slice(List<Pair<Climate.ParameterPoint, ResourceKey<Biome>>> points, List<Slice> slices) {
        for (Slice slice : slices) {
            List<Pair<Climate.ParameterPoint, ResourceKey<Biome>>> next = new ArrayList<>(points.size() + 64);
            for (var pair : points) {
                if (!pair.getSecond().equals(slice.host())) {
                    next.add(pair);
                    continue;
                }
                Climate.ParameterPoint p = pair.getFirst();
                if (slice.share() >= 1) {   // the whole biome (a zero-width leftover would still win some spots)
                    next.add(Pair.of(p, slice.target()));
                    continue;
                }
                Climate.Parameter range = get(p, slice.axis());
                long width = range.max() - range.min();
                if (width < 200) {   // too thin to split (0.02 in climate units)
                    next.add(pair);
                    continue;
                }
                long cut = slice.top() ? range.max() - (long) (width * slice.share()) : range.min() + (long) (width * slice.share());
                Climate.Parameter low = new Climate.Parameter(range.min(), cut), high = new Climate.Parameter(cut, range.max());
                next.add(Pair.of(with(p, slice.axis(), slice.top() ? low : high), slice.host()));
                next.add(Pair.of(with(p, slice.axis(), slice.top() ? high : low), slice.target()));
            }
            points = next;
        }
        return points;
    }

    private static Climate.Parameter get(Climate.ParameterPoint p, Axis axis) {
        return switch (axis) {
            case TEMPERATURE -> p.temperature();
            case HUMIDITY -> p.humidity();
            case CONTINENTALNESS -> p.continentalness();
            case EROSION -> p.erosion();
            case WEIRDNESS -> p.weirdness();
        };
    }

    private static Climate.ParameterPoint with(Climate.ParameterPoint p, Axis axis, Climate.Parameter v) {
        Function<Axis, Climate.Parameter> f = a -> a == axis ? v : get(p, a);
        return new Climate.ParameterPoint(f.apply(Axis.TEMPERATURE), f.apply(Axis.HUMIDITY), f.apply(Axis.CONTINENTALNESS),
                f.apply(Axis.EROSION), p.depth(), f.apply(Axis.WEIRDNESS), p.offset());
    }

    @Override
    public CompletableFuture<?> run(CachedOutput cache) {
        JsonArray biomes = new JsonArray();
        for (var pair : slicedPoints()) {
            JsonObject entry = new JsonObject();
            entry.addProperty("biome", pair.getSecond().location().toString());
            entry.add("parameters", Climate.ParameterPoint.CODEC.encodeStart(JsonOps.INSTANCE, pair.getFirst()).getOrThrow());
            biomes.add(entry);
        }
        JsonObject overworldSource = new JsonObject();
        overworldSource.addProperty("type", "minecraft:multi_noise");
        overworldSource.add("biomes", biomes);

        JsonObject dims = new JsonObject();
        dims.add("minecraft:overworld", dimension("minecraft:overworld", overworldSource, "minecraft:overworld"));
        JsonObject endSource = new JsonObject();
        endSource.addProperty("type", "minecraft:the_end");
        dims.add("minecraft:the_end", dimension("minecraft:the_end", endSource, "minecraft:end"));
        JsonObject netherSource = new JsonObject();
        netherSource.addProperty("type", "minecraft:multi_noise");
        netherSource.addProperty("preset", "minecraft:nether");
        dims.add("minecraft:the_nether", dimension("minecraft:the_nether", netherSource, "minecraft:nether"));
        JsonObject root = new JsonObject();
        root.add("dimensions", dims);

        var path = output.createPathProvider(PackOutput.Target.DATA_PACK, "worldgen/world_preset")
                .json(ResourceLocation.withDefaultNamespace("normal"));
        return DataProvider.saveStable(cache, root, path);
    }

    private static JsonObject dimension(String type, JsonObject biomeSource, String settings) {
        JsonObject generator = new JsonObject();
        generator.addProperty("type", "minecraft:noise");
        generator.add("biome_source", biomeSource);
        generator.addProperty("settings", settings);
        JsonObject dim = new JsonObject();
        dim.addProperty("type", type);
        dim.add("generator", generator);
        return dim;
    }

    @Override
    public String getName() {
        return "SpireCraft world preset (overworld biome slices)";
    }
}
