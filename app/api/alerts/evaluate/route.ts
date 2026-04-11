import { NextRequest, NextResponse } from "next/server";
import { runAlertEvaluator } from "@/lib/run-alert-evaluator";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.ALERT_EVALUATOR_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAlertEvaluator();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Alert evaluator error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET allowed in development for manual testing
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "GET not allowed in production" }, { status: 405 });
  }
  try {
    const result = await runAlertEvaluator();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
