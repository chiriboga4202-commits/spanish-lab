# Teacher Dashboard — Improvement Backlog (2026-07-05)

30 ideas from the Felipe/Claude planning session. Status key: ⬜ open · 🔨 in progress · ✅ shipped.

## Monitoring & Roster
1. ⬜ Class overview grid — one tile per student, weekly-XP sparkline, red/amber/green health color
2. ⬜ Students × concepts heatmap — spot class-wide weak concepts at a glance
3. ⬜ "Needs attention" auto-list — inactive 3+ days, accuracy dropping, or high overconfidence signals
4. ⬜ Per-student trend charts over time (needs daily snapshots in KV, not just latest-write)
5. ⬜ Checkpoint approvals pane — "ready to advance" queue with one-tap unlock (linear-path control; pass ≥75% → teacher approves)
6. ⬜ Answer replay — one student's full session chronologically, wrong answers expanded
7. ⬜ Mistake-pattern digest per student using the existing error taxonomy data
8. ⬜ Class-wide "5 most-missed questions" list
9. ⬜ Per-student assignments (current queue is class-wide only)
10. ⬜ Assignment deadlines + who-completed-it tracking

## Control & Communication
11. ⬜ Sync #37 custom gateway requirements via KV (currently localStorage-only = never reaches students)
12. ⬜ Push a teacher-generated study sheet to all students' Study menus
13. ⬜ Class announcements banner ("Quiz Friday!")
14. ⬜ Per-student topic lock/unlock + emergency "unlock all"
15. ⬜ Teacher-tunable daily XP goal per student

## Live Classroom
16. ⬜ Live class mode — fullscreen feed, per-student activity lights (answering / idle)
17. ⬜ Teacher-started sprint race with live leaderboard
18. ⬜ Quick-poll: push one question to every connected student, watch answers roll in

## AI & Content
19. 🔨 Migrate dashboard AI from localhost Ollama to the /api/ai Gemini proxy — works from phone, no local hardware
20. ⬜ AI weekly one-paragraph progress summary per student
21. ⬜ AI lesson-plan generator seeded by the class heatmap
22. ⬜ Wire the Create pane's custom exercises into KV so they actually reach students
23. ⬜ Printable per-student progress report (PDF) for parents

## Infrastructure
24. ⬜ Mobile-responsive layout + PWA install (teacher phone access; APK via TWA only if PWA hits a wall)
25. ⬜ Web push notifications ("Maria passed her checkpoint")
26. ⬜ Auto-refreshing roster with changed-row highlight
27. ⬜ Multi-class support via class codes
28. ⬜ Private teacher notes per student
29. ⬜ Nightly KV backup snapshot
30. ⬜ Co-teacher access with a second PIN

## Related (student app, spun out of this list)
- Port teacher tools to student app sourced from STUDY-SESSION data (not recorded audio): session recap, concept mind maps, mistake clustering — see session logs 2026-07-05.
- Linear learning path: sequence TBD (Felipe to provide final order), 12-question checkpoint at ≥75%, teacher-approval unlock (#5/#14 above are the teacher half).
