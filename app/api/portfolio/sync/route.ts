import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchUserPositions, computePortfolioSummary } from "@/lib/polymarket-data";
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

    // Get the user's portfolio row
    const { data: portfolio } = await supabase
      .from("user_portfolios")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!portfolio || !portfolio.polymarket_address) {
      return NextResponse.json({ error: "No wallet connected" }, { status: 400 });
    }

    // Mark as syncing
    await supabase
      .from("user_portfolios")
      .update({ sync_status: "syncing", sync_error: null })
      .eq("id", portfolio.id);

    // Fetch positions from Polymarket public data API
    const result = await fetchUserPositions(portfolio.polymarket_address);

    if (!result.success || !result.positions) {
      await supabase
        .from("user_portfolios")
        .update({
          sync_status: "error",
          sync_error: result.error || "Unknown error fetching from Polymarket",
        })
        .eq("id", portfolio.id);

      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const positions = result.positions;
    const summary = computePortfolioSummary(positions);

    // Replace positions wholesale — delete existing, insert fresh
    await supabase.from("user_positions").delete().eq("portfolio_id", portfolio.id);

    if (positions.length > 0) {
      const positionRows = positions.map((p) => ({
        portfolio_id: portfolio.id,
        user_id: user.id,
        market_id: p.conditionId,
        market_question: p.title || "Unknown Market",
        market_slug: p.slug || null,
        outcome: p.outcome || "",
        side: p.outcomeIndex === 0 ? "yes" : "no",
        size: p.size || 0,
        avg_entry_price: p.avgPrice || 0,
        current_price: p.curPrice || 0,
        cost_basis_usd: p.initialValue || 0,
        current_value_usd: p.currentValue || 0,
        realized_pnl_usd: p.realizedPnl || 0,
        unrealized_pnl_usd: p.cashPnl || 0,
        status: (p.size || 0) > 0 ? "open" : "closed",
        resolves_at: p.endDate ? new Date(p.endDate).toISOString() : null,
        raw_data: p as unknown as Record<string, unknown>,
        last_synced_at: new Date().toISOString(),
      }));

      // Insert in batches of 100 to stay under Supabase payload limits
      for (let i = 0; i < positionRows.length; i += 100) {
        const batch = positionRows.slice(i, i + 100);
        const { error: insertError } = await supabase.from("user_positions").insert(batch);
        if (insertError) {
          console.error("[portfolio/sync] insert batch error:", insertError);
        }
      }
    }

    // Update portfolio summary stats
    await supabase
      .from("user_portfolios")
      .update({
        total_value_usd: summary.totalValueUsd,
        total_pnl_usd: summary.totalPnlUsd,
        total_pnl_pct: summary.totalPnlPct,
        position_count: summary.positionCount,
        sync_status: "idle",
        sync_error: null,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", portfolio.id);

    // Write a portfolio value snapshot for the sparkline
    await supabase.from("portfolio_snapshots").insert({
      portfolio_id: portfolio.id,
      user_id: user.id,
      total_value_usd: summary.totalValueUsd,
      total_pnl_usd: summary.totalPnlUsd,
      position_count: summary.positionCount,
    });

    return NextResponse.json({
      success: true,
      summary,
      positionCount: positions.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    Sentry.captureException(err, { tags: { route: "portfolio/sync" } });
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
