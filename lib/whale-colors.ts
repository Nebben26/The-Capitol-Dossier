import type { CSSProperties } from "react";

const WHALE_COLORS: [string, string][] = [
  ["#57D7BA", "#388bfd"], // teal to blue
  ["#f85149", "#d29922"], // red to amber
  ["#3fb950", "#57D7BA"], // green to teal
  ["#388bfd", "#8b5cf6"], // blue to purple
  ["#d29922", "#f85149"], // amber to red
  ["#8b5cf6", "#f85149"], // purple to red
  ["#57D7BA", "#3fb950"], // teal to green
  ["#388bfd", "#57D7BA"], // blue to teal
];

export function getWhaleColors(whaleId: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < whaleId.length; i++) {
    hash = (hash + whaleId.charCodeAt(i)) % WHALE_COLORS.length;
  }
  return WHALE_COLORS[hash];
}

export function getWhaleGradientStyle(whaleId: string): CSSProperties {
  const [from, to] = getWhaleColors(whaleId);
  return { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` };
}
