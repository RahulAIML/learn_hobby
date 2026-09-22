/**
 * Render Postgres (and most managed Postgres providers) require SSL for
 * external connections and reset the connection otherwise. Local Docker
 * Postgres (docker-compose.yml) has no SSL configured, so we only require
 * it for non-local hosts — callers don't need to remember to append
 * `?sslmode=require` themselves.
 */
export function resolveSslOption(connectionString: string): 'require' | false {
  const isLocal = /(localhost|127\.0\.0\.1)/i.test(connectionString);
  return isLocal ? false : 'require';
}
