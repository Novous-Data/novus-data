'use client';

import { useState, type KeyboardEvent, type PointerEvent } from 'react';

import { formatCount, formatShare, formatUtcShort } from '@/lib/live/display';
import type { SignalPoint } from '@/lib/live/types';

/**
 * One theme's news volume over the past day: a sparkline with a crosshair.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS PLOTTED, AND WHY IT IS A SHARE RATHER THAN A COUNT
 *
 * The line is the theme's share of everything GDELT monitored in each
 * fifteen-minute interval, not the raw article count. The world's news output
 * has a strong daily cycle — far fewer articles are published at 03:00 UTC
 * than at 14:00 — so a raw count rises and falls every day whether or not
 * anything happened, and a reader would see a "spike" every afternoon. The
 * share cancels that cycle out. It is also what GDELT's own volume charts
 * show. The raw count is still on the page: in the readout and the table.
 *
 * ---------------------------------------------------------------------------
 * FORM
 *
 * One series per chart, so no legend — the heading names it. Four themes are
 * four charts rather than four lines on one, because their volumes differ by
 * an order of magnitude and a shared axis would flatten three of them. Each
 * chart therefore has its own scale, labelled on the right (the financial
 * convention), and the page says so above them: compare shapes, not heights.
 *
 * The line is --accent (3.1:1 on --ink, clear of the 3:1 a non-text mark
 * needs; structural colour, which is exactly its sanctioned use), and the
 * current point is --accent-text — the one emphasised mark. Amber is never
 * used: it is reserved for the register's "active" status.
 *
 * Hand-written SVG, not a chart library (§7). The SVG stretches to its box
 * with `non-scaling-stroke`, so the line stays 2px at every width; the dots
 * and crosshair are HTML positioned in percentages, so they stay round.
 * ---------------------------------------------------------------------------
 */

interface Plotted {
  point: SignalPoint;
  /** Share of monitored coverage, in per cent. Null when GDELT monitored nothing in the interval. */
  share: number | null;
}

/** The smallest 1 / 2 / 2.5 / 5 × 10ⁿ at or above `value`, so the scale label is a round number. */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const base = 10 ** exponent;
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * base >= value) return step * base;
  }
  return 10 * base;
}

