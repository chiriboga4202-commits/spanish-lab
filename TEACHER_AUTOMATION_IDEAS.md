# Teacher Dashboard — 100 Ideas Toward Control & Automation (2026-07-05)

Objective: Felipe shares the app with students he won't actively supervise. The dashboard's job shifts from "lesson companion" to "mission control that runs itself." Excludes shipped work (roster, class intel, auto-approve, announcements, backup, PWA, movable sections, students-first default).

## Zero-Touch Class Operations (1–15)
1. Weekly auto-digest email/report: who advanced, who stalled, who vanished — generated and stored, zero clicks
2. Auto-nudge inactive students: after N days, the app itself shows them a teacher-toned comeback message
3. Auto-assign remediation: 3 misses on a pattern → that concept auto-queues for that student only
4. Auto-lower daily goal for struggling students; auto-raise for cruisers (banded, teacher-capped)
5. Auto-schedule review days: every 7th active day becomes a forced Review-mode day
6. Stale-student auto-archive: 30 days inactive → moved out of the roster view (recoverable)
7. Auto-celebration: checkpoint passes trigger a pre-written congratulation banner to that student
8. Class health score (0-100) computed daily — one number to glance at
9. Auto-escalation rules: "if accuracy <50% for 3 sessions, flag red + suggest a call"
10. Onboarding autopilot: new student ID appears → auto-welcome announcement + goal + topic 1 brief
11. Auto-pace detection: flag students moving >2 topics/week (possible guessing) for review
12. Vacation mode per student: pause streak/nag mechanics teacher-side
13. Auto-generated substitute-teacher packet: current class state as one printable page
14. Rules engine UI: "WHEN [condition] DO [action]" builder storing to KV (powers ideas 2-5 generically)
15. Dead-man switch: if teacher hasn't opened the dashboard in 14 days, auto-approve turns on

