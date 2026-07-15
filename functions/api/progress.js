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

// Automatic daily snapshot (2026-07-15) — the trend backbone. Cloudflare Pages
// Functions have no reliable cron trigger, so instead of standing up a separate
// scheduled worker we piggyback on the student write path: the FIRST progress
// write each day captures snap_<today>. Runs inside context.waitUntil() so it
// never adds latency to the student's response. `snap_last` is set optimistically
// up front as a cheap once-per-day lock (a rare double-run just overwrites, which
// is harmless). Mirrors snapshot.js's snap_ record shape + 30-day retention.
async function maybeDailySnapshot(env) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    // Marker key is 'last_snapshot' (NOT snap_-prefixed) so it never pollutes
    // a list({prefix:'snap_'}) that JSON-parses snapshot values.
    if ((await env.PROGRESS_KV.get('last_snapshot')) === today) return;
    await env.PROGRESS_KV.put('last_snapshot', today); // optimistic once/day lock
    const key = 'snap_' + today;
    if (await env.PROGRESS_KV.get(key)) return;
    const { keys } = await env.PROGRESS_KV.list();
    const studentKeys = keys.map(k => k.name).filter(n => n.startsWith('stu_'));
    const students = await Promise.all(studentKeys.map(n => env.PROGRESS_KV.get(n, { type: 'json' }).catch(() => null)));
    await env.PROGRESS_KV.put(key, JSON.stringify({ date: today, students: students.filter(Boolean) }));
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const stale = keys.map(k => k.name).filter(n => /^snap_\d{4}-\d{2}-\d{2}$/.test(n) && n.slice(5) < cutoff);
    await Promise.all(stale.map(n => env.PROGRESS_KV.delete(n).catch(() => {})));
  } catch (e) { /* snapshot must never break a progress write */ }
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
    // Auto-approve (2026-07-05): if the class-wide flag is on and this sync
    // reports a passed-but-not-unlocked checkpoint, unlock the next topic
    // immediately instead of waiting for a manual teacher tap.
    try {
      const ps = body.pathState;
      if (ps && ps.ready && typeof ps.unlocked === 'number') {
        const auto = (await env.PROGRESS_KV.get('path_auto', { type: 'json' })) === true;
        if (auto) {
          const map = (await env.PROGRESS_KV.get('path_unlocks', { type: 'json' })) || {};
          const next = Math.min(ps.unlocked + 1, 20);
          if ((map[body.studentId] ?? 0) < next) {
            map[body.studentId] = next;
            await env.PROGRESS_KV.put('path_unlocks', JSON.stringify(map));
          }
        }
      }
    } catch (e) { /* auto-approve must never break a progress write */ }
    // Trend backbone: capture today's snapshot once/day, off the response path.
    try { context.waitUntil(maybeDailySnapshot(env)); } catch (e) {}
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
  if (env.TEACHER_PIN || env.TEACHER_PIN2) {
    const pin = request.headers.get('x-teacher-pin') || new URL(request.url).searchParams.get('pin');
    const ok = (env.TEACHER_PIN && pin === env.TEACHER_PIN) || (env.TEACHER_PIN2 && pin === env.TEACHER_PIN2);
    if (!ok) {
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
  if (env.TEACHER_PIN || env.TEACHER_PIN2) {
    const pin = request.headers.get('x-teacher-pin') || new URL(request.url).searchParams.get('pin');
    const ok = (env.TEACHER_PIN && pin === env.TEACHER_PIN) || (env.TEACHER_PIN2 && pin === env.TEACHER_PIN2);
    if (!ok) {
      return new Response(JSON.stringify({ error: 'PIN required' }), { status: 401, headers: CORS_HEADERS });
    }
  }
  try {
    const { keys } = await env.PROGRESS_KV.list();
    const students = await Promise.all(
      keys.map((k) => env.PROGRESS_KV.get(k.name, { type: 'json' }).catch(() => null))
    );
    // Shape-guard (2026-07-15): list() returns EVERY key in the namespace —
    // teacher_queue, announcement, path_unlocks, the new cfg_* configs, etc.
    // Only real student records carry a studentId; the cfg_ primitive tags
    // itself _type:'cfg'. Filtering here keeps non-students out of the roster.
    const roster = students.filter((s) => s && s.studentId && s._type !== 'cfg');
    return new Response(JSON.stringify({ students: roster }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
