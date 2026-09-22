/**
 * Sample payloads for every live source, for `npm run dev:demo`.
 *
 * Fenced exactly like the other two fixture sources (CLAUDE.md Rule 1):
 * reachable only with CONTENT_SOURCE=fixtures, every human-readable string
 * prefixed [SAMPLE], every link on example.invalid, and a production build that
 * touches this file throws at module load.
 *
 * Two deliberate choices:
 *
 * - **These are raw upstream-shaped payloads, not finished Readings.** They go
 *   through the same parse functions as live data, so the demo exercises the
 *   real parsers — including their handling of partial failure — rather than
 *   bypassing them. A fixture that skipped the parser would prove nothing.
 *
 * - **Timestamps are relative to now**, and chosen so the demo shows every
 *   freshness state at once: most sources live, GDACS delayed, EONET stale,
 *   one GDELT theme rate-limited. Fixed dates would make every panel read
 *   "stale" a week after this was written, and the states are what a reviewer
 *   most needs to see.
 *
 * Vessel MMSIs start 999, which is not an allocated maritime identification
 * digit range, so no sample vessel can collide with a real ship.
 */

import { CHOKEPOINTS, PORTS } from '../nodes';
import type { AisSummary } from './ais';
import { createAisAccumulator } from './ais';
import type { GdeltRaw } from './gdelt';
import { GDELT_THEMES } from './gdelt';
import type { FetchedJson } from './http';

if (process.env.NODE_ENV === 'production' && process.env.CONTENT_SOURCE === 'fixtures') {
  throw new Error(
    'CONTENT_SOURCE=fixtures must never be used for a production build. ' +
      'Live fixtures are sample data and would publish as real readings. ' +
      'Set CONTENT_SOURCE=local (or leave it unset).',
  );
}

const MINUTE = 60_000;
const ago = (minutes: number) => new Date(Date.now() - minutes * MINUTE);
const iso = (minutes: number) => ago(minutes).toISOString();

/** GDELT's compact timestamp, floored to a fifteen-minute interval. */
function gdeltStamp(minutesAgo: number): string {
  const date = ago(minutesAgo);
  date.setUTCMinutes(Math.floor(date.getUTCMinutes() / 15) * 15, 0, 0);
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** A small deterministic generator, so the demo is the same on every load. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state / 2_147_483_648;
  };
}

// ---------------------------------------------------------------------------

export function fixtureAis(): AisSummary {
  const random = seeded(7);
  const accumulator = createAisAccumulator();
  // Busy straits get many vessels, the Cape very few — as coverage would give.
  const counts: Record<string, number> = {
    'singapore-strait': 64,
    dover: 41,
    gibraltar: 28,
    hormuz: 19,
    'taiwan-strait': 17,
    bosphorus: 15,
    suez: 12,
    panama: 9,
    'bab-el-mandeb': 3,
    'cape-of-good-hope': 0,
  };
  let mmsi = 999_000_001;
  for (const node of CHOKEPOINTS) {
    if (!node.box) continue;
    const [[south, west], [north, east]] = node.box;
    for (let i = 0; i < (counts[node.id] ?? 0); i += 1) {
      const underway = random() > 0.3;
      accumulator.add({
        MessageType: 'PositionReport',
        Message: { PositionReport: { Sog: underway ? 6 + random() * 12 : random() * 0.4 } },
        MetaData: {
          MMSI: mmsi,
          ShipName: '[SAMPLE] VESSEL',
          latitude: south + random() * (north - south),
          longitude: west + random() * (east - west),
          time_utc: `${iso(1 + random() * 2).replace('T', ' ').slice(0, 19)}.000000 +0000 UTC`,
        },
      });
      mmsi += 1;
    }
  }
  return accumulator.summary(iso(1), 30);
}

export function fixtureGdelt(): GdeltRaw {
  const random = seeded(11);
  const base: Record<string, number> = {
    chokepoints: 38,
    'ports-labour': 22,
    'trade-policy': 31,
    energy: 27,
  };
  const series: GdeltRaw['series'] = GDELT_THEMES.map((theme) => {
    // One theme demonstrates a partial failure: the rate limit GDELT enforces.
    if (theme.id === 'energy') {
      return {
        themeId: theme.id,
        fetched: null,
        error: 'GDELT is rate-limiting requests; it will be retried next cycle.',
      };
    }
    const data = Array.from({ length: 96 }, (_, i) => {
      const minutesAgo = (95 - i) * 15 + 20;
      // A late surge on chokepoints so the sparkline has a shape worth reading.
      const surge = theme.id === 'chokepoints' && i > 80 ? (i - 80) * 6 : 0;
      return {
        date: gdeltStamp(minutesAgo),
        value: Math.round(base[theme.id] * (0.6 + random() * 0.8) + surge),
        norm: 18_000 + Math.round(random() * 4_000),
      };
    });
    return {
      themeId: theme.id,
      fetched: { body: { timeline: [{ series: 'Article Count', data }] }, served: iso(20) },
      error: null,
    };
  });

  const articles = [
    ['[SAMPLE] Container lines extend diversions as canal transits stay below normal', 'example.invalid', 25],
    ['[SAMPLE] Dockworkers set a strike deadline at two northern European terminals', 'example.invalid', 48],
    ['[SAMPLE] Export licence rules tightened for a processed critical mineral', 'example.invalid', 71],
    ['[SAMPLE] Port authority reports vessel queue easing after weekend closure', 'example.invalid', 96],
    ['[SAMPLE] Refinery restart delayed, regional fuel supply tightens', 'example.invalid', 130],
    ['[SAMPLE] Shipping insurers revise war-risk premiums for a key strait', 'example.invalid', 175],
  ].map(([title, domain, minutes], i) => ({
    url: `https://${domain}/sample-headline-${i + 1}`,
    title,
    seendate: gdeltStamp(minutes as number),
    domain,
    language: 'English',
    sourcecountry: '[SAMPLE]',
  }));

  return {
    series,
    headlines: { fetched: { body: { articles }, served: iso(20) }, error: null },
  };
}

