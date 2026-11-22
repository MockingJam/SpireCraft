package com.mockingjam.spirecraft.dev;

import com.mojang.logging.LogUtils;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayDeque;
import java.util.Deque;
import net.minecraft.client.CameraType;
import net.minecraft.client.Minecraft;
import net.minecraft.client.Screenshot;
import net.minecraft.client.gui.screens.TitleScreen;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.Difficulty;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.GameRules;
import net.minecraft.world.level.GameType;
import net.minecraft.world.level.LevelSettings;
import net.minecraft.world.level.WorldDataConfiguration;
import net.minecraft.world.level.levelgen.WorldOptions;
import net.minecraft.world.level.levelgen.presets.WorldPresets;
import org.slf4j.Logger;

/**
 * Dev-only screenshot runner (never active in normal play): with the environment variable SPIRECRAFT_SHOTS pointing at
 * a script, the client creates a fresh world and runs the script line by line, writing run/screenshots/<name>.png.
 * Script lines: {@code seed N} (first line, optional) · {@code cmd <server command>} · {@code hold <item>} ·
 * {@code offhand <item>} · {@code view first|back|front} · {@code look <yaw> <pitch>} · {@code swing} · {@code use on|off} ·
 * {@code gui on|off} · {@code wait <ticks>} · {@code shot <name>} · {@code biome <id> [surface|floor|cave] [up]} ·
 * {@code find <block> [radius] [distance]} · {@code quit}. Used by tools/shots.ps1.
 */
public final class ClientShots {
    private static final Logger LOG = LogUtils.getLogger();
    private static final Deque<String> LINES = new ArrayDeque<>();
    private static boolean started;
    private static int wait;
    private static long seed = 20261112L;
    private static boolean useHeld;

    private ClientShots() {}

    public static void init() {
        String path = System.getenv("SPIRECRAFT_SHOTS");
        if (path == null) return;
        try {
            for (String line : Files.readAllLines(Path.of(path))) {
                line = line.strip();
                if (line.isEmpty() || line.startsWith("#")) continue;
                if (line.startsWith("seed ")) seed = Long.parseLong(line.substring(5).strip());
                else LINES.add(line);
            }
        } catch (Exception e) {
            LOG.error("[Shots] cannot read {}", path, e);
            return;
        }
        net.minecraftforge.event.TickEvent.ClientTickEvent.Post.BUS.addListener(e -> tick());
    }

    private static void tick() {
        Minecraft mc = Minecraft.getInstance();
        if (!started) {
            if (mc.screen instanceof TitleScreen) {
                started = true;
                LevelSettings settings = new LevelSettings("shots", GameType.CREATIVE, false, Difficulty.PEACEFUL, true,
                        new GameRules(WorldDataConfiguration.DEFAULT.enabledFeatures()), WorldDataConfiguration.DEFAULT);
                try {
                    String name = net.minecraft.FileUtil.findAvailableName(mc.getLevelSource().getBaseDir(), "shots", "");
                    mc.createWorldOpenFlows().createFreshLevel(name, settings, new WorldOptions(seed, true, false),
                            WorldPresets::createNormalWorldDimensions, mc.screen);
                } catch (Exception e) {
                    LOG.error("[Shots] cannot create the world", e);
                }
                wait = 60;
            }
            return;
        }
        mc.options.pauseOnLostFocus = false;
        if (mc.screen instanceof net.minecraft.client.gui.screens.PauseScreen) mc.setScreen(null);   // the window lost focus
        if (mc.player == null || mc.getSingleplayerServer() == null || mc.screen != null) return;
        if (useHeld) mc.options.keyUse.setDown(true);   // closing a pause screen re-reads the real keyboard
        if (wait > 0) { wait--; return; }
        while (!LINES.isEmpty() && wait == 0) run(mc, LINES.poll());
    }

