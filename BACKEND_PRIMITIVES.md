# Backend Primitives — Multi-tenancy + Per-Student Config (2026-07-15)

New shared infrastructure that the rest of the idea backlogs build on. Nothing
here is deployed yet — Felipe pushes via `push_fix.ps1` after review. All keys
live in the existing `PROGRESS_KV` namespace; no new binding needed.

## What changed (for San-sync)

New files:
- `functions/api/classes.js`        — class registry (teacher, PIN)
- `functions/api/join.js`           — class-code lookup (student, open)
- `functions/api/studentconfig.js`  — per-student config store

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

## Not done yet (next sessions)
- Apply difficulty / checkpointThreshold / dailyGoal in the student app
  (deferred pending live-test — they touch checkpoint + exercise mechanics).
- Fold `notes.js` note field into `cfg_` (single per-student store).
- Per-class scoping of progress/path/announce/assignments (Tier-0 completion:
  today all class-wide state is still the implicit default class).
- Remaining primitives: snapshots-as-backbone, cron, rules engine, realtime,
  web push, parent read-view.
