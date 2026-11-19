// SpireCraft textures, drawn to docs/design/art_style.md. Rendered by tools/draw_pixel_art.js.
// - STS2 content: overall look from the STS2 icon, form and surface texture from Minecraft.
// - Items of a vanilla category (ingots, raw ores, ores, storage blocks, crystal clusters, tools, armor) start from that
//   vanilla texture ('reshade'); only the material changes. Ores additionally mirror/shift the deposit layout so no pixel
//   block sits where vanilla's does. Armor uses vanilla netherite/diamond plate armor as the base.
// - Unique items use smooth geometric silhouettes with volume shading, clean faces and little noise (like Create's art).
// Ramps: dark → light with a slight hue shift. Ramps blended together must have the same length.

const R = {
  gunmetal: ['#121418', '#1f2328', '#2f343b', '#434a53', '#5b636d', '#7a838e', '#a2aab4', '#cdd3da'],
  alloy: ['#16242d', '#243a47', '#36566a', '#4c7489', '#6895a9', '#8db8c8', '#b9dbe6', '#e6f6fb'],   // STS2 Tungsten Rod
  ori: ['#09210f', '#103a1a', '#185427', '#217036', '#2e8f47', '#46ad5d', '#73cb83', '#b4ebbd'],      // STS2 Orichalcum
  // polished orichalcum: brighter, with a long reach into near-white highlights so it reads as reflective metal
  oriMetal: ['#0b2a14', '#14482a', '#1d6a38', '#278f48', '#36b25c', '#57d077', '#8eeaa0', '#cffadb', '#f4fff7'],
  galaxy: ['#120a2e', '#22144f', '#352073', '#4b2f97', '#6a43b8', '#8f62d4', '#b991ea', '#e2c9fb'],
  wolframiteDark: ['#0c0b0b', '#191817', '#282625', '#383736', '#4b4b4c', '#636870', '#858d98', '#b3bcc8'],   // black mineral, steel lustre
  alloyBright: ['#1d3340', '#2c4b5c', '#3f6a7e', '#5689a0', '#73a8bf', '#98c7d9', '#c3e3ee', '#eefbff'],
  // ---- status icons v5 (vanilla icons recoloured where vanilla has the shape)
  vxRed: ['#1e0606', '#4e0e0e', '#861a1a', '#bc2a28', '#e2504a', '#f6847a', '#ffc8c0'],
  vxPale: ['#16261c', '#2e4a38', '#4e7a5e', '#78a888', '#a6d2b0', '#d2f0d8'],
  vxGreen: ['#0a2412', '#164624', '#22703a', '#329a50', '#50be6a', '#86dc98', '#c8f4d0'],
  vxBlue: ['#0a1a36', '#14325e', '#20508e', '#3474be', '#5a9ce0', '#92c6f4', '#d0eaff'],
  vxGrey: ['#1a1c20', '#363a40', '#585e66', '#7c838c', '#a4abb3', '#ccd2d8', '#f0f3f5'],
  // ---- status icons v4 (polished)
  ixRed: ['#3a0a0e', '#6a1218', '#a01e24', '#d0302e', '#ec5a4c', '#fa9682', '#ffd2c4'],
  ixGold: ['#3e2806', '#6a4a0c', '#a07418', '#d0a026', '#ecc44a', '#f8e08a', '#fff6d2'],
  ixGreen: ['#0e3218', '#185226', '#24783a', '#38a052', '#5cc472', '#96e2a2', '#d4f8da'],
  ixPale: ['#2a4634', '#40664e', '#5e8e6e', '#86b896', '#b2dcbc', '#dcf6e0'],
  ixBlue: ['#0c2648', '#163e70', '#22609e', '#3486ca', '#5cacea', '#9ad2fa', '#dcf2ff'],
  ixGrey: ['#22262a', '#3a4046', '#5a6168', '#80888f', '#a8afb6', '#d0d6db', '#f2f5f7'],
  ixBrown: ['#3a2410', '#5c3c1a', '#82582a', '#a8783c', '#c89a56', '#e2c080', '#f6e2b4'],
  ixStone: ['#26302c', '#3a4844', '#56665f', '#76887f', '#98aaa1', '#bcccc4', '#e0ece6'],
  ixLeather: ['#2a0c0c', '#461616', '#682222', '#8a3030'],
  ixCloud: ['#08080c', '#121218', '#1e1e26', '#2c2c36'],
  ixYellow: ['#6a5a08', '#9a8810', '#c8b818', '#e6dc3c', '#f6f08a', '#fffde0'],
  ixCyan: ['#0e4a6c', '#1278a8', '#2ea4d4', '#56c8ec', '#94e4f6', '#dcf8ff'],
  ixGlassGreen: ['#0a4a2e', '#0e7a48', '#14b066', '#38dc8c', '#88f4bc', '#d4fde8'],
  ixGlassYellow: ['#5a5a08', '#8a8e10', '#bcc41a', '#d8e43a', '#eef48a', '#fbfdd8'],
  ixGlassOrange: ['#5a3204', '#8e5208', '#c47a10', '#e6a020', '#f6c860', '#fde8b0'],
  fxRed: ['#4a0c10', '#7a1418', '#b0222a', '#de3a3c', '#f26a64', '#fca298'],
  fxGreen: ['#123a1c', '#1d5e2c', '#2c8a40', '#45b45a', '#76d683', '#b0eeb6'],
  fxPale: ['#2c4a34', '#4a7456', '#6fa07c', '#98c8a2', '#c4e8ca', '#e8fbea'],
  fxGold: ['#4a3208', '#7a5410', '#b07c1a', '#dcaa30', '#f2d066', '#fcefb0'],
  fxBlue: ['#0e2e52', '#174c80', '#2470b4', '#3c98dc', '#72bef0', '#b2e0fc'],
  fxGrey: ['#2c3034', '#4a5056', '#6e767e', '#969ea6', '#bec5cc', '#e4e9ee'],
  fxLime: ['#2c3606', '#4c5c0c', '#748a14', '#a0b82a', '#c8de4c', '#ecf89a'],
  fxStone: ['#283430', '#3e4e48', '#5a6e66', '#7a9088', '#a0b4ac', '#c8d8d2'],
  // ---- phase 6 weapons v2: character palettes
  // Ironclad: reddish black heavy iron, blood, red grips
  darkIron: ['#0e0a0b', '#1a1314', '#281d1e', '#382828', '#4c3536', '#634545', '#7e5858', '#9c7070'],
  // Silent: green-tinted steel, pale green venom, white bandage, green cloth
  silentSteel: ['#1c2a24', '#2c3e36', '#40564c', '#587064', '#748c80', '#98ad9f', '#c2d2c4'],
  venomPale: ['#2a5a2e', '#3f7a40', '#5a9e56', '#80c070', '#acdc94', '#d6f2c0'],
  bandage: ['#6e675a', '#948d80', '#b6b0a2', '#d4cfc2', '#ece9de'],
  silentCloth: ['#14301c', '#1e4628', '#2a5e36', '#387a46', '#4a9658', '#64b270'],
  // Regent: orange first, sky blue, night sky
  regalOrange: ['#5a2a06', '#8a420c', '#b85c14', '#de7c22', '#f29c3a', '#fabe6a', '#fde0a4'],
  skyBlue: ['#1c3a6a', '#2a5a96', '#3c80c0', '#5aa6e0', '#86c8f2', '#bde4fb', '#eaf8ff'],
  nightSky: ['#120c2a', '#1e1442', '#2c1e5c', '#3c2a78', '#4e3a92'],
  // Necrobinder: purple
  necroPurple: ['#1a0e24', '#2a1638', '#3e2252', '#56306e', '#70448c', '#8e5eaa', '#b086c8', '#d4b4e6'],
  necroWood: ['#1a1016', '#2a1a22', '#3c2832', '#523844', '#6a4a58', '#846070'],
  // Defect: pale-yellow casing, blue orbs, grey wires
  defectShell: ['#5a5230', '#7e7444', '#a49a60', '#c6bc80', '#ded6a0', '#f0eac4', '#fcf8e4'],
  orbBlue: ['#0c2a5a', '#143e86', '#1e58b4', '#3478da', '#5c9cf0', '#96c4fa', '#d2e8ff'],
  // ---- vanilla-sampled material palettes (dark → light)
  vIron: ['#181818', '#444444', '#6b6b6b', '#969696', '#bebebe', '#d8d8d8', '#ffffff'],
  vWood: ['#281e0b', '#493615', '#684e1e', '#896727', '#a07a34'],
  vDarkWood: ['#1e140a', '#33220f', '#4a3218', '#624422', '#7a5630'],
  vGold: ['#3f2e0e', '#825d16', '#dc9613', '#e9b115', '#eaee57', '#fdff76'],
  vDiamond: ['#082520', '#0e3f36', '#156355', '#1e8a77', '#2bc7ac', '#33ebcb', '#a4fdf0'],
  vNetherite: ['#160814', '#231012', '#2f2122', '#3b393b', '#4f3c3e', '#5d565d', '#706770', '#867b86'],
  vLeather: ['#3d1c10', '#542716', '#893b25', '#9e492a', '#c65c35', '#d76b43'],
  vBone: ['#5e5e50', '#7b7e6b', '#a8a68c', '#cbc6a5', '#e8e5d2', '#fcfbed'],
  vQuartz: ['#4e403c', '#6f5d5a', '#897b73', '#b6a48e', '#d4caba', '#eae5de', '#f7f5f2'],
  vRuby: ['#3a0408', '#6e0a10', '#a8141a', '#d8282a', '#f2645a'],
  vPurpleWool: ['#24103a', '#3a1a5a', '#542886', '#6e38a8', '#8a54c4'],
  vGreenWool: ['#1c2a0c', '#2c4012', '#3e5818', '#546d1b', '#6c8a26'],
  vSoul: ['#0a4a54', '#13a5b5', '#4adbd8', '#a0fff6'],
  vLime: ['#2a4a0c', '#467a14', '#6aa81e', '#8ed23a', '#b6ec5a', '#e0fca0'],
  vLapis: ['#0e1e52', '#1d3a8a', '#2a52b8', '#3e74e0', '#6aa0f4', '#a8ccff'],
  vEmber: ['#5a1a08', '#9a2c0a', '#d24c12', '#f27c2a', '#ffb05a'],
  // ---- phase 6 weapons v4 (32px, harmonised)
  ironR: ['#0c0809', '#181012', '#26191b', '#362426', '#4a3134', '#604044', '#7c5458', '#9e6e70', '#c49a96'],
  leatherR: ['#1e0606', '#360c0c', '#561414', '#7a1e1c', '#9c2c26', '#bc4434'],
  brass: ['#3a2406', '#5e3c0c', '#8a5c16', '#b48224', '#d6a83c', '#eccc6c', '#faeab0'],
  steelC: ['#1a1d22', '#2a2f36', '#3e444d', '#565e68', '#727b86', '#949da8', '#bcc4cc', '#e6eaee'],
  gildOrange: ['#4a1e04', '#783208', '#a64c10', '#d06c1a', '#ec8e2c', '#f8b456', '#fdd894', '#fff2d2'],
  crystalB: ['#10285a', '#1a428a', '#2862b6', '#3c86d8', '#62aaee', '#92cdf8', '#c4e8fd', '#eefaff'],
  violetWrap: ['#1e0e2c', '#321848', '#4a2668', '#663888', '#8452a8'],
  ashWood2: ['#1c120a', '#2e1e12', '#44301c', '#5c4226', '#765632', '#926c40'],
  boneW: ['#4e4434', '#70664e', '#968a6c', '#bcb092', '#dcd2b6', '#f4eedc'],
  soulCyan: ['#0e4e62', '#167890', '#24a4ba', '#48cadc', '#8ae6f0', '#d0faff'],
  shellC: ['#463e2a', '#665c40', '#8c8058', '#b2a676', '#d0c698', '#e8e0bc', '#f8f4e2'],
  gunM: ['#121418', '#1e2126', '#2c3036', '#3c4148', '#50565e', '#6a7179', '#8a9199'],
  orbB: ['#0a2452', '#12387e', '#1c52ae', '#2e72d6', '#5496ee', '#8cc0fa', '#cce4ff'],
  // ---- phase 6 weapons v3 (card art)
  bladeSteel: ['#2a2e34', '#40464e', '#5a626c', '#78808a', '#9aa2ac', '#c0c7ce', '#e4e9ee'],
  lime: ['#2c4a06', '#46700c', '#6a9c14', '#94c822', '#bce640', '#e2fa8a'],
  tealGrip: ['#0c2224', '#163638', '#224e50', '#326a6a', '#468684'],
  crystal: ['#1a3e74', '#2a62a8', '#4290d2', '#6cb8ec', '#9ed6f8', '#cdeefe', '#f2fbff'],
  hotEdge: ['#5a0e04', '#9a1c06', '#d8380a', '#f86a1a', '#ffa040', '#ffd27a'],
  creamShell: ['#4e4632', '#6e6448', '#968a64', '#bcb086', '#d8cea4', '#ece4c4', '#faf6e6'],
  gunMetal: ['#16181c', '#24272c', '#35393f', '#4a4f56', '#62686f', '#80868d'],
  ashWood: ['#21140c', '#352214', '#4c321e', '#644428', '#7e5834', '#9a6e44'],
  // ---- phase 6 weapons
  steel: ['#22262d', '#343a44', '#4b535f', '#646e7b', '#828d99', '#a5afb9', '#cad1d8'],
  warmSteel: ['#2a1f1c', '#40302b', '#5a4640', '#776159', '#978177', '#b9a59a', '#d9c9be'],
  gripRed: ['#2c0a0a', '#4a1212', '#6e1c1a', '#922a24', '#b23c30', '#c95a48'],
  cloth2: ['#2a2018', '#43352a', '#5e4b3c', '#7a6450', '#957e66', '#b09a80'],
  venom: ['#14300e', '#22501a', '#357526', '#4f9a35', '#73bd4c', '#a3db74'],
  spectral: ['#1d4a5c', '#2c6f86', '#3f95ad', '#62b8cc', '#93d6e3', '#c4eef4', '#eafcff'],
  regalGold: ['#4a3208', '#6e4c0e', '#9a6e18', '#c4952a', '#ddb440', '#ecd06a', '#f8e9a8'],
  scytheBlade: ['#1f2228', '#30343c', '#464b55', '#5f6571', '#7c8390', '#a0a7b3', '#c7ccd5'],
  soulViolet: ['#1c1428', '#2e2142', '#46325e', '#61477c', '#7f62a0', '#a688c4', '#cdb6e6'],
  defectMetal: ['#1b2433', '#28364b', '#384b66', '#4b6383', '#627ea2', '#86a2c2', '#b3cbe2'],
  cyanGlow: ['#0f5a6e', '#178ba3', '#2bb8cf', '#5fdaea', '#a2f0f7', '#e2fdff'],
  boneOrange: ['#5a3418', '#7c4a24', '#a06434', '#c27e46', '#d89858', '#e8b478', '#f4d0a0'],
  nightJar: ['#0c0e24', '#151a3a', '#1f2650', '#2b3468', '#3a4582'],
  starGlow: ['#a8741a', '#d9a521', '#f2cf5b', '#ffe58f', '#fff6cc'],
  lightningOrb: ['#6a5a08', '#9a8810', '#c8b818', '#e6dc3c', '#f6f08a', '#fffde0'],
  frostOrb: ['#0e4a6c', '#1278a8', '#2ea4d4', '#56c8ec', '#94e4f6', '#dcf8ff'],
  // ---- phase 5 relics (v2: colours sampled from the STS2 icons)
  anchorBlue: ['#1d2c3d', '#283d53', '#334d66', '#3f5d79', '#4c6d8a', '#5b7d9a', '#7090aa', '#88a5bc'],
  rope: ['#4f4a3a', '#655f4c', '#7c7660', '#938d74', '#a8a288', '#bab69c', '#cac7b0'],
  vajraGold: ['#4a3a10', '#6e5a1c', '#9a8030', '#c4a640', '#d8b848', '#e6cb64', '#eedc84', '#f8efb8'],
  stoneSts: ['#2a3e40', '#3a5454', '#527070', '#6e8c8c', '#8ea6a6', '#adc6c6', '#cce4e4', '#eaf8f8'],
  sack: ['#33271a', '#4a3a28', '#6c5a40', '#8e7c5e', '#ad9676', '#c4aa88', '#d9c2a2', '#ecdcc4'],
  marble: ['#173217', '#264a26', '#386238', '#4f7f4f', '#6c9e6c', '#92c092', '#c4e2c4'],
  maskRed: ['#3c1212', '#5e1e20', '#8a2c2e', '#b03c3c', '#c84a4a', '#dc5e5e', '#ec7c78', '#f8aaa2'],
  stsBlood: ['#2c0606', '#561212', '#7e1c1a', '#9c2620', '#b82e28', '#cc4636', '#de6a52', '#ee9478'],
  cork: ['#5e2406', '#94420a', '#c8650f', '#ec8a16', '#f8a530', '#fcc566', '#ffe2a4'],
  vialGlass: ['#5c7068', '#7c928a', '#9cb2aa', '#bcd0c8', '#d4e4dc', '#eaf4f0'],
  nibGold: ['#4a3808', '#705810', '#94761a', '#b49420', '#c8a828', '#ddbe3c', '#ecd25c', '#f8e898'],
  slate: ['#1a2230', '#26324a', '#33415c', '#435474', '#58698a', '#7383a2'],
  wood: ['#33240f', '#4e3a1c', '#6a5432', '#87704a', '#a48e66', '#c0ac86'],
  hourglassGlass: ['#4f8288', '#68a8ac', '#88c8c8', '#a8dcdc', '#c8ecec', '#e6f8f8'],
  mercury: ['#33363f', '#4f5360', '#6e7282', '#8e92a2', '#b0b4c2', '#d2d5de', '#eff1f5'],
  shurikenSteel: ['#222c2c', '#334040', '#435454', '#556868', '#6a8080', '#809a9a', '#a2baba', '#cadcdc'],
  lizardGreen: ['#26361a', '#3e5228', '#58703a', '#75904f', '#8eaa66', '#a6c27e', '#bed69a', '#dcecc0'],
  flesh: ['#3e0f1a', '#6a2032', '#963648', '#b2505e', '#c86e7a', '#dc98a0', '#efc6ca'],
  bronzeFacet: ['#3e2410', '#5e3a1c', '#80522a', '#a06838', '#b87c48', '#c89858', '#dab070', '#ecca88'],
  iron: ['#202328', '#343940', '#4c525b', '#686f79', '#88909a', '#adb4bc', '#d6dbe0'],
  gold: ['#4a2c05', '#7a4c0a', '#a87212', '#d39a1e', '#eebd38', '#fbdc6e', '#fff1b0'],
  pebble: ['#262b31', '#3a4048', '#525962', '#6c747e', '#8a929b', '#aab1b9', '#cdd2d8'],
  cloth: ['#3a2414', '#5a3a20', '#7c552f', '#9e7341', '#bd9258', '#d7b178', '#ecd3a4'],
  lacquer: ['#2e0608', '#520b0e', '#7c1216', '#a81b1d', '#cf2c25', '#e85138', '#f78a62'],
  bronze: ['#2e1a08', '#4d2d0e', '#704417', '#965e22', '#b97d33', '#d6a04f', '#ecc47e'],
  glass: ['#4d6870', '#6a8790', '#8aa6ae', '#aac3ca', '#c8dde2', '#e2f0f2'],
  redBone: ['#3a0c0c', '#5e1616', '#862424', '#ab3a33', '#c95a4d', '#e0857a', '#f2b4aa'],
  lizard: ['#14260c', '#1f3d12', '#2d5a1a', '#3f7a24', '#579a33', '#79b84c', '#a5d67a'],
  leather: ['#240c0b', '#3d1512', '#5c211b', '#7c2f25', '#9c4232', '#b95a45', '#d27c62'],
  bloodGlass: ['#1c0207', '#38050d', '#5c0915', '#850f1d', '#ad1824', '#d22c2c', '#ec5244', '#fb8a72'],
  fire: ['#8a1a10', '#b02c10', '#d64814', '#ef6c1e', '#fa922e', '#ffb850', '#ffd884'],
  fireCore: ['#f59a32', '#ffbc4c', '#ffd56e', '#ffe89c', '#fff6cc'],
  cap: ['#2f333b', '#4b515c', '#6f7683', '#989fab', '#c3c9d2', '#eef1f5'],
  wolframite: ['#0e0c0a', '#1a1714', '#28231e', '#38312a', '#4b4239', '#615649', '#7d7262'],
  wolframiteMetal: ['#2a211b', '#3a2e26', '#4c3e33', '#5f5046', '#76706c', '#959aa3', '#bcc5d1', '#e2e9f2'],   // grey-brown with a sub-metallic steel sheen
  oriGem: ['#06200d', '#0d3a18', '#155a26', '#1f7b36', '#2f9e4c', '#53c46d', '#93e4a2', '#d9fbe0'],
  sulfurCrystal: ['#2e2303', '#523f06', '#7d640b', '#ad9211', '#d4b81c', '#ecd447', '#f9ec8a', '#fffbd8'],
  sulfur: ['#3a2d04', '#5f4b07', '#88700c', '#b39612', '#d8b91e', '#eed444', '#f8e97e', '#fffac8'],
  lavaGlow: ['#5a1406', '#9a2a08', '#d0460c', '#f06c14', '#fb9e2e', '#ffd055', '#fff4b4'],
  lavaRock: ['#0d0a0b', '#191314', '#251d1f', '#33292b', '#43373a', '#55474a'],
  heatedRock: ['#1c0a07', '#33120b', '#4e1b0f', '#6c2612', '#8c3416', '#ab4a1e'],
  tube: ['#0b1d42', '#13306a', '#1c4796', '#2862c0', '#3d82dc', '#63a6ee', '#9cccf8', '#d6ecff'],
  dust: ['#4e2a03', '#7a4506', '#a8650b', '#d48d16', '#efb532', '#fbd768', '#fff2b4'],
  berry: ['#2a020b', '#4a0614', '#70091d', '#980f25', '#be1a2a', '#dc2e31', '#ee5a45', '#fb8f72'],
  seed: ['#a8741a', '#c9921f', '#e2b232', '#f2cc4e', '#fbe27a', '#fff1a8', '#fff8d0', '#fffde8'],
  leaf: ['#0f2c10', '#184718', '#226420', '#33832b', '#4ca23a', '#73c055', '#a5dc85'],
  pear: ['#3d3a0e', '#5f5c17', '#868320', '#aba92f', '#cac849', '#e0df75', '#f1f0a8', '#fdfde0'],
  pearWarm: ['#4a330c', '#735016', '#9c7220', '#c4962c', '#e2b947', '#f2d672', '#faeaa6', '#fffbe0'],
  stem: ['#24140a', '#3d2412', '#5a381c', '#7a5029', '#9c6c3c'],
  mangoY: ['#4e3604', '#7a560a', '#a87c10', '#d3a518', '#ecc632', '#f8e06a', '#fff3b0'],
  mangoG: ['#4a3a06', '#74600e', '#a08a16', '#c6b526', '#dcd440', '#eee878', '#fbf6b8'],   // yellow with a faint green cast
  mangoO: ['#3d1203', '#662206', '#93380b', '#c05410', '#e2741b', '#f49b3e', '#fcc47a'],
  roast: ['#2a1007', '#451c0b', '#662d12', '#8a401b', '#ab5828', '#c97640', '#e39c66', '#f5c79a'],
  cut: ['#5a1f22', '#86333a', '#b04f58', '#d27780', '#eaa3a8', '#fbd2d2'],
  bone: ['#5e5340', '#857a62', '#ada188', '#cfc5ab', '#e9e2cd', '#fffaf0'],
  amethyst: ['#21143a', '#382360', '#523487', '#6d48ad', '#8d63cf', '#b08ae8', '#d3b6fb', '#f1e4ff'],
  blood: ['#26030a', '#480711', '#720c1a', '#9c1422', '#c4222a', '#e3413a', '#f46a55', '#fb9a86'],
  flameO: ['#6b2004', '#a23d08', '#d4600f', '#f2862a', '#ffaa4a', '#ffd07a'],
  flameY: ['#c98a10', '#eab21e', '#ffd545', '#ffec85', '#fffad0'],
};
const shift = (ramp, by) => ramp.map((_, i) => ramp[Math.max(0, Math.min(ramp.length - 1, i + by))]);

