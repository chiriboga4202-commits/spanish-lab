# MITOS — Content Library (300-chapter horizon, rev. 2026-07-21)

**Built for 300, all specced; images deferred.** All 300 chapter *scripts* are
generatable on demand via the free Gemini proxy — only panel ART costs money and
stays deferred. Books I–XI (1–150) are the core saga; Phase 2 (XII–XXIV, 151–300)
extends the timeline past the Borbones and adds eight more world mythologies.

A single connected saga that retells world myth and history as **culture "books"
that hand into the history of Spain**. Story-first Spanish, 3 live levels
(Fácil/Intermedio/Nativo) + English subtitle + tap-gloss, all public-domain
source material (myth + history — no IP risk). Level climbs A1 → B2 across the arc.

## Why this order (continuity + timeline)

Myth isn't one global date-line, so continuity lives **inside each book** (a real
connected saga, not greatest-hits), and the **books are ordered** so mythology
flows into real history and lands on the Spanish empire. The Roman book is the
hinge: Trojan myth (Aeneas) → the founding of Rome → the Republic → the Empire →
the legions marching into **Hispania**, where the history books begin. The
Mesoamerican/Andean gods of Book VI become the civilizations Spain meets in Book X.

## The 11 books (150 chapters)

| # | Book | Ch | Internal arc |
|---|------|-----|--------------|
| I | Grecia | 1–20 | Caos → Titanomaquia → Olimpo → héroes → Troya → Odisea → fin de la edad heroica |
| II | Roma | 21–34 | Eneas → Rómulo → República → Aníbal → César → Augusto → *el águila mira a Hispania* |
| III | Nórdica | 35–48 | Ginnungagap → Yggdrasil → Odín → Thor/Loki → Baldr → Ragnarök → renacer |
| IV | Egipcia | 49–60 | Nun → Ra → Osiris & Isis → traición de Set → Horus vs Set → el Duat |
| V | Mesopotamia | 61–68 | Enuma Elish → Marduk → Gilgamesh & Enkidu → el diluvio → mortalidad |
| VI | Mesoamérica y los Andes | 69–82 | Cinco Soles → Quetzalcóatl → Popol Vuh → Tenochtitlán → Inti → *dos mundos* |
| VII | Hispania Antigua | 83–96 | Tartessos → fenicios → Roma en Iberia → Numancia → emperadores hispanos → visigodos |
| VIII | Al-Ándalus y la Edad Media | 97–116 | Visigodos → 711 → Califato de Córdoba → El Cid → Reconquista → Alfonso X |
| IX | Los Reyes Católicos y 1492 | 117–126 | Isabel & Fernando → Granada → 1492 → el cruce → primeras colonias |
| X | El Imperio y el Siglo de Oro | 127–142 | Carlos V → conquistadores (¡Libro VI!) → Felipe II → Lepanto → Cervantes/Velázquez |
| XI | El Siglo XVIII: los Borbones | 143–150 | Guerra de Sucesión → Felipe V → las Luces → Carlos III → mayor extensión → *continuará* |

### Phase 2 — the path to 300 (books XII–XXIV, ch. 151–300)

| # | Book | Ch | Thread |
|---|------|-----|--------|
| XII | La Independencia de América | 151–164 | Hidalgo, Bolívar, San Martín → las colonias del Libro X se vuelven naciones |
| XIII | La Guerra de la Independencia | 165–174 | Napoleón, el 2 de mayo, las guerrillas, Cádiz 1812 |
| XIV | El Siglo XIX Español | 175–186 | Fernando VII, carlistas, repúblicas, 1898 |
| XV | El Siglo XX | 187–200 | República, Guerra Civil, dictadura, Transición, hoy |
| XVI | Mitología Céltica | 201–212 | Tuatha Dé Danann, Cú Chulainn, Mabinogion |
| XVII | Mitología Hindú | 213–228 | Ramayana, Mahabharata, Krishna |
| XVIII | Mitología China | 229–242 | Pangu, el Rey Mono, Viaje al Oeste |
| XIX | Mitología Japonesa | 243–254 | Izanagi, Amaterasu, Susanoo, Momotaro |
| XX | Mitología Eslava | 255–264 | Perún, Baba Yagá, Koschéi |
| XXI | Mitología Yoruba | 265–276 | Los orishas, Anansi, la diáspora |
| XXII | Mitología Polinesia | 277–284 | Māui, Rangi y Papa, los navegantes |
| XXIII | Mitología Persa | 285–292 | Ahura Mazda, Zahhak, Rostam (Shahnameh) |
| XXIV | El Kalevala | 293–300 | Väinämöinen, el Sampo, el canto que crea |

Each chapter foregrounds a grammar focus **through story**, never a lecture.
Levels climb A1 → C1 across the whole arc. Full titles + premises + grammar +
level live in the manifest (the single source of truth). To read them all:
`node generate_library.mjs --list`. Each chapter carries a `phase` (1 or 2).

## Pipeline (single source of truth)

```
build_library_manifest.mjs       # authors the spine (FREE, no AI) → writes:
  spanish-lab/mitos/library.json #   150 chapters + 11 books (reader + generator read this)
  spanish-lab/mitos/ready.json   #   which chapter numbers are generated (seed [1,2])

generate_library.mjs             # reads the manifest, writes chapter SCRIPTS via /api/ai:
  node generate_library.mjs --list                 # print all 150
  node generate_library.mjs --book "Grecia"        # generate a whole book
  node generate_library.mjs --range 3-20           # or a numeric range
  node generate_library.mjs --only 3               # or one chapter
  → spanish-lab/mitos/chapters/chNN.json  +  auto-adds N to ready.json

generate_panels.mjs              # (PAID) illustrates a chapter → mitos/chNN/pN.png
```

- **Editing the story:** change titles/premises/grammar in `build_library_manifest.mjs`,
  rerun it (free), review `library.json`, then generate. Never hand-edit two lists.
- **Continuity:** the generator feeds each chapter the *previous chapter's ending
  within the same book*, so the narrative carries momentum forward (a new book
  starts fresh).
- **Unlocking:** the reader's picker reads `library.json` (all 150, grouped by book)
  and `ready.json` (which are playable). Generating a chapter unlocks it
  automatically — no code change. Ch1 is inline (offline); the rest fetch on demand.
- **Art is optional:** a chapter with a script but no art shows the 📖 placeholder;
  text/levels/gloss/TTS all work regardless.

## Cost note (AI economy)
The WRITING is the cheap part (your free Gemini proxy). Generate books in
batches, review, then only illustrate hero chapters. Nothing here spends money
until you run `generate_library.mjs` / `generate_panels.mjs`.
