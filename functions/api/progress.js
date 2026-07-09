// functions/api/progress.js — Cloudflare Pages Function, replaces
// netlify/functions/progress.js (which used Netlify Blobs). Same job — a
// shared key/value store backing the teacher-progress sync — swapped to
// Cloudflare KV since Blobs has no direct Cloudflare equivalent. The KV API
// shape differs slightly (list() returns {keys:[{name}]} instead of
// {blobs:[{key}]}), but the endpoint's request/response contract is
// unchanged, so index.html's syncProgressToTeacher() and
// teacher-progress.html's loadStudents() needed zero changes.
//
// One-time setup required in the Cloudflare dashboard (can't be done from
// code): Workers & Pages -> KV -> create a namespace (e.g. "student-progress")
// -> bind it to this Pages project under Settings -> Functions -> KV
// namespace bindings, with variable name PROGRESS_KV.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-teacher-pin',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

export async function onRequestOptions() {
  return new Response('', { status: 200, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS_HEADERS });
  }
  if (!body.studentId) {
    return new Response(JSON.stringify({ error: 'studentId is required' }), { status: 400, headers: CORS_HEADERS });
  }

  const record = { ...body, syncedAt: new Date().toISOString() };
  try {
    await env.PROGRESS_KV.put(body.studentId, JSON.stringify(record));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}

// 2026-07-05: reading the roster now requires the teacher PIN. Set TEACHER_PIN
// in the Cloudflare dashboard (Workers & Pages -> spanish-lab -> Settings ->
// Variables and Secrets). While TEACHER_PIN is unset, reads stay open so
// nothing breaks before the variable exists. Student POSTs are never gated.
// PIN-gated cleanup: DELETE /api/progress?studentId=stu_xxx removes one
// student record (test devices, students who left). Same PIN as GET.
export async function onRequestDelete(context) {
  const { request, env } = context;
  if (env.TEACHER_PIN) {
    const pin = request.headers.get('x-teacher-pin') || new URL(request.url).searchParams.get('pin');
    if (pin !== env.TEACHER_PIN) {
      return new Response(JSON.stringify({ error: 'PIN required' }), { status: 401, headers: CORS_HEADERS });
    }
  }
  const studentId = new URL(request.url).searchParams.get('studentId');
  if (!studentId) {
    return new Response(JSON.stringify({ error: 'studentId query param required' }), { status: 400, headers: CORS_HEADERS });
  }
  try {
    await env.PROGRESS_KV.delete(studentId);
    return new Response(JSON.stringify({ ok: true, deleted: studentId }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (env.TEACHER_PIN) {
    const pin = request.headers.get('x-teacher-pin') || new URL(request.url).searchParams.get('pin');
    if (pin !== env.TEACHER_PIN) {
      return new Response(JSON.stringify({ error: 'PIN required' }), { status: 401, headers: CORS_HEADERS });
    }
  }
  try {
    const { keys } = await env.PROGRESS_KV.list();
    const students = await Promise.all(
      keys.map((k) => env.PROGRESS_KV.get(k.name, { type: 'json' }).catch(() => null))
    );
    return new Response(JSON.stringify({ students: students.filter(Boolean) }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
