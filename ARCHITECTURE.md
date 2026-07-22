# Spanish Lab — Architecture (current state, 2026-07-15)

Single source of truth for the live system so Felipe and San stay in sync.
Deep design notes live in `BACKEND_PRIMITIVES.md`; session logs in project-alpha
memory (`recall <keyword>`). This file = the map.

## Apps
- **`index.html`** — student app (~11k lines, single file: HTML+CSS+JS). Grammar
  concepts, practice modes, gamification, AI exercises, linear path, checkpoints.
- **`spanish-teacher-dashboard.html`** — teacher remote control center (~4k
  lines). Roster, per-student controls, class management, automation, class intel.
- **`parent.html`** — read-only parent progress view (token-gated).
- Backend: Cloudflare Pages Functions in `functions/api/` + one KV namespace
  (`PROGRESS_KV`, bound in `wrangler.jsonc`). No other infra.
- All three are PWAs (`sw.js` network-first, never caches `/api/*`).

## Deploy
- Repo `chiriboga4202-commits/spanish-lab`, branch `main`. Live:
  `https://spanish-lab.chiriboga-labs.workers.dev`.
- **Felipe pushes, never the assistant:** from `Personal-Automation/`,
  `node spanish-lab/verify.js` (must exit 0) then `.\push_fix.ps1 -Message "..."`.
- Pages routes Functions **by filename**: `functions/api/foo.js` -> `/api/foo`.
  (Bit us once: `studentconfig.js` had to become `student-config.js`.)
- Sandbox bash mount desyncs mid-session — validate via `verify.js` on the real
  FS through Desktop Commander, trust Read/Grep over bash for file state.

## Auth
- Teacher ops require header `x-teacher-pin` (or `?pin=`) matching env secret
  `TEACHER_PIN` or `TEACHER_PIN2` (co-teacher). Open while both unset (migration).
  `TEACHER_PIN` IS set (as a Cloudflare Secret — plain vars get wiped by deploys).
- Student reads/writes are open. Parent view is token-gated (per-student token).

## Endpoints (`functions/api/`)
| Endpoint | Open? | Purpose |
|---|---|---|
| `ai.js` | open | Gemini proxy. POST {prompt,...} -> {content}. |
| `progress.js` | POST open / GET,DELETE PIN | Student sync (POST), roster (GET, shape-guarded), delete. **On write: auto-approve (per-class), daily snapshot, hourly rules run — all via waitUntil.** |
| `student-config.js` | GET?studentId open / else PIN | `cfg_<id>`: assignments(+due), dailyGoal, difficulty, checkpointThreshold, frozen, vacation, parentToken. |
| `classes.js` | PIN | Class registry: create/list/rename/delete. |
| `join.js` | open | `?code=` -> {classId, className}. |
| `assignments.js` | GET open / POST PIN | Class queue (per-class via `?class=`/`{class}`) + per-student `teacher_queue_per`. |
| `path.js` | GET?studentId open / else PIN | Per-student unlocks; per-class auto-approve flag. |
| `announce.js` | GET open / POST PIN | Announcement, classAuto, class sheet — all per-class w/ global fallback. |
| `snapshot.js` | PIN | Daily snapshots, `?series=1` trend series (30d), `?audit=1`, `?date=`. |
| `rules.js` | PIN | Automation engine (WHEN/DO). Exports `evaluateRules` (progress.js imports it). |
| `parent.js` | token | Read-only curated progress for one student. |
| `notes.js` | PIN | Private teacher notes + display renames. |
| `email.js` | PIN (+ exports sendEmail) | Resend email: POST sends to a student; rules engine imports sendEmail for the `email` action. Needs RESEND_API_KEY + EMAIL_FROM. |

## KV keys (all in `PROGRESS_KV`)
- Students: `stu_<id>` (studentId is `stu_`-prefixed random).
- Per-student config: `cfg_<id>` (`_type:'cfg'`).
- Classes: `classes` (registry map), `code_<CODE>` -> classId.
- Assignments: `teacher_queue`, `teacher_queue_<classId>`, `teacher_queue_per`.
- Path: `path_unlocks` (map), `path_auto`, `path_auto_<classId>`.
- Announce: `announcement`, `announcement_<classId>`, `class_auto`,
  `class_auto_<classId>`, `class_sheet`, `class_sheet_<classId>`.
