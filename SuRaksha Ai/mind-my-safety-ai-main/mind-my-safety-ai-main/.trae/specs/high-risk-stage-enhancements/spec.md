# Spec: HIGH/CRTICAL Stage (Stage 3/4) Enhancements for Safe Journey Mode

## Problem

The current Safe Journey escalation system reaches Stage 3 (HIGH) / Stage 4 (CRITICAL) but does not fully activate all four protective behaviours described in the product vision:

1. **Live GPS location sharing** — The flags `liveLocationShared` and `contactsNotified` are set on first entry to Stage 3+, and a toast is shown, but there is no simulated "live updating GPS" ticking on the journey card. The `GpsSnapshot` type exists in `types.ts` but `journey.gps` is never populated.
2. **Per-contact notification delivery records** — The `TrustedContactNotifyEntry` type and `journey.contactDeliveries` field exist but are never populated with per-contact confirmation chips (pending → delivered → acknowledged).
3. **Full evidence recording** — `JourneyEvidenceEntry` is missing critical fields that are declared in the type: `gpsSnapshot`, `riskLevelAtCapture`, `activeIndicatorsAtCapture`, `contactSnapshot`, and `incidentReport` are all uninitialised. The structured `JourneyIncidentReport` snapshot is never generated.
4. **Continuous check-ins while elevated** — After answering "No, I need help" at Stage 3, `reassessAtStage3No` sets `pendingCheck: null`, so no next safety check is scheduled. Once the situation is Stage 3+, every response (Yes/No/timeout on the current check) must trigger a fresh follow-up check-in AND a fresh evidence snapshot so the journey remains under continuous monitoring.
5. **"Live GPS" visual indicator** — There is no live-updating GPS panel on the active journey card that the user can watch ticking.

The goal of this spec is to close those gaps so that the HIGH/CRTICAL stages behave as a cohesive protection workflow, not just a scored indicator.

## Users

- Primary: Traveller (the app user, a teen/adult in a potentially unsafe commute).
- Secondary: Trusted contacts (recipients of location share + alert notifications, simulated in this prototype).

## Goals

- Upon any transition that lands in Stage 3+ (first entry, subsequent reassessment, timeout, or check-in response):
  - Force live location sharing ON and simulate GPS readings ticking on the card.
  - Automatically notify every enabled trusted contact and show per-delivery status chips.
  - Record a full evidence entry (timestamp, GPS snapshot, risk level/score, indicators, escalation history snapshot, and a structured incident report).
  - Schedule the NEXT 15-second safety check immediately (continuous loop while Stage 3/4).
- Keep evidence/location/contacts **continuously active** after the first HIGH stage for the entire remaining journey (until user arrives or ends). The "Yes, I'm safe" response must still stay in heightened monitoring if the stage is 4.
- Show a prominent "Live GPS" section on the active journey card so the user can confirm location is actively being broadcast.

## Non-Goals

- Real GPS hardware access or real SMS delivery — this is a prototype; behaviour is simulated.
- Offline persistence beyond what `localStorage` already provides via the store.
- Server-side incident report exports or PDF generation — evidence and reports stay in the browser state.
- Dialer integration or calling emergency services — `EmergencyButton` and the SOS path already exist as UI affordances.

## Functional Requirements

### FR1 — Live GPS simulation (Stage 3+ continuous ticking)

- While an active journey's stage is >= 3 OR `liveLocationShared` is true, the store must maintain and periodically mutate `journey.gps: GpsSnapshot`.
- Updates must occur every ~2 seconds (simulated heartbeat). Each update must mutate:
  - `lat`, `lon` by a small deterministic jitter (±0.0003 from a Delhi-centred anchor `28.6139, 77.2090`).
  - `approx` = `${lat}, ${lon} (approx)` — the existing string.
  - `accuracy` = `"±${5 + (i % 10)}m"` where `i` is the update sequence counter.
  - `heading` = one of N, NE, E, SE, S, SW, W, NW rotating.
  - `updatedAt` = current ISO timestamp.
