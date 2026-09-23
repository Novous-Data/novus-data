import Link from 'next/link';
import type { ReactNode } from 'react';

import { StatusBadge } from '@/components/status-badge';
import type { DisruptionStatus } from '@/lib/disruptions/types';
import { formatRatio } from '@/lib/live/display';
import { nodeById } from '@/lib/live/nodes';
import { REPORTING_LEVEL_LABELS, type PlaceSummary, type TradeNodeKind } from '@/lib/live/types';

const KIND_LABELS: Record<TradeNodeKind, string> = {
  chokepoint: 'Chokepoint',
  port: 'Port',
  industrial: 'Industrial cluster',
};

export interface PlaceRegisterEntry {
  id: string;
  title: string;
  status: DisruptionStatus;
}

/**
 * The place board: every tracked place, with everything the live feeds say
 * about it and every register entry that names it, in one row.
 *
 * It exists because each feed on this page answers a different question
 * about the same few dozen places, and a reader asking "what is going on at
 * Rotterdam" should not have to assemble the answer from six panels. Nothing
 * here is new data — it is the page's own readings, regrouped by place — and
 * nothing is combined into a score. Each cell says what its own feed said.
 *
 * Places with flags come first, then the rest in their fixed order, so what
 * needs attention leads without the quiet rows reshuffling on every update.
 */
export function PlaceBoard({
  places,
  register,
}: {
  places: PlaceSummary[];
  register: Record<string, PlaceRegisterEntry[]>;
}) {
  const ordered = places
    .map((place, index) => ({ place, index }))
    .sort((a, b) => b.place.flags - a.place.flags || a.index - b.index)
    .map(({ place }) => place);

  return (
    <ul className="border-b border-hairline">
      {ordered.map((place) => {
        const node = nodeById(place.nodeId);
        if (!node) return null;
        const entries = register[place.nodeId] ?? [];
        return (
          <li
            key={place.nodeId}
            id={`place-${place.nodeId}`}
            className="grid scroll-mt-8 gap-x-6 gap-y-2 border-t border-hairline py-3 md:grid-cols-[13rem_1fr_1fr_1fr]"
          >
            <div>
              <span className="block text-[0.9375rem] font-semibold leading-snug text-fg">{node.name}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-meta text-muted">
                {KIND_LABELS[node.kind]}
                {place.flags > 0 ? (
                  <span className="font-semibold text-fg">
                    · <span data-numeric>{place.flags}</span> {place.flags === 1 ? 'flag' : 'flags'}
                  </span>
                ) : null}
              </span>
            </div>

            <Cell label="Conflict reporting">
              {place.reporting && place.reporting.reports === 0 ? (
                <span className="text-muted">None in the last three hours</span>
              ) : place.reporting ? (
                <>
                  <span className={place.reporting.level === 'normal' ? 'text-muted' : 'font-semibold text-fg'}>
                    {REPORTING_LEVEL_LABELS[place.reporting.level]}
                  </span>{' '}
                  <span className="text-muted">
                    · <span data-numeric>{formatRatio(place.reporting.ratio)}</span> normal,{' '}
                    <span data-numeric>{Math.round(place.reporting.reports)}</span> reports
                  </span>
                </>
              ) : (
                <span className="text-muted">No reading</span>
              )}
            </Cell>

            <Cell label="Hazards within reach">
              <HazardSummary place={place} />
            </Cell>

            <Cell label={node.kind === 'port' ? 'Wind' : node.kind === 'chokepoint' ? 'Ships' : 'Register'}>
              {node.kind === 'port' ? (
                place.wind ? (
                  <span className={place.wind.beaufort >= 7 ? 'font-semibold text-fg' : 'text-muted'}>
                    Beaufort <span data-numeric>{place.wind.beaufort}</span>, {place.wind.label.toLowerCase()}
                  </span>
                ) : (
                  <span className="text-muted">No reading</span>
                )
              ) : node.kind === 'chokepoint' ? (
                place.vessels ? (
                  <span className="text-muted">
                    <span data-numeric className="text-fg">{place.vessels.underway}</span> under way,{' '}
                    <span data-numeric>{place.vessels.heard}</span> heard
                  </span>
                ) : (
                  <span className="text-muted">No signal or not sampled</span>
                )
              ) : null}
              {entries.length > 0 ? (
                <span className="mt-1 block space-y-1">
                  {entries.map((entry) => (
                    <span key={entry.id} className="flex flex-wrap items-center gap-x-2">
                      <StatusBadge status={entry.status} />
                      <Link
                        href={`/disruptions/${entry.id}`}
                        className="text-link underline decoration-[color-mix(in_srgb,var(--accent-text)_45%,transparent)] underline-offset-[0.2em]"
                      >
                        {entry.title}
                      </Link>
                    </span>
                  ))}
                </span>
              ) : node.kind === 'industrial' ? (
                <span className="text-muted">No register entry</span>
              ) : null}
            </Cell>
          </li>
        );
      })}
    </ul>
  );
}

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="text-meta">
      {/* The column headings, shown per cell so the row still reads when the
          grid stacks on a phone. */}
      <span className="block text-muted md:sr-only">{label}</span>
      <span className="block">{children}</span>
    </div>
  );
}

function HazardSummary({ place }: { place: PlaceSummary }) {
  const parts: ReactNode[] = [];
  if (place.quakes.count > 0 && place.quakes.maxMagnitude !== null) {
    parts.push(
      <span key="q">
        {place.quakes.count === 1 ? 'Earthquake' : `${place.quakes.count} earthquakes`}, max M
        <span data-numeric>{place.quakes.maxMagnitude.toFixed(1)}</span>
      </span>,
    );
  }
  if (place.alerts.count > 0) {
    parts.push(
      <span key="a">
        {place.alerts.worst ?? ''} disaster alert{place.alerts.count > 1 ? 's' : ''}
      </span>,
    );
  }
  if (place.storms.count > 0) {
    parts.push(
      <span key="s">
        Tropical cyclone, <span data-numeric>{place.storms.nearestKm}</span> km
      </span>,
    );
  }
  if (place.events > 0) {
    parts.push(
      <span key="e">
        {place.events} natural event{place.events > 1 ? 's' : ''}
      </span>,
    );
  }
  if (parts.length === 0) return <span className="text-muted">None reported</span>;
  return (
    <span className="font-semibold text-fg">
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 ? ' · ' : ''}
          {part}
        </span>
      ))}
    </span>
  );
}
