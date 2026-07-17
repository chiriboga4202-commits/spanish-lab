# Audiovisual Section — "MITOS" (design + pilot, rev. 2026-07-15)

**Philosophy: content first, language by osmosis.** This is NOT a Spanish lesson
in a story costume. It's a genuinely gripping mythology-and-history series that
*happens to be in Spanish*. The hook is the myth/the history — the learning
rides underneath, invisible. Zero grammar labels. No quiz-as-test. Just a great
story you can actually follow, with quiet supports so a beginner never feels lost.

Myth + history are **public domain** — free to retell, no IP problem.

---

## 1. The arc — three movements

**Season 1 — Greek myth (the on-ramp).** Everyone already knows Zeus, Icarus,
Medusa. Universal hook, lowest barrier. Prometheus, Pandora, Perseus, Icarus,
Persephone, the Odyssey.

**Season 2 — World mythologies.** Norse, Egyptian, and — crucially —
**Mesoamerican & Andean** (Aztec, Maya, Inca). This isn't just variety: it
*plants* the civilizations that Season 3 needs.

**Season 3 — The Spanish story (the payload).** Iberia's history: Al-Andalus,
the Reconquista, Isabel & Fernando, **1492** (fall of Granada + Columbus), the
Empire and the conquistadors. The payoff: the Aztec/Inca gods students met in
Season 2 are now the civilizations meeting Spain. Myth converges into history.

Language level climbs gently across the arc (A1 → B1), so the series grows with
the learner and loosely shadows the main app's LEARNING_PATH.

## 2. The invisible learning layer (never in the way)
- **Always-available English subtitle** — default ON for beginners, one tap to
  hide once they're ready. This is the safety net that lets us use real Spanish.
- **Tap any Spanish word → gloss.** Zero-friction comprehension.
- **Voice reads the Spanish aloud** (TTS) — listening + reading reinforce.
- **Vocab captured silently** into their SM-2 review deck. Watching feeds practice.
- **NO** grammar-focus labels, **NO** graded quizzes. (Optional: a single
  reflective story beat at the end — "¿Qué habrías hecho tú?" — engagement, not a test.)
- **Difficulty levels** — the real friction fix (see §2b): the SAME episode exists
  at 3 Spanish levels; the learner watches at theirs and can switch anytime.

## 2b. Difficulty levels — same story, your Spanish (the friction fix)

Felipe's fix, and it's the right one: don't compromise on one language level —
ship the SAME episode at multiple levels and let each learner watch at theirs.

- **3 levels per episode:** **Fácil** (A1-A2, short simple) · **Intermedio** (B1,
  richer) · **Nativo** (authentic, literary). English subtitle available at all three.
- **Defaults to the learner's level** (from their path position), and **changes
  LIVE** — a floating Fácil/Intermedio/Nativo toggle switches the caption *instantly,
  mid-panel, no reload*. Because all three tracks ship inside the same panel data
  (see §6), switching is just swapping the text over the same image — zero refetch,
  zero regeneration. Hit a wall → drop a level → keep watching. Never stuck.
- **Nearly free to add.** The ART is level-agnostic — a panel of Prometheus stealing
  fire is the same picture at every level — so images are generated ONCE and only the
  TEXT changes per level, and text is free via Gemini. Multi-level ≈ 3× free words, 1× paid images.
- **Rewatch value = re-engagement + spiral learning.** Finish at Fácil today, rewatch
  at Intermedio next month — same beloved story, more Spanish.

Same beat (Panel 1), three levels:
- **Fácil:** «Los humanos vivían en la oscuridad. Tenían frío.»
- **Intermedio:** «Hace mucho tiempo, los humanos vivían en la oscuridad, con frío y miedo.»
- **Nativo:** «En tiempos remotos, la humanidad malvivía entre tinieblas, aterida y temerosa.»

## 3. Art direction (locked style = consistency)

