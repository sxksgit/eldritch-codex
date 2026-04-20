'use strict';

// ---------------------------------------------------------------------------
// Expansion map: letter code in card strings → expansion ID (0-8)
// ---------------------------------------------------------------------------
const EXP_CODE_TO_ID = {
  B: 0, // Eldritch Horror (base)
  L: 1, // Forsaken Lore
  M: 2, // Mountains of Madness
  R: 3, // Strange Remnants
  P: 4, // Under the Pyramids
  C: 5, // Signs of Carcosa
  D: 6, // The Dreamlands
  S: 7, // Cities in Ruin
  N: 8  // Masks of Nyarlathotep
};

const EXPANSIONS = [
  { id: 0, name: 'Eldritch Horror',          code: 'B',    icon: 'eldritchhorror.png'    },
  { id: 1, name: 'Forsaken Lore',            code: 'L',    icon: 'forsakenlore.png'      },
  { id: 2, name: 'Mountains of Madness',     code: 'M',    icon: 'mountainsofmadness.png'},
  { id: 3, name: 'Strange Remnants',         code: 'R',    icon: 'strangeremnants.png'   },
  { id: 4, name: 'Under the Pyramids',       code: 'P',    icon: 'underthepyramids.png'  },
  { id: 5, name: 'Signs of Carcosa',         code: 'C',    icon: 'signsofcarcossa.png'   },
  { id: 6, name: 'The Dreamlands',           code: 'D',    icon: 'dreamlands.png'        },
  { id: 7, name: 'Cities in Ruin',           code: 'S',    icon: 'citiesInRuins.png'     },
  { id: 8, name: 'Masks of Nyarlathotep',    code: 'N',    icon: 'mon.png'               }
];

