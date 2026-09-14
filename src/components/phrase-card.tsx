import type { Phrase } from "@/lib/phrases";

export type CopyStatus = "copied" | "unavailable" | "uncertain";

type PhraseCardProps = {
  phrase: Phrase;
  categoryLabel: string;
  status?: CopyStatus;
  featured?: boolean;
  /** Replaces the category label, e.g. a copy count in Popular. Kept out of the accessible name. */
  note?: string;
  onCopy: (phrase: Phrase) => void;
};

const actionLabel: Record<CopyStatus | "idle", string> = {
  idle: "Copy",
  copied: "Copied",
  unavailable: "Copy unavailable",
  uncertain: "Check clipboard",
};

export function PhraseCard({ phrase, categoryLabel, status, featured = false, note, onCopy }: PhraseCardProps) {
  return (
    <button
      type="button"
      className="phrase-card"
      data-status={status}
      data-featured={featured || undefined}
      aria-label={`Copy translation of “${phrase.slang}”: ${phrase.translation}`}
      onClick={() => onCopy(phrase)}
    >
      <span className="phrase-meta">
        <span className="phrase-slang">{phrase.slang}</span>
        <span className="phrase-hint">
          <span className="phrase-category">{note ?? categoryLabel}</span>
          <span className="phrase-action">
            <ActionIcon status={status} />
            {actionLabel[status ?? "idle"]}
          </span>
        </span>
      </span>
      <span className="phrase-translation">{phrase.translation}</span>
    </button>
  );
}

function ActionIcon({ status }: { status?: CopyStatus }) {
  return (
    <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
      {status === "copied" ? (
        <path d="m3.5 8.5 3 3 6-7" />
      ) : status === "unavailable" || status === "uncertain" ? (
        <path d="M8 4.5v4M8 11.2v.3" />
      ) : (
        <>
          <rect x="5.5" y="5.5" width="7" height="7" rx="1.5" />
          <path d="M10.5 3.5h-5a2 2 0 0 0-2 2v5" />
        </>
      )}
    </svg>
  );
}
