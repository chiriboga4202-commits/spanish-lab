# Spanish Lab — Full Session Handoff (2026-07-05, replaces 2026-07-03 handoff)

Read this end-to-end before touching code. It lets a new session (any model — written for Opus 5) continue Felipe's Spanish Lab project without prior context. Everything described here was built and verified on 2026-07-05 across one long session; searchable per-session logs also live at `C:\Users\chiri\project-alpha\memory\chats\session-2026-07-05-*.md` (three files, searchable via the `recall` skill / `search.js`).

## 1. What the project is
`spanish-lab` is a two-app Spanish-teaching system Felipe uses with real students:
- **Student app**: `index.html` (~11,000+ lines, single file: HTML+CSS+JS). 11 grammar concepts, ~16 practice modes, gamification (XP/levels/streaks/SM-2 review), AI-generated exercises via Gemini.
- **Teacher dashboard**: `spanish-teacher-dashboard.html` (~4,000 lines, single file). Now a REMOTE CLASS CONTROL CENTER (restructured today): student roster central, lesson/concept content hidden behind a header 📖 toggle.
- **Backend**: Cloudflare Pages Functions in `functions/api/` + one KV namespace (`PROGRESS_KV`, bound in `wrangler.jsonc`). No other infra.
- Both apps are installable PWAs (`sw.js` network-first, never caches `/api/*`; `manifest.json` student, `teacher-manifest.json` teacher). Felipe has the teacher app installed on his Android phone.

## 2. Deploy workflow (CRITICAL — never deploy from the sandbox)
- Repo `chiriboga4202-commits/spanish-lab`, branch `main`. Local path `C:\Users\chiri\Claude\Projects\Personal-Automation\spanish-lab`.
- Live site: `https://spanish-lab.chiriboga-labs.workers.dev` (git push triggers build). Teacher dashboard at `/spanish-teacher-dashboard.html`.
- FELIPE pushes, never the assistant: `cd C:\Users\chiri\Claude\Projects\Personal-Automation` then `.\push_fix.ps1 -Message "..."`. It runs `verify.js`, `git add -A`, commits, pushes.
- `node verify.js` MUST be run from inside `spanish-lab/` (else MODULE_NOT_FOUND). Checks JS syntax, duplicate top-level function declarations, init() invocation. Exit 0 = safe.
- Keep `.ps1` files pure ASCII. Use exact-string edits, never broad regex.

## 3. Environment gotchas (a new model MUST know)
- **Sandbox bash file-mount desyncs mid-session** — bash/git-via-sandbox can show stale truncated files. Trust Read/Grep/Edit tools. Run git and verify.js on Felipe's real machine via Desktop Commander (`start_process`, shell powershell).
- **Syntax validation convention**: author new JS blocks into `/tmp/x.js` in the sandbox, `node --check`, then insert via exact-string Edit. After inserting, Grep `function <name>` for duplicates. For the teacher dashboard + ES-module function files, use the extractor script pattern saved at `C:\Users\chiri\AppData\Local\Temp\sl_verify_all2.js` (extracts inline <script>s, checks function files as .mjs).
- **Mobile testing**: Chrome window will NOT resize on Felipe's machine (resize_window no-ops, F11/devtools keys don't reach browser UI). THE method: inject a sized same-origin iframe into the page (`#garyPhone`, e.g. 390×700) — media queries fire on the iframe viewport; drive via contentWindow JS + real clicks. For local (unpushed) testing, serve with `python -m http.server 8799` from spanish-lab/ on Felipe's machine and iframe against localhost.
- Legacy `ollama*` names in the student app (`ollamaJSON`, `ollamaOnline`) are ALIASES routing to Gemini — do NOT rename. The teacher dashboard is fully migrated to `aiGenerate()` → `/api/ai`.
- Cloudflare KV `list()` is eventually consistent (~60s) — readback lag after a write is normal, not a bug.
- The static exercise banks' fillblank items use `correct:0` convention (answer is always first option) — ANY quiz built from them MUST shuffle options with index remapping.
- scrollIntoView gets stranded by async re-renders — use the double re-assert pattern (`_mScrollTo`: scroll, again at 450ms, again at 1200ms).