// ---------------------------------------------------------------------------
// All 217 Mythos card strings
// Format: COLOR-ID-DIFFICULTY+EXPANSION[ELDRITCH][c]
//   COLOR:      blue / gren / yelw
//   DIFFICULTY: E=Easy  N=Normal  H=Hard
//   EXPANSION:  see EXP_CODE_TO_ID above
//   ELDRITCH:   digit(s) = starting tokens  |  - = ongoing but no tokens  |  absent = event (gren/yelw)
//   c:          card can hold Clue tokens
// Blue  = always Ongoing
// Green = Ongoing if eldritch field present, Event otherwise
// Yellow= always Event
// ---------------------------------------------------------------------------
const MYTHOS_CARD_STRINGS = [
  // Blue (47)
  'blue-00-HR4c','blue-01-HR2', 'blue-02-NR-', 'blue-03-NR4', 'blue-04-ER3',
  'blue-05-NM3', 'blue-06-EM5', 'blue-07-HM-', 'blue-08-HM3', 'blue-09-NM-',
  'blue-10-NM4', 'blue-11-HL3', 'blue-12-NL-', 'blue-13-EB3', 'blue-14-HB-',
  'blue-15-HB8', 'blue-16-HB3', 'blue-17-NB-', 'blue-18-HB0', 'blue-19-NB4',
  'blue-20-NB-c','blue-21-EB-', 'blue-22-NB4', 'blue-23-EB4', 'blue-24-EB4',
  'blue-25-ED-', 'blue-26-ND3', 'blue-27-ND3', 'blue-28-ND3c','blue-29-HD-',
  'blue-30-HD3', 'blue-31-NC-c','blue-32-HC2', 'blue-33-HC5', 'blue-34-NC3',
  'blue-35-NC1', 'blue-36-HP-', 'blue-37-EP-', 'blue-38-NP4', 'blue-39-EP3',
  'blue-40-HP0', 'blue-41-NP4', 'blue-42-EC4', 'blue-43-HS-', 'blue-44-NS3',
  'blue-45-ES3', 'blue-46-HN0',
  // Green (78)
  'gren-00-ER',  'gren-01-ER',  'gren-02-NR-', 'gren-03-NR-', 'gren-04-NR',
  'gren-05-HR-', 'gren-06-HR',  'gren-07-EP-', 'gren-08-EP',  'gren-09-NP',
  'gren-10-NP',  'gren-11-HM',  'gren-12-NM',  'gren-13-NL',  'gren-14-HM',
  'gren-15-HL',  'gren-16-NB',  'gren-17-EB',  'gren-18-EB',  'gren-19-HB-',
  'gren-20-NB',  'gren-21-NB-', 'gren-22-EB',  'gren-23-HM',  'gren-24-EB',
  'gren-25-HB',  'gren-26-EB',  'gren-27-HB',  'gren-28-NB',  'gren-29-HB',
  'gren-30-NB',  'gren-31-HB',  'gren-32-NB',  'gren-33-NB-', 'gren-34-EM',
  'gren-35-NB',  'gren-36-EM',  'gren-37-NM',  'gren-38-NM-', 'gren-39-NM-',
  'gren-40-ED',  'gren-41-ED',  'gren-42-ND',  'gren-43-ND-', 'gren-44-ND-',
  'gren-45-HD',  'gren-46-HD',  'gren-47-HD',  'gren-48-NC-', 'gren-49-NC',
  'gren-50-NC',  'gren-51-EC',  'gren-52-EC',  'gren-54-HC-', 'gren-55-HC',
  'gren-56-NC-', 'gren-59-HP',  'gren-60-HP',  'gren-61-HP-', 'gren-62-NP',
  'gren-63-HS',  'gren-64-HS-', 'gren-65-NS',  'gren-66-NS',  'gren-67-NS-',
  'gren-68-NS',  'gren-69-HS-', 'gren-70-ES',  'gren-71-ES-', 'gren-72-NN',
  'gren-73-EN',  'gren-74-EN',  'gren-75-NN',  'gren-76-EN',  'gren-77-NN',
  'gren-78-HN',  'gren-79-HN',  'gren-80-NN-',
  // Yellow (92)
  'yelw-00-NR',  'yelw-01-ER',  'yelw-02-ER',  'yelw-03-HR',  'yelw-04-NR',
  'yelw-05-NR',  'yelw-06-HR',  'yelw-07-HR',  'yelw-08-HP',  'yelw-09-NP',
  'yelw-10-NP',  'yelw-11-NP',  'yelw-12-HP',  'yelw-13-HP',  'yelw-14-NM',
  'yelw-15-HM',  'yelw-16-HM',  'yelw-17-HM',  'yelw-18-HM',  'yelw-19-EM',
  'yelw-20-NM',  'yelw-21-EM',  'yelw-22-EM',  'yelw-23-NM',  'yelw-24-NM',
  'yelw-25-NL',  'yelw-26-HL',  'yelw-27-NB',  'yelw-28-HB',  'yelw-29-HB',
  'yelw-30-NB',  'yelw-31-NB',  'yelw-32-NB',  'yelw-33-NB',  'yelw-34-EB',
  'yelw-35-HB',  'yelw-36-EB',  'yelw-37-EB',  'yelw-38-HB',  'yelw-39-NB',
  'yelw-40-NB',  'yelw-41-NB',  'yelw-42-EB',  'yelw-43-NB',  'yelw-44-HB',
  'yelw-45-EB',  'yelw-46-NB',  'yelw-47-NB',  'yelw-48-ED',  'yelw-49-ED',
  'yelw-50-ND',  'yelw-51-ND',  'yelw-52-ND',  'yelw-53-ND',  'yelw-54-ND',
  'yelw-55-HD',  'yelw-56-HD',  'yelw-57-HD',  'yelw-58-NC',  'yelw-59-NC',
  'yelw-60-NC',  'yelw-61-EC',  'yelw-62-EC',  'yelw-63-HC',  'yelw-64-HC',
  'yelw-65-HC',  'yelw-66-NC',  'yelw-67-NC',  'yelw-68-EP',  'yelw-69-EP',
  'yelw-70-HS',  'yelw-71-HS',  'yelw-72-HS',  'yelw-73-NS',  'yelw-74-NS',
  'yelw-75-NS',  'yelw-76-NS',  'yelw-77-HS',  'yelw-78-NS',  'yelw-79-ES',
  'yelw-80-ES',  'yelw-81-ES',  'yelw-82-NN',  'yelw-83-EN',  'yelw-84-EN',
  'yelw-85-EN',  'yelw-86-HN',  'yelw-87-NN',  'yelw-88-HN',  'yelw-89-NN',
  'yelw-90-NN',  'yelw-91-HN'
];

