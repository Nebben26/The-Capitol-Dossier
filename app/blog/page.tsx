import Link from "next/link";
import type { Metadata } from "next";
import { POSTS } from "@/lib/blog-posts";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — Quiver Markets",
  description: "Insights, case studies, and market analysis from the Quiver Markets team.",
};

export default function BlogIndexPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
        <p className="text-[#8892b0]">Insights and case studies from the Quiver Markets team.</p>
      </div>

      <div className="space-y-4">
        {POSTS.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
            <div className="p-5 rounded-xl bg-[#161b27] shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 border border-[#21262d] hover:border-[#57D7BA]/30 transition-all">
              <div className="text-[10px] text-[#8892b0] font-mono mb-2">
                {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
              <h2 className="text-base font-semibold text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors leading-snug mb-2">
                {post.title}
              </h2>
              <p className="text-sm text-[#8892b0] leading-relaxed mb-3">{post.excerpt}</p>
              <span className="inline-flex items-center gap-1 text-xs text-[#57D7BA] font-medium">
                Read more <ArrowRight className="size-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
