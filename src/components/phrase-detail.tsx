"use client";

import { PhraseCard } from "@/components/phrase-card";
import { useCopyPhrase } from "@/components/use-copy-phrase";
import { categoryLabels, type Phrase } from "@/lib/phrases";

/** The copyable card for a phrase page, plus its related phrases, sharing one copy flow. */
export function PhraseDetail({ phrase, related }: { phrase: Phrase; related: readonly Phrase[] }) {
  const { copy, announcement, handleCopy } = useCopyPhrase();
  const card = (item: Phrase, featured = false) => (
    <PhraseCard
      key={item.id}
      phrase={item}
      categoryLabel={categoryLabels[item.category]}
      status={copy?.id === item.id ? copy.status : undefined}
      featured={featured}
      onCopy={handleCopy}
    />
  );

  return (
    <>
      <div className="status-row">
        <p className="status">{categoryLabels[phrase.category]}</p>
        {copy?.status === "unavailable" ? (
          <p className="hint hint-error">Copy unavailable. The browser blocked clipboard access.</p>
        ) : copy?.status === "uncertain" ? (
          <p className="hint hint-error">Copy may have succeeded. Check your clipboard.</p>
        ) : (
          <p className="hint">
            <span className="hint-pointer">Click</span>
            <span className="hint-touch">Tap</span> the phrase to copy it
          </p>
        )}
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
        </section>
      ) : null}
    </>
  );
}
