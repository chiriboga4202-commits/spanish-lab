// functions/api/snapshot.js — daily KV snapshot + trend backbone.
//
// Originally #81-lite (2026-07-05): GET (PIN) copies the full progress roster
// into snap_<YYYY-MM-DD> and prunes old ones. 2026-07-15 makes it the TREND
// BACKBONE that the whole analytics cluster builds on (DB #1/#4, AUTO
// #8/#11/#20/#25/#29):
//   - retention extended 7 -> 30 days (richer sparklines / pace estimates)
//   - writes a `snap_last` marker so the write-path auto-snapshot in
//     progress.js knows whether today is already captured (no cron needed)
//   - ?series=1 returns a compact per-student time series for sparklines
//
// Snapshots are now created AUTOMATICALLY on the first student progress write
// each day (progress.js -> maybeDailySnapshot via waitUntil). This GET still
// creates one on demand too, so opening the dashboard also keeps it current.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-teacher-pin',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

const RETENTION_DAYS = 30;
// Matches ONLY real daily snapshot keys (snap_YYYY-MM-DD). Critical: the
// `last_snapshot` marker and any other key must never be JSON-parsed as a
// snapshot — that caused the ?series=1 crash (parsing "2026-07-15" as JSON).
const SNAP_RE = /^snap_\d{4}-\d{2}-\d{2}$/;

function pinOk(request, env) {
  if (!env.TEACHER_PIN && !env.TEACHER_PIN2) return true;
  const pin = request.headers.get('x-teacher-pin') || new URL(request.url).searchParams.get('pin');
  return (env.TEACHER_PIN && pin === env.TEACHER_PIN) || (env.TEACHER_PIN2 && pin === env.TEACHER_PIN2);
}

// Overall accuracy across all concepts in a snapshotted student record.
function overallAcc(mastery) {
  let c = 0, t = 0;
  for (const k in (mastery || {})) { const m = mastery[k]; if (m) { c += m.correct || 0; t += m.total || 0; } }
  return t ? Math.round((c / t) * 100) : null;
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
    const url = new URL(request.url);

    // ?audit=1 — last 50 teacher-side actions
    if (url.searchParams.get('audit')) {
      const log = (await env.PROGRESS_KV.get('audit', { type: 'json' })) || [];
      return new Response(JSON.stringify({ audit: log }), { status: 200, headers: CORS_HEADERS });
    }

    // ?series=1 — per-student time series across all retained snapshots.
    // Returns { dates:[...], series:{ studentId:[ {date,xp,level,acc,due} ] } }.
    if (url.searchParams.get('series')) {
      const { keys } = await env.PROGRESS_KV.list({ prefix: 'snap_' });
      const dates = keys.map(k => k.name).filter(n => SNAP_RE.test(n)).map(n => n.slice(5)).sort();
      const series = {};
      for (const date of dates) {
        const snap = await env.PROGRESS_KV.get('snap_' + date, { type: 'json' });
        if (!snap || !Array.isArray(snap.students)) continue;
        for (const s of snap.students) {
          if (!s || !s.studentId) continue;
          (series[s.studentId] || (series[s.studentId] = [])).push({
            date,
            xp: s.xp || 0,
            level: s.level || 1,
            acc: overallAcc(s.mastery),
            due: s.dueCount || 0,
          });
        }
      }
      return new Response(JSON.stringify({ dates, series }), { status: 200, headers: CORS_HEADERS });
    }

    // ?date=YYYY-MM-DD — one stored snapshot (feeds the trend arrows)
    const want = url.searchParams.get('date');
    if (want) {
      const snap = await env.PROGRESS_KV.get('snap_' + want, { type: 'json' });
      return new Response(JSON.stringify({ snapshot: snap || null }), { status: 200, headers: CORS_HEADERS });
    }

    // Default: ensure today's snapshot exists, prune stale.
    const today = new Date().toISOString().slice(0, 10);
    const key = 'snap_' + today;
    const existing = await env.PROGRESS_KV.get(key);
    if (existing) {
      await env.PROGRESS_KV.put('last_snapshot', today);
      return new Response(JSON.stringify({ ok: true, key, already: true }), { status: 200, headers: CORS_HEADERS });
    }
    const { keys } = await env.PROGRESS_KV.list();
    const studentKeys = keys.map(k => k.name).filter(n => n.startsWith('stu_'));
    const students = await Promise.all(studentKeys.map(n => env.PROGRESS_KV.get(n, { type: 'json' }).catch(() => null)));
    await env.PROGRESS_KV.put(key, JSON.stringify({ date: today, students: students.filter(Boolean) }));
    await env.PROGRESS_KV.put('last_snapshot', today);
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString().slice(0, 10);
    const stale = keys.map(k => k.name).filter(n => SNAP_RE.test(n) && n.slice(5) < cutoff);
    await Promise.all(stale.map(n => env.PROGRESS_KV.delete(n).catch(() => {})));
    return new Response(JSON.stringify({ ok: true, key, students: students.filter(Boolean).length, pruned: stale.length }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
