# Spanish Lab — Schedule (2026-07-15)

Ordered by dependency. Each phase gates the next.

## Phase 0 — Ship & verify (do first; gates everything)
1. Remove the scrolling feed (📱 FAB + overlay)
2. Push the batch + run `test_primitives.mjs`
3. Delete test accounts (E2E Check, ConnTest)
4. Phone QA: dashboard + student + MITOS; `100vh`→`dvh` if clipped; 📖 FAB placement

## Phase 1 — MITOS to real content  (after 0)
5. Image route on `/api/ai` + generate Prometheus panels (~$0.25)
6. Wire MITOS vocab → real SM-2 review deck
7. Build production tool (gen prompt → panels → episode JSON)
8. Produce more episodes (Greek → world myth → Spanish history)

## Phase 2 — Automated assignment system  (after 1)
9. In-app delivery: wire rules/nudges/assignments to comic content
10. Per-student private email field (teacher-entered)
11. Email delivery: Resend + `/api/email` endpoint
12. Assignment rules (new episode → assign + email; inactivity → re-engage)

## Phase 3 — Deferred & primitives  (as capacity allows)
13. Apply difficulty + checkpointThreshold overrides (needs live-test)
14. KV-driven curriculum (per-class path variants, custom topics, visual editor)
15. Nightly off-site KV backup
16. Fold `notes.js` into `cfg_`
17. Tier-3: realtime classroom, web push
18. Client-only student UX backlog (~50 ideas)
