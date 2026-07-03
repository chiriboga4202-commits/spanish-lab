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
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

const KV_KEY = 'teacher_queue';

export async function onRequestOptions() {
  return new Response('', { status: 200, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const queue = (await env.PROGRESS_KV.get(KV_KEY, { type: 'json' })) || [];
    return new Response(JSON.stringify({ queue }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
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
    await env.PROGRESS_KV.put(KV_KEY, JSON.stringify(body.queue));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