- Snapshots: `snap_<YYYY-MM-DD>` (30d), `last_snapshot` (marker — NOT snap_-prefixed).
- Rules: `rules`, `rules_flags`, `rules_state`, `rules_last` (hourly marker).
- Misc: `teacher_notes`, `audit`.

## Multi-tenancy model (COMPLETE for core controls)
`classId` is **additive** — absent == implicit `"default"` class, so nothing
pre-existing broke. Students join via a code (`/api/join`), store `sl_class_id`,
and send it in every sync. Every class-scoped feature uses `<key>_<classId>`
with a fallback to the global key. Class-scoped: roster view (dashboard filter),
announcements, auto-approve, class-in-a-box (classAuto), class sheet, assignment
queue. Per-student unlocks were already per-student. NOT yet class-scoped:
curriculum ORDER/variants (needs the KV-driven-curriculum primitive).

## Primitives built (2026-07-15)
1. **Multi-tenancy** (classes/join + per-class scoping).
2. **Per-student config** (`cfg_<id>`, dashboard control panel, student apply).
3. **Snapshot/trend backbone** (auto daily snapshot, `?series=1`, sparklines).
4. **Rules engine** (WHEN/DO, autonomous on write path, dashboard manager).
Plus: parent read-only view; per-card render hardening.

## Client wiring map
- Student `syncProgressToTeacher()` payload includes `classId`.
- Student reads config (`fetchStudentConfig` -> freeze overlay, personal
  assignments, dailyGoal); reads announce/sheet with `?class=`; reads assignments
  with `&class=`; joins via first-visit class-code field (`joinClass`).
- Dashboard render flow (`refreshStudentProgress`): fetchRoster -> loadNotes ->
  loadConfigs -> loadSeries -> evaluateRulesOnce -> loadRulesFlags -> loadClasses
  -> render cards (each in its own try/catch). Controls target `_classFilter`.

## Deliberately NOT applied yet
- Student-side **difficulty** + **checkpointThreshold** overrides (stored in
  `cfg`, not wired — they touch checkpoint/exercise mechanics, need live-testing).

## Student-facing modules (2026-07-15) — all in index.html, self-contained
Each is its own IIFE: injects its own CSS/DOM, reuses shared globals
(speakSpanish, ollamaJSON, CONCEPTS, STATIC_EXERCISES, conceptMastery), touches no
existing HTML. Launched from ONE ✦ launcher (folds the old 📖/📝/🧠 FABs).

- **MITOS comic reader** (`openComic`) — paged webtoon reader for the saga.
  Episode data `EP` inline (pilot s1e1). 3 live levels (Fácil/Intermedio/Nativo)
  swap captions instantly; English-subtitle toggle; tap-word gloss; TTS; panel art
  from `mitos/s1e1/pN.png` (emoji fallback). Vocab captured with sentence+episode
  → own SM-2 track `sl_mitos_srs` (NOT main deck) + end-of-episode "Practicar".
  Library plan: `MITOS_LIBRARY.md` (30 chapters); producer `../generate_library.mjs`.
- **Worksheet player** (`openWorksheet`) — self-contained graded quiz from
  STATIC_EXERCISES (options SHUFFLED w/ correct-value tracking — banks store answer
  as option[0]). Assignable (type:'worksheet'); completion → completeAssignment.
- **El Cerebro** (`openCerebro`) — force-directed knowledge graph on canvas
  (hand-rolled physics, no lib). Concept-neurons wired by CONCEPTS.requires +
  association links; MITOS word-neurons; micro-neurons sprout per correct answer
  (growth = the WEB, not node size). Additive bloom, traveling signals, particles.
  Tap a concept → in-brain micro-practice feeds REAL conceptMastery (sl_mastery,
  same store as whole app) + grows it live + ticks a neuronas/sinapsis meter.
  Decay: sl_concept_seen → stale neurons desaturate + pulse 'repasar'.

## Assignment types (cfg.assignments items)
`type` ∈ practice {concept,mode,count} · episode {episodeId,title} · worksheet
{concepts[],size,title}. All carry {id,due,status,doneTs}. Delivered in the
student's assignment banner (tappable per type); rules engine can auto-assign each
(assign_concept / assign_episode / assign_worksheet actions).

## Open / future
- Tier-3: realtime classroom, web push (VAPID). KV-driven curriculum (per-class
  path variants, custom topics, visual path editor). Nightly off-site backup.
  Fold `notes.js` into `cfg_`. Large client-only UX backlog (blocks on nothing).
