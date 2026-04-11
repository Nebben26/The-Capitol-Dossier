import { generateMorningBrief, renderMorningBriefHtml } from "@/lib/morning-brief-generator";

export async function GET() {
  const content = await generateMorningBrief();
  const html = renderMorningBriefHtml(content, "#preview");
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
