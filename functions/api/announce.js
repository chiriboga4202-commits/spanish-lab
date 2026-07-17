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
    // Per-class announcements (2026-07-15): a student passes ?class=<classId>.
    // A class-specific announcement OVERRIDES the global one; if the class has
    // none, they fall back to the global banner (broadcast to everyone).
    // Backward compatible: no ?class (or ?class=default) => global key only.
    const cls = new URL(context.request.url).searchParams.get('class');
    let a = null;
    if (cls && cls !== 'default') {
      a = (await context.env.PROGRESS_KV.get(KV_KEY + '_' + cls, { type: 'json' })) || null;
    }
    if (!a) a = (await context.env.PROGRESS_KV.get(KV_KEY, { type: 'json' })) || null;
    const cscoped = cls && cls !== 'default';
    // classAuto (backlog #100-lite): students read this flag on load — when
    // on, the app runs its own comeback nudges without teacher involvement.
    // Per-class (2026-07-15): class flag wins if set, else the global default.
    let classAuto;
    if (cscoped) {
      const c = await context.env.PROGRESS_KV.get('class_auto_' + cls, { type: 'json' });
      classAuto = (c === true || c === false) ? c : ((await context.env.PROGRESS_KV.get('class_auto', { type: 'json' })) === true);
    } else {
      classAuto = (await context.env.PROGRESS_KV.get('class_auto', { type: 'json' })) === true;
    }
    // class sheet (backlog #12): a study sheet the teacher pushed. Class sheet
    // overrides the global one; falls back to global when the class has none.
    let sheet = null;
    if (cscoped) sheet = (await context.env.PROGRESS_KV.get('class_sheet_' + cls, { type: 'json' })) || null;
    if (!sheet) sheet = (await context.env.PROGRESS_KV.get('class_sheet', { type: 'json' })) || null;
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
      const ck = (body.class && body.class !== 'default' && body.class !== 'all') ? 'class_auto_' + body.class : 'class_auto';
      await env.PROGRESS_KV.put(ck, JSON.stringify(body.classAuto));
      await audit(env, 'class-in-a-box', (ck === 'class_auto' ? 'all' : body.class) + ' ' + (body.classAuto ? 'ON' : 'OFF'));
      return new Response(JSON.stringify({ ok: true, classAuto: body.classAuto, scope: ck === 'class_auto' ? 'all' : body.class }), { status: 200, headers: CORS_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
    }
  }
  // class sheet push (backlog #12): {sheet:{title, md}}; empty md clears.
  if (body.sheet && typeof body.sheet === 'object') {
    try {
      const sk = (body.class && body.class !== 'default' && body.class !== 'all') ? 'class_sheet_' + body.class : 'class_sheet';
      const md = String(body.sheet.md || '').slice(0, 20000);
      if (!md.trim()) { await env.PROGRESS_KV.delete(sk); await audit(env, 'class-sheet', 'cleared (' + (sk === 'class_sheet' ? 'all' : body.class) + ')'); }
      else {
        await env.PROGRESS_KV.put(sk, JSON.stringify({ title: String(body.sheet.title || 'From your teacher').slice(0, 80), md, ts: Date.now() }));
        await audit(env, 'class-sheet', '[' + (sk === 'class_sheet' ? 'all' : body.class) + '] ' + body.sheet.title);
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
    }
  }
  const text = String(body.text || '').slice(0, 300);
  // Target a class: {text, class}. Omitted / 'default' / 'all' => global banner.
  const cls = body.class;
  const key = (cls && cls !== 'default' && cls !== 'all') ? KV_KEY + '_' + cls : KV_KEY;
  const scope = key === KV_KEY ? 'all' : cls;
  try {
    if (!text.trim()) {
      await env.PROGRESS_KV.delete(key);
      await audit(env, 'announcement', 'cleared (' + scope + ')');
      return new Response(JSON.stringify({ ok: true, cleared: true, scope }), { status: 200, headers: CORS_HEADERS });
    }
    const rec = { text: text.trim(), ts: Date.now() };
    await env.PROGRESS_KV.put(key, JSON.stringify(rec));
    await audit(env, 'announcement', '[' + scope + '] ' + text.trim());
    return new Response(JSON.stringify({ ok: true, announcement: rec, scope }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
