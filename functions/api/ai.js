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

  // 2026-07-03: THE actual root cause of "everything AI fails except Pairs" —
  // gemini-2.0-flash (and gemini-2.0-flash-lite) were shut down by Google on
  // 2026-06-01. Every single call this app made was hitting a retired model
  // and failing 100% of the time, not intermittently — confirmed via web
  // search (Google's own deprecations page + multiple dated sources), since
  // this sandbox has no network path to the live site to reproduce it
  // directly. This explains the whole cluster of complaints at once: Pairs
  // "worked" only because ~80%+ of its questions silently come from a large
  // static bank on ANY generation failure (masking the outage completely);
  // every other mode either has a thinner static bank (surfaces as "fails
  // after the first exercise") or none at all (Examples/Story/Dialogue —
  // "never works"/"fails every time"). None of this was fixable by better
  // retry/backoff logic (this session's earlier fix) because retrying a
  // request to a model that no longer exists just fails again identically —
  // there was no transient rate-limit to back off from. Migrated to
  // gemini-3.1-flash-lite: current, free-tier-friendly (15 RPM / ~1,000 RPD
  // per Google's published limits as of this date), and explicitly Google's
  // own cited migration target for apps still calling a 2.0-era model.
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
    );
    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: err }), { status: res.status, headers: CORS_HEADERS });
    }
    const data = await res.json();
    // 2026-07-03: gemini-3.1-flash-lite (unlike the retired 2.0 model this
    // replaces) is a "thinking" model — even at its default minimal thinking
    // level, the response's parts array can include a reasoning part marked
    // `thought: true` ahead of the actual answer part. Blindly grabbing
    // parts[0].text (the old code, fine for a non-thinking model) risks
    // returning the model's internal reasoning instead of the real content.
    // Filter those out and join whatever real text parts remain.
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.filter(p => !p.thought && p.text).map(p => p.text).join('') || '';
    return new Response(JSON.stringify({ content: text }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
