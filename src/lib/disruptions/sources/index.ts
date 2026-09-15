/**
 * Chooses the register source, mirroring the issue layer's factory so that
 * CONTENT_SOURCE means the same thing for both. Deciding once, here, is also
 * what puts ./fixtures in the app's import graph — which is what makes its
 * "never in a production build" guard actually fire.
 */

import type { Disruption } from '../types';
import { fixtureDisruptions } from './fixtures';
import { readDisruptions as readLocalDisruptions } from './local-files';

export type DisruptionSourceName = 'local' | 'fixtures';

export function getDisruptionSourceName(): DisruptionSourceName {
  return process.env.CONTENT_SOURCE === 'fixtures' ? 'fixtures' : 'local';
}

export async function readFromActiveSource(): Promise<Disruption[]> {
  if (getDisruptionSourceName() === 'fixtures') return fixtureDisruptions;
  return readLocalDisruptions();
}
