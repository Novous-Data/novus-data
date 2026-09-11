# Castrum Maris — 3D Crusader coastal fortress

A real-time WebGL reconstruction of a Frankish castle of the Latin East, set on a
limestone headland above the sea. Single self-contained HTML page, Three.js r128
from cdnjs; every texture, every piece of geometry and the sea itself are
generated procedurally in the page — no external assets.

## Status: complete

Open `castrum-maris.html` in any browser with WebGL. Drag to orbit, right-drag
or two fingers to pan, scroll or pinch to zoom. Six viewing stations are
deep-linkable: append `#v=0` … `#v=5` to the URL.

## What the reconstruction is based on

No single castle is copied. Elements are drawn from documented Frankish practice:

| Feature | Precedent |
| --- | --- |
| Concentric enceinte, round mural towers, battered *talus* | Krak des Chevaliers |
| Rock-cut ditch with a freestanding needle of rock carrying the bridge | Saône / Qal'at Salah ed-Din |
| Fortress thrown across a headland, supplied by sea | Château Pèlerin (Atlit) |
| Antique column shafts re-laid as through-binders | Tortosa, Byblos |
| Drafted-margin ashlar with rusticated boss, 0.60 m courses | standard Frankish dressing |

Measures: curtain 3.4 m thick, 16 m to the wall-walk, parapet 2.0 m; merlons
1.30 × 1.90 m at 2.40 m centres; talus batter 1 : 0.45; round towers Ø 11 m
rising 21 m; donjon 21 × 18 m, 29 m; ditch 26 m wide, 28 m deep.

Planting is the Levantine coastal assemblage of the period — Aleppo pine,
Italian cypress, olive on drystone terraces, tamarisk, and a garrigue of thyme,
sage and rockrose. Nothing post-Columbian.

## How it is put together

| Section | Contents |
| --- | --- |
| 0–1 | Noise, the height field of the headland, the plan of the fortress |
| 2 | Canvas texture generators (ashlar, rubble, rock, cobble, timber, foliage, banners) |
| 3 | Renderer, camera, sky shader, sun/time-of-day, atmosphere |
| 4 | Triplanar stone material — world-space projection, height-map bump, no stretching |
| 5 | The sea: Gerstner swell shoaling over a depth field, whitecaps, shore foam |
| 6 | Geometry toolkit — mitred profile sweeping, merging, rock kneading |
| 7 | The headland mesh, boulders, scree, sea stacks |
| 8 | The fortress — curtains, towers, gate, bridge, donjon, chapel, hall, cistern, sea stair |
| 9 | Planting, drystone walls, gulls |
| 10 | Assembly, camera control, the annotation layer and the loop |

## Notes on the build

The whole scene is one file with no external assets. The only dependency is
Three.js r128, loaded from a CDN.

* **Triplanar stone.** Masonry is projected in world space, so courses stay
  level across a batter, a curve and a corbel alike, and no block is stretched.
  The same height map drives the bump and the roughness.
* **The sea knows the shore.** A 256 × 256 height field of the ground is baked
  into a data texture; the Gerstner swell reads it, so waves shoal and break as
  the bottom comes up and foam surges over the shelf.
* **Drawing budget.** Everything the fortress is made of is merged into five
  buffers by material, so the castle costs five draw calls; the planting is
  instanced.

Verified by rendering headlessly in Chromium (SwiftShader) and correcting
against the frames: sun and station angles, the reflection of the sky below the
horizon, the bedding texture on flat ground, arrow-loop slots that stood proud
of the wall, and inland ground that had dropped the bridge's far abutment into
the air.
