/**
 * The public API for the disruption register and the exposure chart.
 *
 * Pages import from here and never from ./sources — the same boundary the
 * issue content layer keeps, enforced by the same lint rule.
 */

import type {
  Disruption,
  DisruptionStatus,
  DisruptionSummary,
  Entity,
  EntityExposure,
  Exposure,
  Severity,
} from './types';
import { SEVERITY_RANK } from './types';
import { readDisruptions } from './sources/local-files';

export * from './types';

/** Everything in the register, active first, then most recently reviewed. */
export async function listDisruptions(): Promise<Disruption[]> {
  return readDisruptions();
}

/** The ones still in play. Resolved entries stay in the register but not here. */
export async function listOpenDisruptions(): Promise<Disruption[]> {
  const all = await readDisruptions();
  return all.filter((entry) => entry.status !== 'resolved');
}

export async function getDisruption(id: string): Promise<Disruption | null> {
  const all = await readDisruptions();
  return all.find((entry) => entry.id === id) ?? null;
}

export async function listDisruptionIds(): Promise<string[]> {
  return (await readDisruptions()).map((entry) => entry.id);
}

export async function countByStatus(): Promise<Record<DisruptionStatus, number>> {
  const all = await readDisruptions();
  const counts: Record<DisruptionStatus, number> = {
    watch: 0,
    active: 0,
    easing: 0,
    resolved: 0,
  };
  for (const entry of all) counts[entry.status] += 1;
  return counts;
}

/**
 * An entry reviewed longer ago than this is shown as stale rather than current.
 *
 * The alternative — quietly presenting a month-old assessment as today's — is
 * the single fastest way for a site like this to mislead someone.
 */
export const STALE_AFTER_DAYS = 21;

export function daysSince(iso: string, now: Date = new Date()): number | null {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  return Math.floor((now.getTime() - then.getTime()) / 86_400_000);
}

export function isStale(iso: string, now?: Date): boolean {
  const days = daysSince(iso, now);
  return days !== null && days > STALE_AFTER_DAYS;
}

/** The chart's shape: entity rows against disruption columns. */
export interface ExposureMatrix {
  /** Chart columns, in register order. */
  disruptions: DisruptionSummary[];
  /** Chart rows, worst-exposed first. */
  rows: EntityExposure[];
  /** Rows grouped by the entity's sector, for the mobile and table views. */
  bySector: Array<{ sector: string; rows: EntityExposure[] }>;
  /** Every exposure, flattened — backs the table view. */
  all: Array<{ disruption: DisruptionSummary; exposure: Exposure }>;
  /** How many distinct entities and claims the chart is drawing. */
  entityCount: number;
  exposureCount: number;
}

function worstOf(exposures: Exposure[]): Severity {
  return exposures.reduce<Severity>(
    (worst, exposure) =>
      SEVERITY_RANK[exposure.severity] > SEVERITY_RANK[worst] ? exposure.severity : worst,
    'low',
  );
}

/**
 * Build the matrix.
 *
 * Rows are ordered by worst severity, then by how many disruptions reach the
 * entity, then alphabetically — so the most exposed names are at the top where
 * a reader looks first, and the order is stable between builds.
 */
export async function buildExposureMatrix(options?: {
  /** Include resolved disruptions. Default false — the chart shows live risk. */
  includeResolved?: boolean;
}): Promise<ExposureMatrix> {
  const includeResolved = options?.includeResolved ?? false;
  const all = await readDisruptions();
  const disruptions = includeResolved ? all : all.filter((entry) => entry.status !== 'resolved');

  const byEntity = new Map<
    string,
    { entity: Entity; byDisruption: Map<string, Exposure>; exposures: Exposure[] }
  >();
  const flattened: Array<{ disruption: DisruptionSummary; exposure: Exposure }> = [];

  for (const disruption of disruptions) {
    for (const exposure of disruption.exposures) {
      flattened.push({ disruption, exposure });

      const existing = byEntity.get(exposure.entity.id);
      if (existing) {
        existing.byDisruption.set(disruption.id, exposure);
        existing.exposures.push(exposure);
      } else {
        byEntity.set(exposure.entity.id, {
          entity: exposure.entity,
          byDisruption: new Map([[disruption.id, exposure]]),
          exposures: [exposure],
        });
      }
    }
  }

  const rows: EntityExposure[] = [...byEntity.values()]
    .map(({ entity, byDisruption, exposures }) => ({
      entity,
      byDisruption,
      worstSeverity: worstOf(exposures),
      count: exposures.length,
    }))
    .sort((a, b) => {
      const bySeverity = SEVERITY_RANK[b.worstSeverity] - SEVERITY_RANK[a.worstSeverity];
      if (bySeverity !== 0) return bySeverity;
      if (b.count !== a.count) return b.count - a.count;
      return a.entity.name.localeCompare(b.entity.name);
    });

  const sectors = new Map<string, EntityExposure[]>();
  for (const row of rows) {
    const bucket = sectors.get(row.entity.sector);
    if (bucket) bucket.push(row);
    else sectors.set(row.entity.sector, [row]);
  }

  return {
    disruptions,
    rows,
    bySector: [...sectors.entries()]
      .map(([sector, sectorRows]) => ({ sector, rows: sectorRows }))
      .sort((a, b) => a.sector.localeCompare(b.sector)),
    all: flattened,
    entityCount: rows.length,
    exposureCount: flattened.length,
  };
}

/** Everything reaching one entity, for its section on the exposure page. */
export async function getEntityExposure(entityId: string): Promise<{
  entity: Entity;
  items: Array<{ disruption: DisruptionSummary; exposure: Exposure }>;
} | null> {
  const matrix = await buildExposureMatrix({ includeResolved: true });
  const items = matrix.all.filter((item) => item.exposure.entity.id === entityId);
  if (items.length === 0) return null;
  return { entity: items[0].exposure.entity, items };
}