Inject into EVERY panel art-prompt, verbatim:
```
Epic mythological graphic-novel style: painterly, dramatic chiaroscuro lighting,
classical composition, gold-and-ember palette, semi-realistic proportions,
cinematic. Consistent character designs. 3:4 vertical panel. NO text, NO letters,
NO speech bubbles in the image.
```
Recurring figures get a fixed description appended whenever on-screen (see pilot).
Speech/captions render in-app over the art — crisp, translatable, tap-glossable.

---

## 4. PILOT — S1E1: "El Ladrón del Fuego" (Prometheus)

Chosen because it's iconic, self-contained, visually epic, and thematically
perfect for a learning platform: **fire = knowledge**, a gift stolen from the
powerful and given to ordinary people, at great cost. Story-first — the Spanish
is real but graded A1–A2; supports carry the rest.

Per panel: **ART** (image prompt) · **ES** (shown + TTS + tap-gloss) · **EN**
(subtitle) · **VOCAB** (silent → review).

**Panel 1 — the cold**
- ART: A dark, frozen prehistoric world at night; small ragged human figures huddle
  in a cave mouth, shivering, no fire; bleak blue moonlight.
- ES: «Hace mucho tiempo, los humanos vivían en la oscuridad. Tenían frío y miedo.»
- EN: "Long ago, humans lived in darkness. They were cold and afraid."
- VOCAB: oscuridad=darkness · frío=cold · miedo=fear

**Panel 2 — the Titan who cared**
- ART: Prometheus (a tall, noble Titan — weathered face, long dark hair, simple grey
  tunic, fierce kind eyes) stands on a cliff above, watching the humans with pity.
- ES: «Prometeo, un titán, los miraba desde lejos. Sentía pena por ellos.»
- EN: "Prometheus, a Titan, watched them from afar. He felt pity for them."
- VOCAB: los miraba=watched them · desde lejos=from afar · pena=pity/sorrow

**Panel 3 — the gods who hoarded**
- ART: Mount Olympus above the clouds, golden and cold; Zeus (immense, white beard,
  crackling with storm-light, seated on a throne of cloud) guards a brazier of divine fire.
- ES: «En el Olimpo, Zeus guardaba el fuego. Los dioses no querían compartirlo.»
- EN: "On Olympus, Zeus kept the fire. The gods did not want to share it."
- VOCAB: guardaba=kept/guarded · dioses=gods · compartirlo=share it

**Panel 4 — the choice**
- ART: Prometheus (grey tunic, dark hair) in shadow near the divine brazier, reaching
  toward the flames, hiding a glowing ember inside a hollow fennel stalk; tense, defiant.
- ES: «Prometeo tomó una decisión. Robó una chispa del fuego de los dioses.»
- EN: "Prometheus made a decision. He stole a spark of the gods' fire."
- VOCAB: tomó una decisión=made a decision · robó=stole · chispa=spark

**Panel 5 — the gift**
- ART: Night cave; Prometheus (grey tunic) kneels and offers the small flame to the
  awed humans; firelight blooms across their faces — the first fire, warmth, wonder.
- ES: «Bajó a la tierra y les dio el fuego. Por primera vez, los humanos tuvieron luz.»
- EN: "He came down to earth and gave them the fire. For the first time, humans had light."
- VOCAB: bajó=came down · les dio=gave them · por primera vez=for the first time

**Panel 6 — the wrath**
- ART: Olympus; Zeus (white beard, storm-light) rises in fury, staring down at the tiny
  new fires glowing across the dark earth below; thunderclouds gathering.
- ES: «Zeus vio las luces en la tierra y se llenó de ira. —¿Quién se atrevió?»
- EN: "Zeus saw the lights on earth and filled with rage. — Who dared?"
- VOCAB: se llenó de ira=filled with rage · se atrevió=dared

**Panel 7 — cliffhanger**
- ART: A barren mountain peak at dawn; Prometheus chained to a great rock, defiant but
  weary; a huge eagle descends from a blood-red sky. Ominous, epic.
- ES: «El castigo de Prometeo apenas comenzaba. En el cielo, un águila descendía…»
- EN: "Prometheus's punishment was only beginning. In the sky, an eagle descended…"
- VOCAB: castigo=punishment · apenas comenzaba=was only beginning · águila=eagle

