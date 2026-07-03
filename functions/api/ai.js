// functions/api/ai.js — Cloudflare Pages Function, replaces netlify/functions/ai.js
//
// Migrated 2026-07-02: Netlify's free-tier credit cap paused the whole account
// mid-cycle (each production deploy alone costs 15 of the 300 monthly
// credits). Cloudflare Pages' free tier uses flat per-category limits instead
// (100,000 function requests/day, unlimited static bandwidth) with no shared
// pool that can pause everything at once.
//
// Routing: Cloudflare Pages Functions use file-based routing automatically —
// this file being at functions/api/ai.js makes it live at /api/ai with no
// redirect config needed (unlike Netlify's netlify.toml [[redirects]] block).
// index.html's geminiCall() already POSTs to the relative path /api/ai, so
// no client-side changes were needed for this migration.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export async function onRequestOptions() {
  return new Response('', { status: 200, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Cloudflare Pages Functions read env vars off context.env, not
  // process.env — set GEMINI_API_KEY in the Cloudflare dashboard under
  // this Pages project's Settings -> Environment variables.
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), { status: 500, headers: CORS_HEADERS });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS_HEADERS });
  }

  const { system, prompt, temperature = 0.7, json_mode = false } = body;

  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: 2048,
      ...(json_mode ? { responseMimeType: 'application/json' } : {}),
    },
  };
  if (system) {
    requestBody.systemInstruction = { parts: [{ text: system }] };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
    );
    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: err }), { status: res.status, headers: CORS_HEADERS });
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return new Response(JSON.stringify({ content: text }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
