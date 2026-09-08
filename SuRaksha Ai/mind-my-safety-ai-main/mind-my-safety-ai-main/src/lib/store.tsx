import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { DEFAULT_CONTACTS, DEFAULT_PROFILE, DEMO_INCIDENTS } from "./demo-data";
import {
  assessJourneyRisk,
  journeyStageForScore,
  levelFromScore,
  RISK_LEVEL_BANDS,
} from "./risk-engine";
import type {
  EmergencyContact,
  EmergencyEvent,
  EmergencyOptions,
  EscalationEntry,
  EscalationTrigger,
  GpsSnapshot,
  Incident,
  JourneyEvidenceEntry,
  JourneyIncidentReport,
  JourneyStage,
  Profile,
  RiskLevel,
  SafeJourney,
  SafetyCheckIn,
  SafetyCheckPrompt,
  TrustedContactNotifyEntry,
} from "./types";

const KEY = "suraksha-ai-state-v1";

/* ------------------------------------------------------------------ */
/* Safe Journey Mode — pure escalation helpers                         */
/* ------------------------------------------------------------------ */

const CHECK_MS = 15_000;
const JOURNEY_GPS_ANCHOR = { lat: 28.6139, lon: 77.209 };
const JOURNEY_GPS = "28.6139, 77.2090 (approx)";
const HEADINGS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

const nowISO = () => new Date().toISOString();

/* ------------------------------------------------------------------ */
/* Task 1 — pure helpers                                                */
/* ------------------------------------------------------------------ */

function riskLevelForStage(stage: JourneyStage | number | null | undefined): RiskLevel {
  if (!stage || stage <= 0) return "LOW";
  if (stage === 1) return "LOW";
  if (stage === 2) return "MODERATE";
  if (stage === 3) return "HIGH";
  return "CRITICAL";
}

export function nextGpsSnapshot(
  prev: GpsSnapshot | null | undefined,
  tick: number,
): GpsSnapshot {
  const anchor = JOURNEY_GPS_ANCHOR;
  const jitter = tick === 0 ? 0 : (tick % 2 === 0 ? 1 : -1) * 0.0001 * (1 + (tick % 3));
  const lat = (anchor.lat + jitter).toFixed(4);
  const lon = (anchor.lon - jitter * 0.7).toFixed(4);
  const heading = HEADINGS[tick % HEADINGS.length];
  const accuracy = `±${5 + (tick % 10)}m`;
  return {
    lat,
    lon,
    approx: `${lat}, ${lon} (approx)`,
    accuracy,
    heading,
    updatedAt: nowISO(),
  };
}

export function buildContactDeliveryEntries(
  contacts: EmergencyContact[],
): TrustedContactNotifyEntry[] {
  return contacts
    .filter((c) => c.notificationEnabled)
    .sort((a, b) => a.priority - b.priority)
    .map((c) => ({
      contactId: c.id,
      name: c.name,
      relationship: c.relationship,
      phone: c.phone,
      notifiedAt: null,
      acknowledgedAt: null,
      status: "pending" as const,
      deliveryChannel: "both" as const,
    }));
}

