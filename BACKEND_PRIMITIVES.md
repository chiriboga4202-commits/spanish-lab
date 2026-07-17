# Backend Primitives — Multi-tenancy + Per-Student Config (2026-07-15)

New shared infrastructure that the rest of the idea backlogs build on. Nothing
here is deployed yet — Felipe pushes via `push_fix.ps1` after review. All keys
live in the existing `PROGRESS_KV` namespace; no new binding needed.

## What changed (for San-sync)

New files:
- `functions/api/classes.js`        — class registry (teacher, PIN)
- `functions/api/join.js`           — class-code lookup (student, open)
- `functions/api/student-config.js` — per-student config store (filename MUST
  stay hyphenated: Pages routes by filename -> /api/student-config)

Edited:
- `functions/api/progress.js`       — roster GET now shape-guards `list()`:
  `students.filter(s => s && s.studentId && s._type !== 'cfg')`. This keeps the
  new `cfg_*` keys (and pre-existing system keys) out of the roster. No client
  change required, but it also stops non-student junk that was silently passing
  through before.

## Multi-tenancy model — additive, NO destructive migration

The core idea: **`classId` is optional. Absent == the implicit `"default"`
class.** Existing student records are untouched; they read as `default` until a
student joins a code. Existing class-wide endpoints (progress, path, announce,
assignments) stay GLOBAL for now = the default class. Per-class scoping of those
is a deliberate LATER pass — this session only lays the registry + join seam.

KV keys:
- `classes`        -> `{ [classId]: { id, code, name, createdTs, accent? } }`
- `code_<CODE>`    -> `classId`   (O(1) join lookup; codes are 5 chars, alphabet
  excludes 0/O/1/I/L)

Endpoints (`/api/classes`, PIN except where noted):
- `GET  /api/classes`               -> `{ classes: [...] }`
- `GET  /api/classes?ensureDefault=1` -> seeds the `default` class if missing
- `POST /api/classes {name, accent?}` -> creates a class, returns `{id, code, name}`
- `POST /api/classes {id, rename, accent?}` -> renames
- `DELETE /api/classes?id=`         -> removes a class + its code index

Join (`/api/join`, OPEN — students must self-join):
- `GET /api/join?code=SPN4B` -> `{ found, classId, className, accent }` or 404.
  Code input is normalised (uppercased, non-alnum stripped).

Student-app wiring (NOT built this session — next step):
1. Prompt for a class code (optional; skip = stay in default class).
2. `GET /api/join?code=` -> store `classId` in `localStorage.sl_class_id`.
3. Include `classId` in every `syncProgressToTeacher()` payload so
   `progress.js` writes it onto the student record.

## Per-student config primitive

One record per student: `cfg_<studentId>`
```
{
  _type: 'cfg', studentId, classId,
  assignments: [ { id, mode, concept, count, due, note, createdTs, status, doneTs } ],
  dailyGoal,            // null = class default (30)
  difficulty,           // null | 'beginner' | 'normal' | 'hard'
  checkpointThreshold,  // null = default | 0.40..1.00
  frozen, vacation,     // teacher controls
  updatedTs
}
```
Extends (does not replace) `assignments.js`/`teacher_queue_per` — adds due dates
+ completion state the old flat array lacked. `notes.js` still owns note/rename;
folding it into `cfg_` is a later pass.

Endpoints (`/api/student-config`):
- `GET  ?studentId=`            OPEN — student reads own config to apply it
- `GET`  (no studentId, PIN)    -> `{ configs: { [studentId]: cfg } }` (prefix-scoped list)
- `POST {studentId, patch:{...}}`            PIN — merge config fields
- `POST {studentId, addAssignment:{mode,concept,count,due?,note?}}`  PIN
- `POST {studentId, removeAssignment:id}`    PIN
- `POST {studentId, setAssignments:[...]}`   PIN
- `POST {studentId, completeAssignment:id}`  OPEN — student self-reports done
  (allowed ONLY when it's the sole operation; can't touch goals/freeze)

