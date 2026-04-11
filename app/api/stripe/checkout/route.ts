import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json(
      { error: "Stripe not configured. Add STRIPE_SECRET_KEY to your environment variables." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { tier, cycle, userId, userEmail } = body as {
      tier: "pro" | "trader" | "signal_desk";
      cycle: "monthly" | "annual";
      userId: string;
      userEmail: string;
    };

    if (!tier || !cycle || !userId || !userEmail) {
      return NextResponse.json({ error: "Missing required fields: tier, cycle, userId, userEmail" }, { status: 400 });
    }

    const priceKey = `${tier}_${cycle}` as keyof typeof STRIPE_PRICE_IDS;
    const priceId = STRIPE_PRICE_IDS[priceKey];

    if (!priceId) {
      return NextResponse.json(
        { error: `Price not configured for ${tier} ${cycle}. Add STRIPE_PRICE_${priceKey.toUpperCase()} to environment.` },
        { status: 400 }
      );
    }

    // Check if customer already exists in user_tiers
    let customerId: string | undefined;
    const { data: existingTier } = await supabase
      .from("user_tiers")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingTier?.stripe_customer_id) {
      customerId = existingTier.stripe_customer_id;
    }

    // Create Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { user_id: userId },
      });
      customerId = customer.id;
    }

    // Build checkout session
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { user_id: userId, tier, cycle },
      },
      metadata: { user_id: userId, tier, cycle },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    Sentry.captureException(err, { tags: { route: "stripe/checkout" } });
    return NextResponse.json(
      { error: "Unable to start checkout. Please try again or contact support." },
      { status: 500 }
    );
  }
}
