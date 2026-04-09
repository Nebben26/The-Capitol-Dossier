import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  validateApiKey,
  CORS_HEADERS,
  errorResponse,
} from "@/lib/api-auth";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** GET /api/v1/webhooks — list webhooks registered for this API key */
export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth.ok) return errorResponse(auth.status, auth.error);

  const { key } = auth;

  if (key.tier !== "premium") {
    return errorResponse(403, "Webhooks require an Enterprise (Premium) API key.");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("webhooks")
    .select("id, url, event_type, active, created_at, last_triggered_at")
    .eq("api_key_id", key.id)
    .order("created_at", { ascending: false });

  if (error) return errorResponse(500, "Database error");

  return Response.json({ data: data ?? [] }, { headers: CORS_HEADERS });
}

/** POST /api/v1/webhooks — register a new webhook */
export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (!auth.ok) return errorResponse(auth.status, auth.error);

  const { key } = auth;

  if (key.tier !== "premium") {
    return errorResponse(403, "Webhooks require an Enterprise (Premium) API key.");
  }

  let body: { url?: string; event_type?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, "Invalid JSON body");
  }

  const { url, event_type } = body;

  if (!url || typeof url !== "string" || !url.startsWith("https://")) {
    return errorResponse(400, "url must be a valid https:// URL");
  }

  const VALID_EVENT_TYPES = ["signal.created", "disagreement.updated", "whale.spike"];
  if (!event_type || !VALID_EVENT_TYPES.includes(event_type)) {
    return errorResponse(400, `event_type must be one of: ${VALID_EVENT_TYPES.join(", ")}`);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("webhooks")
    .insert({ api_key_id: key.id, url, event_type })
    .select("id, url, event_type, active, created_at")
    .single();

  if (error) return errorResponse(500, "Database error");

  return Response.json({ data }, { status: 201, headers: CORS_HEADERS });
}
