// functions/api/announce.js — class announcement banner (backlog idea #13,
// 2026-07-05). One KV record under "announcement": { text, ts }. Students GET
// it on load (open) and show a banner if it's newer than the last one they
// dismissed. POST requires the teacher PIN (TEACHER_PIN or TEACHER_PIN2 —
// the co-teacher PIN, backlog #30). POST with empty text clears the banner.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-teacher-pin',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

const KV_KEY = 'announcement';

function pinOk(request, env) {
  if (!env.TEACHER_PIN && !env.TEACHER_PIN2) return true;
  const pin = request.headers.get('x-teacher-pin') || new URL(request.url).searchParams.get('pin');
  return (env.TEACHER_PIN && pin === env.TEACHER_PIN) || (env.TEACHER_PIN2 && pin === env.TEACHER_PIN2);
}

export async function onRequestOptions() {
  return new Response('', { status: 200, headers: CORS_HEADERS });
}

async function audit(env, action, detail) {
  try {
    const a = (await env.PROGRESS_KV.get('audit', { type: 'json' })) || [];
    a.push({ ts: Date.now(), action, detail: String(detail || '').slice(0, 80) });
    if (a.length > 50) a.splice(0, a.length - 50);
    await env.PROGRESS_KV.put('audit', JSON.stringify(a));
  } catch (e) {}
}

export async function onRequestGet(context) {
  try {
    const a = (await context.env.PROGRESS_KV.get(KV_KEY, { type: 'json' })) || null;
    // classAuto (backlog #100-lite): students read this flag on load — when
    // on, the app runs its own comeback nudges without teacher involvement.
    const classAuto = (await context.env.PROGRESS_KV.get('class_auto', { type: 'json' })) === true;
    // class sheet (backlog #12): a study sheet the teacher pushed to everyone.
    const sheet = (await context.env.PROGRESS_KV.get('class_sheet', { type: 'json' })) || null;
    return new Response(JSON.stringify({ announcement: a, classAuto, sheet }), { status: 200, headers: CORS_HEADERS });
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
  // class-in-a-box master flag (backlog #100-lite)
  if (typeof body.classAuto === 'boolean') {
    try {
      await env.PROGRESS_KV.put('class_auto', JSON.stringify(body.classAuto));
      await audit(env, 'class-in-a-box', body.classAuto ? 'ON' : 'OFF');
      return new Response(JSON.stringify({ ok: true, classAuto: body.classAuto }), { status: 200, headers: CORS_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
    }
  }
  // class sheet push (backlog #12): {sheet:{title, md}}; empty md clears.
  if (body.sheet && typeof body.sheet === 'object') {
    try {
      const md = String(body.sheet.md || '').slice(0, 20000);
      if (!md.trim()) { await env.PROGRESS_KV.delete('class_sheet'); await audit(env, 'class-sheet', 'cleared'); }
      else {
        await env.PROGRESS_KV.put('class_sheet', JSON.stringify({ title: String(body.sheet.title || 'From your teacher').slice(0, 80), md, ts: Date.now() }));
        await audit(env, 'class-sheet', body.sheet.title);
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
    }
  }
  const text = String(body.text || '').slice(0, 300);
  try {
    if (!text.trim()) {
      await env.PROGRESS_KV.delete(KV_KEY);
      await audit(env, 'announcement', 'cleared');
      return new Response(JSON.stringify({ ok: true, cleared: true }), { status: 200, headers: CORS_HEADERS });
    }
    const rec = { text: text.trim(), ts: Date.now() };
    await env.PROGRESS_KV.put(KV_KEY, JSON.stringify(rec));
    await audit(env, 'announcement', text.trim());
    return new Response(JSON.stringify({ ok: true, announcement: rec }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
