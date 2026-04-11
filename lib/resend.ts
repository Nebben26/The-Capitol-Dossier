import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const resend =
  apiKey && !apiKey.includes("PLACEHOLDER")
    ? new Resend(apiKey)
    : null;

export const isResendConfigured = () => !!resend;

export const FROM_EMAIL =
  process.env.MORNING_BRIEF_FROM_EMAIL || "brief@quivermarkets.com";