export function buildJourneyIncidentReport(j: SafeJourney): JourneyIncidentReport {
  const peakFromEscalation = j.escalationHistory.reduce<{ score: number; level: RiskLevel }>(
    (acc, e) => {
      const level: RiskLevel = e.riskLevel ?? riskLevelForStage(e.toStage);
      const band = RISK_LEVEL_BANDS.find((b) => b.level === level);
      const score = band ? Math.round((band.min + band.max) / 2) : 0;
      if (score > acc.score) return { score, level };
      return acc;
    },
    { score: 0, level: "LOW" as RiskLevel },
  );
  const peakFromEvidence = (j.evidence?.entries ?? []).reduce<{
    score: number;
    level: RiskLevel;
  }>((acc, en) => {
    const s = en.riskScore ?? 0;
    if (s > acc.score) {
      return { score: s, level: en.riskLevelAtCapture ?? levelFromScore(s) };
    }
    return acc;
  }, { score: 0, level: "LOW" as RiskLevel });
  const currentAsScore = j.riskScore ?? peakFromEscalation.score;
  const peak: { score: number; level: RiskLevel } =
    peakFromEvidence.score >= peakFromEscalation.score ? peakFromEvidence : peakFromEscalation;
  if (currentAsScore > peak.score) {
    peak.score = currentAsScore;
    peak.level = j.riskLevel ?? levelFromScore(currentAsScore);
  }

  const seen = new Set<string>();
  const timelineSummary: string[] = [];
  for (let i = j.escalationHistory.length - 1; i >= 0 && timelineSummary.length < 4; i--) {
    const note = j.escalationHistory[i].note;
    if (!seen.has(note)) {
      seen.add(note);
      timelineSummary.push(note);
    }
  }

  const escalationChain = j.escalationHistory.map((e) => ({
    at: e.at,
    from: e.fromStage,
    to: e.toStage,
    trigger: e.trigger,
    risk: e.riskLevel,
    indicators: e.activeIndicators,
    note: e.note,
  }));

  const evidenceCaptured = (j.evidence?.entries.length ?? 0) + 1;
  const contactsNotified = (j.contactDeliveries ?? []).filter((c) =>
    c.status === "delivered" || c.status === "acknowledged",
  ).length;
  const indicatorList = (j.riskIndicators ?? []).map((r) => r.label.toLowerCase());
  const indicatorsClause =
    indicatorList.length > 0 ? ` Active indicators: ${indicatorList.join(", ")}.` : "";

  const summary = `Journey to ${j.destination} reached Stage ${j.stage} (peak ${peak.level} — ${peak.score}/100) with ${evidenceCaptured} evidence snapshot${evidenceCaptured === 1 ? "" : "s"} and ${contactsNotified} contact${contactsNotified === 1 ? "" : "s"} notified.${indicatorsClause}`;

  return {
    id: `JIR-${Date.now()}`,
    generatedAt: nowISO(),
    destination: j.destination,
    journeyStartedAt: j.startedAt,
    stageReached: j.stage,
    peakRiskScore: peak.score,
    peakRiskLevel: peak.level,
    currentRiskScore: j.riskScore,
    currentRiskLevel: j.riskLevel,
    activeIndicators: j.riskIndicators ?? [],
    escalationChain,
    evidenceCaptured,
    contactsNotified,
    summary,
    timelineSummary,
  };
}

type ToastKind = "success" | "error" | "warning" | "message";
interface JourneyEffects {
  toasts: { kind: ToastKind; msg: string }[];
  activateEmergency: boolean;
}
const noEffects = (): JourneyEffects => ({ toasts: [], activateEmergency: false });

interface JourneyTransition {
  journey: SafeJourney;
  effects: JourneyEffects;
}

function scoreJourneyAtStage(j: SafeJourney, stage: JourneyStage) {
  return assessJourneyRisk({
    stage,
    walkingAlone: j.walkingAlone,
    routeDeviation: stage >= 1,
    repeatedStops: j.repeatedStops || stage >= 3,
    missedCheckInCount: j.missedCheckInCount,
  });
}

function lowerJoin(labels: string[]): string {
  return labels.length ? labels.map((s) => s.toLowerCase()).join(", ") : "no specific indicators";
}

function buildIncidentDescription(
  j: SafeJourney,
  indicators: string[],
  trigger: EscalationTrigger,
): string {
  const how = trigger === "timeout" ? "no response" : "user response";
  return `Journey to ${j.destination}: ${lowerJoin(indicators)} — escalated to ${
    j.riskLevel ?? "UNKNOWN"
  } after ${how}.`;
}

