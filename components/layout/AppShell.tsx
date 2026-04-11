"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { DataSourceProvider } from "./DataSourceContext";
import { AuthProvider } from "./AuthContext";
import { LoginModal } from "./LoginModal";
import { StickyIntroBanner } from "@/components/ui/sticky-intro-banner";
import { BackToTop } from "@/components/ui/back-to-top";
import { DisclaimerBanner } from "@/components/legal/disclaimer-banner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <DataSourceProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DisclaimerBanner />
            <Header onMenuClick={() => setSidebarOpen(true)} />
            <StickyIntroBanner />
            <main className="flex-1 overflow-y-auto flex flex-col">
              <div className="flex-1">{children}</div>
              <Footer />
            </main>
          </div>
        </div>
        <LoginModal />
        <BackToTop />
      </DataSourceProvider>
    </AuthProvider>
  );
}
