'use strict';

// ---------------------------------------------------------------------------
// Prelude data — 40 unique preludes across 6 expansions
// expId:        matches EXPANSIONS array (2=MoM, 3=SR, 4=UtP, 5=SoC, 6=TD, 7=CiR, 8=MoN)
// placesMythos: true if this prelude requires a Mythos/Rumor card to be placed
//               in play at setup (bypassing normal draw resolution)
// ---------------------------------------------------------------------------
const PRELUDES = [
  // Mountains of Madness (expId: 2)
  {
    name: 'Beginning of the End',
    expId: 2,
    mechanic: 'Azathoth — Eldritch tokens are placed on the green Omen space at setup.',
    placesMythos: false
  },
  {
    name: 'Doomsayer from Antarctica',
    expId: 2,
    mechanic: 'Play with the Antarctica side board. Rise of the Elder Things adventures are used.',
    placesMythos: false
  },
  {
    name: 'Key to Salvation',
    expId: 2,
    mechanic: 'Each investigator may spend 1 Sanity to gain a Task Unique Asset during setup.',
    placesMythos: false
  },
  {
    name: 'Rumors from the North',
    expId: 2,
    mechanic: 'Ithaqua — The Wind-Walker Rumor Mythos card is placed in play at setup. Clues are not spawned from it.',
    placesMythos: true
  },
  {
    name: 'Ultimate Sacrifice',
    expId: 2,
    mechanic: 'Defeated investigators may be added back into the game during setup.',
    placesMythos: false
  },
  {
    name: 'Unwilling Sacrifice',
    expId: 2,
    mechanic: 'Each investigator may spend 1 Health to gain a Character Unique Asset during setup.',
    placesMythos: false
  },

  // Strange Remnants (expId: 3)
  {
    name: 'Dark Blessings',
    expId: 3,
    mechanic: 'Each investigator gains a Deal Condition, which they may use to obtain a Boon Condition.',
    placesMythos: false
  },
  {
    name: 'In Cosmic Alignment',
    expId: 3,
    mechanic: 'Play with the Mystic Ruins encounter deck. Syzygy / Cosmic Alignment adventures are used.',
    placesMythos: false
  },
  {
    name: 'The Coming Storm',
    expId: 3,
    mechanic: 'Each time investigators resolve a Mythos effect during setup they gain 2 bonuses.',
    placesMythos: false
  },
  {
    name: 'The Dunwich Horror',
    expId: 3,
    mechanic: 'Yog-Sothoth — The Dunwich Horror Epic Monster is placed in play at setup.',
    placesMythos: false
  },
  {
    name: 'Call of Cthulhu',
    expId: 3,
    mechanic: 'Cthulhu — Cthylla Epic Monster is placed in play at setup.',
    placesMythos: false
  },
  {
    name: 'Drastic Measures',
    expId: 3,
    mechanic: 'Each investigator improves 2 skills of their choice and impairs 3 others.',
    placesMythos: false
  },

  // Under the Pyramids (expId: 4)
  {
    name: 'Epidemic',
    expId: 4,
    mechanic: 'Abhoth — Child of Abhoth Epic Monster is placed on the board at setup.',
    placesMythos: false
  },
  {
    name: 'Ghost from the Past',
    expId: 4,
    mechanic: 'Each investigator gains starting possessions from a random investigator and the Haunted Condition.',
    placesMythos: false
  },
  {
    name: 'Litany of Secrets',
    expId: 4,
    mechanic: 'Play with 2 Expedition Encounter decks instead of 1.',
    placesMythos: false
  },
  {
    name: 'Under the Pyramids',
    expId: 4,
    mechanic: 'Play with the Egypt side board. Nephren-Ka / Museum Heist adventures are used.',
    placesMythos: false
  },
  {
    name: 'The King in Yellow',
    expId: 4,
    mechanic: 'Hastur — The King in Yellow Rumor Mythos card is placed in play at setup. Clues are not spawned from it.',
    placesMythos: true
  },

  // Signs of Carcosa (expId: 5)
  {
    name: 'Silver Twilight Stockpile',
    expId: 5,
    mechanic: 'One additional Asset card is placed in the reserve during setup.',
    placesMythos: false
  },
  {
    name: 'Sins of the Past',
    expId: 5,
    mechanic: 'Each investigator accepts a malus to gain the Promise of Power Condition.',
    placesMythos: false
  },
  {
    name: 'Weakness to Strength',
    expId: 5,
    mechanic: 'Each investigator impairs one skill to draw a beneficial card.',
    placesMythos: false
  },
  {
    name: 'Written in the Stars',
    expId: 5,
    mechanic: 'Play with the top Gate card revealed at all times.',
    placesMythos: false
  },

  // The Dreamlands (expId: 6)
  {
    name: 'Lurker Among Us',
    expId: 6,
    mechanic: 'A Doppelganger Epic Monster is placed in play at setup.',
    placesMythos: false
  },
  {
    name: 'Twin Blasphemies of the Black Goat',
    expId: 6,
    mechanic: 'Shub-Niggurath — Nug and Yeb Epic Monsters are both placed in play at setup.',
    placesMythos: false
  },
  {
    name: 'Web Between Worlds',
    expId: 6,
    mechanic: 'Atlach-Nacha — Web Between Worlds Rumor Mythos card is placed in play at setup. Clues are not spawned from it.',
    placesMythos: true
  },
  {
    name: 'Otherworldly Dreams',
    expId: 6,
    mechanic: 'Play with the Dreamlands side board. Hypnos / Otherworldly Dreams adventures are used.',
    placesMythos: false
  },
  {
    name: 'Focused Training',
    expId: 6,
    mechanic: 'Investigators may gain Talent Conditions from the reserve during Acquire Assets steps.',
    placesMythos: false
  },

  // Cities in Ruin (expId: 7)
  {
    name: 'Apocalypse Nigh',
    expId: 7,
    mechanic: "Shudde M'ell — Disasters advance on the Doom track instead of the usual method.",
    placesMythos: false
  },
  {
    name: 'Fall of Man',
    expId: 7,
    mechanic: 'Disasters are placed on the green Omen space at setup.',
    placesMythos: false
  },
  {
    name: 'The Price of Prestige',
    expId: 7,
    mechanic: 'Investigators may gain Task Unique Assets from the reserve during Acquire Assets steps.',
    placesMythos: false
  },
  {
    name: 'You Know What You Must Do',
    expId: 7,
    mechanic: 'Each investigator gains the For the Greater Good Unique Asset at setup.',
    placesMythos: false
  },

  // Masks of Nyarlathotep (expId: 8)
  {
    name: 'Aid of the Elder Gods',
    expId: 8,
    mechanic: 'Play with the Dreamlands side board. Nyarlathotep / Corruption Condition rules apply.',
    placesMythos: false
  },
  {
    name: 'The Archives',
    expId: 8,
    mechanic: 'Investigators may gain Spell cards from the reserve during Acquire Assets steps.',
    placesMythos: false
  },
  {
    name: 'Army of Darkness',
    expId: 8,
    mechanic: 'Zombie Monsters are spawned across the board at setup.',
    placesMythos: false
  },
  {
    name: 'Father of Serpents',
    expId: 8,
    mechanic: 'Yig — Serpent People Monsters are placed in play at setup.',
    placesMythos: false
  },
  {
    name: 'Harbinger of the Outer Gods',
    expId: 8,
    mechanic: 'Nyarlathotep — Each investigator gains a Corruption Condition at setup.',
    placesMythos: false
  },
  {
    name: 'In the Lightless Chamber',
    expId: 8,
    mechanic: 'Play with the Egypt side board. Nyarlathotep / The Beast Epic Monster is placed in play.',
    placesMythos: false
  },
  {
    name: 'The Stars Align',
    expId: 8,
    mechanic: 'Antediluvium — Investigators lose 1 Sanity whenever the Omen advances to the blue space.',
    placesMythos: false
  },
  {
    name: 'Temptation',
    expId: 8,
    mechanic: 'Investigators may gain a Corruption Condition during setup to gain a bonus.',
    placesMythos: false
  },
  {
    name: 'Unto the Breach',
    expId: 8,
    mechanic: 'The Ancient One is always considered awake for the purpose of card effects.',
    placesMythos: false
  },
  {
    name: 'Wondrous Curios',
    expId: 8,
    mechanic: 'Investigators may gain Relic Unique Assets from the reserve during Acquire Assets steps.',
    placesMythos: false
  }
];
