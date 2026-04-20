'use strict';

// ============================================================
// CONFIG
// ============================================================
const CARD_IMG_BASE  = 'cards/';
const AO_IMG_BASE    = 'images/ancient ones/';
const EXP_IMG_BASE   = 'images/expansions/';
const SAVE_VERSION   = 6;
const DECK_LOW_THRESHOLD = 3;

let _doomEmberInterval    = null;
let _savedBossInfoHTML    = null;

// ── Audio ────────────────────────────────────────────────────
const SFX = {
  cardDraw:  new Audio('sounds/card_draw.mp3'),
  aoAwaken:  new Audio('sounds/AO_awaken.mp3'),
  aoVictory: new Audio('sounds/Crown_of_Rising_Tides.mp3'),
  woosh:       new Audio('sounds/woosh.mp3'),
  woodenThud:  new Audio('sounds/wooden_thud.mp3'),
  intro:       new Audio('sounds/intro.mp3'),
};
function playSound(key) {
  const sfx = SFX[key];
  if (!sfx) return;
  sfx.currentTime = 0;
  sfx.play().catch(() => {});
}

// Secondary deck configuration
const DECK_CONFIG = {
  assets:       { label: 'Assets',        dataName: 'Asset',        hasCost: true,
                  traits: ['Item','Weapon','Ally','Service','Tome','Teamwork','Magical','Trinket','Task','Relic'] },
  conditions:   { label: 'Conditions',    dataName: 'Condition',    hasCost: false,
                  traits: ['Deal','Common','Boon','Madness','Bane','Injury','Restriction','Illness','Exposure','Pursuit','Talent'] },
  artifacts:    { label: 'Artifacts',     dataName: 'Artifact',     hasCost: false,
                  traits: ['Item','Magical','Tome','Teamwork','Weapon','Elixir','Relic','Trinket'] },
  spells:       { label: 'Spells',        dataName: 'Spell',        hasCost: false,
                  traits: ['Ritual','Incantation','Teamwork','Glamour'] },
  uniqueAssets: { label: 'Unique Assets', dataName: 'Unique Asset', hasCost: false,
                  traits: ['Task','Item','Relic','Ally','Character','Tome','Magical','Weapon','Trinket','Tarot'] }
};
const DECK_KEYS = Object.keys(DECK_CONFIG);

// Difficulty modes for the setup screen
const DIFFICULTY_MODES = [
  { id: 'normal',       name: 'Normal',       desc: 'All difficulty tiers — standard experience' },
  { id: 'hard-removed', name: 'Hard Removed', desc: 'No hard cards — good for beginners' },
  { id: 'easy-removed', name: 'Easy Removed', desc: 'No easy cards — more challenging' },
  { id: 'easy-only',    name: 'Easy Only',    desc: 'Only easy cards' },
  { id: 'hard-only',    name: 'Hard Only',    desc: 'Only hard cards' },
  { id: 'escalating',   name: 'Escalating',   desc: 'Easy → Normal → Hard per stage' }
];

// Ancient One supplemental metadata (subtitle, image, difficulty tier, lore, cultist, gameplay, setup)
// difficulty numeric → text: 1-2 = Low, 3 = Medium, 4-5 = High
const AO_META = {
  'Azathoth': {
    subtitle: 'The Daemon Sultan', image: 'Azathoth.png', diff: 'Medium',
    lore: 'The Idiot God sits at the center of all things spreading madness and death. Its seeds descend from the stars, threatening to crack the world in half.',
    cultist: 'After resolving the combat test, lose 1 Health and defeat this Monster.',
    gameplay: [
      'When the Omen advances to the green space of the Omen track, advance Doom by 1 for each Eldritch token on that space.',
      'When 3 Mysteries have been solved, investigators win the game.',
      "When Azathoth awakens, flip this sheet and resolve the \"The World is Devoured!\" effect on the back."
    ],
    setup: 'Place 1 Eldritch token on the green space of the Omen track.'
  },
  'Cthulhu': {
    subtitle: 'The Madness From the Sea', image: 'cthulhu.png', diff: 'High',
    lore: "Eons ago, Cthulhu came from the stars with his Star Spawn brethren. He now sleeps in the sunken city of R'lyeh, waiting for the stars to be right to rise again.",
    cultist: 'Before resolving the combat test, lose 1 Sanity.',
    gameplay: [
      'When an investigator moves onto a space containing an Eldritch token, he becomes Delayed and loses 1 Sanity.',
      'Each investigator on a Sea space that does not contain an Eldritch token places an Eldritch token on his space.',
      'When 3 Mysteries have been solved, investigators win the game.',
      'When Cthulhu awakens, flip this sheet.'
    ],
    setup: 'Set aside 1 Deep One Monster, 1 Star Spawn Monster, and all Cthulhu Special Encounter cards.'
  },
  'Shub-Niggurath': {
    subtitle: 'The Black Goat of the Woods', image: 'Shub-Niggurath.png', diff: 'Medium',
    lore: "During pagan rites, Shub-Niggurath absorbs worthy cultists into her amorphous body and transforms them into gof'nn hupadgh Shub-Niggurath, the goat spawn. From the wildest corners of the earth, her primal brood, the dark young, emerge to overwhelm humanity.",
    cultist: 'Spawn 1 Goat Spawn Monster or 1 Dark Young Monster on this space. Then, if you spawned a Monster, discard this Cultist.',
    gameplay: [
      'Spawn 1 Monster on a random space. Then, if there are 10 or more Monsters on the game board, advance Doom by 2.',
      'When 3 Mysteries have been solved, investigators win the game.',
      "When Shub-Niggurath awakens, flip this sheet and resolve the \"Shub-Niggurath Awakens!\" effect on the back."
    ],
    setup: 'Set aside 2 Ghoul Monsters, 2 Goat Spawn Monsters, and 1 Dark Young Monster.'
  },
  'Yog-Sothoth': {
    subtitle: 'The Lurker at the Threshold', image: 'Yog-Sothoth.png', diff: 'Low',
    lore: 'For eons, sorcerers have called upon the power of Yog-Sothoth to bend reality to their will. This incomprehensible Ancient One exists parallel to all places and times, but is bound to the space between dimensions. Gates between worlds continue to open with more frequency and soon, Yog-Sothoth will be free.',
    cultist: 'If you defeat this Monster during a Combat Encounter, lose 1 Sanity and gain 1 Spell.',
    gameplay: [
      'Each investigator on a space containing a Gate advances Doom by 1 unless he discards 1 Spell.',
      'When 3 Mysteries have been solved, investigators win the game.',
      'When Yog-Sothoth awakens, flip this sheet.'
    ],
    setup: 'Set aside all Yog-Sothoth Special Encounter cards.'
  },
  'Yig': {
    subtitle: 'The Father of Serpents', image: 'Yig.png', diff: 'High',
    lore: "Many know that Yig's punishment for those who harm his progeny is a terrible curse, but few know that long ago, the serpent people betrayed Yig and suffered his wrath. Now the survivors return, eager to conquer for their true master.",
    cultist: "If you lose Health from the combat test, you've been bitten by the snake-like creature; gain a Poisoned Condition.",
    gameplay: [
      'Spawn 1 Cultist Monster on the Active Expedition space. Then, if there are 2 or more Monsters on that space, advance Doom by 1.',
      'When 3 Mysteries have been solved, investigators win the game.',
      "When Yig awakens, flip this sheet and resolve the \"Yig Awakens!\" effect on the back."
    ],
    setup: 'Set aside 6 Cultists, 1 Serpent People, and all Yig Special Encounter Cards.'
  },
  'Ithaqua': {
    subtitle: 'The Wind-Walker', image: 'Ithaqua.png', diff: 'Medium',
    lore: 'The weather has grown cold, and the aurora borealis glows bright in the northern skies, visible even during the day. A strange madness has begun affecting those around the arctic circle, and travelers returning from the north speak of visions of an ancient civilization.',
    cultist: 'If you lose Health from the combat test, the cold chills you to your core; gain a Hypothermia Condition.',
    gameplay: [
      'Each investigator gains a Hypothermia Condition unless he spends 1 Focus.',
      'When 3 Mysteries have been solved, investigators win the game.',
      "When Ithaqua awakens, flip this sheet and resolve the \"Ithaqua Awakens!\" effect on the back."
    ],
    setup: 'Set aside 1 Gnoph-keh Monster, 1 Wendigo Monster, and all Ithaqua Special Encounters.'
  },
  'Rise of the Elder Things': {
    subtitle: 'The Once-Dominant Species', image: 'Elder_Things.png', diff: 'Low',
    lore: 'Eons ago, the elder things were driven underground by the changing climate, hibernating in the cities they had built into the mountains or in the depths of the ocean. With the disturbance of the Miskatonic Expedition, they have begun to reclaim the world they once dominated.',
    cultist: "If you pass the combat test, you free the victim's mind from the alien magic; defeat this Monster and gain 1 random Ally Asset from the deck.",
    gameplay: [
      'After an investigator resolves an Other World Encounter, he may move to Plateau of Leng.',
      'When 4 Mysteries have been solved, investigators win the game.',
      "When Doom advances to zero, flip this sheet and resolve the \"A Dark God Awakens!\" effect on the back."
    ],
    setup: 'Set aside all Rise of the Elder Things Special Encounters. Set up the Antarctica side board.'
  },
  'Syzygy': {
    subtitle: 'The Cosmic Alignment', image: 'Syzygy.png', diff: 'High',
    lore: 'When the planets align with the center of the universe and the Earth falls under the shadow of an eclipse, that which would devour all life seeks to pierce the veil that keeps the darkness at bay.',
    cultist: 'Horror and Toughness are each equal to the number of Eldritch tokens on the red space of the Omen track, plus 1.',
    gameplay: [
      'When the Omen advances to the red space of the Omen track, place 1 Eldritch token on that space.',
      'At the end of the Mythos Phase, if 2 Mysteries have been solved or there are 3 Eldritch tokens on the red space of the Omen track, flip this sheet and resolve "The Portal Opens!" effect.',
      'If Doom advances to zero, investigators lose the game.'
    ],
    setup: 'Set aside all Syzygy Special Encounters. Set up the Mystic Ruins Encounter deck.'
  },
  'Nephren-Ka': {
    subtitle: 'The Dark Pharaoh', image: 'Nephren-Ka.png', diff: 'Medium',
    lore: 'Evil stirs beneath the sands of Egypt as the Brotherhood of the Beast, a cult with mysterious loyalties, searches for the final resting place of the Dark Pharaoh Nephren-Ka, seeking to fulfill the prophecy of his resurrection.',
    cultist: 'An investigator on this space or an adjacent space loses 1 Health or 1 Sanity.',
    gameplay: [
      'Each investigator may move 1 space toward The Bent Pyramid. Then each investigator that did not move loses 1 Sanity.',
      'When 3 Mysteries have been solved, investigators win the game.',
      "When Nephren-Ka awakens, flip this sheet and resolve the \"Nephren-Ka Awakens!\" effect on the back."
    ],
    setup: 'Set aside all Nephren-Ka Special Encounters. Set up the Egypt side board.'
  },
  'Abhoth': {
    subtitle: 'The Source of Uncleanliness', image: 'Abhoth.png', diff: 'Low',
    lore: "Abhoth lies deep within the heart of Mount Voormithadreth. There, from the cesspit of Y'quaa, it sends forth its revolting children, extending its reach across the Earth.",
    cultist: 'If you fail the combat test, gain a Madness Condition.',
    gameplay: [
      'The Lead Investigator spawns 1 Cultist Monster on a Wilderness space that does not contain a Cultist Monster. Then, if there are 6 or more Cultist Monsters on the game board, advance Doom by 1.',
      'When 3 Mysteries have been solved, investigators win the game.',
      "When Abhoth awakens, flip this sheet and resolve the \"Abhoth Awakens!\" effect on the back."
    ],
    setup: 'Set aside 8 Cultist Monsters and all Abhoth Special Encounters.'
  },
  'Hastur': {
    subtitle: 'The Unspeakable One', image: 'Hastur.png', diff: 'High',
    lore: 'Far from Earth beneath the star of Aldebaran, the Unspeakable One sleeps imprisoned within the core of one of the dark stars of the Hyades. Trapped there in a war long forgotten, he dreams of escaping to exact his terrible will upon the cosmos.',
    cultist: 'The cultist summons a Byakhee. A Byakhee Monster ambushes an investigator on this space or an adjacent space.',
    gameplay: [
      'Investigators as a group lose Sanity equal to the number of Gates on the game board unless the Lead Investigator gains a Blight Condition.',
      'When 2 Mysteries have been solved, investigators win the game.',
      "When Hastur awakens, flip this sheet and resolve the \"Hastur Awakens!\" effect on the back."
    ],
    setup: 'Set aside 1 Byakhee Monster and all Hastur Special Encounters.'
  },
  'Hypnos': {
    subtitle: 'The Lord of Sleep', image: 'Hypnos.png', diff: 'Low',
    lore: 'Hypnos, Lord of Sleep, whispers softly to wayward dreamers, drawing them into his realm of madness.',
    cultist: 'If you pass the horror test, you free the dreamer from eternal slumber; defeat this Monster. If you pass the combat test, gain 1 Madness Condition.',
    gameplay: [
      'When an investigator performs a Rest action, he cannot recover both Health and Sanity.',
      'Each investigator moves 1 space toward the nearest space on the Dreamlands side board unless he spends 1 Sanity.',
      'When 3 Mysteries have been solved, investigators win the game.',
      "When Hypnos awakens, flip this sheet and resolve the \"Hypnos Awakens!\" effect on the back."
    ],
    setup: 'Set aside all Hypnos Special Encounters. Set up the Dreamlands side board.'
  },
  'Atlach-Nacha': {
    subtitle: 'The Dreamweaver', image: 'Atlach-Nacha.png', diff: 'Medium',
    lore: 'Ever-weaving, ever watching, should Atlach-Nacha ever complete her empyrean masterpiece, it would merge the firmaments of the Dreamlands and reality into a single cosmic ingress, opening the way for the horrors of the Underworld to wage war upon the cities of humanity.',
    cultist: 'Whenever this Monster is spawned, move it to the nearest space that does not contain a Gate or a Monster.',
    gameplay: [
      'Spawn 1 Gate unless investigators as a group discard a total number of Clues and/or Spells equal to half the number of investigators.',
      'When 3 Mysteries have been solved, investigators win the game.',
      "When Atlach-Nacha awakens, flip this sheet and resolve the \"Atlach-Nacha Awakens!\" effect on the back."
    ],
    setup: 'Set aside the Leng Spider Monster. The Lead Investigator gains 1 Spell.'
  },
  "Shudde M'ell": {
    subtitle: 'The Cataclysm from Below', image: "Shudde_Mell.png", diff: 'High',
    lore: "Shudde M'ell slumbers deep beneath the lost African city of G'harne. The ripples of his tumultuous dreams bring ruin to the world above.",
    cultist: 'Roll 1 die. On a 1 or 2, advance Doom by 1.',
    gameplay: [
      'When Doom advances to a space containing an Eldritch token, draw and resolve a Disaster. Then discard that Eldritch token.',
      'Each Investigator loses a total of 2 Health and/or Sanity.',
      'When 3 Mysteries have been solved, investigators win the game.',
      "When Shudde M'ell awakens, flip this sheet and resolve the \"Shudde M'ell Awakens!\" effect on the back."
    ],
    setup: "Set aside all Shudde M'ell Special Encounters. Place 1 Eldritch token on spaces 2, 5, 8, and 11 on the Doom track. Rome is devastated!"
  },
  'Antediluvium': {
    subtitle: 'The Order of Rising Stars', image: 'Antediluvium.png', diff: 'Medium',
    lore: 'Each night, the stars move closer to their ultimate alignment.',
    cultist: 'Place 1 Sanity on the Ancient One sheet.',
    gameplay: [
      'When a Gate spawns that corresponds to the blue Omen, spawn 1 Cultist Monster on that Gate.',
      'When the Omen advances to the blue space of the Omen track, investigators as a group lose Sanity equal to the amount of Sanity on this sheet. Then discard one Sanity from this sheet.',
      'When 3 Mysteries have been solved, investigators win the game.',
      'When Doom advances to zero, flip this sheet and resolve the "The Stars Align!" effect on the back.'
    ],
    setup: 'Set aside 5 Cultist Monsters and 1 Deep One Monster. Set up the Mystic Ruins Encounter deck. Place 1 Eldritch token on each blue space of the Omen track and Sanity tokens on this sheet as indicated.'
  },
  'Nyarlathotep': {
    subtitle: 'The Crawling Chaos', image: 'Nyarlathotep.png', diff: 'Medium',
    lore: 'He has many names and wears many faces. He alone of the Outer Gods walks the Earth, the puppetmaster pulling the strings of a thousand cults, wearing the masks of a thousand gods.',
    cultist: 'If you fail the combat test, gain a Corruption Condition; if you already have a Corruption Condition, gain 1 Eldritch token instead.',
    gameplay: [
      'When you have Eldritch tokens equal to or greater than your maximum Sanity, you are devoured.',
      'Investigators as a group gain Eldritch tokens equal to half the number of investigators.',
      'When 2 Mysteries have been solved, investigators win the game.',
      "When Nyarlathotep awakens, flip this sheet and resolve the \"Nyarlathotep Awakens!\" effect on the back."
    ],
    setup: 'Set aside all Nyarlathotep Special Encounters.'
  }
};

