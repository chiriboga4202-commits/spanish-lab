// functions/api/assignments.js — Cloudflare Pages Function backing the
// teacher "Concept Assignment Queue" (spanish-teacher-dashboard.html's Queue
// panel). Mirrors functions/api/progress.js's shape/CORS/KV pattern exactly.
//
// 2026-07-03: this queue previously lived ONLY in localStorage on whatever
// device the teacher dashboard happened to be open on (sl_teacher_queue) —
// meaning a teacher assigning concepts from their own machine could never
// actually reach a student's browser on a different device. There's no
// per-student targeting in the existing UI (queueConcept/dequeueConceptAt
// have no student selector), so this is a single class-wide shared list, not
// per-studentId like progress.js — matches how the teacher dashboard's Queue
// panel was already designed (assign to whoever's using the app, not to one
// specific student).
//
// Uses the same PROGRESS_KV namespace as progress.js under a distinct key
// ("teacher_queue") so no new KV namespace/binding needs to be created.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-teacher-pin',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

const KV_KEY = 'teacher_queue';

export async function onRequestOptions() {
  return new Response('', { status: 200, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const queue = (await env.PROGRESS_KV.get(KV_KEY, { type: 'json' })) || [];
    // Per-student assignments (backlog #32, 2026-07-05): ?studentId=X also
    // returns that student's personal queue alongside the class-wide one.
    const studentId = new URL(request.url).searchParams.get('studentId');
    if (studentId) {
      const per = (await env.PROGRESS_KV.get('teacher_queue_per', { type: 'json' })) || {};
      return new Response(JSON.stringify({ queue, personal: per[studentId] || [] }), { status: 200, headers: CORS_HEADERS });
    }
    return new Response(JSON.stringify({ queue }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  // 2026-07-05: writing the class queue requires the teacher PIN (same
  // TEACHER_PIN env var as progress.js reads). GET stays open — students
  // must be able to read their assignments. Open while TEACHER_PIN unset.
  if (env.TEACHER_PIN || env.TEACHER_PIN2) {
    const pin = request.headers.get('x-teacher-pin') || new URL(request.url).searchParams.get('pin');
    const ok = (env.TEACHER_PIN && pin === env.TEACHER_PIN) || (env.TEACHER_PIN2 && pin === env.TEACHER_PIN2);
    if (!ok) {
      return new Response(JSON.stringify({ error: 'PIN required' }), { status: 401, headers: CORS_HEADERS });
    }
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS_HEADERS });
  }
  if (!Array.isArray(body.queue)) {
    return new Response(JSON.stringify({ error: 'queue (array) is required' }), { status: 400, headers: CORS_HEADERS });
  }
  try {
    // Per-student assignment (backlog #32): {studentId, queue} targets one
    // student; plain {queue} stays the class-wide list as before.
    if (body.studentId) {
      const per = (await env.PROGRESS_KV.get('teacher_queue_per', { type: 'json' })) || {};
      per[body.studentId] = body.queue;
      await env.PROGRESS_KV.put('teacher_queue_per', JSON.stringify(per));
      return new Response(JSON.stringify({ ok: true, studentId: body.studentId }), { status: 200, headers: CORS_HEADERS });
    }
    await env.PROGRESS_KV.put(KV_KEY, JSON.stringify(body.queue));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
