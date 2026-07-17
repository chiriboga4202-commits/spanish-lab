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

## Open / future
- Tier-3: realtime classroom, web push (VAPID). KV-driven curriculum (per-class
  path variants, custom topics, visual path editor). Nightly off-site backup.
  Fold `notes.js` into `cfg_`. Large client-only UX backlog (blocks on nothing).
