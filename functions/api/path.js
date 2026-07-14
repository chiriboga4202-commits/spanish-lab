// functions/api/path.js — Cloudflare Pages Function backing the linear
// learning path (2026-07-05). One KV key ("path_unlocks") maps studentId →
// highest unlocked topic index in LEARNING_PATH (0 = only topic 1 open).
//
// Flow: student passes a ≥75% checkpoint → their progress sync flags them
// "ready" on the teacher dashboard → the teacher approves → dashboard POSTs
// here → the student's app polls GET and picks up the unlock.
//
// Access: GET with ?studentId= is open (a student polls their own level; the
// response leaks nothing but a number). GET without studentId returns the
// full map and requires the teacher PIN, as does POST. Same TEACHER_PIN env
// var and open-while-unset migration behavior as progress.js/assignments.js.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-teacher-pin',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

const KV_KEY = 'path_unlocks';

// TEACHER_PIN2 = optional co-teacher PIN (backlog #30) — either works.
function pinOk(request, env) {
  if (!env.TEACHER_PIN && !env.TEACHER_PIN2) return true;
  const pin = request.headers.get('x-teacher-pin') || new URL(request.url).searchParams.get('pin');
  return (env.TEACHER_PIN && pin === env.TEACHER_PIN) || (env.TEACHER_PIN2 && pin === env.TEACHER_PIN2);
}

export async function onRequestOptions() {
  return new Response('', { status: 200, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const studentId = url.searchParams.get('studentId');
  try {
    const map = (await env.PROGRESS_KV.get(KV_KEY, { type: 'json' })) || {};
    if (studentId) {
      return new Response(JSON.stringify({ unlocked: map[studentId] ?? 0 }), { status: 200, headers: CORS_HEADERS });
    }
    if (!pinOk(request, env)) {
      return new Response(JSON.stringify({ error: 'PIN required' }), { status: 401, headers: CORS_HEADERS });
    }
    const auto = (await env.PROGRESS_KV.get('path_auto', { type: 'json' })) === true;
    return new Response(JSON.stringify({ map, auto }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!pinOk(request, env)) {
    return new Response(JSON.stringify({ error: 'PIN required' }), { status: 401, headers: CORS_HEADERS });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS_HEADERS });
  }
  // Auto-approve mode (2026-07-05): POST {auto:true|false} flips a class-wide
  // flag. When on, progress.js unlocks the next topic the moment a student's
  // sync reports a passed checkpoint — no teacher tap needed. Built for
  // Felipe sharing the app with students he won't actively supervise.
  if (typeof body.auto === 'boolean') {
    try {
      await env.PROGRESS_KV.put('path_auto', JSON.stringify(body.auto));
      return new Response(JSON.stringify({ ok: true, auto: body.auto }), { status: 200, headers: CORS_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
    }
  }
  if (!body.studentId || typeof body.unlocked !== 'number' || body.unlocked < 0 || body.unlocked > 20) {
    return new Response(JSON.stringify({ error: 'studentId and unlocked (0-20) required' }), { status: 400, headers: CORS_HEADERS });
  }
  try {
    const map = (await env.PROGRESS_KV.get(KV_KEY, { type: 'json' })) || {};
    map[body.studentId] = body.unlocked;
    await env.PROGRESS_KV.put(KV_KEY, JSON.stringify(map));
    return new Response(JSON.stringify({ ok: true, studentId: body.studentId, unlocked: body.unlocked }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
