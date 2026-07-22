# MITOS — Content Library (30 chapters, rev. 2026-07-15)

The full production plan for the saga's first arc-set: **30 chapters × ~20 pages
each**, story-first Spanish, level climbing A1 → B1. This is roughly a third of
the intended saga — the arcs beyond ch.30 (deeper Spanish history, colonial
Americas, modern) extend from the same pattern.

Everything here follows the agreed format: **story on top, language underneath**
(3 live levels + English subtitle + tap-gloss), public-domain source material
(myth + history — no IP risk). Each chapter = one Gemini generation from the
master prompt below, then panel art via `generate_panels.mjs`.

---

## The arc (why this order)

- **Arc I — Mitología Griega (ch. 1–10).** Universal on-ramp; everyone knows Zeus.
  Level A1–A2. Establishes the format.
- **Arc II — Mitologías del Mundo (ch. 11–20).** Norse, Egyptian, and —
  deliberately — **Mesoamerican & Andean** (Aztec, Maya, Inca). Level A2–B1.
  These *plant* the civilizations Arc III needs.
- **Arc III — La Historia de España (ch. 21–30).** Iberia → Rome → Al-Ándalus →
  Reconquista → **1492** → the Empire. Level B1. The payoff: the Aztec/Inca gods
  from Arc II become the civilizations meeting Spain (ch. 29). Myth → history.

Each chapter foregrounds a grammar focus *through story*, never a lecture.

---

## The 30 chapters

Format: **#. Título** — culture · *grammar focus* · level — one-line premise.

### Arc I · Mitología Griega (A1–A2)
1. **El Ladrón del Fuego** — Grecia · *ser/estar* · A1–A2 — Prometeo roba el fuego de los dioses para la humanidad y paga un precio terrible. *(pilot — already produced)*
2. **La Caja de Pandora** — Grecia · *presente + tener* · A1 — La primera mujer recibe una caja que nunca debe abrir; su curiosidad libera todos los males… y la esperanza.
3. **El Vuelo de Ícaro** — Grecia · *poder/querer + adjetivos* · A1–A2 — Padre e hijo escapan con alas de cera; el hijo vuela demasiado cerca del sol.
4. **Perseo y Medusa** — Grecia · *presente + descripción* · A2 — Un héroe debe traer la cabeza de un monstruo cuya mirada convierte en piedra.
5. **El Rapto de Perséfone** — Grecia · *gustar + el tiempo/estaciones* · A2 — El dios del inframundo se lleva a una diosa; su ausencia crea el invierno.
6. **Teseo y el Minotauro** — Grecia · *estar + ubicación/preposiciones* · A2 — Un laberinto, un monstruo, y un hilo que salva la vida.
7. **El Canto de Orfeo** — Grecia · *reflexivos* · A2 — Un músico baja al inframundo por su amor, con una sola condición: no mirar atrás.
8. **Las Pruebas de Heracles** — Grecia · *números y cantidades* · A2 — El héroe más fuerte debe completar doce trabajos imposibles para redimirse.
9. **El Caballo de Troya** — Grecia · *pretérito (introducción)* · A2–B1 — Diez años de guerra terminan con el engaño de madera más famoso de la historia.
10. **La Odisea** — Grecia · *pretérito vs imperfecto* · A2–B1 — El largo y peligroso viaje de Ulises de vuelta a casa.

### Arc II · Mitologías del Mundo (A2–B1)
11. **El Martillo de Thor** — Nórdica · *presente + adjetivos* · A2 — El dios del trueno pierde su martillo y debe recuperarlo de los gigantes.
12. **Loki, el Embaucador** — Nórdica · *reflexivos + negación* · A2 — El dios tramposo engaña a todos… hasta que sus engaños tienen consecuencias.
13. **El Ragnarök** — Nórdica · *futuro (ir a)* · B1 — La profecía del fin de los dioses, y la batalla que reiniciará el mundo.
14. **Osiris y el Río** — Egipcia · *por/para* · A2–B1 — Traicionado y despedazado, el dios renace ligado al Nilo y al ciclo de la vida.
15. **Anubis y el Juicio** — Egipcia · *comparativos* · B1 — En el más allá, el corazón del muerto se pesa contra una pluma.
16. **Ra contra Apofis** — Egipcia · *rutina/presente* · A2 — Cada noche el dios sol lucha contra la serpiente del caos para que amanezca.
17. **Quetzalcóatl** — Azteca · *pretérito* · B1 — La serpiente emplumada crea a la humanidad y le enseña el maíz y el conocimiento.
18. **El Quinto Sol** — Azteca · *pretérito/imperfecto* · B1 — Los dioses se sacrifican para crear el sol que ilumina nuestra era.
19. **Los Héroes Gemelos** — Maya (Popol Vuh) · *subjuntivo (introducción)* · B1 — Dos gemelos vencen a los señores del inframundo con astucia y un juego de pelota.
20. **Inti y el Imperio del Sol** — Inca · *pretérito + geografía* · B1 — El dios sol funda un imperio en lo alto de los Andes.