function aoMeta(ao) {
  return AO_META[ao.name] ?? { subtitle: '', image: null, diff: 'Medium' };
}

// ============================================================
// STATE
// ============================================================
const state = {
  phase: 'setup',

  // Setup choices
  enabledExpansions: new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]),
  ancientOneIndex:   null,
  difficulty:        'normal',
  preludeIndex:      null,
  startingRumor:     false,

  // Doom & mysteries tracking
  doom:      0,
  mysteries: 0,
  awakened:  false,

  // Token counts per in-play card: { [cardId]: { eldritch: N, clue: N } }
  mythosTokens: {},

  // Mythos deck
  mythosDeck:      [],
  mythosIndex:     0,
  mythosInPlay:    [],
  mythosDiscarded: [],

  stageInfo: [
    { g:0, y:0, b:0, total:0 },
    { g:0, y:0, b:0, total:0 },
    { g:0, y:0, b:0, total:0 }
  ],
  stageBoundaries: [0, 0, 0],

  // Timer
  timerStart:    null,
  timerElapsed:  0,
  timerInterval: null,

  // Round counter
  round: 0,

  // Secondary decks
  decks: {
    assets:       { pool: [], drawn: [], filter: { traits: [], logic: 'OR',  maxCost: null } },
    conditions:   { pool: [], drawn: [], filter: { traits: [], logic: 'OR' } },
    artifacts:    { pool: [], drawn: [], filter: { traits: [], logic: 'OR' } },
    spells:       { pool: [], drawn: [], filter: { traits: [], logic: 'OR' } },
    uniqueAssets: { pool: [], drawn: [], filter: { traits: [], logic: 'OR'  } }
  }
};

// ── Setup tab + Investigator UI state ──────────────────────
// Kept separate from `state` as these are transient UI-only values, not persisted.
let aoGridDiffFilter  = 'all';
let invTraitFilter    = 'all';
let selectedInvIndex  = null;

// ============================================================
// UTILITIES
// ============================================================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


function expIcon(expId) {
  const exp = EXPANSIONS[expId];
  if (!exp) return '';
  return `<img class="exp-icon-sm" src="${EXP_IMG_BASE}${exp.icon}" alt="${exp.name}" title="${exp.name}">`;
}

function expName(expId) { return EXPANSIONS[expId]?.name ?? '—'; }

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function el(id) { return document.getElementById(id); }

// ============================================================
// DECK BUILDING — MYTHOS
// ============================================================
function getFilteredMythosPool() {
  const enabled = state.enabledExpansions;
  return MYTHOS_CARDS.filter(c => enabled.has(c.expId));
}

function applyDifficultyFilter(pool, mode) {
  if (mode === 'hard-removed') return pool.filter(c => c.difficulty !== 'H');
  if (mode === 'easy-removed') return pool.filter(c => c.difficulty !== 'E');
  if (mode === 'easy-only')    return pool.filter(c => c.difficulty === 'E');
  if (mode === 'hard-only')    return pool.filter(c => c.difficulty === 'H');
  return pool;
}

function buildRandDeck(pool, counts) {
  const green  = shuffle(pool.filter(c => c.color === 'gren').map(c => c.id));
  const yellow = shuffle(pool.filter(c => c.color === 'yelw').map(c => c.id));
  const blue   = shuffle(pool.filter(c => c.color === 'blue').map(c => c.id));

  const stages = [];
  for (let s = 0; s < 3; s++) {
    const stage = [];
    for (let i = 0; i < counts[s * 3];     i++) stage.push(green.pop()  ?? null);
    for (let i = 0; i < counts[s * 3 + 1]; i++) stage.push(yellow.pop() ?? null);
    for (let i = 0; i < counts[s * 3 + 2]; i++) stage.push(blue.pop()   ?? null);
    stages.push(shuffle(stage.filter(Boolean)));
  }
  return stages;
}

function buildStagedDeck(pool, counts) {
  const byDiff = {
    E: pool.filter(c => c.difficulty === 'E'),
    N: pool.filter(c => c.difficulty === 'N'),
    H: pool.filter(c => c.difficulty === 'H')
  };

  function colorsOf(cards) {
    return {
      g: shuffle(cards.filter(c => c.color === 'gren').map(c => c.id)),
      y: shuffle(cards.filter(c => c.color === 'yelw').map(c => c.id)),
      b: shuffle(cards.filter(c => c.color === 'blue').map(c => c.id))
    };
  }
  function take(arr, n) {
    const out = [];
    for (let i = 0; i < n; i++) { const v = arr.pop(); if (v) out.push(v); }
    return out;
  }

  const easy   = colorsOf(byDiff.E);
  const normal = colorsOf(byDiff.N);
  const hard   = colorsOf(byDiff.H);

  const stages = [];
  const stageColors = [easy, normal, hard];
  for (let s = 0; s < 3; s++) {
    const c = stageColors[s];
    const stage = [
      ...take(c.g, counts[s * 3]),
      ...take(c.y, counts[s * 3 + 1]),
      ...take(c.b, counts[s * 3 + 2])
    ];
    stages.push(shuffle(stage));
  }
  return stages;
}

function buildMythosDeck() {
  const ao     = ANCIENT_ONES[state.ancientOneIndex];
  const counts = ao.counts;
  const mode   = state.difficulty;

  let pool = getFilteredMythosPool();
  if (mode !== 'escalating') pool = applyDifficultyFilter(pool, mode);

  const stages = (mode === 'escalating') ? buildStagedDeck(pool, counts) : buildRandDeck(pool, counts);

  let starterRumor = null;
  if (state.startingRumor) {
    const usedIds     = new Set(stages.flat());
    const availBlue   = pool.filter(c => c.color === 'blue' && !usedIds.has(c.id));
    if (availBlue.length) starterRumor = shuffle(availBlue)[0].id;
  }

  const flat = [...stages[0], ...stages[1], ...stages[2]];
  if (starterRumor) flat.unshift(starterRumor);

  const s1Start = starterRumor ? 1 : 0;
  const s2Start = s1Start + stages[0].length;
  const s3Start = s2Start + stages[1].length;

  state.mythosDeck      = flat;
  state.mythosIndex     = 0;
  state.stageBoundaries = [s1Start, s2Start, s3Start];

  function countColors(cards) {
    let g = 0, y = 0, b = 0;
    for (const id of cards) {
      const card = MYTHOS_CARDS.find(c => c.id === id);
      if (!card) continue;
      if (card.color === 'gren') g++;
      else if (card.color === 'yelw') y++;
      else b++;
    }
    return { g, y, b, total: g + y + b };
  }

  state.stageInfo = [
    countColors(stages[0]),
    countColors(stages[1]),
    countColors(stages[2])
  ];
}

// ============================================================
// DECK BUILDING — SECONDARY
// ============================================================
function buildSecondaryDecks() {
  const enabled = state.enabledExpansions;

  function extractCards(dataName, deckKey) {
    const entry = deckData.find(d => d.name === dataName);
    if (!entry) return [];
    const cards = [];
    for (const block of entry.cardsByExpansions) {
      if (!enabled.has(block.expansionID)) continue;
      for (const card of block.cards) {
        cards.push({
          uid:       `${deckKey}-${card.id}`,
          name:      card.name,
          traits:    card.traits || [],
          cost:      card.cost ?? null,
          expansion: block.expansionID
        });
      }
    }
    return shuffle(cards);
  }

  for (const [key, cfg] of Object.entries(DECK_CONFIG)) {
    state.decks[key].pool  = extractCards(cfg.dataName, key);
    state.decks[key].drawn = [];
    state.decks[key].filter.traits  = [...cfg.traits];
    state.decks[key].filter.logic   = 'OR';
    if (key === 'assets') state.decks[key].filter.maxCost = null;
  }
}

// ============================================================
// STAGE TRACKING HELPERS
// ============================================================
function getCurrentStage() {
  const i = state.mythosIndex;
  const [, s2, s3] = state.stageBoundaries;
  if (i < s2) return 0;
  if (i < s3) return 1;
  return 2;
}

