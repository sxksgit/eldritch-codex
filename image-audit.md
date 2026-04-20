# Card Image Audit

Cross-reference of downloaded wiki images against card data in `data_artifact.js`, `data_non_unique_asset.js`, `data_condition.js`, `data_spell.js`, and `data_unique_asset.js`.

**Expected filename convention:** `Card_Name.png` (spaces → underscores, special characters preserved)

---

## Summary

| Deck | Unique Cards | Exact Match | Case Mismatch | Missing | Images on Disk |
|---|---|---|---|---|---|
| Artifact | 54 | 53 | 1 | 0 | 54 |
| Asset | 168 | 168 | 0 | 0 | 168 |
| Condition | 48 | 48 | 0 | 0 | 48 |
| Spell | 36 | 36 | 0 | 0 | 48* |
| Unique Asset | 87 | 87 | 0 | 0 | 89** |

\* 48 on disk because `_Front` variants were kept alongside the clean copies (e.g. `Alter_Fate_Front.png` and `Alter_Fate.png` both exist)  
\*\* 89 on disk because `_Unique_Asset` variants were kept alongside the clean copies (e.g. `Eye_of_Light_Unique_Asset.png` and `Eye_of_Light.png` both exist)

---

## Issues

### ⚠️ Case Mismatch (1)

These cards have an image on disk but the filename casing doesn't match what the data would generate. Depending on the OS/filesystem this may or may not cause a load failure (Linux is case-sensitive, Windows is not).

| Deck | Card Name | Expected Filename | Actual Filename on Disk |
|---|---|---|---|
| Artifact | King In Yellow | `King_In_Yellow.png` | ~~`King_in_Yellow.png`~~ → renamed, resolved |

> The data file uses `"King In Yellow"` (capital I) but the wiki image is named `King_in_Yellow.png` (lowercase i). On Windows this will work fine; on a Linux server it will fail.

---

## Full Card → Image Mapping

### Artifacts (`images/artifacts/`) — 54 cards, 53 exact matches