### Arc III · La Historia de España (B1)
21. **Tartessos y los Fenicios** — Iberia antigua · *imperfecto (fondo)* · B1 — Antes de España: un reino legendario y los mercaderes que cruzaban el mar.
22. **Roma en Hispania** — Historia · *pretérito/imperfecto* · B1 — Roma conquista la península, construye caminos y da al mundo a Séneca.
23. **El Reino Visigodo** — Historia · *pasado* · B1 — Tras la caída de Roma, un pueblo del norte hereda Hispania.
24. **711: La Llegada de Al-Ándalus** — Historia · *pasado + causa* · B1 — En pocos años, un ejército cambia la península para siempre.
25. **Córdoba, Luz del Mundo** — Al-Ándalus · *comparativos + descripción* · B1 — La ciudad más culta de Europa: bibliotecas, ciencia y convivencia.
26. **El Cid** — Reconquista · *pasado* · B1 — Un guerrero desterrado se convierte en leyenda entre dos mundos.
27. **Isabel y Fernando** — Historia · *pasado* · B1 — Dos coronas se unen y nace la idea de una sola España.
28. **1492** — Historia · *pretérito* · B1 — La caída de Granada, la expulsión, y tres barcos rumbo a lo desconocido, todo en un año.
29. **El Imperio donde no se Pone el Sol** — Historia · *pasado + contraste* · B1 — El imperio se extiende por el mundo… y se encuentra con los dioses de los capítulos 17–20. *(convergencia myth→history)*
30. **El Siglo de Oro** — Historia · *pasado + reflexión* · B1 — Cervantes, el arte y la cumbre cultural — con la sombra que la sostenía.

---

## Master generation prompt (fill {{ }}, POST to /api/ai)

Produces ONE chapter as JSON matching the reader's episode model (§ below).

```
You are the writer for "MITOS", a cinematic Spanish-language comic series that
retells world mythology and history as gripping short chapters. STORY FIRST —
this is NOT a language lesson. No grammar talk, no quizzes. The reader is here
for the myth/history; they absorb Spanish by osmosis.

CHAPTER {{N}} — Arc "{{ARC}}" — "{{TITLE}}".
CULTURE / SETTING: {{CULTURE}}.
STORY TO TELL (retell faithfully + dramatically): {{PREMISE + key beats}}.

WRITE {{PAGES=20}} panels. Build tension; end on a cliffhanger. Then one short
reflective closing line (NOT a quiz).

LANGUAGE: real but graded. For EACH panel give THREE Spanish levels of the same
beat so the reader can switch live — facil ({{LEVEL_LOW e.g. A1}}), intermedio
({{LEVEL_MID e.g. A2-B1}}), nativo (authentic literary). Simplify SENTENCE
STRUCTURE for lower levels, never the drama. Foreground the grammar focus
"{{GRAMMAR}}" naturally through the dialogue/narration. The English subtitle (en)
is shared across levels.

ART: every panel's art_prompt MUST open with this house style, verbatim:
"Epic mythological graphic-novel style: painterly, dramatic chiaroscuro lighting,
classical composition, gold-and-ember palette, semi-realistic proportions,
cinematic. Consistent character designs. 3:4 vertical panel. NO text, NO letters,
NO speech bubbles in the image."
Then the scene + any recurring figure WITH a fixed physical description repeated
verbatim every time they appear (so the cast stays consistent across panels).

For EACH panel return: art_prompt, en (shared English subtitle), and levels:
{ facil:{es,words}, intermedio:{es,words}, nativo:{es,words} } where each words is
3-5 {w,g} (w = exact Spanish word in that level's es, g = short English gloss).

Return ONLY JSON:
{series:"MITOS", chapter:{{N}}, arc:"{{ARC}}", title:"{{TITLE}}", level:"{{LEVEL}}",
 grammarFocus:"{{GRAMMAR}}", panels:[...20...], cliffhanger, closingBeat}
```

## Episode/chapter JSON model (reader consumes this)
See `AUDIOVISUAL_SAGA.md §6` — identical shape, `panels[]` each with `img`,
`art_prompt`, `en`, and `levels.{facil|intermedio|nativo}.{es,words}`. Store one
file per chapter: `mitos/chapters/ch<NN>.json`; panel art in `mitos/ch<NN>/pN.png`.

## How to produce (when ready — costs apply)
1. `generate_library.mjs` holds all 30 chapter specs. Run it with your Gemini key
   to generate the 30 chapter JSONs (text — cheap). Review/edit the writing.
2. For each chapter you want illustrated, run the panel generator (art — ~cents/panel).
3. Point the reader's episode list at the chapter JSONs; the picker exposes them.

Note: 20 panels × 30 chapters = 600 panels of art if you illustrate everything —
budget in stages. Text generation is the cheap part; illustrate hero chapters first.
