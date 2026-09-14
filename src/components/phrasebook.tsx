"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { PhraseCard } from "@/components/phrase-card";
import { useCopyPhrase, useSettledValue } from "@/components/use-copy-phrase";
import { replyIntents, type ReplyIntent } from "@/lib/concepts";
import { categories, categoryLabels, getPhrase, phrases, type Phrase } from "@/lib/phrases";
import { pickRandom } from "@/lib/random";
import { findReplies, MAX_REPLY_MESSAGE_LENGTH } from "@/lib/reply";
import { filterPhrases, type CategoryFilter } from "@/lib/search";
import { getKeyboardShortcutAction } from "@/lib/shortcuts";
import type { PopularStats } from "@/lib/stats";
import { fetchPopular } from "@/lib/stats-client";

type Mode = "browse" | "popular" | "reply";

const modes: { id: Mode; label: string }[] = [
  { id: "browse", label: "Browse" },
  { id: "popular", label: "Popular" },
  { id: "reply", label: "Find a Reply" },
];

const filters: { id: CategoryFilter; label: string; count: number }[] = [
  { id: "all", label: "All", count: phrases.length },
  ...categories.map(({ id, label }) => ({ id, label, count: phrases.filter((phrase) => phrase.category === id).length })),
];

const replyExamples = ["bro you literally missed every shot", "why are you still talking", "this guy needs to be banned"];

const POPULAR_STALE_MS = 30_000;

const numberFormat = new Intl.NumberFormat("en");

function plural(count: number, singular = "phrase", pluralForm = `${singular}s`) {
  return `${numberFormat.format(count)} ${count === 1 ? singular : pluralForm}`;
}

type PopularState = { status: "loading" } | { status: "ready"; stats: PopularStats; loadedAt: number };

