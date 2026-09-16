/**
 * Emits a JSON-LD block. Only ever called with objects built from real data —
 * see src/lib/structured-data.ts, which omits any field it cannot fill.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is escaped below for the one sequence that can
      // break out of a <script> element.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
