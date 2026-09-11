/**
 * Chooses the content source. This is the only place that decides, and it
 * decides once at module load.
 */

import type { ContentSource } from '../types';
import { fixturesSource } from './fixtures';
import { localFilesSource } from './local-files';

export type ContentSourceName = 'local' | 'fixtures';

export function getContentSourceName(): ContentSourceName {
  return process.env.CONTENT_SOURCE === 'fixtures' ? 'fixtures' : 'local';
}

export function getContentSource(): ContentSource {
  return getContentSourceName() === 'fixtures' ? fixturesSource : localFilesSource;
}
