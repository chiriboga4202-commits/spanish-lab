// progress.js — shared student-progress store, backed by Netlify Blobs.
//
// Why this exists: index.html and spanish-teacher-dashboard.html both used
// to assume "shared" meant the same browser's localStorage — which only
// works if teacher and student are on the same device. For students on
// their own phones, nothing ever reached Felipe. This function gives every
// student's browser a place to POST a small progress snapshot, and gives
// the teacher view (teacher-progress.html) a place to GET all of them back.
//
// Cost note (2026-07-01, per Netlify's credit-based pricing docs): Blobs
// storage itself isn't a separate line item — usage draws from the site's
// monthly credit pool via function compute (10 credits/GB-hour) and
// bandwidth (20 credits/GB). These payloads are a few KB each, synced at
// most once a minute per active student (see syncProgressToTeacher in
// index.html), so realistic usage for a handful of students should be a
// negligible fraction of the Free plan's 300 credits/month. Monitor actual
// usage in the Netlify dashboard (Team settings → Billing) if that changes.

const { getStore } = require('@netlify/blobs');

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const store = getStore('student-progress');

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }
    if (!body.studentId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'studentId is required' }) };
    }
    const record = { ...body, syncedAt: new Date().toISOString() };
    try {
      await store.setJSON(body.studentId, record);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  if (event.httpMethod === 'GET') {
    try {
      const { blobs } = await store.list();
      const students = await Promise.all(
        blobs.map((b) => store.get(b.key, { type: 'json' }).catch(() => null))
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ students: students.filter(Boolean) }),
      };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
