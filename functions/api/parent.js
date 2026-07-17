// functions/api/parent.js — read-only parent progress view (Tier-3, 2026-07-15).
//
// A parent opens parent.html?sid=<studentId>&token=<t>. This endpoint checks
// the token against that student's cfg (cfg_<studentId>.parentToken, minted by
// the teacher from the dashboard) and, if it matches, returns a CURATED,
// read-only slice of that one student's progress. No teacher PIN, no write
// path, no cross-student access — the token is scoped to a single student.

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
  const url = new URL(request.url);
  const sid = url.searchParams.get('studentId');
  const token = url.searchParams.get('token');
  if (!sid || !token) {
    return new Response(JSON.stringify({ error: 'studentId and token required' }), { status: 400, headers: CORS_HEADERS });
  }
  try {
    const cfg = await env.PROGRESS_KV.get('cfg_' + sid, { type: 'json' });
    if (!cfg || !cfg.parentToken || cfg.parentToken !== token) {
      return new Response(JSON.stringify({ error: 'invalid link' }), { status: 403, headers: CORS_HEADERS });
    }
    const s = await env.PROGRESS_KV.get(sid, { type: 'json' });
    if (!s) {
      return new Response(JSON.stringify({ error: 'no progress yet', pending: true }), { status: 200, headers: CORS_HEADERS });
    }
    // Curated, read-only subset — no raw answer logs, errors, or teacher notes.
    const mastery = {};
    for (const k in (s.mastery || {})) {
      const m = s.mastery[k];
      if (m && m.total) mastery[k] = { correct: m.correct || 0, total: m.total, acc: Math.round((m.correct / m.total) * 100) };
    }
    const out = {
      name: s.name || 'Student',
      level: s.level || 1,
      xp: s.xp || 0,
      bestStreak: s.bestStreak || 0,
      dueCount: s.dueCount || 0,
      lastActive: s.lastActive || null,
      topic: (s.pathState && s.pathState.topic) || null,
      topicNum: (s.pathState && typeof s.pathState.unlocked === 'number') ? s.pathState.unlocked + 1 : null,
      mastery,
    };
    return new Response(JSON.stringify({ student: out }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
