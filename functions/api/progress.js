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
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

export async function onRequestGet(context) {
  const { env } = context;
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
