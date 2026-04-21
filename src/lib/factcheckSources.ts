/** В БД factchecks.sources — TEXT; в UI нужен массив строк. */
export function normalizeFactcheckSources(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  const s = String(raw).trim();
  if (!s) return [];
  return s
    .split(/[,\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}
