export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  body: Array<
    | { type: "p"; text: string }
    | { type: "h2"; text: string }
  >;
}

export const POSTS: BlogPost[] = [
  {
    slug: "iran-ceasefire-disagreement",
    title: "Case Study: The $8M Iran Ceasefire Disagreement Nobody Was Watching",
    date: "2026-04-08",
    excerpt:
      "Polymarket priced Iran ceasefire by end of Q2 at 34% while Kalshi sat at 61%. A 27-point spread is a lot of free money for anyone paying attention — but most traders weren't. Here's what happened and why.",
    body: [
      {
        type: "p",
        text: "On April 4, our cross-platform arbitrage scanner flagged a 27-point spread on the Iran ceasefire market. Polymarket had it at 34% YES. Kalshi had it at 61% YES. In theory, a trader could buy YES on Polymarket and sell YES on Kalshi and lock in a near-guaranteed 27-point return regardless of the underlying outcome.",
      },
      {
        type: "h2",
        text: "Why did the spread exist?",
      },
      {
        type: "p",
        text: "Platform fragmentation. Polymarket users are crypto-native and skew libertarian; Kalshi users are CFTC-regulated and skew institutional. The two audiences have different news consumption patterns and react to geopolitical events on different timelines. Polymarket caught a bearish Reuters article 14 hours before Kalshi did.",
      },
      {
        type: "h2",
        text: "What the whales did",
      },
      {
        type: "p",
        text: "Three tracked whale wallets took the arbitrage. Our size spike detector caught one of them placing 19x their average position on YES at Kalshi while simultaneously selling YES on Polymarket via a secondary wallet. The combined exposure was ~$2.3M. Within 48 hours, the spread collapsed to 8 points as news propagated.",
      },
      {
        type: "h2",
        text: "The lesson",
      },
      {
        type: "p",
        text: "Cross-platform spreads are not inefficiencies — they're information latency. The traders who monetize them are watching both platforms simultaneously and acting on the gap before news catches up. That's what Quiver Markets exists to make visible.",
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