| Status | Card Name | Expected File |
|---|---|---|
| ✅ | Alien Device | `Alien_Device.png` |
| ✅ | Black Book | `Black_Book.png` |
| ✅ | Black Fan | `Black_Fan.png` |
| ✅ | Bone Pipes | `Bone_Pipes.png` |
| ✅ | Book of the Dead | `Book_of_the_Dead.png` |
| ✅ | Crux of Cykranosh | `Crux_of_Cykranosh.png` |
| ✅ | Crystal of the Elder Things | `Crystal_of_the_Elder_Things.png` |
| ✅ | Crystallizer of Dreams | `Crystallizer_of_Dreams.png` |
| ✅ | Cultes des Goules | `Cultes_des_Goules.png` |
| ✅ | Cursed Sphere | `Cursed_Sphere.png` |
| ✅ | De Vermis Mysteriis | `De_Vermis_Mysteriis.png` |
| ✅ | Dhol Chants | `Dhol_Chants.png` |
| ✅ | Dragon Idol | `Dragon_Idol.png` |
| ✅ | Elder Key | `Elder_Key.png` |
| ✅ | Elixir of Life | `Elixir_of_Life.png` |
| ✅ | Eltdown Shards | `Eltdown_Shards.png` |
| ✅ | Fetch Stick | `Fetch_Stick.png` |
| ✅ | Flute of the Outer Gods | `Flute_of_the_Outer_Gods.png` |
| ✅ | G'harne Fragments | `G'harne_Fragments.png` |
| ✅ | Gate Box | `Gate_Box.png` |
| ✅ | Glass of Mortlan | `Glass_of_Mortlan.png` |
| ✅ | Grotesque Statue | `Grotesque_Statue.png` |
| ✅ | Heart of Winter | `Heart_of_Winter.png` |
| ✅ | Hemisphere Map | `Hemisphere_Map.png` |
| ✅ | Hyperborean Crystal | `Hyperborean_Crystal.png` |
| ✅ | Key to Carcosa | `Key_to_Carcosa.png` |
| ✅ | Khopesh of the Abyss | `Khopesh_of_the_Abyss.png` |
| ✅ | King In Yellow | `King_In_Yellow.png` — resolved (file renamed) |
| ✅ | Lightning Gun | `Lightning_Gun.png` |
| ✅ | Livre d'Ivon | `Livre_d'Ivon.png` |
| ✅ | Mask of Sthenelus | `Mask_of_Sthenelus.png` |
| ✅ | Mask of the Watcher | `Mask_of_the_Watcher.png` |
| ✅ | Massa di Requiem per Shuggay | `Massa_di_Requiem_per_Shuggay.png` |
| ✅ | Mi-go Brain Case | `Mi-go_Brain_Case.png` |
| ✅ | Milk of Shub-Niggurath | `Milk_of_Shub-Niggurath.png` |
| ✅ | Necronomicon | `Necronomicon.png` |
| ✅ | Pallid Mask | `Pallid_Mask.png` |
| ✅ | Pentacle of Planes | `Pentacle_of_Planes.png` |
| ✅ | Pnakotic Manuscripts | `Pnakotic_Manuscripts.png` |
| ✅ | Ruby of R'lyeh | `Ruby_of_R'lyeh.png` |
| ✅ | Satchel of the Void | `Satchel_of_the_Void.png` |
| ✅ | Scales of Thoth | `Scales_of_Thoth.png` |
| ✅ | Serpent Crown | `Serpent_Crown.png` |
| ✅ | Shining Trapezohedron | `Shining_Trapezohedron.png` |
| ✅ | Sword of Saint Jerome | `Sword_of_Saint_Jerome.png` |
| ✅ | Sword of Y'ha-Talla | `Sword_of_Y'ha-Talla.png` |
| ✅ | T'tka Halot | `T'tka_Halot.png` |
| ✅ | Tattered Cloak | `Tattered_Cloak.png` |
| ✅ | The Silver Key | `The_Silver_Key.png` |
| ✅ | Tikkoun Elixir | `Tikkoun_Elixir.png` |
| ✅ | True Magick | `True_Magick.png` |
| ✅ | Twin Scepters | `Twin_Scepters.png` |
| ✅ | Vach-Viraj Chant | `Vach-Viraj_Chant.png` |
| ✅ | Zanthu Tablets | `Zanthu_Tablets.png` |

---

### Assets (`images/assets/`) — 168 cards, 168 exact matches ✅

All 168 asset cards have exact-match images. Full list omitted for brevity.

Notable names confirmed present: `.18_Derringer.png`, `.25_Automatic.png`, `.32_Colt_Pocket.png`, `.38_Revolver.png`, `.45_Automatic.png`, `.45_Colt_Revolver.png`, `Cultist's_Journal.png`, `Expert's_Blade.png`, `Gambler's_Dice.png`, `Lucky_Rabbit's_Foot.png`, `Scribe's_Journal.png`, `Courier_Needed!.png`

---

### Conditions (`images/conditions/`) — 48 cards, 48 exact matches ✅

All 48 condition cards have exact-match images.

---

### Spells (`images/spells/`) — 36 cards, 36 exact matches ✅

All 36 spell cards have exact-match images.

Note: 12 spells also have a `_Front` suffixed copy on disk from the wiki download (e.g. `Alter_Fate_Front.png`). These are not needed for card matching but are harmless extras.

---

### Unique Assets (`images/unique_assets/`) — 87 cards, 87 exact matches ✅

All 87 unique asset cards have exact-match images.

Note: `Eye_of_Light_Unique_Asset.png` and `Eye_of_Darkness_Unique_Asset.png` also exist on disk as extras from the original wiki download.

---

## Action Required

| Priority | Issue | Fix |
|---|---|---|
| ~~Low~~ | ~~`King_in_Yellow.png` casing mismatch~~ | ✅ Resolved — file renamed |

No missing images. All decks are fully covered.
