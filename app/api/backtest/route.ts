import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runBacktest } from "@/lib/backtester";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const minSpread = Math.max(0, Math.min(50, Number(searchParams.get("minSpread") ?? 10)));
  const capital = Math.max(10, Math.min(10000, Number(searchParams.get("capital") ?? 100)));
  const maxConcurrent = Math.max(1, Math.min(100, Number(searchParams.get("maxConcurrent") ?? 20)));
  const categoryParam = searchParams.get("category");
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;

  const categories = categoryParam
    ? categoryParam.split(",").map((c) => c.trim()).filter(Boolean)
    : undefined;

  // Fetch signal history (limit 5000)
  const { data: rawSignals, error } = await supabaseAdmin
    .from("signal_history")
    .select(
      "id, disagreement_id, question, category, detected_at, spread, poly_price, kalshi_price, " +
      "resolved, resolved_at, resolution_outcome, poly_final_price, kalshi_final_price, " +
      "arb_profit_pct, would_have_profited"
    )
    .order("detected_at", { ascending: true })
    .limit(5000);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch signal history." }, { status: 500 });
  }

  const result = await runBacktest(
    { minSpread, capitalPerTrade: capital, maxConcurrentTrades: maxConcurrent, startDate, endDate, categories },
    rawSignals ?? []
  );

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
