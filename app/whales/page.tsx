import WhalesClient from "./whales-client";
import { ExternalLink } from "lucide-react";

export const revalidate = 60;

export default function WhalesPage() {
  return (
    <>
      <WhalesClient />
      <div className="max-w-5xl mx-auto px-4 pb-8">
        <p className="text-xs text-[#8d96a0]">
          These signals also power{" "}
          <a
            href="https://thecapitoldossier.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-[#f0f6fc] transition-colors"
          >
            The Capitol Dossier <ExternalLink className="size-3" />
          </a>{" "}
          — exact options setups delivered to Telegram.
        </p>
      </div>
    </>
  );
}
