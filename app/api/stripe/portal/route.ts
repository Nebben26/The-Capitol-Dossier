import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json(
      { error: "Stripe not configured. Billing portal is unavailable." },
      { status: 503 }
    );
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { data: userTier } = await supabase
      .from("user_tiers")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (!userTier?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe subscription found for your account." },
        { status: 404 }
      );
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: userTier.stripe_customer_id,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Portal session error:", err);
    return NextResponse.json(
      { error: "Unable to open billing portal. Please try again." },
      { status: 500 }
    );
  }
}