export function SignalChart({ label, points }: { label: string; points: SignalPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [keyboard, setKeyboard] = useState(false);

  const plotted: Plotted[] = points.map((point) => ({
    point,
    share: point.monitored > 0 ? (point.articles / point.monitored) * 100 : null,
  }));
  const shares = plotted.map((p) => p.share).filter((s): s is number => s !== null);

  if (shares.length === 0) {
    return (
      <figure>
        <figcaption className="text-[0.9375rem] font-semibold text-fg">{label}</figcaption>
        <p className="mt-2 text-meta text-muted">No measurable coverage in the past day.</p>
      </figure>
    );
  }

  const top = niceCeil(Math.max(...shares));
  const count = plotted.length;
  const x = (index: number) => (count === 1 ? 100 : (index / (count - 1)) * 100);
  const y = (share: number) => (1 - share / top) * 100;

  // A gap in the data is a gap in the line, not a dive to zero.
  let path = '';
  let penDown = false;
  plotted.forEach((p, index) => {
    if (p.share === null) {
      penDown = false;
      return;
    }
    path += `${penDown ? 'L' : 'M'}${x(index).toFixed(3)} ${y(p.share).toFixed(3)} `;
    penDown = true;
  });

  const latestIndex = plotted.findLastIndex((p) => p.share !== null);
  const peakIndex = plotted.reduce(
    (best, p, index) => (p.share !== null && p.share > (plotted[best].share ?? -1) ? index : best),
    latestIndex,
  );
  const latest = plotted[latestIndex];
  const peak = plotted[peakIndex];
  const first = plotted[0].point;

  const shown = active !== null ? plotted[active] : null;

  function moveTo(index: number) {
    setActive(Math.max(0, Math.min(count - 1, index)));
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    setKeyboard(false);
    moveTo(Math.round(((event.clientX - rect.left) / rect.width) * (count - 1)));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = active ?? latestIndex;
    const moves: Record<string, number> = {
      ArrowLeft: current - 1,
      ArrowRight: current + 1,
      Home: 0,
      End: count - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      setKeyboard(true);
      moveTo(moves[event.key]);
    } else if (event.key === 'Escape') {
      setActive(null);
    }
  }

  const readout = (p: Plotted) =>
    p.share === null
      ? `${formatUtcShort(p.point.at)} UTC: nothing monitored in this interval`
      : `${formatUtcShort(p.point.at)} UTC: ${formatShare(p.share)} of coverage, ${formatCount(p.point.articles)} of ${formatCount(p.point.monitored)} articles`;

  // Anchor the readout so it never runs off either edge of the chart.
  const tipX = active !== null ? x(active) : 0;
  const tipAnchor = tipX < 22 ? 'translate-x-0' : tipX > 78 ? '-translate-x-full' : '-translate-x-1/2';

  return (
    <figure>
      <figcaption>
        <span className="block text-[0.9375rem] font-semibold text-fg">{label}</span>
        <span className="mt-1 flex flex-wrap items-baseline gap-x-2 text-meta text-muted">
          <span data-numeric className="text-[1.375rem] font-semibold leading-none text-fg">
            {latest.share !== null ? formatShare(latest.share) : '—'}
          </span>
          <span>of coverage in the latest interval</span>
        </span>
      </figcaption>

      <div className="mt-3 grid grid-cols-[1fr_auto] gap-x-2">
        <div
          role="group"
          tabIndex={0}
          aria-label={`${label}: share of news coverage, fifteen-minute intervals over the past day. Use the arrow keys to read each interval.`}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
          onFocus={() => {
            if (active === null) setActive(latestIndex);
          }}
          onBlur={() => setActive(null)}
          onKeyDown={onKeyDown}
          className="relative h-20 cursor-crosshair touch-pan-y"
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            {/* Recessive frame: the scale top and the zero baseline, solid hairlines. */}
            <line x1="0" x2="100" y1="0" y2="0" stroke="var(--border)" vectorEffect="non-scaling-stroke" />
            <line x1="0" x2="100" y1="100" y2="100" stroke="var(--border-strong)" vectorEffect="non-scaling-stroke" />
            <path
              d={path}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {latest.share !== null ? (
            <span
              aria-hidden="true"
              className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-link ring-2 ring-ink"
              style={{ left: `${x(latestIndex)}%`, top: `${y(latest.share)}%` }}
            />
          ) : null}

          {shown && active !== null ? (
            <>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 w-px bg-[color-mix(in_srgb,var(--text-muted)_55%,transparent)]"
                style={{ left: `${x(active)}%` }}
              />
              {shown.share !== null ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg ring-2 ring-ink"
                  style={{ left: `${x(active)}%`, top: `${y(shown.share)}%` }}
                />
              ) : null}
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute bottom-[calc(100%+0.5rem)] z-10 w-max max-w-[16rem] ${tipAnchor} rounded-[2px] border border-rule bg-surface-2 px-2.5 py-1.5 text-meta shadow-[0_8px_24px_rgb(0_0_0/0.5)]`}
                style={{ left: `${x(active)}%` }}
              >
                <span data-numeric className="block font-semibold text-fg">
                  {shown.share !== null ? formatShare(shown.share) : 'No data'}
                </span>
                <span className="block text-muted">
                  <span data-numeric>{formatCount(shown.point.articles)}</span> of{' '}
                  <span data-numeric>{formatCount(shown.point.monitored)}</span> articles
                </span>
                <span className="block text-muted">
                  <time dateTime={shown.point.at}>{formatUtcShort(shown.point.at)}</time> UTC
                </span>
              </span>
            </>
          ) : null}
        </div>

        {/* The scale, on the right as a financial chart carries it. */}
        <div aria-hidden="true" className="flex h-20 flex-col justify-between text-[0.6875rem] leading-none text-muted">
          <span data-numeric className="-translate-y-1/2">{formatShare(top)}</span>
          <span data-numeric className="translate-y-1/2">0%</span>
        </div>
      </div>

      <div aria-hidden="true" className="mt-1.5 flex justify-between pr-10 text-[0.6875rem] text-muted">
        <time dateTime={first.at}>{formatUtcShort(first.at)}</time>
        <time dateTime={latest.point.at}>{formatUtcShort(latest.point.at)} UTC</time>
      </div>

      <p className="mt-2 text-meta text-muted">
        Latest: <span data-numeric>{formatCount(latest.point.articles)}</span> of{' '}
        <span data-numeric>{formatCount(latest.point.monitored)}</span> articles.
        {peakIndex !== latestIndex && peak.share !== null ? (
          <>
            {' '}
            Day&rsquo;s high <span data-numeric>{formatShare(peak.share)}</span> at{' '}
            <time dateTime={peak.point.at}>{formatUtcShort(peak.point.at)}</time> UTC.
          </>
        ) : (
          ' The latest interval is the day’s high.'
        )}
      </p>

      {/* Announced only for keyboard movement, so a mouse sweep does not
          flood a screen reader with ninety-six readouts. */}
      <p className="sr-only" aria-live="polite">
        {keyboard && shown ? readout(shown) : ''}
      </p>
    </figure>
  );
}
