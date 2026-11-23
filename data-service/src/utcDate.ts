export function parseUtcDate(value: string): Date {
  const parts = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/.exec(value);
  if (!parts) {
    throw new RangeError("Use horários ISO 8601 em UTC, por exemplo 2026-11-17T12:00:00Z.");
  }

  const canonical = `${parts[1]}.${(parts[2] ?? "").padEnd(3, "0")}Z`;
  const date = new Date(canonical);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== canonical) {
    throw new RangeError("Informe datas válidas.");
  }
  return date;
}