- The heartbeat effect must be a single subscription; it must not double-subscribe when the stage fluctuates between 3 and 4.
- If the journey is ended/arrived, the heartbeat must stop and `journey.gps` should be preserved in history.

### FR2 — Automatic trusted contact notifications with delivery records

- On the FIRST transition that lands in stage >= 3 (i.e. `fromStage < 3`), the store must create one `TrustedContactNotifyEntry` per enabled contact (`notificationEnabled === true`) drawn from `state.contacts`.
- Each entry must set:
  - `contactId`, `name`, `relationship`, `phone` copied from the contact record.
  - `notifiedAt = nowISO()`; `acknowledgedAt = null` initially.
  - `status = "pending"` immediately → `"delivered"` ~1.5s later → `"acknowledged"` ~4s later. The progression must be per-contact with a staggered delay (priority order 1 first, then 2, then 3…).
  - `deliveryChannel = "both"` (SMS + location share).
- The resulting array must be stored on `journey.contactDeliveries`.
- If the journey already has `contactDeliveries` populated, a repeated Stage 3+ entry must NOT recreate them; but every new evidence snapshot must embed a deep snapshot of `contactDeliveries` at capture time (see FR3).

### FR3 — Full evidence entries with structured incident reports

- `appendEvidence` must populate every declared field on `JourneyEvidenceEntry`:
  - `gpsSnapshot` = deep copy of `journey.gps` at capture time.
  - `riskLevelAtCapture` = `journey.riskLevel`.
  - `activeIndicatorsAtCapture` = deep copy of `journey.riskIndicators`.
  - `contactSnapshot` = deep copy of `journey.contactDeliveries`.
  - `incidentReport` = a freshly generated `JourneyIncidentReport` snapshot (see FR3.1).
- Evidence must be appended for EVERY Stage 3+ check-in transition:
  - On entry to Stage 3/4 via `enterStage` (already partially done).
  - On "No" answer at Stage 3 via `reassessAtStage3No`.
  - On "Yes" answer at Stage 4 (already done, but must enrich the snapshot).
  - On Stage 3/4 timeout via `triggerSosFromStage4` (already done, but must enrich).
- **FR3.1 — Incident report generator** — Provide a pure helper `buildJourneyIncidentReport(j: SafeJourney): JourneyIncidentReport` that deterministically fills:
  - `id`, `generatedAt`, `destination`, `journeyStartedAt`.
  - `stageReached` = current stage.
  - `peakRiskScore` and `peakRiskLevel` = max across `escalationHistory` and evidence entries (or current if none yet).
  - `currentRiskScore`, `currentRiskLevel` = current values.
  - `activeIndicators` = current risk indicators.
  - `escalationChain` = mapped 1:1 from `escalationHistory` entries (shape matches interface `{at, from, to, trigger, risk, indicators, note}`).
  - `evidenceCaptured` = number of evidence entries at generation time (including the one being added).
  - `contactsNotified` = count of `contactDeliveries` with status `delivered | acknowledged`.
  - `summary` = a 1–2 sentence natural-language summary combining destination, peak risk, stage reached, and evidence count.
  - `timelineSummary` = the latest 4 unique notes from `escalationHistory` (newest first).

### FR4 — Continuous check-ins while in Stage 3/4 (endless loop until arrived/ended)

- After the following Stage 3+ handlers run, a **fresh 15-second safety check must be scheduled** on the same stage (do NOT drop back to 0 unless the user explicitly answers Yes AND the stage is <=3, per existing stage-specific logic in `handleSafetyCheckYes`):
  - `reassessAtStage3No` (user said "No, I need help" at Stage 3): currently leaves `pendingCheck: null`. Must set a fresh Stage 3 `pendingCheck` and append evidence, then let the countdown watcher re-fire.
  - `handleSafetyCheckYes` at stage === 4 (user said "Yes, safe" during verification): must schedule a NEW Stage 4 verification check with `askedAt = nowISO()` and `expiresAt = +15,000ms`. Continuous monitoring remains active.
  - `triggerSosFromStage4` (already done for the trigger — but after SOS evidence, it should leave `pendingCheck: null` because SOS has now activated the separate emergency mode; keep current behaviour for this one case).
