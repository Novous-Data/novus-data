import { CONFIDENCE_LABELS, SEVERITIES, SEVERITY_LABELS } from '@/lib/disruptions';

const SWATCH: Record<string, string> = {
  low: 'bg-sev-low',
  moderate: 'bg-sev-moderate',
  high: 'bg-sev-high',
};

/**
 * Always present. A sequential ramp with no key is a picture, not a chart.
 * It carries both channels the chart uses: fill for severity, edge for
 * confidence.
 */
export function SeverityLegend() {
  return (
    <div className="flex flex-col gap-4 border-t border-hairline pt-5 sm:flex-row sm:gap-12">
      <div>
        <p className="text-meta text-muted">Severity of exposure</p>
        <ul className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
          {SEVERITIES.map((severity) => (
            <li key={severity} className="flex items-center gap-2">
              <span
                className={`h-3.5 w-6 rounded-[2px] ${SWATCH[severity]}`}
                aria-hidden="true"
              />
              <span className="text-meta text-fg">{SEVERITY_LABELS[severity]}</span>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span
              className="h-3.5 w-6 rounded-[2px] border border-hairline"
              aria-hidden="true"
            />
            <span className="text-meta text-muted">No assessment</span>
          </li>
        </ul>
      </div>

      <div>
        <p className="text-meta text-muted">Confidence</p>
        <ul className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
          <li className="flex items-center gap-2">
            <span
              className="h-3.5 w-6 rounded-[2px] border border-solid border-muted"
              aria-hidden="true"
            />
            <span className="text-meta text-fg">{CONFIDENCE_LABELS.reported}</span>
          </li>
          <li className="flex items-center gap-2">
            <span
              className="h-3.5 w-6 rounded-[2px] border border-dashed border-muted"
              aria-hidden="true"
            />
            <span className="text-meta text-fg">Inferred or estimated</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