const item = (name, rows, regions, flat, extra = {}) =>
  ({ kind: 'map', name, out: 'item/' + name + '.png', rows, regions, flat: flat || {}, outline: 'tint', ...extra });
const reshade = (name, out, src, select, ramp, extra = {}) => ({ kind: 'reshade', name, out, src, select, ramp, ...extra });

// ------------------------------------------------------------------ geometry helpers (pixel centres)
/** Build 16 rows from a function (x, y) → letter or '.'. Coordinates are pixel centres (0.5 … 15.5). */
const draw = fn => Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => fn(x + 0.5, y + 0.5) || '.').join(''));
const circ = (x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) - r;                     // signed distance to a circle
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k / 4; };
/** Position relative to a segment A→B: t (0..1 along), d (distance to the segment), side (sign across). */
const seg = (x, y, ax, ay, bx, by) => {
  const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy;
  const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / L2));
  return { t, d: Math.hypot(x - (ax + vx * t), y - (ay + vy * t)), side: Math.sign((x - ax) * vy - (y - ay) * vx) };
};
/** Distance to a polyline [[x,y], ...]. */
const poly = (x, y, pts) => { let d = 99; for (let i = 0; i + 1 < pts.length; i++) d = Math.min(d, seg(x, y, ...pts[i], ...pts[i + 1]).d); return d; };
/** Deterministic noise in [0,1) for integer cells. */
const rnd = (a, b, salt = 0) => { let h = (a * 374761393 + b * 668265263 + salt * 2246822519) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/** Natural scatter: one candidate per cell at a random spot, some cells skipped (strawberry seeds). */
function scatter(cell, keep, salt) {
  const pts = new Set();
  for (let cy = 0; cy < 16; cy += cell) for (let cx = 0; cx < 16; cx += cell) {
    if (rnd(cx, cy, salt) > keep) continue;
    pts.add((cx + Math.floor(rnd(cx, cy, salt + 1) * cell)) + ',' + (cy + Math.floor(rnd(cx, cy, salt + 2) * cell)));
  }
  return pts;
}
/**
 * Smoothing pass for organic silhouettes: removes lone pixels sticking out (≤1 filled neighbour) and fills notches
 * (empty pixels with ≥3 filled neighbours, using the most common neighbouring letter). Two passes.
 */
function smooth(rows) {
  let g = rows.map(r => [...r]);
  for (let pass = 0; pass < 2; pass++) {
    const n = g.map(r => r.slice());
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const nb = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => (g[y + dy] && g[y + dy][x + dx]) || '.').filter(v => v !== '.');
      if (g[y][x] !== '.' && nb.length <= 1) n[y][x] = '.';
      else if (g[y][x] === '.' && nb.length >= 3) {
        const count = {}; nb.forEach(v => count[v] = (count[v] || 0) + 1);
        n[y][x] = Object.keys(count).sort((p, q) => count[q] - count[p])[0];
      }
    }
    g = n;
  }
  return g.map(r => r.join(''));
}
/** Evenly spread points: staggered lattice (every other row offset by half a step) with a small random jitter. */
function lattice(step, salt) {
  const pts = new Set();
  for (let row = 0, y = 1; y < 16; row++, y += step * 0.75) {
    for (let x = (row % 2) * step / 2; x < 16; x += step) {
      const jx = Math.round(x), jy = Math.round(y);
      pts.add(jx + ',' + jy);
    }
  }
  return pts;
}
/** Smooth teardrop: round bottom flowing into a soft point (no straight edges). */
const teardrop = (x, y, cx, cy, r, tipX, tipY, k = 2.2) => {
  const s = seg(x, y, cx, cy, tipX, tipY);
  return smin(circ(x, y, cx, cy, r), s.d - r * 0.92 * Math.pow(1 - s.t, 1.6), k);
};

