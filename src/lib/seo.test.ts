import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { categories, getPhrase, phrases } from "./phrases.ts";
import {
  buildRobots,
  buildSitemap,
  categoryBySlug,
  categoryJsonLd,
  categoryMetadata,
  categoryPath,
  categorySeo,
  homeSeo,
  pageMetadata,
  phraseJsonLd,
  phrasePath,
  phraseSeo,
  serializeJsonLd,
  websiteJsonLd,
} from "./seo.ts";

const base = "https://yeoldechat.example";

describe("category routes", () => {
  it("keeps category slugs stable", () => {
    assert.deepEqual(
      Object.fromEntries(categories.map(({ id }) => [id, categoryPath(id)])),
      { gaming: "/gaming", internet: "/internet", twitch: "/twitch", arguments: "/arguments", reactions: "/praise", discord: "/discord", afk: "/afk-social" },
    );
  });

  it("maps slugs back to categories and rejects anything else", () => {
    for (const { id } of categories) assert.equal(categoryBySlug(categorySeo[id].slug), id);
    for (const slug of ["", "p", "api", "reactions", "afk", "Gaming", "gaming/", "sitemap.xml"]) {
      assert.equal(categoryBySlug(slug), undefined, slug);
    }
  });

  it("gives every category unique, non-empty titles, headings and descriptions", () => {
    const seen = { title: new Set<string>(), heading: new Set<string>(), description: new Set<string>(), intro: new Set<string>() };
    for (const { id } of categories) {
      const { title, description } = categoryMetadata(id);
      const { heading, intro } = categorySeo[id];
      for (const [key, value] of Object.entries({ title, heading, description, intro })) {
        assert.ok(value.trim().length > 10, `${id} ${key} is empty`);
        assert.ok(!seen[key as keyof typeof seen].has(value), `${id} repeats a ${key}`);
        seen[key as keyof typeof seen].add(value);
      }
      assert.ok(description.length <= 170, `${id} description is ${description.length} characters`);
      assert.ok(description.startsWith(String(phrases.filter((phrase) => phrase.category === id).length)), `${id} description count`);
      assert.ok(categorySeo[id].related.every((related) => related !== id));
      assert.ok(getPhrase(categorySeo[id].featuredPhraseId)?.category === id, `${id} features a phrase from elsewhere`);
    }
  });
});

describe("phrase metadata", () => {
  it("gives every phrase a unique, non-empty title and description containing the phrase", () => {
    const titles = new Set<string>();
    for (const phrase of phrases) {
      const { title, description, lede } = phraseSeo(phrase);
      assert.ok(title.length > 10 && lede.length > 10, `empty metadata for ${phrase.id}`);
      assert.ok(!titles.has(title), `duplicate title: ${title}`);
      titles.add(title);
      assert.ok(description.includes(phrase.translation), `${phrase.id} description lacks its translation`);
      assert.doesNotMatch(`${lede} ${description}`, /[?!.]”[?!.]/, `doubled punctuation for ${phrase.id}`);
      assert.doesNotMatch(title, /meaning/i, "titles must not promise definitions the page lacks");
    }
  });

  it("targets how people actually search for key phrases", () => {
    assert.equal(phraseSeo(getPhrase("skill-issue")!).title, "Funny Ways to Say “Skill Issue”");
    assert.equal(phraseSeo(getPhrase("mods-alert")!).title, "Funny Way to Call the Mods: “MODS!”");
    assert.equal(phraseSeo(getPhrase("gg")!).title, "Funny Way to Say “GG”");
    assert.match(phraseSeo(getPhrase("cooked")!).title, /Cooked/);
    assert.match(phraseSeo(getPhrase("mods-alert")!).description, /summon the mods.*WARDENS! SEIZE THIS KNAVE AT ONCE!.*Twitch/);
    assert.match(phraseSeo(getPhrase("who-asked")!).description, /comebacks/);
  });
});

describe("canonical URLs and page metadata", () => {
  it("points each page at its own clean path", () => {
    assert.equal(pageMetadata({ title: "Home", description: "d", path: "/" }).alternates?.canonical, "/");
    assert.equal(pageMetadata({ ...categoryMetadata("twitch") }).alternates?.canonical, "/twitch");
    const phrase = pageMetadata({ ...phraseSeo(getPhrase("skill-issue")!), path: phrasePath("skill-issue") });
    assert.equal(phrase.alternates?.canonical, "/p/skill-issue");
    assert.equal((phrase.openGraph as { url?: string }).url, "/p/skill-issue");
  });

  it("uses the title template everywhere except the home page", () => {
    assert.deepEqual(pageMetadata({ title: homeSeo.title, description: "d", path: "/", absoluteTitle: true }).title, { absolute: homeSeo.title });
    assert.equal(pageMetadata(categoryMetadata("gaming")).title, "Funny Gaming Phrases, Slang & Trash Talk");
  });
});

describe("sitemap and robots", () => {
  const urls = buildSitemap(base).map(({ url }) => url);

  it("lists the home page, every category and every phrase exactly once", () => {
    assert.equal(urls.length, 1 + categories.length + phrases.length);
    assert.equal(new Set(urls).size, urls.length);
    assert.equal(urls.filter((url) => url === base).length, 1);
    for (const { id } of categories) assert.equal(urls.filter((url) => url === `${base}${categoryPath(id)}`).length, 1);
    for (const { id } of phrases) assert.equal(urls.filter((url) => url === `${base}/p/${id}`).length, 1);
  });

  it("contains only clean production URLs", () => {
    for (const url of urls) {
      assert.ok(url.startsWith(base), url);
      assert.doesNotMatch(url, /localhost|\?|#|\/api\//);
    }
    assert.ok(buildSitemap(base).every((entry) => !("lastModified" in entry)), "no invented modification dates");
  });

  it("allows public pages, keeps crawlers off the API and points at the sitemap", () => {
    const robots = buildRobots(base);
    assert.equal(robots.sitemap, `${base}/sitemap.xml`);
    assert.deepEqual(robots.rules, [{ userAgent: "*", allow: "/", disallow: "/api/" }]);
  });
});

describe("structured data", () => {
  it("describes the site, a category and a phrase's breadcrumb truthfully", () => {
    assert.deepEqual(websiteJsonLd(base), {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Ye Olde Chat",
      url: base,
      description: homeSeo.description,
      inLanguage: "en",
    });

    const category = categoryJsonLd(base, "twitch");
    assert.equal(category["@type"], "CollectionPage");
    assert.equal(category.url, `${base}/twitch`);
    assert.deepEqual(category.breadcrumb.itemListElement.map(({ item }) => item), [base, `${base}/twitch`]);

    const phrase = phraseJsonLd(base, getPhrase("mods-alert")!);
    assert.equal(phrase["@type"], "BreadcrumbList");
    assert.deepEqual(
      phrase.itemListElement.map(({ position, name, item }) => [position, name, item]),
      [[1, "Ye Olde Chat", base], [2, "Twitch", `${base}/twitch`], [3, "MODS!", `${base}/p/mods-alert`]],
    );
    for (const data of [websiteJsonLd(base), category, phrase]) {
      assert.doesNotMatch(JSON.stringify(data), /aggregateRating|FAQPage|DefinedTerm|author/);
    }
  });

  it("cannot break out of its script tag", () => {
    assert.equal(serializeJsonLd({ name: "</script><script>" }), '{"name":"\\u003c/script>\\u003cscript>"}');
  });
});
