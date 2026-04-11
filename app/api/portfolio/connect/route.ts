import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWalletExists } from "@/lib/polymarket-data";
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

    const { walletAddress } = await req.json();

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      return NextResponse.json(
        { error: "Invalid wallet address format — must be a 42-character hex string starting with 0x" },
        { status: 400 }
      );
    }

    // Verify the wallet has activity on Polymarket (returns success even for empty wallets)
    const exists = await verifyWalletExists(walletAddress);
    if (!exists) {
      return NextResponse.json(
        {
          error:
            "Could not reach Polymarket to verify this wallet. Check the address and try again.",
        },
        { status: 400 }
      );
    }

    // Upsert the portfolio row (one per user, enforced by UNIQUE on user_id)
    const { error: upsertError } = await supabase
      .from("user_portfolios")
      .upsert(
        {
          user_id: user.id,
          polymarket_address: walletAddress.toLowerCase(),
          connected_at: new Date().toISOString(),
          sync_status: "idle",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) throw upsertError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    Sentry.captureException(err, { tags: { route: "portfolio/connect" } });
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
