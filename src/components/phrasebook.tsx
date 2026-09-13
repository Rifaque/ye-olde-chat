"use client";

import { useMemo, useRef, useState } from "react";
import { categories, phrases, type Phrase } from "@/lib/phrases";

const searchHint = "Search ‘cooked’, ‘mods’, ‘gg’…";

function matches(phrase: Phrase, query: string, category: string) {
  return (
    (category === "All" || phrase.category === category) &&
    `${phrase.modern} ${phrase.translation}`.toLowerCase().includes(query.toLowerCase())
  );
}

export function Phrasebook() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [copied, setCopied] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const results = useMemo(
    () => phrases.filter((phrase) => matches(phrase, query, category)),
    [category, query],
  );

  async function copyPhrase(phrase: Phrase) {
    await navigator.clipboard.writeText(phrase.translation);
    setCopied(phrase.translation);
    window.setTimeout(() => setCopied(null), 1600);
  }

  function chooseRandom() {
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    setCategory("All");
    setQuery(phrase.modern);
    requestAnimationFrame(() => searchRef.current?.focus());
  }

  return (
    <main>
      <header className="hero">
        <div className="crest" aria-hidden="true">Y</div>
        <p className="eyebrow">A MOST SERIOUS REFERENCE WORK</p>
        <h1>
          Ye Olde <em>Chat</em>
        </h1>
        <p className="lede">Modern gaming and internet slang, most eloquently spoken.</p>
        <p className="hero-note">For scholars, scoundrels, and ranked teammates alike.</p>
      </header>

      <section className="archive" aria-labelledby="archive-title">
        <div className="archive-heading">
          <div>
            <p className="section-kicker">THE ARCHIVES</p>
            <h2 id="archive-title">Find the right words.</h2>
          </div>
          <p className="result-count" aria-live="polite">{results.length} {results.length === 1 ? "phrase" : "phrases"} found</p>
        </div>

        <div className="toolbar">
          <label className="search-field">
            <span className="sr-only">Search phrases</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchHint}
              autoComplete="off"
            />
          </label>
          <button className="random-button" type="button" onClick={chooseRandom}>
            <span aria-hidden="true">✦</span> Random phrase
          </button>
        </div>

        <nav className="tabs" aria-label="Phrase categories">
          {categories.map((item) => (
            <button
              className={item === category ? "tab active" : "tab"}
              key={item}
              type="button"
              aria-pressed={item === category}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="cards" aria-live="polite">
          {results.length ? results.map((phrase) => (
            <article className="card" key={`${phrase.category}-${phrase.modern}`}>
              <div className="card-topline">
                <p>{phrase.modern}</p>
                <span>{phrase.category}</span>
              </div>
              <p className="translation">{phrase.translation}</p>
              <button
                className="copy-button"
                type="button"
                onClick={() => copyPhrase(phrase)}
                aria-label={`Copy translation for ${phrase.modern}`}
              >
                {copied === phrase.translation ? "Copied" : "Copy"}
              </button>
            </article>
          )) : (
            <div className="empty-state">
              <span aria-hidden="true">☾</span>
              <p>No phrase hath been found in the archives.</p>
              <button type="button" onClick={() => { setQuery(""); setCategory("All"); }}>Clear the search</button>
            </div>
          )}
        </div>
      </section>

      <footer>
        <span>Compiled for the spirited chronicle of the internet.</span>
        <span aria-hidden="true">·</span>
        <span>MMXXVI</span>
      </footer>

      <div className={copied ? "toast show" : "toast"} role="status">
        Copied to thy clipboard.
      </div>
    </main>
  );
}
