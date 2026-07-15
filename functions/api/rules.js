// functions/api/rules.js — the automation rules engine (2026-07-15).
//
// The generic primitive behind the whole zero-touch cluster (AUTO #1-5, #9,
// #14, #100): a list of "WHEN <condition> DO <action>" rules, stored in KV and
// evaluated against the live roster + the snapshot trend series. One engine
// powers auto-nudge, auto-remediation, auto-goal-adjust, and health flags.
//
// TRIGGER: evaluation runs on dashboard open and via an explicit "Run now"
// button (POST {evaluate:true}). Cloudflare Pages Functions have no reliable
// cron, and we avoid a fragile write-path cross-file import — so for a solo
// teacher who checks in, this is effectively daily. A scheduled task hitting
// ?evaluate is the future fully-autonomous step (a deliberate infra decision).
//
// SAFE BY DEFAULT: the seeded starter rules only FLAG (teacher-facing). The
// mutating actions (assign_concept, set_goal) are supported but only run for
// rules the teacher explicitly creates/enables.
//
// KV keys: rules (array) · rules_flags {studentId:[...]} · rules_state
// {ruleId:{studentId:ts}} (cooldown dedupe). Shares CORS/PIN with siblings.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-teacher-pin',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

const COOLDOWN_MS = 20 * 3600 * 1000; // act at most ~once/day per rule+student
const METRICS = ['inactive_days', 'accuracy_pct', 'xp_gain', 'due_count'];
const OPS = ['gt', 'gte', 'lt', 'lte', 'eq'];
const ACTION_TYPES = ['flag', 'assign_concept', 'set_goal'];

function pinOk(request, env) {
  if (!env.TEACHER_PIN && !env.TEACHER_PIN2) return true;
  const pin = request.headers.get('x-teacher-pin') || new URL(request.url).searchParams.get('pin');
  return (env.TEACHER_PIN && pin === env.TEACHER_PIN) || (env.TEACHER_PIN2 && pin === env.TEACHER_PIN2);
}

function overallAcc(mastery) {
  let c = 0, t = 0;
  for (const k in (mastery || {})) { const m = mastery[k]; if (m) { c += m.correct || 0; t += m.total || 0; } }
  return t ? Math.round((c / t) * 100) : null;
}

function cfgDefaults(studentId) {
  return { _type: 'cfg', studentId, classId: 'default', assignments: [], dailyGoal: null, difficulty: null, checkpointThreshold: null, frozen: false, vacation: false, updatedTs: 0 };
}

// Compute a rule's metric for one student. Returns null when uncomputable
// (missing data) — the rule then simply doesn't match, never false-fires.
function metricValue(metric, s, series, window) {
  if (metric === 'inactive_days') {
    if (!s.lastActive) return null;
    return Math.floor((Date.now() - new Date(s.lastActive).getTime()) / 86400000);
  }
  if (metric === 'accuracy_pct') return overallAcc(s.mastery);
  if (metric === 'due_count') return s.dueCount || 0;
  if (metric === 'xp_gain') {
    const ser = series[s.studentId];
    if (!ser || ser.length < 2) return null;
    const cutoff = new Date(Date.now() - (window || 7) * 86400000).toISOString().slice(0, 10);
    const past = ser.find(p => p.date >= cutoff) || ser[0];
    const latest = ser[ser.length - 1];
    if (past === latest) return null;
    return (latest.xp || 0) - (past.xp || 0);
  }
  return null;
}

function testOp(v, op, target) {
  if (v == null) return false;
  const n = Number(target);
  switch (op) {
    case 'gt': return v > n;
    case 'gte': return v >= n;
    case 'lt': return v < n;
    case 'lte': return v <= n;
    case 'eq': return v === n;
  }
  return false;
}

function tmpl(str, value) { return String(str || '').replace(/\{value\}/g, value); }

