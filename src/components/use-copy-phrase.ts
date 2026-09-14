"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CopyStatus } from "@/components/phrase-card";
import { copyText } from "@/lib/clipboard";
import type { Phrase } from "@/lib/phrases";
import { reportCopy } from "@/lib/stats-client";

const COPIED_MS = 1800;
const FAILED_MS = 3200;

/** Copy-to-clipboard with card feedback, a screen reader announcement and the global copy count. */
export function useCopyPhrase() {
  const [copy, setCopy] = useState<{ id: string; status: CopyStatus } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const copyRequest = useRef(0);
  const copyTimer = useRef<number | undefined>(undefined);
  const announceTimer = useRef<number | undefined>(undefined);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      copyRequest.current += 1;
      window.clearTimeout(copyTimer.current);
      window.clearTimeout(announceTimer.current);
    };
  }, []);

  // Clear first, then set: a live region only speaks when its text changes,
  // so copying the same phrase twice must still produce a fresh message.
  const announce = useCallback((message: string) => {
    if (!mounted.current) return;
    window.clearTimeout(announceTimer.current);
    setAnnouncement("");
    announceTimer.current = window.setTimeout(() => {
      if (mounted.current) setAnnouncement(message);
    }, 80);
  }, []);

  const handleCopy = useCallback(
    async (phrase: Phrase) => {
      const request = ++copyRequest.current;
      const result = await copyText(phrase.translation);
      // Only a confirmed copy counts, and counting never waits on or alters the copy feedback.
      if (result === "copied") void reportCopy(phrase.id);
      // A newer copy started while this one was pending; let it own the state.
      if (!mounted.current || request !== copyRequest.current) return;

      window.clearTimeout(copyTimer.current);
      setCopy({ id: phrase.id, status: result });
      const message =
        result === "copied"
          ? `Copied: ${phrase.translation}`
          : result === "uncertain"
            ? "Copy may have succeeded. Check your clipboard."
            : "Copy unavailable. The browser blocked clipboard access.";
      announce(message);
      copyTimer.current = window.setTimeout(() => {
        if (mounted.current && request === copyRequest.current) setCopy(null);
      }, result === "copied" ? COPIED_MS : FAILED_MS);
    },
    [announce],
  );

  return { copy, announcement, handleCopy };
}

/** Holds a value back until it has stopped changing, so live regions don't speak on every keystroke. */
export function useSettledValue<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
}