// ------------------------------------------------------------------ shapes
/** Strawberry: a round, full berry narrowing to a rounded tip at the bottom-left; calyx top-right; seeds evenly spread. */
const SEEDS = lattice(3, 11);
/* Strawberry: hand-drawn small berry (~9x11, smaller than the vanilla apple); seeds evenly spread, calyx top-right. */
const STRAWBERRY = [
  '................',
  '................',
  '................',
  '..........G.G...',
  '........RGGGG...',
  '......RRRRRGGG..',
  '.....RRKRRRRG...',
  '.....RRRRRKRR...',
  '.....RKRRRRRR...',
  '.....RRRRKRRR...',
  '......RKRRRR....',
  '......RRRRR.....',
  '.......RRK......',
  '........R.......',
  '................',
  '................',
];
/** Pear: a full lower bulb flowing into a shorter neck, leaning right; stem and leaf on top. */
const PEAR = smooth(draw((sx, sy) => {
  const x = 8.0 + (sx - 8.0) / 0.84, y = 8.0 + (sy - 8.6) / 0.84;   // 84%: a bit smaller than the vanilla apple
  if (seg(x, y, 10.0, 3.0, 11.0, 0.6).d < 0.7) return 'S';
  const leaf = seg(x, y, 10.8, 2.0, 14.4, 1.4);
  if (leaf.d < 1.0 + 0.3 * Math.sin(leaf.t * Math.PI) && x > 11) return 'L';
  return smin(circ(x, y, 7.2, 10.0, 5.5), circ(x, y, 9.6, 5.0, 3.3), 3.6) < 0.15 ? 'P' : null;
}));
/** Mango: full, lying on the diagonal; body blends from yellow (stem end) to orange; only the leaf is green. */
const MANGO = smooth(draw((sx, sy) => {
  const x = 8.0 + (sx - 8.0) / 0.84, y = 8.0 + (sy - 8.4) / 0.84;
  if (seg(x, y, 11.8, 3.6, 12.8, 1.8).d < 0.7) return 'S';
  const leaf = seg(x, y, 12.0, 2.6, 7.4, 1.5);
  if (leaf.d < 0.35 + 1.25 * Math.sin(Math.pow(leaf.t, 0.8) * Math.PI)) return 'L';
  const cx = 7.6, cy = 8.8, dx = x - cx, dy = y - cy;
  const p = (dx - dy) / Math.SQRT2, q = (dx + dy) / Math.SQRT2;
  const b = q < 0 ? 4.8 : 5.5;
  return (p / 7.1) ** 2 + (q / b) ** 2 <= 1 ? 'M' : null;
}));
/** Amethyst Aubergine: an aubergine grown of amethyst — body textured like vanilla amethyst, crystal calyx. */
const AUBERGINE = draw((x, y) => {
  if (seg(x, y, 12.0, 3.6, 13.6, 1.4).d < 0.75) return 'S';
  const calyx = Math.hypot(x - 11.3, y - 4.7) < 2.3 || seg(x, y, 11.3, 4.7, 8.6, 5.6).d < 0.75 || seg(x, y, 11.3, 4.7, 10.4, 7.8).d < 0.75;
  const d = smin(circ(x, y, 10.4, 5.6, 2.6), circ(x, y, 6.0, 10.1, 5.1), 4.2);
  if (calyx && d < 1.0) return 'G';
  return d < 0.2 ? 'A' : null;
});
/** Meat on the Bone (STS2): a full roast centred on a bone that runs through it; short knuckles stick out at both ends. */
const MEAT = smooth(draw((x, y) => {
  const cx = 8.0, cy = 8.0, dx = x - cx, dy = y - cy;
  const p = (dx - dy) / Math.SQRT2, q = (dx + dy) / Math.SQRT2;            // p along the bone (top-right +), q across
  const meat = (p / 5.6) ** 2 + (q / 5.1) ** 2 <= 1;
  if (meat) return (circ(x, y, 4.3, 11.7, 1.5) < 0 || circ(x, y, 11.7, 4.3, 1.5) < 0) ? 'P' : 'M';
  const knobs = [[2.1, 12.4], [3.6, 13.9], [12.4, 2.1], [13.9, 3.6]].some(([kx, ky]) => circ(x, y, kx, ky, 1.25) < 0);
  if (knobs || seg(x, y, 2.8, 13.2, 13.2, 2.8).d < 0.95) return 'B';
  return null;
}));
/**
 * Burning Blood (STS2): a glass-like teardrop of blood, point upwards; inside, a fire of three flame tongues rises from
 * the bottom with a bright core. A curved glint on the upper-left sells the glassy surface. No straight edges.
 */
const BURNING_BLOOD = smooth(draw((x, y) => {
  // hand-set width per row (symmetric): sharp tip, sides widening evenly, widest at ~2/3 height, round bottom
  const DROP_W = [0, 2, 2, 4, 4, 6, 8, 8, 10, 10, 10, 10, 8, 8, 4, 0];
  const drop = Math.abs(x - 8.0) - DROP_W[Math.floor(y)] / 2;
  if (drop >= 0.25) return null;
  const ang = Math.atan2(y - 9.3, x - 8.0);
  if (drop < -0.6 && drop > -1.5 && ang > 2.3 && ang < 3.3) return 'l';                       // soft light, left rim
  const flames = Math.min(teardrop(x, y, 6.2, 11.8, 1.7, 5.6, 8.0, 1.4), teardrop(x, y, 8.0, 11.4, 2.3, 8.0, 5.6, 1.6),
    teardrop(x, y, 9.8, 11.8, 1.7, 10.4, 8.0, 1.4));
  if (drop < -0.6 && flames < 0.5) {
    const depth = Math.max(0, Math.min(1, (0.5 - flames) / 1.9)), low = Math.max(0, Math.min(1, (y - 5) / 8));
    const heat = depth * (0.5 + 0.5 * low);
    const BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
    const lv = Math.floor(heat * 6.99 + (BAYER4[Math.floor(y) % 4][Math.floor(x) % 4] + 0.5) / 16 - 0.5);
    return String(Math.max(0, Math.min(6, lv)));
  }
  return 'R';
}));
/** Tungsten Rod (STS2): a pale blue-steel cylinder lying on the diagonal, its round end face at the bottom-left. */
const TUNGSTEN_ROD = draw((x, y) => {
  const vx = 9.6, vy = -9.6, ax = 3.2, ay = 12.8;
  const raw = ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy);
  const s2 = seg(x, y, ax, ay, ax + vx, ay + vy);
  if (s2.d >= 1.9) return null;
  return raw < 0.0 ? 'E' : 'B';
});
/** Brimstone (Ironclad): a cluster of sulphur crystals in the vanilla quartz style, with its own arrangement. */
const BRIMSTONE = (() => {
  const g = Array.from({ length: 16 }, () => Array(16).fill('.'));
  // [left column, width at the base, top row, bottom row, lean (columns the tip is shifted; - leans left), width at the top]
  const crystals = [[5, 6, 1, 12, 1, 4], [8, 4, 4, 13, 3, 3], [4, 4, 5, 13, -3, 3], [3, 3, 10, 14, -2, 3], [10, 3, 9, 14, 2, 3]];
  for (const [x0, wb, top, bot, lean, wt] of crystals) {
    const cells = [];
    for (let y = top; y <= bot; y++) {
      const k = (bot - y) / (bot - top), off = Math.round(k * lean), tip = y - top;
      const w = Math.round(wb + (wt - wb) * k), left = Math.round(x0 + (wb - w) / 2) + off;
      const a = left + (tip === 0 ? 1 : 0), b = left + w - 1 - (tip === 0 ? 1 : 0);
      for (let x = a; x <= b; x++) cells.push([x, y, x - left, tip, y === bot, w]);
    }
    const inside = new Set(cells.map(([x, y]) => x + ',' + y));
    for (const [x, y] of cells) for (const [dx, dy] of [[0, -1], [1, 0], [-1, 0], [0, 1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < 16 && ny < 16 && !inside.has(nx + ',' + ny)) g[ny][nx] = 'o';
    }
    for (const [x, y, col, tip, bottom, w] of cells) {
      let c = col === 0 ? '8' : col < w / 2 ? '9' : col === w - 1 ? '2' : '6';
      if (tip <= 1 && col < w - 1) c = '9';
      if (tip === 2 && col === w - 1) c = '6';
      if (bottom) c = col < w / 2 ? '6' : '1';
      g[y][x] = c;
    }
  }
  return g.map(r => r.join(''));
})();
/** Galactic Dust (STS2)/** Galactic Dust (STS2): a blue tube with a silver cap, pouring a cone-shaped pile of golden star dust. */
const GALACTIC_DUST = draw((x, y) => {
  const s = seg(x, y, 5.6, 10.0, 12.8, 2.8);
  if (s.d < 1.9) return s.t > 0.84 ? 'C' : s.t < 0.07 ? 'M' : 'B';
  const pile = smin(circ(x, y, 4.2, 11.2, 1.8), Math.max(y - 15.4, Math.abs(x - 4.2) - (y - 9.6) * 0.95), 1.6);
  if (pile < 0.1) return 'G';
  if ((x > 8 && x < 9 && y > 12 && y < 13) || (x > 1 && x < 2 && y > 9 && y < 10)) return 'y';
  return null;
});
/** Lava Rock (STS2): a lumpy dark rock split by cracks; lava glows in the cracks and runs out of the bottom. */
const CRACKS = [
  [[4.2, 4.8], [7.0, 7.4], [6.6, 10.2], [8.4, 13.0]],
  [[7.0, 7.4], [10.4, 8.2], [12.4, 10.6]],
  [[10.4, 8.2], [11.0, 4.6]],
];
const LAVA_ROCK = draw((x, y) => {
  const rock = smin(smin(circ(x, y, 7.6, 8.4, 5.3), circ(x, y, 10.4, 6.4, 3.6), 2.5), circ(x, y, 5.2, 10.4, 3.5), 2.5);
  const drip = Math.min(seg(x, y, 8.4, 13.0, 8.6, 15.0).d - 0.55, circ(x, y, 8.7, 14.9, 0.75),
    seg(x, y, 12.4, 10.6, 12.6, 12.6).d - 0.5);
  const crack = Math.min(...CRACKS.map(c => poly(x, y, c)));
  if (rock < 0.2) return crack < 0.55 ? 'L' : crack < 1.4 ? 'H' : 'R';
  return drip < 0.15 ? 'L' : null;
});
const LAVA_SHARD = draw((x, y) => {
  const rock = smin(seg(x, y, 4.0, 12.0, 11.4, 4.6).d - 3.0 * (0.55 + 0.45 * Math.sin(seg(x, y, 4.0, 12.0, 11.4, 4.6).t * Math.PI)), circ(x, y, 7.4, 8.6, 2.6), 2.0);
  const crack = poly(x, y, [[9.6, 4.8], [7.6, 8.2], [8.4, 11.2]]);
  const drip = Math.min(seg(x, y, 8.4, 11.2, 8.6, 14.2).d - 0.5, circ(x, y, 8.7, 14.0, 0.7));
  if (rock < 0.2) return crack < 0.55 ? 'L' : crack < 1.4 ? 'H' : 'R';
  return drip < 0.15 ? 'L' : null;
});

/**
 * Ore = vanilla ore of the same kind, deposits mirrored and/or flipped onto the host rock, recoloured. Deposits are the
 * pixels that differ from the plain host rock, which keeps each deposit's darker rim. Mirroring/flipping keeps vanilla's
 * spacing from the block edges (a wrap-around shift pushed deposits onto the edges).
 */
const ore = (name, src, host, bg, ramp, flips, extra = {}) =>
  reshade(name, 'block/' + name + '.png', src, 'diff', ramp, { diffBase: host, bg, gamma: 0.85, ...flips, ...extra });


// ================================================================== phase 5: relic icons
/** Distance to a polyline plus the arc-length position t (0 at the first point, 1 at the last). */
function pathAt(x, y, pts) {
  let total = 0; const lens = [];
  for (let i = 0; i + 1 < pts.length; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); lens.push(l); total += l; }
  let best = { d: 99, t: 0 }, acc = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const g = seg(x, y, ...pts[i], ...pts[i + 1]);
    if (g.d < best.d) best = { d: g.d, t: (acc + g.t * lens[i]) / total };
    acc += lens[i];
  }
  return best;
}
/** Rotated frame: p along the direction (deg, 0 = right, measured clockwise on screen), q across. */
const frame = (x, y, cx, cy, deg) => { const a = deg * Math.PI / 180, dx = x - cx, dy = y - cy; return { p: dx * Math.cos(a) + dy * Math.sin(a), q: -dx * Math.sin(a) + dy * Math.cos(a) }; };

