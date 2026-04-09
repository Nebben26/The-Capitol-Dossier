import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPost, POSTS } from "@/lib/blog-posts";
import { ChevronLeft } from "lucide-react";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getPost(params.slug);
  if (!post) return {};
  return {
    title: `${post.title} — Quiver Markets`,
    description: post.excerpt,
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    publisher: {
      "@type": "Organization",
      name: "Quiver Markets",
      url: "https://amazing-kitsune-139d51.netlify.app",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* Back link */}
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-[#8892b0] hover:text-[#57D7BA] transition-colors">
          <ChevronLeft className="size-4" /> Back to blog
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <div className="text-[10px] text-[#8892b0] font-mono">
            {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">{post.title}</h1>
          <p className="text-[#8892b0] leading-relaxed">{post.excerpt}</p>
        </div>

        <hr className="border-[#2f374f]" />

        {/* Body */}
        <div className="space-y-5">
          {post.body.map((block, i) => {
            if (block.type === "h2") {
              return (
                <h2 key={i} className="text-lg font-bold text-[#e2e8f0] mt-6">
                  {block.text}
                </h2>
              );
            }
            return (
              <p key={i} className="text-[#8892b0] leading-relaxed">
                {block.text}
              </p>
            );
          })}
        </div>

        <hr className="border-[#2f374f]" />

        {/* Footer */}
        <div className="text-sm text-[#8892b0]">
          <Link href="/disagrees" className="text-[#57D7BA] hover:underline">
            See live cross-platform disagreements →
          </Link>
        </div>
      </div>
    </>
  );
}
