"use client";

import Link from "next/link";
import { PhraseCard } from "@/components/phrase-card";
import { CopyHint } from "@/components/phrase-collection";
import { useCopyPhrase } from "@/components/use-copy-phrase";
import type { Phrase } from "@/lib/phrases";

type Props = {
  phrase: Phrase;
  related: readonly Phrase[];
  /** Category labels for the phrase and its related phrases, keyed by category id. */
  labels: Record<string, string>;
  category: { label: string; path: string };
};

/** The copyable card for a phrase page, plus its related phrases, sharing one copy flow. */
export function PhraseDetail({ phrase, related, labels, category }: Props) {
  const { copy, announcement, handleCopy } = useCopyPhrase();
  const card = (item: Phrase, featured = false) => (
    <PhraseCard
      key={item.id}
      phrase={item}
      categoryLabel={labels[item.category]}
      status={copy?.id === item.id ? copy.status : undefined}
      featured={featured}
      onCopy={handleCopy}
    />
  );

  return (
    <>
      <div className="status-row status-row-quiet">
        <CopyHint status={copy?.status} noun="the phrase" />
      </div>
      <p className="sr-only" role="status">
        {announcement}
      </p>
      <div className="cards" data-mode="random">
        {card(phrase, true)}
      </div>

      {related.length > 0 ? (
        <section className="related" aria-labelledby="related-heading">
          <h2 id="related-heading" className="section-title">
            Kindred phrases
          </h2>
          <div className="cards">{related.map((item) => card(item))}</div>
          {/* Cards copy; these plain links lead to each phrase's own page. */}
          <p className="link-row">
            <span>Phrase pages:</span>
            {related.map((item) => (
              <Link key={item.id} href={`/p/${item.id}`}>
                {item.slang}
              </Link>
            ))}
            <Link href={category.path}>All phrases in {category.label}</Link>
          </p>
        </section>
      ) : null}
    </>
  );
}