/** Like drawAA but on an N x N grid; fn still gets 16-unit coordinates (so one design renders at 16, 18 or 32 px). */
const drawAAAt = (N, fn, n = 4, th = 0.4) => Array.from({ length: N }, (_, y) => Array.from({ length: N }, (_, x) => {
  const count = {}; let hit = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const c = fn((x + (i + 0.5) / n) * 16 / N, (y + (j + 0.5) / n) * 16 / N);
    if (c) { hit++; count[c] = (count[c] || 0) + 1; }
  }
  if (hit / (n * n) < th) return '.';
  return Object.keys(count).sort((a, b) => count[b] - count[a])[0];
}).join(''));
/** Anti-aliased silhouette: n×n sub-samples per pixel; filled when the coverage reaches th (keeps thin diagonals whole). */
const drawAA = (fn, n = 4, th = 0.38) => Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => {
  const count = {}; let hit = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const c = fn(x + (i + 0.5) / n, y + (j + 0.5) / n);
    if (c) { hit++; count[c] = (count[c] || 0) + 1; }
  }
  if (hit / (n * n) < th) return '.';
  return Object.keys(count).sort((a, b) => count[b] - count[a])[0];
}).join(''));
/** Nearest point on a polyline and the signed side (+ = right of the walking direction, screen coords). */
function pathSide(x, y, pts) {
  let best = { d: 99, side: 0, t: 0 }, total = 0, acc = 0;
  const lens = []; for (let i = 0; i + 1 < pts.length; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); lens.push(l); total += l; }
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy;
    const u = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / L2));
    const d = Math.hypot(x - (ax + vx * u), y - (ay + vy * u));
    if (d < best.d) best = { d, side: Math.sign(vx * (y - ay) - vy * (x - ax)), t: (acc + u * lens[i]) / total };
    acc += lens[i];
  }
  return best;
}
/** Rotate a point about the icon centre (deg clockwise on screen) — used to tilt upright designs. */
const rot = (x, y, deg, cx = 8, cy = 8) => { const a = deg * Math.PI / 180, dx = x - cx, dy = y - cy; return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)]; };

/** Anchor (common): STS2's anchor on the diagonal — ring top-right, rope-wrapped stock, arms and crown bottom-left (traced). */
const ANCHOR = [
  '................',
  '................',
  '..........AAA...',
  '..........A.A...',
  '.......RR.AAA...',
  '...A....RRA.....',
  '..AA.....RRr....',
  '..AA...AA.Rr....',
  '..AA..AA........',
  '...AAAAA........',
  '...AAAA.....A...',
  '....AAAA..AAA...',
  '....AAAAAAAAA...',
  '....AA.AAAAA....',
  '................',
  '................',
];
/** Vajra (common): STS2's pale-gold vajra — ribbed central bead, and at each end a spike flanked by two curling prongs. */
/* hand-toned: h highlight, l lit edge, m mid, s shaded edge, d collar band (tools: see docs/design/art_style.md 97) */
const VAJRA = [
  '................',
  '..............l.',
  '..........llll..',
  '.........ls.ls..',
  '.........lml.l..',
  '.........mmmls..',
  '.......hhddss...',
  '......hmms......',
  '......hmms......',
  '...llmdss.......',
  '..lsmmd.........',
  '..l.lms.........',
  '..ll.ls.........',
  '..lsls..........',
  '.l..............',
  '................',
];
/** Oddly Smooth Stone (common): a big pale blue-grey river pebble, egg-shaped and polished. */
const SMOOTH_STONE = draw((x, y) => {
  const { p, q } = frame(x, y, 8.0, 8.3, -24);
  return (p / 6.8) ** 2 + (q / 5.0) ** 2 <= 1 ? 'S' : null;
});

/** Bag of Marbles (common): a beige sack lying on its side, green marbles rolling out of its open mouth. */
const MARBLES = draw((x, y) => {
  if (circ(x, y, 2.9, 12.9, 1.5) < 0) return 'M';
  if (circ(x, y, 6.2, 13.5, 1.45) < 0) return 'N';
  const mouth = ((x - 4.0) / 1.5) ** 2 + ((y - 8.9) / 2.3) ** 2;
  if (mouth <= 0.32) return 'I';
  if (mouth <= 1) return 'C';
  if (seg(x, y, 5.7, 7.2, 6.5, 10.2).d < 0.6) return 'T';
  const { p, q } = frame(x, y, 9.9, 7.0, -28);
  if ((p / 5.3) ** 2 + (q / 4.4) ** 2 <= 1) return 'C';
  if (seg(x, y, 4.6, 9.0, 6.4, 8.4).d < 1.5) return 'C';
  return null;
});

/** Red Mask (common): STS2's beaked red mask — hooked crest, side flaps, beak down-left, eye holes low on the face (traced). */
const RED_MASK = [
  '................',
  '......LLL.......',
  '.....LLLLL......',
  '.....L.LLLL.....',
  '.......LLLL.....',
  '.L.....LLLL.....',
  '..L...LLLLL..L..',
  '..LLLLLLLLL..LL.',
  '..LLLLLLLLLLLLL.',
  '..LLEELLLLLLLLL.',
  '...LEELLEELLLL..',
  '....LLLLEELLL...',
  '....LLLLLLL.....',
  '....LL..........',
  '....L...........',
  '................',
];
/** Bronze Scales (common): three faceted bronze scales (STS2), lit from the upper left. Facets a–d are flat tones. */
const BRONZE_SCALES = (() => {
  const g = Array.from({ length: 16 }, () => Array(16).fill('.')), owner = Array.from({ length: 16 }, () => Array(16).fill(-1));
  // [centre x, centre y (widest point), half width, top y, bottom y]  — back to front
  const scales = [[11.9, 8.4, 3.9, 3.2, 12.8, 18], [3.9, 10.2, 3.7, 5.2, 14.5, -12], [7.6, 8.0, 5.0, 0.9, 14.9, 10]];
  scales.forEach(([cx, cy, hw, ty, by, tilt], i) => {
    for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < 16; xx++) {
      const [x, y] = rot(xx + 0.5, yy + 0.5, -tilt, cx, cy);
      const v = Math.abs(x - cx) / hw + (y < cy ? (cy - y) / (cy - ty) : (y - cy) / (by - cy));
      if (v > 1) continue;
      g[yy][xx] = x < cx ? (y < cy ? 'a' : 'c') : (y < cy ? 'b' : 'd');
      owner[yy][xx] = i;
    }
  });
  // a darker seam where a front scale overlaps one behind it
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (owner[y][x] < 0) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const o = (owner[y + dy] || [])[x + dx];
      if (o !== undefined && o >= 0 && o < owner[y][x]) { g[y][x] = 'o'; break; }
    }
  }
  return g.map(r => r.join(''));
})();

/** Blood Vial (common): a vanilla-sized potion bottle of blood with STS2's orange-wrapped cork. */
const BLOOD_VIAL = [
  '................',
  '..........kk....',
  '.......KKKk.....',
  '......GKKKG.....',
  '......GGGGG.....',
  '.......GGG......',
  '.......GGG......',
  '......GBBBG.....',
  '.....GBBBBBG....',
  '....GBBBBBBBG...',
  '....GBBBBBBBG...',
  '....GBBBBBBBG...',
  '....GBBBBBBBG...',
  '.....GBBBBBG....',
  '......GGGGG.....',
  '................',
];
/** Red Skull (common, Ironclad): STS2's red skull in 3/4 view — sockets, nose, open jaw with upper and lower teeth (traced). */
const RED_SKULL = [
  '................',
  '................',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBBBBBBBBB...',
  '...BBBBBBBBBB...',
  '...BEEBBBBEEB...',
  '...BEEEBBEEEB...',
  '...BBEBBBBEBB...',
  '....BBBEEBBB....',
  '.....BBBBBB.....',
  '.....TETETT.....',
  '......BBBB......',
  '................',
  '................',
  '................',
];
/** Pen Nib (uncommon): STS2's long gold nib — lit upper face, shaded lower face, slit and breather hole, angled back end. */
const PEN_NIB = drawAA((x, y) => {
  const { p, q } = frame(x, y, 1.5, 14.5, -45);
  if (p < 0 || p > 18.4 - Math.max(0, q) * 0.9) return null;
  const half = p < 11.0 ? 0.25 + 2.9 * Math.pow(p / 11.0, 0.8) : 3.15;
  if (Math.abs(q) > half) return null;
  if (Math.hypot(p - 7.8, q) < 0.95) return 'E';
  if (p > 0.9 && p < 7.4 && Math.abs(q) < 0.36) return 'E';
  return q < 0 ? 'G' : 'H';
});
/** Mercury Hourglass (uncommon): STS2's tilted hourglass in 3/4 view — two wooden discs (top face visible), cyan glass, quicksilver. */
const HOURGLASS = drawAA((sx, sy) => {
  const [x, y] = rot(sx, sy, -20);
  const dx = Math.abs(x - 8.0);
  if (y > 1.6 && y < 2.6 && dx < 4.5) return 'W';
  if (y >= 2.6 && y < 3.1 && dx < 4.3) return 'w';
  if (y > 13.4 && y < 14.4 && dx < 4.5) return 'W';
  if (y > 12.9 && y <= 13.4 && dx < 4.3) return 'w';
  if (y < 3.1 || y > 12.9) return null;
  const w = 0.6 + 3.1 * Math.min(1, Math.abs(y - 8.0) / 4.9);
  if (dx > w) return null;
  if ((y > 3.9 && y < 6.4 && dx < w - 0.7) || (dx < 0.45 && y > 8.0) || (y > 10.9 && dx < w - 0.7)) return 'Q';
  return 'g';
});
/** Shuriken (rare): STS2's grey-teal four-pointed star, tilted, blades slightly curved; lit face L, shaded face K, ringed hole. */
const SHURIKEN = drawAA((x, y) => {
  const { p, q } = frame(x, y, 8.0, 8.0, 32), rr = Math.hypot(p, q);
  if (rr < 1.0) return null;
  const th = Math.atan2(q, p) - 0.18 * Math.min(1, rr / 7);
  const axisA = Math.round(th / (Math.PI / 2)) * (Math.PI / 2), across = Math.abs(rr * Math.sin(th - axisA));
  if (rr > 2.4 && across > 2.2 * (1 - (rr - 1.0) / 7.8)) return null;   // triangular blades tapering to points
  if (rr > 8.8) return null;
  if (rr < 2.0) return 'D';
  const axis = Math.round(th / (Math.PI / 2)) * (Math.PI / 2);
  return Math.sin(th - axis) < 0 ? 'L' : 'K';
}, 4, 0.42);
/** Lizard Tail (rare): STS2's pale-green tail with a spiked ridge; thick in the middle, tapering to a thin tip; the cut end drips blood. */
const LIZARD_TAIL = [
  '................',
  '.......S..S.....',
  '..PPP.LSLLSLS...',
  '.PPPPLLLLLLLLL..',
  '.PCCPLLLLLLLLLS.',
  '.PCCPLLLLLLLLLL.',
  '.PPPPL.....LLLLS',
  '..BP.......LLLL.',
  '..B........LLLLS',
  '..B........LLLL.',
  '..BB......LLLLL.',
  '.........LLLLL..',
  '....LLLLLLLLLL..',
  '..LLLLLLLLLLL...',
  '.LLLLL..........',
  '................',
];