**Closing beat (optional, engagement not test):**
«Prometeo lo perdió todo por un regalo. ¿Tú qué habrías arriesgado?»
("Prometheus lost everything for a gift. What would you have risked?")

---

## 5. Reusable Gemini generation prompt

Fill {{...}}, POST as `prompt` to `/api/ai`. Returns ONE episode as JSON (§6).

```
You are the writer for "MITOS", a cinematic Spanish-language series that retells
real world mythology and history as gripping short comics. STORY FIRST — this is
NOT a language lesson. No grammar talk, no quizzes. The reader is here for the
myth; they absorb Spanish by osmosis.

WRITE: {{SEASON}} — {{STORY e.g. "Greek myth: Prometheus steals fire"}}, episode {{N}}.
Retell it FAITHFULLY and dramatically in 6-8 panels, ending on a cliffhanger.

LANGUAGE: real but graded Spanish at level {{LEVEL e.g. A1-A2}}. Natural, vivid,
not childish. The English subtitle + tap-gloss carry comprehension, so don't
over-simplify the story — simplify the sentence structure, not the drama.

ART: every panel's art_prompt MUST open with this style lock: {{PASTE §3}}. When a
recurring figure appears, append their fixed description verbatim. NO text in images.

LANGUAGE: real but graded. Produce THREE Spanish levels of the same beat so the
reader can switch live — facil (A1-A2, short simple), intermedio (B1, richer),
nativo (authentic literary). Simplify SENTENCE STRUCTURE for lower levels, never
the drama. English subtitle (en) is shared across levels.

For EACH panel return: art_prompt (ONE level-agnostic image), en (shared English
subtitle), and levels: { facil:{es,words}, intermedio:{es,words}, nativo:{es,words} }
where each words is 3-5 {w,g} (w=exact Spanish word in that level's es, g=short gloss).
Also return one optional reflective closing line (not a quiz).

Return ONLY JSON: {series, season, episode, title, panels:[...], cliffhanger, closingBeat}
```

## 6. Episode JSON model (comic reader consumes this)
```json
{
  "id": "mitos-s1e1", "series": "MITOS", "season": 1, "episode": 1,
  "title": "El Ladrón del Fuego", "level": "A1-A2",
  "panels": [
    { "n": 1, "img": "<url|data-uri>", "art_prompt": "...",
      "en": "Long ago, humans lived in darkness...",
      "levels": {
        "facil":      { "es": "Los humanos vivían en la oscuridad. Tenían frío.",
                        "words": [{ "w": "oscuridad", "g": "darkness" }] },
        "intermedio": { "es": "Hace mucho tiempo, los humanos vivían en la oscuridad, con frío y miedo.",
                        "words": [{ "w": "miedo", "g": "fear" }] },
        "nativo":     { "es": "En tiempos remotos, la humanidad malvivía entre tinieblas, aterida y temerosa.",
                        "words": [{ "w": "tinieblas", "g": "gloom/darkness" }, { "w": "aterida", "g": "numb with cold" }] }
      } }
  ],
  "cliffhanger": "En el cielo, un águila descendía…",
  "closingBeat": "¿Tú qué habrías arriesgado?",
  "vocabAll": ["oscuridad","frío","miedo","robó","fuego","castigo","..."]
}
```
`art_prompt` is stored so panels can be regenerated deterministically; `img` is
filled once generated + hosted. Reader: swipe panels; a live **Fácil/Intermedio/
Nativo** toggle swaps `levels[x].es` over the same image instantly; Spanish over
art with tap-gloss + TTS; English subtitle toggle (default on); silent vocab→review
(from the active level's `words`).

## 7. Build path (lean, unchanged)
1. **Now:** this bible + Prometheus pilot script (done). $0.
2. **Prove the art + character consistency:** generate E1's ~7 panels (~$0.25).
3. **Comic reader UI** (new section): panel swipe, subtitle toggle, tap-gloss, TTS,
   vocab→review. Ship the pilot to real students, measure stickiness.
4. **If it lands:** wire the generation prompt into a production tool, build the
   library season by season (Greek → world myth → Spanish history).
