import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import type Stripe from "stripe";

// Service-role client — bypasses RLS for all webhook writes.
// The anon client silently fails RLS on user_tiers and stripe_events.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret.includes("PLACEHOLDER")) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  // ── Idempotency: skip already-processed events ───────────────────
  try {
    const { data: existing } = await supabase
      .from("stripe_events")
      .select("id, status")
      .eq("id", event.id)
      .maybeSingle();

    if (existing?.status === "processed") {
      console.log(`Stripe event ${event.id} already processed — skipping`);
      return NextResponse.json({ received: true });
    }

    // Log the event (upsert so retries don't fail)
    await supabase.from("stripe_events").upsert(
      { id: event.id, type: event.type, payload: event, status: "received" },
      { onConflict: "id" }
    );
  } catch {
    // stripe_events table may not exist yet — log but continue processing
    console.warn("Could not log to stripe_events (run session15-stripe-events.sql to enable)");
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const tier = session.metadata?.tier;

        if (userId && tier) {
          await supabase.from("user_tiers").upsert(
            {
              user_id: userId,
              tier,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              grant_reason: "stripe_checkout",
              granted_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          const isActive =
            subscription.status === "active" || subscription.status === "trialing";
          const newTier = isActive
            ? (subscription.metadata?.tier || "free")
            : "free";

          // current_period_end is nested in items in newer Stripe API versions
          const periodEnd = (subscription as any).current_period_end ?? null;
          await supabase.from("user_tiers").upsert(
            {
              user_id: userId,
              tier: newTier,
              stripe_subscription_id: subscription.id,
              expires_at: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
            },
            { onConflict: "user_id" }
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          await supabase
            .from("user_tiers")
            .update({ tier: "free", expires_at: new Date().toISOString() })
            .eq("user_id", userId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn("Payment failed for invoice:", invoice.id, "customer:", invoice.customer);
        // TODO: send email notification (Resend / SendGrid)
        break;
      }

      default:
        // Unhandled event type — log and return 200 so Stripe doesn't retry
        break;
    }

    // Mark event processed
    await supabase
      .from("stripe_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("id", event.id)
      .then(() => {}); // fire-and-forget, non-fatal

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    Sentry.captureException(err, { tags: { route: "stripe/webhook", event_type: event.type } });
    // Mark event failed so we can query it later
    await supabase
      .from("stripe_events")
      .update({ status: "failed", error: err.message })
      .eq("id", event.id)
      .then(() => {});
    return NextResponse.json({ error: "Internal webhook error" }, { status: 500 });
  }
}
