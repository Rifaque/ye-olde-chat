import { renderOgImage, ogSize } from "@/lib/og-image";
import { getPhrase, phrases } from "@/lib/phrases";
import { siteName } from "@/lib/site";

export const alt = `A phrase from ${siteName}`;
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return phrases.map(({ id }) => ({ id }));
}

export default async function PhraseOpengraphImage({ params }: { params: Promise<{ id: string }> }) {
  const phrase = getPhrase((await params).id) ?? { slang: siteName, translation: "Modern nonsense, most eloquently spoken." };
  return renderOgImage(phrase);
}
