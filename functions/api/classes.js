// functions/api/classes.js — multi-tenancy foundation (2026-07-15).
//
// WHY: every KV key today is flat/global — one implicit class. To support
// multiple classes (backlog AUTO #42/#43/#51/#91/#93, DB #27) we introduce a
// class registry WITHOUT a destructive migration:
//
//   - `classes`         -> { [classId]: { id, code, name, createdTs, accent } }
//   - `code_<CODE>`     -> classId            (O(1) join lookup for students)
//
// A student record with NO classId is treated as the implicit "default" class,
// so nothing that exists today breaks. classId is purely ADDITIVE: students
// gain one only when they enter a class code (see join.js). Existing class-wide
// state (teacher_queue, path_unlocks, announcement, ...) stays global == the
// default class for now; per-class scoping of those endpoints is a later pass.
//
// Same PROGRESS_KV namespace + CORS + PIN pattern as progress.js/notes.js.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-teacher-pin',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

const REGISTRY_KEY = 'classes';
const DEFAULT_ID = 'default';

// Unambiguous alphabet: no 0/O/1/I/L to keep spoken/handwritten codes clean.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function pinOk(request, env) {
  if (!env.TEACHER_PIN && !env.TEACHER_PIN2) return true; // open during migration
  const pin = request.headers.get('x-teacher-pin') || new URL(request.url).searchParams.get('pin');
  return (env.TEACHER_PIN && pin === env.TEACHER_PIN) || (env.TEACHER_PIN2 && pin === env.TEACHER_PIN2);
}

function genCode(len = 5) {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

function genId() {
  return 'cls_' + Math.random().toString(36).slice(2, 8);
}

async function audit(env, action, detail) {
  try {
    const log = (await env.PROGRESS_KV.get('audit', { type: 'json' })) || [];
    log.unshift({ ts: Date.now(), action, detail });
    await env.PROGRESS_KV.put('audit', JSON.stringify(log.slice(0, 50)));
  } catch (e) { /* audit is best-effort, never block the write */ }
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
    const reg = (await env.PROGRESS_KV.get(REGISTRY_KEY, { type: 'json' })) || {};
    // ?ensureDefault=1 seeds the implicit "default" class so the dashboard has
    // something to show without any destructive backfill of student records.
    if (new URL(request.url).searchParams.get('ensureDefault') && !reg[DEFAULT_ID]) {
      reg[DEFAULT_ID] = { id: DEFAULT_ID, code: null, name: 'Default class', createdTs: Date.now() };
      await env.PROGRESS_KV.put(REGISTRY_KEY, JSON.stringify(reg));
    }
    return new Response(JSON.stringify({ classes: Object.values(reg) }), { status: 200, headers: CORS_HEADERS });
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

  try {
    const reg = (await env.PROGRESS_KV.get(REGISTRY_KEY, { type: 'json' })) || {};

    // Rename an existing class: { id, rename }
    if (body.id && typeof body.rename === 'string') {
      if (!reg[body.id]) {
        return new Response(JSON.stringify({ error: 'unknown class id' }), { status: 404, headers: CORS_HEADERS });
      }
      reg[body.id].name = body.rename.slice(0, 60);
      if (typeof body.accent === 'string') reg[body.id].accent = body.accent.slice(0, 16);
      await env.PROGRESS_KV.put(REGISTRY_KEY, JSON.stringify(reg));
      await audit(env, 'class.rename', { id: body.id, name: reg[body.id].name });
      return new Response(JSON.stringify({ ok: true, class: reg[body.id] }), { status: 200, headers: CORS_HEADERS });
    }

    // Create a class: { name, accent? } -> generates a unique join code.
    if (typeof body.name === 'string' && body.name.trim()) {
      const id = genId();
      // Ensure the join code is globally unique against the code_ index.
      let code;
      for (let tries = 0; tries < 12; tries++) {
        const candidate = genCode();
        const taken = await env.PROGRESS_KV.get('code_' + candidate);
        if (!taken) { code = candidate; break; }
      }
      if (!code) {
        return new Response(JSON.stringify({ error: 'could not allocate a unique code, retry' }), { status: 503, headers: CORS_HEADERS });
      }
      const cls = { id, code, name: body.name.trim().slice(0, 60), createdTs: Date.now() };
      if (typeof body.accent === 'string') cls.accent = body.accent.slice(0, 16);
      reg[id] = cls;
      await env.PROGRESS_KV.put(REGISTRY_KEY, JSON.stringify(reg));
      await env.PROGRESS_KV.put('code_' + code, id);
      await audit(env, 'class.create', { id, code, name: cls.name });
      return new Response(JSON.stringify({ ok: true, class: cls }), { status: 200, headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({ error: 'provide {name} to create or {id, rename} to rename' }), { status: 400, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}

// DELETE ?id= removes a class + its join-code index. Students in it fall back
// to the implicit default (their record's classId just points at a dead class,
// which reads as unknown -> treated as default by consumers).
export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!pinOk(request, env)) {
    return new Response(JSON.stringify({ error: 'PIN required' }), { status: 401, headers: CORS_HEADERS });
  }
  const id = new URL(request.url).searchParams.get('id');
  if (!id || id === DEFAULT_ID) {
    return new Response(JSON.stringify({ error: 'valid non-default class id required' }), { status: 400, headers: CORS_HEADERS });
  }
  try {
    const reg = (await env.PROGRESS_KV.get(REGISTRY_KEY, { type: 'json' })) || {};
    const cls = reg[id];
    if (cls) {
      if (cls.code) await env.PROGRESS_KV.delete('code_' + cls.code);
      delete reg[id];
      await env.PROGRESS_KV.put(REGISTRY_KEY, JSON.stringify(reg));
      await audit(env, 'class.delete', { id });
    }
    return new Response(JSON.stringify({ ok: true, deleted: id }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
