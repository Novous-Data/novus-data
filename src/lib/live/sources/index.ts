/**
 * Chooses where live readings come from, and assembles the snapshot.
 *
 * CONTENT_SOURCE=fixtures means the same thing here as it does for the issue
 * archive and the register, so `npm run dev:demo` populates every page at
 * once. Deciding it here is also what puts ./fixtures in the import graph, and
 * so what makes its production guard fire.
 *
 * ---------------------------------------------------------------------------
 * ISOLATION
 *
 * Every source is settled independently. A feed that is down, slow, rate
 * limited or reshaped becomes one panel saying "unavailable" and why — it
 * never throws out of here, never delays the others beyond its own timeout,
 * and never takes the page with it. `Promise.all` over settled promises is
 * safe for exactly that reason.
 * ---------------------------------------------------------------------------
 */

import { SOURCE_META } from '../meta';
import type { LiveSnapshot, LiveSourceId, Reading } from '../types';
import { fetchAis, parseAis } from './ais';
import { fetchEonet, parseEonet } from './eonet';
import * as fixtures from './fixtures';
import { fetchGdacs, parseGdacs } from './gdacs';
import { fetchGdelt, parseGdelt } from './gdelt';
import { LiveSourceError } from './http';
import { fetchNhc, parseNhc } from './nhc';
import { fetchUsgs, parseUsgs } from './usgs';
import { fetchWeather, parseWeather } from './weather';

export type LiveSourceName = 'network' | 'fixtures';

export function getLiveSourceName(): LiveSourceName {
  return process.env.CONTENT_SOURCE === 'fixtures' ? 'fixtures' : 'network';
}

async function settle<T>(source: LiveSourceId, run: () => Promise<Reading<T>>): Promise<Reading<T>> {
  try {
    return await run();
  } catch (error) {
    const reason =
      error instanceof LiveSourceError
        ? error.publicReason
        : `${SOURCE_META[source].name} could not be read.`;
    // The reason is always a sentence this layer wrote, so it is safe to log.
    console.warn(`[live] ${source}: ${reason}`);
    return { status: 'unavailable', source, reason };
  }
}

/** Server-only secret. Read here, passed to the adapter, never stored in a Reading. */
function aisKey(): string | null {
  const key = process.env.AISSTREAM_API_KEY?.trim();
  return key ? key : null;
}

export async function readLiveSnapshot(): Promise<LiveSnapshot> {
  const demo = getLiveSourceName() === 'fixtures';

  const [ais, gdelt, usgs, gdacs, nhc, eonet, weather] = await Promise.all([
    settle('ais', async () => {
      if (demo) return parseAis(fixtures.fixtureAis());
      const key = aisKey();
      if (!key) return { status: 'not-configured' as const, source: 'ais' as const, envVar: 'AISSTREAM_API_KEY' };
      return parseAis(await fetchAis(key));
    }),
    settle('gdelt', async () => parseGdelt(demo ? fixtures.fixtureGdelt() : await fetchGdelt())),
    settle('usgs', async () => parseUsgs(demo ? fixtures.fixtureUsgs() : await fetchUsgs())),
    settle('gdacs', async () => parseGdacs(demo ? fixtures.fixtureGdacs() : await fetchGdacs())),
    settle('nhc', async () => parseNhc(demo ? fixtures.fixtureNhc() : await fetchNhc())),
    settle('eonet', async () => parseEonet(demo ? fixtures.fixtureEonet() : await fetchEonet())),
    settle('weather', async () => parseWeather(demo ? fixtures.fixtureWeather() : await fetchWeather())),
  ]);

  return {
    // When this snapshot was assembled — i.e. when the page was regenerated.
    // Displayed as such, and never used as any reading's age.
    generatedAt: new Date().toISOString(),
    ais,
    gdelt,
    usgs,
    gdacs,
    nhc,
    eonet,
    weather,
  };
}
