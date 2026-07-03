# Spanish Lab — 100 Fixes (2 per feedback point)

*Reviewed as a senior engineer + Spanish-pedagogy specialist. For each of the 50 student-feedback points, two concrete fixes: one engineering-oriented, one pedagogy-oriented (they overlap where it matters). Grounded in the real codebase — `CONCEPTS`, the `generateXData` AI-first pattern, static banks, SM-2, `localStorage` state.*

---

## First impressions & onboarding

**1. Dropped in with no intro.**
- a. Add a first-run overlay gated on `localStorage.sl_onboarded` — a 3-card carousel ("what this is / how a round works / pick a concept"), dismissible, re-openable from a `?` in the header. Cheap, static, no AI.
- b. Frame it around the learning loop, not features: *see the rule → try it → get the why*. Explicitly normalize mistakes ("getting it wrong is how this works") — retrieval-practice research shows this framing raises persistence and lowers quit rates.

**2. 16 modes / 11 concepts is a wall.**
- a. Group modes into 3 disclosure tiers in the mode bar — **Learn / Practice / Challenge** — showing 4 core modes by default with a "more" expander, so the first screen isn't overwhelming.
- b. Sequence by cognitive load: recognition modes (Pairs, Fill Blank) before production modes (Builder, Translate, Speak). Gate a concept's production modes until its recognition accuracy clears ~70%.

**3. No placement / level.**
- a. Build a 6-item adaptive diagnostic (branch up/down per answer) that seeds each concept's starting difficulty and mastery state, then routes to the weakest concept.
- b. Use item-response logic — start mid-difficulty, adjust on each response — so six items localize a learner's level without a tedious 30-question test.

**4. Nothing tells me which concept I need.**
- a. Add a "not sure where to start?" button that runs a 1-question-per-concept mini-scan and surfaces the 3 lowest-scoring concepts as recommended.
- b. Pedagogically prioritize high-leverage, high-frequency concepts first (ser/estar, present, gender agreement) over rarer ones (subjunctive), since early wins on frequent structures compound fastest.

**5. No recommended path.**
- a. Encode an ordered `LEARNING_PATH` array of concept keys; render it as a numbered track on the home screen with the next step highlighted and later steps dimmed.
- b. Order the path by linguistic dependency (present tense → ser/estar → gender → preterite/imperfect → subjunctive) so each concept builds on mastered prerequisites rather than floating independently.

## Getting around

**6. Mode switching is fast (keep it).**
- a. Preserve the snappy feel — keep `switchMode` synchronous for UI, and lazy-trigger the first `generateXData` so the bar never blocks.
- b. Add a subtle "you are here" label pairing the current **mode × concept** so learners always know both dimensions of what they're practicing.

**7. No resume.**
- a. Persist `{concept, mode, round}` to `localStorage.sl_last_session` on each render; on load, offer "Resume: Ser/Estar · Pairs (round 7)".
- b. Frame resumption as a spaced-repetition cue — "Welcome back — let's warm up on what you did yesterday" — leveraging the spacing effect the SM-2 layer already models.

**8. Mixed / Sprint / Review unexplained.**
- a. Add one-line tooltips (title attributes already used elsewhere) describing each: "Sprint = beat the clock," "Review = your due cards," "Mixed = concepts interleaved."
- b. Lean into interleaving research: rename "Mixed" to "Interleaved practice" and surface *why* it's harder-but-better (mixing concepts improves discrimination and long-term retention vs. blocked practice).

**9. No at-a-glance progress.**
- a. Add a home dashboard reading `conceptMastery` — a grid of 11 concept chips with progress rings and a "3/11 mastered" headline.
- b. Make mastery criterion transparent (e.g., "≥85% over your last 10, spaced across 2 days") so learners understand mastery is durable retention, not a single lucky streak.

**10. Difficulty toggle is invisible.**
- a. Promote the `diff-badge` from a tiny inline chip to a labeled segmented control ("Beginner / Intermediate / Advanced") in the round header.
- b. Better: auto-adjust difficulty from rolling accuracy (raise after 4-in-a-row, lower after 2 misses) so learners sit in the "desirable difficulty" zone without managing it manually.

## Mode-by-mode