/** Push a JourneyEvidenceEntry, initialising the evidence log if needed. */
function appendEvidence(
  j: SafeJourney,
  trigger: EscalationTrigger,
  score: number | null,
  note?: string,
): SafeJourney {
  const startedAt = j.evidence?.startedAt ?? nowISO();
  const entries = j.evidence?.entries ?? [];
  const indicators = (j.riskIndicators ?? []).map((i) => i.label);
  const gpsForLocation = j.gps ?? nextGpsSnapshot(null, 0);
  const entry: JourneyEvidenceEntry = {
    timestamp: nowISO(),
    gpsLocation: j.gps ? j.gps.approx : JOURNEY_GPS,
    gpsSnapshot: j.gps ? { ...j.gps } : { ...gpsForLocation },
    riskLevelAtCapture: j.riskLevel,
    activeIndicatorsAtCapture: j.riskIndicators
      ? (JSON.parse(JSON.stringify(j.riskIndicators)) as typeof j.riskIndicators)
      : null,
    contactSnapshot: j.contactDeliveries
      ? (JSON.parse(JSON.stringify(j.contactDeliveries)) as typeof j.contactDeliveries)
      : [],
    incidentDescription: note ?? buildIncidentDescription(j, indicators, trigger),
    riskScore: score ?? j.riskScore,
    escalationHistorySnapshot: JSON.parse(JSON.stringify(j.escalationHistory)) as EscalationEntry[],
    incidentReport: buildJourneyIncidentReport(j),
  };
  return { ...j, evidence: { startedAt, entries: [...entries, entry] } };
}

function stageNote(
  toStage: JourneyStage,
  trigger: EscalationTrigger,
  indicators: string[],
): string {
  const how =
    trigger === "timeout"
      ? "no response to the safety check"
      : trigger === "user-no"
        ? "the traveller reported they are not safe"
        : trigger === "user-yes"
          ? "the traveller confirmed they are safe"
          : trigger === "deviation"
            ? "an unusual route deviation was detected"
            : "the situation was reassessed";
  return `Stage ${toStage} — ${how}. Active indicators: ${lowerJoin(indicators)}.`;
}

/**
 * Transition the journey into a Stage 1–4: re-score for the target stage,
 * open a fresh 15s safety check, log the escalation, and — from Stage 3 —
 * enable live location / contact notification and record evidence.
 */
function enterStage(
  j: SafeJourney,
  toStage: JourneyStage,
  trigger: EscalationTrigger,
): JourneyTransition {
  const fromStage = j.stage;
  const res = scoreJourneyAtStage(j, toStage);
  const at = nowISO();
  const activeIndicators = res.indicators.map((i) => i.label);

  const pendingCheck: SafetyCheckPrompt = {
    id: `SCK-${Date.now()}`,
    stage: toStage,
    askedAt: at,
    expiresAt: new Date(Date.parse(at) + CHECK_MS).toISOString(),
  };

  const escEntry: EscalationEntry = {
    at,
    fromStage,
    toStage,
    trigger,
    riskLevel: res.level,
    activeIndicators,
    note: stageNote(toStage, trigger, activeIndicators),
  };

  let next: SafeJourney = {
    ...j,
    stage: toStage,
    status: toStage === 1 ? "deviation" : "escalating",
    riskScore: res.score,
    riskLevel: res.level,
    riskFactors: res.factors,
    riskIndicators: res.indicators,
    actions: res.actions,
    pendingCheck,
    escalationHistory: [...j.escalationHistory, escEntry],
  };

  const effects = noEffects();

  // First time we reach Stage 3+: begin live location, contact notification
  // and evidence recording together.
  if (toStage >= 3 && fromStage < 3) {
    next = {
      ...next,
      liveLocationShared: true,
      contactsNotified: true,
      gps: j.gps ?? nextGpsSnapshot(null, 0),
      contactDeliveries: j.contactDeliveries.length ? j.contactDeliveries : [],
    };
    effects.toasts.push(
      { kind: "success", msg: "Live location sharing enabled (simulated)" },
      { kind: "success", msg: "Trusted contacts notified" },
      { kind: "success", msg: "Evidence recording started" },
    );
  } else if (toStage >= 3 && !next.gps) {
    // Safety net: ensure a GPS baseline exists whenever stage >= 3.
    next = { ...next, gps: nextGpsSnapshot(null, 0) };
  }

  // Evidence entry on entering any Stage 3+ (from any trigger).
  if (toStage >= 3) {
    next = appendEvidence(next, trigger, res.score);
  }

  return { journey: next, effects };
}

