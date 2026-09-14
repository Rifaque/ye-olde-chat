"use client";

import { PhraseCard } from "@/components/phrase-card";
import { useCopyPhrase } from "@/components/use-copy-phrase";
import type { Phrase } from "@/lib/phrases";

/**
 * A static grid of copyable phrase cards for server-rendered pages. Labels
 * arrive as props so the page doesn't ship the whole corpus to the browser.
 */
export function PhraseCollection({ phrases, categoryLabel }: { phrases: readonly Phrase[]; categoryLabel: string }) {
  const { copy, announcement, handleCopy } = useCopyPhrase();

  return (
    <>
      <div className="status-row">
        <p className="status">{phrases.length === 1 ? "1 phrase" : `${phrases.length} phrases`}</p>
        <CopyHint status={copy?.status} />
      </div>
      <p className="sr-only" role="status">
        {announcement}
      </p>
      <div className="cards">
        {phrases.map((phrase) => (
          <PhraseCard
            key={phrase.id}
            phrase={phrase}
            categoryLabel={categoryLabel}
            status={copy?.id === phrase.id ? copy.status : undefined}
            onCopy={handleCopy}
          />
        ))}
      </div>
    </>
  );
}

export function CopyHint({ status, noun = "a phrase" }: { status?: string; noun?: string }) {
  if (status === "unavailable") return <p className="hint hint-error">Copy unavailable. The browser blocked clipboard access.</p>;
  if (status === "uncertain") return <p className="hint hint-error">Copy may have succeeded. Check your clipboard.</p>;
  return (
    <p className="hint">
      <span className="hint-pointer">Click</span>
      <span className="hint-touch">Tap</span> {noun} to copy it
    </p>
  );
}
