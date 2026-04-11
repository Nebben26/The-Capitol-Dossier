import { NextRequest, NextResponse } from "next/server";
import { resend, isResendConfigured, FROM_EMAIL } from "@/lib/resend";
import { supabase } from "@/lib/supabase";
import { generateMorningBrief, renderMorningBriefHtml } from "@/lib/morning-brief-generator";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.MORNING_BRIEF_CRON_SECRET;

  if (expectedSecret && !expectedSecret.includes("PLACEHOLDER") && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isResendConfigured() || !resend) {
    return NextResponse.json({ error: "Resend not configured — set RESEND_API_KEY" }, { status: 503 });
  }

  try {
    const content = await generateMorningBrief();

    const { data: subscribers, error: subsError } = await supabase
      .from("morning_brief_subscribers")
      .select("id, email, unsubscribe_token, send_count")
      .eq("active", true);

    if (subsError) throw subsError;

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: "No active subscribers", sent: 0 });
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://amazing-kitsune-139d51.netlify.app";

    const subject =
      content.topDisagreements.length > 0
        ? `Quiver Brief — Top arb: ${content.topDisagreements[0].spread.toFixed(1)}pt spread today`
        : `Quiver Morning Brief — ${content.date}`;

    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ email: string; error: string }> = [];

    // Send in batches of 10 to respect Resend rate limits
    for (let i = 0; i < subscribers.length; i += 10) {
      const batch = subscribers.slice(i, i + 10);
      await Promise.all(
        batch.map(async (sub) => {
          try {
            const unsubscribeUrl = `${siteUrl}/api/morning-brief/unsubscribe?token=${sub.unsubscribe_token}`;
            const html = renderMorningBriefHtml(content, unsubscribeUrl);

            await resend!.emails.send({
              from: FROM_EMAIL,
              to: sub.email,
              subject,
              html,
            });

            successCount++;

            await supabase
              .from("morning_brief_subscribers")
              .update({
                last_sent_at: new Date().toISOString(),
                send_count: (sub.send_count || 0) + 1,
              })
              .eq("id", sub.id);
          } catch (err: any) {
            failureCount++;
            errors.push({ email: sub.email, error: err.message || "Send failed" });
          }
        })
      );

      // Small pause between batches to avoid burst rate limits
      if (i + 10 < subscribers.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    await supabase.from("morning_brief_sends").insert({
      subscriber_count: subscribers.length,
      success_count: successCount,
      failure_count: failureCount,
      subject,
      errors: errors.length > 0 ? errors : null,
    });

    return NextResponse.json({
      message: "Morning brief sent",
      total: subscribers.length,
      success: successCount,
      failed: failureCount,
    });
  } catch (err: any) {
    console.error("Morning brief send error:", err);
    Sentry.captureException(err, { tags: { route: "morning-brief/send" } });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Dev-only: GET returns rendered HTML preview without sending
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "POST only in production" }, { status: 405 });
  }
  const content = await generateMorningBrief();
  const html = renderMorningBriefHtml(content, "#preview-unsubscribe");
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