/** "Yes, I'm safe" → drop back to normal Stage 0 monitoring. */
function returnToSafe(j: SafeJourney, fromStage: JourneyStage): JourneyTransition {
  const escEntry: EscalationEntry = {
    at: nowISO(),
    fromStage,
    toStage: 0,
    trigger: "user-yes",
    riskLevel: null,
    activeIndicators: [],
    note: `Stage ${fromStage} — the traveller confirmed they are safe. Escalation cleared; resuming normal monitoring.`,
  };
  return {
    journey: {
      ...j,
      stage: 0,
      status: "active",
      riskScore: null,
      riskLevel: null,
      riskFactors: null,
      riskIndicators: null,
      actions: [],
      pendingCheck: null,
      escalationHistory: [...j.escalationHistory, escEntry],
    },
    effects: {
      toasts: [{ kind: "success", msg: "Confirmed safe — back to normal monitoring." }],
      activateEmergency: false,
    },
  };
}

/** Stage 3 "No" — re-assess at the same stage, record evidence, and schedule a follow-up check. */
function reassessAtStage3No(j: SafeJourney): JourneyTransition {
  const res = scoreJourneyAtStage(j, 3);
  const activeIndicators = res.indicators.map((i) => i.label);
  const at = nowISO();

  const escEntry: EscalationEntry = {
    at,
    fromStage: 3,
    toStage: 3,
    trigger: "user-no",
    riskLevel: res.level,
    activeIndicators,
    note: stageNote(3, "user-no", activeIndicators) +
      " Continuous monitoring active; follow-up safety check scheduled.",
  };

  const nextCheck: SafetyCheckPrompt = {
    id: `SCK-${Date.now()}-R`,
    stage: 3,
    askedAt: at,
    expiresAt: new Date(Date.parse(at) + CHECK_MS).toISOString(),
  };

  let next: SafeJourney = {
    ...j,
    riskScore: res.score,
    riskLevel: res.level,
    riskFactors: res.factors,
    riskIndicators: res.indicators,
    actions: res.actions,
    pendingCheck: nextCheck,
    escalationHistory: [...j.escalationHistory, escEntry],
  };

  next = appendEvidence(next, "user-no", res.score);

  const effects = noEffects();
  const top = res.actions[0];
  if (top) effects.toasts.push({ kind: "warning", msg: top.title });
  effects.toasts.push({ kind: "message", msg: "Follow-up check scheduled in 15s." });
  return { journey: next, effects };
}

function triggerSosFromStage4(j: SafeJourney, trigger: EscalationTrigger): JourneyTransition {
  const indicators = (j.riskIndicators ?? []).map((i) => i.label);
  const escEntry: EscalationEntry = {
    at: nowISO(),
    fromStage: 4,
    toStage: 4,
    trigger,
    riskLevel: j.riskLevel ?? "CRITICAL",
    activeIndicators: indicators,
    note: `Stage 4 — ${
      trigger === "timeout" ? "no response to verification" : "traveller reported not safe"
    }. SOS alarm triggered and emergency assistance activated.`,
  };
  let next: SafeJourney = {
    ...j,
    status: "escalating",
    pendingCheck: null,
    escalationHistory: [...j.escalationHistory, escEntry],
  };
  next = appendEvidence(
    next,
    trigger,
    j.riskScore,
    `Journey to ${j.destination}: ${lowerJoin(indicators)} — SOS alarm triggered after ${
      trigger === "timeout" ? "no response" : "user response"
    }. Emergency assistance activated.`,
  );
  return {
    journey: next,
    effects: {
      toasts: [{ kind: "error", msg: "SOS alarm triggered (simulated)" }],
      activateEmergency: true,
    },
  };
}

function handleSafetyCheckYes(j: SafeJourney, stage: JourneyStage): JourneyTransition {
  if (stage === 4) {
    const indicators = (j.riskIndicators ?? []).map((i) => i.label);
    const at = nowISO();
    const escEntry: EscalationEntry = {
      at,
      fromStage: 4,
      toStage: 4,
      trigger: "user-yes",
      riskLevel: j.riskLevel,
      activeIndicators: indicators,
      note:
        "Stage 4 — traveller confirmed safe during verification. Heightened continuous monitoring remains active; next verification scheduled.",
    };
    const nextCheck: SafetyCheckPrompt = {
      id: `SCK-${Date.now()}-V`,
      stage: 4,
      askedAt: at,
      expiresAt: new Date(Date.parse(at) + CHECK_MS).toISOString(),
    };
    let next: SafeJourney = {
      ...j,
      pendingCheck: nextCheck,
      escalationHistory: [...j.escalationHistory, escEntry],
    };
    next = appendEvidence(
      next,
      "user-yes",
      j.riskScore,
      `Journey to ${j.destination}: traveller confirmed safe during Stage 4 verification. Continuous monitoring remains active; next verification scheduled in 15s.`,
    );
    return {
      journey: next,
      effects: {
        toasts: [
          {
            kind: "success",
            msg: "Confirmation logged — monitoring stays active until you end the journey. Next verification in 15s.",
          },
        ],
        activateEmergency: false,
      },
    };
  }
  return returnToSafe(j, stage);
}

