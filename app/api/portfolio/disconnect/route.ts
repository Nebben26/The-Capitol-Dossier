import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete portfolio — cascades to user_positions and portfolio_snapshots
    await supabase.from("user_portfolios").delete().eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    Sentry.captureException(err, { tags: { route: "portfolio/disconnect" } });
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
