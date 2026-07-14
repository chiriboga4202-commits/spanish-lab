// functions/api/notes.js — private teacher notes + display-name overrides
// (backlog #39/#41, 2026-07-05). One KV map under "teacher_notes":
// { studentId: { note, rename } }. Everything requires the teacher PIN —
// students never see notes, and renames are display-only on the dashboard
// (the student's own device name is never touched).

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-teacher-pin',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

const KV_KEY = 'teacher_notes';

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
  if (!pinOk(request, env)) {
    return new Response(JSON.stringify({ error: 'PIN required' }), { status: 401, headers: CORS_HEADERS });
  }
  try {
    const map = (await env.PROGRESS_KV.get(KV_KEY, { type: 'json' })) || {};
    return new Response(JSON.stringify({ notes: map }), { status: 200, headers: CORS_HEADERS });
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
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS_HEADERS }); }
  if (!body.studentId) {
    return new Response(JSON.stringify({ error: 'studentId required' }), { status: 400, headers: CORS_HEADERS });
  }
  try {
    const map = (await env.PROGRESS_KV.get(KV_KEY, { type: 'json' })) || {};
    const rec = map[body.studentId] || {};
    if (typeof body.note === 'string') rec.note = body.note.slice(0, 500);
    if (typeof body.rename === 'string') rec.rename = body.rename.slice(0, 40);
    if (!rec.note && !rec.rename) delete map[body.studentId];
    else map[body.studentId] = rec;
    await env.PROGRESS_KV.put(KV_KEY, JSON.stringify(map));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
