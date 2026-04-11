"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWatchlist } from "@/hooks/usePersistence";
import { useAuth } from "@/components/layout/AuthContext";

export function WatchlistButton({
  type,
  itemId,
  name,
}: {
  type: "market" | "whale";
  itemId: string;
  name: string;
}) {
  const { isWatched, toggleWatch } = useWatchlist();
  const { user, setShowLogin } = useAuth();
  const watched = isWatched(itemId);

  const handleClick = () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    toggleWatch(type, itemId, name);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={`gap-1.5 ${
        watched
          ? "border-[#f59e0b]/30 text-[#f59e0b] bg-[#f59e0b]/5 hover:bg-[#f59e0b]/10"
          : "border-[#21262d] text-[#8892b0] hover:text-[#f59e0b] hover:border-[#f59e0b]/30"
      }`}
    >
      <Star className={`size-3.5 ${watched ? "fill-[#f59e0b]" : ""}`} />
      {watched ? "Watching" : "Watch"}
    </Button>
  );
}