function handleSafetyCheckNo(j: SafeJourney, stage: JourneyStage): JourneyTransition {
  if (stage === 4) return triggerSosFromStage4(j, "user-no");
  if (stage === 3) return reassessAtStage3No(j);

  let targetStage: JourneyStage;
  if (stage === 1) {
    const raw = scoreJourneyAtStage(j, 1).rawScore;
    const jumped = journeyStageForScore(raw);
    targetStage = (jumped > 2 ? jumped : 2) as JourneyStage;
  } else {
    targetStage = 3;
  }

  const { journey, effects } = enterStage(j, targetStage, "user-no");
  const top = journey.actions[0];
  if (top) effects.toasts.push({ kind: "warning", msg: top.title });
  return { journey, effects };
}

function handleSafetyCheckTimeoutTransition(j: SafeJourney): JourneyTransition {
  const stage = j.pendingCheck?.stage ?? j.stage;
  // A missed check-in always counts first.
  const bumped: SafeJourney = { ...j, missedCheckInCount: j.missedCheckInCount + 1 };

  if (stage === 4) return triggerSosFromStage4(bumped, "timeout");

  const targetStage = (stage + 1) as JourneyStage;
  return enterStage(bumped, targetStage, "timeout");
}

/* ------------------------------------------------------------------ */

interface State {
  profile: Profile;
  contacts: EmergencyContact[];
  incidents: Incident[];
  emergency: EmergencyEvent | null;
  emergencyHistory: EmergencyEvent[];
  checkIn: SafetyCheckIn | null;
  emergencyOptions: EmergencyOptions;
  journey: SafeJourney | null;
  journeyHistory: SafeJourney[];
}

const initialState: State = {
  profile: DEFAULT_PROFILE,
  contacts: DEFAULT_CONTACTS,
  incidents: DEMO_INCIDENTS,
  emergency: null,
  emergencyHistory: [],
  checkIn: null,
  emergencyOptions: {
    notifyContacts: true,
    shareLocation: true,
    sendIncident: true,
    sendRisk: true,
    service: "emergency-services",
  },
  journey: null,
  journeyHistory: [],
};

