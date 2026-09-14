import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhraseDetail } from "@/components/phrase-detail";
import { Breadcrumbs, JsonLd } from "@/components/seo-parts";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { categoryLabels, getPhrase, phrases } from "@/lib/phrases";
import { relatedPhrases } from "@/lib/related";
import { categoryPath, pageMetadata, phraseBreadcrumbs, phraseJsonLd, phrasePath, phraseSeo } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return phrases.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const phrase = getPhrase((await params).id);
  if (!phrase) return {};
  const { title, description } = phraseSeo(phrase);
  return pageMetadata({ title, description, path: phrasePath(phrase.id) });
}

export default async function PhrasePage({ params }: Props) {
  const phrase = getPhrase((await params).id);
  if (!phrase) notFound();
  const related = relatedPhrases(phrases, phrase);
  const labels = Object.fromEntries([phrase, ...related].map(({ category }) => [category, categoryLabels[category]]));

  return (
    <>
      <JsonLd data={phraseJsonLd(siteUrl, phrase)} />
      <SiteHeader />
      <main className="shell phrase-page">
        <Breadcrumbs crumbs={phraseBreadcrumbs(phrase)} />
        <div className="page-head">
          <h1 className="page-title">{phrase.slang}</h1>
          <p className="page-intro">{phraseSeo(phrase).lede}</p>
        </div>
        <PhraseDetail
          phrase={phrase}
          related={related}
          labels={labels}
          category={{ label: categoryLabels[phrase.category], path: categoryPath(phrase.category) }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