## What each primitive unlocks (backlog)
- Config primitive: AUTO #32,#33,#34,#35,#36,#38 · DB #9,#10,#15
- Class registry:   AUTO #42,#43,#45,#51,#91,#93,#94,#95 · DB #27

## Client wiring — DONE 2026-07-15 (session 2)

Student app (`index.html`):
- `classId` now rides in the `syncProgressToTeacher()` payload (`sl_class_id`).
- First-visit prompt gained an optional **class-code** field -> `joinClass()`
  resolves `/api/join`, stores `sl_class_id` / `sl_class_name`.
- `fetchStudentConfig()` polls `/api/student-config?studentId=` on load + every
  120s; `applyStudentConfig()` enforces **freeze** (blocking overlay) and feeds
  **personal assignments** (with due dates) into `renderAssignmentBanner()`.
- difficulty / checkpointThreshold / dailyGoal are STORED in `window._slCfg`
  but not yet applied — deeper hooks (exercise gen / PATH_SECTIONS / goal ring)
  need a live-test pass before wiring.

Dashboard (`spanish-teacher-dashboard.html`):
- `🏫 Classes` button in roster controls -> `manageClasses()` (list + create,
  shows the join code).
- Each roster card has a control panel: status badges (paused / goal / level /
  N assigned) + buttons `📌 assign+due`, `🎚️ goal`, `⚡ level`, `⏸️ freeze`,
  backed by `loadConfigs()` / `_patchStudentCfg()` / `assignWithDue()`.

## Snapshot / trend backbone — DONE 2026-07-15 (session 3)

The time-series foundation for DB #1/#4 and AUTO #8/#11/#20/#25/#29.

- `snapshot.js`: retention 7 -> **30 days**; new **`?series=1`** (PIN) returns
  `{ dates, series:{ studentId:[ {date,xp,level,acc,due} ] } }`; writes a
  `snap_last` marker.
- `progress.js`: **automatic daily snapshot** — the first student write each day
  fires `maybeDailySnapshot(env)` via `context.waitUntil()` (off the response
  path, guarded by `snap_last` as a once/day lock). This REPLACES a Cloudflare
  cron trigger, which Pages Functions don't reliably support — no separate
  scheduled worker to deploy or keep in sync. Dashboard-open still snapshots too.
- Dashboard: `loadSeries()` + `_sparkline()` render a per-student **XP sparkline
  + delta** on each roster card (first consumer, proves the backbone).

