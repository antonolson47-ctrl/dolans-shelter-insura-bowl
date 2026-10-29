/** Teams, schedules, plays, and trophies for Dolan's Shelter Insura-Bowl. */

export const OFF_PLAYS = [
  { id: "dive", name: "DIVE", kind: "run", blurb: "Inside handoff" },
  { id: "sweep", name: "SWEEP", kind: "run", blurb: "Bounce outside" },
  { id: "screen", name: "SCREEN", kind: "pass", blurb: "RB flare" },
  { id: "slant", name: "SLANT", kind: "pass", blurb: "Quick hitter" },
  { id: "post", name: "POST", kind: "pass", blurb: "Middle shot" },
  { id: "bomb", name: "BOMB", kind: "pass", blurb: "Take the top off" },
];

export const DEF_PLAYS = [
  { id: "stuff", name: "STUFF", blurb: "Sell out on the run" },
  { id: "zone", name: "ZONE", blurb: "Drop and rally" },
  { id: "man", name: "MAN", blurb: "Lock the receivers" },
  { id: "blitz", name: "BLITZ", blurb: "Bring the house" },
];

function T(partial) {
  return {
    pants: partial.pants || partial.secondary,
    ink: partial.ink || "#fff",
    helmet: partial.helmet || partial.primary,
    jersey: partial.jersey || "other",
    ...partial,
  };
}

/** Jersey body color. Cardinal, crimson, and burgundy are red. Royal blue and navy are blue. */
export function jerseyFamily(teamOrId) {
  const team = typeof teamOrId === "string" ? TEAMS[teamOrId] : teamOrId;
  const family = team && team.jersey;
  return family === "red" || family === "blue" ? family : "other";
}

export function sameJerseyFamily(a, b) {
  const left = jerseyFamily(a);
  const right = jerseyFamily(b);
  return left !== "other" && left === right;
}

/** First opponent whose jersey is not in the home team's color family. */
export function safeOpponent(homeId, usedIds = []) {
  const used = new Set(usedIds);
  const pick = Object.values(TEAMS).find((team) => (
    team.id !== homeId && !used.has(team.id) && !sameJerseyFamily(homeId, team.id)
  ));
  return pick ? pick.id : null;
}

