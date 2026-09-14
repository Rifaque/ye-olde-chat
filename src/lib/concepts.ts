/**
 * The controlled situation vocabulary behind search and Find a Reply.
 *
 * Phrases are tagged with concept ids; each concept lists the everyday words
 * that point at it. A query or pasted message is matched word-by-word against
 * these lists (after light stemming), so "he missed every shot" reaches the
 * phrases tagged `miss` and `aim` without any phrase having to spell out every
 * way of saying it. Keep words lowercase and specific: generic words such as
 * "go" or "what" belong nowhere, because they would make everything match.
 */
export const concepts = {
  agree: ["agree", "agreed", "exactly", "correct", "right", "yes", "yeah", "yep", "same", "valid", "true"],
  aim: ["aim", "aiming", "shot", "shots", "shoot", "shooting", "headshot", "scope", "sniper", "snipe", "crosshair", "spray", "bullets"],
  amazing: ["amazing", "awesome", "incredible", "insane", "sick", "fire", "great", "epic", "goated", "perfect", "beautiful", "unreal", "legendary", "masterpiece", "best", "impressive", "wow", "good"],
  ask: ["asked", "ask", "asking", "care", "cares", "cared", "caring", "nobody", "whatever", "interested"],
  away: ["afk", "away", "brb", "minute", "minutes", "sec", "second", "wait", "busy", "break"],
  back: ["back", "return", "returned", "returning", "comeback"],
  bad: ["bad", "terrible", "awful", "horrible", "trash", "garbage", "worst", "suck", "sucks", "sucked", "useless", "noob", "noobs", "pathetic", "dogwater", "shit"],
  balance: ["op", "overpowered", "underpowered", "nerf", "nerfed", "buff", "buffed", "meta", "balance", "balanced", "patch", "unfair"],
  ban: ["ban", "bans", "banned", "banning", "permaban", "timeout", "kick", "kicked", "report", "reported", "block", "blocked", "remove", "removed"],
  boring: ["boring", "bored", "snooze", "slow", "dull", "sleepy", "yawn"],
  call: ["push", "rotate", "flank", "defend", "attack", "rush", "retreat", "regroup", "base", "objective"],
  chaos: ["chaos", "chaotic", "unhinged", "feral", "wild", "cursed", "weird", "strange", "menace", "diabolical", "crazy", "psycho"],
  chat: ["chat", "chatters", "viewers", "audience", "comments"],
  cheat: ["hack", "hacks", "hacking", "hacker", "cheat", "cheats", "cheating", "cheater", "aimbot", "wallhack", "scripting", "smurfing"],
  clip: ["clip", "clipped", "clips", "record", "recording", "moment", "replay"],
  cook: ["cook", "cooking", "cooked", "cooks", "kitchen", "chef"],
  cool: ["aura", "cool", "confident", "sigma", "rizz", "charm", "drip", "swagger", "iconic"],
  cope: ["cope", "coping", "excuse", "excuses", "denial", "delusional", "blame", "blaming"],
  cringe: ["cringe", "cringy", "awkward", "embarrassing", "embarrassed", "yikes", "shame", "ashamed"],
  dating: ["date", "dating", "crush", "flirt", "flirting", "relationship", "ex", "girlfriend", "boyfriend", "gf", "bf", "love", "attractive", "hot"],
  decline: ["washed", "flop", "flopped", "flopping", "declined", "irrelevant", "former", "used"],
  discord: ["discord", "server", "channel", "ping", "pinged", "pinging", "vc", "voice", "dm", "dms", "message", "messages"],
  doom: ["over", "doomed", "hopeless", "ruined", "joever", "finished", "done", "cooked"],
  dumb: ["dumb", "stupid", "idiot", "clueless", "oblivious", "brainless", "npc", "moron"],
  fail: ["fail", "failed", "failure", "mess", "messed", "mistake", "blunder", "choke", "choked", "threw", "throw", "ruin"],
  funny: ["funny", "hilarious", "laugh", "laughing", "lol", "lmao", "lmfao", "haha", "hahaha", "joke", "joking", "dying"],
  glitch: ["glitch", "glitched", "bug", "bugged", "buggy", "exploit", "broken", "broke", "crash", "crashed"],
  greet: ["hi", "hello", "hey", "welcome", "joined", "join", "arrived", "sup", "yo"],
  help: ["help", "heal", "healing", "revive", "res", "rez", "save", "support", "backup", "carry"],
  hope: ["hope", "hoping", "hopeful", "chance", "believe", "maybe", "possible"],
  hype: ["hype", "hyped", "excited", "excitement", "pog", "poggers", "lets", "celebrate"],
  ignored: ["ignored", "ignore", "ignoring", "ghosted", "ghosting", "reply", "replied", "respond", "responded", "answer", "typing", "seen"],
  kill: ["kill", "killed", "kills", "die", "died", "death", "dead", "deleted", "wipe", "wiped", "ace", "slain"],
  lag: ["lag", "lagging", "laggy", "ping", "latency", "packet", "rubberband", "rubberbanding", "connection", "wifi", "internet", "disconnect", "disconnected", "dc", "frozen", "froze", "freeze", "buffering", "stutter"],
  late: ["late", "coming", "omw", "arrive", "arriving", "soon", "eta"],
  leave: ["leave", "leaving", "bye", "goodbye", "gtg", "heading", "depart", "logging"],
  lie: ["lie", "lies", "lying", "liar", "cap", "fake", "false", "bs", "bullshit", "nonsense", "joking"],
  loss: ["lose", "lost", "loses", "losing", "loss", "defeat", "defeated", "beaten"],
  low: ["low", "hp", "health", "dying", "almost"],
  mad: ["mad", "angry", "anger", "rage", "raging", "furious", "salty", "tilted", "tilt", "annoyed", "pissed", "upset", "triggered", "malding"],
  miss: ["miss", "missed", "missing", "whiff", "whiffed"],
  mods: ["mod", "mods", "moderator", "moderators", "admin", "admins", "owner"],
  money: ["donate", "donation", "donations", "dono", "sub", "subs", "subscribe", "subscribed", "subscriber", "gifted", "gift", "prime", "bits", "money", "paid"],
  night: ["night", "goodnight", "sleep", "sleeping", "tired", "bed", "late", "3am", "midnight"],
  okay: ["okay", "ok", "fine", "alright", "worries", "forgive", "forgiven", "chill", "problem"],
  old: ["old", "ancient", "age", "older", "boomer", "unc", "elder", "grandpa"],
  online: ["online", "phone", "scrolling", "scroll", "reddit", "twitter", "tiktok", "screen", "outside", "grass", "basement", "internet", "viral", "posting"],
  opinion: ["take", "takes", "opinion", "rated", "underrated", "overrated", "think", "honestly", "controversial"],
  praise: ["nice", "props", "congrats", "congratulations", "respect", "deserved", "proud", "played", "thanks", "thank", "gg"],
  pc: ["pc", "computer", "fps", "frames", "potato", "toaster", "laptop", "hardware", "specs", "graphics", "quality", "pixelated", "blurry"],
  proof: ["proof", "prove", "source", "sources", "receipts", "evidence", "screenshot", "exposed", "caught", "busted", "said"],
  quiet: ["quiet", "silence", "silent", "shut", "shh", "hush", "mute", "muted"],
  ranked: ["rank", "ranked", "elo", "mmr", "boosted", "smurf", "stuck", "placement", "climb", "hardstuck", "bronze", "iron"],
  sad: ["sad", "cry", "crying", "tears", "depressed", "unlucky", "rip", "sorrow", "pain", "hurts", "heartbroken", "tragic"],
  scared: ["scared", "nervous", "worried", "afraid", "anxious", "uh", "oh", "creepy"],
  shock: ["wtf", "shocked", "shock", "unbelievable", "omg", "real", "seriously", "surprised", "believe"],
  skill: ["skill", "skilled", "talent", "practice", "improve", "git", "gud", "diff"],
  smart: ["smart", "genius", "brain", "brains", "clever", "idea", "plan", "strategy", "galaxy"],
  sorry: ["sorry", "apologize", "apology", "apologies", "fault", "oops", "accident", "accidentally", "mybad"],
  story: ["lore", "story", "plot", "arc", "backstory", "drama", "twist", "canon", "episode", "movie", "show"],
  stream: ["stream", "streams", "streamer", "streaming", "live", "broadcast", "twitch", "vod", "offline"],
  sweat: ["sweat", "sweaty", "sweating", "tryhard", "tryharding", "competitive", "focused", "focus"],
  talk: ["talk", "talking", "talks", "speak", "speaking", "yap", "yapping", "yapper", "rant", "ranting", "ramble", "rambling", "essay", "paragraph", "paragraphs", "novel", "lecture", "long", "text"],
  team: ["team", "teammate", "teammates", "squad", "duo", "randoms", "ally", "allies", "jungler", "healer", "tank", "support"],
  toxic: ["toxic", "flame", "flaming", "rude", "grief", "griefing", "troll", "trolling", "spam", "spamming", "harass", "annoying"],
  truth: ["truth", "honest", "serious", "fact", "facts", "literally", "actually", "real", "swear"],
  win: ["win", "won", "wins", "winning", "victory", "victorious", "triumph", "dub", "beat", "clutched"],
} as const satisfies Record<string, readonly string[]>;

export type ConceptId = keyof typeof concepts;

export const replyIntents = [
  { id: "react", label: "React" },
  { id: "roast", label: "Roast" },
  { id: "agree", label: "Agree" },
  { id: "dismiss", label: "Dismiss" },
  { id: "praise", label: "Praise" },
] as const;

export type ReplyIntent = (typeof replyIntents)[number]["id"];

/** Words in a search query that ask for a kind of phrase rather than a topic. */
export const intentWords: Record<ReplyIntent, readonly string[]> = {
  react: ["react", "reaction", "reacting"],
  roast: ["roast", "insult", "mock", "burn", "diss", "flame", "comeback"],
  agree: ["agree", "agreement", "support"],
  dismiss: ["dismiss", "ignore", "whatever", "brush"],
  praise: ["praise", "compliment", "hype", "congratulate", "celebrate"],
};