// ================================================================== phase 6: weapons (v2, character styles)
/** Points of a path offset sideways by a wave (snake blade). */
const wave = (ax, ay, bx, by, amp, cycles, n = 24) => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n, nx = -(by - ay), ny = bx - ax, L = Math.hypot(nx, ny), o = amp * Math.sin(t * Math.PI * cycles) * (1 - t * 0.5);
  return [ax + (bx - ax) * t + nx / L * o, ay + (by - ay) * t + ny / L * o];
});

/** Ironclad — Morning Star: a heavy, reddish black iron ball with big spikes and blood on it, chain, red-wrapped haft. */
/* (16px version replaced by the 32px one below) */

/** Ironclad — Bloodletting Dagger: black blade with a blood-filled groove, dark guard, red-wrapped grip, ruby pommel. */
const BLOODLETTING_DAGGER = drawAA((x, y) => {
  const bl = seg(x, y, 7.4, 8.6, 14.0, 2.0);
  if (bl.d < 1.6 - 1.2 * bl.t) return bl.d < 0.4 && bl.t > 0.1 && bl.t < 0.75 ? 'F' : 'B';
  if (seg(x, y, 4.8, 7.0, 9.0, 11.2).d < 0.9) return 'G';
  if (seg(x, y, 6.6, 9.4, 3.2, 12.8).d < 0.95) return Math.floor((x + y) * 0.9) % 2 ? 'H' : 'h';
  if (circ(x, y, 2.5, 13.5, 1.15) < 0) return 'P';
  if (circ(x, y, 13.5, 5.5, 0.5) < 0 || circ(x, y, 13.5, 7.5, 0.5) < 0) return 'F';
  return null;
});

/** Ironclad — Sword Boomerang: a V-shaped throwing blade of black iron, keen pale edges, blood-red wrap at the elbow. */
/* (16px version replaced by the 32px one below) */

/** Silent — Poisoned Dagger: a wavy snake blade of green-tinted steel dripping pale venom; bandage and green cloth grip. */
const KRIS = wave(7.4, 8.6, 13.8, 2.2, 0.75, 3);
const POISONED_DAGGER = drawAA((x, y) => {
  const bl = seg(x, y, 7.4, 8.6, 14.0, 2.0);
  if (bl.d < 1.5 - 1.1 * bl.t) return bl.t > 0.45 ? 'v' : 'B';
  if (circ(x, y, 13.2, 5.0, 0.7) < 0 || circ(x, y, 12.4, 6.8, 0.6) < 0 || seg(x, y, 11.0, 5.4, 11.0, 7.2).d < 0.45) return 'v';
  if (seg(x, y, 5.0, 7.2, 8.8, 11.0).d < 0.8) return 'G';
  if (seg(x, y, 6.6, 9.4, 3.2, 12.8).d < 0.95) return Math.floor((x + y) * 0.9) % 2 ? 'W' : 'c';
  if (circ(x, y, 2.5, 13.5, 1.15) < 0) return 'G';
  return null;
});

/** Silent — Shiv: a single willow-leaf blade, no handle; a pale ridge runs down its middle. */
/* Silent — Shiv (card art): a handle-less kunai blade, ring at the back, notched spine; hand-drawn so the hole and notches read. */
const SHIV = [
  '................',
  '.............BB.',
  '............BRB.',
  '...........BRBB.',
  '..........BRBB..',
  '.........BRBB...',
  '........BRBB....',
  '.......BRB.B....',
  '......BRBB......',
  '.....BRB.B......',
  '....BRBB........',
  '...BBBB.........',
  '..BB..B.........',
  '..B..B..........',
  '..BBB...........',
  '................',
];

/** Silent — Poison Flask: vanilla-sized flask of pale green venom, neck wrapped in bandage, green cloth stopper. */
const POISON_FLASK_ART = [
  '.......v.v......',
  '......vvvv......',
  '.......vv.......',
  '......nnnn......',
  '.....MMMMMM.....',
  '....MMMMMMMM....',
  '....MbMMMMbM....',
  '....MMwwwwMM....',
  '....MMwvvwMM....',
  '....MMwvvwMM....',
  '....MMwwwwMM....',
  '....MbMMMMbM....',
  '....MMMMMMMM....',
  '.....MMMMMM.....',
  '................',
  '................',
]

/** Regent — Sovereign Blade: sky-blue spectral blade with a star glint; orange sun-guard; patterned orange grip; blue gem pommel. */
/* (16px version replaced by the 32px one below) */

/** Regent — Falling Star scepter: an orange staff crowned with a sun; a sky-blue star burns at the sun's heart. */
/* (16px version replaced by the 32px one below) */

/** Regent — Star Vessel: a jar of night sky full of sky-blue stars, orange lid and band. */
const STAR_VESSEL = (() => {
  const g = draw((x, y) => {
    if (y > 1.6 && y < 3.4 && x > 4.6 && x < 11.4) return 'L';
    if (y >= 3.4 && y < 5.0 && x > 5.6 && x < 10.4) return 'G';
    const dx = Math.max(0, Math.abs(x - 8) - 2.8), dy = Math.max(0, Math.abs(y - 9.8) - 2.6);
    const d = Math.hypot(dx, dy);
    if (d > 2.2) return null;
    if (y > 9.0 && y < 10.0) return 'L';
    return d > 1.3 || y < 6.0 ? 'G' : 'N';
  });
  const stars = [[6, 7], [9, 7], [7, 11], [10, 11], [8, 13], [5, 12]];
  return g.map((row, y) => row.split('').map((c, x) => c === 'N' && stars.some(([sx, sy]) => sx === x && sy === y) ? 'y' : c).join(''));
})();

/** Necrobinder — Scythe: a big purple crescent blade on a gently curved dark snath. */
const SNATH = [[3.0, 14.6], [5.0, 11.6], [6.6, 8.0], [7.4, 4.6], [7.6, 2.2]];
/* (16px version replaced by the 32px one below) */

/** Necrobinder — Reaping Scythe: an S-curved bone snath, a larger blade with a glowing violet edge and a back spike. */
const REAP_SNATH = [[2.6, 14.6], [4.8, 12.4], [5.0, 9.6], [6.6, 6.6], [7.0, 3.4], [6.4, 1.6]];
/* (16px version replaced by the 32px one below) */

/** Necrobinder — Dirge Flute: an orange-tan bone flute (STS2 Bone Flute) with finger holes and a purple ribbon. */
const DIRGE_FLUTE = drawAA((x, y) => {
  const t = seg(x, y, 2.8, 13.2, 12.8, 3.2);
  if (seg(x, y, 4.6, 11.4, 3.6, 8.2).d < 0.5 || seg(x, y, 4.6, 11.4, 6.6, 13.8).d < 0.5) return 'P';
  const r = 1.55 + (t.t > 0.88 ? 0.35 : 0) + (t.t < 0.08 ? 0.3 : 0);
  if (t.d > r) return null;
  if (t.t > 0.15 && t.t < 0.22) return 'P';
  for (const h of [0.4, 0.58, 0.76]) if (Math.hypot(x - (2.8 + 10 * h), y - (13.2 - 10 * h)) < 0.62) return 'h';
  return 'B';
});

/** Defect — Claw: a pale-yellow shell gauntlet with a blue orb in the palm, grey steel talons, a grey cable. */
const CLAW = drawAA((x, y) => {
  for (const pts of [[[7.4, 6.8], [9.6, 3.8], [12.4, 2.2]], [[8.4, 8.2], [11.6, 6.4], [14.4, 5.6]], [[8.0, 9.8], [11.2, 9.8], [13.6, 11.0]]]) {
    const p = pathAt(x, y, pts);
    if (p.d < 1.0 - 0.7 * p.t) return p.t > 0.62 ? 'E' : 'T';
  }
  if (circ(x, y, 5.6, 9.8, 1.4) < 0) return 'O';
  if (circ(x, y, 5.6, 9.8, 3.6) < 0) return 'S';
  if (pathAt(x, y, [[3.4, 12.4], [2.2, 13.0], [1.6, 14.4]]).d < 0.55) return 'w';
  if (seg(x, y, 3.6, 12.2, 2.6, 13.4).d < 1.4) return 'C';
  return null;
});

/** Defect — Flak Cannon: pale-yellow shell barrel, three dark bores, a glowing blue orb chamber, grey pipes and grip. */
/* (16px version replaced by the 32px one below) */

/** Defect — Charge Core: a blue orb in a pale-yellow casing with four windows, grey bolts and a trailing cable. */
const CHARGE_CORE = drawAA((x, y) => {
  const r = Math.hypot(x - 8, y - 7.6);
  if (r < 3.3) return 'O';
  if (r < 5.6) {
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + Math.PI / 4;
      if (Math.hypot(x - 8 - Math.cos(a) * 4.5, y - 7.6 - Math.sin(a) * 4.5) < 0.7) return 'b';
    }
    return 'S';
  }
  if (pathAt(x, y, [[5.0, 12.4], [3.6, 13.6], [2.2, 14.2]]).d < 0.55) return 'w';
  return null;
});

/** Orb icons for the Defect orb bar: a glowing sphere each (Lightning: yellow-white with a bolt; Frost: cyan with a snowflake). */
const LIGHTNING_ORB_ICON = draw((x, y) => {
  if (circ(x, y, 8, 8, 6.4) >= 0) return null;
  if (pathAt(x, y, [[9.6, 3.6], [6.8, 8.2], [9.2, 8.2], [6.4, 12.6]]).d < 0.7) return 'z';
  return 'O';
});
const FROST_ORB_ICON = draw((x, y) => {
  if (circ(x, y, 8, 8, 6.4) >= 0) return null;
  const dx = x - 8, dy = y - 8;
  if ((Math.abs(dx) < 0.6 || Math.abs(dy) < 0.6 || Math.abs(dx - dy) < 0.75 || Math.abs(dx + dy) < 0.75) && Math.hypot(dx, dy) < 4.4) return 'z';
  return 'O';
});

