# Spanish Lab — Session Handoff (2026-07-03)

*Read this end-to-end before touching code. It lets a new session (any model) continue without the prior context. Written for Felipe's `spanish-lab` project.*

---

## 1. What the project is
`spanish-lab` is a single-page Spanish-learning web app Felipe uses to teach real students. Everything lives in **`index.html`** (~9,000+ lines: HTML + CSS + JS in one file). It covers 11 grammar concepts (ser/estar, preterite/imperfect, subjunctive, por/para, gender, reflexive, tú/usted, present, gustar, word-order, object-pronouns) through ~16 practice modes (Pairs, Examples, Fill Blank, Builder, Translate, Story, Conjugate, Speak, Missing, Word Drop, Dialogue, Vocab, Spot-the-Error, Reading, Review, Sprint).

Several modes generate exercises live via **Google Gemini**, proxied through a Cloudflare Pages Function at **`functions/api/ai.js`** (so the API key never reaches the client). Others use hand-authored static banks in `index.html`.

There's also a separate **`spanish-teacher-dashboard.html`** (teacher tool) — its resource-generator feature was ported to the student app this session.

## 2. Deploy workflow (CRITICAL — never deploy from here)
- Repo: `chiriboga4202-commits/spanish-lab`, branch `main`. Local path `C:\Users\chiri\Claude\Projects\Personal-Automation\spanish-lab`.
- **Live site:** `https://spanish-lab.chiriboga-labs.workers.dev` (Cloudflare Pages; a git push triggers the build).
- **Felipe pushes, never the assistant.** He runs `push_fix.ps1` in Windows PowerShell:
  `cd C:\Users\chiri\Claude\Projects\Personal-Automation` then `.\push_fix.ps1 -Message "..."`. It runs `verify.js`, does `git add -A`, commits, pushes.
- **`node verify.js`** (run from inside `spanish-lab/`) is the pre-push gate: checks JS syntax, duplicate top-level function declarations, and that `init()` is invoked. It exits 0 = safe.
- **Standalone `node verify.js` must be run from `spanish-lab/`**, not `Personal-Automation/` (else MODULE_NOT_FOUND). It also runs automatically inside `push_fix.ps1`.

