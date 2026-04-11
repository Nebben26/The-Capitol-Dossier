/**
 * Netlify Scheduled Function — fires daily at 7am ET (11:00 UTC)
 *
 * Install once: npm install --save-dev @netlify/functions
 * Then redeploy. The cron schedule is picked up automatically by Netlify.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (_event: any) => {
  const siteUrl =
    process.env.URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://amazing-kitsune-139d51.netlify.app";
  const secret = process.env.MORNING_BRIEF_CRON_SECRET;

  if (!secret || secret.includes("PLACEHOLDER")) {
    console.warn("MORNING_BRIEF_CRON_SECRET not set — aborting cron");
    return { statusCode: 200, body: "no-op: secret not configured" };
  }

  try {
    const resp = await fetch(`${siteUrl}/api/morning-brief/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
    });

    const result = await resp.json();
    console.log("Morning brief cron result:", JSON.stringify(result));

    return {
      statusCode: resp.ok ? 200 : 500,
      body: JSON.stringify(result),
    };
  } catch (err: any) {
    console.error("Morning brief cron error:", err.message);
    return { statusCode: 500, body: err.message };
  }
};

// Netlify scheduled function — runs at 11:00 UTC (7am ET) daily
export const config = {
  schedule: "0 11 * * *",
};