## Monitoring at Scale (16–30)
16. Roster virtualization + search/filter bar (name, topic, health) — needed past ~15 students
17. Sortable roster columns (last active, accuracy, topic, XP)
18. Cohort view: group students by topic position automatically
19. Red/amber/green health chips computed from trend, not snapshot
20. Per-student sparklines once daily snapshots exist (KV history writes)
21. Class funnel chart: how many students sit at each of the 11 topics
22. Checkpoint pass-rate stats per topic (is Gender's checkpoint too hard?)
23. Question-level analytics: flag bank items with <30% class success as possibly broken
24. Session heatmap by hour/day — when does your class actually study?
25. Average time-per-topic metric to predict course completion dates
26. Accuracy trend arrows (▲▼) next to each student name
27. "New since you last looked" divider line in the roster
28. Live now indicator (synced within last 2 min) with green dot
29. Weekly cohort comparison: this week vs last week class accuracy delta
30. Export roster to CSV one-tap (for gradebooks)

## Student Control (31–45)
31. Bulk actions: select multiple students → assign / unlock / message at once
32. Per-student assignment queue (current queue is class-wide — biggest control gap)
33. Assignment deadlines with auto-expiry and completion tracking
34. Per-student daily XP goal setting from the roster card
35. Per-student difficulty override (force beginner exercises for a struggler)
36. Freeze a student (pause access without deleting — e.g. unpaid, misbehaving)
37. Reset a student's topic (send back for re-testing after a break)
38. Per-student checkpoint threshold override (make it 60% for a young kid)
39. Student notes field per card (private, KV-stored)
40. Merge duplicate student records (same kid, two devices)
41. Rename students from the dashboard (fix "Unnamed student" without asking them)
42. Class roster invites: generate a class code; students who enter it get grouped (multi-class)
43. Per-class settings once class codes exist (different paths per class)
44. Student device list: see if one student syncs from 3 devices
45. Transfer student between classes

## Communication (46–55)
46. Per-student direct messages (banner only that student sees)
47. Message templates library ("great week!", "let's review ser/estar") — one tap to send
48. Scheduled announcements (write now, publish Friday 8am)
49. Student question inbox (pairs with student idea #86)
50. Reaction buttons on student recaps (student sees the emoji — cheap connection)
51. Auto-translated announcements (write English, students can toggle Spanish)
52. Parent share links: read-only progress page per student, token-protected
53. Weekly parent email draft auto-generated per student (teacher approves before send)
54. Broadcast urgency levels: info banner vs modal that must be acknowledged
55. Read receipts on announcements (who actually saw it)

## AI Leverage (56–70)
56. AI triage briefing on dashboard open: "3 things need you today" (replaces scanning)
57. AI-generated per-student weekly summaries batched automatically (not per-click)
58. AI intervention suggestions on red-flagged students ("assign reflexive Builder + this sheet")
59. AI checkpoint difficulty audit: analyze pass rates, propose threshold changes
60. AI question-bank expansion: one button → 10 new vetted items for any thin concept, teacher approves diff
61. AI parent-report writer (English + Spanish paragraph per student)
62. AI detects guessing patterns (fast answers + low accuracy) and flags
63. AI end-of-course readiness estimate per student ("ready for real conversation: 60%")
64. AI lesson plans auto-attached to the weekly digest, pre-seeded by that week's heatmap
65. AI "explain this student to me" — freeform Q&A over one student's full history
66. AI-suggested pairings ("Maria strong in ser/estar, Juan weak — pair them")
67. AI content localization pass: adapt bank examples to the class's country/context
68. AI weekly class newsletter draft (wins, focus areas, meme-grade Spanish fact)
69. Auto-generated study sheets pushed when a student enters a new topic
70. AI flag review queue: student-reported bad exercises get AI pre-triage (valid/invalid)

## Curriculum Control (71–80)
71. Visual path editor: drag topics to reorder the LEARNING_PATH from the dashboard (writes KV, student apps adopt)
72. Per-class path variants (advanced class skips present tense)
73. Custom topics: teacher-defined concept + AI-generated bank, injected into the path
74. Checkpoint composer: choose section sizes/pass marks per topic from UI (writes the PATH_SECTIONS config to KV)
75. Gateway brief editor: rewrite the mental-model text students see per topic
76. Push custom exercises from ✏️ Create into students' banks (wire existing pane to KV)
77. Sync #37 gateway requirements via KV (still localStorage-only)
78. Topic prerequisites editor (beyond linear: "por-para needs gender OR word-order")
79. Seasonal curriculum presets (exam-prep mode: heavier checkpoints)
80. Content freeze switch: lock banks during a test week so AI variety doesn't interfere

## Infrastructure & Trust (81–90)
81. Nightly automated KV backup via Cloudflare cron trigger (the ⬇ button is manual)
82. Audit log: every unlock/announcement/setting change with timestamp (KV append)
83. Role tiers: TEACHER_PIN2 becomes read-only co-teacher mode option
84. Rate limiting on /api/progress POSTs per studentId (abuse protection before sharing widely)
85. Student data purge tool (GDPR-style: delete everything about one student)
86. Usage quota dashboard: Gemini call counts per day (cost visibility as class grows)
87. KV storage meter (records × size vs plan limits)
88. Endpoint health strip on dashboard (all 5 APIs green/red)
89. Versioned config: setting changes keep last-3 history with revert
90. Anomaly alerts: sudden 10× progress writes = possible abuse, flag it

## Scale & Growth (91–100)
91. Multi-teacher support: per-teacher PINs, students tagged by teacher
92. Public demo mode: sandboxed student experience for prospective families (no KV writes)
93. Self-serve student onboarding page: enter class code → named, grouped, started at topic 1
94. Pricing/quota tiers groundwork: max students per class code
95. White-label variables: class name, teacher name, accent color per class
96. Landing page for the app itself (what it is, how to join) — sharable to "more people"
97. Weekly automated smoke test: cron hits all endpoints + one AI generation, reports failures
98. Error telemetry: student-side JS errors ping a KV log the dashboard surfaces
99. Session-length caps for young students (teacher sets 20 min/day max)
100. Fully-automated "class in a box" preset: one toggle enables auto-approve + auto-nudge + auto-remediation + weekly digest — supervision optional by design

**Recommended first five: 56, 32, 16, 81, 100** — the triage briefing changes how the dashboard feels immediately; per-student assignments is the biggest control gap; roster search is required before sharing widely; cron backup protects everything; #100 is the stated objective in one switch.