**11. Pairs is the best on-ramp.**
- a. Make Pairs the default landing mode for a newly selected concept, since its recognition format has the lowest production burden.
- b. Keep the per-card "reason" text — it's contrastive analysis in miniature (right vs. wrong side by side), which is one of the most effective formats for grammar contrasts.

**12. Correct/incorrect moment feels good.**
- a. Keep the XP pop and streak animation; ensure they never block the Next button (fire-and-forget the animation).
- b. Add variable-ratio reinforcement sparingly (occasional bonus XP) — intermittent reward sustains engagement, but cap it so it doesn't overshadow learning as the goal.

**13. Fill Blank now consistent (keep it MC).**
- a. Keep the single multiple-choice path; if you ever reintroduce type-in, make it a *separate labeled mode*, not an invisible alternation.
- b. Ensure distractors are concept-diagnostic (the three wrong options should each represent a distinct common error), turning every item into a mini error-analysis.

**14. 🔊 hear-sentence is used a lot.**
- a. Add the same 🔊 to Builder, Missing, and Spot-the-Error result screens for consistency.
- b. Play the *full corrected* sentence after a wrong answer (audio + visual) — dual-coding (hearing + reading the fix) strengthens the correction.

**15. Builder tap-to-place works on mobile.**
- a. Keep tap-to-place; add haptic feedback (`navigator.vibrate`) on place/correct for mobile satisfaction.
- b. Show the English prompt persistently while building so the learner is mapping meaning→form, not just re-ordering tokens mechanically.

**16. Builder all-or-nothing grading.**
- a. Implement token-level diff: highlight which positions are correct (green) vs. misplaced (amber) and let the learner fix only those, awarding partial XP.
- b. Pedagogically, position-level feedback targets the specific error (word order, agreement) instead of a blunt "wrong," which is far more instructive for multi-word production.

**17. Word Drop distractors are generic fillers.**
- a. Replace the static `generateDistractors` filler list with concept-aware distractors — e.g., for ser/estar include the *other* copula form; for gender include the mis-agreeing adjective ending.
- b. Design distractors as "seductive" errors (the mistake a learner would actually make), so elimination requires understanding the rule rather than spotting an odd filler.

**18. Translate AI grading is flexible.**
- a. Keep AI grading but log the learner's answer + verdict so you can audit false negatives.
- b. Prompt the grader to accept *any* meaning-preserving, grammatical answer and to name which concept feature it's checking — grading the target structure, not incidental word choice.

**19. Translate marks valid alternatives wrong.**
- a. Add an "I think this is also correct" button that re-queries the AI with the learner's answer for a second-pass adjudication, and surfaces the accepted alternative.
- b. Shift grading from string-match toward *rubric-based* (does it convey meaning + use the target structure correctly?), which mirrors how a human teacher marks translation.