- The "Yes, safe → drop to Stage 0" path at stages 1-3 (Stage 3 `returnToSafe`) is preserved because a Stage 3 user confirming safety resets the ladder. This is acceptable per the user's stated intent: the "sticky" elevated protection activates *from* Stage 3 onwards as a ceiling, but a confirmed-safe Stage 3 user can explicitly clear it. Stage 4 is sticky (always re-checks) because it is the highest band.

### FR5 — "Live GPS" indicator card on the active journey UI

- In the `ActiveJourneyView` of `/journey`, when `journey.gps` is present (i.e., Stage 3+ or live location sharing active), render a prominent panel before the risk breakdown section, titled **Live GPS Tracking**.
- The panel must display:
  - A pulsing "LIVE" pill that blinks (using an existing or new keyframe `animate-pulse`-style variant).
  - `lat`, `lon`, `approx address`, `accuracy`, `heading`, `updatedAt` formatted as time-only.
  - When the heartbeat updates, the text should visibly change on screen (deterministic jitter achieves this).
- In the same card area, show the `journey.contactDeliveries` as per-contact chips:
  - Contact name, relationship, status badge (`pending` muted, `delivered` HIGH pill, `acknowledged` LOW pill), relative notified-at timestamp, and acknowledged-at when set.

### FR6 — Enhanced evidence log entries

- The existing `EvidenceLog` in journey.tsx must surface the new enriched fields for each snapshot entry:
  - Show `riskLevelAtCapture` + `riskScore` as a combined badge.
  - Show the GPS snapshot (lat, lon, heading, accuracy) row.
  - If `incidentReport` exists, render an inline collapsible **Incident Report** accordion under the entry. The accordion shows the summary, peak/current risk stats, evidence/contacts counts, escalationChain list, and timelineSummary bullets.
  - `contactSnapshot` may be shown as an inline compact line "(N contacts notified at capture)".

## Non-Functional Requirements

### NFR1 — Backwards compatibility
- All existing journey history entries created before this change must still render. Fields that were previously `null`/`undefined` must fall back to the current slim display.
- No changes to public store actions signatures (`startJourney`, `answerSafetyCheck`, etc.).

### NFR2 — No memory leaks
- The GPS heartbeat and contact delivery timers must be cleaned up when:
  - The journey ends/arrives.
  - The component unmounts (for UI-driven timers prefer `useEffect` cleanup).
- Store-level timers prefer refs + explicit `clearTimeout/clearInterval` when journey.id changes or journey.status leaves the active set.

### NFR3 — Deterministic scoring and simulation
- All risk scoring already passes through the risk engine — do not introduce randomness into score calculations. Only GPS jitter and delivery ordering may introduce small pseudo-random/deterministic variations.

### NFR4 — Build + typecheck
- `tsc` via the project's build must pass with no new type errors.
- `vite build` must complete without errors.

## Constraints, Dependencies, Assumptions

- **Constraints**: This is a UI prototype — no network, no real sensors. All "live" behaviour is simulated in state.
- **Dependencies**: Existing `lucide-react` icons, `sonner` toasts, tailwindcss4 + the colour tokens in `styles.css`. No new packages.
- **Assumptions**:
  - Stage 3 HIGH is the threshold. Stage 4 CRITICAL inherits all Stage 3 behaviour plus the existing SOS trigger path.
  - A maximum of 50 evidence entries per journey is acceptable for an in-memory prototype.
  - "Trusted contacts" list is taken from the store `contacts`; only `notificationEnabled` ones are messaged.

## Open Questions

_None at specification time. The four feature behaviours are already confirmed in the user's request._

## Acceptance Criteria

### rule AC1 — Live GPS heartbeat updates the snapshot
**Pass condition**: While a journey is in Stage 3+, opening DevTools + inspecting `useStore` -> `journey.gps` shows `updatedAt` advancing and the GPS values changing within ±0.0003 of the anchor at minimum every 3 seconds for the entire duration Stage 3+ remains active.
**Evidence source**: Manual UI test on the journey page after a deviation escalation path.