## 3. Environment gotchas (a new model MUST know these)
- **The sandbox bash file-mount desyncs mid-session.** `bash` (and `git`/`grep` via bash) can show a *stale, truncated* view of `index.html` and `exercises.json` — e.g. reporting the file is ~8,200 lines when it's really 9,000+. **Trust the `Read`/`Grep`/`Edit` tools over bash for file contents.** Early this session this caused a false "exercises.json is truncated" mis-diagnosis and a false "code is missing" read — both were mount artifacts.
- **Therefore `verify.js` / `node --check` cannot be trusted in-sandbox on `index.html`** (bash reads the truncated copy). Validation of the full file must happen on Felipe's machine. **Workaround used this session:** author each new JS block into `/tmp/x.js` and `node --check` it *standalone* before inserting via `Edit`; and after editing, `Grep` for `function <name>` to confirm no duplicate declarations.
- **Workspace→disk sync lag:** edits made here can take a moment to reach Felipe's actual disk. Once a push captured only part of a batch because the rest hadn't synced yet. Lesson: give the sync a beat; Felipe should confirm `git status` shows the file modified before pushing.
- **Editing rules (from Felipe's saved prefs):** use exact-string replacement, never broad regex (a past regex edit mutated unrelated strings). Keep `.ps1` files pure ASCII (a smart-dash once broke `push_fix.ps1`).
- The codebase still uses legacy `ollama*` names (`ollamaJSON`, `ollamaOnline`) — these are **aliases that route to Gemini** (`ollamaJSON`→`geminiJSON` when `aiBackend==='gemini'`; `ollamaOnline` is hardcoded `true` under Gemini). Felipe said leave them; do NOT rename.

## 4. The big root-cause fix (already pushed, for context)
Earlier this session: the month-long "everything AI fails" outage was because `functions/api/ai.js` called the **retired `gemini-2.0-flash`** (Google killed it 2026-06-01). Fixed to **`gemini-3.1-flash-lite`** + hardened parsing (filters thinking-model `thought:true` parts). Also converted 5 modes (Builder, Word Drop, Spot-the-Error, Missing, Vocab) from static-first to **AI-first** (the "Pairs pattern": AI leads, static bank only as offline/rate-limit fallback + ~20% variety + dedup). This is all PUSHED and live.

## 5. What this session added (grouped)
Most of the following is a mix of pushed and unpushed — see §6 for the exact unpushed list.

**Bug fixes / reliability**
- Spot-the-Error "stops clicking after two" — ROOT CAUSE: `escStr` produced `\"` for a JS string, but the value was interpolated into an HTML `onclick="..."` attribute where `\"` still closes the attribute → any double-quote in AI text killed the button. FIX: the click handler reads from stored state (`_steCurrent`), so **no AI text goes into onclick attributes**. Same hardening applied to **Pairs** (`pickCard` now reads from `currentPairData`).
- 12s hard timeout in `geminiCall` (no AI call can hang).
- Repetition reduced: anti-repeat memory 40→80 (`trackRecent` default), AI avoid-list 15→25 (`recentAvoidLine`).
- Encouraging tone: softened blunt "Wrong"/"Not quite." strings (Pairs, Fill Blank, Spot-Error, Conjugate).

**UX / motivation**
- Builder + Word Drop **partial credit** (per-word green/amber + partial XP; no more zero for one slip).
- **Mistakes persist** across reloads (`wrongAnswers` now saved to `localStorage` `sl_mistakes`).
- **"⭐ N/11 concepts mastered"** headline on the concept bar (`renderConceptBar`).
- **📚 Study menu** consolidating the 3 header reference buttons (Brief / Cheat Sheet / Study Sheets).
- **🔥 Day-streak** counter in the header (`computeDayStreak`; icon 📆 to avoid dup with the in-a-row 🔥).
- **⭐ "start here"** recommended-mode badge per concept (`recommendedModeFor` / `highlightRecommendedMode`).

**Study Sheets feature (NEW — the big one; see §7)**
- A full student-side AI study-sheet / vocab-toolkit generator ported from the teacher dashboard.

**Static bank expansions**
- `VOCAB_LIST` ~95→~171, `BUILDER_BANK` +68 (~6/concept, tú/usted to 16), `SPOT_ERROR_BANK` 10→24.

**Mobile fixes (latest, unpushed — see §6/§8)**
- `body` → `height: 100dvh` (fixes "had to zoom / bottom cut off"; 100vh overshoots on mobile chrome). + `overflow-x:hidden; max-width:100vw`.
- Font-size control now actually scales (was setting root font-size on a px layout = no effect; now `zoom` on `#exercise-area`).
- Study-sheet tables wrapped in `overflow-x:auto` (no modal overflow on phones).
- Theme toggle hidden on phones (`@media 480`, still in Settings).
- **Speech (`speakSpanish`) hardened for Android Chrome** — see §8 (this is the CURRENT OPEN ISSUE).

## 6. Current state: what is UNPUSHED
As of this handoff, a large batch is uncommitted in the working tree, spanning `index.html` AND `functions/api/ai.js`. It includes (verify exact set with `git status` / `git diff` on Felipe's machine): the mobile fixes, the day-streak, the 📚 Study menu, the ⭐ recommended-mode badge, the mistakes-persistence, mastery headline, and the **Study Sheets feature + its 5 refinement loops**, the `ai.js` `max_tokens` change, and the latest **speech rewrite**.
- **`functions/api/ai.js`** gained an optional `max_tokens` param (clamped 256–8192, default 2048) so long study sheets don't truncate. **Both files must be pushed together.**
- Next action for Felipe: `cd spanish-lab; node verify.js` → `push_fix.ps1`.

## 7. The Study Sheets feature (how it works)
Opened via header **📚 Study → 📄 Study sheets + quiz** (`openResources()`), modal `#resources-overlay`.
- Access: auto-targets the current concept AND a free-text topic box AND quick-topic chips (`pickResourceTopic`).
- **Quick sheet** vs **📚 Full toolkit** density toggle (`generateResourceSheet(false|true)`).
- Prompt builder: `buildResourcePrompt(topicName, full, mistakes)` — produces markdown with mental model → mnemonic → a required "confusable contrast" table → categorized vocab banks (Full = 50+ items, usage-split, frequency-ordered, el/la gender, phonetic hints) → example sentences → #1 mistake → "▶ Now practice" nudge. If personalization is on, injects the student's recent misses for the concept ("⚠️ Watch out").
- Calls Gemini via `callAIForResource` (direct `/api/ai` fetch, `max_tokens:8192`, 30s timeout).
- Renders with `renderMarkdownLite` (headers/tables/lists/bold; tables wrapped for mobile scroll).
- Actions: 🎯 Quiz me, 📌 Save (localStorage `sl_resources`, revisitable), 🖨 PDF (print view), 📄 Word (.doc via HTML blob), 📋 Copy. Personalization checkbox `#res-personalize`.
- **In-sheet quiz engine** (`quizFromSheet`, `quizMyMistakes`, `renderSheetQuiz`, `toggleQuizDir`, `revealQuiz`): flashcards from the sheet's vocab, EN→ES / ES→EN toggle, plus a standalone "🎯 Quiz me on my recent mistakes" built from `wrongAnswers`.
- **Testing loop convention:** we iterate as **"Chris"** (developer) making fixes and **"Gary"** (a strict student) giving feedback. The study-sheet prompt/feature went through 5 Chris↔Gary loops. Felipe wants this loop continued and pointed at the whole app; the last agreed target was Gary running a full mobile session. Give summaries of every loop and check in with Felipe via questions mid-session.
- **Untested against LIVE Gemini** from here (sandbox has no network to `/api/ai`). Felipe needs to confirm Full sheets actually hit 50-item banks / tables render / quiz extracts clean pairs; if thin, it's a prompt tuning fix in `buildResourcePrompt`.

## 8. OPEN ISSUE — speech on Android Chrome (in progress, unresolved)
Felipe reports 🔊 pronunciation still doesn't work on his **Android Chrome** phone (desktop works). Two fixes attempted; latest `speakSpanish` (in `index.html`) now:
- caches voices + refreshes on `voiceschanged`, "unlocks" TTS on first touch (silent priming utterance), calls `resume()` after speak (Chrome can start paused), and **self-diagnoses**: if voices are loaded but none are Spanish, tapping 🔊 shows a toast: *"No Spanish voice installed on this device…"*.
- **Leading hypothesis:** the device has no Spanish TTS voice installed → `es-ES` requests are silent with no error. Fix on the phone: Settings → System → Languages & input → Text-to-speech → Google TTS → install Spanish voice data.
- **Next step:** Felipe pushes, taps 🔊. If he sees the "no Spanish voice" toast → device fix. If NO toast and still silent → add a visible diagnostic (voice count / engine state) to see what the device reports. THIS IS THE FIRST THING TO RESOLVE next session.

## 9. Planning / feedback docs created (in `spanish-lab/`)
- `STUDENT_FEEDBACK.md` — 50-point student-perspective critique of the app.
- `FEEDBACK_FIXES.md` — 100 fixes (2 per point: engineering + pedagogy).
- `STUDENT_REACTION_TO_FIXES.md` — the student's (Gary's) reaction to those fixes; flags which "correct" fixes would actually make a student quit.
- `FIXES_TO_ADD.md` — the reconciled P0/P1/P2 build list (the real backlog).
- NOTE: while building, we found the app **already implements** much of the P1 list (resume, cheat sheet, daily goal, streak-freeze/forgiveness, weakest-concept nudge, difficulty toggle). Don't rebuild those — verify what exists first.

## 10. Backlog / next steps (priority order)
1. **Resolve Android speech** (§8) — push, test, act on the toast outcome.
2. Push the current unpushed batch and live-test the Study Sheets (§6/§7).
3. Continue the whole-app **Chris↔Gary loop** (last target: full mobile session). Deferred mobile items Gary flagged: group the 16 mode tabs, slim the header further.
4. Expand `STATIC_EXERCISES` (Pairs/Fill-Blank offline fallback, ~5→12/concept) — the one static bank not yet grown.
5. From `FIXES_TO_ADD.md` P0 still worth doing: static fallback for the fully-generative modes (Story/Dialogue/Examples) + a universal "Skip" on every AI mode.

## 11. Key files
- `index.html` — the whole app (edit here; validate on Felipe's machine).
- `functions/api/ai.js` — Gemini proxy (has the model fix + `max_tokens`).
- `verify.js` — pre-push checker (run from `spanish-lab/`).
- `push_fix.ps1` — in the PARENT `Personal-Automation/` folder; Felipe runs it.
- `exercises.json` — 325-item static bank loaded at runtime (`loadStaticExerciseBank`); intact (a "truncated" scare was a bash-mount artifact).
- Memory/session log also saved at `C:\Users\chiri\project-alpha\memory\chats\session-2026-07-03-spanish-lab-ai-first-fixes.md` (searchable via the `recall` skill).
