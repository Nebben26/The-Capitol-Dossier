"use client";
import { loadStripe, type Stripe as StripeClient } from "@stripe/stripe-js";

let stripePromise: Promise<StripeClient | null> | null = null;

export function getStripe(): Promise<StripeClient | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key || key.includes("PLACEHOLDER")) {
      console.warn("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not configured");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
