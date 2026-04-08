"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 py-4 border-t border-[#2f374f] text-[10px] text-[#8892b0]">
      <span>
        © 2026 Quiver Markets. Not financial advice. Data from{" "}
        <a
          href="https://polymarket.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#57D7BA] transition-colors"
        >
          Polymarket
        </a>{" "}
        &amp;{" "}
        <a
          href="https://kalshi.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#57D7BA] transition-colors"
        >
          Kalshi
        </a>
        .
      </span>
      <div className="flex items-center gap-3">
        <Link href="/status" className="hover:text-[#57D7BA] transition-colors">
          Status
        </Link>
        <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">
          Privacy
        </Link>
        <a
          href="mailto:hello@quivermarkets.com"
          className="hover:text-[#57D7BA] transition-colors"
        >
          Contact
        </a>
      </div>
    </footer>
  );
}