Note: nightly OFF-SITE backup (#81) is a separate concern from trends and is
still open — the ⬇ Backup JSON button remains the manual path.

### Post-harness fixes (2026-07-15)
- **Route:** `studentconfig.js` renamed to **`student-config.js`** — Pages routes
  by filename, so the old name served `/api/studentconfig` while every caller
  used `/api/student-config`. Keep it hyphenated.
- **Snapshot marker:** the once/day lock key was `snap_last`, which shares the
  `snap_` prefix — so `list({prefix:'snap_'})` picked it up and tried to
  JSON-parse its value `"2026-07-15"`, crashing `?series=1`. Renamed to
  **`last_snapshot`** (snapshot.js + progress.js) and added a `SNAP_RE`
  (`/^snap_\d{4}-\d{2}-\d{2}$/`) guard to every place that lists+parses
  snapshots (snapshot.js series & prune, rules.js series build). A leftover
  `snap_last` key may linger in prod KV — harmless (ignored by the guard);
  delete via `DELETE /api/progress?studentId=snap_last&pin=...` if desired.

## Rules engine — DONE 2026-07-15 (session 4)

The generic "WHEN condition DO action" primitive behind the zero-touch cluster
(AUTO #1-5, #9, #14, #100). New `functions/api/rules.js`.

- Rules: `{ id, name, enabled, when:{metric,op,value,window}, action:{type,params} }`
  stored in KV key `rules`.
- Metrics: `inactive_days`, `accuracy_pct`, `xp_gain` (over `window` days, from the
  snapshot series), `due_count`. Ops: gt/gte/lt/lte/eq.
- Actions: `flag` (-> `rules_flags` {studentId:[...]}, teacher-facing),
  `assign_concept` (-> cfg assignment), `set_goal` (-> cfg dailyGoal).
- Dedupe: `rules_state` {ruleId:{studentId:ts}} with a ~20h cooldown so nothing
  spams. Respects `vacation`.
- Endpoint ops (all PIN): GET {rules,flags,meta}; POST {evaluate}|{seedDefaults}|
  {rules:[...]}|{rule:{...}}|{toggleRule}|{deleteRule}|{clearFlags}|{clearFlagsFor}.
- SAFE BY DEFAULT: 3 seeded starter rules are flag-only (inactive 3+ days, accuracy
  <55%, no XP gained in 7d). assign_concept/set_goal only run for rules the teacher
  creates.

TRIGGER: evaluates on dashboard open (once/load, not per 90s auto-refresh) + a
"Run now" button. No Cloudflare cron (Pages can't) and no write-path cross-file
import (avoided as fragile). Fully-autonomous running = a future scheduled task
hitting POST {evaluate:true} — offered but not built (needs a PIN-handling call).

Dashboard: `⚙️ Rules` button -> `manageRules()` (list/toggle/seed/run/clear);
red/amber `⚑ N` flag chips on roster cards from `loadRulesFlags()`.

## Not done yet (next sessions)
- Apply difficulty / checkpointThreshold / dailyGoal in the student app
  (deferred pending live-test — they touch checkpoint + exercise mechanics).
- Fold `notes.js` note field into `cfg_` (single per-student store).
- Per-class scoping (Tier-0 completion). STARTED 2026-07-15: dashboard now has a
  **class filter** (`class-filter` select + `_classFilter` + `applyRosterView`
  filter by `s.classId||'default'`; `loadClasses`/`classNameOf`/
  `refreshClassFilterOptions`; per-student 🏫 class chip).
  - Per-class ANNOUNCEMENTS DONE 2026-07-15: `announce.js` GET ?class= + POST
    {text,class} use key `announcement_<classId>` (class overrides, else global
    fallback; default/all = global). Dashboard `composeAnnouncement()` targets
    the currently-filtered class (`_classFilter`); student app passes
    `?class=sl_class_id` in checkAnnouncement + openClassSheet.
  - Per-class AUTO-APPROVE DONE 2026-07-15: path unlocks were already
    per-student; the only global path state was `path_auto`. Now `path.js` POST
    {auto,class} + GET ?class= use `path_auto_<classId>` (class flag wins if
    set, else global). `progress.js` auto-approve reads the student's class
    policy (`body.classId` -> `path_auto_<classId>` -> global fallback).
    Dashboard `setAutoApprove`/`_loadAutoApprove` target `_classFilter`.
  - Per-class ASSIGNMENT QUEUE + CLASS POLICIES DONE 2026-07-15: `assignments.js`
    GET ?class= / POST {queue,class} use `teacher_queue_<classId>` (else global);
    `announce.js` scopes `class_auto_<classId>` + `class_sheet_<classId>` (else
    global). Dashboard syncQueueToServer/renderQueue/setClassBox/pushClassSheet/
    _loadClassBox target `_classFilter`; student app passes `&class=sl_class_id`.
  - MULTI-TENANCY COMPLETE for core teaching controls. Remaining: per-class path
    VARIANTS = the deferred KV-driven curriculum primitive (separate/larger).

## Student overrides — dailyGoal DONE 2026-07-15 (session 5)
`applyStudentConfig()` now applies `cfg.dailyGoal` at runtime (sets the module
`dailyGoal` var + `updateDailyDisplay()`), WITHOUT writing `sl_daily_goal` — so
the student's own goal returns if the teacher clears the override. difficulty +
checkpointThreshold still STORED-not-applied: they touch exercise-gen /
PATH_SECTIONS (checkpoint pass logic) and need live-testing before wiring.
- Remaining primitives: snapshots-as-backbone, cron, rules engine, realtime,
  web push, parent read-view.
