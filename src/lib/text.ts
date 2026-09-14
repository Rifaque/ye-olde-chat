/**
 * Lowercases, drops apostrophes and treats any other punctuation as a space,
 * so "were cooked" finds "We're cooked" and "chat is this real" finds
 * "Chat, is this real?".
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ'‘’`´]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Spelled-out forms collapse to the apostrophe-free contraction, so "we are
// so back", "we're so back" and "were so back" all read the same.
const contractions: [RegExp, string][] = [
  [/\bi am\b/g, "im"],
  [/\byou are\b/g, "youre"],
  [/\bwe are\b/g, "were"],
  [/\bthey are\b/g, "theyre"],
  [/\bhe is\b/g, "hes"],
  [/\bshe is\b/g, "shes"],
  [/\bit is\b/g, "its"],
  [/\bthat is\b/g, "thats"],
  [/\bwhat is\b/g, "whats"],
  [/\bwho is\b/g, "whos"],
  [/\bdo not\b/g, "dont"],
  [/\bdoes not\b/g, "doesnt"],
  [/\bdid not\b/g, "didnt"],
  [/\b(?:can not|cannot)\b/g, "cant"],
  [/\bwill not\b/g, "wont"],
  [/\bis not\b/g, "isnt"],
  [/\bare not\b/g, "arent"],
  [/\bgot to\b/g, "gotta"],
  [/\bgoing to\b/g, "gonna"],
  [/\bu\b/g, "you"],
  [/\bur\b/g, "your"],
];

/** `normalize`, plus contraction folding. Everything that is compared goes through this. */
export function canonical(text: string): string {
  let result = normalize(text);
  for (const [pattern, replacement] of contractions) result = result.replace(pattern, replacement);
  return result;
}

export function words(text: string): string[] {
  const value = canonical(text);
  return value ? value.split(" ") : [];
}

export function compact(text: string): string {
  return text.replace(/ /g, "");
}

/**
 * A deliberately tiny suffix stripper: enough for "banning"/"banned" → "ban",
 * "missed" → "miss", "teammates"/"teammate" → "teammat". Both sides of every
 * comparison are stemmed, so the stems only need to be consistent, not pretty.
 */
export function stem(word: string): string {
  let w = word;
  if (w.length <= 3) return w;
  if (w.endsWith("ies") && w.length > 4) w = `${w.slice(0, -3)}y`;
  else if (w.endsWith("ing") && w.length > 5) w = undouble(w.slice(0, -3));
  else if (w.endsWith("ed") && w.length > 4) w = undouble(w.slice(0, -2));
  else if (/(?:ss|sh|ch|x|z)es$/.test(w)) w = w.slice(0, -2);
  else if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us")) w = w.slice(0, -1);
  if (w.endsWith("e") && w.length > 3) w = w.slice(0, -1);
  return w;
}

function undouble(w: string): string {
  return /([bdgmnprt])\1$/.test(w) ? w.slice(0, -1) : w;
}

/** Words too common to say anything about a situation. Literal slang matching ignores this list. */
export const stopwords: ReadonlySet<string> = new Set(
  (
    "a an the is are was were am be been being i im ive id you youre your yours ya he hes she shes it its we " +
    "they theyre me my mine his him her hers our us their them this that thats these those to of in on at for " +
    "with and or but so just like literally bro bruh dude man guy guys someone somebody anyone everybody do does " +
    "did dont doesnt didnt have has had not no why what whats who whos how when where there here can cant could " +
    "would should will wont need needs get gets got really very all every still even again now then than about " +
    "if as by from up out also too much more some any keep keeps stop stopped stops gonna gotta wanna one lot " +
    "going hows " +
    "thy thou thee thine hath doth art shall most indeed alas pray upon unto hast dost ye"
  ).split(" "),
);

/** Optimal string alignment distance, abandoned early once it exceeds `max`. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (a === b) return 0;
  let previousPrevious: number[] = [];
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, previousPrevious[j - 2] + 1);
      }
      current[j] = value;
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > max) return max + 1;
    previousPrevious = previous;
    previous = current;
  }
  return previous[b.length];
}

/** Typos allowed for a term of this length: none for short words, where a typo is usually another word. */
export function typoBudget(length: number): number {
  if (length >= 8) return 2;
  if (length >= 4) return 1;
  return 0;
}

/** True when `needle` appears in `haystack` as a run of consecutive items. */
export function containsRun(haystack: readonly string[], needle: readonly string[]): boolean {
  if (needle.length === 0 || needle.length > haystack.length) return false;
  outer: for (let start = 0; start <= haystack.length - needle.length; start++) {
    for (let offset = 0; offset < needle.length; offset++) {
      if (haystack[start + offset] !== needle[offset]) continue outer;
    }
    return true;
  }
  return false;
}