// ---------------------------------------------------------------------------
// Parse a card string into a structured object
// ---------------------------------------------------------------------------
function parseMythosCard(str) {
  const m = str.match(/^(blue|gren|yelw)-(\d+)-([ENH])([A-Z])(\d+|-)?(c?)$/);
  if (!m) { console.warn('Unparseable card:', str); return null; }
  const [, color, numId, difficulty, expCode, eldritchRaw, clues] = m;
  const isOngoing  = color === 'blue' || (color === 'gren' && eldritchRaw !== undefined);
  // hasTokens: card tracks eldritch/rumor tokens (digit present, including 0 — not the bare '-' which means ongoing but no token tracking)
  const hasTokens  = eldritchRaw !== undefined && eldritchRaw !== '-';
  return {
    id:         str,
    color,
    numId,
    difficulty,                             // E / N / H
    expCode,
    expId:      EXP_CODE_TO_ID[expCode] ?? 0,
    eldritch:   eldritchRaw === '-' ? 0 : (eldritchRaw ? parseInt(eldritchRaw, 10) : null),
    hasClues:   clues === 'c',
    hasTokens,
    isOngoing,
    imagePath:  `cards/${str}.jpg`
  };
}

// Pre-parse all cards
const MYTHOS_CARDS = MYTHOS_CARD_STRINGS.map(parseMythosCard).filter(Boolean);

// ---------------------------------------------------------------------------
// Ancient Ones
// expId: which expansion the AO requires to be enabled (0 = always available)
// counts: [G1,Y1,B1, G2,Y2,B2, G3,Y3,B3]
// doom: starting doom tokens
// mysteries: number of mysteries to solve
// difficulty: 1 (easy) – 5 (brutal)
// ---------------------------------------------------------------------------
const ANCIENT_ONES = [
  {
    name: 'Azathoth',
    expId: 0,
    counts: [1,2,1, 2,3,1, 2,4,0],
    doom: 15, mysteries: 3, difficulty: 5
  },
  {
    name: 'Cthulhu',
    expId: 0,
    counts: [0,2,2, 1,3,0, 3,4,0],
    doom: 12, mysteries: 3, difficulty: 3
  },
  {
    name: 'Shub-Niggurath',
    expId: 0,
    counts: [1,2,1, 3,2,1, 2,4,0],
    doom: 13, mysteries: 3, difficulty: 2
  },
  {
    name: 'Yog-Sothoth',
    expId: 0,
    counts: [0,2,1, 2,3,1, 3,4,0],
    doom: 14, mysteries: 3, difficulty: 3
  },
  {
    name: 'Yig',
    expId: 1,
    counts: [1,2,1, 2,3,1, 2,4,0],
    doom: 10, mysteries: 3, difficulty: 2
  },
  {
    name: 'Ithaqua',
    expId: 2,
    counts: [0,2,2, 4,2,0, 2,4,0],
    doom: 13, mysteries: 3, difficulty: 3
  },
  {
    name: 'Rise of the Elder Things',
    expId: 2,
    counts: [2,2,1, 3,3,1, 4,4,0],
    doom: 16, mysteries: 4, difficulty: 4
  },
  {
    name: 'Syzygy',
    expId: 3,
    counts: [0,2,2, 3,3,0, 3,5,0],
    doom: 13, mysteries: 3, difficulty: 3
  },
  {
    name: 'Nephren-Ka',
    expId: 4,
    counts: [0,2,2, 1,3,0, 3,4,0],
    doom: 12, mysteries: 3, difficulty: 3
  },
  {
    name: 'Abhoth',
    expId: 4,
    counts: [1,2,1, 3,2,1, 2,4,0],
    doom: 14, mysteries: 3, difficulty: 3
  },
  {
    name: 'Hastur',
    expId: 5,
    counts: [0,2,2, 2,3,0, 3,5,0],
    doom: 11, mysteries: 2, difficulty: 4
  },
  {
    name: 'Hypnos',
    expId: 6,
    counts: [0,2,1, 2,3,1, 3,4,0],
    doom: 12, mysteries: 3, difficulty: 2
  },
  {
    name: 'Atlach-Nacha',
    expId: 6,
    counts: [1,2,1, 3,2,1, 2,4,0],
    doom: 9, mysteries: 3, difficulty: 3
  },
  {
    name: "Shudde M'ell",
    expId: 7,
    counts: [0,2,2, 4,2,0, 2,4,0],
    doom: 15, mysteries: 3, difficulty: 3
  },
  {
    name: 'Antediluvium',
    expId: 8,
    counts: [1,2,1, 2,3,1, 2,4,0],
    doom: 13, mysteries: 3, difficulty: 4
  },
  {
    name: 'Nyarlathotep',
    expId: 8,
    counts: [1,2,1, 2,3,1, 2,4,0],
    doom: 12, mysteries: 2, difficulty: 4
  }
];
