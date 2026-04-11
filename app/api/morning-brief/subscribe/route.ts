import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("morning_brief_subscribers")
      .select("id, active")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      if (existing.active) {
        return NextResponse.json({ message: "Already subscribed" });
      }
      await supabase
        .from("morning_brief_subscribers")
        .update({ active: true, unsubscribed_at: null })
        .eq("id", existing.id);
      return NextResponse.json({ message: "Welcome back — you're resubscribed" });
    }

    const { error } = await supabase.from("morning_brief_subscribers").insert({
      email: email.toLowerCase().trim(),
      source: source || "unknown",
      active: true,
    });

    if (error) throw error;

    return NextResponse.json({ message: "Subscribed! You'll get the next Morning Brief at 7am ET." });
  } catch (err: any) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: err.message || "Failed to subscribe" }, { status: 500 });
  }
}
