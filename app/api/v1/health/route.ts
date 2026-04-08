import { createClient } from "@supabase/supabase-js";
import { CORS_HEADERS } from "@/lib/api-auth";

const startTime = Date.now();

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  let dbStatus = "connected";
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.from("markets").select("id").limit(1);
    if (error) dbStatus = "degraded";
  } catch {
    dbStatus = "error";
  }

  const degraded = dbStatus === "degraded" || dbStatus === "error";
  return Response.json(
    {
      status: degraded ? "degraded" : "ok",
      version: "v1",
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
      database: dbStatus,
      timestamp: new Date().toISOString(),
    },
    { status: degraded ? 503 : 200, headers: CORS_HEADERS }
  );
}