**20. Story/Dialogue are fun and immersive.**
- a. Cache the last few successful generations per concept so a repeat visit is instant while a fresh one generates in the background.
- b. Add comprehension checks inside the narrative (Krashen's comprehensible input + a light output demand) so immersion also produces measurable practice.

**21. Generative modes dead-end when AI is busy.**
- a. Give Story/Dialogue/Examples a small hand-authored fallback set per concept (like Pairs has), swapped in on failure, so the mode never shows a bare error.
- b. When falling back, keep the learner *doing* something — a short pre-written dialogue beats a spinner; maintaining time-on-task protects the practice session.

**22. Conjugate is reliable.**
- a. Keep the algorithmic generator; add verb-frequency weighting so common irregulars surface more often than rare regulars.
- b. Group drills into tense "sets" with a completion bar — chunking a long drill into goals sustains motivation better than an endless stream.

**23. Conjugate UI is monotonous.**
- a. Add an optional timer/streak and a "beat your best" counter to gamify the drill loop.
- b. Interleave persons/tenses within a set (yo, ellos, nosotros mixed) rather than blocking one form — interleaving improves conjugation flexibility.

**24. Speak mic-permission fallback unclear.**
- a. Detect denied/absent mic and auto-swap to a "type what you'd say" input, so the mode degrades gracefully instead of stalling.
- b. Even without a scoring engine, prompt self-assessment ("did you say it aloud? ✓") — the act of speaking is the practice; perfect ASR grading is secondary.

**25. Missing blanks trivial words.**
- a. Weight the blank-selection toward content/target words (verbs, the concept-relevant token) and away from articles/prepositions unless the concept *is* prepositions.
- b. Tie the blank to the concept: for por/para blank the preposition; for ser/estar blank the copula — so every Missing item actually tests the target rule.

**26. Accent leniency is right.**
- a. Keep `stripAccents` comparison; additionally show a gentle "✓ (watch the accent: comí)" note when they were right but dropped a diacritic.
- b. Separate the *skill* (correct word/form) from the *orthography* (accent) — credit the grammar, coach the accent, so a missing tilde never masks real mastery.

**27. Vocab deck no longer dead-ends.**
- a. Keep the AI top-up; persist AI-generated cards to `localStorage` so a good batch survives the session instead of regenerating.
- b. Route Vocab through the same SM-2 scheduler as the exercises so "hard" words resurface on a spaced schedule, not just shuffled.

**28. Vocab has no mastery view.**
- a. Add a header counter reading `_vocabSeen` — "42 known / 170" — and a filter toggle for "still learning."
- b. Replace binary Know-it/Review with a 3-way confidence rating (again / good / easy) feeding spacing intervals — self-graded recall difficulty is the core of efficient SRS.

**29. Spot-the-Error is a strong format.**
- a. Keep it; now that generation is validated, add a 4th "no error — it's correct" option occasionally so learners can't assume there's always a mistake.
- b. Error-detection builds metalinguistic awareness (noticing), a well-supported driver of accuracy gains — lean into it as a "proofreading" challenge.

**30. Reading Comprehension keyword grading is gameable.**
- a. Move grading to AI rubric scoring of the free response, or add 2–3 multiple-choice comprehension items alongside the keyword check.
- b. Add inference questions ("why did María take the metro?"), not just fact-retrieval — deeper processing improves both comprehension and retention.

## Feedback & how it teaches

**31. Explanations are the best feature.**
- a. Protect them: keep every mode's result surface showing the rule, and unit-test that each generated item includes a non-empty `explanation`.
- b. Standardize explanation shape to *rule + this-case + contrast* ("estar for location; here it's where the book is; ser would mean identity"), the most transferable explanatory format.

**32. Wrong answers show correct + why.**
- a. Keep it; ensure the correct option is visually distinct (not just colored) on every mode's result bar.
- b. Deliver correction *immediately* after the attempt (the app does) — immediate feedback on discrete grammar items is optimal; save delayed feedback for open production only.

**33. Dense one-line explanation on hard concepts.**
- a. Add an expandable "show me an example" under each explanation that reveals a pre-authored contrast pair for that concept.
- b. For subjunctive/por-para, teach by minimal pairs (one word changed flips the meaning) — isolating the variable is the fastest route to the rule.

**34. Mistakes vanish — no review list.**
- a. You already capture wrong answers (`updateStreak(false, wrongData)` / `logAnswerHistory`); surface them in a "My Mistakes" screen with a "practice these" button.
- b. Auto-enqueue missed items into the SM-2 due pool at a short interval — turning errors into scheduled re-tests is the single highest-yield study behavior.

**35. No mid-practice cheat sheet.**
- a. Add a per-concept `RULES` object; render a collapsible "rule reminder" panel accessible from any mode's header.
- b. Keep it to one rule + two examples (a "reference card," not a lesson) so it supports retrieval without becoming a crutch that removes the desirable difficulty.

## Motivation & retention

**36. XP/levels/streaks work.**
- a. Keep them; make sure XP writes are debounced and never block interaction.
- b. Tie levels to *competence*, not just volume — e.g., "level up" partly on concepts mastered — so progression signals real learning, not grinding.

**37. Badges are opaque.**
- a. Build a badge gallery reading the badge definitions, showing locked/unlocked with the earning criteria for each.
- b. Design badges around *desirable behaviors* (7-day streak, all concepts touched, 50 mistakes reviewed) rather than raw XP, nudging good study habits.

**38. Nothing pulls me back the next day.**
- a. Add a daily-goal ring (e.g., 20 XP/day) with a day-streak counter in `localStorage`, and an optional browser notification opt-in.
- b. Schedule return prompts to coincide with SM-2 due cards ("6 words are ready to review") — spacing works only if the learner returns on time, so make due-ness the hook.

**39. Mastery is invisible.**
- a. Surface `conceptMastery` as a progress ring per concept on the home screen with a clear "mastered" state.
- b. Show the *forgetting curve* idea lightly — a concept can drop from "mastered" back to "review" if neglected — which motivates spaced return rather than one-and-done.

**40. XP imbalance encourages grinding one mode.**
- a. Normalize XP per item across modes, or scale by difficulty rather than by mode identity.
- b. Reward *variety and interleaving* (a small bonus for practicing 3 different modes/day), since mixing formats improves transfer more than repeating the highest-XP one.

## Content quality

**41. Content is natural (keep the bar).**
- a. Add a lightweight review flag ("report awkward sentence") that logs the item for later human review.
- b. Keep a human-authored "gold" core per concept (the current static banks) as the quality floor, with AI expanding *around* it rather than replacing it.

**42. Vocab is now well-rounded.**
- a. Tag vocab by part of speech (already present) and let learners filter/practice by category.
- b. Prioritize the highest-frequency ~1,000 words (they cover the majority of everyday text) so study time targets maximal comprehension coverage.

**43. Repetition when AI is throttled.**
- a. Keep growing static banks and dedupe against `_recentGenerated`; raise the pre-gen buffer so a throttle doesn't immediately expose repeats.
- b. Even repeats have value if spaced — surface them as explicit "review" rather than "new," so the learner reads a repeat as reinforcement, not a bug.

**44. Occasional awkward AI sentences.**
- a. Tighten generation prompts with 2–3 in-prompt exemplars of the desired register, and add a validator that rejects over-long or oddly-punctuated outputs (you now do this for Spot-the-Error).
- b. Constrain to everyday registers and common vocabulary explicitly in the system prompt — natural, frequent language beats "impressive" but stilted output for learners.

## Mobile & accessibility

**45. Tap-to-place was the right call.**
- a. Keep it; audit touch-target sizes (≥44px) across tiles and buttons for small screens.
- b. One-handed, low-friction interaction lowers extraneous cognitive load, leaving more working memory for the Spanish itself.

**46. Accent buttons are essential.**
- a. Keep them; add long-press for capital accented letters and ensure they insert at the caret, not the end.
- b. Also accept common workarounds (typing "n~" or plain "n" for ñ) and normalize — reduce input friction so orthography never blocks demonstrating knowledge.

**47. ✅/❌ + color (not color-only).**
- a. Keep icon + color; verify contrast ratios meet WCAG AA and add an `aria-live` announcement of correct/incorrect (partially present).
- b. Redundant coding (icon + color + text) is inclusive design that also speeds recognition for everyone, not just colorblind users.

**48. Robotic TTS voice.**
- a. Prefer a higher-quality `es-*` voice when `speechSynthesis.getVoices()` offers one; let the learner pick the voice/rate.
- b. Label TTS as a "pronunciation hint," and where budget allows, use a neural TTS for modeled audio — accurate prosody matters for listening/speaking practice.

**49. No font-size / contrast control.**
- a. Add a settings toggle for larger text and a high-contrast theme, persisted to `localStorage`.
- b. Accessibility widens your usable audience (younger learners, low-vision, ESL contexts) — it's an inclusion and reach win, not just compliance.

## Reliability

**50. Spinners/dead-ends read as "broken."**
- a. Put a universal "Skip / Next" escape hatch on *every* AI mode (Speak/Translate have it) and a hard timeout on every `generateXData` that falls back to static or a friendly retry.
- b. Validate every AI response's shape before rendering — exactly the fix just applied to Spot-the-Error — so no malformed generation can ever freeze a mode; a graceful fallback protects trust and time-on-task, which is what actually drives learning.

---

## Cross-cutting priorities (where these 100 fixes cluster)
1. **Never dead-end** — validation + static fallback + universal Skip on every AI mode (points 21, 24, 44, 50).
2. **Make learning visible** — mastery rings, mistake review, daily goal (9, 34, 38, 39).
3. **Right difficulty, right order** — placement, adaptive difficulty, dependency-ordered path (3, 5, 10, 16).
4. **Feedback quality is the moat** — protect and standardize explanations; teach by contrast (31, 33, 35).
5. **Turn errors into scheduled retests** — wire misses into the existing SM-2 pool (34, 43, 28).
