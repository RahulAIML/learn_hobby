const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Guards id-lookup queries against non-UUID input (e.g. a guessed/garbage id) before it reaches Postgres — the driver otherwise throws a raw "invalid input syntax for type uuid" error instead of a clean not-found result. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