    /**
     * {@code biome <id> [surface|floor|cave] [up]}: teleport to the nearest spot of a biome - on its surface (default),
     * on the sea floor (floor), or standing in a cave of it (cave).
     */
    private static void goToBiome(net.minecraft.server.MinecraftServer server, ServerPlayer sp, String arg) {
        String[] b = arg.split(" ");
        var key = net.minecraft.resources.ResourceKey.create(net.minecraft.core.registries.Registries.BIOME, ResourceLocation.parse(b[0]));
        String mode = b.length > 1 ? b[1] : "surface";
        int up = b.length > 2 ? Integer.parseInt(b[2]) : 2;
        var level = (net.minecraft.server.level.ServerLevel) sp.level();
        var found = level.findClosestBiome3d(h -> h.is(key), sp.blockPosition(), 6400, 32, 64);
        if (found == null) {
            LOG.warn("[Shots] no {} nearby", b[0]);
            return;
        }
        net.minecraft.core.BlockPos p = found.getFirst(), target = null;
        level.getChunk(p);
        if (mode.equals("cave")) {
            outer:
            for (int r = 0; r <= 12; r += 3) for (int dx = -r; dx <= r; dx += 3) for (int dz = -r; dz <= r; dz += 3) for (int dy = -24; dy <= 24; dy++) {
                var q = p.offset(dx, dy, dz);
                if (level.getBlockState(q).isAir() && level.getBlockState(q.above()).isAir()
                        && level.getBlockState(q.below()).isFaceSturdy(level, q.below(), net.minecraft.core.Direction.UP)
                        && level.getBiome(q).is(key)) { target = q; break outer; }
            }
            if (target == null) target = p;
        } else {
            var type = mode.equals("floor") ? net.minecraft.world.level.levelgen.Heightmap.Types.OCEAN_FLOOR : net.minecraft.world.level.levelgen.Heightmap.Types.MOTION_BLOCKING;
            target = level.getHeightmapPos(type, p).above(up);
        }
        LOG.info("[Shots] {} at {}", b[0], target);
        server.getCommands().performPrefixedCommand(sp.createCommandSourceStack(),
                "tp @s " + (target.getX() + 0.5) + " " + target.getY() + " " + (target.getZ() + 0.5));
    }

    /**
     * {@code find <block> [radius] [distance] [minY]}: look for the nearest block of a kind (chunk sections that cannot hold it
     * are skipped) and stand {@code distance} blocks south of it, looking at it.
     */
    private static void find(net.minecraft.server.MinecraftServer server, ServerPlayer sp, String arg) {
        String[] b = arg.split(" ");
        var block = BuiltInRegistries.BLOCK.getValue(ResourceLocation.parse(b[0]));
        int radius = b.length > 1 ? Integer.parseInt(b[1]) : 64, dist = b.length > 2 ? Integer.parseInt(b[2]) : 5;
        int minY = b.length > 3 ? Integer.parseInt(b[3]) : Integer.MIN_VALUE;
        var level = (net.minecraft.server.level.ServerLevel) sp.level();
        var origin = sp.blockPosition();
        net.minecraft.core.BlockPos best = null;
        double bestD = Double.MAX_VALUE;
        for (int cx = (origin.getX() - radius) >> 4; cx <= (origin.getX() + radius) >> 4; cx++) {
            for (int cz = (origin.getZ() - radius) >> 4; cz <= (origin.getZ() + radius) >> 4; cz++) {
                var chunk = level.getChunk(cx, cz);
                var sections = chunk.getSections();
                for (int i = 0; i < sections.length; i++) {
                    var sec = sections[i];
                    if (sec.hasOnlyAir() || !sec.getStates().maybeHas(s -> s.is(block))) continue;
                    int y0 = level.getSectionYFromSectionIndex(i) << 4;
                    for (int x = 0; x < 16; x++) for (int y = 0; y < 16; y++) for (int z = 0; z < 16; z++) {
                        if (!sec.getBlockState(x, y, z).is(block)) continue;
                        var p = new net.minecraft.core.BlockPos((cx << 4) + x, y0 + y, (cz << 4) + z);
                        if (p.getY() < minY) continue;
                        double d = p.distSqr(origin);
                        if (d < bestD) { bestD = d; best = p; }
                    }
                }
            }
        }
        if (best == null) {
            LOG.warn("[Shots] no {} within {}", b[0], radius);
            return;
        }
        LOG.info("[Shots] found {} at {}", b[0], best);
        server.getCommands().performPrefixedCommand(sp.createCommandSourceStack(), "tp @s " + (best.getX() + 0.5) + " " + (best.getY() + 1)
                + " " + (best.getZ() + 0.5 + dist) + " 180 25");
    }

