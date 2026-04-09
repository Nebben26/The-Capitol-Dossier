// Embed layout: overrides the AppShell so embed pages have no nav/sidebar/header
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1119]">
      {children}
    </div>
  );
}
