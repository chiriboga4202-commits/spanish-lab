# Spanish Lab — Master Fix List (what we're actually building)

*The final, reconciled set: engineering feasibility + Spanish pedagogy + the student's honest reaction. Friction-reducers kept, discipline-imposing fixes softened so they help without driving students away, and the student-wants the original 100 missed are added. Grounded in the real codebase (`CONCEPTS`, `generateXData`, static banks, SM-2, `conceptMastery`, `localStorage`). Priorities: **P0 = do now**, **P1 = high value**, **P2 = when there's room**.*

---

## P0 — Never dead-end, never make a student feel dumb

- **[P0] Universal "Skip / Next" on every AI mode.** Speak and Translate have it; add it to Examples, Story, Dialogue, Builder, Word Drop, Missing, Spot-the-Error, Fill Blank. A student must always be able to move forward.
- **[P0] Hard timeout on every `generateXData`.** If a generation doesn't resolve in ~8s, fall back to static (or a friendly "one sec, here's a built-in one") instead of an endless spinner.
- **[P0] Validate every AI response shape before rendering** (the Spot-the-Error fix, generalized). Each `generateXData` checks the object has the fields its renderer needs; on failure → static fallback. Kills the whole class of "mode froze" bugs.
- **[P0] Static fallback for the fully-generative modes** (Story, Dialogue, Examples). A small hand-authored set per concept, swapped in when AI fails, so these never show a bare error.
- **[P0] Partial credit + position feedback in Builder (and Word Drop).** Token-level diff: correct positions green, misplaced amber; let the student fix only the wrong words; award partial XP. Stop marking a whole sentence wrong for one slip.
- **[P0] Keep the tone encouraging on wrong answers.** Audit every "wrong"/"incorrect" string; lead with what's right, name the fix, never scold. This is the #1 retention lever and it's nearly free.
- **[P0] Push the Spot-the-Error freeze fix live** (already coded; needs `push_fix.ps1`).

## P0 — Make learning visible (the reason a student stays)

- **[P0] "My Mistakes" screen.** You already capture misses (`updateStreak(false, wrongData)`, `logAnswerHistory`); surface them as a reviewable list with a "practice these" button.
- **[P0] Auto-enqueue missed items into the SM-2 due pool** at a short interval, so errors become scheduled re-tests — the single highest-yield study behavior, and the plumbing already exists.
- **[P0] Home mastery dashboard.** Render `conceptMastery` as 11 concept chips with progress rings and a "3 / 11 mastered" headline. Make "mastered" mean something transparent (e.g., ≥85% over last 10, across 2+ days).

## P1 — Reduce friction to start and stay

- **[P1] Resume where I left off.** Persist `{concept, mode, round}` to `localStorage.sl_last_session`; offer "Resume: Ser/Estar · Pairs" on load.
- **[P1] Re-openable "How it works" (`?` in header), not a forced carousel.** One screen: the see→try→why loop, and "mistakes are the point." Students skip slideshows; make it available, not mandatory.
- **[P1] Optional, skippable "find my weak spots" scan** (not a gated placement test). One quick item per concept, surfaces the 3 lowest, and can be dismissed with "just let me practice."
- **[P1] Recommended path as guidance, never a lock.** A numbered `LEARNING_PATH` track on the home screen (Present → Ser/Estar → Gender → Pret/Imp → Subjunctive, dependency-ordered) with the next step highlighted — but **all modes and concepts stay openable**. Guide, don't fence.
- **[P1] Visible, learner-controlled difficulty.** Promote the `diff-badge` to a labeled Beginner/Intermediate/Advanced control. Optional auto-adjust, but only if it's visible and overridable — never an invisible hand cranking difficulty.
- **[P1] A "5-minute session" mode with a finish line.** A short, bounded set (e.g., 10 items across the due pool) with a clear "done!" — respects the student's real constraint: time.

## P1 — Help me when I'm stuck

- **[P1] Peekable rule reminder mid-exercise.** A per-concept `RULES` object → collapsible "rule + 2 examples" panel from any mode's header, so students stop leaving to Google (and not coming back).
- **[P1] "Show me an example" under hard explanations.** Expandable contrast pair (minimal pairs) for subjunctive, por/para, ser/estar — teach by the one-word-changed comparison.
- **[P1] Hear the corrected sentence after a wrong answer.** Auto-play TTS of the full correct sentence (audio + text = dual coding). Add 🔊 to every result surface.
- **[P1] Standardize explanations to rule → this case → contrast.** Keep them short; unit-test that every generated item ships a non-empty `explanation`.

## P1 — Motivation, done the student-approved way

