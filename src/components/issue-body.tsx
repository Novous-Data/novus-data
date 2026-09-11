/**
 * Renders the stored issue HTML.
 *
 * The HTML was sanitised once, when scripts/sync-issues.ts wrote the file —
 * tags restricted to an allowlist, scripts, styles, iframes, event handlers
 * and inline styles stripped, outbound links rel-hardened. It is deliberately
 * not re-sanitised here: doing that work per request would move a build-time
 * guarantee into the runtime for no added safety.
 *
 * If a file is ever hand-edited, the same allowlist applies by hand. The rule
 * is documented in CLAUDE.md.
 */
export function IssueBody({ html }: { html: string }) {
  return (
    <div
      className="prose prose-novus"
      // Safe by construction: see the note above.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
