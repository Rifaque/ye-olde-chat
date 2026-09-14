import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhraseCollection } from "@/components/phrase-collection";
import { Breadcrumbs, JsonLd } from "@/components/seo-parts";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { categories, categoryLabels } from "@/lib/phrases";
import {
  categoryBreadcrumbs,
  categoryBySlug,
  categoryJsonLd,
  categoryMetadata,
  categoryPath,
  categorySeo,
  pageMetadata,
  phrasePath,
  phrasesInCategory,
} from "@/lib/seo";
import { siteUrl } from "@/lib/site";

type Props = { params: Promise<{ category: string }> };

// Only the seven known slugs exist; anything else is a 404 rather than a thin page.
export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map(({ id }) => ({ category: categorySeo[id].slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = categoryBySlug((await params).category);
  if (!id) return {};
  return pageMetadata(categoryMetadata(id));
}

export default async function CategoryPage({ params }: Props) {
  const id = categoryBySlug((await params).category);
  if (!id) notFound();
  const seo = categorySeo[id];
  const categoryPhrases = phrasesInCategory(id);

  return (
    <>
      <JsonLd data={categoryJsonLd(siteUrl, id)} />
      <SiteHeader />
      <main className="shell category-page">
        <Breadcrumbs crumbs={categoryBreadcrumbs(id)} />
        <div className="page-head">
          <h1 className="page-title">{seo.heading}</h1>
          <p className="page-intro">{seo.intro}</p>
          <p className="link-row">
            <span>See also:</span>
            {seo.related.map((relatedId) => (
              <Link key={relatedId} href={categoryPath(relatedId)}>
                {categorySeo[relatedId].navLabel}
              </Link>
            ))}
          </p>
        </div>

        <PhraseCollection phrases={categoryPhrases} categoryLabel={categoryLabels[id]} />

        <section className="phrase-index-section" aria-labelledby="phrase-index-heading">
          <h2 id="phrase-index-heading" className="section-title">
            Phrase pages
          </h2>
          <ul className="phrase-index">
            {categoryPhrases.map((phrase) => (
              <li key={phrase.id}>
                <Link href={phrasePath(phrase.id)}>{phrase.slang}</Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter currentCategory={id} />
    </>
  );
}