export const TEAMS = {
  cyclodes: T({
    id: "cyclodes",
    name: "Iowa State Cyclodes",
    short: "CYCLODES",
    city: "IOWA STATE",
    abbr: "CYC",
    primary: "#c8102e",
    secondary: "#f1be48",
    pants: "#f1be48",
    helmet: "#c8102e",
    accent: "#f1be48",
    jersey: "red",
    rating: 84,
    helmetNo: 7,
    playable: true,
    mascot: "tornado",
    roster: [
      { role: "QB", num: 7, name: "Bo Vortex" },
      { role: "RB", num: 28, name: "Dusty Gale" },
      { role: "WR", num: 1, name: "Gale Warning" },
      { role: "WR", num: 81, name: "Storm Cell" },
      { role: "TE", num: 88, name: "Umbrella" },
    ],
  }),
  giants: T({
    id: "giants",
    name: "New York Gi-ants",
    short: "GI-ANTS",
    city: "NEW YORK",
    abbr: "GIA",
    primary: "#0c3d9e",
    secondary: "#f4f7fb",
    pants: "#d5dbe6",
    helmet: "#0c3d9e",
    accent: "#d3122a",
    jersey: "blue",
    rating: 86,
    helmetNo: 11,
    playable: true,
    mascot: "ant",
    roster: [
      { role: "QB", num: 11, name: "Ant Newman" },
      { role: "RB", num: 26, name: "Colony Hill" },
      { role: "WR", num: 13, name: "Sid Pincer" },
      { role: "WR", num: 88, name: "Six Legs" },
      { role: "TE", num: 84, name: "Mandible" },
    ],
  }),
  gilbert: T({
    id: "gilbert",
    name: "Gilbert Tigers",
    short: "TIGERS",
    city: "GILBERT",
    abbr: "GIL",
    primary: "#9e1b32",
    secondary: "#d5d8dc",
    pants: "#161616",
    helmet: "#9e1b32",
    accent: "#d5d8dc",
    jersey: "red",
    rating: 83,
    helmetNo: 9,
    playable: true,
    mascot: "tiger",
    roster: [
      { role: "QB", num: 9, name: "Gil Stripe" },
      { role: "RB", num: 22, name: "Claw Marks" },
      { role: "WR", num: 5, name: "Big G" },
      { role: "WR", num: 17, name: "Ivory Fang" },
      { role: "TE", num: 80, name: "Silverback" },
    ],
  }),
  baylord: T({
    id: "baylord", name: "Baylord Bears", short: "BEARS", city: "BAYLORD", abbr: "BAY",
    primary: "#1f4d2a", secondary: "#e2b33a", rating: 74, helmetNo: 12, mascot: "bear",
  }),
  dustdevils: T({
    id: "dustdevils", name: "Kansas Dustdevils", short: "DUSTDEVILS", city: "KANSAS", abbr: "DUS",
    primary: "#0051a5", secondary: "#e31837", jersey: "blue", rating: 72, helmetNo: 4, mascot: "dust",
  }),
  toads: T({
    id: "toads", name: "Fort Worth Horned Toads", short: "HORNED TOADS", city: "FORT WORTH", abbr: "TOA",
    primary: "#4d1979", secondary: "#f2f2f2", rating: 76, helmetNo: 2, mascot: "toad",
  }),
  hillfolk: T({
    id: "hillfolk", name: "Hillfolk Mountaineers", short: "HILLFOLK", city: "HILL COUNTRY", abbr: "HIL",
    primary: "#002855", secondary: "#eaaa00", jersey: "blue", rating: 75, helmetNo: 18, mascot: "hill",
  }),
  steerhorns: T({
    id: "steerhorns", name: "Texas Steerhorns", short: "STEERHORNS", city: "TEXAS", abbr: "TEX",
    primary: "#bf5700", secondary: "#f5f1e8", rating: 85, helmetNo: 1, mascot: "steer",
  }),
  rangecats: T({
    id: "rangecats", name: "Manhattan Range Cats", short: "RANGE CATS", city: "MANHATTAN", abbr: "RNG",
    primary: "#512888", secondary: "#d1d1d1", rating: 77, helmetNo: 8, mascot: "cat",
  }),
  okiestate: T({
    id: "okiestate", name: "Okie State Cowpokes", short: "COWPOKES", city: "OKIE STATE", abbr: "OKS",
    primary: "#ff6600", secondary: "#1a1a1a", rating: 85, helmetNo: 21, mascot: "poke",
  }),
  steerboys: T({
    id: "steerboys", name: "Dallas Steerboys", short: "STEERBOYS", city: "DALLAS", abbr: "DAL",
    primary: "#f4f7fb", secondary: "#041e42", pants: "#c5ced8", rating: 84, helmetNo: 4, mascot: "star",
  }),
  beagles: T({
    id: "beagles", name: "Philly Beagles", short: "BEAGLES", city: "PHILLY", abbr: "PHI",
    primary: "#004c54", secondary: "#a5acaf", rating: 84, helmetNo: 6, mascot: "beagle",
  }),
  federals: T({
    id: "federals", name: "Capital Federals", short: "FEDERALS", city: "CAPITAL", abbr: "CAP",
    primary: "#5a1414", secondary: "#ffb612", jersey: "red", rating: 78, helmetNo: 14, mascot: "dome",
  }),
  desertbirds: T({
    id: "desertbirds", name: "Arizona Desert Birds", short: "DESERT BIRDS", city: "ARIZONA", abbr: "ARI",
    primary: "#97233f", secondary: "#ffb612", jersey: "red", rating: 73, helmetNo: 3, mascot: "bird",
  }),
  gusts: T({
    id: "gusts", name: "Chicago Gusts", short: "GUSTS", city: "CHICAGO", abbr: "CHI",
    primary: "#0b162a", secondary: "#c83803", jersey: "blue", rating: 79, helmetNo: 34, mascot: "wind",
  }),
  packhorses: T({
    id: "packhorses", name: "Green Bay Packhorses", short: "PACKHORSES", city: "GREEN BAY", abbr: "GBP",
    primary: "#203731", secondary: "#ffb612", rating: 82, helmetNo: 12, mascot: "horse",
  }),
  cornkings: T({
    id: "cornkings", name: "Des Moines Corn Kings", short: "CORN KINGS", city: "DES MOINES", abbr: "DMK",
    primary: "#c5a000", secondary: "#1b4d2e", rating: 78, helmetNo: 33, mascot: "corn",
  }),
};

function defaultRoster(team) {
  if (team.roster) return team.roster;
  const n = team.helmetNo || 7;
  return [
    { role: "QB", num: n, name: `${team.city.split(" ")[0]} QB` },
    { role: "RB", num: (n + 20) % 90 || 20, name: "Tailback" },
    { role: "WR", num: (n + 3) % 90 || 11, name: "Split End" },
    { role: "WR", num: (n + 40) % 90 || 18, name: "Flanker" },
    { role: "TE", num: 80 + (n % 9), name: "Tight End" },
  ];
}

for (const team of Object.values(TEAMS)) team.roster = defaultRoster(team);

export const PLAYABLE = ["cyclodes", "giants", "gilbert"];

const semi = (opp, label) => ({ opp, round: "semi", label, week: null });
const bowl = (opp) => ({ opp, round: "insura", label: "INSURA-BOWL", week: null, rivalry: "umbrella" });

