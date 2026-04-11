import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import type Stripe from "stripe";

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

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Internal webhook error" }, { status: 500 });
  }
}
