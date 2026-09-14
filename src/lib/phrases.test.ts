import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { concepts, replyIntents } from "./concepts.ts";
import { categories, getPhrase, isPhraseId, phrases } from "./phrases.ts";
import { normalize } from "./text.ts";

function duplicates(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

/** Finds phrases by slang or alias, ignoring case, spacing and punctuation. */
function lookup(text: string) {
  const key = normalize(text);
  return phrases.filter((phrase) => [phrase.slang, ...(phrase.aliases ?? [])].some((value) => normalize(value) === key));
}

// Every expression the phrasebook promises. Each must be a phrase's slang or one of its aliases.
const required = [
  // Twitch & streaming
  "Pog", "PogChamp", "Poggers", "KEKW", "LUL", "Copium", "Hopium", "Malding", "MonkaS", "PepeHands", "Sadge",
  "FeelsBadMan", "FeelsGoodMan", "ResidentSleeper", "Kappa", "Clueless", "Aware", "Based", "Cringe", "W streamer",
  "L streamer", "W chat", "L chat", "Chat, is this real?", "CHAT?!", "Mods?", "MODS!", "Ban him", "Permaban", "Timeout",
  "Unban me", "First time chatter", "Lurking", "Stream sniping", "Backseating", "Clip that", "Someone clip it", "Donate",
  "Gifted subs", "Thanks for the sub", "Raid", "We got raided", "Stream is scuffed", "F in chat", "Spam W", "Spam L",
  "Let him cook", "He cooked", "Never let him cook again", "We are so back", "It's so over", "Cinema", "Absolute cinema",
  "Peak", "NPC", "Touch grass", "Go outside", "Streamer luck", "Chat made me do it", "Skill issue",
  "W mods", "L mods", "Mods asleep", "Mod check", "Chat is wild", "Chat is cooked", "Slow mode", "Emote only", "Sub only",
  "VIP", "Mod him", "Unmod him", "W dono", "Huge dono", "Sub train", "Hype train", "Prime sub", "Ads", "Mic muted",
  "You're muted", "Camera frozen", "Stream froze", "Buffering", "144p", "Stream starting soon", "One more game",
  "Last game", "We're live", "Just Chatting", "React content", "Clip farmer", "Chat bait", "Rage bait", "Dead chat",
  "Wake up chat", "Chat behave",
  // Earlier essentials
  "GG WP", "You suck", "Report him", "Defend base", "I'm carrying", "Rage quit", "EZ", "Nice try", "Surrender", "I lagged",
  "gyatt", "idk", "fr", "bro", "omg", "sigma", "rizz", "cooked", "nah", "GTG", "yapping",
  // Gaming
  "Clutch", "1 HP", "One shot", "He's one", "Revive me", "Rush B", "Rotate", "Flank", "Campers", "Spawn camping",
  "Third party", "Sweaty", "Tryhard", "Smurf", "Boosted", "Hard stuck", "Elo hell", "Team diff", "Jungle diff", "Mid diff",
  "Tank diff", "Healer diff", "Throwing", "Feeding", "Inting", "Griefing", "High ping", "Packet loss", "Rubberbanding",
  "FPS drop", "Potato PC", "Toaster PC", "Broken game", "Glitch", "Exploit", "Nerf this", "Buff this", "OP", "Meta",
  "Off-meta", "Aim diff", "Whiff", "Headshot", "Deleted", "Team wipe", "Ace", "Pentakill", "No scope", "Wallbang",
  "Friendly fire", "Misclick", "Carry me",
  // Internet & Gen-Z
  "Bet", "Say less", "No cap", "Cap", "That's cap", "Lowkey", "Highkey", "Mid", "It's giving", "Ate",
  "Ate and left no crumbs", "Slay", "Main character", "Delulu", "Delulu is the solulu", "Situationship", "Red flag",
  "Green flag", "Ick", "Sus", "Ratio", "Flop", "Fell off", "Washed", "Locked in", "Brainrot", "Terminally online",
  "Chronically online", "GOAT", "He's him", "She's her", "Built different", "Aura", "Negative aura", "Aura farming",
  "Aura loss", "Glazing", "Stop glazing", "Doing numbers", "Went viral", "Algorithm", "Doomscrolling", "Lore", "Lore drop",
  "Canon event", "Side quest", "Plot twist", "Plot armor", "Villain arc", "Redemption arc", "Core memory", "Receipts",
  "Caught in 4K", "Exposed", "Glow up", "Unc", "Bro is ancient", "Bro is finished", "It's wraps", "Pack it up",
  "It's joever", "We won", "Let them cook", "Who let him cook?", "He thought he cooked", "Bro thought he ate",
  "You ate that", "Sending me", "I'm weak", "I'm crying", "Be so for real", "Bffr", "Ain't no way", "Wild", "Crazy work",
  "Nasty work", "Diabolical", "Menace", "Unhinged", "Feral", "Goblin mode", "Cursed",
  // Arguments
  "Who asked?", "Nobody asked", "Didn't ask", "Cry about it", "Stay mad", "Cope", "Seethe", "Cope and seethe", "Mad?",
  "You mad?", "Sounds like a you problem", "Not my problem", "Get a life", "Get a job", "Sit down", "Pipe down", "Shut up",
  "Yapper", "Professional yapper", "Bro wrote an essay", "I ain't reading all that", "Happy for you or sorry that happened",
  "Womp womp", "Skill diff", "Imagine losing", "Embarrassing", "Delete this", "Delete your account", "Log off", "Blocked",
  "Muted", "Who invited bro?", "You're not that guy", "You thought", "Source?", "Source: trust me bro", "Fake news",
  "Delusional", "Projecting", "Keep crying", "Hold this L", "Take the L", "Massive L", "Common L", "Rare W", "Common W",
  // Praise & reactions
  "Huge W", "Massive W", "Big brain", "Galaxy brain", "Genius", "Clean", "Smooth", "Cracked", "Nasty", "Beautiful",
  "Perfect", "Chef's kiss", "Immaculate", "Legendary", "Unreal", "Godlike", "Too good", "Deserved", "Well played",
  "Respect", "Fair enough", "Valid", "Real", "Facts", "Based take", "W take", "Hot take", "Underrated", "Overrated",
  "Slept on", "Hidden gem", "Instant classic", "Peak fiction", "Masterpiece", "Banger", "This goes hard", "Fire",
  // Discord & group chat
  "@everyone", "@here", "Ping me", "Stop pinging me", "Wrong channel", "Join VC", "VC?", "Hop in VC", "You're deafened",
  "Screen share", "Check DMs", "DM me", "Slide into DMs", "Left on read", "Ghosted", "Typing...", "Bro stopped typing",
  "Deleted message", "Edited", "Pinned", "Server dead", "Revive the server", "Server owner", "Admin abuse", "Mod abuse",
  "Kick him", "Invite link", "Add me", "Friend request",
  // AFK & social
  "BRB", "BBL", "AFK for a bit", "Gotta go", "I'm out", "See ya", "Cya", "Later", "Goodnight", "GN", "GM", "I'm back",
  "Welcome back", "Where were you?", "Sorry I'm late", "On my way", "Almost there", "I'm busy", "Can't talk", "Call me",
  "Text me", "My bad", "Sorry", "All good", "No worries",
];

describe("phrase dataset", () => {
  it("has exactly the reconciled phrase count", () => {
    assert.equal(phrases.length, 404);
    const counts = Object.fromEntries(categories.map(({ id }) => [id, phrases.filter((phrase) => phrase.category === id).length]));
    assert.deepEqual(counts, { gaming: 76, internet: 101, twitch: 87, arguments: 48, reactions: 37, discord: 28, afk: 27 });
  });

  it("includes every required expression", () => {
    assert.deepEqual(required.filter((text) => lookup(text).length === 0), []);
  });

  it("has unique, URL-safe ids", () => {
    const ids = phrases.map((phrase) => phrase.id);
    assert.deepEqual(duplicates(ids), []);
    for (const id of ids) assert.match(id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `bad id: ${id}`);
  });

  it("has unique slang, keeping only deliberate look-alikes such as Mods? and MODS!", () => {
    assert.deepEqual(duplicates(phrases.map((phrase) => phrase.slang.toLowerCase())), []);
    assert.deepEqual(duplicates(phrases.map((phrase) => normalize(phrase.slang))), ["mods"]);
    assert.equal(getPhrase("mods-question")?.slang, "Mods?");
    assert.equal(getPhrase("mods-alert")?.slang, "MODS!");
  });

  it("keeps intentionally distinct phrases separate", () => {
    const pairs = [
      ["Chat, is this real?", "CHAT?!"], ["W", "L"], ["GG", "GG WP"], ["W streamer", "L streamer"], ["W chat", "L chat"],
      ["Spam W", "Spam L"], ["Cinema", "Absolute cinema"], ["Let him cook", "He cooked"],
      ["Never let him cook again", "Who let him cook?"], ["He thought he cooked", "Let them cook"],
      ["We are so back", "It's so over"],
    ];
    for (const [a, b] of pairs) {
      const first = phrases.find((phrase) => phrase.slang === a);
      const second = phrases.find((phrase) => phrase.slang === b);
      assert.ok(first && second && first.id !== second.id, `${a} / ${b} should be separate phrases`);
    }
  });

  it("represents PogChamp as an alias of Pog", () => {
    const pog = getPhrase("pog");
    assert.equal(pog?.slang, "Pog");
    assert.deepEqual(pog?.aliases, ["PogChamp"]);
    assert.equal(pog?.translation, "What a most glorious spectacle!");
  });

  it("has no duplicate translations", () => {
    assert.deepEqual(duplicates(phrases.map((phrase) => normalize(phrase.translation))), []);
  });

  it("has no blank, padded, double-spaced or curly-quoted text", () => {
    for (const { id, slang, translation, aliases = [], replyTo = [] } of phrases) {
      for (const text of [slang, translation, ...aliases, ...replyTo]) {
        assert.ok(text.length > 0 && text === text.trim() && !text.includes("  "), `untidy text in ${id}: "${text}"`);
        assert.doesNotMatch(text, /[‘’“”]/, `curly quote in ${id}: "${text}"`);
      }
    }
  });

  it("uses only known categories, and puts every category to use", () => {
    const known = new Set<string>(categories.map(({ id }) => id));
    for (const phrase of phrases) assert.ok(known.has(phrase.category), `bad category in ${phrase.id}`);
    for (const { id } of categories) assert.ok(phrases.some((phrase) => phrase.category === id), `empty category: ${id}`);
  });

  it("has aliases that add something and never shadow another phrase", () => {
    const owners = new Map<string, string>();
    for (const phrase of phrases) owners.set(normalize(phrase.slang), phrase.id);
    for (const phrase of phrases) {
      for (const alias of phrase.aliases ?? []) {
        const key = normalize(alias);
        assert.ok(key.length > 0, `empty alias in ${phrase.id}`);
        assert.notEqual(key, normalize(phrase.slang), `alias repeats slang in ${phrase.id}`);
        const owner = owners.get(key);
        assert.ok(!owner || owner === phrase.id, `alias "${alias}" of ${phrase.id} collides with ${owner}`);
        owners.set(key, phrase.id);
      }
      assert.deepEqual(duplicates((phrase.aliases ?? []).map(normalize)), [], `repeated alias in ${phrase.id}`);
    }
  });

  it("tags every phrase with known concepts and valid intents", () => {
    const intents = new Set<string>(replyIntents.map(({ id }) => id));
    for (const phrase of phrases) {
      assert.ok(phrase.tags.length > 0, `untagged phrase: ${phrase.id}`);
      assert.deepEqual(duplicates([...phrase.tags]), [], `repeated tag in ${phrase.id}`);
      for (const tag of phrase.tags) assert.ok(Object.hasOwn(concepts, tag), `unknown tag ${tag} in ${phrase.id}`);
      for (const intent of phrase.intents ?? []) assert.ok(intents.has(intent), `unknown intent ${intent} in ${phrase.id}`);
    }
    for (const { id } of replyIntents) assert.ok(phrases.some((phrase) => phrase.intents?.includes(id)), `unused intent: ${id}`);
  });

  it("carries the approved editorial wording", () => {
    const approved: Record<string, string> = {
      lul: "I laugh, and entirely at thy expense.",
      "rush-b": "All to the second gate, at full gallop!",
      "source-trust-me-bro": "Thy evidence appears to consist solely of fraternal assurance.",
      "who-let-him-cook": "Which fool granted this man access to the kitchen?",
      "admin-abuse": "The ruler hath employed divine powers with questionable restraint.",
      "potato-pc": "This machine labours as though powered by turnips.",
      "one-more-game": "A declaration rarely honoured by merely one contest.",
      "this-goes-hard": "This carries the force of a cavalry charge.",
      "mid-diff": "The middle road was won by talent, and not ours.",
      "locked-in": "I have entered a trance of terrifying focus.",
      "ate-and-left-no-crumbs": "A flawless triumph; not a crumb of doubt remains.",
      "you-ate-that": "Thou hast devoured that task with impeccable manners.",
      "shes-her": "She is precisely who everyone feared she was.",
      perfect: "I have searched for a flaw and found none.",
      "rare-w": "A victory so rare the scribes must check their records.",
      feeding: "Thou art keeping the enemy remarkably well fed.",
      "cant-talk": "I am presently indisposed; speak to me anon.",
    };
    for (const [id, translation] of Object.entries(approved)) assert.equal(getPhrase(id)?.translation, translation, id);
  });

  it("keeps the audited metadata fixes", () => {
    assert.equal(lookup("bruh").length, 0);
    assert.ok(!getPhrase("bro")?.aliases?.length);
    assert.ok(!getPhrase("friend-request")?.aliases?.includes("fr request"));
    assert.ok(!getPhrase("mic-muted")?.aliases?.includes("your mic"));
    assert.deepEqual(getPhrase("op")?.tags, ["balance", "mad"]);
    assert.ok(!getPhrase("galaxy-brain")?.intents?.includes("praise"));
    assert.ok(!getPhrase("main-character")?.intents?.includes("praise"));
    for (const [concept, word] of [["skill", "good"], ["skill", "better"], ["leave", "going"], ["leave", "left"], ["discord", "call"], ["greet", "new"]] as const) {
      assert.ok(!(concepts[concept] as readonly string[]).includes(word), `${word} should not trigger ${concept}`);
    }
  });

  it("labels the afk category as AFK & Social", () => {
    assert.equal(categories.find(({ id }) => id === "afk")?.label, "AFK & Social");
  });

  it("looks phrases up by id without trusting arbitrary input", () => {
    assert.equal(getPhrase("skill-issue")?.slang, "Skill issue");
    assert.equal(isPhraseId("skill-issue"), true);
    assert.equal(isPhraseId("not-a-phrase"), false);
    assert.equal(isPhraseId("__proto__"), false);
    assert.equal(isPhraseId(42), false);
  });
});
