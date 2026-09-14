# Ye Olde Chat

Modern nonsense, most eloquently spoken.

A phrasebook of gaming, Twitch, Discord and internet slang rendered into absurdly eloquent olde English. Click any phrase to copy it.

- **Browse** searches 400+ curated phrases by slang, alias, typo or situation ("my teammate is terrible").
- **Popular** lists the phrases copied most often, worldwide.
- **Find a Reply** takes something someone said and picks fitting replies from the phrasebook.
- **Phrase pages** at `/p/<id>` (for example `/p/skill-issue`) are shareable and list kindred phrases.

There is no AI anywhere: every translation is hand-written, and all matching is deterministic ranking over the corpus metadata, run in the browser.

## Run locally

Requires Node.js 22.6 or newer.

```bash
npm install
npm run dev
```

Then visit `http://localhost:3000`. No cloud services are needed. Without Redis configured, Popular shows that global tallies are unavailable and everything else works as normal. To try Popular locally without Redis, start the dev server with `STATS_STORE=memory` (counts live in the dev server process and vanish on restart).

## Scripts

| Command             | What it does                                                   |
| ------------------- | -------------------------------------------------------------- |
| `npm run dev`       | Start the development server                                   |
| `npm run lint`      | ESLint with the Next.js core-web-vitals rules                  |
| `npm run typecheck` | Generate route types and run `tsc`                             |
| `npm test`          | Unit tests for the corpus, search, replies, stats and helpers  |
| `npm run build`     | Production build (static pages plus two small API routes)      |

CI runs lint, typecheck, tests and build on pushes to `main` and on pull requests.

## Adding phrases

Phrases live in `src/lib/corpus/<category>.ts`. Each entry needs:

- `id`: unique kebab-case. It appears in `/p/<id>` links and in the global copy counts, so don't rename ids casually.
- `slang` and `translation`: the translation is what gets copied, and is always hand-written.
- `tags`: situation concepts from `src/lib/concepts.ts` (for example `aim`, `talk`, `ban`). Each concept lists the everyday words that point at it, which is how "he missed every shot" finds `Aim diff`.
- Optional `aliases`: other spellings that should match like the slang itself (`PogChamp` for `Pog`).
- Optional `intents`: `react`, `roast`, `agree`, `dismiss` or `praise`, used by Find a Reply's filter.
- Optional `replyTo`: short phrases in someone's message that this phrase answers especially well.

`npm test` checks the exact phrase count, duplicate ids, slang and translations, alias collisions, unknown tags and untidy text. Update the expected count in `src/lib/phrases.test.ts` when you add phrases.

## How matching works

- **Search** (`src/lib/search.ts`) scores each phrase on two layers. The literal layer compares the query with the slang and aliases as whole strings (exact, prefix, whole word, then typo-tolerant), in tiers far enough apart that exact slang always wins: `L` leads with the phrase `L`, `GG` comes before `GG WP`. The semantic layer adds points for query words found in the slang, aliases, tags, reply cues and translation. Text is lowercased, punctuation and apostrophes are dropped, and contractions are folded (`we are cooked` = `we're cooked`).
- **Find a Reply** (`src/lib/reply.ts`) weighs the concepts a message evokes against each phrase's tags (rarer concepts count for more), adds reply cues found verbatim in the message, and optionally keeps only phrases with the chosen intent. It only ever returns existing phrases.
- **Related phrases** (`src/lib/related.ts`) share tags, intents and wording.

## Global copy stats

Each confirmed copy sends `POST /api/copy` with the phrase id. The server checks the id against the corpus, then runs `ZINCRBY phrase:copies:all 1 <id>` and increments `phrase:copies:total` in Redis. `GET /api/popular` reads the top of that sorted set and the total, and the page joins the ids back to the corpus. Failed or uncertain copies are never counted, and a stats failure never affects the copy itself.

**Privacy.** No accounts, analytics, cookies or fingerprinting. Redis stores only phrase ids with counts and the running total.

**Rate limiting.** Each client may count at most 30 copies per minute. The limiter keys on an HMAC-SHA-256 hash of the client IP (from the `x-forwarded-for` header set by Vercel), keyed with a server secret and truncated. The raw IP is never stored or logged. The counter key includes the minute and expires after two minutes, so nothing about a visitor outlives that window. Cross-site browser requests are also refused. This is meant to make casual spam pointless, not to be fraud-proof.

## Deploying

Set `NEXT_PUBLIC_SITE_URL` (see `.env.example`) to the absolute `https://` URL of the deployed site. It is required for non-Vercel production builds, and builds fail rather than publish localhost canonical metadata when it is missing.

On Vercel, the app can instead use `VERCEL_PROJECT_PRODUCTION_URL`. Enable **Automatically expose System Environment Variables** in the project environment settings for that variable to be available during the build. `NEXT_PUBLIC_SITE_URL` takes precedence when both are present.

### Enabling global stats on Vercel

1. In the Vercel project, open **Storage** (or the Marketplace) and add **Upstash for Redis**, connected to this project. This injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`), and either pair works.
2. Optionally set `STATS_RATE_LIMIT_SECRET` to a long random string. Otherwise the Redis token is used as the hashing secret.
3. Redeploy. These variables are server-only: never give them a `NEXT_PUBLIC_` prefix.

Without these variables the deployment still works, and Popular shows an unavailable state.
