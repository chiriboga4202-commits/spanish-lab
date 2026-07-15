// functions/api/join.js — student-facing class-code lookup (2026-07-15).
//
// The ONE open endpoint of the multi-tenancy layer: a student enters a class
// code in the student app, this resolves it to a classId + class name. The
// student app then stores classId in localStorage (sl_class_id) and includes
// it in every syncProgressToTeacher() payload, so progress.js writes it onto
// the student's record. No PIN — students must be able to self-join.
//
// Lookup is O(1) against the `code_<CODE>` index written by classes.js.
// Codes are normalised to uppercase + stripped of spaces/dashes so "sp n4b",
// "SPN4B" and "spn-4b" all resolve. Read-only; never writes.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

export async function onRequestOptions() {
  return new Response('', { status: 200, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const raw = new URL(request.url).searchParams.get('code') || '';
  const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!code) {
    return new Response(JSON.stringify({ error: 'code required' }), { status: 400, headers: CORS_HEADERS });
  }
  try {
    const classId = await env.PROGRESS_KV.get('code_' + code);
    if (!classId) {
      return new Response(JSON.stringify({ error: 'no class with that code', found: false }), { status: 404, headers: CORS_HEADERS });
    }
    const reg = (await env.PROGRESS_KV.get('classes', { type: 'json' })) || {};
    const cls = reg[classId];
    return new Response(JSON.stringify({
      found: true,
      classId,
      className: cls ? cls.name : null,
      accent: cls ? (cls.accent || null) : null,
    }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
