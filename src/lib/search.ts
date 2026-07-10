// Lightweight client-side search used by the admin list views.
// The backend has no search endpoint yet, so we match a query against every
// primitive value of the given source object(s) — i.e. "search on any basis".

function collectStrings(value: unknown, depth: number, out: string[]): void {
  if (value == null) return;
  if (typeof value === "object") {
    if (depth > 3) return; // guard against deeply nested payloads
    for (const v of Object.values(value as Record<string, unknown>)) {
      collectStrings(v, depth + 1, out);
    }
  } else {
    out.push(String(value));
  }
}

/**
 * Returns true when every whitespace-separated term in `query` is found
 * somewhere in the flattened primitive values of `sources`. Case-insensitive.
 * An empty query always matches.
 */
export function matchesSearch(query: string, ...sources: unknown[]): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const collected: string[] = [];
  for (const s of sources) collectStrings(s, 0, collected);
  const haystack = collected.join(" ").toLowerCase();

  return needle
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}
