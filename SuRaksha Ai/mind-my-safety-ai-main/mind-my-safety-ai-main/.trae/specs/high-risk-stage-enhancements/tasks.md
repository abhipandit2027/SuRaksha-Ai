# Tasks: HIGH/CRITICAL Stage Enhancements

Implementation queue for [spec.md](./spec.md).

## Dependency Map

```
Task 1 (helpers + pure logic)
    └─> Task 2 (store effects: GPS heartbeat + contact deliveries + evidence enrich)
        └─> Task 3 (continuous check-in scheduling inside store handlers)
            └─> Task 4 (UI: Live GPS card + contact delivery chips)
                └─> Task 5 (UI: enriched EvidenceLog + incident report accordion)
                    └─> Task 6 (end-to-end verification + build)
```

---

## Task 1: Pure helpers — `buildJourneyIncidentReport` + GPS + delivery utils

**Status**: pending
**Priority**: high
**Covers ACs**: AC3, AC7
**Read-first paths**:
- [types.ts](file:///c:/Users/tiwar/OneDrive/Desktop/muj/SuRaksha%20Ai/mind-my-safety-ai-main/mind-my-safety-ai-main/src/lib/types.ts) — `JourneyIncidentReport`, `JourneyEvidenceEntry`, `GpsSnapshot`, `TrustedContactNotifyEntry`
- [risk-engine.ts](file:///c:/Users/tiwar/OneDrive/Desktop/muj/SuRaksha%20Ai/mind-my-safety-ai-main/mind-my-safety-ai-main/src/lib/risk-engine.ts) — `LEVEL_STYLES`, scoring bands

### Scope

1. Add a new pure function `buildJourneyIncidentReport(j: SafeJourney): JourneyIncidentReport` **inside `store.tsx` (or a new small file next to it — keep it in store.tsx to minimise new files)** that maps every field of the report interface, computing:
   - `peakRiskScore` / `peakRiskLevel` by walking `escalationHistory` (using `riskLevel` entries, falling back to the band of `toStage` when null) + existing `evidence.entries[*].riskScore`; tie-break by highest score.
   - `escalationChain` = 1:1 map from `escalationHistory`.
   - `timelineSummary` = take up to the latest 4 `note` entries from `escalationHistory`, dedupe by content, newest first.
   - `evidenceCaptured` = current `evidence.entries.length` + 1 (because the new entry being created is the evidence count at capture time).
   - `contactsNotified` = count of `contactDeliveries` whose status is `delivered | acknowledged`.
   - `summary` = 1–2 sentence string combining `destination`, peak risk, stage reached, evidence count, active indicators.

2. Add a small pure helper `nextGpsSnapshot(prev: GpsSnapshot | null, tick: number): GpsSnapshot` that produces the next GPS reading given anchor `28.6139, 77.2090` and a tick counter, applying deterministic ±0.0003 jitter, rotating heading through N→NE→E→SE→S→SW→W→NW in order, and cycling accuracy from `±5m` to `±14m`.

3. Add a helper `buildContactDeliveryEntries(contacts: EmergencyContact[]): TrustedContactNotifyEntry[]` that takes only `notificationEnabled` contacts and returns initial entries in `pending` status with empty timestamps (timestamps will be filled by store timers).

### Test Requirements (TRs)

- **rule TR1.1**: For a journey with a known escalation history (3 entries, peak risk HIGH at stage 3, score 68), `buildJourneyIncidentReport` returns `peakRiskScore === 68` and `peakRiskLevel === "HIGH"`.
- **rule TR1.2**: Calling `nextGpsSnapshot(null, 0)` returns the anchor reading; calling it with `tick=1` returns values within ±0.0003 of anchor and heading `NE`; tick=2 heading `E`.
- **rule TR1.3**: `buildContactDeliveryEntries(DEFAULT_CONTACTS)` returns exactly 2 entries (only notificationEnabled = true from demo data) with status `"pending"`.

---

## Task 2: Store effects — GPS heartbeat, contact delivery progress, evidence enrichment

**Status**: pending
**Priority**: high
**Covers ACs**: AC1, AC2, AC3
**Depends on**: Task 1
**Read-first paths**:
- [store.tsx](file:///c:/Users/tiwar/OneDrive/Desktop/muj/SuRaksha%20Ai/mind-my-safety-ai-main/mind-my-safety-ai-main/src/lib/store.tsx) — entire StoreProvider, `enterStage`, `appendEvidence`, existing `useEffect` hooks

### Scope

1. **GPS heartbeat effect** in the store provider. Add a dedicated `useEffect` keyed on `[state.journey?.id, hydrated]` that:
   - Runs only while a journey exists AND (its `stage >= 3` OR `liveLocationShared` is true) AND status is active/deviation/escalating.
   - Keeps a ref-based interval id. Tick every 2000 ms, incrementing a ref counter.
   - On each tick, calls `patch` to update `state.journey.gps = nextGpsSnapshot(journey.gps, tick)`.
   - Cleans up interval on id change / unmount / condition flip.

2. **Contact delivery transitions** triggered inside `enterStage` when `toStage >= 3 && fromStage < 3`:
   - Build initial `contactDeliveries` via the helper from Task 1 and set them on `next`.
   - Schedule staggered `setTimeout`s (per priority order):
     - At `1500ms × priority`: transition entry → `"delivered"` and set `notifiedAt`.
     - At `1500ms × priority + 4000ms`: transition entry → `"acknowledged"` and set `acknowledgedAt`.
   - Track these timeout ids in a ref; clear when journey.id changes or when StoreProvider unmounts.
   - Do not rebuild if `contactDeliveries.length > 0` already (re-entry protection).

3. **Enrich `appendEvidence`** (the pure helper inside store.tsx) to populate every new field from the interface:
   - Accept the current `contacts` and `gps` state so it can snapshot them. Update callers.
   - Attach a fresh `JourneyIncidentReport` via Task 1 helper.
   - Attach `gpsSnapshot`, `riskLevelAtCapture`, `activeIndicatorsAtCapture`, `contactSnapshot`.

### Test Requirements (TRs)

- **rule TR2.1**: With an active journey in Stage 3, after waiting 3 seconds, `journey.gps.updatedAt` is later than the journey's `startedAt` timestamp and the GPS values differ from the initial anchor by at most 0.0003.
- **rule TR2.2**: After first Stage 3 entry, waiting 7s produces exactly 2 `acknowledged` entries (from the 2 enabled demo contacts) in `contactDeliveries`, each with a non-null `notifiedAt` and `acknowledgedAt`.
- **rule TR2.3**: The next `journey.evidence.entries[n-1]` after Stage 3 entry has a non-null `incidentReport.summary` and `gpsSnapshot.lat` is a non-empty string.

---

## Task 3: Continuous Stage 3/4 check-in scheduling

**Status**: pending
**Priority**: high
**Covers ACs**: AC4
**Depends on**: Task 2 (evidence must already be enriched before scheduling re-checks so each transition also snapshots)
**Read-first paths**:
- [store.tsx](file:///c:/Users/tiwar/OneDrive/Desktop/muj/SuRaksha%20Ai/mind-my-safety-ai-main/mind-my-safety-ai-main/src/lib/store.tsx) — `reassessAtStage3No`, `handleSafetyCheckYes` (stage===4 branch), `enterStage`, `CHECK_MS`

### Scope

1. In `reassessAtStage3No` (Stage 3 "No, I need help" answer):
   - Keep existing evidence append.
   - Immediately after, create a **fresh Stage 3** `SafetyCheckPrompt` (`id: SCK-${Date.now()}-R, stage: 3, askedAt: now, expiresAt: +15s`) and set it on `next.pendingCheck` instead of `null`.

2. In the Stage 4 "Yes" branch of `handleSafetyCheckYes` (already logs evidence, but leaves `pendingCheck: null`):
   - Change the resulting journey to include a **fresh Stage 4** verification `SafetyCheckPrompt` with `id: SCK-${Date.now()}-V, stage: 4, askedAt: now, expiresAt: +15s`. Update its escalation note to mention "continuous monitoring remains active; next verification scheduled".
   - Keep evidence append.

3. Ensure the existing timeout watcher effect in the store (line ~658) will pick up these new `pendingCheck.id` values, which it already does because it keys on `pendingCheck?.id` — no changes needed there; just confirm the ref-based callback still fires.

4. Keep `triggerSosFromStage4` behaviour as-is (leaves `pendingCheck: null` because the separate emergency mode owns UX now).

### Test Requirements (TRs)

- **rule TR3.1**: At Stage 3, after clicking "No — I need help" in the safety check dialog, within 500ms `journey.pendingCheck` is not null and `journey.pendingCheck.stage === 3`.
- **rule TR3.2**: At Stage 4, after clicking "Yes — I am safe", `journey.pendingCheck.stage === 4` and the new check's `expiresAt` is >14s in the future.
- **rule TR3.3**: After Stage 4 timeout → SOS trigger path → `journey.pendingCheck === null` (unchanged from current behaviour).

---

## Task 4: UI — Live GPS panel + per-contact delivery chips

**Status**: pending
**Priority**: high
**Covers ACs**: AC5
**Depends on**: Task 2 (state must populate GPS + deliveries for UI to render)
**Read-first paths**:
- [journey.tsx](file:///c:/Users/tiwar/OneDrive/Desktop/muj/SuRaksha%20Ai/mind-my-safety-ai-main/mind-my-safety-ai-main/src/routes/journey.tsx) — `ActiveJourneyView`, existing badge/container styles
- [styles.css](file:///c:/Users/tiwar/OneDrive/Desktop/muj/SuRaksha%20Ai/mind-my-safety-ai-main/mind-my-safety-ai-main/src/styles.css) — colour tokens, `emergency-pulse`, `rise-in` keyframes

### Scope

1. **Live GPS Tracking panel** rendered inside `ActiveJourneyView` **above** the risk breakdown section, conditionally shown only when `journey.gps` is non-null:
   - Panel header: `lucide-react` `Navigation` icon + title `Live GPS Tracking` + pulsing `LIVE` pill (re-use or extend the existing `emergency-pulse` keyframe; add a smaller `live-pulse` animation class in `styles.css` that pulses a green/critical dot).
   - Grid layout: lat, lon, accuracy, heading, updatedAt (formatted as HH:MM:SS with seconds).
   - Make updatedAt text visibly change on screen by binding it to the existing `now` tick already in the page (every 1s + heartbeat every 2s).

2. **Contact deliveries chips row** placed below the status pills (immediately under the `Live location shared / Contacts notified` badge row) and only shown when `journey.contactDeliveries.length > 0`:
   - Heading text: `Trusted contacts` with lucide `Users` icon.
   - One chip per delivery: avatar/initials, name, relationship, status badge coloured per status (muted=pending, bg-high-soft=delivered, bg-low-soft=acknowledged), relative `notifiedAt` time, and an acknowledged tick icon when `acknowledgedAt` is set.

3. Add a new `@keyframes live-pulse` in styles.css that pulses the HIGH ring-colour.

### Test Requirements (TRs)

- **rule TR4.1**: When Stage 3+ is active, the journey page contains a visible `<section>` with the text "Live GPS Tracking".
- **rule TR4.2**: Observing the page for 5 seconds, at least one of the GPS fields changes its rendered text value (jitter or timestamp).
- **rule TR4.3**: After Stage 3+ entry, a chips row containing the 2 enabled contact names appears within 2s and status badges change from muted to HIGH to LOW colours as delivery progresses.

---

## Task 5: UI — Enhanced EvidenceLog with Incident Report accordion per entry

**Status**: pending
**Priority**: medium
**Covers ACs**: AC6, AC9
**Depends on**: Task 4 (both UI tasks touch `journey.tsx`; keep them sequential to avoid merge conflicts even though they are logically separate)
**Read-first paths**:
- [journey.tsx](file:///c:/Users/tiwar/OneDrive/Desktop/muj/SuRaksha%20Ai/mind-my-safety-ai-main/mind-my-safety-ai-main/src/routes/journey.tsx) — `EvidenceLog`, `JourneyEvidenceEntry` render
- [components/ui/accordion.tsx](file:///c:/Users/tiwar/OneDrive/Desktop/muj/SuRaksha%20Ai/mind-my-safety-ai-main/mind-my-safety-ai-main/src/components/ui/accordion.tsx) — shadcn accordion if present; else use a simple collapsible div

### Scope

1. In `EvidenceLog`, for each entry:
   - Add a row rendering `riskLevelAtCapture` as a level badge (use `LEVEL_STYLES`) + `riskScore` as a mono score next to the existing score chip; align them in a single row.
   - Add a `gpsSnapshot` row under the existing `MapPin {en.gpsLocation}` line showing lat/lon/heading/accuracy (conditionally rendered, only if `gpsSnapshot` is non-null).
   - Show `contactSnapshot.length` summary line "(N contacts notified at capture)".
   - Add a collapsible **Incident Report** section inside each entry (only when `incidentReport` is non-null — for backwards compat, skip when null so old history still renders). Accordion content:
     - Title text + peak risk / current risk stats badges.
     - `summary` paragraph.
     - "Escalation chain": list of `from→to / trigger / risk-level` bullets from `escalationChain`.
     - "Timeline": bullets from `timelineSummary`.
     - "Evidence captured" + "Contacts notified" counters.

2. Add defensive fallbacks: if `gpsSnapshot` is null, if `incidentReport` is null, if `riskLevelAtCapture` is null — the old slim layout is preserved for pre-patch history entries.

### Test Requirements (TRs)

- **rule TR5.1**: A newly-created Stage 3+ evidence entry renders a level badge + score, a GPS row, a contact summary line, and an accordion header "Incident Report" that expands to show summary text and >= 1 escalation chain bullet.
- **rule TR5.2**: A synthetic history entry with all new fields null / undefined / empty arrays renders without a React runtime error and shows the previous slim layout (title / GPS string / description / timestamp only).

---

## Task 6: Verification + build

**Status**: pending
**Priority**: high
**Covers ACs**: AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9
**Depends on**: Tasks 1–5
**Read-first paths**:
- [package.json](file:///c:/Users/tiwar/OneDrive/Desktop/muj/SuRaksha%20Ai/mind-my-safety-ai-main/mind-my-safety-ai-main/package.json) — scripts
- [START-SURAKSHA.bat](file:///c:/Users/tiwar/OneDrive/Desktop/muj/SuRaksha%20Ai/START-SURAKSHA.bat) — dev server invocation

### Scope

1. Run `npm install` to ensure all deps are installed (idempotent).
2. Run `npm run build`; capture output; confirm no TS / Vite errors.
3. Optionally run `npm run lint` if eslint is wired.
4. Start the dev server (if not already running), walk through a full HIGH-stage flow, and document the acceptance evidence checklist for AC1–AC9.
5. If any build or lint issue surfaces, route fixes back to the relevant task file (do not add new files here).

### Test Requirements (TRs)

- **rule TR6.1**: `npm run build` exits with code 0. Vite build output shows no TS errors.
- **rule TR6.2**: Dev server boots; navigating to `/journey` shows the start form; a full deviation→escalation→Stage 3→Stage 4→arrived walkthrough does not throw any console.error/exception and AC1–AC7 pass their observable checks.
- **rubric TR6.3 — Manual walkthrough fidelity (pass >= 1)**:
  - 0: Core loop fails to reach Stage 3, or reaching Stage 3 throws.
  - 1: Loop reaches Stage 3, shows GPS panel + contact chips + evidence with reports, but re-check scheduling may require a reload.
  - 2: Full sticky loop works — from Stage 3 "No", new check opens automatically; from Stage 4 "Yes", new verification opens; GPS ticks; contacts progress; evidence grows; until "I've arrived".
