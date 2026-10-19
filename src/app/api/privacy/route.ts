import { apiJson, isRecord, readJsonBody } from "@/lib/api";
import { getSupabaseAdmin, isUuid } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sessionCookie(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const entry = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("sc_session="));
  return entry ? decodeURIComponent(entry.slice("sc_session=".length)) : null;
}

export async function DELETE(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).origin !== new URL(request.url).origin) {
    return apiJson({ error: "The deletion request origin could not be verified." }, 403);
  }
  const parsed = await readJsonBody(request, 1000);
  if (!parsed.ok) return apiJson({ error: parsed.message }, parsed.status);
  if (!isRecord(parsed.value) || !isUuid(parsed.value.sessionId) || sessionCookie(request) !== parsed.value.sessionId) {
    return apiJson({ error: "This browser session could not be verified for deletion." }, 403);
  }

  try {
    const database = getSupabaseAdmin();
    const id = parsed.value.sessionId;
    const { error: senderError } = await database.from("sc_challenges").delete().eq("sender_session_id", id);
    if (senderError) throw senderError;
    const { error: joinedError } = await database.from("sc_challenges").delete().eq("joined_session_id", id);
    if (joinedError) throw joinedError;
    const { error } = await database.from("sc_sessions").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ deleted: true }, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Set-Cookie": "sc_session=; Max-Age=0; Path=/; SameSite=Lax",
      },
    });
  } catch {
    return apiJson({ error: "The anonymous server record could not be deleted right now." }, 503);
  }
}