## 4. Backend architecture — endpoints & KV keys
All in `functions/api/`, all share the PIN pattern: teacher ops require header `x-teacher-pin` (or `?pin=`) matching env Secret `TEACHER_PIN` or `TEACHER_PIN2` (co-teacher); everything is OPEN while both env vars are unset (migration path). Felipe HAS set TEACHER_PIN (as a Cloudflare Secret — plain vars get wiped by deploys).
- `ai.js` — Gemini proxy. POST {prompt, temperature, max_tokens(256-8192)} → {content}. Model: gemini-3.1-flash-lite. Both apps use it for everything AI.
- `progress.js` — POST (open): student snapshot keyed by studentId (see §6 payload). GET (PIN): full roster. DELETE ?studentId= (PIN). POST also AUTO-UNLOCKS next topic when KV `path_auto`===true and payload.pathState.ready.
- `assignments.js` — GET (open) class queue; GET ?studentId= adds {personal} from KV `teacher_queue_per`. POST (PIN): {queue} class-wide or {studentId, queue} personal.
- `path.js` — linear path. GET ?studentId= (open) → {unlocked:N}. GET (PIN) → {map, auto}. POST (PIN): {studentId, unlocked} or {auto:bool} (sets `path_auto`).
- `announce.js` — GET (open): {announcement:{text,ts}, classAuto, sheet:{title,md,ts}}. POST (PIN): {text} banner (empty clears), {classAuto:bool} (KV `class_auto`), {sheet:{title,md}} (KV `class_sheet`, empty md clears). Writes audit entries.
- `snapshot.js` — GET (PIN): creates `snap_<YYYY-MM-DD>` copy of all stu_ records, prunes >7 days; `?date=` returns a stored snapshot (feeds trend arrows); `?audit=1` returns KV `audit` log (last 50 teacher actions).
- `notes.js` — teacher-only notes/renames. GET (PIN) → {notes: map}. POST (PIN) {studentId, note?, rename?} → KV `teacher_notes`. Renames are DASHBOARD-DISPLAY-ONLY.
- KV keys inventory: `stu_*` (student records), `teacher_queue` (class assignments), `teacher_queue_per`, `path_unlocks`, `path_auto`, `announcement`, `class_auto`, `class_sheet`, `teacher_notes`, `audit`, `snap_<date>`.

