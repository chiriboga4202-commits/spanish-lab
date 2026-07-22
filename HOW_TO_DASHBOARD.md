# How to drive Spanish Lab — teacher guide (2026-07-15)

Plain-English walkthrough of everything you can now do. Dashboard lives at
`/spanish-teacher-dashboard.html`. Most actions need your TEACHER_PIN (it asks once).

## Roster (the student cards)
Each student card shows: live-now 🟢, level/XP/due, an XP **sparkline**, concept
mastery bars, their AI recap + mistake patterns, ⚠️ error/health flags, and a
**control strip** of one-tap actions (below).

Top of the roster you have: **🔎 search**, a **sort** dropdown, a **🏫 Classes**
button, a **⚙️ Rules** button, and a **class filter** (view one class at a time).

## Assigning work (the whole point)
On each student card:
- **📌 assign+due** — assign a *practice concept* (e.g. ser-estar ×10) with a due date.
- **📖 assign episode** — assign a *MITOS comic episode* (pick + due date). Lands in
  the student's banner as "📖 Leer: …" and opens the reader.
- **📝 assign hoja** — assign a *worksheet*: pick topics (or blank = their studied
  ones), question count, due date. Auto-graded; marks itself done on completion.

All three show up in the student's assignment banner, and completing them flows
back so you see it done. You can also assign **class-wide** (the 📋 Queue tab) or
let a **rule** assign automatically (see Rules).

## Reaching students
- **💬 nudge** — a warm personal message they see as a banner next time they open
  the app ("We miss you! 5 minutes keeps your streak alive").
- **✉️ email** — first use asks for their address (you type it; stored privately),
  then sends. *Needs Resend set up first* (RESEND_API_KEY + a domain). Until then
  it says "not set up yet".
- **👪 parent link** — generates a read-only progress link to share with a parent.
- **📝 note / ✏️ rename** — private note / dashboard-only display name.

## Per-student controls (same strip)
- **🎚️ goal** (daily XP), **⚡ level** (difficulty), **⏸️ freeze** (pause access),
  status badges show what's set.

## Classes (multi-tenancy)
- **🏫 Classes** → create a class → it gives you a **join code**. Students enter it
  on their first screen to be grouped. Then the **class filter** scopes the roster,
  and announcements / auto-approve / class-box target the selected class.

## Automation (⚙️ Rules)
The rules engine runs itself (hourly, off student activity). Options:
- **S** — install 3 safe starter rules (flag-only: inactive 3d, low accuracy, no XP/week).
- **N** — install an auto re-engagement nudge (inactive 5d → warm banner).
- **R** — run now. **T#** toggle a rule. **X** clear flags.
Rule actions available: flag, nudge, assign concept/episode/worksheet, set goal,
email. Flagged students show a red/amber ⚑ chip.

## What students see (so you know what you're assigning)
- **📖 MITOS** — the comic saga. Reads paged, live Fácil/Intermedio/Nativo levels,
  tap-word gloss, read-aloud; vocab flows into their spaced practice.
- **📝 Ejercicios** — the auto-graded worksheet player.
- **🧠 El Cerebro** — their knowledge as a living neural graph; tapping a neuron
  practices it and grows the web. (All three under one ✦ launcher button.)

## Class intelligence (📊 tab)
AI daily triage ("3 things need you"), needs-attention list, mastery heatmap,
most-missed questions, topic funnel, read receipts, AI lesson plan, CSV export,
audit log, and the **📦 class-in-a-box** toggle (auto-approve + nudges + snapshots).
