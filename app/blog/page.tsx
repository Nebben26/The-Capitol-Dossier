import Link from "next/link";
import type { Metadata } from "next";
import { POSTS } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Insights, case studies, and market analysis from the Quiver Markets team.",
};

function estimateReadTime(post: (typeof POSTS)[number]): string {
  const words = post.body.reduce((acc, block) => acc + block.text.split(/\s+/).length, 0);
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function deriveCategory(slug: string): string {
  if (/election|vote|poll|president/.test(slug)) return "Elections";
  if (/crypto|bitcoin|btc|eth/.test(slug)) return "Crypto";
  if (/ceasefire|war|iran|geopolit/.test(slug)) return "Geopolitics";
  if (/fed|rate|inflation|econom/.test(slug)) return "Economics";
  if (/tech|ai|agi|spacex/.test(slug)) return "Tech";
  return "Intelligence";
}

export default function BlogIndexPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
        <p className="text-[#8d96a0]">Insights and case studies from the Quiver Markets team.</p>
      </div>

      <div className={POSTS.length === 1 ? "max-w-2xl" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
        {POSTS.map((post) => {
          const category = deriveCategory(post.slug);
          const readTime = estimateReadTime(post);
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-xl bg-[#161b27] border border-[#21262d] shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 overflow-hidden"
            >
              {/* Hero gradient header */}
              <div className="relative h-40 bg-gradient-to-br from-[#57D7BA]/20 via-[#388bfd]/10 to-[#161b27] overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#57D7BA]/15 rounded-full blur-3xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl font-bold text-[#57D7BA]/30 tabular-nums select-none">
                    {category[0].toUpperCase()}
                  </div>
                </div>
                <div className="absolute top-3 left-3 px-2 py-0.5 bg-[#0d1117]/80 backdrop-blur-sm border border-[#21262d] rounded-full">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#57D7BA]">{category}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-[#f0f6fc] leading-tight mb-2 group-hover:text-[#57D7BA] transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-[#8d96a0] leading-relaxed line-clamp-2 mb-4">
                  {post.excerpt}
                </p>
                {/* Meta row */}
                <div className="flex items-center gap-3 text-[11px] text-[#484f58]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#57D7BA] to-[#388bfd] shrink-0" />
                    <span className="font-medium text-[#8d96a0]">Quiver Team</span>
                  </div>
                  <span>·</span>
                  <time>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                  <span>·</span>
                  <span>{readTime}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Morning Brief CTA — shown when there's only one post */}
      {POSTS.length <= 2 && (
        <div className="max-w-2xl mt-4 p-5 rounded-xl bg-[#161b27] border border-[#21262d]">
          <p className="text-sm font-semibold text-[#e2e8f0] mb-1">Get the Morning Brief</p>
          <p className="text-xs text-[#8d96a0] leading-relaxed">
            New posts are rare — get daily market intelligence delivered straight to you instead.
            The Morning Brief runs every morning on the homepage and covers spreads, movers, and whale signals.
          </p>
        </div>
      )}
    </div>
  );
}
