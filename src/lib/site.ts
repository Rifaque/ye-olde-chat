export const siteName = "Ye Olde Chat";
export const tagline = "Modern nonsense, most eloquently spoken.";
export const description =
  "A phrasebook of gaming, Twitch and internet slang rendered into absurdly eloquent olde English. Click any phrase to copy it.";

export function normalizeSiteUrl(value: string): string {
  if (value !== value.trim() || (value.match(/https?:\/\//gi) ?? []).length !== 1) {
    throw new Error("Site URL must be one well-formed http:// or https:// URL.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Site URL must be a well-formed http:// or https:// URL.");
  }

  if (!/^https?:$/.test(url.protocol) || !url.hostname || url.username || url.password || url.search || url.hash) {
    throw new Error("Site URL must be an absolute http:// or https:// base URL without credentials, query, or hash.");
  }

  const path = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${path === "/" ? "" : path}`;
}

export function resolveSiteUrl(environment: NodeJS.ProcessEnv = process.env): string {
  if (environment.NEXT_PUBLIC_SITE_URL) return normalizeSiteUrl(environment.NEXT_PUBLIC_SITE_URL);

  if (environment.VERCEL_PROJECT_PRODUCTION_URL) {
    const value = environment.VERCEL_PROJECT_PRODUCTION_URL;
    return normalizeSiteUrl(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  }

  if (environment.NODE_ENV !== "production") return "http://localhost:3000";
  throw new Error(
    "Missing production site URL. Set NEXT_PUBLIC_SITE_URL or expose VERCEL_PROJECT_PRODUCTION_URL on Vercel.",
  );
}

export const siteUrl = resolveSiteUrl();