// ── the engine ───────────────────────────────────────────────────────────────
async function evaluateRules(env) {
  const rules = ((await env.PROGRESS_KV.get('rules', { type: 'json' })) || []).filter(r => r && r.enabled);
  if (!rules.length) return { ran: true, actions: [], note: 'no enabled rules' };

  const { keys } = await env.PROGRESS_KV.list();
  const studentKeys = keys.map(k => k.name).filter(n => n.startsWith('stu_'));
  const students = (await Promise.all(studentKeys.map(n => env.PROGRESS_KV.get(n, { type: 'json' }).catch(() => null)))).filter(Boolean);

  // series (per-student trend) from the snapshot backbone
  let series = {};
  try {
    const snapKeys = keys.map(k => k.name).filter(n => n.startsWith('snap_')).sort();
    for (const sk of snapKeys) {
      const snap = await env.PROGRESS_KV.get(sk, { type: 'json' });
      if (!snap || !Array.isArray(snap.students)) continue;
      for (const st of snap.students) {
        if (!st || !st.studentId) continue;
        (series[st.studentId] || (series[st.studentId] = [])).push({ date: snap.date, xp: st.xp || 0 });
      }
    }
  } catch (e) {}

  const flags = (await env.PROGRESS_KV.get('rules_flags', { type: 'json' })) || {};
  const state = (await env.PROGRESS_KV.get('rules_state', { type: 'json' })) || {};
  const cfgCache = {};
  const dirtyCfg = new Set();
  const summary = [];
  const now = Date.now();

  async function cfgFor(sid) {
    if (cfgCache[sid]) return cfgCache[sid];
    const rec = await env.PROGRESS_KV.get('cfg_' + sid, { type: 'json' });
    cfgCache[sid] = rec ? { ...cfgDefaults(sid), ...rec } : cfgDefaults(sid);
    return cfgCache[sid];
  }

  for (const rule of rules) {
    const w = rule.when || {};
    const a = rule.action || {};
    if (!METRICS.includes(w.metric) || !OPS.includes(w.op)) continue;
    state[rule.id] = state[rule.id] || {};
    for (const s of students) {
      if (s.vacation) continue; // respect vacation mode
      const v = metricValue(w.metric, s, series, w.window);
      if (!testOp(v, w.op, w.value)) continue;
      // cooldown dedupe
      if (now - (state[rule.id][s.studentId] || 0) < COOLDOWN_MS) continue;

      let did = null;
      if (a.type === 'flag') {
        const arr = flags[s.studentId] || (flags[s.studentId] = []);
        arr.unshift({ ruleId: rule.id, ruleName: rule.name, level: (a.params && a.params.level) || 'amber', message: tmpl((a.params && a.params.message) || rule.name, v), ts: now });
        flags[s.studentId] = arr.slice(0, 10);
        did = 'flag';
      } else if (a.type === 'set_goal') {
        const cfg = await cfgFor(s.studentId);
        cfg.dailyGoal = Math.max(0, Math.min(1000, parseInt((a.params && a.params.goal)) || 0));
        cfg.updatedTs = now; dirtyCfg.add(s.studentId); did = 'set_goal';
      } else if (a.type === 'assign_concept') {
        const cfg = await cfgFor(s.studentId);
        const concept = a.params && a.params.concept;
        const has = (cfg.assignments || []).some(x => x.status !== 'done' && x.concept === concept);
        if (concept && !has) {
          cfg.assignments.push({ id: 'as_' + Math.random().toString(36).slice(2, 9), mode: 'mixed', concept, count: 10, due: null, note: 'auto · ' + (rule.name || 'rule'), createdTs: now, status: 'open', doneTs: null });
          cfg.updatedTs = now; dirtyCfg.add(s.studentId);
        }
        did = 'assign_concept';
      }
      if (did) {
        state[rule.id][s.studentId] = now;
        summary.push({ rule: rule.name, studentId: s.studentId, name: s.name || s.studentId, metric: w.metric, value: v, action: did });
      }
    }
  }

  await env.PROGRESS_KV.put('rules_flags', JSON.stringify(flags));
  await env.PROGRESS_KV.put('rules_state', JSON.stringify(state));
  for (const sid of dirtyCfg) {
    const rec = { ...cfgCache[sid] }; delete rec._dirty;
    await env.PROGRESS_KV.put('cfg_' + sid, JSON.stringify(rec));
  }
  return { ran: true, actions: summary };
}