function decrementStageCount(cardId) {
  if (state.mythosIndex < state.stageBoundaries[0]) return;
  const card = MYTHOS_CARDS.find(c => c.id === cardId);
  if (!card) return;
  const si   = getCurrentStage();
  const info = state.stageInfo[si];
  if (!info) return;
  if (card.color === 'gren') info.g = Math.max(0, info.g - 1);
  else if (card.color === 'yelw') info.y = Math.max(0, info.y - 1);
  else info.b = Math.max(0, info.b - 1);
  info.total = Math.max(0, info.total - 1);
}

// ============================================================
// GAME ACTIONS
// ============================================================
function drawMythosCard() {
  if (state.mythosIndex >= state.mythosDeck.length) return;

  const cardId = state.mythosDeck[state.mythosIndex];
  const card   = MYTHOS_CARDS.find(c => c.id === cardId);
  if (!card) {
    console.error('Card not found:', cardId);
    alert(`Error: could not find card "${cardId}".`);
    return;
  }

  decrementStageCount(cardId);
  state.mythosIndex++;
  state.round++;

  renderStageTracker();
  renderDeckLowWarning();
  renderRound();
  showCardFlip(card);
  saveState();
}

function dismissCard(cardId) {
  state.mythosDiscarded.push(cardId);
  playSound('woosh');
  hideCardDisplay();
  renderDiscardPile();
  saveState();
}

function sendToPlay(cardId) {
  state.mythosInPlay.push(cardId);
  const card = MYTHOS_CARDS.find(c => c.id === cardId);
  state.mythosTokens[cardId] = { eldritch: card?.eldritch ?? 0, clue: 0 };
  playSound('woosh');
  hideCardDisplay();
  renderInPlay();
  saveState();
}

function adjustToken(cardId, type, delta) {
  if (!state.mythosTokens[cardId]) state.mythosTokens[cardId] = { eldritch: 0, clue: 0 };
  state.mythosTokens[cardId][type] = Math.max(0, (state.mythosTokens[cardId][type] ?? 0) + delta);
  renderInPlay();
  saveState();
}

function discardFromPlay(cardId) {
  state.mythosInPlay    = state.mythosInPlay.filter(id => id !== cardId);
  state.mythosDiscarded.push(cardId);
  playSound('woosh');
  renderInPlay();
  renderDiscardPile();
  saveState();
}

function acknowledgePreludeBanner() {
  el('prelude-mythos-banner').classList.add('hidden');
  saveState();
}

// ============================================================
// SECONDARY DECK ACTIONS
// ============================================================
function getFilteredPool(deckKey) {
  const { pool, filter } = state.decks[deckKey];
  const { traits, logic, maxCost } = filter;

  return pool.filter(card => {
    if (traits.length > 0) {
      if (logic === 'AND') {
        if (!traits.every(t => card.traits.includes(t))) return false;
      } else {
        if (!traits.some(t => card.traits.includes(t))) return false;
      }
    }
    if (maxCost != null) {
      if (card.cost == null) return false;
      if (maxCost === 5) { if (card.cost < 5) return false; }
      else               { if (card.cost > maxCost) return false; }
    }
    return true;
  });
}

function drawOneCard(deckKey) {
  const eligible = getFilteredPool(deckKey);
  if (!eligible.length) {
    alert(`No ${DECK_CONFIG[deckKey].label} cards match the current filter.`);
    return;
  }
  const card = eligible[Math.floor(Math.random() * eligible.length)];
  removeFromPool(deckKey, card.uid);
  state.decks[deckKey].drawn.unshift(card);
  playSound('cardDraw');
  renderLastDrawn(deckKey, card);
  renderDeckCount(deckKey);
  renderDrawHistory(deckKey);
  saveState();
}

function drawKeepOne(deckKey, count = 2) {
  const eligible = getFilteredPool(deckKey);
  if (eligible.length < count) {
    alert(`Not enough ${DECK_CONFIG[deckKey].label} cards. Only ${eligible.length} available.`);
    return;
  }
  renderDrawKeepModal(deckKey, shuffle(eligible).slice(0, count));
}

function keepCard(deckKey, keptCard) {
  removeFromPool(deckKey, keptCard.uid);
  state.decks[deckKey].drawn.unshift(keptCard);
  hideDrawKeepModal(deckKey);
  playSound('cardDraw');
  renderLastDrawn(deckKey, keptCard);
  renderDeckCount(deckKey);
  renderDrawHistory(deckKey);
  saveState();
}

function takeNamedCard(deckKey, uid) {
  const card = state.decks[deckKey].pool.find(c => c.uid === uid);
  if (!card) return;
  removeFromPool(deckKey, uid);
  state.decks[deckKey].drawn.unshift(card);
  playSound('cardDraw');
  renderLastDrawn(deckKey, card);
  renderDeckCount(deckKey);
  renderDrawHistory(deckKey);
  hideFindResults(deckKey);
  el(`${deckKey}-find-results`).classList.add('hidden');
  saveState();
}

function removeFromPool(deckKey, uid) {
  state.decks[deckKey].pool = state.decks[deckKey].pool.filter(c => c.uid !== uid);
}

// ============================================================
// DECK CARD IMAGE LIGHTBOX
// ============================================================
const DECK_IMG_FOLDERS = {
  assets:       'images/assets/',
  conditions:   'images/conditions/',
  artifacts:    'images/artifacts/',
  spells:       'images/spells/',
  uniqueAssets: 'images/unique_assets/',
};

function deckCardImgSrc(deckKey, cardName) {
  const folder = DECK_IMG_FOLDERS[deckKey];
  if (!folder) return null;
  return folder + cardName.replace(/ /g, '_') + '.png';
}

let _deckLightboxEscHandler = null;

function openDeckCardLightbox(src) {
  const lb  = el('deck-card-lightbox');
  const img = el('deck-lb-img');
  img.src = src;
  lb.classList.remove('hidden', 'closing');
  document.body.style.overflow = 'hidden';

  // Always clean up any previously registered handler before adding a new one
  if (_deckLightboxEscHandler) {
    document.removeEventListener('keydown', _deckLightboxEscHandler);
  }
  _deckLightboxEscHandler = (e) => {
    if (e.key === 'Escape') closeDeckCardLightbox();
  };
  document.addEventListener('keydown', _deckLightboxEscHandler);
}

function closeDeckCardLightbox() {
  const lb = el('deck-card-lightbox');
  if (lb.classList.contains('hidden')) return;
  if (_deckLightboxEscHandler) {
    document.removeEventListener('keydown', _deckLightboxEscHandler);
    _deckLightboxEscHandler = null;
  }
  lb.classList.add('closing');
  document.body.style.overflow = '';
  setTimeout(() => {
    lb.classList.add('hidden');
    lb.classList.remove('closing');
    el('deck-lb-img').src = '';
  }, 200);
}

// ============================================================
// LIGHTBOX
// ============================================================
function openLightbox(src) {
  el('lightbox-img').src = src;
  el('card-lightbox').classList.remove('hidden');
}

function closeLightbox() {
  el('card-lightbox').classList.add('hidden');
  el('lightbox-img').src = '';
}

// ============================================================
// TIMER
// ============================================================
function startTimer() {
  clearInterval(state.timerInterval);
  state.timerStart    = Date.now();
  state.timerInterval = setInterval(renderTimer, 1000);
}

function pauseTimer() {
  if (state.timerStart) {
    state.timerElapsed += Date.now() - state.timerStart;
    state.timerStart = null;
  }
  clearInterval(state.timerInterval);
}

// ============================================================
// RENDERING — SETUP SCREEN
// ============================================================

function renderExpansionGrid() {
  const grid = el('expansion-grid');
  grid.innerHTML = EXPANSIONS.map(exp => `
    <div class="expansion-pill ${state.enabledExpansions.has(exp.id) ? 'active' : ''}"
         data-exp-id="${exp.id}"
         onclick="toggleExpansion(${exp.id})">${exp.name}</div>
  `).join('');
}

function toggleExpansion(id) {
  if (id === 0) return; // base game always on
  if (state.enabledExpansions.has(id)) state.enabledExpansions.delete(id);
  else state.enabledExpansions.add(id);
  renderExpansionGrid();
  renderPreludeDropdown();
  renderAoGrid();
  applyInvFilters();
  updateBuildButton();
}

function setAllExpansions(on) {
  if (on) { EXPANSIONS.forEach(e => state.enabledExpansions.add(e.id)); }
  else    { state.enabledExpansions.clear(); state.enabledExpansions.add(0); }
  renderExpansionGrid();
  renderPreludeDropdown();
  renderAoGrid();
  applyInvFilters();
  updateBuildButton();
}

function renderDifficultyGrid() {
  const grid = el('difficulty-grid');
  grid.innerHTML = DIFFICULTY_MODES.map(d => `
    <div class="difficulty-pill ${state.difficulty === d.id ? 'active' : ''}"
         onclick="selectDifficulty('${d.id}')">
      <span class="diff-name">${d.name}</span>
      <span class="diff-desc">${d.desc}</span>
    </div>
  `).join('');
}

function selectDifficulty(id) {
  state.difficulty = id;
  renderDifficultyGrid();
}

