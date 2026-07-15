// functions/api/student-config.js — per-student config primitive (2026-07-15).
// NOTE: filename MUST stay hyphenated — Pages routes by filename, so this file
// serves /api/student-config (what every caller uses). Renamed from
// studentconfig.js on 2026-07-15 after the harness caught the route mismatch.
//
// The dependency that unlocks the whole "Student Control" backlog cluster
// (AUTO #32/#33/#34/#35/#36/#38, DB #9/#10/#15). One KV record per student:
//
//   cfg_<studentId> -> {
//     _type: 'cfg',              // discriminator so the roster GET can skip us
//     studentId,
//     classId,                   // multi-tenancy: which class this student is in
//     assignments: [ { id, mode, concept, count, due, note, createdTs, status, doneTs } ],
//     dailyGoal,                 // null = use class default (30)
//     difficulty,                // null | 'beginner' | 'normal' | 'hard'
//     checkpointThreshold,       // null = default | 0.40..1.00 override
//     frozen,                    // pause access (teacher control)
//     vacation,                  // pause streak / nag mechanics
//     updatedTs
//   }
//
// Extends (does NOT replace) assignments.js/teacher_queue_per — this record
// adds per-assignment due dates + completion state that the old flat array
// lacked. notes.js still owns note/rename; folding it in here is a later pass.
//
// Reads for a single student are OPEN (the student app applies its own config).
// Writes require the teacher PIN, EXCEPT a student marking one of their own
// assignments complete (self-report). Same KV namespace + CORS as siblings.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-teacher-pin',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

const DIFFICULTIES = ['beginner', 'normal', 'hard'];

function pinOk(request, env) {
  if (!env.TEACHER_PIN && !env.TEACHER_PIN2) return true;
  const pin = request.headers.get('x-teacher-pin') || new URL(request.url).searchParams.get('pin');
  return (env.TEACHER_PIN && pin === env.TEACHER_PIN) || (env.TEACHER_PIN2 && pin === env.TEACHER_PIN2);
}

function key(studentId) { return 'cfg_' + studentId; }

function defaults(studentId) {
  return {
    _type: 'cfg',
    studentId,
    classId: 'default',
    assignments: [],
    dailyGoal: null,
    difficulty: null,
    checkpointThreshold: null,
    frozen: false,
    vacation: false,
    updatedTs: 0,
  };
}

async function load(env, studentId) {
  const rec = await env.PROGRESS_KV.get(key(studentId), { type: 'json' });
  return rec ? { ...defaults(studentId), ...rec } : defaults(studentId);
}

async function audit(env, action, detail) {
  try {
    const log = (await env.PROGRESS_KV.get('audit', { type: 'json' })) || [];
    log.unshift({ ts: Date.now(), action, detail });
    await env.PROGRESS_KV.put('audit', JSON.stringify(log.slice(0, 50)));
  } catch (e) { /* best-effort */ }
}

export async function onRequestOptions() {
  return new Response('', { status: 200, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const studentId = new URL(request.url).searchParams.get('studentId');
  try {
    // Single student -> OPEN (the student app reads its own config to apply
    // goal / difficulty / threshold / freeze / vacation and show assignments).
    if (studentId) {
      return new Response(JSON.stringify({ config: await load(env, studentId) }), { status: 200, headers: CORS_HEADERS });
    }
    // Whole roster of configs -> PIN (dashboard). Prefix-scoped list so we only
    // read cfg_ keys, never the student records or system keys.
    if (!pinOk(request, env)) {
      return new Response(JSON.stringify({ error: 'PIN required' }), { status: 401, headers: CORS_HEADERS });
    }
    const { keys } = await env.PROGRESS_KV.list({ prefix: 'cfg_' });
    const recs = await Promise.all(keys.map((k) => env.PROGRESS_KV.get(k.name, { type: 'json' }).catch(() => null)));
    const configs = {};
    for (const r of recs) { if (r && r.studentId) configs[r.studentId] = r; }
    return new Response(JSON.stringify({ configs }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS_HEADERS }); }
  if (!body.studentId) {
    return new Response(JSON.stringify({ error: 'studentId required' }), { status: 400, headers: CORS_HEADERS });
  }

  // ---- OPEN path: a student marks ONE of their own assignments complete. ----
  // Allowed without a PIN only when completeAssignment is the sole operation,
  // so it can never be used to change goals/difficulty/freeze etc.
  const isPrivileged = 'patch' in body || 'addAssignment' in body ||
    'removeAssignment' in body || 'setAssignments' in body;
  if (body.completeAssignment && !isPrivileged) {
    try {
      const cfg = await load(env, body.studentId);
      const a = cfg.assignments.find((x) => x.id === body.completeAssignment);
      if (a && a.status !== 'done') { a.status = 'done'; a.doneTs = Date.now(); }
      cfg.updatedTs = Date.now();
      await env.PROGRESS_KV.put(key(body.studentId), JSON.stringify(cfg));
      return new Response(JSON.stringify({ ok: true, config: cfg }), { status: 200, headers: CORS_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
    }
  }

  // ---- PRIVILEGED path: teacher-only. ----
  if (!pinOk(request, env)) {
    return new Response(JSON.stringify({ error: 'PIN required' }), { status: 401, headers: CORS_HEADERS });
  }
  try {
    const cfg = await load(env, body.studentId);

    if (body.patch && typeof body.patch === 'object') {
      const p = body.patch;
      if ('classId' in p) cfg.classId = String(p.classId || 'default').slice(0, 40);
      if ('dailyGoal' in p) cfg.dailyGoal = p.dailyGoal == null ? null : Math.max(0, Math.min(1000, Math.round(Number(p.dailyGoal) || 0)));
      if ('difficulty' in p) cfg.difficulty = DIFFICULTIES.includes(p.difficulty) ? p.difficulty : null;
      if ('checkpointThreshold' in p) cfg.checkpointThreshold = p.checkpointThreshold == null ? null : Math.max(0.40, Math.min(1, Number(p.checkpointThreshold) || 0.83));
      if ('frozen' in p) cfg.frozen = !!p.frozen;
      if ('vacation' in p) cfg.vacation = !!p.vacation;
    }

    if (body.addAssignment && typeof body.addAssignment === 'object') {
      const a = body.addAssignment;
      cfg.assignments.push({
        id: 'as_' + Math.random().toString(36).slice(2, 9),
        mode: String(a.mode || '').slice(0, 40),
        concept: String(a.concept || '').slice(0, 40),
        count: Math.max(1, Math.min(100, Math.round(Number(a.count) || 10))),
        due: a.due ? Number(a.due) : null,
        note: String(a.note || '').slice(0, 200),
        createdTs: Date.now(),
        status: 'open',
        doneTs: null,
      });
    }

    if (body.removeAssignment) {
      cfg.assignments = cfg.assignments.filter((x) => x.id !== body.removeAssignment);
    }

    if (Array.isArray(body.setAssignments)) {
      cfg.assignments = body.setAssignments.slice(0, 100);
    }

    cfg.updatedTs = Date.now();
    await env.PROGRESS_KV.put(key(body.studentId), JSON.stringify(cfg));
    await audit(env, 'cfg.update', { studentId: body.studentId });
    return new Response(JSON.stringify({ ok: true, config: cfg }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
