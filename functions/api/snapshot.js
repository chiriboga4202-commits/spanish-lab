// functions/api/snapshot.js — daily KV snapshot (backlog #81-lite, 2026-07-05).
// GET (PIN required) copies the full progress roster into snap_<YYYY-MM-DD>
// and prunes snapshots older than 7 days. The dashboard calls this once per
// day on open, so simply USING the dashboard keeps backups current. These
// snapshots also become the data source for per-student trend charts later.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-teacher-pin',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

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
    // ?audit=1 returns the audit log (last 50 teacher-side actions)
    if (new URL(request.url).searchParams.get('audit')) {
      const log = (await env.PROGRESS_KV.get('audit', { type: 'json' })) || [];
      return new Response(JSON.stringify({ audit: log }), { status: 200, headers: CORS_HEADERS });
    }
    // ?date=YYYY-MM-DD fetches a stored snapshot (feeds the trend arrows)
    const want = new URL(request.url).searchParams.get('date');
    if (want) {
      const snap = await env.PROGRESS_KV.get('snap_' + want, { type: 'json' });
      return new Response(JSON.stringify({ snapshot: snap || null }), { status: 200, headers: CORS_HEADERS });
    }
    const today = new Date().toISOString().slice(0, 10);
    const key = 'snap_' + today;
    const existing = await env.PROGRESS_KV.get(key);
    if (existing) {
      return new Response(JSON.stringify({ ok: true, key, already: true }), { status: 200, headers: CORS_HEADERS });
    }
    const { keys } = await env.PROGRESS_KV.list();
    const studentKeys = keys.map(k => k.name).filter(n => n.startsWith('stu_'));
    const students = await Promise.all(studentKeys.map(n => env.PROGRESS_KV.get(n, { type: 'json' }).catch(() => null)));
    await env.PROGRESS_KV.put(key, JSON.stringify({ date: today, students: students.filter(Boolean) }));
    // prune snapshots older than 7 days
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const stale = keys.map(k => k.name).filter(n => n.startsWith('snap_') && n.slice(5) < cutoff);
    await Promise.all(stale.map(n => env.PROGRESS_KV.delete(n).catch(() => {})));
    return new Response(JSON.stringify({ ok: true, key, students: students.filter(Boolean).length, pruned: stale.length }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