// ================================================================== status icons v5 (18x18)
// Vulnerable: a soft, rounded heart with a dark crack (a symbol: gentle shading, no gem sparkle)
const FX_VULNERABLE = drawAAAt(18, (x, y) => {
  const X = (x - 8.0) / 6.1, Y = -(y - 7.4) / 6.1;
  if (Math.pow(X * X + Y * Y - 1, 3) - X * X * Y * Y * Y > 0) return null;
  if (pathAt(x, y, [[8.4, 3.4], [6.6, 7.0], [9.4, 8.2], [7.8, 12.0]]).d < 0.45) return 'k';
  return 'R';
});
// Blood Heal: a liquid drop — body shading plus a curved reflection along the upper-left inside edge and a small dot
const FX_BLOOD_HEAL = drawAAAt(18, (x, y) => {
  const v = 1 - 2 * (y - 1.0) / 14.0, w = Math.abs(v) >= 1 ? -1 : Math.sqrt(1 - v * v) * Math.pow((1 - v) / 2, 0.6);
  const edge = Math.abs(x - 8) - 6.4 * w;
  if (edge > 0) return null;
  if (x < 8 && edge > -1.6 && edge < -0.8 && y > 6.0 && y < 11.6) return 'h';
  if (circ(x, y, 6.0, 12.4, 0.55) < 0) return 'h';
  return 'R';
});
// Buffer: three flat tiles, staggered (orange, yellow, green), each with its own darker rim; a glint on the front one
const FX_BUFFER = drawAAAt(18, (x, y) => {
  const tile = (x0, y0, size, fill, rim) => {
    if (x < x0 || x >= x0 + size || y < y0 || y >= y0 + size) return null;
    return (x - x0 < 0.9 || y - y0 < 0.9 || x0 + size - x < 0.9 || y0 + size - y < 0.9) ? rim : fill;
  };
  const front = tile(1.6, 6.2, 8.2, 'a', 'A');
  if (front) return (front === 'a' && (x - 1.6) + (y - 6.2) > 2.0 && (x - 1.6) + (y - 6.2) < 3.0) ? 'w' : front;
  return tile(4.6, 3.4, 7.8, 'b', 'B') || tile(7.4, 0.8, 7.6, 'c', 'C');
}, 4, 0.5);
// Orbs: a regular octagon, light/dark halves, white symbol
const octagon = (x, y, r) => Math.max(Math.abs(x - 8), Math.abs(y - 8), (Math.abs(x - 8) + Math.abs(y - 8)) / 1.414) <= r;
const FX_ORB = (motif) => drawAAAt(18, (x, y) => {
  if (!octagon(x, y, 6.6)) return null;
  if (!octagon(x, y, 5.7)) return 'R';
  if (motif(x, y)) return 'w';
  return x - y < 0 ? 'a' : 'b';
}, 4, 0.5);
const FX_LIGHTNING = FX_ORB((x, y) => pathAt(x, y, [[9.6, 3.6], [6.8, 8.2], [9.2, 8.2], [6.4, 12.4]]).d < 0.6);
const FX_FROST = FX_ORB((x, y) => {
  const dx = x - 8, dy = y - 8;
  return Math.hypot(dx, dy) < 4.0 && (Math.abs(dx) < 0.45 || Math.abs(dy) < 0.45 || Math.abs(dx - dy) < 0.6 || Math.abs(dx + dy) < 0.6);
});
// Artifact: a symmetric gold gear (8 teeth), inner ring, hub — metal, so it keeps a soft sheen
const FX_ARTIFACT = drawAAAt(18, (x, y) => {
  const dx = x - 8, dy = y - 8, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
  const tooth = Math.cos(a * 8) > 0.3 ? 6.8 : 5.4;
  if (r > tooth) return null;
  if (r < 1.2) return 'G';
  if (r < 2.0) return null;
  if (Math.abs(r - 3.4) < 0.45) return 'k';
  return 'G';
}, 4, 0.5);
// Thorns: a symmetric brown burr with 8 spikes, flat two-tone (an organic symbol)
const FX_THORNS = drawAAAt(18, (x, y) => {
  const dx = x - 8, dy = y - 8, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
  const spike = 3.8 + 3.4 * Math.pow(Math.abs(Math.cos(a * 4)), 6);
  if (r > spike) return null;
  if (r < 3.6) return dx - dy < 0 ? 'a' : 'b';
  return dx - dy < 0 ? 'c' : 'd';
}, 4, 0.5);
// Doom: pale gravestone with a carved skull, on a plinth
const FX_DOOM = drawAAAt(18, (x, y) => {
  if (y > 12.8 && y < 15.0 && Math.abs(x - 8) < 6.2) return 'P';
  const stone = (y > 6.0 && y <= 12.8 && Math.abs(x - 8) < 4.7) || circ(x, y, 8, 6.2, 4.7) < 0;
  if (!stone) return null;
  const skull = circ(x, y, 8, 7.4, 3.0) < 0 || (Math.abs(x - 8) < 1.8 && y > 9.4 && y < 11.6);
  if (skull) return (circ(x, y, 6.7, 7.6, 1.05) < 0 || circ(x, y, 9.3, 7.6, 1.05) < 0) ? 'S' : 'k';
  return 'S';
});
// Prosperity: two gold coins
const FX_PROSPERITY = drawAAAt(18, (x, y) => {
  const front = circ(x, y, 6.2, 9.8, 4.4), back = circ(x, y, 10.2, 6.0, 4.0);
  if (front < 0) return front > -0.9 ? 'R' : Math.abs(circ(x, y, 6.2, 9.8, 2.0)) < 0.4 ? 'R' : 'G';
  if (back < 0) return front < 0.8 ? 'k' : back > -0.9 ? 'r' : 'g';
  return null;
});

// ================================================================== phase 6: large weapons at 32x32 (16-unit coordinates)
const W32 = 32;
/** Ironclad — Morning Star: a heavy reddish-black spiked ball with a riveted band and blood, chain links, wrapped haft. */
const MORNING_STAR = drawAAAt(W32, (x, y) => {
  const cx = 10.6, cy = 5.4, r = Math.hypot(x - cx, y - cy);
  if (r < 3.1) {
    if (Math.abs((x - cx) + (y - cy) * 0.15) < 0.38) return [[10.6, 3.0], [10.6, 5.4], [10.6, 7.8]].some(([a, b]) => Math.hypot(x - a, y - b) < 0.42) ? 'v' : 'b';
    if ([[11.8, 6.6], [9.4, 4.0], [12.2, 4.6]].some(([a, b]) => Math.hypot(x - a, y - b) < 0.5)) return 'r';
    return 'M';
  }
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4 + Math.PI / 8;
    if (teardrop(x, y, cx + Math.cos(a) * 2.7, cy + Math.sin(a) * 2.7, 0.95, cx + Math.cos(a) * 5.4, cy + Math.sin(a) * 5.4, 0.4) < 0) return 'K';
  }
  if (seg(x, y, 11.8, 8.4, 12.0, 9.6).d < 0.3 || circ(x, y, 12.0, 9.8, 0.35) < 0) return 'r';
  for (const [lx, ly, rot] of [[7.6, 8.4, 0], [6.5, 9.5, 1]]) {
    const dx = x - lx, dy = y - ly, u = rot ? (dx + dy) : (dx - dy), w = rot ? (dx - dy) : (dx + dy);
    const e = (u / 1.25) ** 2 + (w / 0.85) ** 2;
    if (e < 1 && e > 0.35) return 'C';
  }
  const h = seg(x, y, 5.6, 10.4, 2.0, 14.0);
  if (h.d < 0.85) return h.t > 0.25 && h.t < 0.85 ? (Math.floor(h.t * 9) % 2 ? 'g' : 'G') : 'M';
  if (circ(x, y, 1.7, 14.3, 0.95) < 0) return 'P';
  return null;
});

/** Ironclad — Sword Boomerang: a black curved falchion with a red-hot edge, brass guard with a ruby, leather grip. */
const SCIMITAR = [[5.2, 10.8], [7.8, 7.8], [10.6, 5.2], [14.6, 3.4]];
const SWORD_BOOMERANG = drawAAAt(W32, (x, y) => {
  const p = pathSide(x, y, SCIMITAR), w = 1.75 - 1.45 * Math.pow(p.t, 1.3);
  if (p.d < w) {
    if (p.side > 0 && p.d > w - 0.55) return 'E';
    if (p.side < 0 && p.d < 0.5 && p.t > 0.08 && p.t < 0.7) return 'F';
    return 'M';
  }
  if (circ(x, y, 4.9, 11.1, 0.75) < 0) return 'J';
  if (seg(x, y, 3.0, 9.0, 6.9, 12.9).d < 0.75) return 'B';
  const g = seg(x, y, 4.3, 11.7, 2.0, 14.0);
  if (g.d < 0.75) return Math.floor(g.t * 8) % 2 ? 'H' : 'h';
  if (circ(x, y, 1.7, 14.3, 0.85) < 0) return 'B';
  return null;
});

/** Regent — Sovereign Blade: a broad faceted crystal blade with a star of light, gilded sun-guard, wrapped grip, blue gem. */
const SOVEREIGN_BLADE = drawAAAt(W32, (x, y) => {
  const sx = 6.9, sy = 9.1;
  if ((Math.abs(x - sx) < 0.28 && Math.abs(y - sy) < 1.9) || (Math.abs(y - sy) < 0.28 && Math.abs(x - sx) < 1.9) ||
      (Math.abs((x - sx) - (y - sy)) < 0.3 && Math.hypot(x - sx, y - sy) < 1.0) || (Math.abs((x - sx) + (y - sy)) < 0.3 && Math.hypot(x - sx, y - sy) < 1.0)) return 'w';
  const { p, q } = frame(x, y, 6.6, 9.4, -45);
  const half = p < 8.4 ? 2.0 : 2.0 * (1 - (p - 8.4) / 2.6);
  if (p > 0 && p < 11.0 && Math.abs(q) < half) {
    if (Math.abs(q) < 0.25 && p > 1.4 && p < 9.4) return 'L';
    if ([[4.4, 0.9], [7.0, -0.8], [9.0, 0.6]].some(([pp, qq]) => Math.hypot(p - pp, q - qq) < 0.3)) return 'w';
    return q < 0 ? 'B' : 'b';
  }
  const ga = Math.atan2(y - 9.6, x - 6.4);
  if (circ(x, y, 6.4, 9.6, 1.25) < 0) return 'O';
  for (let k = 0; k < 2; k++) {
    const [ex, ey] = k ? [8.9, 12.1] : [3.9, 7.1];
    if (circ(x, y, ex, ey, 0.85) < 0) return 'O';
  }
  if (seg(x, y, 3.9, 7.1, 8.9, 12.1).d < 0.6) return 'O';
  const g = seg(x, y, 5.6, 10.4, 2.8, 13.2);
  if (g.d < 0.75) return Math.floor(g.t * 8) % 2 ? 'H' : 'h';
  if (circ(x, y, 2.3, 13.7, 1.1) < 0) return circ(x, y, 2.3, 13.7, 0.55) < 0 ? 'J' : 'O';
  return null;
});

/** Necrobinder — Scythe: a grey steel crescent (dark spine, bright edge) on a curved ash snath with violet wraps. */
const SNATH32 = [[2.4, 15.2], [4.6, 11.8], [6.4, 8.0], [7.3, 4.4], [7.5, 1.6]];
const SCYTHE = drawAAAt(W32, (x, y) => {
  const outer = circ(x, y, 7.4, 9.8, 8.2), inner = circ(x, y, 5.2, 13.2, 8.8);
  if (outer < 0 && inner > 0 && x > 7.0 && y < 10.6) {
    if (inner < 0.55) return 'E';
    if (outer > -0.5) return 'D';
    return 'B';
  }
  if (circ(x, y, 7.5, 2.0, 0.9) < 0) return 'K';
  const sn = pathAt(x, y, SNATH32);
  if (sn.d < 0.62) return (sn.t > 0.5 && sn.t < 0.6) || (sn.t > 0.16 && sn.t < 0.24) ? 'P' : 'H';
  return null;
});

/** Necrobinder — Reaping Scythe: a larger steel blade with a soul-cyan edge, a back spike, skull collar, bone S-snath. */
const REAP32 = [[2.2, 15.2], [4.6, 12.6], [4.9, 9.6], [6.4, 6.6], [6.9, 3.4], [6.4, 1.4]];
const REAPING_SCYTHE = drawAAAt(W32, (x, y) => {
  const outer = circ(x, y, 7.0, 9.6, 8.8), inner = circ(x, y, 4.6, 13.4, 9.2);
  if (outer < 0 && inner > 0 && x > 6.6 && y < 12.0) {
    if (inner < 0.7) return 'E';
    if (outer > -0.5) return 'D';
    return 'B';
  }
  if (teardrop(x, y, 6.0, 3.6, 0.7, 2.6, 3.0, 0.45) < 0) return 'D';
  if (circ(x, y, 6.6, 2.2, 1.2) < 0) return (circ(x, y, 6.2, 2.0, 0.3) < 0 || circ(x, y, 7.0, 2.0, 0.3) < 0) ? 'k' : 'S';
  const sn = pathAt(x, y, REAP32);
  if (sn.d < 0.62) return sn.t > 0.46 && sn.t < 0.56 ? 'P' : 'H';
  return null;
});

