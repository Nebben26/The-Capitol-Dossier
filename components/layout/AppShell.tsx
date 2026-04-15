"use client";

import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { DataSourceProvider } from "./DataSourceContext";
import { AuthProvider } from "./AuthContext";
import { LoginModal } from "./LoginModal";
import { StickyIntroBanner } from "@/components/ui/sticky-intro-banner";
import { BackToTop } from "@/components/ui/back-to-top";
import { DisclaimerBanner } from "@/components/legal/disclaimer-banner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataSourceProvider>
        <div className="flex flex-col min-h-screen">
          <DisclaimerBanner />
          <Header />
          <StickyIntroBanner />
          <main className="flex-1 flex flex-col">
            <div className="flex-1">{children}</div>
            <Footer />
          </main>
        </div>
        <LoginModal />
        <BackToTop />
      </DataSourceProvider>
    </AuthProvider>
  );
}
