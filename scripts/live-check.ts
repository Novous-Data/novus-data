/**
 * `npm run live:check` — read every live feed once, for real, and report what
 * came back.
 *
 *   npm run live:check              the report
 *   npm run live:check -- --strict  exit 1 if any keyless feed is unavailable
 *
 * WHY THIS EXISTS
 *
 * The adapters in src/lib/live/sources/ were written against each publisher's
 * documented response shape, and the environment they were built in could not
 * reach any of the feeds. Every adapter fails safe — a shape it does not
 * recognise becomes "unavailable" on the page, never a wrong number — but
 * "fails safe" is not the same as "works". This is the first thing to run
 * anywhere the network is open, and it answers, per feed: did it respond, did
 * the parser recognise the response, how old is the data, and what caveats
 * were raised.
 *
 * It calls the same readLiveSnapshot() the page calls, so it cannot pass while
 * the page fails. `fetch`'s Next-specific cache options are simply ignored
 * outside Next, so every run here is a real request.
 *
 * **It never prints the AISStream key** — only whether it is set. The same
 * rule as `doctor`: this output is the kind of thing that gets pasted into a
 * chat when asking for help.
 *
 * Takes about 35 seconds: the AIS sample is 30 seconds long, and GDELT has to
 * be paced at one request per five seconds.
 */

import { blank, blocker, colour, detail, heading, info, loadEnvLocal, ok, plural, warn } from './lib/cli';

async function main(): Promise<void> {
  loadEnvLocal();
  const strict = process.argv.includes('--strict');

  // Loaded after .env.local, so the key and CONTENT_SOURCE are visible.
  const { readLiveSnapshot, getLiveSourceName } = await import('@/lib/live/sources');
  const { SOURCE_META } = await import('@/lib/live/meta');
  const { FRESHNESS_LABELS, LIVE_SOURCE_IDS, freshnessFor } = await import('@/lib/live/types');
  const { formatAge } = await import('@/lib/live/display');

  if (getLiveSourceName() === 'fixtures') {
    warn('CONTENT_SOURCE=fixtures is set, so this reads the built-in samples, not the network.');
    detail('Unset it (in .env.local or the shell) to check the real feeds.');
    blank();
  }

  info(`AISSTREAM_API_KEY is ${process.env.AISSTREAM_API_KEY?.trim() ? 'set' : 'not set'}.`);
  info('Reading all seven feeds — about 35 seconds…');

  const started = Date.now();
  const snapshot = await readLiveSnapshot();
  info(`Done in ${((Date.now() - started) / 1000).toFixed(1)} s.`);

  let failures = 0;

  for (const id of LIVE_SOURCE_IDS) {
    const reading = snapshot[id];
    const meta = SOURCE_META[id];
    heading(`${meta.name} — ${meta.measures}`);

    if (reading.status === 'not-configured') {
      info(`Not configured: ${reading.envVar} is not set. The page says "not switched on yet".`);
      continue;
    }
    if (reading.status === 'unavailable') {
      failures += 1;
      blocker(`Unavailable: ${reading.reason}`);
      detail(
        'An HTTP status means the request was answered but refused. A parse failure means\n' +
          'the feed answered and the adapter did not recognise the shape — fix\n' +
          `src/lib/live/sources/${id}.ts and re-run.`,
      );
      continue;
    }

    const age = (Date.now() - Date.parse(reading.asOf)) / 60_000;
    const freshness = freshnessFor(age, meta);
    const line = `As of ${reading.asOf} (${reading.asOfBasis}) — ${formatAge(age)} old, ${FRESHNESS_LABELS[freshness]}`;
    if (freshness === 'live') ok(line);
    else warn(line);

    for (const summary of describe(reading.source, reading.data)) detail(summary);
    for (const note of reading.notes) detail(colour.dim(`note: ${note}`));
  }

  // The same refusal from every keyless feed at once is the signature of the
  // network in between (a proxy or an egress allowlist), not of six unrelated
  // publishers all failing together.
  const keyless = LIVE_SOURCE_IDS.filter((id) => SOURCE_META[id].requiresEnv === null);
  const reasons = keyless.map((id) => snapshot[id]).filter((r) => r.status === 'unavailable');
  if (reasons.length === keyless.length && reasons.every((r) => /HTTP 40[37]/.test(r.status === 'unavailable' ? r.reason : ''))) {
    blank();
    warn('Every keyless feed was refused the same way. That is almost certainly this machine\'s');
    detail(
      'network (a proxy or allowlist), not the feeds. Run this where the internet is open —\n' +
        'your own computer, or check the Vercel build log, where /monitor is generated.',
    );
  }

  blank();
  if (failures === 0) {
    ok('Every configured feed answered and parsed.');
  } else {
    warn(`${plural(failures, 'feed')} unavailable. The page shows each as "unavailable" with the reason above.`);
  }
  blank();

  if (strict && failures > 0) process.exitCode = 1;
}

/** One or two lines per feed saying what was actually recognised in the response. */
function describe(source: string, data: unknown): string[] {
  const d = data as Record<string, unknown>;
  switch (source) {
    case 'ais': {
      const rows = d.chokepoints as Array<{ nodeId: string; vesselsUnderway: number; messages: number }>;
      const heard = rows.filter((row) => row.messages > 0);
      const lines = [
        `${heard.length} of ${rows.length} chokepoint boxes received messages in the ${String(d.windowSeconds)}-second sample.`,
      ];
      if (heard.length > 0) {
        lines.push(heard.map((row) => `${row.nodeId} ${row.vesselsUnderway}`).join(', ') + ' (under way)');
      }
      return lines;
    }
    case 'gdelt': {
      const series = d.series as Array<{ themeId: string; points: unknown[] }>;
      const headlines = d.headlines as unknown[];
      const lines = [
        `${series.length} theme series: ${series.map((s) => `${s.themeId} ${s.points.length} intervals`).join(', ')}.`,
        `${headlines.length} English headlines after de-duplication.`,
      ];
      // A day at fifteen-minute resolution is 96 intervals. Far fewer means
      // GDELT answered at a coarser resolution than the adapter assumes.
      if (series.some((s) => s.points.length < 48)) {
        lines.push(colour.amber('Fewer intervals than a day at 15 minutes (96) — check the timelinevolraw resolution.'));
      }
      return lines;
    }
    case 'usgs':
      return [`${(d.quakes as unknown[]).length} earthquakes, magnitude ${String(d.minMagnitude)}+.`];
    case 'gdacs':
      return [`${(d.alerts as unknown[]).length} open alerts at levels ${(d.levels as string[]).join(', ')}.`];
    case 'nhc':
      return [`${(d.storms as unknown[]).length} active storms.`];
    case 'eonet':
      return [`${String(d.totalOpen)} open events; ${(d.nearTradeNodes as unknown[]).length} near a tracked location.`];
    case 'weather':
      return [`${(d.ports as unknown[]).length} ports with current wind.`];
    default:
      return [];
  }
}

main().catch((error: unknown) => {
  console.error(colour.red('\nlive:check failed to run:'));
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
