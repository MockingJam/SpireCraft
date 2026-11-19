#!/usr/bin/env bash
# Rebuilds every weapon texture: pixelized references, then the hand-built overrides.
#   tools/build_weapon_textures.sh <ref png dir> <outDir> [preview.png]
set -e
T="$(dirname "$0")"
node "$T/pixelize.js" "$1" "$2" - > /dev/null      # all weapons from the reference paintings
node "$T/spear32.js" "$1" "$2/crescent_spear.png" > /dev/null
node "$T/weapon32.js" "$1" "$2" > /dev/null         # clean redraws (needs $2/snakebite.png from pixelize)
echo "weapon textures written to $2"