## 5. The linear learning path (core mechanic)
- `LEARNING_PATH` (same array in BOTH files, must stay in sync — dashboard copy is `TD_PATH`): ser-estar, gender, present, tu-usted, gustar, word-order, reflexive, obj-pronouns, por-para, pret-imp, subjunctive. Felipe approved this order (his fixed anchors: ser-estar #1, gender #2).
- Locked topics: 🔒 dimmed chips; `selectConcept` guard; mixed mode filters pool; TEACHER ASSIGNMENTS BYPASS LOCKS (assignment = permission).
- **Checkpoint** (`startCheckpoint`, sectioned): PATH_SECTIONS = A Recognition 16 pairs pass 13 · B Application 16 fillblank pass 13 · C Production 4 builder pass 4/4 (~83%). Questions from static banks with shuffled options + index remap; builder uses index-tracked tap-to-build (handles duplicate words). Failed section retaken ALONE (passed sections banked in `_pathState.sections[topic]`); topic passes when all 3 green. Perfect sections get ⭐. Difficulty = the 4-line PATH_SECTIONS constant only.
- Flow: pass → `pathReadyInfo()` in sync payload → dashboard READY badge → teacher ✓ Unlock (or "set topic…" override, or auto-approve) → student polls `/api/path` every 120s → 🔓 toast.
- Grandfathering ran once per device: topics ≥75% acc & 8+ attempts auto-passed in order until first gap (`_pathState.grandfathered`).
- **Path bar** (`renderPathBar`, always visible under concept bar): 📍 Topic N/11, dots, 🎯 What now? button, 🏁 CTA that pulses green when frontier mastery ≥75%/8+.

## 6. Student→teacher sync (60s throttle + sendBeacon on unload)
`syncProgressToTeacher()` payload: studentId (sl_student_id, random persistent), name, xp, level, bestStreak, mastery (conceptMastery), dueCount, recent (last 15 answer events {ts,correct,question,mode,concept}), lastRecap {ts,md}, constellation {ts,clusters}, pathState {unlocked, topic, passed, ready}, flags (👎 reports, last 10), announceSeen (read-receipt ts), lastError (JS error <24h), lastActive. `markSynced()` shows ☁️✓ dot bottom-left.

## 7. AI teaching philosophy — EXPLAIN_STYLE
`EXPLAIN_STYLE` const (student app) — 9 rules prefixing EVERY explanatory AI prompt: function-first (the JOB grammar does), English-anchor, mnemonic constraints (acronym AND ≤7-word decision-question), concrete-before-abstract, 80/20 gate, flip-pairs, 12-year-old reading level, one physical analogy, exit question. `SYSTEM_EXERCISE` rule 5 forces ALL exercise feedback/explanations into ENGLISH (Dialogue mode exempt — it's conversation practice). One place to tune the teaching voice. This encodes Felipe's core belief: teach how the language WORKS before drilling grammar forms.

## 8. Feature inventory built 2026-07-05 (all live or in final unpushed batch)
STUDENT: name prompt (first visit), announcement banner, comeback nudge (class-auto) + comeback XP bonus, session recap (grade modal + Study menu), concept mind map (JSON tree, risk-colored), mistake constellation + drill, study sheets (pre-existing, EXPLAIN_STYLE'd), checkpoint system, path bar, 🎯 What now?, ⏭ Skip, 👎 flag exercise, ❓ Ask-the-tutor, 🎓 Explain more (on any miss), daily micro-lesson (1 AI call/day), static fallbacks (Examples derives from banks; STORY_FALLBACK = 11 authored stories; dialogue graceful), typo tolerance (edit distance 1 = 🤏 half XP), 🐢 slow replay (double-tap 🔊), haptics, +XP float, loading facts (SPANISH_FACTS), level titles, weekly recap toast, PWA badge (due count), accent color picker + hours odometer (Settings), reduced-motion, aria labels, checkpoint hotkeys 1-9, mobile group tabs (4 chips filter 16 modes ≤640px), tu-usted bank at 25/25 parity (B6 batch).
TEACHER: remote roster (collapsible cards: concept bars, 🎬 replay, 📝 recap mirror, 🌌 patterns, 🤖 AI summary, 📝 note, ✏️ rename, 📋 assign, set topic, ✓ unlock, ⚑ flags, ⚠️ error telemetry, 🟢 live-now, NEW chip, ▲▼ trend arrows), 📊 Class intelligence (🤖 daily triage, needs-attention, heatmap, most-missed, 📶 topic funnel, read receipts, 🤖 lesson plan, 📣 announce, ⬇ backup JSON, 📊 CSV, 📩 push sheet, 🧾 audit log, auto-refresh 90s, auto-approve + 📦 class-in-a-box toggles), roster search/sort, daily KV snapshot on open, movable sections + sticky bottom nav ≤1023px, **RESTRUCTURED LAYOUT (latest)**: students own the wide center column; lesson/concept column hidden unless `body.lesson-open` (header 📖 toggle, persisted td_lesson_open, curriculum clicks auto-open). Desktop hide uses `body:not(.lesson-open) main { display:none !important }` in a min-1024 media block (the !important is required — base `main{display:flex}` comes later in the cascade; without it the panel collapses to 1px).
Idea files (repo): `TEACHER_DASHBOARD_IDEAS.md` (30, 14 shipped), `STUDENT_UX_IDEAS.md` (100), `TEACHER_AUTOMATION_IDEAS.md` (100). ~53 shipped total; each file marks status.

## 9. Key localStorage keys (student `sl_*`, teacher `td_*`)
sl_: student_id, name, name_prompted, xp, mastery, mistakes, path (passed/sections/teacherUnlocked/grandfathered/migrated), last_mode, last_concept, live_feed, live_history, last_recap, last_constellation, flags, announce_seen, last_visit, prev_visit, comeback_day, micro_last, week_recap, accent, time_min, teacher_queue, resources, last_error, best_streak, badges, theme, sound.
td_: pin, sec_order (default [2,1,0] tools-first), sec_collapsed, lesson_open, triage_date/text, snap_date, last_open.

## 10. Current state & immediate next steps
- UNPUSHED at handoff: possibly the final tranche + dashboard restructure (check `git status` — Felipe may have pushed). Everything passes verify.js + the all-files syntax check.
- Felipe's pending actions: push; phone re-pass (force-close PWA once for SW update); optionally TEACHER_PIN2.
- **NEXT AGREED WORK — Felipe was choosing from this decision menu when the session ended:**
  1. Multi-class/class codes (needs KV data-model decision)
  2. Realtime classroom modes (live lights, sprint races, quick-polls — needs polling/Durable Objects decision)
  3. Web push notifications (needs VAPID + subscription store)
  4. Student onboarding tour + goal picker (needs Felipe's taste on flow/copy)
  5. Visual path editor / checkpoint composer (teacher-editable curriculum via KV config)
- Older open items: Gary loop 2 (do students find Conjugate under "Write & speak"?), Speak-mode streak-reset softening, real-iPhone check, mode renames to student language (needs Felipe approval).

## 11. Working conventions with Felipe
- Direct, no fluff, pushback welcome. He approves scope via multiple-choice questions; ask before big builds. Present sequences/designs for sign-off, then build without hand-holding.
- Chris↔Gary loop: iterate as "Chris" (developer) and "Gary" (strict student persona) for QA passes; summarize every loop.
- Task-list everything; verify (syntax + no-dup + verify.js) before declaring done; live-test production endpoints from Felipe's machine via Desktop Commander + node fetch (temp scripts in C:\Users\chiri\AppData\Local\Temp\sl_*.js — several reusable test harnesses live there).
- Save sessions via the save-session skill to project-alpha memory; `recall <keyword>` searches them.

## 12. Key files
- `index.html` — student app (edit here; validate via /tmp + verify.js on Felipe's machine)
- `spanish-teacher-dashboard.html` — teacher dashboard
- `functions/api/*.js` — 7 endpoints (see §4)
- `sw.js`, `manifest.json`, `teacher-manifest.json` — PWA layer
- `verify.js` — pre-push gate; `push_fix.ps1` — in PARENT folder, Felipe runs it
- `exercises.json` — 325-item static bank (intact; old "truncated" scare was a mount artifact)
- `wrangler.jsonc` — PROGRESS_KV binding
- Idea backlogs: TEACHER_DASHBOARD_IDEAS.md, STUDENT_UX_IDEAS.md, TEACHER_AUTOMATION_IDEAS.md
