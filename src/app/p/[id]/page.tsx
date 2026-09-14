import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhraseDetail } from "@/components/phrase-detail";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getPhrase, phrases } from "@/lib/phrases";
import { relatedPhrases } from "@/lib/related";
import { siteName } from "@/lib/site";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return phrases.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const phrase = getPhrase((await params).id);
  if (!phrase) return {};
  const title = `“${phrase.slang}” in olde English`;
  return {
    title: `${title} · ${siteName}`,
    description: phrase.translation,
    alternates: { canonical: `/p/${phrase.id}` },
    openGraph: { type: "article", url: `/p/${phrase.id}`, siteName, title, description: phrase.translation },
    twitter: { card: "summary_large_image", title, description: phrase.translation },
  };
}

export default async function PhrasePage({ params }: Props) {
  const phrase = getPhrase((await params).id);
  if (!phrase) notFound();

  return (
    <>
      <SiteHeader />
      <main className="shell phrase-page">
        <Link className="text-button back-link" href="/">
          <span aria-hidden="true">←</span> All phrases
        </Link>
        <h1 className="sr-only">
          {phrase.slang}, in olde English: {phrase.translation}
        </h1>
        <PhraseDetail phrase={phrase} related={relatedPhrases(phrases, phrase)} />
      </main>
      <SiteFooter />
    </>
  );
}