/** Regent — Falling Star scepter: a gilded staff with ring bands, a sun head with rays, a sky-blue star at its heart. */
const FALLING_STAR_SCEPTER = drawAAAt(W32, (x, y) => {
  const cx = 10.8, cy = 5.2, r = Math.hypot(x - cx, y - cy), a = Math.atan2(y - cy, x - cx) + Math.PI / 2;
  if (r < 0.9 + 1.3 * Math.pow(Math.abs(Math.cos(a * 2.5)), 4)) return 'B';
  if (r < 2.7) return r > 2.2 ? 'R' : 'S';
  for (let k = 0; k < 12; k++) {
    const b = k * Math.PI / 6, len = k % 2 ? 4.0 : 4.9;
    if (teardrop(x, y, cx + Math.cos(b) * 2.5, cy + Math.sin(b) * 2.5, 0.55, cx + Math.cos(b) * len, cy + Math.sin(b) * len, 0.4) < 0) return 'Y';
  }
  const st = seg(x, y, 2.4, 13.6, 8.8, 7.2);
  if (st.d < 0.55) return [0.25, 0.55, 0.85].some(t => Math.abs(st.t - t) < 0.04) ? 'R' : 'O';
  if (circ(x, y, 2.1, 13.9, 0.85) < 0) return 'R';
  return null;
});

/** Defect — Flak Cannon: a cream-shelled arm cannon with panel lines, triple gunmetal bores, a glowing blue orb, cable. */
const FLAK_CANNON = drawAAAt(W32, (x, y) => {
  const { p, q } = frame(x, y, 4.2, 11.8, -45);
  if (Math.abs(q + 3.2) < 0.35 && p > 1.2 && p < 9.0) return 'w';
  if (p > 0 && p < 10.8 && Math.abs(q) < 2.9) {
    if (p > 8.6) {
      if (Math.hypot(p - 10.2, q) < 0.6 || Math.hypot(p - 10.2, q - 1.6) < 0.55 || Math.hypot(p - 10.2, q + 1.6) < 0.55) return 'k';
      return 'h';
    }
    if (Math.hypot(p - 4.6, q) < 1.7) return 'O';
    if (Math.abs(p - 2.4) < 0.18 || Math.abs(p - 7.0) < 0.18) return 'l';
    return 'S';
  }
  if (seg(x, y, 4.4, 11.6, 2.0, 14.0).d < 0.95) return 'h';
  return null;
});

