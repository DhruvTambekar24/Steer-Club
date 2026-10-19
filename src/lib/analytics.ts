import { getSessionId } from "@/lib/game";

const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export type EventName =
  | "hero_view" | "dial_locked" | "mode_selected" | "question_answered"
  | "game_completed" | "wrapped_viewed" | "share_clicked" | "challenge_created"
  | "challenge_joined" | "challenge_completed" | "care_opened" | "doubt_tapped"
  | "lead_started" | "lead_submitted" | "scroll_depth";

export function captureUtm(search = window.location.search): Record<string, string> {
  const captured: Record<string, string> = {};
  try {
    const stored = JSON.parse(window.localStorage.getItem("steerclub:utm") ?? "{}") as unknown;
    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
      for (const key of utmKeys) {
        const value = (stored as Record<string, unknown>)[key];
        if (typeof value === "string" && value.trim()) captured[key] = value.trim().slice(0, 120);
      }
    }
    const params = new URLSearchParams(search);
    for (const key of utmKeys) {
      const value = params.get(key)?.trim();
      if (value) captured[key] = value.slice(0, 120);
    }
    window.localStorage.setItem("steerclub:utm", JSON.stringify(captured));
  } catch { /* attribution is optional when storage is unavailable */ }
  return captured;
}

export function getCapturedUtm(): Record<string, string> {
  return captureUtm("");
}

export function trackEvent(name: EventName, props: Record<string, string | number | boolean> = {}): void {
  try {
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ sessionId: getSessionId(), name, props, utm: getCapturedUtm() }),
    }).catch(() => undefined);
  } catch { /* analytics never blocks the experience */ }
}