### rule AC2 — Trusted contacts receive per-delivery records with staged status
**Pass condition**: On first reaching Stage 3+, `journey.contactDeliveries` contains N entries (N = number of enabled contacts). Within 1.5s each entry transitions `pending → delivered`, and within 6s each transitions `delivered → acknowledged` in the priority order defined by the contact list. On a subsequent Stage 4 timeout the array is not rebuilt from scratch.
**Evidence source**: Manual UI test + React DevTools state inspection; per-contact chips visible on journey card.

### rule AC3 — Every Stage 3+ evidence entry is fully populated
**Pass condition**: After any Stage 3+ check-in transition (entry, check-in yes/no, timeout), the most recent `journey.evidence.entries[last]` has non-null `gpsSnapshot`, non-null `riskLevelAtCapture`, a non-empty `activeIndicatorsAtCapture` array or an empty one consistent with scoring, a non-null `contactSnapshot`, and a non-null `incidentReport` with a string `summary` of length > 40 characters.
**Evidence source**: Manual state inspection after 1) deviation→Stage2→timeout→Stage3 path, 2) Stage3"No"→reassess, 3) Stage3→timeout→Stage4, 4) Stage4"Yes" verification.

### rule AC4 — Continuous Stage 3+ check-in loop (except post-SOS)
**Pass condition**:
- After answering "No" at Stage 3, within 500ms a NEW `pendingCheck` with `stage === 3` and a future `expiresAt` appears on the journey.
- After answering "Yes" at Stage 4, a NEW Stage 4 `pendingCheck` is similarly created.
- After Stage 4 SOS, `pendingCheck` is `null` (emergency mode owns the flow).
- Each transition also appends a new evidence entry (entry count increments by exactly 1 for each handler call).
**Evidence source**: Manual click-through test on the journey page combined with EvidenceLog row counting.

### rule AC5 — Journey card displays Live GPS Tracking panel with updating values
**Pass condition**: When Stage 3+ is active, the journey page shows a visible panel titled "Live GPS Tracking" with a pulsing LIVE indicator and lat/lon/accuracy/heading/updated-at fields. Those field values visually change at least twice within a 5-second observation window.
**Evidence source**: Screenshot or manual UI observation on the running dev server.

### rule AC6 — Evidence log entries show enriched fields + inline incident report
**Pass condition**: Each evidence snapshot in the log now displays (a) a risk level badge + score, (b) GPS row data, and (c) an accordion labelled "Incident Report" that expands to show summary text, peak/current stats, escalation chain items, and timeline bullets. Entries from before this patch gracefully fall back to the previous slim layout.
**Evidence source**: Manual UI observation of both newly-created and restored-from-localStorage evidence rows.

### rubric AC7 — Workflow fidelity
**Dimension**: Does the HIGH stage behave as a cohesive continuous-protection flow from the end-user perspective?
**Scale 0–2 (pass >= 1)**:
- 0: Only flags and toasts exist; no live updating visuals, no contact chips, no full evidence, no continuous re-check.
- 1: Live GPS updates, contacts, and evidence all work, but the Stage 3 "No" path may occasionally leave a stale pending check for more than 2s, or the incident report accordion is present but missing escalation chain data.
- 2: Every aspect works end-to-end. Walking through deviation→escalation→Stage3 HIGH shows the full set of behaviours, and the user can visually watch live GPS tick, contacts delivered→acknowledged, evidence grow, and follow-up checks keep opening until they tap "I've arrived safely".
**Evidence source**: Full walkthrough video/recording or documented checklist of the complete HIGH-stage flow.

### rule AC8 — No build errors
**Pass condition**: `npm run build` runs without errors and emits a production build. TypeScript type checking reports zero errors.
**Evidence source**: CI-style terminal output from `npm run build`.

### rule AC9 — Backwards-compatible history rendering
**Pass condition**: Existing archived journeys (already in `journeyHistory` / localStorage from before this patch) render without exceptions on the `/journey` page "Past journeys" section, even when their evidence entries are missing the new fields.
**Evidence source**: Manual verification against existing demo localStorage or a synthetic history entry with null fields.