- **[P1] Daily goal ring + day-streak** (e.g., 20 XP/day) in `localStorage`. Gentle, visible, motivating.
- **[P1] Streak forgiveness / freeze day.** Missing one day must **not** reset the streak to zero — "all my progress is gone" is a top quit trigger. Grant a grace day or a freeze.
- **[P1] Badge gallery** showing locked/unlocked + how to earn each, designed around good habits (7-day streak, all concepts touched, 50 mistakes reviewed) rather than raw XP.
- **[P1] Normalize XP across modes** (or scale by difficulty, not by mode identity) and add a small bonus for **variety** (3 different modes/day) so students don't just grind the highest-paying mode.
- **[P1] Soft mastery decay, never a visible downgrade.** If a concept goes stale, nudge "time for a refresher" — do **not** visibly demote an earned "mastered" trophy (reads as confiscation).

## P1 — Mode-specific quality

- **[P1] Concept-aware distractors** for Word Drop and Fill Blank — the wrong options should each be a real, "seductive" learner error, not generic filler (el/la/de). Makes elimination require understanding.
- **[P1] Concept-tied blanks in Missing.** Blank the target token (the copula for ser/estar, the preposition for por/para), not a random article.
- **[P1] Rubric-based Translate grading + "I think this is also right" recheck.** Grade meaning + target structure, accept valid alternatives, and let the student trigger a second-pass adjudication that shows the accepted answer.
- **[P1] Expand `STATIC_EXERCISES` (Pairs + Fill-Blank fallback), ~5 → ~12 per concept.** The remaining thin fallback pool (the one bank we haven't grown yet).
- **[P2] Vocab → SM-2 + confidence-lite.** Route Vocab through the spaced scheduler; keep it to a light "got it / review" (avoid a heavy 4-way rating that adds clicks), and show a "42 / 170 known" counter with a "still learning" filter.
- **[P2] Reading Comprehension: add 2–3 inference questions** (AI-rubric or multiple choice) alongside the keyword check so it tests understanding, not keyword-typing.
- **[P2] Conjugate: verb-frequency weighting + tense "sets" with a completion bar** and light interleaving of persons/tenses.
- **[P2] Speak: graceful mic fallback.** On denied/absent mic, auto-swap to a "type what you'd say" input + self-check, instead of stalling.
- **[P2] Cache last few good generations per concept** (Story/Dialogue/Examples) so repeats are instant and a throttle doesn't expose a spinner.

## P2 — Content integrity

- **[P2] Keep a human-authored "gold" core per concept** as the quality floor; AI expands around it, never replaces it.
- **[P2] "Report awkward sentence" flag** that logs the item for later human review.
- **[P2] Tighten generation prompts** with in-prompt exemplars of natural, everyday register + validators rejecting over-long/oddly-punctuated output.

## P2 — Accessibility & polish

- **[P2] Font-size + high-contrast toggle**, persisted to `localStorage`.
- **[P2] Better TTS voice selection** (prefer a quality `es-*` voice; let the student pick voice/rate); label it a "pronunciation hint."
- **[P2] Audit touch targets (≥44px)** and keep the icon+color+text redundancy on result states; verify WCAG AA contrast.
- **[P2] Accent input polish** — insert at caret, long-press for capitals, accept "n"/"n~" for ñ.

## P2 — The student-wants the original 100 missed

- **[P2] Session length control** (the 5-minute mode above) — the single most-requested thing that isn't a feature the 100 listed.
- **[P2] "You could now say this in real life" framing** — occasional real-usefulness cues, and consider a light real-conversation mode, so practice feels connected to actually speaking.
- **[P2] Less reading / more audio-first options** — even the great explanations are a lot to read every time; offer an audio version or a "just show me the answer" quick path.

## Explicitly NOT doing (would help learning, but drive students away)

- **✗ Hard-locking modes/concepts until "earned"** (#2b/#5 original). Patronizing; fastest quit trigger. Replaced with *guidance* (recommended path) + full open access.
- **✗ Invisible auto-difficulty that ratchets up on you** (#10b original). Replaced with *visible, controllable* difficulty.
- **✗ Visibly demoting a "mastered" concept** (#39b original). Replaced with soft "refresher" nudges.
- **✗ Bolting quizzes onto Story/Dialogue** (#20b/#30b original). Keep the fun modes fun; put comprehension checks only in Reading Comprehension.
- **✗ Preachy "this is harder on purpose, it's good for you" messaging.** Interleave and challenge quietly; don't lecture students about their own learning.
- **✗ Trick "no error here" items as a gotcha** — use the "it's already correct" option sparingly and never to catch someone out.

---

## Suggested build order
1. **P0 reliability + dignity** — Skip/timeout/validation/fallback everywhere, Builder partial credit, encouraging tone. (Stops the bleeding.)
2. **P0 visibility** — My Mistakes screen + SM-2 re-queue + mastery dashboard. (Gives students a reason to return.)
3. **P1 friction + stuck-help** — resume, weak-spot scan, rule reminders, streak forgiveness. (Keeps them coming back.)
4. **P1 mode quality + STATIC_EXERCISES expansion.** (Deepens the practice.)
5. **P2 polish, accessibility, content integrity.** (Broadens reach.)
