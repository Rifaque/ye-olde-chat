export type KeyboardShortcutAction = "focus-search" | "exit-random" | "clear-search" | "none";

type KeyboardShortcutInput = {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  isTextEntry: boolean;
  isSearchInput: boolean;
  randomActive: boolean;
  query: string;
};

/** Keeps phrasebook shortcuts deterministic and independently testable. */
export function getKeyboardShortcutAction({
  key,
  altKey,
  ctrlKey,
  metaKey,
  isTextEntry,
  isSearchInput,
  randomActive,
  query,
}: KeyboardShortcutInput): KeyboardShortcutAction {
  if (altKey) return "none";
  if (key.toLowerCase() === "k" && (ctrlKey || metaKey)) return "focus-search";
  if (key === "/" && !isTextEntry && !ctrlKey && !metaKey) return "focus-search";
  if (key !== "Escape" || (isTextEntry && !isSearchInput)) return "none";
  if (randomActive) return "exit-random";
  if (query.length > 0) return "clear-search";
  return "none";
}
