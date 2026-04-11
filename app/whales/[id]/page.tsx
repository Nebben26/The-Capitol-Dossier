import type { Metadata } from "next";
import WhaleProfilePage from "./whale-profile-client";

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Whale Profile",
    description: "Prediction market whale trader profile and analytics.",
    openGraph: { title: "Whale Profile · Quiver Markets", type: "profile", images: [{ url: "/og-image.svg", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: "Whale Profile · Quiver Markets", images: ["/og-image.svg"] },
  };
}

export default function Page() {
  return <WhaleProfilePage />;
}
