/**
 * What is known about each live source before any data is fetched.
 *
 * Pure data, safe anywhere. The page's source panel and its attribution block
 * both read from here, so a source cannot appear on the page without its
 * terms beside it.
 *
 * ---------------------------------------------------------------------------
 * ON THE `terms` LINES
 *
 * Each says exactly how far the terms were verified, because every source here
 * is republished and the terms genuinely matter — in particular for a
 * publication that intends to charge. Two were checked against the publisher's
 * own statements at build time and carry obligations that bite:
 *
 *   - Open-Meteo's free API is NON-COMMERCIAL ONLY. Its terms count a site
 *     with subscriptions or advertising as commercial. The day Novus Data
 *     monetises, this source needs a paid plan or has to go.
 *   - GDELT permits commercial use but requires a citation and a link to
 *     gdeltproject.org wherever the data is used or redistributed.
 *
 * The rest are marked "not verified" rather than given a plausible-sounding
 * licence. An invented terms line is worse than an honest gap.
 *
 * Freshness windows are per source because cadences differ by orders of
 * magnitude: a vessel count is old after half an hour, a hurricane advisory is
 * issued every three to six hours, and EONET is curated daily.
 * ---------------------------------------------------------------------------
 */

import type { LiveSourceId, SourceMeta } from './types';

export const SOURCE_META: Record<LiveSourceId, SourceMeta> = {
  ais: {
    id: 'ais',
    name: 'AISStream',
    publisher: 'AISStream.io',
    measures: 'Vessels heard at ten chokepoints',
    homepage: 'https://aisstream.io/',
    cadence: 'Continuous vessel broadcasts; sampled here for 30 seconds every fifteen minutes',
    terms:
      'Free with a registered API key; must be read from a server, never a browser (AISStream documentation). Full terms not verified in this build — read them before commercial use.',
    delayedAfterMinutes: 30,
    staleAfterMinutes: 90,
    requiresEnv: 'AISSTREAM_API_KEY',
  },
  gdelt: {
    id: 'gdelt',
    name: 'GDELT DOC 2.0',
    publisher: 'The GDELT Project',
    measures: 'News volume on four disruption themes',
    homepage: 'https://www.gdeltproject.org/',
    cadence: 'Every fifteen minutes',
    terms:
      'Free and open, commercial use permitted, provided every use cites the GDELT Project with a link to gdeltproject.org (GDELT data page).',
    delayedAfterMinutes: 45,
    staleAfterMinutes: 180,
    requiresEnv: null,
  },
  usgs: {
    id: 'usgs',
    name: 'Earthquake Hazards Program feeds',
    publisher: 'U.S. Geological Survey',
    measures: 'Earthquakes, magnitude 4.5 and above',
    homepage: 'https://earthquake.usgs.gov/earthquakes/feed/',
    cadence: 'Feed regenerated every minute',
    terms: 'U.S. federal government data. Terms not re-verified in this build.',
    delayedAfterMinutes: 30,
    staleAfterMinutes: 120,
    requiresEnv: null,
  },
  gdacs: {
    id: 'gdacs',
    name: 'Global Disaster Alert and Coordination System',
    publisher: 'European Commission JRC and UN OCHA',
    measures: 'Orange and red disaster alerts',
    homepage: 'https://www.gdacs.org/',
    cadence: 'Alerts issued and updated as events develop',
    terms: 'Terms not verified in this build — check before republishing.',
    delayedAfterMinutes: 6 * 60,
    staleAfterMinutes: 48 * 60,
    requiresEnv: null,
  },
  nhc: {
    id: 'nhc',
    name: 'Active tropical cyclones',
    publisher: 'NOAA National Hurricane Center',
    measures: 'Hurricanes and tropical storms, Atlantic and eastern Pacific',
    homepage: 'https://www.nhc.noaa.gov/',
    cadence: 'Advisories every three to six hours per storm (Atlantic and eastern Pacific)',
    terms: 'U.S. federal government data. Terms not re-verified in this build.',
    delayedAfterMinutes: 7 * 60,
    staleAfterMinutes: 24 * 60,
    requiresEnv: null,
  },
  eonet: {
    id: 'eonet',
    name: 'Earth Observatory Natural Event Tracker',
    publisher: 'NASA',
    measures: 'Open natural events near trade routes',
    homepage: 'https://eonet.gsfc.nasa.gov/',
    cadence: 'Curated from upstream sources, typically daily',
    terms: 'U.S. federal government data. Terms not re-verified in this build.',
    delayedAfterMinutes: 36 * 60,
    staleAfterMinutes: 7 * 24 * 60,
    requiresEnv: null,
  },
  weather: {
    id: 'weather',
    name: 'Open-Meteo forecast API',
    publisher: 'Open-Meteo',
    measures: 'Wind at twelve container ports',
    homepage: 'https://open-meteo.com/',
    cadence: 'Current conditions at fifteen-minute resolution',
    terms:
      'Free API is for NON-COMMERCIAL use only; a site with subscriptions or advertising needs a paid plan (Open-Meteo terms). Data under CC BY 4.0, attribution required.',
    delayedAfterMinutes: 45,
    staleAfterMinutes: 180,
    requiresEnv: null,
  },
};