const STARTER_RULES = [
  { id: 'seed_inactive', name: 'Inactive 3+ days', enabled: true, when: { metric: 'inactive_days', op: 'gte', value: 3 }, action: { type: 'flag', params: { level: 'amber', message: "Hasn't practiced in {value} days" } } },
  { id: 'seed_lowacc', name: 'Low accuracy', enabled: true, when: { metric: 'accuracy_pct', op: 'lt', value: 55 }, action: { type: 'flag', params: { level: 'red', message: 'Accuracy {value}% — may need a check-in' } } },
  { id: 'seed_stalled', name: 'No XP gained this week', enabled: true, when: { metric: 'xp_gain', op: 'lte', value: 0, window: 7 }, action: { type: 'flag', params: { level: 'amber', message: 'No progress in the last week' } } },
];

export async function onRequestOptions() {
  return new Response('', { status: 200, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!pinOk(request, env)) return new Response(JSON.stringify({ error: 'PIN required' }), { status: 401, headers: CORS_HEADERS });
  try {
    const rules = (await env.PROGRESS_KV.get('rules', { type: 'json' })) || [];
    const flags = (await env.PROGRESS_KV.get('rules_flags', { type: 'json' })) || {};
    return new Response(JSON.stringify({ rules, flags, meta: { metrics: METRICS, ops: OPS, actions: ACTION_TYPES } }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!pinOk(request, env)) return new Response(JSON.stringify({ error: 'PIN required' }), { status: 401, headers: CORS_HEADERS });
  let body;
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS_HEADERS }); }
  try {
    // Run the engine now.
    if (body.evaluate) return new Response(JSON.stringify(await evaluateRules(env)), { status: 200, headers: CORS_HEADERS });

    // Install starter rules if none exist yet.
    if (body.seedDefaults) {
      const cur = (await env.PROGRESS_KV.get('rules', { type: 'json' })) || [];
      if (!cur.length) await env.PROGRESS_KV.put('rules', JSON.stringify(STARTER_RULES));
      return new Response(JSON.stringify({ ok: true, rules: (await env.PROGRESS_KV.get('rules', { type: 'json' })) || [] }), { status: 200, headers: CORS_HEADERS });
    }

    let rules = (await env.PROGRESS_KV.get('rules', { type: 'json' })) || [];

    if (Array.isArray(body.rules)) {
      rules = body.rules.slice(0, 50);
    } else if (body.rule && typeof body.rule === 'object') {
      const r = body.rule;
      if (!r.id) r.id = 'r_' + Math.random().toString(36).slice(2, 9);
      if (typeof r.enabled !== 'boolean') r.enabled = true;
      const i = rules.findIndex(x => x.id === r.id);
      if (i >= 0) rules[i] = r; else rules.push(r);
    } else if (body.toggleRule && body.toggleRule.id) {
      const r = rules.find(x => x.id === body.toggleRule.id);
      if (r) r.enabled = !!body.toggleRule.enabled;
    } else if (body.deleteRule) {
      rules = rules.filter(x => x.id !== body.deleteRule);
    } else if (body.clearFlags) {
      await env.PROGRESS_KV.put('rules_flags', JSON.stringify({}));
      return new Response(JSON.stringify({ ok: true, cleared: true }), { status: 200, headers: CORS_HEADERS });
    } else if (body.clearFlagsFor) {
      const flags = (await env.PROGRESS_KV.get('rules_flags', { type: 'json' })) || {};
      delete flags[body.clearFlagsFor];
      await env.PROGRESS_KV.put('rules_flags', JSON.stringify(flags));
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS_HEADERS });
    } else {
      return new Response(JSON.stringify({ error: 'no recognized operation' }), { status: 400, headers: CORS_HEADERS });
    }

    await env.PROGRESS_KV.put('rules', JSON.stringify(rules));
    return new Response(JSON.stringify({ ok: true, rules }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
