---
name: spirecraft-pixel-art
description: Draw or revise SpireCraft textures (items, blocks, armor, effect icons) in vanilla Minecraft style. Use whenever a new item/block needs a texture or the user asks to change how textures look.
---

# SpireCraft pixel art

Follow `docs/design/art_style.md` and its checklist. Core principle: for STS2 content, overall look from STS2, form and surface texture from Minecraft; attractive AND plausible. Summary:

1. Elongated items lie on a 45° diagonal (bottom-left → top-right); round fruit front-on with stem/leaf pushed to the top-right.
2. Whole-object light gradient top-left → bottom-right, plus an inner highlight line (top-left) and inner shadow line (bottom-right) just inside the contour. No large flat colour areas; add 1–2px material texture.
3. Outline = darkest shade of the same hue (~0.5× interior brightness), never pure black.
4. ~9 colours, 5–7 step ramps with slight hue shift. Object fills ~13×13 of 16×16.
5. Tools and armor: reuse the vanilla silhouette (`kind:'reshade'` from the iron variant), change only material colours and add detail overlays. Worn armor: vanilla UV layout and shading, new material.
6. Ores: vanilla host rock + own deposits (oreDeposits helper). Blocks tile, no outline.
7. STS2 content: keep the STS2 icon's identifying features (view icons on slaythespire.wiki.gg in the built-in browser), redraw in vanilla style. Never just downscale.
8. Never ship a plain vanilla recolour as a "new" item texture — except where rule 9 applies.
9. Anything with a vanilla category counterpart starts from that vanilla texture ('reshade'): ingots, raw ores, storage blocks, crystal clusters (quartz), tools, armor. Add own details via overlays.
10. Unique items use `shade:'volume'` (default): smooth silhouettes built with the geometry helpers (draw/circ/smin/seg), never jagged hand-typed blobs; highlights must be soft gradients over several pixels.
11. Repeated elements (seeds, spots, ore specks) are randomly scattered, never in rows. One surface changing colour = smooth blend (blend + dither), never hard bands. Fruit is full and symmetric. Ores: varied, separated deposits, each with its own metallic/crystal sheen.
12. Things made from a vanilla material use that material's vanilla texture (Amethyst Aubergine skin = vanilla amethyst block via tex/texMix).
13. Armor = vanilla netherite/diamond plate armor reshaded: no white rivet dots, seams only 1–2 shades darker than plates. Metal blocks/ingots/armor use only the middle of a ramp (range ~0.1–0.9): soft contrast, clean faces, little noise (Create-mod quality).
14. Ores: vanilla deposits of the same kind (with their dark rims, select:'diff'), mirrored + shifted, recoloured; mineral colour must separate from the host rock.
15. Lava/fluids flow out of cracks (glowing core, heated rim, drips past the outline); drops are round with a soft point, no straight edges; powders are smooth cone piles; small accents (seeds) must stay visible at 1×.
16. Ore deposits: mirror / flipY only — never a wrap-around shift (pushes deposits onto block edges). Metals must reach near-white highlights and sit bright (gamma < 1) to read as metal. Armor gets its own engraving (pattern:'engrave'), never a copy of a vanilla pattern. Glass = strong, tight specular + a curved glint; flames inside are glowing tongues rising from the bottom.
17. Even ≠ regular: spread accents with lattice() (staggered grid + jitter). Run smooth() on organic silhouettes. Rods are long and slim. Keep compositions centred and symmetric. Powders reuse the vanilla dust-pile silhouette. Metals: bright highlight only on a small lit patch, not overall. Armor texture must read at 1× (plates2 pattern). Inner light sources light their surroundings (innerGlow). Pick the vanilla ore source by mineral colour: dark minerals ← coal ore, light metals ← iron/gold ore.

## Workflow

1. Edit definitions in `tools/pixel_art_defs.js`.
2. `node tools/draw_pixel_art.js <extracted client-extra.jar dir> [name filter]` (run from a scratch dir), then `node tools/bb.mjs call risky_eval a.json` (Blockbench must be open; launch with PowerShell `Start-Process D:\Blockbench\Blockbench.exe`).
3. Preview side by side with the closest vanilla textures at 6–8× before calling it done.

## Round 7 additions
- Rods: ~3/4 of the diagonal, diameter ≥4 px, end face drawn as a full ellipse (light face + dark rim) so the round section reads.
- Bones: two round knobs at each end, clearly sticking out of the meat.
- Armor: plate seams only (one step darker); cap highlights at ~80% of the ramp; no light stripes.
- Seeds/dots: strict staggered lattice, check at 1x for clumps.
- Drops: symmetric silhouette and flames; soft red→yellow ramp plus wider innerGlow.
- If the user says keep the colours, change shape/detail only.

## Round 8 additions
- Cylinders: parallel sides, shade across the width (lit edge, highlight stripe along the length, dark edge); far end = full light ellipse, near end = convex half-ellipse. Do not use blob volume shading (reads as a pill).
- Drops: full semicircle bottom kept inside the 16x16 canvas (clipping = flat bottom), sides meeting in a point on top.
- Metal armor gloss: wider range (0.02-0.9), gamma < 1, plus reshade sheen (top-left light → bottom-right shadow). No light stripes.