export const SCHEDULES = {
  cyclodes: [
    { week: 1, opp: "baylord", label: "WEEK 1" },
    { week: 2, opp: "dustdevils", label: "WEEK 2" },
    { week: 3, opp: "toads", label: "WEEK 3" },
    { week: 4, opp: "hillfolk", label: "WEEK 4" },
    { week: 5, opp: "steerhorns", label: "WEEK 5" },
    { week: 6, opp: "rangecats", label: "WEEK 6" },
    { week: 7, opp: "okiestate", label: "CLAIM CLIPBOARD CUP", rivalry: "clipboard" },
    { week: 8, opp: "giants", label: "TORNADO–ANT BELL", rivalry: "bell" },
    semi("steerhorns", "CONFERENCE FINAL"),
    bowl("giants"),
  ],
  giants: [
    { week: 1, opp: "steerboys", label: "WEEK 1" },
    { week: 2, opp: "beagles", label: "DEDUCTIBLE DRUM", rivalry: "drum" },
    { week: 3, opp: "federals", label: "WEEK 3" },
    { week: 4, opp: "desertbirds", label: "WEEK 4" },
    { week: 5, opp: "cornkings", label: "WEEK 5" },
    { week: 6, opp: "packhorses", label: "WEEK 6" },
    { week: 7, opp: "gilbert", label: "WEEK 7" },
    { week: 8, opp: "cyclodes", label: "TORNADO–ANT BELL", rivalry: "bell" },
    semi("beagles", "DIVISION FINAL"),
    bowl("cyclodes"),
  ],
  gilbert: [
    { week: 1, opp: "cornkings", label: "G-CUP", rivalry: "gcup" },
    { week: 2, opp: "baylord", label: "WEEK 2" },
    { week: 3, opp: "dustdevils", label: "WEEK 3" },
    { week: 4, opp: "beagles", label: "WEEK 4" },
    { week: 5, opp: "packhorses", label: "WEEK 5" },
    { week: 6, opp: "steerhorns", label: "WEEK 6" },
    { week: 7, opp: "steerboys", label: "WEEK 7" },
    { week: 8, opp: "giants", label: "WEEK 8" },
    semi("okiestate", "PLAYOFF"),
    bowl("giants"),
  ],
};

const RIVALRY_PAIRS = {
  "cyclodes|okiestate": "clipboard",
  "beagles|giants": "drum",
  "cyclodes|giants": "bell",
  "cornkings|gilbert": "gcup",
};

export function rivalryBetween(a, b) {
  return RIVALRY_PAIRS[[a, b].sort().join("|")] || null;
}

export const TROPHIES = {
  umbrella: {
    id: "umbrella",
    name: "Insura-Bowl Umbrella",
    img: "art/insura-bowl-trophy.jpg",
    caption: "YOU LIFT THE INSURA-BOWL UMBRELLA",
    pat: "BOOM! That umbrella's paid in full!",
    kenny: "Claim closed, baby. You're the policy now.",
  },
  clipboard: {
    id: "clipboard",
    name: "Claim Clipboard Cup",
    img: "art/rivalry-trophies.jpg",
    caption: "YOU LIFT THE CLAIM CLIPBOARD CUP",
    pat: "BOOM! Stamp that claim DENIED — for them!",
    kenny: "Clipboard's heavy, dude. That's the cup.",
  },
  drum: {
    id: "drum",
    name: "Deductible Drum",
    img: "art/rivalry-trophies.jpg",
    caption: "YOU HOIST THE DEDUCTIBLE DRUM",
    pat: "BOOM! They just met their deductible. It's you.",
    kenny: "Bang the drum. Their coverage lapsed.",
  },
  bell: {
    id: "bell",
    name: "Tornado–Ant Bell",
    img: "art/rivalry-trophies.jpg",
    caption: "YOU RING THE TORNADO–ANT BELL",
    pat: "BOOM! That bell's a total loss for the other guy!",
    kenny: "Ding ding, dude. Adjuster just left the building.",
  },
  gcup: {
    id: "gcup",
    name: "G-Cup",
    img: "art/gilbert-tigers-logo.jpg",
    caption: "GILBERT LIFTS THE G-CUP",
    pat: "BOOM! Big G just took the hardware home!",
    kenny: "G-Cup secured. Nobody's filing a counterclaim.",
  },
};

/** Trophy for a win. Insura-Bowl outranks a regular rivalry. */
export function trophyFor(userId, oppId, game = {}) {
  if (game.round === "insura") return TROPHIES.umbrella;
  const rivalry = game.rivalry && game.rivalry !== "umbrella"
    ? game.rivalry
    : rivalryBetween(userId, oppId);
  if (rivalry && TROPHIES[rivalry]) return TROPHIES[rivalry];
  return null;
}

export function teamById(id) {
  return TEAMS[id];
}

export function exhibitionOpponents(userId) {
  return Object.values(TEAMS).filter((team) => team.id !== userId && !sameJerseyFamily(userId, team.id));
}
