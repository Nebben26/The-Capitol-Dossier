"use client";

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`h-3 rounded bg-[#2f374f] animate-pulse ${className}`} />;
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg bg-[#2f374f] animate-pulse ${className}`} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-3" style={{ animationDelay: `${r * 80}ms` }}>
          {Array.from({ length: cols }, (_, c) => (
            <SkeletonLine key={c} className={c === 0 ? "flex-1 h-4" : "w-16 h-3"} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl bg-[#222638] border border-[#2f374f] p-4 space-y-3 animate-pulse">
      <SkeletonLine className="w-3/4 h-4" />
      <SkeletonLine className="w-1/2 h-3" />
      <SkeletonBlock className="h-16 w-full" />
      <div className="flex gap-2">
        <SkeletonLine className="w-12 h-3" />
        <SkeletonLine className="w-16 h-3" />
        <SkeletonLine className="w-10 h-3" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`${height} w-full rounded-lg bg-[#222638] border border-[#2f374f] animate-pulse flex items-end px-4 pb-4 gap-1`}>
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          className="flex-1 bg-[#2f374f] rounded-t"
          style={{ height: `${20 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  );
}

export function HomepageSkeleton() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      {/* Hero */}
      <div className="rounded-xl bg-[#222638] border border-[#2f374f] p-5 animate-pulse">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <SkeletonBlock className="size-36 rounded-full" />
          <div className="flex-1 space-y-3">
            <SkeletonLine className="w-24 h-4" />
            <SkeletonLine className="w-full h-6 max-w-lg" />
            <SkeletonLine className="w-3/4 h-4 max-w-md" />
          </div>
        </div>
      </div>
      {/* Pills */}
      <div className="flex gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <SkeletonBlock key={i} className="w-20 h-8 rounded-full shrink-0" />
        ))}
      </div>
      {/* 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5">
          <div className="rounded-xl bg-[#222638] border border-[#2f374f] p-4">
            <SkeletonLine className="w-40 h-4 mb-4" />
            <TableSkeleton rows={6} cols={4} />
          </div>
        </div>
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-xl bg-[#222638] border border-[#2f374f] p-4">
            <SkeletonLine className="w-32 h-4 mb-4" />
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex gap-3 mb-3">
                <div className="flex-1 space-y-2">
                  <SkeletonLine className="w-full h-3" />
                  <SkeletonLine className="w-1/2 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-3 space-y-3">
          {Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
      {/* Treemap */}
      <ChartSkeleton height="h-64" />
    </div>
  );
}

export function MarketsBrowseSkeleton() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      <div className="text-center py-4 space-y-3">
        <SkeletonLine className="w-64 h-8 mx-auto" />
        <SkeletonLine className="w-40 h-4 mx-auto" />
        <SkeletonBlock className="h-12 max-w-2xl mx-auto rounded-xl" />
      </div>
      <div className="flex gap-2 justify-center">
        {Array.from({ length: 8 }, (_, i) => <SkeletonBlock key={i} className="w-20 h-8 rounded-full" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      <div className="flex justify-between">
        <div className="space-y-2"><SkeletonLine className="w-48 h-8" /><SkeletonLine className="w-64 h-4" /></div>
        <SkeletonBlock className="w-24 h-8 rounded-full" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => <SkeletonBlock key={i} className="h-20 rounded-xl" />)}
      </div>
      <div className="rounded-xl bg-[#222638] border border-[#2f374f] p-4">
        <TableSkeleton rows={10} cols={8} />
      </div>
    </div>
  );
}
