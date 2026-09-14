import { ogSize, renderOgImage } from "@/lib/og-image";
import { categories, getPhrase } from "@/lib/phrases";
import { categoryBySlug, categorySeo } from "@/lib/seo";
import { siteName, tagline } from "@/lib/site";

export const alt = `A phrase category from ${siteName}`;
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return categories.map(({ id }) => ({ category: categorySeo[id].slug }));
}

/** The category's heading over one of its best-known translations. */
export default async function CategoryOpengraphImage({ params }: { params: Promise<{ category: string }> }) {
  const id = categoryBySlug((await params).category);
  const featured = id ? getPhrase(categorySeo[id].featuredPhraseId) : undefined;
  return renderOgImage({
    slang: id ? categorySeo[id].heading : siteName,
    translation: featured?.translation ?? tagline,
  });
}
