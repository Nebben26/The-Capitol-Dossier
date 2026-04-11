import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;

export const stripe =
  stripeKey && !stripeKey.includes("PLACEHOLDER")
    ? new Stripe(stripeKey, {
        apiVersion: "2026-03-25.dahlia",
        typescript: true,
      })
    : null;

export const isStripeConfigured = () => !!stripe;

export const STRIPE_PRICE_IDS: Record<
  | "pro_monthly" | "pro_annual"
  | "trader_monthly" | "trader_annual"
  | "signal_desk_monthly" | "signal_desk_annual"
  | "quant_monthly" | "quant_annual",
  string
> = {
  pro_monthly:          process.env.STRIPE_PRICE_PRO_MONTHLY          || "",
  pro_annual:           process.env.STRIPE_PRICE_PRO_ANNUAL           || "",
  trader_monthly:       process.env.STRIPE_PRICE_TRADER_MONTHLY       || "",
  trader_annual:        process.env.STRIPE_PRICE_TRADER_ANNUAL        || "",
  signal_desk_monthly:  process.env.STRIPE_PRICE_SIGNAL_DESK_MONTHLY  || "",
  signal_desk_annual:   process.env.STRIPE_PRICE_SIGNAL_DESK_ANNUAL   || "",
  quant_monthly:        process.env.STRIPE_PRICE_QUANT_MONTHLY        || "",
  quant_annual:         process.env.STRIPE_PRICE_QUANT_ANNUAL         || "",
};
