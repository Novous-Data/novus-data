# Castrum Maris — 3D Crusader coastal fortress

A real-time WebGL reconstruction of a Frankish castle of the Latin East, set on a
limestone headland above the sea. Single self-contained HTML page, Three.js r128
from cdnjs; every texture, every piece of geometry and the sea itself are
generated procedurally in the page — no external assets.

## Status: WORK IN PROGRESS — does not run yet

Sections 0–9 are written. The file still needs its final section (10) before it
will render at all: camera controller, annotation layer, UI wiring, staged build
sequence and the animation loop. See "Remaining" below.

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
| 10 | **Not yet written** |

## Remaining

1. Camera controller (orbit / pan / zoom, pointer + touch, terrain clamp).
2. Annotation layer — project the `ANNO[]` anchors to DOM callouts with leader lines.
3. UI wiring — hour-of-day and sea-state sliders, six viewing stations, toggles, readout.
4. `finishCastle()` — merge the `ASH` / `RUB` / `WOOD` / `VOID` / `COB` bags into
   meshes with their materials, and the staged build sequence that drives the loader.
5. Animation loop — advance `uTime` on the sea, sky, banners and wind materials;
   update gulls and labels.
6. Then: render locally in Chromium, correct what the frame shows, and publish.