function renderPreludeDropdown() {
  const sel = el('prelude-select');
  const prev = sel.value;
  sel.innerHTML = '<option value="">— None —</option>';
  PRELUDES.forEach((p, i) => {
    if (!state.enabledExpansions.has(p.expId)) return;
    const opt = document.createElement('option');
    opt.value       = i;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
  // Restore selection if still valid
  if (prev !== '' && sel.querySelector(`option[value="${prev}"]`)) {
    sel.value          = prev;
    state.preludeIndex = parseInt(prev, 10);
  } else {
    sel.value          = '';
    state.preludeIndex = null;
  }
  updatePreludeInfo();
}

function updatePreludeInfo() {
  const info = el('prelude-info');
  const idx  = state.preludeIndex;
  if (idx === null) { info.classList.add('hidden'); return; }
  const p = PRELUDES[idx];
  info.classList.remove('hidden');
  info.innerHTML = `<strong>${p.name}</strong> ${expIcon(p.expId)}<p style="margin-top:3px">${p.mechanic}</p>`;
}

function toggleSetupSidebar() {
  const sidebar   = document.querySelector('.setup-sidebar');
  const layout    = document.querySelector('.setup-layout');
  const pill      = el('sidebar-pill-btn');
  const collapsed = sidebar.classList.toggle('sidebar-collapsed');
  layout.classList.toggle('sidebar-hidden', collapsed);
  if (pill) {
    pill.innerHTML  = collapsed ? '&#8250;' : '&#8249;';
    pill.style.left = collapsed ? '0px' : '340px';
  }
}

function toggleRumor() {
  state.startingRumor = !state.startingRumor;
  const sw = el('rumor-toggle-switch');
  sw.classList.toggle('active', state.startingRumor);
  el('starting-rumor-cb').checked = state.startingRumor;
}

// ── Ancient One Grid ────────────────────────────────────────

function renderAoGrid() {
  const grid = el('ao-grid');
  grid.innerHTML = ANCIENT_ONES.map((ao, i) => {
    const meta    = aoMeta(ao);
    const exp     = EXPANSIONS[ao.expId];
    const diffCol = meta.diff === 'High' ? 'color:var(--red-text)'
      : meta.diff === 'Low' ? 'color:var(--green-text)' : 'color:var(--yellow-text)';
    const imgHtml = meta.image
      ? `<img src="${AO_IMG_BASE}${meta.image}" alt="${ao.name}" onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<span class=ao-icon-placeholder>&#9880;</span>')">`
      : `<span class="ao-icon-placeholder">&#9880;</span>`;

    return `<div class="ao-card"
         data-idx="${i}"
         data-exp="${ao.expId}"
         data-diff="${meta.diff}"
         onclick="selectAO(${i})">
      <div class="ao-card-thumb">${imgHtml}</div>
      <div class="ao-card-info">
        <div class="ao-card-name">${ao.name}</div>
        <div class="ao-card-expansion">${exp?.name ?? ''}</div>
        <div class="ao-card-stats">
          <div class="ao-stat">Doom <span class="ao-stat-val doom">${ao.doom}</span></div>
          <div class="ao-stat">Mysteries <span class="ao-stat-val mystery">${ao.mysteries}</span></div>
          <div class="ao-stat">Difficulty <span style="${diffCol};font-weight:700;font-size:10px">${meta.diff === 'Medium' ? 'Med' : meta.diff}</span></div>
        </div>
      </div>
      <div class="ao-card-check">&#10022;</div>
    </div>`;
  }).join('');

  applyAoFilters();
}

function selectAO(idx) {
  if (state.ancientOneIndex === idx) {
    // Deselect
    state.ancientOneIndex = null;
    document.querySelectorAll('.ao-card').forEach(c => c.classList.remove('selected'));
    el('ao-detail').classList.remove('open');
    updateBuildButton();
    return;
  }
  state.ancientOneIndex = idx;
  playSound('woodenThud');
  document.querySelectorAll('.ao-card').forEach(c => c.classList.toggle('selected', parseInt(c.dataset.idx, 10) === idx));
  renderAoDetail(idx);
  updateBuildButton();

  // Scroll card into view
  const selCard = document.querySelector(`.ao-card[data-idx="${idx}"]`);
  if (selCard) selCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderAoDetail(idx) {
  const ao   = ANCIENT_ONES[idx];
  const meta = aoMeta(ao);
  const exp  = EXPANSIONS[ao.expId];
  const diffCol = meta.diff === 'High' ? 'color:var(--red-text)'
    : meta.diff === 'Low' ? 'color:var(--green-text)' : 'color:var(--yellow-text)';
  const imgHtml = meta.image
    ? `<img src="${AO_IMG_BASE}${meta.image}" alt="${ao.name}">`
    : `<span class="ao-img-placeholder">&#9880;</span>`;

  const gameplayHtml = meta.gameplay?.length
    ? `<details class="ao-collapsible" open>
        <summary class="ao-collapsible-header">Gameplay</summary>
        <ul class="ao-collapsible-list">${meta.gameplay.map(g => `<li>${g}</li>`).join('')}</ul>
       </details>` : '';
  const setupHtml = meta.setup
    ? `<details class="ao-collapsible" open>
        <summary class="ao-collapsible-header">Setup</summary>
        <p class="ao-collapsible-text">${meta.setup}</p>
       </details>` : '';

  el('ao-detail-inner').innerHTML = `
    <div class="ao-detail-image">${imgHtml}</div>
    <div class="ao-detail-info">
      <button class="btn-ao-deselect" onclick="selectAO(${idx})">&#10005; Deselect</button>
      <div class="ao-detail-name">${ao.name}</div>
      <div class="ao-detail-subtitle">
        ${meta.subtitle ? `<span>${meta.subtitle}</span>` : ''}
        ${exp ? `<span class="ao-detail-expansion">${expIcon(ao.expId)} ${exp.name}</span>` : ''}
      </div>
      <div class="ao-detail-stats-row">
        <div class="ao-detail-stat">
          <span class="ao-detail-stat-label">Doom</span>
          <span class="ao-detail-stat-val doom">${ao.doom}</span>
        </div>
        <div class="ao-detail-stat">
          <span class="ao-detail-stat-label">Mysteries</span>
          <span class="ao-detail-stat-val mystery">${ao.mysteries}</span>
        </div>
        <div class="ao-detail-stat">
          <span class="ao-detail-stat-label">Difficulty</span>
          <span class="ao-detail-stat-val" style="${diffCol};font-size:14px">${meta.diff}</span>
        </div>
      </div>
      ${meta.lore ? `<div class="ao-detail-lore">${meta.lore}</div>` : ''}
      ${meta.cultist ? `<div class="ao-detail-cultist"><span class="ao-detail-cultist-label">Cultist</span> ${meta.cultist}</div>` : ''}
      ${gameplayHtml}
      ${setupHtml}
    </div>
  `;
  el('ao-detail').classList.add('open');
}

function selectRandomAo() {
  const visible = [...document.querySelectorAll('.ao-card:not(.filtered-out)')];
  if (!visible.length) return;
  const pick = visible[Math.floor(Math.random() * visible.length)];
  const idx = parseInt(pick.dataset.idx, 10);
  playSound('woodenThud');
  state.ancientOneIndex = idx;
  document.querySelectorAll('.ao-card').forEach(c => c.classList.toggle('selected', parseInt(c.dataset.idx, 10) === idx));
  renderAoDetail(idx);
  updateBuildButton();
  pick.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function filterAoDifficulty(val) {
  aoGridDiffFilter = val;
  document.querySelectorAll('.ao-diff-filter').forEach(el => {
    el.classList.toggle('active', el.dataset.diff === val);
  });
  applyAoFilters();
}

function applyAoFilters() {
  const search = (el('ao-search')?.value ?? '').toLowerCase();
  const cards  = document.querySelectorAll('.ao-card');
  let visible  = 0;

  cards.forEach(card => {
    const expId      = parseInt(card.dataset.exp, 10);
    const diff       = card.dataset.diff;
    const name       = card.querySelector('.ao-card-name').textContent.toLowerCase();
    const expMatch   = state.enabledExpansions.has(expId);
    const diffMatch  = aoGridDiffFilter === 'all' || diff === aoGridDiffFilter;
    const searchMatch= !search || name.includes(search);
    const show       = expMatch && diffMatch && searchMatch;
    card.classList.toggle('filtered-out', !show);
    if (show) visible++;
  });

  el('ao-grid-count').textContent = `${visible} available`;
  el('ao-empty').style.display    = visible === 0 ? 'flex' : 'none';

  // If selected AO got filtered out, deselect it
  if (state.ancientOneIndex !== null) {
    const selCard = document.querySelector(`.ao-card[data-idx="${state.ancientOneIndex}"]`);
    if (selCard && selCard.classList.contains('filtered-out')) {
      state.ancientOneIndex = null;
      document.querySelectorAll('.ao-card').forEach(c => c.classList.remove('selected'));
      el('ao-detail').classList.remove('open');
      updateBuildButton();
    }
  }
}

function updateBuildButton() {
  el('build-btn').disabled = state.ancientOneIndex === null;
}

// ============================================================
// SETUP TAB SWITCHING
// ============================================================
function switchSetupTab(tab) {
  document.querySelectorAll('.setup-tab').forEach(t => t.classList.toggle('active', t.id === `tab-${tab}`));
  document.querySelectorAll('.setup-tab-panel').forEach(p => p.classList.toggle('hidden', p.id !== `tabpanel-${tab}`));
}

// ============================================================
// INVESTIGATOR BROWSER
// ============================================================

function invImgFile(name) {
  return name.replace(/['"]/g, '').replace(/\s+/g, '_');
}

function renderInvGrid() {
  const grid = el('inv-grid');
  const INV_IMG = 'images/investigators/';
  grid.innerHTML = INVESTIGATORS.map((inv, i) => {
    const imgFile  = invImgFile(inv.name);
    const imgSrc   = `${INV_IMG}${imgFile}.png`;
    const traitPills = inv.traits.map(t => `<span class="inv-card-trait">${t}</span>`).join('');
    return `<div class="inv-card"
         data-idx="${i}"
         data-exp="${inv.expId}"
         data-traits="${inv.traits.join('|')}"
         onclick="selectInvestigator(${i})">
      <div class="inv-card-thumb">
        <img src="${imgSrc}" alt="${inv.name}"
             onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<span class=ao-icon-placeholder>&#9760;</span>')">
      </div>
      <div class="inv-card-body">
        <div class="inv-card-name">${inv.name}</div>
        <div class="inv-card-occ">${inv.occupation}</div>
        <div class="inv-card-vitals">
          <span class="inv-vital health"><img src="images/healthsanity/Health_Icon.png" alt="Health">${inv.health}</span>
          <span class="inv-vital sanity"><img src="images/healthsanity/Sanity_Icon.png" alt="Sanity">${inv.sanity}</span>
        </div>
        <div class="inv-card-skills">
          <span class="inv-skill lore"><img src="images/skills/skill_lore.png" alt="Lore">${inv.lore}</span>
          <span class="inv-skill influence"><img src="images/skills/skill_influence.png" alt="Influence">${inv.influence}</span>
          <span class="inv-skill observation"><img src="images/skills/skill_observation.png" alt="Observation">${inv.observation}</span>
          <span class="inv-skill strength"><img src="images/skills/skill_strength.png" alt="Strength">${inv.strength}</span>
          <span class="inv-skill will"><img src="images/skills/skill_will.png" alt="Will">${inv.will}</span>
        </div>
        <div class="inv-card-traits">${traitPills}</div>
      </div>
      <div class="ao-card-check">&#10022;</div>
    </div>`;
  }).join('');
  applyInvFilters();
}

function selectInvestigator(idx) {
  if (selectedInvIndex === idx) {
    selectedInvIndex = null;
    document.querySelectorAll('.inv-card').forEach(c => c.classList.remove('selected'));
    el('inv-detail').classList.remove('open');
    return;
  }
  selectedInvIndex = idx;
  playSound('woodenThud');
  document.querySelectorAll('.inv-card').forEach(c => c.classList.toggle('selected', parseInt(c.dataset.idx, 10) === idx));
  renderInvDetail(idx);
  const sel = document.querySelector(`.inv-card[data-idx="${idx}"]`);
  if (sel) sel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderInvDetail(idx) {
  const inv     = INVESTIGATORS[idx];
  const exp     = EXPANSIONS[inv.expId];
  const INV_IMG = 'images/investigators/';
  const imgFile = invImgFile(inv.name);
  const imgSrc  = `${INV_IMG}${imgFile}.png`;

  const traitPills = inv.traits.map(t => `<span class="inv-detail-trait">${t}</span>`).join('');
  const possHtml   = inv.startingPossessions.map(p => `<span class="inv-poss-item">${p}</span>`).join('');

  const SKILL_KEYS = new Set(['lore','influence','observation','strength','will']);
  function statBlock(key, label, val) {
    const VITAL_PATHS = { health: 'images/healthsanity/Health_Icon.png', sanity: 'images/healthsanity/Sanity_Icon.png' };
    const imgSrcStat = SKILL_KEYS.has(key)
      ? `images/skills/skill_${key}.png`
      : (VITAL_PATHS[key] ?? `images/stat/${key}.png`);
    return `<div class="inv-stat-block stat-${key}">
      <img class="inv-stat-icon" src="${imgSrcStat}" alt="${label}"
           onerror="this.outerHTML='<span class=inv-stat-icon-ph>${label[0]}</span>'">
      <span class="inv-stat-val">${val}</span>
      <span class="inv-stat-label">${label}</span>
    </div>`;
  }

  el('inv-detail-inner').innerHTML = `
    <div class="inv-detail-portrait">
      <img src="${imgSrc}" alt="${inv.name}"
           onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<span class=ao-img-placeholder>&#9760;</span>')"  >
    </div>
    <div class="inv-detail-info">
      <button class="btn-ao-deselect" onclick="selectInvestigator(${idx})">&#10005; Deselect</button>
      <div class="ao-detail-name">${inv.name}</div>
      <div class="inv-detail-traits-inline">${traitPills}</div>
      <div class="ao-detail-subtitle">
        <span>${inv.occupation}</span>
        ${exp ? `<span class="ao-detail-expansion">${expIcon(inv.expId)} ${exp.name}</span>` : ''}
      </div>
      <div class="inv-detail-location">
        <span class="inv-detail-loc-label">Starting Location</span>
        <span class="inv-detail-loc-val">${inv.startingLocation}</span>
      </div>
      <div class="inv-detail-stats">
        ${statBlock('health',      'Health',      inv.health)}
        ${statBlock('sanity',      'Sanity',      inv.sanity)}
        <div class="inv-stats-divider"></div>
        ${statBlock('lore',        'Lore',        inv.lore)}
        ${statBlock('influence',   'Influence',   inv.influence)}
        ${statBlock('observation', 'Observation', inv.observation)}
        ${statBlock('strength',    'Strength',    inv.strength)}
        ${statBlock('will',        'Will',        inv.will)}
      </div>
      <div class="inv-detail-section">
        <div class="inv-detail-section-label">Starting Possessions</div>
        <div class="inv-detail-poss">${possHtml}</div>
      </div>
    </div>
  `;
  el('inv-detail').classList.add('open');
}

function filterInvTrait(val) {
  invTraitFilter = val;
  document.querySelectorAll('.inv-trait-filter').forEach(el => {
    el.classList.toggle('active', el.dataset.trait === val);
  });
  applyInvFilters();
}

function applyInvFilters() {
  const search = (el('inv-search')?.value ?? '').toLowerCase();
  const cards  = document.querySelectorAll('.inv-card');
  let visible  = 0;

  cards.forEach(card => {
    const expId      = parseInt(card.dataset.exp, 10);
    const traits     = card.dataset.traits;
    const name       = card.querySelector('.inv-card-name').textContent.toLowerCase();
    const expMatch   = state.enabledExpansions.has(expId);
    const traitMatch = invTraitFilter === 'all' || traits.includes(invTraitFilter);
    const searchMatch= !search || name.includes(search);
    const show       = expMatch && traitMatch && searchMatch;
    card.classList.toggle('filtered-out', !show);
    if (show) visible++;
  });

  el('inv-grid-count').textContent = `${visible} available`;
  el('inv-empty').style.display    = visible === 0 ? 'flex' : 'none';

  if (selectedInvIndex !== null) {
    const sel = document.querySelector(`.inv-card[data-idx="${selectedInvIndex}"]`);
    if (sel && sel.classList.contains('filtered-out')) {
      selectedInvIndex = null;
      document.querySelectorAll('.inv-card').forEach(c => c.classList.remove('selected'));
      el('inv-detail').classList.remove('open');
    }
  }
}

// ============================================================
// RENDERING — GAME SCREEN
// ============================================================

function renderGameHeader() {
  const ao = ANCIENT_ONES[state.ancientOneIndex];
  el('game-ao-name').textContent = ao ? ao.name : '—';
}

function renderDoom() {
  const d = el('doom-display');
  d.textContent = state.doom;
  d.classList.toggle('zero', state.doom === 0 && state.awakened);
}

function renderMysteries() {
  const ao = state.ancientOneIndex !== null ? ANCIENT_ONES[state.ancientOneIndex] : null;
  const total = ao ? ao.mysteries : 3;
  el('mysteries-display').textContent = `${state.mysteries} / ${total}`;
}

function renderAoGamePanel() {
  const panel = el('game-ao-panel');
  if (!panel) return;
  const idx = state.ancientOneIndex;
  if (idx === null) { panel.innerHTML = ''; return; }

  const ao   = ANCIENT_ONES[idx];
  const meta = aoMeta(ao);
  const diffCol = meta.diff === 'High' ? 'color:var(--red-text)'
    : meta.diff === 'Low' ? 'color:var(--green-text)' : 'color:var(--yellow-text)';

  const imgStyle = meta.image ? `background-image:url('${AO_IMG_BASE}${meta.image}')` : '';

  panel.innerHTML = `
    <div class="boss-card" id="victory-boss-card">
      <div class="boss-card-image" style="${imgStyle}"></div>
    </div>
    <div class="boss-info-panel">
      <h3>${ao.name}</h3>
      <div class="boss-subtitle">
        ${meta.subtitle ? `<span>${meta.subtitle}</span>` : ''}
        ${expName(ao.expId) !== '—' ? `<span class="ao-detail-expansion">${expIcon(ao.expId)} ${expName(ao.expId)}</span>` : ''}
      </div>
      <div class="boss-stats-row">
        <div class="boss-stat">
          <span class="boss-stat-label">Doom Track</span>
          <span class="boss-stat-val doom">${ao.doom}</span>
        </div>
        <div class="boss-stat">
          <span class="boss-stat-label">Mysteries</span>
          <span class="boss-stat-val mystery">${ao.mysteries}</span>
        </div>
        <div class="boss-stat">
          <span class="boss-stat-label">Difficulty</span>
          <span class="boss-stat-val" style="${diffCol};font-size:14px">${meta.diff}</span>
        </div>
      </div>
      ${meta.lore ? `<div class="boss-lore">${meta.lore}</div>` : ''}
      ${meta.cultist ? `<div class="boss-cultist"><span class="boss-cultist-label">Cultist</span> ${meta.cultist}</div>` : ''}
      ${meta.gameplay?.length ? `<details class="ao-collapsible">
        <summary class="ao-collapsible-header">Gameplay</summary>
        <ul class="ao-collapsible-list">${meta.gameplay.map(g => `<li>${g}</li>`).join('')}</ul>
       </details>` : ''}
      ${meta.setup ? `<details class="ao-collapsible">
        <summary class="ao-collapsible-header">Setup</summary>
        <p class="ao-collapsible-text">${meta.setup}</p>
       </details>` : ''}
    </div>
  `;
}

function renderPreludeInline() {
  const display = el('prelude-inline-display');
  const nameEl  = el('prelude-inline-name');
  if (!display || !nameEl) return;
  if (state.preludeIndex === null) {
    display.classList.add('hidden');
    return;
  }
  const p = PRELUDES[state.preludeIndex];
  nameEl.textContent = p.name;
  display.classList.remove('hidden');
}

function renderStageTracker() {
  const current   = getCurrentStage();
  const remaining = state.mythosDeck.length - state.mythosIndex;

  for (let s = 0; s < 3; s++) {
    const block = el(`stage-block-${s}`);
    const info  = state.stageInfo[s];
    block.classList.toggle('active',    s === current && remaining > 0);
    block.classList.toggle('exhausted', info.total === 0);
    el(`s${s}g`).textContent = info.g;
    el(`s${s}y`).textContent = info.y;
    el(`s${s}b`).textContent = info.b;
    const total = info.g + info.y + info.b;
    el(`s${s}bar-g`).style.width = total ? `${(info.g / total) * 100}%` : '0%';
    el(`s${s}bar-y`).style.width = total ? `${(info.y / total) * 100}%` : '0%';
    el(`s${s}bar-b`).style.width = total ? `${(info.b / total) * 100}%` : '0%';
  }
}

function renderDeckLowWarning() {
  const remaining = state.mythosDeck.length - state.mythosIndex;
  const warn = el('deck-low-warning');
  if (remaining <= DECK_LOW_THRESHOLD && remaining > 0) {
    warn.classList.remove('hidden');
    el('cards-remaining-count').textContent = remaining;
  } else {
    warn.classList.add('hidden');
  }
}

function renderRound() {
  el('round-display').textContent = state.round;
}

function renderTimer() {
  const elapsed = state.timerElapsed + (state.timerStart ? Date.now() - state.timerStart : 0);
  el('timer-display').textContent = formatTime(elapsed);
}

// ── Card flip ──────────────────────────────────────────────

let currentDrawnCard = null;
let tsParticlesLoaded = false;

function showCardFlip(card) {
  currentDrawnCard = card;
  const isHard = card.difficulty === 'H';

  const container  = el('card-flip-container');
  const backFace   = el('card-back-face');
  const actions    = el('card-actions');
  const hint       = el('reveal-hint');

  el('drawn-card-img').src = `${CARD_IMG_BASE}${card.id}.jpg`;

  el('card-flip-inner').style.transition = '';
  container.classList.remove('flipped', 'tremor', 'shake-intense', 'waiting');
  backFace.classList.remove('pulsing-gren', 'pulsing-yelw', 'pulsing-blue', 'pulsing-hard', 'card-back-idle');
  actions.classList.add('hidden');
  hint.classList.remove('hidden');

  const colorClass = isHard ? 'back-hard' : `back-${card.color}`;
  backFace.className = `card-face card-back ${colorClass}`;
  el('card-back-label').textContent = isHard
    ? 'HARD'
    : { gren: 'GREEN', yelw: 'YELLOW', blue: 'BLUE' }[card.color];

  backFace.classList.add(isHard ? 'pulsing-hard' : `pulsing-${card.color}`);
  if (isHard) container.classList.add('tremor');

  el('draw-mythos-btn').disabled = true;
  container.classList.add('waiting');
  el('card-flip-container').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  container.addEventListener('click', function onReveal() {
    container.removeEventListener('click', onReveal);
    revealMythosCard(card, isHard);
  }, { once: true });
}

function revealMythosCard(card, isHard) {
  const container = el('card-flip-container');
  const backFace  = el('card-back-face');

  backFace.classList.remove('pulsing-gren', 'pulsing-yelw', 'pulsing-blue', 'pulsing-hard');
  container.classList.remove('tremor', 'waiting');
  el('reveal-hint').classList.add('hidden');
  playSound('cardDraw');

  if (isHard) {
    fireScreenFlash();
    container.classList.add('shake-intense');
    setTimeout(() => { container.classList.remove('shake-intense'); doCardFlip(card, isHard); }, 300);
  } else {
    doCardFlip(card, isHard);
  }
}

function doCardFlip(card, isHard) {
  const inner  = el('card-flip-inner');
  const flipMs = isHard ? 600 : 400;
  inner.style.transition = `transform ${flipMs}ms ease-in-out`;
  el('card-flip-container').classList.add('flipped');
  setTimeout(() => openMythosLightbox(card, isHard), flipMs);
}

function openMythosLightbox(card, isHard) {
  const lb     = el('mythos-lightbox');
  const cardEl = el('mythos-lb-card');
  const img    = el('mythos-lb-img');

  img.src = `${CARD_IMG_BASE}${card.id}.jpg`;

  const glowColor = isHard ? '#8b1a1a'
    : { gren: '#4a7c59', yelw: '#c9a84c', blue: '#3a5f8a' }[card.color];
  img.style.boxShadow   = `0 0 40px ${glowColor}, 0 0 90px ${glowColor}`;
  img.style.borderRadius = 'var(--radius-md)';

  lb.classList.toggle('hard', isHard);
  lb.classList.remove('closing', 'hidden');
  document.body.style.overflow = 'hidden';

  if (isHard) {
    setTimeout(() => {
      cardEl.classList.add('shaking');
      cardEl.addEventListener('animationend', () => cardEl.classList.remove('shaking'), { once: true });
    }, 280);
    fireHardParticles(cardEl);
  }

  let closing = false;
  function doClose() {
    if (closing) return;
    closing = true;
    document.removeEventListener('keydown', escHandler);
    lb.removeEventListener('click', clickHandler);
    closeMythosLightbox(card);
  }
  function clickHandler() { doClose(); }
  function escHandler(e) { if (e.key === 'Escape') doClose(); }
  lb.addEventListener('click', clickHandler);
  document.addEventListener('keydown', escHandler);
}

function closeMythosLightbox(card) {
  const lb = el('mythos-lightbox');
  lb.classList.add('closing');
  document.body.style.overflow = '';
  setTimeout(() => {
    lb.classList.add('hidden');
    lb.classList.remove('closing', 'hard');
    el('mythos-lb-img').src = '';
    el('mythos-lb-img').style.boxShadow = '';
    showCardActions(card);
  }, 200);
}

function showCardActions(card) {
  const actions   = el('card-actions');
  const typeLabel = el('card-type-label');
  actions.classList.remove('hidden');
  if (card.isOngoing) {
    typeLabel.textContent = 'ONGOING';
    typeLabel.className   = 'card-type-label type-ongoing';
    el('dismiss-card-btn').classList.add('hidden');
    el('to-play-card-btn').classList.remove('hidden');
  } else {
    typeLabel.textContent = 'EVENT';
    typeLabel.className   = 'card-type-label type-event';
    el('dismiss-card-btn').classList.remove('hidden');
    el('to-play-card-btn').classList.add('hidden');
  }
  el('draw-mythos-btn').disabled = false;
}

function fireScreenFlash() {
  const flash = el('screen-flash');
  flash.classList.remove('hidden', 'active');
  void flash.offsetHeight;
  flash.classList.add('active');
  setTimeout(() => flash.classList.add('hidden'), 210);
}

function fireHardParticles(origin) {
  if (!tsParticlesLoaded) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tsparticles-confetti@2.12.0/tsparticles.confetti.bundle.min.js';
    script.onload = () => { tsParticlesLoaded = true; doFireParticles(origin); };
    document.head.appendChild(script);
  } else {
    doFireParticles(origin);
  }
}

function doFireParticles(origin) {
  if (typeof confetti === 'undefined') return;
  const rect = origin.getBoundingClientRect();
  confetti({
    particleCount: 60, spread: 90,
    origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight },
    colors: ['#8b1a1a','#4a0000','#cc2020','#1a0000','#300000'],
    gravity: 0.9, ticks: 80, scalar: 0.75, shapes: ['circle','square'], drift: 0
  });
}

function hideCardDisplay() {
  // Reset back to idle state (card frame stays visible)
  const container = el('card-flip-container');
  const backFace  = el('card-back-face');
  container.classList.remove('flipped', 'tremor', 'shake-intense', 'waiting');
  backFace.classList.remove('pulsing-gren', 'pulsing-yelw', 'pulsing-blue', 'pulsing-hard');
  backFace.className = 'card-face card-back card-back-idle';
  el('card-back-label').textContent = '';
  el('card-flip-inner').style.transition = '';
  el('card-actions').classList.add('hidden');
  el('reveal-hint').classList.add('hidden');
  el('draw-mythos-btn').disabled = false;
  currentDrawnCard = null;
}

// ── In-play & discard ──────────────────────────────────────

function renderInPlay() {
  const grid = el('in-play-grid');
  if (!grid) return;
  el('in-play-count').textContent = state.mythosInPlay.length;

  if (!state.mythosInPlay.length) {
    grid.innerHTML = '<p class="empty-hint">No ongoing cards in play.</p>';
    return;
  }

  grid.innerHTML = state.mythosInPlay.map(cardId => {
    const card      = MYTHOS_CARDS.find(c => c.id === cardId);
    const tokens    = state.mythosTokens[cardId] ?? { eldritch: 0, clue: 0 };
    const isRumor   = card?.color === 'blue';
    const hasTokens = card?.hasTokens ?? false;
    const hasClues  = card?.hasClues  ?? false;
    const tokenLabel = isRumor ? 'Rumor Token' : 'Eldritch Token';
    const tokenClass = isRumor ? 'token-row rumor-row' : 'token-row eldritch-row';

    return `
      <div class="in-play-card">
        <img src="${CARD_IMG_BASE}${cardId}.jpg" alt="${cardId}" loading="lazy"
             class="in-play-img" onclick="openLightbox('${CARD_IMG_BASE}${cardId}.jpg')">
        ${hasTokens ? `
        <div class="${tokenClass}">
          <span class="token-label">${tokenLabel}</span>
          <div class="token-controls">
            <button class="token-btn" onclick="adjustToken('${cardId}','eldritch',-1)">−</button>
            <span class="token-val">${tokens.eldritch}</span>
            <button class="token-btn" onclick="adjustToken('${cardId}','eldritch',1)">+</button>
          </div>
        </div>` : ''}
        ${hasClues ? `
        <div class="token-row clue-row">
          <span class="token-label">Clue Token</span>
          <div class="token-controls">
            <button class="token-btn" onclick="adjustToken('${cardId}','clue',-1)">−</button>
            <span class="token-val">${tokens.clue}</span>
            <button class="token-btn" onclick="adjustToken('${cardId}','clue',1)">+</button>
          </div>
        </div>` : ''}
        <button class="in-play-discard-btn" onclick="discardFromPlay('${cardId}')">Discard</button>
      </div>
    `;
  }).join('');
}

function renderDiscardPile() {
  el('discard-count').textContent = state.mythosDiscarded.length;
  const grid = el('discard-grid');
  if (!state.mythosDiscarded.length) {
    grid.innerHTML = '<span class="discard-empty">—</span>';
    return;
  }
  grid.innerHTML = state.mythosDiscarded.slice().reverse().map(cardId => `
    <div class="discard-thumb" title="${cardId}" onclick="openDiscardLightbox()">
      <img src="${CARD_IMG_BASE}${cardId}.jpg" alt="${cardId}" loading="lazy">
    </div>
  `).join('');
}

function openDiscardLightbox() {
  if (document.getElementById('discard-lightbox')) return;
  const cards = state.mythosDiscarded.slice().reverse();
  const lb = document.createElement('div');
  lb.className = 'discard-lightbox';
  lb.id = 'discard-lightbox';
  lb.innerHTML = `
    <div class="discard-lb-overlay" onclick="closeDiscardLightbox()"></div>
    <div class="discard-lb-inner">
      <div class="discard-lb-header">
        <span class="discard-lb-title">Discard Pile — ${cards.length} card${cards.length !== 1 ? 's' : ''}</span>
        <button class="discard-lb-close" onclick="closeDiscardLightbox()">&#10005; Close</button>
      </div>
      <div class="discard-lb-grid">
        ${cards.map(cardId => `
          <div class="discard-lb-card">
            <img src="${CARD_IMG_BASE}${cardId}.jpg" alt="${cardId}" loading="lazy">
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(lb);
}

function closeDiscardLightbox() {
  document.getElementById('discard-lightbox')?.remove();
}

function returnCardToPool(deckKey, uid) {
  const deck = state.decks[deckKey];
  const idx  = deck.drawn.findIndex(c => c.uid === uid);
  if (idx === -1) return;
  const [card] = deck.drawn.splice(idx, 1);
  deck.pool.push(card);
  renderDrawHistory(deckKey);
  renderDeckCount(deckKey);
  saveState();
}

// ── Secondary deck rendering ───────────────────────────────

function renderAllSecondaryDecks() {
  for (const key of DECK_KEYS) {
    renderTraitFilters(key);
    renderDeckCount(key);
    renderDrawHistory(key);
  }
}

function renderTraitFilters(deckKey) {
  const cfg      = DECK_CONFIG[deckKey];
  const grid     = el(`${deckKey}-traits`);
  const selected = state.decks[deckKey].filter.traits;

  grid.innerHTML = cfg.traits.map(trait => `
    <label class="trait-chip ${selected.includes(trait) ? 'active' : ''}" data-trait="${trait}">
      <input type="checkbox" ${selected.includes(trait) ? 'checked' : ''}> ${trait}
    </label>
  `).join('');

  // Inject ALL/NONE into the filter-controls row for this deck
  const controlsRow = el(`${deckKey}-filter-controls`);
  if (controlsRow) {
    // Remove existing all/none buttons and separator before re-adding
    controlsRow.querySelectorAll('.trait-all-btn, .control-separator').forEach(b => b.remove());
    const sep = document.createElement('div'); sep.className = 'control-separator';
    const allBtn  = document.createElement('button'); allBtn.className = 'trait-all-btn'; allBtn.dataset.deck = deckKey; allBtn.dataset.action = 'all'; allBtn.textContent = 'All';
    const noneBtn = document.createElement('button'); noneBtn.className = 'trait-all-btn'; noneBtn.dataset.deck = deckKey; noneBtn.dataset.action = 'none'; noneBtn.textContent = 'None';
    controlsRow.appendChild(sep);
    controlsRow.appendChild(allBtn);
    controlsRow.appendChild(noneBtn);
  }

  grid.querySelectorAll('.trait-chip').forEach(chip => {
    const checkbox = chip.querySelector('input');
    checkbox.addEventListener('change', () => {
      const trait  = chip.dataset.trait;
      const filter = state.decks[deckKey].filter;
      if (checkbox.checked) {
        if (!filter.traits.includes(trait)) filter.traits.push(trait);
        chip.classList.add('active');
      } else {
        filter.traits = filter.traits.filter(t => t !== trait);
        chip.classList.remove('active');
      }
      saveState();
    });
  });

  controlsRow?.querySelectorAll('.trait-all-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = state.decks[deckKey].filter;
      filter.traits = btn.dataset.action === 'all' ? [...cfg.traits] : [];
      renderTraitFilters(deckKey);
      saveState();
    });
  });
}

function renderDeckCount(deckKey) {
  el(`${deckKey}-count`).textContent = state.decks[deckKey].pool.length + ' remaining';
}

function renderLastDrawn(deckKey, card) {
  const container = el(`${deckKey}-last-drawn`);
  container.classList.remove('hidden');
  const imgSrc = deckCardImgSrc(deckKey, card.name);
  container.innerHTML = `
    ${imgSrc ? `<img class="last-drawn-thumb" data-src="${imgSrc}" alt="${card.name}" onerror="this.style.display='none'">` : ''}
    <div class="drawn-card-name">${card.name}</div>
    <div class="drawn-card-meta">
      ${card.traits.map(t => `<span class="drawn-card-trait">${t}</span>`).join('')}
      ${card.cost != null ? `<span class="drawn-card-cost">Cost: ${card.cost}</span>` : ''}
    </div>
  `;

  if (imgSrc) {
    const thumb = container.querySelector('.last-drawn-thumb');
    if (thumb) {
      thumb.src = imgSrc;
      thumb.addEventListener('click', () => openDeckCardLightbox(imgSrc));
    }
    openDeckCardLightbox(imgSrc);
  }
}

function renderDrawHistory(deckKey) {
  const drawn   = state.decks[deckKey].drawn;
  const history = el(`${deckKey}-history`);
  const badge   = el(`${deckKey}-history-count`);
  badge.textContent = drawn.length;

  history.innerHTML = drawn.length
    ? drawn.map((card, i) => `
        <div class="history-item">
          <span class="history-num">${i + 1}.</span>
          <span class="history-name">${card.name}</span>
          ${card.cost != null ? `<span class="history-cost">${card.cost}</span>` : ''}
          <button class="history-cancel" data-deck="${deckKey}" data-uid="${card.uid}" title="Return to pool">&#10005;</button>
        </div>
      `).join('')
    : '<p class="empty-hint" style="padding:0.4rem 0">No cards drawn yet.</p>';

  history.querySelectorAll('.history-cancel').forEach(btn => {
    btn.addEventListener('click', () => returnCardToPool(btn.dataset.deck, btn.dataset.uid));
  });
}

function renderDrawKeepModal(deckKey, cards) {
  const modal = el(`${deckKey}-keep-modal`);
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="draw-keep-title">Draw ${cards.length}, Keep 1 — choose a card:</div>
    <div class="draw-keep-cards">
      ${cards.map(card => {
        const imgSrc = deckCardImgSrc(deckKey, card.name);
        return `
        <div class="draw-keep-card">
          ${imgSrc ? `<img class="draw-keep-thumb" data-src="${imgSrc}" alt="${card.name}" onerror="this.style.display='none'">` : ''}
          <div class="draw-keep-card-info">
            <div class="card-name">${card.name}</div>
            <div class="card-traits">
              ${card.traits.map(t => `<span class="drawn-card-trait">${t}</span>`).join('')}
              ${card.cost != null ? `<span class="drawn-card-cost">Cost: ${card.cost}</span>` : ''}
            </div>
            <button class="keep-btn" data-uid="${card.uid}">Keep this card</button>
          </div>
        </div>
      `}).join('')}
    </div>
    <div class="draw-keep-cancel">Put all back</div>
  `;
  modal.querySelectorAll('.draw-keep-thumb').forEach(img => {
    const src = img.dataset.src;
    img.src = src;
    img.addEventListener('click', () => openDeckCardLightbox(src));
  });
  modal.querySelectorAll('.keep-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const kept = cards.find(c => c.uid === btn.dataset.uid);
      if (kept) keepCard(deckKey, kept);
    });
  });
  modal.querySelector('.draw-keep-cancel').addEventListener('click', () => hideDrawKeepModal(deckKey));
}

function hideDrawKeepModal(deckKey) {
  const m = el(`${deckKey}-keep-modal`);
  m.classList.add('hidden');
  m.innerHTML = '';
}

function showFindResults(deckKey, query) {
  const results = el(`${deckKey}-find-results`);
  if (!query.trim()) { results.classList.add('hidden'); return; }

  const lower   = query.toLowerCase();
  const matches = state.decks[deckKey].pool
    .filter(c => c.name.toLowerCase().includes(lower))
    .slice(0, 15);

  results.classList.remove('hidden');
  results.innerHTML = matches.length
    ? matches.map(card => `
        <div class="find-result-item" data-uid="${card.uid}">
          <span class="find-result-name">${card.name}</span>
          <span class="find-result-take">Take →</span>
        </div>
      `).join('')
    : '<div class="find-result-item" style="color:var(--parchment-dim)">No matches in pool</div>';

  results.querySelectorAll('.find-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const uid = item.dataset.uid;
      if (uid) takeNamedCard(deckKey, uid);
    });
  });
}

function hideFindResults(deckKey) {
  el(`${deckKey}-find-results`)?.classList.add('hidden');
}

// ============================================================
// COLLAPSIBLE SECTIONS
// ============================================================
function initCollapsibles() {
  document.querySelectorAll('.collapsible-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const content  = el(targetId);
      const section  = btn.closest('.collapsible-section');
      if (!content) return;
      const isOpen = content.classList.contains('expanded');
      content.classList.toggle('expanded',  !isOpen);
      content.classList.toggle('collapsed',  isOpen);
      section.classList.toggle('open', !isOpen);
    });
  });
}

// ============================================================
// SCREEN TRANSITIONS
// ============================================================
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  el(screenId).classList.remove('hidden');
  state.phase = screenId === 'game-screen' ? 'game' : 'setup';
}

function startGame() {
  buildMythosDeck();
  buildSecondaryDecks();
  hideCardDisplay();
  currentDrawnCard = null;

  const ao       = ANCIENT_ONES[state.ancientOneIndex];
  state.doom      = ao?.doom ?? 13;
  state.mysteries = 0;
  state.mythosTokens = {};

  showScreen('game-screen');
  renderGameHeader();
  renderDoom();
  renderMysteries();
  renderAoGamePanel();
  renderPreludeInline();
  renderStageTracker();
  renderDeckLowWarning();
  renderInPlay();
  renderDiscardPile();
  renderAllSecondaryDecks();
  renderRound();

  // Auto-draw starting rumor into play (it sits at index 0 of the deck)
  if (state.startingRumor && state.mythosDeck.length > 0) {
    const cardId = state.mythosDeck[state.mythosIndex];
    state.mythosIndex++;
    sendToPlay(cardId);
  }

  // Prelude Mythos placement reminder
  if (state.preludeIndex !== null && PRELUDES[state.preludeIndex].placesMythos) {
    const prelude = PRELUDES[state.preludeIndex];
    el('prelude-mythos-banner').classList.remove('hidden');
    el('prelude-banner-text').textContent =
      `${prelude.name}: A Rumor Mythos card must be placed in play before the first draw. Find it from your game box and place it in play, then click Acknowledged.`;
  }

  startTimer();
  saveState();
}

function confirmNewGame() {
  if (!confirm('Start a new game? All current progress will be lost.')) return;
  pauseTimer();
  clearSavedState();

  state.phase             = 'setup';
  state.mythosDeck        = [];
  state.mythosIndex       = 0;
  state.mythosInPlay      = [];
  state.mythosDiscarded   = [];
  state.mythosTokens      = {};
  state.round             = 0;
  state.doom              = 0;
  state.mysteries         = 0;
  state.awakened          = false;
  state.timerElapsed      = 0;
  state.timerStart        = null;
  state.preludeIndex      = null;
  state.ancientOneIndex   = null;
  state.enabledExpansions = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  state.difficulty        = 'normal';
  state.startingRumor     = false;
  for (const key of DECK_KEYS) {
    state.decks[key].pool  = [];
    state.decks[key].drawn = [];
    state.decks[key].filter.traits = [...DECK_CONFIG[key].traits];
  }

  // Clear doom awakening state
  if (_doomEmberInterval) { clearInterval(_doomEmberInterval); _doomEmberInterval = null; }
  document.getElementById('doom-vignette')?.remove();
  document.getElementById('doom-flash')?.remove();
  document.getElementById('doom-dismiss-overlay')?.remove();
  el('doom-display')?.classList.remove('zero');
  _savedBossInfoHTML = null;

  showScreen('setup-screen');
  renderExpansionGrid();
  renderDifficultyGrid();
  renderPreludeDropdown();
  renderAoGrid();
  renderInvGrid();
  // Clear selection state
  document.querySelectorAll('.ao-card').forEach(c => c.classList.remove('selected'));
  el('ao-detail').classList.remove('open');
  selectedInvIndex = null;
  document.querySelectorAll('.inv-card').forEach(c => c.classList.remove('selected'));
  el('inv-detail').classList.remove('open');
  el('rumor-toggle-switch').classList.remove('active');
  el('starting-rumor-cb').checked = false;
  updateBuildButton();
  el('timer-display').textContent = '0:00';
  el('round-display').textContent = '0';
}

// ============================================================
// LOCAL STORAGE
// ============================================================
function saveState() {
  try {
    const data = {
      version:          SAVE_VERSION,
      enabledExpansions:[...state.enabledExpansions],
      ancientOneIndex:  state.ancientOneIndex,
      difficulty:       state.difficulty,
      preludeIndex:     state.preludeIndex,
      startingRumor:    state.startingRumor,
      phase:            state.phase,
      mythosDeck:       state.mythosDeck,
      mythosIndex:      state.mythosIndex,
      mythosInPlay:     state.mythosInPlay,
      mythosDiscarded:  state.mythosDiscarded,
      stageInfo:        state.stageInfo,
      stageBoundaries:  state.stageBoundaries,
      timerElapsed:     state.timerElapsed + (state.timerStart ? Date.now() - state.timerStart : 0),
      round:            state.round,
      doom:             state.doom,
      mysteries:        state.mysteries,
      awakened:         state.awakened,
      mythosTokens:     state.mythosTokens,
      decks: Object.fromEntries(
        DECK_KEYS.map(k => [k, { pool: state.decks[k].pool, drawn: state.decks[k].drawn, filter: state.decks[k].filter }])
      )
    };
    localStorage.setItem('eldritch_codex', JSON.stringify(data));
  } catch (e) { console.warn('Save failed:', e); }
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem('eldritch_codex');
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.version !== SAVE_VERSION) return false;

    state.enabledExpansions = new Set(data.enabledExpansions);
    state.ancientOneIndex   = data.ancientOneIndex;
    state.difficulty        = data.difficulty;
    state.preludeIndex      = data.preludeIndex;
    state.startingRumor     = data.startingRumor;
    state.phase             = data.phase;
    state.mythosDeck        = data.mythosDeck;
    state.mythosIndex       = data.mythosIndex;
    state.mythosInPlay      = data.mythosInPlay;
    state.mythosDiscarded   = data.mythosDiscarded;
    state.stageInfo         = data.stageInfo;
    state.stageBoundaries   = data.stageBoundaries;
    state.timerElapsed      = data.timerElapsed ?? 0;
    state.round             = data.round ?? 0;
    state.doom              = data.doom ?? 0;
    state.mysteries         = data.mysteries ?? 0;
    state.awakened          = data.awakened ?? false;
    state.mythosTokens      = data.mythosTokens ?? {};

    for (const key of DECK_KEYS) {
      if (data.decks?.[key]) {
        state.decks[key].pool   = data.decks[key].pool  ?? [];
        state.decks[key].drawn  = data.decks[key].drawn ?? [];
        state.decks[key].filter = data.decks[key].filter ?? { traits: [], logic: 'OR' };
      }
    }
    return true;
  } catch (e) { console.warn('Load failed:', e); return false; }
}

function clearSavedState() { localStorage.removeItem('eldritch_codex'); }

function hasSavedSession() {
  try {
    const raw = localStorage.getItem('eldritch_codex');
    if (!raw) return false;
    const data = JSON.parse(raw);
    return data.version === SAVE_VERSION && data.phase === 'game';
  } catch { return false; }
}

// ============================================================
// EVENT WIRING
// ============================================================
function wireSetupEvents() {
  // Prelude dropdown
  el('prelude-select').addEventListener('change', e => {
    state.preludeIndex = e.target.value === '' ? null : parseInt(e.target.value, 10);
    updatePreludeInfo();
    saveState();
  });

  // Build button
  el('build-btn').addEventListener('click', () => {
    const ao = ANCIENT_ONES[state.ancientOneIndex];
    if (!ao) {
      const err = el('build-error');
      err.textContent = 'Please choose an Ancient One.';
      err.classList.remove('hidden');
      return;
    }
    el('build-error').classList.add('hidden');
    playSound('woodenThud');
    playSound('intro');
    startGame();
  });

  // Click outside AO detail to deselect (setup screen only)
  document.addEventListener('click', e => {
    if (el('setup-screen').classList.contains('hidden')) return;
    if (state.ancientOneIndex === null) return;
    if (e.target.closest('#ao-detail') || e.target.closest('.ao-card') || e.target.closest('.ao-random-btn')) return;
    state.ancientOneIndex = null;
    document.querySelectorAll('.ao-card').forEach(c => c.classList.remove('selected'));
    el('ao-detail').classList.remove('open');
    updateBuildButton();
  });

  // Session restore buttons
  el('load-session-btn')?.addEventListener('click', () => {
    if (!loadSavedState()) {
      alert('Could not load saved game — it may be from an older version. Starting fresh.');
      clearSavedState();
      el('session-section').style.display = 'none';
      return;
    }
    try {
      restoreGameScreen();
    } catch (e) {
      console.error('Restore failed:', e);
      alert('Error restoring game: ' + e.message + '. Starting fresh.');
      clearSavedState();
      el('session-section').style.display = 'none';
    }
  });
  el('new-game-from-load-btn')?.addEventListener('click', () => {
    clearSavedState();
    el('session-section').style.display = 'none';
  });
}

function wireGameEvents() {
  // Draw Mythos
  el('draw-mythos-btn').addEventListener('click', () => {
    if (state.mythosIndex >= state.mythosDeck.length) {
      alert('The Mythos deck is exhausted! The investigators have lost.');
      return;
    }
    drawMythosCard();
  });

  // Card actions
  el('dismiss-card-btn').addEventListener('click', () => { if (currentDrawnCard) dismissCard(currentDrawnCard.id); });
  el('to-play-card-btn').addEventListener('click', () => { if (currentDrawnCard) sendToPlay(currentDrawnCard.id); });

  // Lightbox
  el('lightbox-close').addEventListener('click', closeLightbox);
  el('lightbox-backdrop').addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  // Prelude banner
  el('prelude-banner-ack').addEventListener('click', acknowledgePreludeBanner);

  // New game
  el('new-game-btn').addEventListener('click', confirmNewGame);

  // Doom track
  el('doom-minus').addEventListener('click', () => {
    if (state.doom > 0) {
      state.doom--;
      renderDoom();
      saveState();
      if (state.doom === 0 && !state.awakened) setTimeout(triggerAwakening, 400);
    }
  });
  el('doom-plus').addEventListener('click', () => {
    state.doom++; renderDoom(); saveState();
  });

  // Mysteries counter
  el('mysteries-minus').addEventListener('click', () => {
    if (state.mysteries > 0) { state.mysteries--; renderMysteries(); saveState(); }
  });
  el('mysteries-plus').addEventListener('click', () => {
    const ao = state.ancientOneIndex !== null ? ANCIENT_ONES[state.ancientOneIndex] : null;
    const max = ao ? ao.mysteries : 99;
    if (state.mysteries < max) {
      state.mysteries++;
      renderMysteries();
      saveState();
      if (state.mysteries === max) setTimeout(triggerVictory, 500);
    }
  });

  // Secondary deck draw buttons
  document.querySelectorAll('.draw-one-btn').forEach(btn => {
    btn.addEventListener('click', () => drawOneCard(btn.dataset.deck));
  });
  document.querySelectorAll('.draw-keep-btn').forEach(btn => {
    btn.addEventListener('click', () => drawKeepOne(btn.dataset.deck));
  });

  // Sync logic button visual state from state (covers restore + new game default)
  document.querySelectorAll('.logic-btn').forEach(btn => {
    const current = state.decks[btn.dataset.deck]?.filter?.logic ?? 'OR';
    btn.classList.toggle('active', btn.dataset.val === current);
  });

  // AND/OR logic buttons
  document.querySelectorAll('.logic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const deckKey = btn.dataset.deck;
      const val     = btn.dataset.val;
      state.decks[deckKey].filter.logic = val;
      btn.closest('.logic-toggle-wrap').querySelectorAll('.logic-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.val === val);
      });
      saveState();
    });
  });

  // Cost filter (Assets)
  el('assets-cost-select')?.addEventListener('change', e => {
    state.decks.assets.filter.maxCost = e.target.value === '' ? null : parseInt(e.target.value, 10);
    saveState();
  });

  // Find by name inputs
  document.querySelectorAll('.find-input').forEach(input => {
    const deckKey = input.dataset.deck;
    input.addEventListener('input',  () => showFindResults(deckKey, input.value));
    input.addEventListener('blur',   () => setTimeout(() => hideFindResults(deckKey), 200));
    input.addEventListener('focus',  () => { if (input.value) showFindResults(deckKey, input.value); });
  });
}

// ============================================================
// RESTORE SAVED GAME
// ============================================================
function restoreGameScreen() {
  showScreen('game-screen');
  renderGameHeader();
  renderDoom();
  renderMysteries();
  renderAoGamePanel();
  if (state.awakened) _applyAwakenedState();
  renderPreludeInline();
  renderStageTracker();
  renderDeckLowWarning();
  renderInPlay();
  renderDiscardPile();
  renderAllSecondaryDecks();
  renderRound();
  renderTimer();
  startTimer();
}

// ============================================================
// VICTORY ANIMATION
// ============================================================

function triggerVictory() {
  const bossCard = el('victory-boss-card');
  const ao = state.ancientOneIndex !== null ? ANCIENT_ONES[state.ancientOneIndex] : null;
  if (!bossCard || !ao) return;

  playSound('aoVictory');
  // Flash mystery counter
  el('mysteries-display').classList.add('mystery-complete');

  // Inject overlay HTML into boss card
  bossCard.insertAdjacentHTML('beforeend', `
    <div class="victory-crack-overlay">
      <div class="victory-crack-line vcl-1"></div>
      <div class="victory-crack-line vcl-2"></div>
      <div class="victory-crack-line vcl-3"></div>
      <div class="victory-crack-line vcl-4"></div>
      <div class="victory-crack-line vcl-5"></div>
      <div class="victory-crack-line vcl-6"></div>
      <div class="victory-crack-line vcl-7"></div>
    </div>
    <div class="victory-seal-overlay">
      <div class="victory-seal-rays" id="victory-seal-rays"></div>
      <div class="victory-seal-ring vsr-1"></div>
      <div class="victory-seal-ring vsr-2"></div>
      <div class="victory-seal-ring vsr-3"></div>
      <div class="victory-seal-ring vsr-4"></div>
      <div class="victory-seal-outer">
        <svg viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="72"/>
          <circle cx="80" cy="80" r="68" stroke-dasharray="8 6"/>
          <line x1="80" y1="4" x2="80" y2="14"/><line x1="80" y1="146" x2="80" y2="156"/>
          <line x1="4" y1="80" x2="14" y2="80"/><line x1="146" y1="80" x2="156" y2="80"/>
          <line x1="24" y1="24" x2="31" y2="31"/><line x1="129" y1="129" x2="136" y2="136"/>
          <line x1="136" y1="24" x2="129" y2="31"/><line x1="31" y1="129" x2="24" y2="136"/>
          <line x1="48" y1="8" x2="50" y2="18"/><line x1="110" y1="142" x2="112" y2="152"/>
          <line x1="112" y1="8" x2="110" y2="18"/><line x1="50" y1="142" x2="48" y2="152"/>
          <line x1="8" y1="48" x2="18" y2="50"/><line x1="142" y1="110" x2="152" y2="112"/>
          <line x1="8" y1="112" x2="18" y2="110"/><line x1="142" y1="50" x2="152" y2="48"/>
        </svg>
      </div>
      <div class="victory-seal-glyph">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44"/>
          <circle cx="50" cy="50" r="36"/>
          <polygon points="50,10 80,65 20,65"/>
          <polygon points="50,90 20,35 80,35"/>
          <circle cx="50" cy="50" r="18"/>
          <line x1="50" y1="30" x2="50" y2="70"/>
          <line x1="30" y1="50" x2="70" y2="50"/>
        </svg>
      </div>
      <div class="victory-seal-center"></div>
    </div>
    <div class="victory-particle-container" id="victory-particles"></div>
  `);

  // Replace boss info panel content with victory banner
  const bossInfoPanel = el('game-ao-panel')?.querySelector('.boss-info-panel');
  if (bossInfoPanel) {
    _savedBossInfoHTML = bossInfoPanel.innerHTML;
    bossInfoPanel.innerHTML = `
      <div class="event-banner-panel">
        <div class="victory-title">Victory</div>
        <div class="victory-subtitle">The Ancient One has been banished</div>
        <div class="victory-ao-name">${ao.name} defeated</div>
        <div class="victory-dismiss-hint">Click anywhere to dismiss</div>
      </div>
    `;
  }

  // Generate particles and rays
  _generateVictoryParticles();
  _generateVictoryRays();

  // Screen flash + page shake
  const flash = document.createElement('div');
  flash.className = 'victory-screen-flash';
  flash.id = 'victory-screen-flash';
  document.body.appendChild(flash);

  setTimeout(() => {
    flash.classList.add('active');
    el('game-main-content')?.classList.add('victory-shaking');
  }, 500);

  // Activate defeated animations
  setTimeout(() => {
    bossCard.classList.add('defeated');
  }, 800);

  // Victory banner
  setTimeout(() => {
    el('victory-banner')?.classList.add('active');
  }, 100);

  // Click-to-dismiss overlay
  const overlay = document.createElement('div');
  overlay.id = 'victory-dismiss-overlay';
  overlay.className = 'victory-dismiss-overlay';
  overlay.addEventListener('click', dismissVictory);
  document.body.appendChild(overlay);
}

function _generateVictoryParticles() {
  const container = el('victory-particles');
  if (!container) return;
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'victory-particle';
    p.style.left   = (Math.random() * 100) + '%';
    p.style.top    = (20 + Math.random() * 60) + '%';
    p.style.setProperty('--tx', (Math.random() * 140 - 70) + 'px');
    p.style.setProperty('--ty', -(80 + Math.random() * 140) + 'px');
    p.style.setProperty('--dur', (1.5 + Math.random() * 2) + 's');
    p.style.setProperty('--delay', (0.6 + Math.random() * 1.5) + 's');
    const size = (2 + Math.random() * 4) + 'px';
    p.style.width = size; p.style.height = size;
    container.appendChild(p);
  }
}

function _generateVictoryRays() {
  const container = el('victory-seal-rays');
  if (!container) return;
  for (let i = 0; i < 24; i++) {
    const ray = document.createElement('div');
    ray.className = 'victory-seal-ray';
    const angle = (i * 15) + (Math.random() * 8 - 4);
    ray.style.transform = `rotate(${angle}deg)`;
    ray.style.setProperty('--ray-dur', (0.6 + Math.random() * 0.8) + 's');
    ray.style.setProperty('--ray-delay', (1 + Math.random() * 0.8) + 's');
    ray.style.width = (1 + Math.random()) + 'px';
    container.appendChild(ray);
  }
}

function dismissVictory() {
  SFX.aoVictory.pause();
  SFX.aoVictory.currentTime = 0;
  const bossCard = el('victory-boss-card');
  if (bossCard) {
    bossCard.classList.remove('defeated');
    bossCard.querySelectorAll('.victory-crack-overlay, .victory-seal-overlay, .victory-particle-container').forEach(el => el.remove());
    const img = bossCard.querySelector('.boss-card-image');
    if (img) { img.style.filter = ''; img.style.opacity = ''; }
  }
  // Restore boss info panel
  const bossInfoPanel = el('game-ao-panel')?.querySelector('.boss-info-panel');
  if (bossInfoPanel && _savedBossInfoHTML !== null) {
    bossInfoPanel.innerHTML = _savedBossInfoHTML;
    _savedBossInfoHTML = null;
  }
  el('victory-screen-flash')?.remove();
  el('victory-dismiss-overlay')?.remove();
  el('mysteries-display')?.classList.remove('mystery-complete');
  el('game-main-content')?.classList.remove('victory-shaking');
}

// ============================================================
// DOOM / AWAKENING ANIMATION
// ============================================================

function triggerAwakening() {
  const bossCard = el('victory-boss-card');
  const ao = state.ancientOneIndex !== null ? ANCIENT_ONES[state.ancientOneIndex] : null;
  if (!bossCard || !ao) return;

  state.awakened = true;
  saveState();
  playSound('aoAwaken');

  // Inject doom overlays into boss card
  bossCard.insertAdjacentHTML('afterbegin', `
    <div class="doom-crack-overlay">
      <div class="doom-crack doom-crack-t1"></div><div class="doom-crack doom-crack-t2"></div><div class="doom-crack doom-crack-t3"></div>
      <div class="doom-crack doom-crack-b1"></div><div class="doom-crack doom-crack-b2"></div>
      <div class="doom-crack doom-crack-l1"></div><div class="doom-crack doom-crack-l2"></div><div class="doom-crack doom-crack-l3"></div>
      <div class="doom-crack doom-crack-r1"></div><div class="doom-crack doom-crack-r2"></div>
      <div class="doom-crack doom-crack-c1"></div><div class="doom-crack doom-crack-c2"></div>
      <div class="doom-crack doom-crack-c3"></div><div class="doom-crack doom-crack-c4"></div>
      <div class="doom-crack doom-crack-br1"></div><div class="doom-crack doom-crack-br2"></div>
      <div class="doom-crack doom-crack-br3"></div><div class="doom-crack doom-crack-br4"></div>
    </div>
    <div class="doom-eyes"><div class="doom-eye"></div><div class="doom-eye"></div></div>
    <div class="ember-container" id="doom-ember-container"></div>
  `);

  // Create screen effects
  const flash    = document.createElement('div'); flash.id = 'doom-flash'; flash.className = 'doom-flash'; document.body.appendChild(flash);
  const vignette = document.createElement('div'); vignette.id = 'doom-vignette'; vignette.className = 'doom-vignette'; document.body.appendChild(vignette);

  // Replace boss info panel with awakens banner
  const bossInfoPanel = el('game-ao-panel')?.querySelector('.boss-info-panel');
  if (bossInfoPanel && _savedBossInfoHTML === null) {
    _savedBossInfoHTML = bossInfoPanel.innerHTML;
    bossInfoPanel.innerHTML = `
      <div class="event-banner-panel doom-panel" id="awakens-banner">
        <div class="awakens-title">Awakened</div>
        <div class="awakens-subtitle">The Ancient One stirs from its slumber</div>
        <div class="awakens-ao-name">${ao.name} has risen</div>
        <div class="victory-dismiss-hint">Click anywhere to continue</div>
      </div>
    `;
  }

  // Create dismiss overlay
  const overlay = document.createElement('div');
  overlay.id = 'doom-dismiss-overlay';
  overlay.className = 'doom-dismiss-overlay';
  overlay.addEventListener('click', dismissAwakening);
  document.body.appendChild(overlay);

  // Sequence
  setTimeout(() => {
    flash.classList.add('active');
    el('game-main-content')?.classList.add('doom-shaking');
    vignette.classList.add('active');
  }, 400);

  setTimeout(() => {
    bossCard.classList.add('awakened');
    _generateDoomEmbers(false);
    el('doom-display').classList.add('zero');
  }, 600);

  setTimeout(() => {
    _generateDoomEmbers(true);
    _doomEmberInterval = setInterval(() => _generateDoomEmbers(true), 4000);
  }, 3000);

}

function _generateDoomEmbers(looping) {
  const container = document.getElementById('doom-ember-container');
  if (!container) return;
  if (!looping) container.innerHTML = '';
  const count = looping ? 15 : 35;
  for (let i = 0; i < count; i++) {
    const e = document.createElement('div');
    const t = Math.random();
    e.className = 'ember ' + (t < 0.4 ? 'hot' : t < 0.7 ? 'warm' : 'cool');
    if (looping) e.classList.add('looping');
    e.style.left = (10 + Math.random() * 80) + '%';
    e.style.top  = (30 + Math.random() * 50) + '%';
    e.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
    e.style.setProperty('--ty', -(60 + Math.random() * 120) + 'px');
    e.style.setProperty('--dur', (1.5 + Math.random() * 2) + 's');
    e.style.setProperty('--delay', (looping ? Math.random() * 3 : (0.4 + Math.random() * 1.2)) + 's');
    const sz = (2 + Math.random() * 4) + 'px';
    e.style.width = sz; e.style.height = sz;
    container.appendChild(e);
  }
}

function dismissAwakening() {
  const vignette = document.getElementById('doom-vignette');
  const hint     = document.getElementById('doom-dismiss-hint');
  const overlay  = document.getElementById('doom-dismiss-overlay');

  if (vignette) { vignette.style.transition = 'opacity 1s'; vignette.style.opacity = '0'; setTimeout(() => vignette.remove(), 1100); }
  if (hint)     hint.remove();
  if (overlay)  overlay.remove();
  el('game-main-content')?.classList.remove('doom-shaking');

  // Restore boss info panel (card visual effects persist)
  const bossInfoPanel = el('game-ao-panel')?.querySelector('.boss-info-panel');
  if (bossInfoPanel && _savedBossInfoHTML !== null) {
    const inner = bossInfoPanel.querySelector('.event-banner-panel');
    if (inner) { inner.style.transition = 'opacity 0.5s'; inner.style.opacity = '0'; }
    setTimeout(() => {
      if (bossInfoPanel && _savedBossInfoHTML !== null) {
        bossInfoPanel.innerHTML = _savedBossInfoHTML;
        _savedBossInfoHTML = null;
      }
    }, 500);
  }
  // Card stays awakened — embers, eyes, aura, border persist
}

function _applyAwakenedState() {
  const bossCard = el('victory-boss-card');
  if (!bossCard || bossCard.classList.contains('awakened')) return;

  bossCard.insertAdjacentHTML('afterbegin', `
    <div class="doom-crack-overlay">
      <div class="doom-crack doom-crack-t1"></div><div class="doom-crack doom-crack-t2"></div><div class="doom-crack doom-crack-t3"></div>
      <div class="doom-crack doom-crack-b1"></div><div class="doom-crack doom-crack-b2"></div>
      <div class="doom-crack doom-crack-l1"></div><div class="doom-crack doom-crack-l2"></div><div class="doom-crack doom-crack-l3"></div>
      <div class="doom-crack doom-crack-r1"></div><div class="doom-crack doom-crack-r2"></div>
      <div class="doom-crack doom-crack-c1"></div><div class="doom-crack doom-crack-c2"></div>
      <div class="doom-crack doom-crack-c3"></div><div class="doom-crack doom-crack-c4"></div>
      <div class="doom-crack doom-crack-br1"></div><div class="doom-crack doom-crack-br2"></div>
      <div class="doom-crack doom-crack-br3"></div><div class="doom-crack doom-crack-br4"></div>
    </div>
    <div class="doom-eyes"><div class="doom-eye"></div><div class="doom-eye"></div></div>
    <div class="ember-container" id="doom-ember-container"></div>
  `);
  bossCard.classList.add('awakened');
  el('doom-display').classList.add('zero');

  // Start looping embers immediately (no intro burst on restore)
  _generateDoomEmbers(true);
  _doomEmberInterval = setInterval(() => _generateDoomEmbers(true), 4000);
}

// ============================================================
// INIT
// ============================================================
function init() {
  if (hasSavedSession()) {
    el('session-section').style.display = '';
  }

  renderExpansionGrid();
  renderDifficultyGrid();
  renderPreludeDropdown();
  renderAoGrid();
  renderInvGrid();
  updateBuildButton();

  wireSetupEvents();
  wireGameEvents();
  initCollapsibles();

  showScreen('setup-screen');
}

window.addEventListener('DOMContentLoaded', init);