interface StoreValue extends State {
  setProfile: (p: Partial<Profile>) => void;
  addContact: (c: Omit<EmergencyContact, "id">) => void;
  updateContact: (id: string, c: Partial<EmergencyContact>) => void;
  removeContact: (id: string) => void;
  addIncident: (i: Incident) => void;
  updateIncident: (id: string, patch: Partial<Incident>) => void;
  removeIncident: (id: string) => void;
  clearHistory: () => void;
  setEmergencyOptions: (o: Partial<EmergencyOptions>) => void;
  activateEmergency: (incidentId: string | null) => EmergencyEvent;
  endEmergency: () => void;
  startCheckIn: (minutes: number, contactId: string | null, label: string) => void;
  resolveCheckIn: (status: SafetyCheckIn["status"]) => void;
  startJourney: (destination: string, etaMinutes: number, walkingAlone: boolean) => void;
  simulateDeviation: () => void;
  simulateRepeatedStops: () => void;
  answerSafetyCheck: (answer: "yes" | "no") => void;
  handleSafetyCheckTimeout: () => void;
  arriveJourney: () => void;
  endJourney: () => void;
  appendEvidenceEntry: (note?: string) => void;
  resetDemo: () => void;
  hydrated: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initialState, ...(JSON.parse(raw) as State) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  // Safety check-in expiry watcher
  useEffect(() => {
    if (!state.checkIn || state.checkIn.status !== "active") return;
    const tick = () => {
      setState((s) => {
        if (!s.checkIn || s.checkIn.status !== "active") return s;
        if (Date.now() >= new Date(s.checkIn.expiryTime).getTime()) {
          return { ...s, checkIn: { ...s.checkIn, status: "missed" } };
        }
        return s;
      });
    };
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [state.checkIn]);

  const patch = useCallback((fn: (s: State) => State) => setState(fn), []);

  const deliveryTimerRefs = useRef<number[]>([]);
  const gpsTickRef = useRef(0);
  const gpsIntervalRef = useRef<number | null>(null);

  const value = useMemo<StoreValue>(() => {
    const activateEmergency = (incidentId: string | null): EmergencyEvent => {
      const now = new Date();
      const t = (offset: number) =>
        new Date(now.getTime() + offset * 1000).toLocaleTimeString("en-GB", { hour12: false });
      const event: EmergencyEvent = {
        id: `EMG-${now.getTime()}`,
        incidentId,
        activatedAt: now.toISOString(),
        locationStatus: "Sharing Active",
        contactNotificationStatus: "Notification Sent",
        emergencyStatus: "active",
        options: state.emergencyOptions,
        timeline: [
          { time: t(0), label: "Emergency mode activated" },
          { time: t(1), label: "Emergency contact notification initiated" },
          { time: t(2), label: "Location sharing enabled" },
          { time: t(3), label: "Incident information prepared" },
          { time: t(4), label: "Assistance workflow initiated" },
        ],
      };
      patch((s) => ({
        ...s,
        emergency: event,
        incidents: incidentId
          ? s.incidents.map((i) =>
              i.id === incidentId ? { ...i, status: "Emergency Assistance Activated" } : i,
            )
          : s.incidents,
      }));
      return event;
    };

    const runEffects = (effects: JourneyEffects) => {
      for (const tst of effects.toasts) {
        if (tst.kind === "success") toast.success(tst.msg);
        else if (tst.kind === "error") toast.error(tst.msg);
        else if (tst.kind === "warning") toast.warning(tst.msg);
        else toast(tst.msg);
      }
      if (effects.activateEmergency) activateEmergency(null);
    };

    const applyJourneyTransition = (result: JourneyTransition) => {
      const prevStage = state.journey?.stage ?? 0;
      const nextStage = result.journey.stage;
      const enteringHigh = nextStage >= 3 && prevStage < 3;
      const populated =
        enteringHigh && (result.journey.contactDeliveries.length === 0);
      let journeyToPatch = result.journey;
      if (enteringHigh && populated) {
        const initial = buildContactDeliveryEntries(state.contacts);
        journeyToPatch = { ...journeyToPatch, contactDeliveries: initial };
      }
      patch((s) =>
        s.journey ? { ...s, journey: journeyToPatch } : s,
      );
      runEffects(result.effects);

      if (enteringHigh) {
        const deliveries = buildContactDeliveryEntries(state.contacts);
        deliveries.forEach((entry) => {
          const priority = Math.max(
            1,
            state.contacts.find((c) => c.id === entry.contactId)?.priority ?? 1,
          );
          const deliveredAt = 1500 * priority;
          const acknowledgedAt = deliveredAt + 4000;
          const t1 = window.setTimeout(() => {
            patch((s) => {
              if (!s.journey) return s;
              const updated = s.journey.contactDeliveries.map((c) =>
                c.contactId === entry.contactId
                  ? { ...c, status: "delivered" as const, notifiedAt: nowISO() }
                  : c,
              );
              return { ...s, journey: { ...s.journey, contactDeliveries: updated } };
            });
          }, deliveredAt);
          const t2 = window.setTimeout(() => {
            patch((s) => {
              if (!s.journey) return s;
              const updated = s.journey.contactDeliveries.map((c) =>
                c.contactId === entry.contactId
                  ? { ...c, status: "acknowledged" as const, acknowledgedAt: nowISO() }
                  : c,
              );
              return { ...s, journey: { ...s.journey, contactDeliveries: updated } };
            });
          }, acknowledgedAt);
          deliveryTimerRefs.current.push(t1, t2);
        });
      }
    };

    return {
      ...state,
      hydrated,
      setProfile: (p) => patch((s) => ({ ...s, profile: { ...s.profile, ...p } })),
      addContact: (c) =>
        patch((s) => ({ ...s, contacts: [...s.contacts, { ...c, id: `c${Date.now()}` }] })),
      updateContact: (id, c) =>
        patch((s) => ({
          ...s,
          contacts: s.contacts.map((x) => (x.id === id ? { ...x, ...c } : x)),
        })),
      removeContact: (id) =>
        patch((s) => ({ ...s, contacts: s.contacts.filter((x) => x.id !== id) })),
      addIncident: (i) => patch((s) => ({ ...s, incidents: [i, ...s.incidents] })),
      updateIncident: (id, p) =>
        patch((s) => ({
          ...s,
          incidents: s.incidents.map((x) => (x.id === id ? { ...x, ...p } : x)),
        })),
      removeIncident: (id) =>
        patch((s) => ({ ...s, incidents: s.incidents.filter((x) => x.id !== id) })),
      clearHistory: () => patch((s) => ({ ...s, incidents: [] })),
      setEmergencyOptions: (o) =>
        patch((s) => ({ ...s, emergencyOptions: { ...s.emergencyOptions, ...o } })),
      activateEmergency,
      endEmergency: () =>
        patch((s) => ({
          ...s,
          emergency: null,
          emergencyHistory: s.emergency
            ? [{ ...s.emergency, emergencyStatus: "ended" }, ...s.emergencyHistory]
            : s.emergencyHistory,
        })),
      startCheckIn: (minutes, contactId, label) =>
        patch((s) => ({
          ...s,
          checkIn: {
            id: `CHK-${Date.now()}`,
            label,
            startTime: new Date().toISOString(),
            expiryTime: new Date(Date.now() + minutes * 60000).toISOString(),
            status: "active",
            contactId,
          },
        })),
      resolveCheckIn: (status) =>
        patch((s) => ({ ...s, checkIn: s.checkIn ? { ...s.checkIn, status } : null })),

      /* ---------------- Safe Journey Mode ---------------- */
      startJourney: (destination, etaMinutes, walkingAlone) =>
        patch((s) => ({
          ...s,
          journey: {
            id: `SJ-${Date.now()}`,
            destination,
            startedAt: nowISO(),
            eta: new Date(Date.now() + Math.max(1, Math.round(etaMinutes)) * 60_000).toISOString(),
            status: "active",
            stage: 0,
            walkingAlone,
            repeatedStops: false,
            missedCheckInCount: 0,
            riskLevel: null,
            riskScore: null,
            riskFactors: null,
            riskIndicators: null,
            actions: [],
            liveLocationShared: false,
            contactsNotified: false,
            gps: null,
            contactDeliveries: [],
            evidence: null,
            escalationHistory: [],
            pendingCheck: null,
          },
        })),

      simulateDeviation: () => {
        const j = state.journey;
        if (!j || j.status !== "active" || j.stage !== 0) return;
        applyJourneyTransition(enterStage(j, 1, "deviation"));
      },

      simulateRepeatedStops: () => {
        const j = state.journey;
        if (!j) return;
        let next: SafeJourney = { ...j, repeatedStops: true };
        if (j.stage >= 1 && j.status !== "arrived" && j.status !== "ended") {
          const res = scoreJourneyAtStage(next, j.stage);
          next = {
            ...next,
            riskScore: res.score,
            riskLevel: res.level,
            riskFactors: res.factors,
            riskIndicators: res.indicators,
            actions: res.actions,
          };
        }
        patch((s) => (s.journey ? { ...s, journey: next } : s));
      },

      answerSafetyCheck: (answer) => {
        const j = state.journey;
        if (!j || !j.pendingCheck) return;
        const stage = j.pendingCheck.stage;
        applyJourneyTransition(
          answer === "yes" ? handleSafetyCheckYes(j, stage) : handleSafetyCheckNo(j, stage),
        );
      },

      handleSafetyCheckTimeout: () => {
        const j = state.journey;
        if (!j || !j.pendingCheck) return;
        applyJourneyTransition(handleSafetyCheckTimeoutTransition(j));
      },

      arriveJourney: () =>
        patch((s) => {
          if (!s.journey) return s;
          const done: SafeJourney = {
            ...s.journey,
            status: "arrived",
            stage: 0,
            pendingCheck: null,
          };
          return { ...s, journey: null, journeyHistory: [done, ...s.journeyHistory] };
        }),

      endJourney: () =>
        patch((s) => {
          if (!s.journey) return s;
          const done: SafeJourney = { ...s.journey, status: "ended", pendingCheck: null };
          return { ...s, journey: null, journeyHistory: [done, ...s.journeyHistory] };
        }),

      appendEvidenceEntry: (note) =>
        patch((s) =>
          s.journey
            ? {
                ...s,
                journey: appendEvidence(s.journey, "reassessment", s.journey.riskScore, note),
              }
            : s,
        ),

      resetDemo: () => setState(initialState),
    };
  }, [state, hydrated, patch]);

  // Keep the latest timer-driven handlers without re-subscribing intervals
  // on every render.
  const timeoutHandlerRef = useRef(value.handleSafetyCheckTimeout);
  timeoutHandlerRef.current = value.handleSafetyCheckTimeout;
  const deviationHandlerRef = useRef(value.simulateDeviation);
  deviationHandlerRef.current = value.simulateDeviation;

  // Safety-check countdown: resolve an expired pendingCheck as "no response"
  // exactly once. Also re-evaluates an already-expired pendingCheck restored
  // from storage.
  useEffect(() => {
    if (!hydrated) return;
    const pc = state.journey?.pendingCheck ?? null;
    if (!pc) return;
    let done = false;
    const check = () => {
      if (done) return;
      if (Date.now() >= Date.parse(pc.expiresAt)) {
        done = true;
        timeoutHandlerRef.current();
      }
    };
    check();
    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, [state.journey?.pendingCheck?.id, state.journey?.pendingCheck?.expiresAt, hydrated]);

  // ETA watcher: while monitoring normally, an elapsed ETA triggers the
  // same path as a simulated route deviation (once).
  useEffect(() => {
    if (!hydrated) return;
    const j = state.journey;
    if (!j || j.status !== "active" || j.stage !== 0) return;
    const eta = j.eta;
    let done = false;
    const check = () => {
      if (done) return;
      if (Date.now() >= Date.parse(eta)) {
        done = true;
        deviationHandlerRef.current();
      }
    };
    check();
    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, [
    state.journey?.id,
    state.journey?.status,
    state.journey?.stage,
    state.journey?.eta,
    hydrated,
  ]);

  // Live GPS heartbeat: while stage >= 3 OR liveLocationShared, tick every 2s.
  useEffect(() => {
    if (!hydrated) return;
    const j = state.journey;
    const activeStatus =
      j?.status === "active" || j?.status === "deviation" || j?.status === "escalating";
    const shouldRun = j && activeStatus && (j.stage >= 3 || j.liveLocationShared);
    if (!shouldRun) {
      if (gpsIntervalRef.current !== null) {
        window.clearInterval(gpsIntervalRef.current);
        gpsIntervalRef.current = null;
      }
      return;
    }
    if (gpsIntervalRef.current !== null) return;
    gpsIntervalRef.current = window.setInterval(() => {
      gpsTickRef.current += 1;
      const tick = gpsTickRef.current;
      patch((s) => {
        if (!s.journey) return s;
        const stillActive =
          s.journey.status === "active" ||
          s.journey.status === "deviation" ||
          s.journey.status === "escalating";
        if (!stillActive) return s;
        return {
          ...s,
          journey: { ...s.journey, gps: nextGpsSnapshot(s.journey.gps, tick) },
        };
      });
    }, 2000);
    return () => {
      if (gpsIntervalRef.current !== null) {
        window.clearInterval(gpsIntervalRef.current);
        gpsIntervalRef.current = null;
      }
    };
  }, [
    state.journey?.id,
    state.journey?.status,
    state.journey?.stage,
    state.journey?.liveLocationShared,
    hydrated,
    patch,
  ]);

  // Reset GPS tick + clear delivery timers whenever a new journey starts or ends.
  useEffect(() => {
    gpsTickRef.current = 0;
    return () => {
      deliveryTimerRefs.current.forEach((id) => window.clearTimeout(id));
      deliveryTimerRefs.current = [];
      if (gpsIntervalRef.current !== null) {
        window.clearInterval(gpsIntervalRef.current);
        gpsIntervalRef.current = null;
      }
    };
  }, [state.journey?.id]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