module.exports = [
  // ================================================================ status icons (v5; poison uses the vanilla icon)
  reshade('strength', 'mob_effect/strength.png', 'mob_effect/strength.png', 'all', R.vxRed, { range: [0, 1] }),
  reshade('weak', 'mob_effect/weak.png', 'mob_effect/weakness.png', 'all', R.vxPale, { range: [0.2, 1], gamma: 0.7 }),
  reshade('dexterity', 'mob_effect/dexterity.png', 'mob_effect/resistance.png', 'all', R.vxGreen, { range: [0, 1] }),
  reshade('frail', 'mob_effect/frail.png', 'mob_effect/resistance.png', 'all', R.vxBlue, { range: [0, 1], overlay: ["..................","..................","..................",".........k........",".........k........","........k.........","........k.........",".......k..........","........k.........",".........k........","..........k.......",".........k........","........k.........","........k.........","..................","..................","..................",".................."], flat: { k: '#0e1a30' } }),
  reshade('intangible', 'mob_effect/intangible.png', 'mob_effect/resistance.png', 'all', R.vxGrey, { range: [0, 1], overlay: ["..................","..................",".w................","................w.","..................","..................","..................","..................","..................","..................","..................","..................",".................w","w.................","..................","..................","..w............w..",".................."], overlayAny: true, flat: { w: '#e8ecff' } }),
  { ...item('vulnerable', FX_VULNERABLE, { R: R.ixRed }, { k: '#3a0a0a' }, { profile: 'round', bulge: 0.6, amb: 0.42, kd: 0.45, ks: 0.15, shin: 10, outlineIdx: 1 }), out: 'mob_effect/vulnerable.png' },
  { ...item('blood_heal', FX_BLOOD_HEAL, { R: R.ixRed }, { h: '#f6a090' }, { profile: 'round', bulge: 0.6, amb: 0.42, kd: 0.45, ks: 0.15, shin: 10, outlineIdx: 1 }), out: 'mob_effect/blood_heal.png' },
  { ...item('buffer', FX_BUFFER, {}, { a: '#2ee08c', A: '#14965a', b: '#d8e43a', B: '#8e9a14', c: '#eaa424', C: '#9a6410', w: '#c8ffe2' }, { outlineIdx: 1 }), out: 'mob_effect/buffer.png' },
  { ...item('lightning_orb', FX_LIGHTNING, {}, { a: '#f2e650', b: '#d6c42a', R: '#9a8a14', w: '#fffff0' }, { outlineIdx: 1 }), out: 'mob_effect/lightning_orb.png' },
  { ...item('frost_orb', FX_FROST, {}, { a: '#7cd8f4', b: '#3aaedc', R: '#1a6e98', w: '#f4feff' }, { outlineIdx: 1 }), out: 'mob_effect/frost_orb.png' },
  { ...item('artifact', FX_ARTIFACT, { G: R.ixGold }, { k: '#8a6418' }, { profile: 'round', bulge: 0.7, amb: 0.3, kd: 0.55, ks: 0.5, shin: 18, outlineIdx: 1 }), out: 'mob_effect/artifact.png' },
  { ...item('thorns', FX_THORNS, {}, { a: '#d6ae62', b: '#ae863e', c: '#c49a50', d: '#8e6a2e' }, { outlineIdx: 1 }), out: 'mob_effect/thorns.png' },
  { ...item('doom', FX_DOOM, { S: R.ixStone, P: shift(R.ixStone, -1) }, { k: '#3a4844' }, { profile: 'round', bulge: 0.6, amb: 0.42, kd: 0.45, ks: 0.15, shin: 10, outlineIdx: 1 }), out: 'mob_effect/doom.png' },
  { ...item('prosperity', FX_PROSPERITY, { G: R.ixGold, R: shift(R.ixGold, -1), g: shift(R.ixGold, -1), r: shift(R.ixGold, -2) }, { k: '#4a3006' }, { profile: 'round', bulge: 0.7, amb: 0.3, kd: 0.55, ks: 0.5, shin: 18, outlineIdx: 1, groups: { G: 'f', R: 'f', g: 'b', r: 'b' } }), out: 'mob_effect/prosperity.png' },
  // ================================================================ phase 6 weapons (v2)
  item('morning_star', MORNING_STAR, { M: R.vNetherite, K: shift(R.vNetherite, 1), b: shift(R.vNetherite, -1), v: R.vGold, r: R.vRuby, C: R.vIron, G: R.vLeather, g: shift(R.vLeather, -1), P: R.vNetherite }, {}, { profile: 'round', bulge: 0.7, rim: 0.1, amb: 0.26, kd: 0.6, ks: 0.5, shin: 20, outlineIdx: 0, groups: { M: 'ball', b: 'ball', v: 'ball', r: 'ball' } }),
  item('bloodletting_dagger', BLOODLETTING_DAGGER, { B: R.vNetherite, F: R.vRuby, G: R.vGold, H: R.vLeather, h: shift(R.vLeather, -1), P: R.vRuby }, {}, { profile: 'round', bulge: 0.8, rim: 0.1, amb: 0.24, kd: 0.6, ks: 0.5, shin: 18, outlineIdx: 0, groups: { B: 'blade', F: 'blade' } }),
  item('sword_boomerang', SWORD_BOOMERANG, { M: R.vNetherite, F: shift(R.vNetherite, -1), E: shift(R.vIron, 1), B: R.vGold, J: R.vRuby, H: R.vLeather, h: shift(R.vLeather, -1) }, {}, { profile: 'round', bulge: 0.7, rim: 0.1, amb: 0.26, kd: 0.6, ks: 0.5, shin: 20, outlineIdx: 0, groups: { M: 'blade', F: 'blade', E: 'blade' } }),
  item('poisoned_dagger', POISONED_DAGGER, { B: R.vIron, v: R.vLime, G: shift(R.vIron, -1), W: R.bandage, c: R.vGreenWool }, {}, { profile: 'round', bulge: 0.8, rim: 0.1, amb: 0.24, kd: 0.6, ks: 0.5, shin: 18, outlineIdx: 0, groups: { B: 'blade', v: 'blade' } }),
  item('shiv', SHIV, { B: R.vIron, R: shift(R.vIron, 1) }, {}, { profile: 'round', bulge: 0.8, rim: 0.1, amb: 0.24, kd: 0.6, ks: 0.5, shin: 18, outlineIdx: 0, groups: { B: 'b', R: 'b' } }),
  item('poison_flask', POISON_FLASK_ART, { M: R.vIron, b: shift(R.vIron, 1), n: shift(R.vIron, -1), v: R.vLime, w: shift(R.vIron, -1) }, {}, { profile: 'round', bulge: 0.8, rim: 0.1, amb: 0.24, kd: 0.6, ks: 0.5, shin: 18, outlineIdx: 0, groups: { M: 'can', b: 'can' }, regionShade: { v: 'glow' } }),
  item('sovereign_blade', SOVEREIGN_BLADE, { B: shift(R.vDiamond, 1), b: R.vDiamond, L: shift(R.vDiamond, 2), O: R.vGold, H: R.vLeather, h: shift(R.vLeather, -1), J: R.vDiamond }, { w: '#f4fffc' }, { profile: 'round', bulge: 0.7, rim: 0.1, amb: 0.26, kd: 0.6, ks: 0.5, shin: 20, outlineIdx: 0, groups: { B: 'blade', b: 'blade', L: 'blade' } }),
  item('falling_star_scepter', FALLING_STAR_SCEPTER, { B: R.vDiamond, S: R.vGold, R: shift(R.vGold, -1), Y: shift(R.vGold, 1), O: R.vGold }, {}, { profile: 'round', bulge: 0.7, rim: 0.1, amb: 0.26, kd: 0.6, ks: 0.5, shin: 20, outlineIdx: 0, regionShade: { S: 'glow', Y: 'glow', B: 'glow' } }),
  item('star_vessel', STAR_VESSEL, { L: R.vGold, G: R.vialGlass, N: R.nightSky }, { y: '#a4fdf0' }, { profile: 'round', bulge: 0.8, rim: 0.1, amb: 0.24, kd: 0.6, ks: 0.5, shin: 18, outlineIdx: 0, groups: { G: 'jar', N: 'jar' } }),
  item('scythe', SCYTHE, { B: R.vIron, D: shift(R.vIron, -1), E: shift(R.vIron, 1), K: R.vIron, H: R.vDarkWood, P: R.vPurpleWool }, {}, { profile: 'round', bulge: 0.7, rim: 0.1, amb: 0.26, kd: 0.6, ks: 0.5, shin: 20, outlineIdx: 0, groups: { B: 'blade', D: 'blade', E: 'blade' } }),
  item('reaping_scythe', REAPING_SCYTHE, { B: R.vIron, D: shift(R.vIron, -1), E: R.vSoul, S: R.vBone, H: R.vBone, P: R.vPurpleWool }, { k: '#1a1a14' }, { profile: 'round', bulge: 0.7, rim: 0.1, amb: 0.26, kd: 0.6, ks: 0.5, shin: 20, outlineIdx: 0, groups: { B: 'blade', D: 'blade', E: 'blade' }, regionShade: { E: 'glow' } }),
  item('dirge_flute', DIRGE_FLUTE, { B: R.vBone, P: R.vPurpleWool }, { h: '#2a2618' }, { profile: 'round', bulge: 0.8, rim: 0.1, amb: 0.24, kd: 0.6, ks: 0.5, shin: 18, outlineIdx: 0, smoothH: 1 }),
  item('claw', CLAW, { T: R.vIron, E: R.vEmber, S: R.vQuartz, C: shift(R.vQuartz, -1), O: R.vLapis, w: shift(R.vIron, -1) }, {}, { profile: 'round', bulge: 0.8, rim: 0.1, amb: 0.24, kd: 0.6, ks: 0.5, shin: 18, outlineIdx: 0, regionShade: { O: 'glow', E: 'glow' } }),
  item('flak_cannon', FLAK_CANNON, { S: R.vQuartz, l: shift(R.vQuartz, -2), h: shift(R.vIron, -1), O: R.vLapis, w: shift(R.vIron, -1) }, { k: '#101010' }, { profile: 'round', bulge: 0.7, rim: 0.1, amb: 0.26, kd: 0.6, ks: 0.5, shin: 20, outlineIdx: 0, groups: { S: 'body', l: 'body' }, regionShade: { O: 'glow' } }),
  item('charge_core', CHARGE_CORE, { S: R.vQuartz, b: R.vIron, O: R.vLapis, w: shift(R.vIron, -1) }, {}, { profile: 'round', bulge: 0.8, rim: 0.1, amb: 0.24, kd: 0.6, ks: 0.5, shin: 18, outlineIdx: 0, groups: { S: 'frame', b: 'frame' }, regionShade: { O: 'glow' } }),
  // ================================================================ phase 5: relic pouch & relics
  reshade('relic_pouch', 'item/relic_pouch.png', 'item/bundle.png', 'all', R.leather, { range: [0.04, 0.96],
    overlay: ['................', '................', '................', '................', '................',
      '......g.........', '.......ghg......', '................', '................', '................',
      '................', '................', '................', '................', '................', '................'],
    flat: { g: '#d9a22a', h: '#ffe08a' } }),
  item('anchor', ANCHOR, { A: R.anchorBlue, R: R.rope, r: shift(R.rope, -1) }, {},
    { groups: { R: 'rope', r: 'rope' }, profile: 'round', bulge: 0.9, rim: 0.1, amb: 0.2, kd: 0.6, ks: 0.3, shin: 14, outlineIdx: 1 }),
  item('vajra', VAJRA, {}, { h: '#fbf0b4', l: '#ecd36c', m: '#d2b04a', s: '#a88428', d: '#7c5e1a' }, {}),
  item('oddly_smooth_stone', SMOOTH_STONE, { S: R.stoneSts }, {}, { profile: 'round', bulge: 0.85, rim: 0.12, ks: 0.5, shin: 12, outlineIdx: 1, smoothH: 2 }),
  item('bag_of_marbles', MARBLES, { C: R.sack, T: shift(R.sack, -2), I: shift(R.sack, -4), M: shift(R.marble, 1), N: shift(R.marble, 1) }, {},
    { groups: { C: 'bag', T: 'bag', I: 'bag' }, profile: 'round', bulge: 0.85, rim: 0.12, ks: 0.3, shin: 10, outlineIdx: 1 }),
  item('red_mask', RED_MASK, { L: R.maskRed }, { E: '#3a0c10' },
    { profile: 'round', bulge: 0.85, rim: 0.12, amb: 0.18, kd: 0.65, ks: 0.3, shin: 14, outlineIdx: 1 }),
  item('bronze_scales', BRONZE_SCALES, {}, { a: '#e6be76', b: '#c89858', c: '#a86c3c', d: '#82522c', o: '#5e3a1c' }, { outlineIdx: 1 }),
  item('blood_vial', BLOOD_VIAL, { G: R.vialGlass, B: R.stsBlood, K: R.cork, k: R.cork }, {},
    { groups: { G: 'v', B: 'v', K: 'c', k: 'c' }, profile: 'round', bulge: 0.85, rim: 0.12, amb: 0.18, kd: 0.65, ks: 0.45, shin: 20, outlineIdx: 1 }),
  item('red_skull', RED_SKULL, { B: R.stsBlood, T: shift(R.stsBlood, 1) }, { E: '#2e0606' },
    { groups: { B: 'skull', T: 'skull' }, profile: 'round', bulge: 0.9, rim: 0.12, amb: 0.18, kd: 0.65, ks: 0.25, shin: 12, outlineIdx: 1 }),
  item('pen_nib', PEN_NIB, { G: R.nibGold, H: shift(R.nibGold, -2) }, { E: '#241802' },
    { groups: { G: 'n', H: 'n' }, profile: 'round', bulge: 0.8, rim: 0.1, amb: 0.2, kd: 0.6, ks: 0.45, shin: 18, outlineIdx: 1 }),
  item('mercury_hourglass', HOURGLASS, { W: R.wood, w: shift(R.wood, 1), g: R.hourglassGlass, Q: shift(R.mercury, -1) }, {},
    { groups: { g: 'glass', Q: 'glass', W: 'wood', w: 'wood' }, profile: 'round', bulge: 0.8, rim: 0.12, amb: 0.2, kd: 0.6, ks: 0.45, shin: 18, outlineIdx: 1 }),
  item('shuriken', SHURIKEN, { L: R.shurikenSteel, K: shift(R.shurikenSteel, -2), D: shift(R.shurikenSteel, -1) }, {},
    { groups: { L: 's', K: 's', D: 's' }, profile: 'round', bulge: 0.7, rim: 0.1, amb: 0.2, kd: 0.6, ks: 0.45, shin: 16, outlineIdx: 1 }),
  item('lizard_tail', LIZARD_TAIL, { L: R.lizardGreen, S: shift(R.lizardGreen, -2), P: R.flesh, C: shift(R.stsBlood, -1), B: R.stsBlood }, {},
    { groups: { L: 't', S: 't' }, profile: 'round', bulge: 0.85, rim: 0.12, ks: 0.3, shin: 10, outlineIdx: 1 }),
  item('tungsten_rod', TUNGSTEN_ROD, { B: R.alloyBright, E: shift(R.alloyBright, -1) }, {}, { ks: 0.75, shin: 16, depth: 2.0 }),
  item('burning_blood', BURNING_BLOOD, { R: R.stsBlood, W: R.fire }, { w: '#fbe6e2', l: '#e2564c', 0: '#c42a1c', 1: '#d9431a', 2: '#ec661e', 3: '#f78b2a', 4: '#ffad3e', 5: '#ffcd66', 6: '#ffe7a0' },
    { outlineIdx: 3, profile: 'round', bulge: 0.95, rim: 0.16, regionShade: { F: 'glow', Y: 'glow', W: 'glow' }, ks: 0.25, shin: 30, kd: 0.6, amb: 0.2,
      innerGlow: { from: ['0', '1', '2', '3', '4', '5', '6'], regions: ['R'], strength: 0.55, radius: 2.4 } }),

  // ================================================================ ingots & raw ores: vanilla shapes and lighting
  reshade('tungsten_ingot', 'item/tungsten_ingot.png', 'item/iron_ingot.png', 'all', R.gunmetal, { range: [0.06, 0.94] }),
  reshade('tungsten_alloy_ingot', 'item/tungsten_alloy_ingot.png', 'item/iron_ingot.png', 'all', R.alloy, { range: [0.06, 0.94] }),
  reshade('orichalcum_ingot', 'item/orichalcum_ingot.png', 'item/gold_ingot.png', 'all', R.oriMetal, { range: [0.04, 0.9] }),
  reshade('raw_tungsten', 'item/raw_tungsten.png', 'item/raw_iron.png', 'all', R.wolframite),
  reshade('raw_orichalcum', 'item/raw_orichalcum.png', 'item/raw_gold.png', 'all', R.oriMetal, { range: [0, 0.88] }),

  // ================================================================ STS2 materials
  item('brimstone', BRIMSTONE, {}, { o: '#7a6209', 1: '#5f4b07', 2: '#9a800e', 6: '#c9a917', 8: '#e3c52c', 9: '#f2dc5c' }, { outline: 'none' }),
  item('lava_rock', LAVA_ROCK, { R: R.lavaRock, H: R.heatedRock, L: R.lavaGlow }, {},
    { regionShade: { L: 'glow' }, groups: { R: 'rock', H: 'rock' }, ks: 0.15, shin: 6, noise: 0.04, amb: 0.08 }),
  item('lava_rock_shard', LAVA_SHARD, { R: R.lavaRock, H: R.heatedRock, L: R.lavaGlow }, {},
    { regionShade: { L: 'glow' }, groups: { R: 'rock', H: 'rock' }, ks: 0.15, shin: 6, noise: 0.04, amb: 0.08 }),
  // Galactic Dust: a pile of golden star dust (STS2 colours, vanilla dust-pile silhouette) sparkling with little stars
  reshade('galactic_dust', 'item/galactic_dust.png', 'item/glowstone_dust.png', 'all', R.dust, {
    overlay: [
      '................', '................', '................', '................',
      '.........y......',
      '........ywy.....',
      '.........y......',
      '................',
      '....w...........',
      '................',
      '...........w....',
      '......y.........',
      '.....ywy........',
      '......y.........',
      '................', '................',
    ], flat: { w: '#ffffff', y: '#fff6d0' } }),

  // ================================================================ food
  item('strawberry', STRAWBERRY, { R: R.berry, K: R.seed, G: R.leaf, S: R.stem }, {},
    { groups: { R: 'body', K: 'body' }, ks: 0.3, shin: 12, kd: 0.6, amb: 0.22, outlineIdx: 1 }),
  item('pear', PEAR, { P: R.pear, S: R.stem, L: R.leaf }, {},
    { ks: 0.3, shin: 9, blend: { regions: ['P'], ramps: [R.pear, R.pearWarm], p0: [10, 4], p1: [5, 14] } }),
  item('mango', MANGO, { M: R.mangoY, L: R.leaf, S: R.stem }, {},
    { ks: 0.4, shin: 9, blend: { regions: ['M'], ramps: [R.mangoG, R.mangoY, R.mangoO], stops: [0, 0.2, 1], p0: [12.0, 4.0], p1: [3.5, 13.5], steps: 7 } }),
  item('meat_on_the_bone', MEAT, { M: R.roast, P: R.cut, B: R.bone }, {},
    { groups: { M: 'meat', P: 'meat' }, ks: 0.45, shin: 8, noise: 0.03 }),
  item('amethyst_aubergine', AUBERGINE, { A: R.amethyst, G: shift(R.amethyst, 2), S: shift(R.amethyst, 1) }, {},
    { tex: 'block/amethyst_block.png', texRegions: ['A'], texMix: 0.45, ks: 0.5, shin: 10 }),

  // ================================================================ tools: vanilla iron silhouettes, orichalcum material
  ...['sword', 'pickaxe', 'axe', 'shovel', 'hoe'].map(t =>
    reshade('orichalcum_' + t, 'item/orichalcum_' + t + '.png', 'item/iron_' + t + '.png', 'metal', R.oriMetal, { range: [0.04, 0.9] })),

  // ================================================================ armor: plate armor (netherite = heavy tungsten plates, diamond = polished orichalcum)
  ...['helmet', 'chestplate', 'leggings', 'boots'].map(t =>
    reshade('tungsten_' + t, 'item/tungsten_' + t + '.png', 'item/netherite_' + t + '.png', 'all', R.alloy, { range: [0.04, 0.96] })),
  ...['helmet', 'chestplate', 'leggings', 'boots'].map(t =>
    reshade('orichalcum_' + t, 'item/orichalcum_' + t + '.png', 'item/diamond_' + t + '.png', 'all', R.oriMetal, { range: [0.02, 0.9], gamma: 0.8, sheen: 0.16, pattern: 'seams' })),
  reshade('tungsten_humanoid', 'entity/equipment/humanoid/tungsten.png', 'entity/equipment/humanoid/netherite.png', 'all', R.alloy, { range: [0.1, 0.92] }),
  reshade('tungsten_humanoid_leggings', 'entity/equipment/humanoid_leggings/tungsten.png', 'entity/equipment/humanoid_leggings/netherite.png', 'all', R.alloy, { range: [0.1, 0.92] }),
  reshade('orichalcum_humanoid', 'entity/equipment/humanoid/orichalcum.png', 'entity/equipment/humanoid/diamond.png', 'all', R.oriMetal, { range: [0.04, 0.9], gamma: 0.85, pattern: 'seams' }),
  reshade('orichalcum_humanoid_leggings', 'entity/equipment/humanoid_leggings/orichalcum.png', 'entity/equipment/humanoid_leggings/diamond.png', 'all', R.oriMetal, { range: [0.04, 0.9], gamma: 0.85, pattern: 'seams' }),

  // ================================================================ ores: vanilla deposits, mirrored + shifted, new material
  ore('wolframite_ore', 'block/coal_ore.png', 'block/stone.png', 'block/stone.png', R.wolframiteDark, { mirror: true }, { gamma: 1 }),
  ore('deepslate_wolframite_ore', 'block/deepslate_coal_ore.png', 'block/deepslate.png', 'block/deepslate.png', R.wolframiteDark, { flipY: true }, { gamma: 1, range: [0.12, 1] }),
  ore('orichalcum_ore', 'block/deepslate_emerald_ore.png', 'block/deepslate.png', 'block/deepslate.png', R.oriGem, { mirror: true, flipY: true }),   // v3.6: superseded - tools/biome_v3_textures.js draws orichalcum_ore (copper-ore lumps, jade)
  ore('nether_brimstone_ore', 'block/nether_quartz_ore.png', 'block/netherrack.png', 'block/netherrack.png', R.sulfurCrystal, { mirror: true }),
  ore('lava_rock_ore', 'block/nether_gold_ore.png', 'block/netherrack.png', 'block/basalt_side.png', R.lavaGlow, { flipY: true }),

  // ================================================================ storage blocks: vanilla block patterns, limited contrast
  reshade('tungsten_alloy_block', 'block/tungsten_alloy_block.png', 'block/netherite_block.png', 'all', R.alloy, { range: [0.15, 0.85] }),
  reshade('orichalcum_block', 'block/orichalcum_block.png', 'block/diamond_block.png', 'all', R.oriMetal, { range: [0.32, 0.92] }),
  reshade('brimstone_block', 'block/brimstone_block.png', 'block/raw_gold_block.png', 'all', R.sulfur, { range: [0.1, 0.9] }),
];
