export type BodyRead = { ok: true; value: unknown } | { ok: false; status: number; message: string };

export async function readJsonBody(request: Request, maxBytes = 24000): Promise<BodyRead> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { ok: false, status: 415, message: "Send a JSON request." };
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return { ok: false, status: 413, message: "The request is too large." };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, status: 400, message: "The request is not valid JSON." };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function apiJson(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function isDoubtId(value: unknown): value is "safe" | "muscle-loss" | "regain" | "diabetes-only" | "for-me" {
  return value === "safe" || value === "muscle-loss" || value === "regain" || value === "diabetes-only" || value === "for-me";
}

export function stringMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const clean: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const entry = value[key];
    if (typeof entry === "string" && entry.trim()) clean[key] = entry.trim().slice(0, 120);
  }
  return clean;
}

export function isoDate(value: unknown): string | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return null;
}

export function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function addUtcDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function utcWeekStart(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}
