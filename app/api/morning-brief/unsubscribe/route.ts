import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/morning-brief?unsubscribed=invalid", req.url));
  }

  try {
    const { data, error } = await supabase
      .from("morning_brief_subscribers")
      .update({ active: false, unsubscribed_at: new Date().toISOString() })
      .eq("unsubscribe_token", token)
      .select("email")
      .single();

    if (error || !data) {
      return NextResponse.redirect(new URL("/morning-brief?unsubscribed=invalid", req.url));
    }

    return NextResponse.redirect(new URL("/morning-brief?unsubscribed=true", req.url));
  } catch {
    return NextResponse.redirect(new URL("/morning-brief?unsubscribed=error", req.url));
  }
}
