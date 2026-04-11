"use client";

import { useState } from "react";
import { trackEvent, identifyUser, AnalyticsEvents } from "@/lib/analytics";
import * as Sentry from "@sentry/nextjs";
import { AlertCircle, CheckCircle, Send, Bug } from "lucide-react";

export default function AnalyticsDebugPage() {
  const [log, setLog] = useState<string[]>([]);

  const add = (line: string) =>
    setLog((prev) =>
      [`${new Date().toLocaleTimeString()} — ${line}`, ...prev].slice(0, 20)
    );

  const testPageView = () => {
    trackEvent("$pageview");
    add("Fired: $pageview");
  };

  const testCustomEvent = () => {
    trackEvent(AnalyticsEvents.VIEW_DISAGREEMENT, { id: "test_123", spread: 25 });
    add("Fired: viewed_disagreement");
  };

  const testIdentify = () => {
    identifyUser("debug_user_" + Date.now(), { email: "debug@example.com" });
    add("Identified: debug_user");
  };

  const testSentryError = () => {
    try {
      throw new Error("Test error from debug page — ignore");
    } catch (err) {
      Sentry.captureException(err);
      add("Sent to Sentry: Test error");
    }
  };

  const testSentryMessage = () => {
    Sentry.captureMessage("Test message from debug page", "info");
    add("Sent to Sentry: Test message");
  };

  const posthogConfigured =
    !!process.env.NEXT_PUBLIC_POSTHOG_KEY &&
    !process.env.NEXT_PUBLIC_POSTHOG_KEY.includes("PLACEHOLDER");
  const sentryConfigured =
    !!process.env.NEXT_PUBLIC_SENTRY_DSN &&
    !process.env.NEXT_PUBLIC_SENTRY_DSN.includes("PLACEHOLDER");

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">
          Analytics Debug
        </h1>
        <p className="text-sm text-[#8d96a0] mt-1">
          Internal testing tool for PostHog and Sentry wiring.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div
          className={`rounded-xl p-4 border ${
            posthogConfigured
              ? "bg-[#3fb950]/10 border-[#3fb950]/30"
              : "bg-[#f85149]/10 border-[#f85149]/30"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {posthogConfigured ? (
              <CheckCircle className="w-4 h-4 text-[#3fb950]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#f85149]" />
            )}
            <div
              className="text-sm font-semibold"
              style={{ color: posthogConfigured ? "#3fb950" : "#f85149" }}
            >
              PostHog
            </div>
          </div>
          <div className="text-[11px] text-[#8d96a0]">
            {posthogConfigured
              ? "Configured and firing"
              : "Not configured — set NEXT_PUBLIC_POSTHOG_KEY"}
          </div>
        </div>
        <div
          className={`rounded-xl p-4 border ${
            sentryConfigured
              ? "bg-[#3fb950]/10 border-[#3fb950]/30"
              : "bg-[#f85149]/10 border-[#f85149]/30"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {sentryConfigured ? (
              <CheckCircle className="w-4 h-4 text-[#3fb950]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#f85149]" />
            )}
            <div
              className="text-sm font-semibold"
              style={{ color: sentryConfigured ? "#3fb950" : "#f85149" }}
            >
              Sentry
            </div>
          </div>
          <div className="text-[11px] text-[#8d96a0]">
            {sentryConfigured
              ? "Configured and reporting"
              : "Not configured — set NEXT_PUBLIC_SENTRY_DSN"}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-3">
        <div className="text-xs font-bold uppercase tracking-widest text-[#8d96a0]">
          PostHog Tests
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={testPageView}
            className="flex items-center gap-1.5 bg-[#0d1117] border border-[#21262d] text-[#f0f6fc] hover:border-[#57D7BA]/40 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
          >
            <Send className="w-3 h-3" /> Fire Page View
          </button>
          <button
            onClick={testCustomEvent}
            className="flex items-center gap-1.5 bg-[#0d1117] border border-[#21262d] text-[#f0f6fc] hover:border-[#57D7BA]/40 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
          >
            <Send className="w-3 h-3" /> Fire Custom Event
          </button>
          <button
            onClick={testIdentify}
            className="flex items-center gap-1.5 bg-[#0d1117] border border-[#21262d] text-[#f0f6fc] hover:border-[#57D7BA]/40 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
          >
            <Send className="w-3 h-3" /> Identify User
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-3">
        <div className="text-xs font-bold uppercase tracking-widest text-[#8d96a0]">
          Sentry Tests
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={testSentryError}
            className="flex items-center gap-1.5 bg-[#0d1117] border border-[#21262d] text-[#f0f6fc] hover:border-[#f85149]/40 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
          >
            <Bug className="w-3 h-3" /> Capture Error
          </button>
          <button
            onClick={testSentryMessage}
            className="flex items-center gap-1.5 bg-[#0d1117] border border-[#21262d] text-[#f0f6fc] hover:border-[#f85149]/40 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
          >
            <Send className="w-3 h-3" /> Send Message
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-[#0d1117] border border-[#21262d] p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-[#8d96a0] mb-2">
          Event Log
        </div>
        {log.length === 0 ? (
          <div className="text-xs text-[#484f58]">
            No events fired yet. Click buttons above.
          </div>
        ) : (
          <div className="space-y-1 font-mono text-[11px]">
            {log.map((line, i) => (
              <div key={i} className="text-[#8d96a0]">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-[11px] text-[#484f58]">
        Visit your PostHog dashboard at https://us.posthog.com and Sentry
        dashboard at https://sentry.io to verify events are arriving.
      </div>
    </div>
  );
}
