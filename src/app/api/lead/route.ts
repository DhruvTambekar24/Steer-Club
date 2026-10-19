import { randomUUID } from "node:crypto";
import { apiJson, isDoubtId, isRecord, readJsonBody, stringMap } from "@/lib/api";
import type { Json } from "@/lib/database.types";
import { getSupabaseAdmin, isUuid } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const consentText = "I agree that Steer may use my name and mobile number to contact me about this request. My game note and selected language may be shared with the care team. I can ask for deletion through the privacy page.";
const topics = new Set(["food", "movement", "sleep", "body"]);
const times = new Set(["morning", "afternoon", "evening", "no-preference"]);

function cleanLeadNote(value: unknown, utmSource: string | null): Record<string, Json> {
  const note = isRecord(value) ? value : {};
  const score = Number.isInteger(note.score) && Number(note.score) >= 0 && Number(note.score) <= 7 ? Number(note.score) : null;
  const total = note.total === 5 || note.total === 7 ? Number(note.total) : null;
  const weakestTopic = typeof note.weakestTopic === "string" && topics.has(note.weakestTopic) ? note.weakestTopic : null;
  const selectedDoubt = isDoubtId(note.selectedDoubt) ? note.selectedDoubt : null;
  const rawDoubts = Array.isArray(note.doubts) ? note.doubts.filter(isDoubtId).slice(0, 5) : [];
  const streak = Number.isInteger(note.streak) ? Math.max(0, Math.min(3650, Number(note.streak))) : 0;
  return {
    score,
    total,
    weakestTopic,
    selectedDoubt,
    doubts: [...new Set(rawDoubts)],
    streak,
    utmSource,
  };
}

export async function POST(request: Request): Promise<Response> {
  const parsed = await readJsonBody(request, 10000);
  if (!parsed.ok) return apiJson({ error: parsed.message }, parsed.status);
  if (!isRecord(parsed.value)) return apiJson({ error: "The contact request is incomplete." }, 400);
  const body = parsed.value;
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  if (!isUuid(body.sessionId) || !isUuid(body.submissionId) || firstName.length < 1 || firstName.length > 60 || /[\u0000-\u001f]/.test(firstName)) {
    return apiJson({ error: "Check the name and try again." }, 400);
  }
  if (typeof body.mobile !== "string" || !/^\+91[0-9]{10}$/.test(body.mobile)) {
    return apiJson({ error: "Enter a valid 10-digit Indian mobile number." }, 400);
  }
  if (typeof body.preferredTime !== "string" || !times.has(body.preferredTime) || (body.language !== "en" && body.language !== "hinglish")) {
    return apiJson({ error: "Choose a contact time and language preference." }, 400);
  }
  if (body.consent !== true) return apiJson({ error: "Consent is needed before the care team can contact you." }, 400);

  const utm = stringMap(body.utm);
  const note = cleanLeadNote(body.note, utm.utm_source ?? null);
  const consentedAt = new Date().toISOString();
  const leadId = randomUUID();
  try {
    const database = getSupabaseAdmin();
    const { error: sessionError } = await database.from("sc_sessions").upsert({
      id: body.sessionId,
      utm: utm as Json,
      updated_at: consentedAt,
    }, { onConflict: "id" });
    if (sessionError) throw sessionError;
    const { error } = await database.from("sc_leads").insert({
      id: leadId,
      submission_id: body.submissionId,
      session_id: body.sessionId,
      first_name: firstName,
      mobile: body.mobile,
      preferred_time: body.preferredTime,
      language: body.language,
      note,
      consent_text: consentText,
      consented_at: consentedAt,
      utm_source: utm.utm_source ?? null,
    });
    if (error) throw error;

    let forwarded = false;
    const webhookUrl = process.env.LEAD_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const target = new URL(webhookUrl);
        if (target.protocol === "https:") {
          const response = await fetch(target, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(5000),
            body: JSON.stringify({ submissionId: body.submissionId, firstName, mobile: body.mobile, preferredTime: body.preferredTime, language: body.language, note, consentText, consentedAt }),
          });
          forwarded = response.ok;
        }
      } catch { /* retain the consented request for an authorized follow-up */ }
      if (forwarded) await database.from("sc_leads").update({ forwarded_at: new Date().toISOString() }).eq("id", leadId);
    }
    return apiJson({ accepted: true, forwarded }, 201);
  } catch {
    return apiJson({ error: "Your request could not be saved right now. Please try again later." }, 503);
  }
}