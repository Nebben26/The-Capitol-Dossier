import type { WalletLabel } from "./api";

/**
 * Returns the display name for a wallet address.
 * Falls back to truncated hex (0xabcd…1234) if no label is found.
 */
export function formatWallet(
  address: string,
  labels: Record<string, WalletLabel> = {},
): string {
  if (!address) return "Unknown";
  const label = labels[address];
  if (label?.display_name) return label.display_name;
  // Truncated hex fallback
  if (address.length > 12) return `${address.slice(0, 6)}…${address.slice(-4)}`;
  return address;
}

/**
 * Returns true if the wallet has a verified label.
 */
export function isVerifiedWallet(
  address: string,
  labels: Record<string, WalletLabel> = {},
): boolean {
  return labels[address]?.verified === true;
}