## Round 9 additions
- Drops: use the teardrop curve w(v)=sqrt(1-v^2)*((1-v)/2)^0.6, no shoulders; glints = white arc along the right rim + short streak top-right; keep the red saturated (low ks).
- Reusing a vanilla silhouette: vary it (mirror horizontally); never flip crystals upside down.
- Main mass dominates (meat >> bone). Multi-stop blends: renderer blend takes ramps[] + stops[]; keep accent tints (green near the mango leaf) to the first ~20% and out of the shadows.
- Iterate from the version the user liked; do not redesign from scratch each round.
- Blockbench after a restart: create_project (format free) before risky_eval, or it fails with finishEdit.

## Round 10 additions
- Outlines: never the darkest ramp step. Map items use outlineIdx (blood: 3); reshades raise range low end (~0.18) so the outline is a dark same-hue tone.
- Key small silhouettes: hand-set per-row widths (table) instead of a formula.
- Symmetric objects: identical treatment at both ends (caps, bands).
- draw_pixel_art.js filter takes one job name, not a comma list.

## Round 11 additions
- Pixel curves: decreasing step runs (3-2-2-1, then vertical); irregular runs read as jaggies.
- Do not just mirror a vanilla texture: rebuild it with a generator in the same drawing style (BRIMSTONE crystal generator: pointed prisms, lit left/dark right faces, mid-tone outline) with your own layout. No white in coloured materials.
- Cylinders: diameter ~5 px, full light end face with rim at the far end, same oval silhouette at the near end, shading across the width.

## Round 12 additions
- Drops: short tip (2 rows), widening fast, widest in the lower third.
- Crystal clusters fan out: side crystals lean outwards, bases gather together.
- Cylinders: mild perspective (near end slightly thicker with the round face, far end thinner) instead of extra thickness.
- Small requested tweaks = small parameter steps; back off to a middle value if it overshoots.

## Round 13 additions
- Blood drop = ~10 px circle at the bottom + slim, not-too-short tip (~4 rows). Row widths 2,2,4,4,6,8,8,10,10,10,10,8,8,4.
- Every crystal in a cluster leans a little; a perfectly vertical one looks off.

## Round 14 additions
- Inner glow/fire: one continuous heat field (depth inside the flame × closeness to the base) quantised to ~7 flat levels with 4x4 Bayer dithering; lowest level ≈ the surrounding colour. No two-block outer/inner flame.
- Crystals may taper (wide base, narrow top); keep clusters tall.
- Tungsten rod = first version (thick cylinder, end face bottom-left, volume shading); no perspective.

## Round 15 additions
- Burning Blood: no white glints; red-only shading plus a soft red rim light.
- Crystal clusters: draw the full, tapered main crystal first (behind), then the strongly leaning side crystals in front, all from one base, so the lean stays visible.

## Size, status icons, character styles (2026-11-13)
- Item size follows vanilla: fruit no bigger than the apple (~12x14 incl. stem), strawberry ~9x11. Relics may fill the slot.
- Status icons: STS2 Icon_* glyph shapes drawn like vanilla effect icons (clean outline, 3-4 tones, top-left light, dark outline, no drop shadow, no noise). They are now jobs in pixel_art_defs.js (out mob_effect/...); tools/draw_effect_icons.js is superseded.
- Weapons must have their own silhouette and their character colours: Ironclad red/blood/black heavy iron; Silent green/bandage/venom/snake; Regent orange + sky blue + night sky + stars/sun; Necrobinder purple, big scythes, curved snaths; Defect pale-yellow shells, blue orbs, grey wires.
- Recoloured blocks: raise the ramp floor so the border is not near-black.

## Status icons flat; weapons from card art (2026-11-13)
- Status icons are FLAT two-tone (light left / dark right) STS2 Icon_* shapes with a dark outline; no volume shading. Effects vanilla already has (poison) use the vanilla icon.
- Before drawing a weapon, view its STS2 card art (StS2_<Character>-<Card>-Art.png) and copy the object it shows; character colour is an overall tone, not a mandate (scythe blades stay grey steel).
- Tiny holes need outlineIdx 0 so they read as dark gaps.

## Resolution & polish (2026-11-13)
- Status icons are 18x18 (vanilla size): STS2 shapes plus vanilla-quality polish (rims, volume light, metal sheen, detail).
- Large weapons are 32x32 via drawAAAt(32, fn) (fn keeps 16-unit coordinates); Terraria/Calamity look: crisp dark outline, clear tone bands, edge highlights, gems/wraps. Small items stay 16x16.
- One harmonised palette per weapon (see art_style.md 109).
- The map renderer is size-independent (N = rows.length).

## Aesthetics first (2026-11-13)
- Read the "像素画美观性原则" section at the top of docs/design/art_style.md before drawing anything.
- Fit the vanilla environment: palettes sampled from vanilla materials (R.vIron, vWood, vGold, vDiamond, vNetherite, vLeather, vBone, vQuartz ...), vanilla outline/light/contrast; own colours only as accents.
- Render by material: metal = sheen, liquid = curved reflection streak, gem = facets/sparkle, symbols = flat/simple. Polished does not mean high contrast.
- Shapes vanilla already has (sword, shield, potion, dust) start from the vanilla texture (reshade, also for mob_effect icons).