    /**
     * {@code locate <structure>}: teleport to the middle of the nearest generated structure of that kind (its bounding
     * box centre), standing on the ground there; later relative {@code tp} lines can orbit it.
     */
    private static void locate(net.minecraft.server.MinecraftServer server, ServerPlayer sp, String arg) {
        var level = (net.minecraft.server.level.ServerLevel) sp.level();
        var registry = level.registryAccess().lookupOrThrow(net.minecraft.core.registries.Registries.STRUCTURE);
        var holder = registry.get(net.minecraft.resources.ResourceKey.create(net.minecraft.core.registries.Registries.STRUCTURE, ResourceLocation.parse(arg.strip())));
        if (holder.isEmpty()) {
            LOG.warn("[Shots] no structure {}", arg);
            return;
        }
        var found = level.getChunkSource().getGenerator().findNearestMapStructure(level, net.minecraft.core.HolderSet.direct(holder.get()), sp.blockPosition(), 100, false);
        if (found == null) {
            LOG.warn("[Shots] {} not found", arg);
            return;
        }
        var start = level.structureManager().getStructureAt(found.getFirst(), holder.get().value());
        net.minecraft.core.BlockPos p = found.getFirst();
        if (start.isValid()) {
            var box = start.getBoundingBox();
            p = new net.minecraft.core.BlockPos((box.minX() + box.maxX()) / 2, 0, (box.minZ() + box.maxZ()) / 2);
        }
        level.getChunk(p);
        var top = level.getHeightmapPos(net.minecraft.world.level.levelgen.Heightmap.Types.MOTION_BLOCKING_NO_LEAVES, p);
        LOG.info("[Shots] {} at {} (box {})", arg, top, start.isValid() ? start.getBoundingBox() : "?");
        server.getCommands().performPrefixedCommand(sp.createCommandSourceStack(), "tp @s " + (top.getX() + 0.5) + " " + top.getY() + " " + (top.getZ() + 0.5));
    }

    private static void run(Minecraft mc, String line) {
        LOG.info("[Shots] {}", line);
        String[] a = line.split(" ", 2);
        String arg = a.length > 1 ? a[1] : "";
        var server = mc.getSingleplayerServer();
        ServerPlayer sp = server.getPlayerList().getPlayer(mc.player.getUUID());
        switch (a[0]) {
            case "cmd" -> server.execute(() -> server.getCommands().performPrefixedCommand(sp.createCommandSourceStack(), arg));
            case "hold", "offhand" -> {
                var item = BuiltInRegistries.ITEM.getValue(ResourceLocation.parse(arg));
                InteractionHand hand = a[0].equals("hold") ? InteractionHand.MAIN_HAND : InteractionHand.OFF_HAND;
                server.execute(() -> sp.setItemInHand(hand, new ItemStack(item)));
            }
            case "view" -> mc.options.setCameraType(switch (arg) {
                case "back" -> CameraType.THIRD_PERSON_BACK;
                case "front" -> CameraType.THIRD_PERSON_FRONT;
                default -> CameraType.FIRST_PERSON;
            });
            case "look" -> {
                String[] yp = arg.split(" ");
                mc.player.setYRot(Float.parseFloat(yp[0]));
                mc.player.setXRot(Float.parseFloat(yp[1]));
                wait = 3;   // let the turned view render before the next shot
            }
            case "swing" -> {
                mc.player.swing(InteractionHand.MAIN_HAND);
                mc.player.resetAttackStrengthTicker();
            }
            case "use" -> {
                if (arg.equals("on")) net.minecraft.client.KeyMapping.click(mc.options.keyUse.getKey());
                useHeld = arg.equals("on");
                mc.options.keyUse.setDown(useHeld);
            }
            case "gui" -> mc.options.hideGui = !arg.equals("on");
            case "wait" -> wait = Integer.parseInt(arg.strip());
            case "shot" -> Screenshot.grab(mc.gameDirectory, arg + ".png", mc.getMainRenderTarget(), 1, msg -> LOG.info("[Shots] {}", msg.getString()));
            case "biome" -> server.execute(() -> goToBiome(server, sp, arg));
            case "find" -> server.execute(() -> find(server, sp, arg));
            case "locate" -> server.execute(() -> locate(server, sp, arg));
            case "fly" -> {   // keep the camera where it is put (creative flight), so it does not fall between shots
                mc.player.getAbilities().flying = true;
                mc.player.onUpdateAbilities();
            }
            case "probe" -> {
                // log what is around the camera: non-air blocks within 2, entities within 6, particles
                var eye = net.minecraft.core.BlockPos.containing(mc.player.getEyePosition());
                java.util.Map<String, Integer> seen = new java.util.TreeMap<>();
                for (var q : net.minecraft.core.BlockPos.betweenClosed(eye.offset(-2, -2, -2), eye.offset(2, 2, 2))) {
                    var st = mc.level.getBlockState(q);
                    if (!st.isAir()) seen.merge(st.toString(), 1, Integer::sum);
                }
                LOG.info("[Shots] probe blocks {}", seen);
                LOG.info("[Shots] probe entities {}", mc.level.getEntities(mc.player, mc.player.getBoundingBox().inflate(6)).stream()
                        .map(e -> e.getType().toShortString() + "@" + e.blockPosition().toShortString()).toList());
                LOG.info("[Shots] probe particles {}", mc.particleEngine.countParticles());
            }
            case "quit" -> mc.stop();
            default -> LOG.warn("[Shots] unknown line {}", line);
        }
    }
}
