#!/usr/bin/env node
// verify.js — pre-push sanity check for spanish-lab/index.html
//
// Catches the exact bug classes that broke this site across several past
// sessions, none of which `node --check` alone catches:
//   1. JS syntax errors (node --check) — the original "site totally
//      unclickable" bug (unescaped apostrophes, a literal newline in a
//      string, a truncated file missing closing tags).
//   2. Duplicate top-level function declarations — function declarations
//      hoist, so when the same name is declared twice, only the LAST one
//      ever runs. Any `const _origX = X` monkey-patch written before that
//      second declaration actually captures a reference to itself, so
//      calling X() recurses infinitely. Found and fixed 5 times in one
//      session (updateStreak, updateStats, recordMastery, applyThemeChoice,
//      loadFillBlank) before this script existed.
//   3. Critical bootstrap functions that are defined but never actually
//      invoked anywhere — init() sat unused for who knows how long, so the
//      concept bar never rendered a single chip for any student. This check
//      would have caught that instantly.
//
// Usage: node verify.js   (exit code 0 = safe to push, 1 = fix it first)

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const FILE = path.join(__dirname, 'index.html');
const CRITICAL_CALLS = ['init']; // add more names here if similar bootstrap bugs show up

let failed = false;
function fail(msg) {
  console.error('❌ ' + msg);
  failed = true;
}
function ok(msg) {
  console.log('✅ ' + msg);
}

function extractScript(html) {
  const matches = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  return matches.map(m => m[1]).join('\n');
}

function checkSyntax(js) {
  const tmp = path.join(os.tmpdir(), 'spanish-lab-verify-' + Date.now() + '.js');
  fs.writeFileSync(tmp, js);
  try {
    execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
    ok('Syntax OK');
  } catch (e) {
    fail('Syntax error:\n' + (e.stderr ? e.stderr.toString() : e.message));
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
}

function checkDuplicateDeclarations(js) {
  const names = [...js.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/gm)].map(m => m[1]);
  const counts = {};
  names.forEach(n => { counts[n] = (counts[n] || 0) + 1; });
  const dupes = Object.entries(counts).filter(([, c]) => c > 1);
  if (dupes.length) {
    fail('Duplicate top-level function declarations (only the LAST one ever runs): ' +
      dupes.map(([n, c]) => `${n} (x${c})`).join(', '));
  } else {
    ok('No duplicate top-level function declarations (' + names.length + ' functions checked)');
  }
}

function checkCriticalCallsHappen(js) {
  // Drop full-line comments so a comment merely *mentioning* e.g. "init()"
  // can't make this check falsely pass. (Deliberately not a full comment
  // stripper — those break on "//" inside strings like "http://..." — this
  // only skips lines whose trimmed content starts with "//".)
  const codeLines = js.split('\n').filter(line => !line.trim().startsWith('//'));
  const code = codeLines.join('\n');
  CRITICAL_CALLS.forEach(fn => {
    const callPattern = new RegExp('(?<!function\\s)\\b' + fn + '\\s*\\(', 'g');
    const calls = (code.match(callPattern) || []).length;
    if (calls <= 0) {
      fail(`"${fn}()" is defined but never called anywhere in the file — it will never run.`);
    } else {
      ok(`${fn}() is invoked ${calls} time(s)`);
    }
  });
}

function main() {
  if (!fs.existsSync(FILE)) {
    fail(`Cannot find ${FILE}`);
    process.exit(1);
  }
  const html = fs.readFileSync(FILE, 'utf8');
  const js = extractScript(html);
  if (!js.trim()) {
    fail('No <script> content found — is the file truncated or malformed?');
    process.exit(1);
  }

  checkSyntax(js);
  checkDuplicateDeclarations(js);
  checkCriticalCallsHappen(js);

  console.log('');
  if (failed) {
    console.error('🚫 Verification FAILED — fix the issues above before pushing.');
    process.exit(1);
  } else {
    console.log('✅ All checks passed — safe to push.');
    process.exit(0);
  }
}

main();