export function fixtureUsgs(): FetchedJson {
  const quake = (id: string, mag: number, lat: number, lon: number, minutes: number, place: string) => ({
    type: 'Feature',
    id,
    properties: {
      mag,
      place: `[SAMPLE] ${place}`,
      time: ago(minutes).getTime(),
      url: `https://example.invalid/quake/${id}`,
      tsunami: 0,
      alert: mag >= 6 ? 'yellow' : null,
    },
    geometry: { type: 'Point', coordinates: [lon, lat, 18] },
  });
  return {
    body: {
      type: 'FeatureCollection',
      metadata: { generated: ago(4).getTime(), count: 4 },
      features: [
        quake('sample-q1', 6.1, 23.9, 121.6, 140, 'Offshore, east of a major island'),
        quake('sample-q2', 5.2, 36.4, 140.9, 320, 'Near a coastal prefecture'),
        quake('sample-q3', 4.8, -6.1, 130.4, 610, 'Remote sea region'),
        quake('sample-q4', 4.6, 38.1, 27.1, 900, 'Inland, near an industrial coast'),
      ],
    },
    served: iso(4),
  };
}

export function fixtureGdacs(): FetchedJson {
  // Updated eight hours ago, so the demo shows a DELAYED source.
  return {
    body: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [122.4, 27.8] },
          properties: {
            eventtype: 'TC',
            eventid: 9_000_001,
            name: '[SAMPLE] Tropical cyclone approaching an east Asian coast',
            alertlevel: 'Red',
            country: '[SAMPLE]',
            fromdate: iso(3 * 24 * 60),
            todate: iso(8 * 60),
            datemodified: iso(8 * 60),
            url: { report: 'https://example.invalid/gdacs/tc-9000001' },
          },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [90.4, 23.7] },
          properties: {
            eventtype: 'FL',
            eventid: 9_000_002,
            name: '[SAMPLE] Monsoon flooding in a river delta',
            alertlevel: 'Orange',
            country: '[SAMPLE]',
            fromdate: iso(6 * 24 * 60),
            todate: iso(10 * 60),
            datemodified: iso(10 * 60),
            url: { report: 'https://example.invalid/gdacs/fl-9000002' },
          },
        },
      ],
    },
    served: iso(8 * 60),
  };
}

export function fixtureNhc(): FetchedJson {
  // Empty on purpose: the most common real state, and the one that most needs
  // to read correctly ("none active", not "unavailable").
  return { body: { activeStorms: [] }, served: iso(6) };
}

export function fixtureEonet(): FetchedJson {
  // Latest update eight days ago, so the demo shows a STALE source.
  const event = (id: string, title: string, category: string, lat: number, lon: number, minutes: number) => ({
    id,
    title: `[SAMPLE] ${title}`,
    link: `https://example.invalid/eonet/${id}`,
    categories: [{ id: category.toLowerCase(), title: category }],
    sources: [{ id: 'SAMPLE', url: `https://example.invalid/eonet/${id}/source` }],
    geometry: [{ date: iso(minutes), type: 'Point', coordinates: [lon, lat] }],
  });
  return {
    body: {
      events: [
        event('sample-e1', 'Wildfire near a port hinterland', 'Wildfires', 33.9, -117.9, 8 * 24 * 60),
        event('sample-e2', 'Volcanic ash advisory', 'Volcanoes', 31.6, 130.7, 9 * 24 * 60),
        event('sample-e3', 'Wildfire far from any trade node', 'Wildfires', 64.1, -150.2, 10 * 24 * 60),
      ],
    },
    served: iso(8 * 24 * 60),
  };
}

export function fixtureWeather(): FetchedJson {
  const random = seeded(3);
  const time = new Date(Date.now() - 12 * MINUTE);
  time.setUTCMinutes(Math.floor(time.getUTCMinutes() / 15) * 15, 0, 0);
  const stamp = time.toISOString().slice(0, 16);
  return {
    body: PORTS.map((port) => {
      // One port in a gale, so the ranking has something to rank.
      const wind = port.id === 'ningbo' ? 18.4 : 2 + random() * 9;
      return {
        latitude: port.lat,
        longitude: port.lon,
        current: {
          time: stamp,
          interval: 900,
          wind_speed_10m: Math.round(wind * 10) / 10,
          wind_gusts_10m: Math.round(wind * 1.45 * 10) / 10,
        },
      };
    }),
    served: iso(12),
  };
}