export function Phrasebook() {
  const [mode, setMode] = useState<Mode>("browse");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [randomId, setRandomId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [intent, setIntent] = useState<ReplyIntent | null>(null);
  const [popular, setPopular] = useState<PopularState>({ status: "loading" });
  const { copy, announcement, handleCopy } = useCopyPhrase();

  const searchRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const randomButtonRef = useRef<HTMLButtonElement>(null);
  const lastRandomId = useRef<string | null>(null);
  const focusSearchAfterRender = useRef(false);
  const popularRequest = useRef<AbortController | null>(null);

  // Typing stays responsive while hundreds of cards re-rank a beat behind.
  const deferredQuery = useDeferredValue(query);
  const deferredMessage = useDeferredValue(message);
  const results = useMemo(() => filterPhrases(phrases, { query: deferredQuery, category }), [deferredQuery, category]);
  const replies = useMemo(() => findReplies(phrases, deferredMessage, { intent }), [deferredMessage, intent]);
  const randomPhrase = randomId ? getPhrase(randomId) : undefined;
  const trimmedQuery = deferredQuery.trim();
  const trimmedMessage = deferredMessage.trim();
  const categoryLabel = category === "all" ? null : categoryLabels[category];
  const intentLabel = intent ? replyIntents.find(({ id }) => id === intent)?.label : null;

  const loadPopular = useCallback(() => {
    popularRequest.current?.abort();
    const controller = new AbortController();
    popularRequest.current = controller;
    void fetchPopular(controller.signal).then((stats) => {
      if (!controller.signal.aborted) setPopular({ status: "ready", stats, loadedAt: Date.now() });
    });
  }, []);

  useEffect(() => {
    loadPopular();
    return () => popularRequest.current?.abort();
  }, [loadPopular]);

  useEffect(() => {
    if (mode === "popular" && popular.status === "ready" && Date.now() - popular.loadedAt > POPULAR_STALE_MS) loadPopular();
  }, [mode, popular, loadPopular]);

  // #popular and #reply open straight into that view and survive a reload.
  useEffect(() => {
    const syncFromHash = () => {
      const fromHash = modes.find(({ id }) => `#${id}` === window.location.hash)?.id;
      if (fromHash) setMode(fromHash);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const chooseMode = useCallback((next: Mode) => {
    setMode(next);
    const { pathname, search } = window.location;
    window.history.replaceState(window.history.state, "", next === "browse" ? `${pathname}${search}` : `#${next}`);
  }, []);

  const focusSearch = useCallback(() => {
    searchRef.current?.focus();
    searchRef.current?.select();
  }, []);

  useEffect(() => {
    if (mode === "browse" && focusSearchAfterRender.current) {
      focusSearchAfterRender.current = false;
      focusSearch();
    }
  }, [mode, focusSearch]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      const isSearchInput = target === searchRef.current;
      const isTextEntry = Boolean(target?.closest("input, textarea, select, [contenteditable]"));
      const browsing = mode === "browse";
      const action = getKeyboardShortcutAction({
        key: event.key,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        isTextEntry,
        isSearchInput,
        randomActive: browsing && randomId !== null,
        query: browsing ? query : "",
      });

      if (action === "focus-search") {
        event.preventDefault();
        if (browsing) focusSearch();
        else {
          focusSearchAfterRender.current = true;
          chooseMode("browse");
        }
      } else if (action === "exit-random") {
        event.preventDefault();
        // The featured card is about to unmount; keep focus somewhere sensible.
        if (document.activeElement?.closest(".cards")) randomButtonRef.current?.focus();
        setRandomId(null);
      } else if (action === "clear-search") {
        event.preventDefault();
        // A zero-result action can disappear when its search clears.
        if (document.activeElement?.closest(".empty")) focusSearch();
        setQuery("");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chooseMode, focusSearch, mode, query, randomId]);

  function showRandom() {
    const pool = filterPhrases(phrases, { query: "", category });
    const next = pickRandom(pool, lastRandomId.current);
    if (!next) return;
    lastRandomId.current = next.id;
    setQuery("");
    setRandomId(next.id);
  }

  function chooseCategory(next: CategoryFilter) {
    setCategory(next);
    setRandomId(null);
  }

  function applyExample(example: string) {
    setMessage(example);
    messageRef.current?.focus();
  }

  const popularStats = popular.status === "ready" ? popular.stats : null;
  const popularPhrases = (popularStats?.phrases ?? []).flatMap(({ id, count }) => {
    const phrase = getPhrase(id);
    return phrase ? [{ phrase, count }] : [];
  });

  let status: string;
  let hint: ReactNode = null;
  if (mode === "browse") {
    status = plural(results.length);
    if (randomPhrase) status = categoryLabel ? `Chosen at random from ${categoryLabel}` : "Chosen at random";
    else if (trimmedQuery) status = `${plural(results.length)} for “${trimmedQuery}”${categoryLabel ? ` in ${categoryLabel}` : ""}`;
    else if (categoryLabel) status = `${plural(results.length)} in ${categoryLabel}`;
  } else if (mode === "popular") {
    status =
      popular.status === "loading"
        ? "Consulting the ledgers…"
        : !popularStats?.available
          ? "Global tallies unavailable"
          : popularPhrases.length
            ? popularPhrases.length === 1
              ? "The most copied phrase, worldwide"
              : `The ${numberFormat.format(popularPhrases.length)} most copied phrases, worldwide`
            : "No copies tallied yet";
  } else {
    status = !trimmedMessage
      ? "Paste what someone said"
      : `${plural(replies.length, "fitting reply", "fitting replies")}${intentLabel ? ` · ${intentLabel}` : ""}`;
  }

  if (mode === "browse" && randomPhrase) {
    hint = (
      <span className="status-actions">
        <Link className="text-button" href={`/p/${randomPhrase.id}`}>
          Phrase page
        </Link>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setRandomId(null);
            randomButtonRef.current?.focus();
          }}
        >
          Show all phrases
        </button>
      </span>
    );
  } else if (copy?.status === "unavailable") {
    hint = <p className="hint hint-error">Copy unavailable. The browser blocked clipboard access.</p>;
  } else if (copy?.status === "uncertain") {
    hint = <p className="hint hint-error">Copy may have succeeded. Check your clipboard.</p>;
  } else {
    hint = (
      <p className="hint">
        <span className="hint-pointer">Click</span>
        <span className="hint-touch">Tap</span> a phrase to copy it
      </p>
    );
  }

  // Screen readers hear the result count once typing pauses, not on every keystroke.
  const settledStatus = useSettledValue(status, 700);

  const renderCard = (phrase: Phrase, options: { featured?: boolean; note?: string } = {}) => (
    <PhraseCard
      key={phrase.id}
      phrase={phrase}
      categoryLabel={categoryLabels[phrase.category]}
      status={copy?.id === phrase.id ? copy.status : undefined}
      featured={options.featured}
      note={options.note}
      onCopy={handleCopy}
    />
  );

  const matchesElsewhere =
    mode === "browse" && !randomPhrase && results.length === 0 && category !== "all"
      ? filterPhrases(phrases, { query: deferredQuery, category: "all" }).length
      : 0;

  return (
    <>
      <div className="shell modes-row">
        <ModeTabs mode={mode} onChange={chooseMode} />
        <p className="site-stats">
          {plural(phrases.length)}
          {popularStats?.available && popularStats.total > 0 ? (
            <>
              <span aria-hidden="true"> · </span>
              <span className="sr-only">, </span>
              {plural(popularStats.total, "proclamation", "proclamations")} copied
            </>
          ) : null}
        </p>
      </div>

      <div id="phrasebook-panel" role="tabpanel" aria-labelledby={`tab-${mode}`} className="panel">
        {mode !== "popular" ? (
          <div className="toolbar" data-mode={mode}>
            <div className="shell">
              {mode === "browse" ? (
                <>
                  <div className="toolbar-row">
                    <div className="search">
                      <svg className="icon search-icon" viewBox="0 0 20 20" aria-hidden="true">
                        <circle cx="9" cy="9" r="5.75" />
                        <path d="m13.5 13.5 3.5 3.5" />
                      </svg>
                      <label htmlFor="phrase-search" className="sr-only">
                        Search phrases or describe a situation
                      </label>
                      <input
                        ref={searchRef}
                        id="phrase-search"
                        type="search"
                        value={query}
                        onChange={(event) => {
                          setQuery(event.target.value);
                          setRandomId(null);
                        }}
                        placeholder="Search “cooked”, “gg”, or “my teammate is terrible”…"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        enterKeyHint="search"
                      />
                      {query ? (
                        <button
                          type="button"
                          className="search-clear"
                          aria-label="Clear search"
                          onClick={() => {
                            setQuery("");
                            searchRef.current?.focus();
                          }}
                        >
                          <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
                            <path d="m4.5 4.5 7 7m0-7-7 7" />
                          </svg>
                        </button>
                      ) : (
                        <kbd className="search-kbd" aria-hidden="true">
                          /
                        </kbd>
                      )}
                    </div>
                    <button ref={randomButtonRef} type="button" className="button" onClick={showRandom}>
                      <svg className="icon" viewBox="0 0 20 20" aria-hidden="true">
                        <rect x="3.25" y="3.25" width="13.5" height="13.5" rx="3" />
                        <circle className="icon-dot" cx="7.25" cy="7.25" r="1.25" />
                        <circle className="icon-dot" cx="12.75" cy="12.75" r="1.25" />
                        <circle className="icon-dot" cx="10" cy="10" r="1.25" />
                      </svg>
                      <span className="button-label">Random</span>
                    </button>
                  </div>

                  <div className="filters" role="group" aria-label="Filter by category">
                    {filters.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        className="pill"
                        aria-pressed={filter.id === category}
                        onClick={() => chooseCategory(filter.id)}
                      >
                        {filter.label}
                        <span className="pill-count" aria-hidden="true">
                          {filter.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="search reply-field">
                    <label htmlFor="reply-message" className="sr-only">
                      What did they say?
                    </label>
                    <textarea
                      ref={messageRef}
                      id="reply-message"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      maxLength={MAX_REPLY_MESSAGE_LENGTH}
                      rows={2}
                      placeholder="Paste what they said, e.g. “why are you still talking”"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {message ? (
                      <button
                        type="button"
                        className="search-clear"
                        aria-label="Clear message"
                        onClick={() => {
                          setMessage("");
                          messageRef.current?.focus();
                        }}
                      >
                        <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
                          <path d="m4.5 4.5 7 7m0-7-7 7" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                  <div className="filters" role="group" aria-label="Kind of reply">
                    <button type="button" className="pill" aria-pressed={intent === null} onClick={() => setIntent(null)}>
                      Any
                    </button>
                    {replyIntents.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className="pill"
                        aria-pressed={intent === option.id}
                        onClick={() => setIntent(intent === option.id ? null : option.id)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}

        <div className="shell">
          <h2 className="sr-only">{modes.find(({ id }) => id === mode)?.label}</h2>
          <div className="status-row">
            <p className="status">{status}</p>
            {hint}
          </div>

          <p className="sr-only" role="status">
            {settledStatus}
          </p>
          <p className="sr-only" role="status">
            {announcement}
          </p>

          {mode === "browse" ? (
            <div className="cards" data-mode={randomPhrase ? "random" : undefined} key={randomId ?? category}>
              {randomPhrase ? (
                renderCard(randomPhrase, { featured: true })
              ) : results.length > 0 ? (
                results.map((phrase) => renderCard(phrase))
              ) : (
                <div className="empty">
                  <p className="empty-title">Alas, no phrase matches “{trimmedQuery}”.</p>
                  <p className="empty-body">
                    {matchesElsewhere
                      ? `${plural(matchesElsewhere)} match in other categories.`
                      : "Try the slang as you would type it, like “gg”, or describe the moment, like “someone is lying”."}
                  </p>
                  {matchesElsewhere ? (
                    <button
                      type="button"
                      className="button"
                      onClick={() => {
                        chooseCategory("all");
                        searchRef.current?.focus();
                      }}
                    >
                      Search all categories
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button"
                      onClick={() => {
                        setQuery("");
                        searchRef.current?.focus();
                      }}
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : mode === "popular" ? (
            <div className="cards" key="popular">
              {popular.status === "loading" ? null : !popularStats?.available ? (
                <div className="empty">
                  <p className="empty-title">The ledgers are closed.</p>
                  <p className="empty-body">Global copy tallies are unavailable right now. Browsing and replies still work.</p>
                  <button type="button" className="button" onClick={() => chooseMode("browse")}>
                    Browse phrases
                  </button>
                </div>
              ) : popularPhrases.length === 0 ? (
                <div className="empty">
                  <p className="empty-title">No proclamation copied yet.</p>
                  <p className="empty-body">Copy a phrase and it shall head this list.</p>
                  <button type="button" className="button" onClick={() => chooseMode("browse")}>
                    Browse phrases
                  </button>
                </div>
              ) : (
                popularPhrases.map(({ phrase, count }) => renderCard(phrase, { note: plural(count, "copy", "copies") }))
              )}
            </div>
          ) : (
            <div className="cards" key="reply">
              {!trimmedMessage ? (
                <div className="empty">
                  <p className="empty-title">What did they say?</p>
                  <p className="empty-body">Paste a message and the phrasebook offers its most fitting replies. Nothing is generated.</p>
                  <div className="examples">
                    {replyExamples.map((example) => (
                      <button key={example} type="button" className="pill" onClick={() => applyExample(example)}>
                        “{example}”
                      </button>
                    ))}
                  </div>
                </div>
              ) : replies.length > 0 ? (
                replies.map(({ phrase }) => renderCard(phrase))
              ) : (
                <div className="empty">
                  <p className="empty-title">Alas, no fitting reply comes to mind.</p>
                  <p className="empty-body">
                    {intent ? `Nothing to ${intentLabel?.toLowerCase()} with. Try any kind of reply.` : "Try describing the moment in plainer words."}
                  </p>
                  {intent ? (
                    <button
                      type="button"
                      className="button"
                      onClick={() => {
                        setIntent(null);
                        messageRef.current?.focus();
                      }}
                    >
                      Any kind of reply
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ModeTabs({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: ReactKeyboardEvent, index: number) {
    const last = modes.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    tabs.current[next]?.focus();
    onChange(modes[next].id);
  }

  return (
    <div className="modes" role="tablist" aria-label="Phrasebook views">
      {modes.map((option, index) => (
        <button
          key={option.id}
          ref={(element) => {
            tabs.current[index] = element;
          }}
          id={`tab-${option.id}`}
          type="button"
          role="tab"
          className="mode"
          aria-selected={mode === option.id}
          aria-controls="phrasebook-panel"
          tabIndex={mode === option.id ? 0 : -1}
          onClick={() => onChange(option.id)}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
