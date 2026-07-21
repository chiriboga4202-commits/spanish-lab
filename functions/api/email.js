// functions/api/email.js — email delivery via Resend (Phase 2b, 2026-07-15).
//
// sendEmail() is exported so the rules engine (rules.js) can email autonomously.
// POST /api/email (PIN) sends a one-off message to a student from the dashboard.
//
// SETUP (Felipe, one-time): create a Resend account, verify a sending domain
// (chiriboga-labs) OR use Resend's test address, then set two Cloudflare vars on
// the Worker:
//   RESEND_API_KEY  (Secret)   — your Resend API key
//   EMAIL_FROM      (Variable) — e.g. "MITOS <noreply@chiriboga-labs.com>"
// Until RESEND_API_KEY is set, sending is a no-op that reports 'not configured'
// (so nothing breaks; the app just doesn't email yet).

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-teacher-pin',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const APP_URL = 'https://spanish-lab.chiriboga-labs.workers.dev';

function pinOk(request, env) {
  if (!env.TEACHER_PIN && !env.TEACHER_PIN2) return true;
  const pin = request.headers.get('x-teacher-pin') || new URL(request.url).searchParams.get('pin');
  return (env.TEACHER_PIN && pin === env.TEACHER_PIN) || (env.TEACHER_PIN2 && pin === env.TEACHER_PIN2);
}
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Reusable sender. Returns { ok, error?, skipped? }. Never throws.
export async function sendEmail(env, to, subject, text) {
  try {
    if (!env.RESEND_API_KEY) return { ok: false, skipped: true, error: 'RESEND_API_KEY not configured' };
    if (!to) return { ok: false, error: 'no recipient' };
    const from = env.EMAIL_FROM || 'Spanish Lab <onboarding@resend.dev>';
    const html = '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a">' +
      esc(text).replace(/\n/g, '<br>') +
      '<div style="margin-top:18px"><a href="' + APP_URL + '" style="background:#5b8dee;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Abrir Spanish Lab</a></div></div>';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject: subject || 'Spanish Lab', text, html }),
    });
    if (!res.ok) return { ok: false, error: (await res.text()).slice(0, 250) };
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}

export async function onRequestOptions() {
  return new Response('', { status: 200, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!pinOk(request, env)) return new Response(JSON.stringify({ error: 'PIN required' }), { status: 401, headers: CORS_HEADERS });
  let body;
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS_HEADERS }); }
  if (!body.studentId) return new Response(JSON.stringify({ error: 'studentId required' }), { status: 400, headers: CORS_HEADERS });
  try {
    const cfg = await env.PROGRESS_KV.get('cfg_' + body.studentId, { type: 'json' });
    const to = body.to || (cfg && cfg.email);
    if (!to) return new Response(JSON.stringify({ error: 'no email on file for this student' }), { status: 400, headers: CORS_HEADERS });
    const r = await sendEmail(env, to, body.subject, String(body.text || '').slice(0, 4000));
    const status = r.ok ? 200 : (r.skipped ? 503 : 502);
    return new Response(JSON.stringify(r), { status, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
