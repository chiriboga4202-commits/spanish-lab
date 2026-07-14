# Teacher Dashboard — Improvement Backlog (updated 2026-07-05 evening)

30 ideas from the Felipe/Claude planning session. Status key: ⬜ open · 🔨 in progress · ✅ shipped.

## Monitoring & Roster
1. ⬜ Class overview grid with weekly-XP sparklines (needs #4's history snapshots first)
2. ✅ Students × concepts heatmap — in 📊 Class intelligence
3. ✅ "Needs attention" auto-list — inactive 3+ days, <60% concepts, pending approvals
4. ⬜ Per-student trend charts over time (needs daily snapshots in KV, not just latest-write)
5. ✅ Checkpoint approvals — READY badge + ✓ Unlock next topic per student
6. ✅ Answer replay — 🎬 Recent answers per student card
7. ✅ (via student-side mistake constellation mirrored to teacher)
8. ✅ Class-wide most-missed questions — in 📊 Class intelligence
9. ⬜ Per-student assignments (current queue is class-wide only)
10. ⬜ Assignment deadlines + who-completed-it tracking

## Control & Communication
11. ⬜ Sync #37 custom gateway requirements via KV (still localStorage-only)
12. ⬜ Push a teacher-generated study sheet to all students' Study menus
13. ✅ Class announcements — 📣 Announce composer → student banner (/api/announce)
14. ✅ Per-student topic set/unlock ("set topic…" per card)
15. ⬜ Teacher-tunable daily XP goal per student

## Live Classroom
16. ⬜ Live class mode — fullscreen feed, per-student activity lights
17. ⬜ Teacher-started sprint race with live leaderboard
18. ⬜ Quick-poll: push one question to every connected student

## AI & Content
19. ✅ Dashboard AI on /api/ai Gemini proxy — no local hardware
20. ✅ AI per-student summary — 🤖 AI summary button per card
21. ✅ AI lesson-plan generator from class heatmap
22. ⬜ Wire the Create pane's custom exercises into KV so they reach students
23. ⬜ Printable per-student progress report (PDF) for parents

## Infrastructure
24. ✅ Mobile single-column layout + PWA (teacher-manifest.json, sw.js; student app manifest finally linked too)
25. ⬜ Web push notifications (needs push subscription infra — revisit)
26. ✅ Auto-refresh roster (90s, preserves open cards, tab-visible only)
27. ⬜ Multi-class support via class codes (needs data-model decision)
28. ⬜ Private teacher notes per student
29. ✅ (lite) One-tap ⬇ Backup JSON of progress+assignments+path; true nightly cron still open
30. ✅ Co-teacher second PIN (TEACHER_PIN2 env var, all endpoints)

**Score: 14/30 shipped.** Deferred items block on: history snapshots (#1,#4), assignment redesign (#9,#10), new student-side consumption paths (#11,#12,#15,#22), realtime infra (#16,#17,#18,#25), data-model decisions (#27), and #23/#28 are quick wins for a future session.

## Related (student app, spun out of this list)
- Port teacher tools to student app sourced from STUDY-SESSION data (not recorded audio): session recap, concept mind maps, mistake clustering — see session logs 2026-07-05.
- Linear learning path: sequence TBD (Felipe to provide final order), 12-question checkpoint at ≥75%, teacher-approval unlock (#5/#14 above are the teacher half).
