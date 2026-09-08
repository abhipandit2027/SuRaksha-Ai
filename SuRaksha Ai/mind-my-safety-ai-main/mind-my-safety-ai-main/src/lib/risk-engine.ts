import type {
  ActionItem,
  Assessment,
  AssessmentAnswers,
  EvidenceItem,
  IncidentCategory,
  JourneyStage,
  RiskFactorScore,
  RiskIndicatorItem,
  RiskLevel,
} from "./types";

/**
 * Deterministic risk engine.
 * All weights live here so scoring can be tuned in a single place.
 */
export const RISK_WEIGHTS = {
  threatSeverity: 30,
  immediacy: 20,
  repetition: 10,
  blackmail: 15,
  imageAbuse: 10,
  vulnerability: 10,
  distress: 5,
} as const;

export const RISK_LEVEL_BANDS: { level: RiskLevel; min: number; max: number }[] = [
  { level: "LOW", min: 0, max: 25 },
  { level: "MODERATE", min: 26, max: 50 },
  { level: "HIGH", min: 51, max: 75 },
  { level: "CRITICAL", min: 76, max: 100 },
];

export function levelFromScore(score: number): RiskLevel {
  return RISK_LEVEL_BANDS.find((b) => score >= b.min && score <= b.max)?.level ?? "LOW";
}

export const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  "online-harassment": "Online Harassment",
  deepfake: "Deepfake / Manipulated Image",
  cyberbullying: "Cyberbullying",
  blackmail: "Blackmail",
  stalking: "Stalking",
  "physical-threat": "Physical Threat",
  "sexual-harassment": "Sexual Harassment",
  other: "Something Else",
};

const KEYWORDS = {
  threat: ["threat", "threaten", "kill", "hurt", "harm", "attack", "beat", "revenge", "warn"],
  blackmail: ["blackmail", "extort", "unless", "comply", "demand", "money", "ransom", "or else"],
  imageAbuse: [
    "photo",
    "image",
    "picture",
    "deepfake",
    "fake image",
    "morphed",
    "video",
    "nude",
    "screenshot of me",
  ],
  stalking: ["follow", "following", "stalk", "watching", "outside my", "waiting near", "tracking"],
  immediacy: [
    "right now",
    "outside",
    "following me",
    "near me",
    "tonight",
    "coming",
    "scared",
    "immediately",
  ],
  repetition: [
    "again",
    "repeatedly",
    "every day",
    "keeps",
    "constantly",
    "multiple times",
    "since",
  ],
  distress: ["scared", "afraid", "terrified", "panic", "anxious", "unsafe", "helpless", "crying"],
  spread: ["sent it", "shared", "posted", "publish", "public", "class group", "everyone"],
  sexual: ["sexual", "nude", "inappropriate", "touch", "molest", "obscene"],
};

function hits(text: string, list: string[]) {
  const t = text.toLowerCase();
  return list.filter((k) => t.includes(k)).length;
}

const CATEGORY_BASE: Record<
  IncidentCategory,
  Partial<Record<keyof typeof RISK_WEIGHTS, number>>
> = {
  "online-harassment": { threatSeverity: 12, repetition: 4, vulnerability: 4 },
  deepfake: { threatSeverity: 16, immediacy: 3, imageAbuse: 8, vulnerability: 5 },
  cyberbullying: { threatSeverity: 13, repetition: 5, vulnerability: 6 },
  blackmail: { threatSeverity: 18, blackmail: 11, vulnerability: 5 },
  stalking: { threatSeverity: 15, immediacy: 8, vulnerability: 5 },
  "physical-threat": { threatSeverity: 20, immediacy: 12, vulnerability: 5 },
  "sexual-harassment": { threatSeverity: 18, vulnerability: 6 },
  other: { threatSeverity: 8, vulnerability: 3 },
};

const clamp = (v: number, max: number) => Math.max(0, Math.min(Math.round(v), max));

export interface RiskEngineInput {
  category: IncidentCategory;
  description: string;
  answers: AssessmentAnswers;
  evidence: EvidenceItem[];
  ageCategory?: "adult" | "teen" | "child";
}

const tri = (v: unknown, yes: number, unsure: number) =>
  v === "yes" ? yes : v === "unsure" ? unsure : 0;

export function assessRisk(input: RiskEngineInput): Assessment {
  const { category, description, answers, evidence } = input;
  const base = CATEGORY_BASE[category] ?? {};
  const text = description ?? "";

  let threat =
    (base.threatSeverity ?? 0) + hits(text, KEYWORDS.threat) * 4 + hits(text, KEYWORDS.sexual) * 3;
  threat += tri(answers.threatened, 6, 2) + tri(answers.physicalHarm, 6, 2);
  threat = clamp(threat, RISK_WEIGHTS.threatSeverity);

  let immediacy = (base.immediacy ?? 0) + hits(text, KEYWORDS.immediacy) * 4;
  immediacy += tri(answers.escalating, 7, 3) + tri(answers.physicalHarm, 5, 2);
  immediacy = clamp(immediacy, RISK_WEIGHTS.immediacy);

  let repetition = (base.repetition ?? 0) + hits(text, KEYWORDS.repetition) * 3;
  repetition += tri(answers.repeated, 6, 2);
  repetition = clamp(repetition, RISK_WEIGHTS.repetition);

  let blackmail = (base.blackmail ?? 0) + hits(text, KEYWORDS.blackmail) * 6;
  // A deepfake combined with an "unless you comply" condition is a coercive
  // image-abuse pattern, even when the user does not use the word blackmail.
  if (
    category === "deepfake" &&
    hits(text, KEYWORDS.blackmail) > 0 &&
    hits(text, KEYWORDS.imageAbuse) > 0
  ) {
    blackmail += 9;
  }
  blackmail = clamp(blackmail, RISK_WEIGHTS.blackmail);

  let imageAbuse =
    (base.imageAbuse ?? 0) + hits(text, KEYWORDS.imageAbuse) * 3 + hits(text, KEYWORDS.spread) * 2;
  imageAbuse = clamp(imageAbuse, RISK_WEIGHTS.imageAbuse);

  let vulnerability = (base.vulnerability ?? 0) + (input.ageCategory === "adult" ? 0 : 4);
  vulnerability += evidence.length > 0 ? 1 : 0;
  vulnerability = clamp(vulnerability, RISK_WEIGHTS.vulnerability);

  const distress = clamp(
    hits(text, KEYWORDS.distress) * 2 + tri(answers.escalating, 2, 1),
    RISK_WEIGHTS.distress,
  );

  const factors: RiskFactorScore[] = [
    {
      key: "threatSeverity",
      label: "Threat Severity",
      score: threat,
      max: RISK_WEIGHTS.threatSeverity,
      note: "Severity of threats or coercive language described.",
    },
    {
      key: "immediacy",
      label: "Immediacy",
      score: immediacy,
      max: RISK_WEIGHTS.immediacy,
      note: "How close the danger appears to be in time or proximity.",
    },
    {
      key: "repetition",
      label: "Repetition",
      score: repetition,
      max: RISK_WEIGHTS.repetition,
      note: "Whether the behaviour is ongoing or has recurred.",
    },
    {
      key: "blackmail",
      label: "Blackmail / Coercion",
      score: blackmail,
      max: RISK_WEIGHTS.blackmail,
      note: "Presence of demands, extortion or coercive conditions.",
    },
    {
      key: "imageAbuse",
      label: "Image Abuse",
      score: imageAbuse,
      max: RISK_WEIGHTS.imageAbuse,
      note: "Manipulated, intimate or non-consensual imagery involved.",
    },
    {
      key: "vulnerability",
      label: "Vulnerability / Context",
      score: vulnerability,
      max: RISK_WEIGHTS.vulnerability,
      note: "Contextual factors such as age category and support access.",
    },
    {
      key: "distress",
      label: "User-reported distress",
      score: distress,
      max: RISK_WEIGHTS.distress,
      note: "Distress the user explicitly reported. Self-reported, not measured.",
    },
  ];

  const score = clamp(
    factors.reduce((s, f) => s + f.score, 0),
    100,
  );
  const level = levelFromScore(score);

  const indicators: RiskIndicatorItem[] = [];
  const push = (label: string, value: number, max: number) => {
    if (value <= 0) return;
    const ratio = value / max;
    indicators.push({ label, severity: ratio >= 0.66 ? "High" : ratio >= 0.33 ? "Medium" : "Low" });
  };
  push("Threatening language", threat, RISK_WEIGHTS.threatSeverity);
  push("Blackmail / coercion", blackmail, RISK_WEIGHTS.blackmail);
  push("Image-based abuse", imageAbuse, RISK_WEIGHTS.imageAbuse);
  push("Repeated harassment", repetition, RISK_WEIGHTS.repetition);
  push("Immediate physical risk", immediacy, RISK_WEIGHTS.immediacy);
  if (hits(text, KEYWORDS.stalking) > 0)
    indicators.push({ label: "Stalking behaviour", severity: "High" });
  if (distress > 0)
    indicators.push({ label: "User-reported fear", severity: distress >= 4 ? "High" : "Medium" });

  const confidence: Assessment["confidence"] =
    text.trim().split(/\s+/).filter(Boolean).length < 6 && !answers.threatened ? "low" : "high";

  const topFactors = [...factors].sort((a, b) => b.score / b.max - a.score / a.max).slice(0, 3);
  const why = `The reported situation contains ${indicators.length} safety indicator${
    indicators.length === 1 ? "" : "s"
  }, most significantly ${topFactors.map((f) => f.label.toLowerCase()).join(", ")}. The score is produced by a transparent rule-based engine using these weighted factors.`;

  const summary = `${CATEGORY_LABELS[category]} reported by the user${
    evidence.length ? ` with ${evidence.length} evidence item(s) attached` : ""
  }. Assessed risk ${score}/100 (${level}). ${
    level === "CRITICAL"
      ? "Immediate assistance may be appropriate."
      : level === "HIGH"
        ? "Prompt protective action is recommended."
        : level === "MODERATE"
          ? "Monitor the situation and preserve evidence."
          : "No urgent escalation indicated at this time."
  }`;

  return {
    score,
    level,
    factors,
    indicators,
    summary,
    why,
    actions: buildActions(level, category),
    escalation:
      level === "CRITICAL"
        ? "Immediate assistance may be appropriate. Emergency escalation is recommended and remains under your control."
        : level === "HIGH"
          ? "Consider informing a trusted person and preparing an official report. Emergency options remain available."
          : level === "MODERATE"
            ? "Escalation is not indicated right now. Keep documenting and re-assess if anything changes."
            : "No escalation indicated. Safety resources remain available.",
    confidence,
  };
}

function buildActions(level: RiskLevel, category: IncidentCategory): ActionItem[] {
  const actions: ActionItem[] = [
    {
      id: "preserve",
      title: "Preserve Evidence",
      description: "Save screenshots, URLs, messages and timestamps before anything is deleted.",
      priority: 1,
      kind: "evidence",
    },
    {
      id: "no-engage",
      title: "Avoid Further Engagement",
      description:
        "Do not respond to threats or coercion. Responding often increases pressure and demands.",
      priority: 2,
      kind: "engagement",
    },
    {
      id: "report-content",
      title: "Report the Account / Content",
      description:
        "Use the in-platform reporting option for the account, message or content involved.",
      priority: 3,
      kind: "report",
    },
    {
      id: "trusted",
      title: "Inform a Trusted Person",
      description:
        "Tell a parent, guardian, teacher or trusted friend so you are not handling this alone.",
      priority: 4,
      kind: "contact",
    },
    {
      id: "assistance",
      title: "Seek Appropriate Assistance",
      description:
        "Options include cybercrime reporting, women safety assistance, a trusted guardian, or local authorities where appropriate.",
      priority: 5,
      kind: "assistance",
    },
  ];

  if (category === "deepfake") {
    actions.splice(3, 0, {
      id: "takedown",
      title: "Request Content Takedown",
      description: "Submit a takedown request to the platform hosting the manipulated content.",
      priority: 4,
      kind: "report",
    });
  }
  if (level === "CRITICAL") {
    actions.unshift({
      id: "emergency",
      title: "Consider Emergency Assistance",
      description:
        "If you are in immediate danger, contact emergency services now. You stay in control of this step.",
      priority: 0,
      kind: "assistance",
    });
  }
  return actions.map((a, i) => ({ ...a, priority: i + 1 }));
}

export const LEVEL_STYLES: Record<
  RiskLevel,
  { text: string; bg: string; ring: string; dot: string; label: string }
> = {
  LOW: {
    text: "text-low",
    bg: "bg-low-soft",
    ring: "stroke-low",
    dot: "bg-low",
    label: "LOW RISK",
  },
  MODERATE: {
    text: "text-moderate-foreground",
    bg: "bg-moderate-soft",
    ring: "stroke-moderate",
    dot: "bg-moderate",
    label: "MODERATE RISK",
  },
  HIGH: {
    text: "text-high",
    bg: "bg-high-soft",
    ring: "stroke-high",
    dot: "bg-high",
    label: "HIGH RISK",
  },
  CRITICAL: {
    text: "text-critical",
    bg: "bg-critical-soft",
    ring: "stroke-critical",
    dot: "bg-critical",
    label: "CRITICAL RISK",
  },
};

/* ------------------------------------------------------------------ */
/* Safe Journey Mode — deterministic journey risk scoring              */
/* ------------------------------------------------------------------ */

/**
 * Journey risk is assessed from exactly four indicators.
 * All weights live here so scoring can be tuned in a single place.
 */
export const JOURNEY_RISK_WEIGHTS = {
  walkingAlone: 10,
  routeDeviation: 20,
  repeatedStops: 20,
  missedCheckIns: 30,
} as const;

export interface JourneyRiskInput {
  stage: JourneyStage;
  walkingAlone: boolean;
  routeDeviation: boolean;
  repeatedStops: boolean;
  missedCheckInCount: number;
}

export interface JourneyRiskResult {
  /** Score clamped into the current stage's band. */
  score: number;
  /** Unclamped weighted sum (0–100), used for stage-jump decisions. */
  rawScore: number;
  level: RiskLevel;
  /** One entry per indicator, including inactive ones with score 0. */
  factors: RiskFactorScore[];
  /** Active indicators only. */
  indicators: RiskIndicatorItem[];
  actions: ActionItem[];
}

const JOURNEY_INDICATOR_LABELS = {
  walkingAlone: "Walking alone",
  routeDeviation: "Unusual route deviation",
  repeatedStops: "Repeatedly stopping",
  missedCheckIns: "Missed safety check-ins",
} as const;

/** 0–25 → 1, 26–50 → 2, 51–75 → 3, 76–100 → 4. */
export function journeyStageForScore(score: number): JourneyStage {
  if (score <= 25) return 1;
  if (score <= 50) return 2;
  if (score <= 75) return 3;
  return 4;
}

/** Journey-specific recommended actions, escalating by risk level. */
export function buildJourneyActions(level: RiskLevel): ActionItem[] {
  const low: Omit<ActionItem, "priority">[] = [
    {
      id: "j-lit-roads",
      title: "Stay on well-lit main roads",
      description:
        "Keep to busy, well-lit streets and avoid shortcuts through isolated or unfamiliar areas.",
      kind: "engagement",
    },
    {
      id: "j-message-contact",
      title: "Message a trusted contact your location",
      description:
        "Send a quick message telling someone where you are and when you expect to arrive.",
      kind: "contact",
    },
  ];
  const moderate: Omit<ActionItem, "priority">[] = [
    {
      id: "j-call-contact",
      title: "Call a trusted contact now",
      description: "Stay on a call with someone you trust until you reach somewhere safe.",
      kind: "contact",
    },
    {
      id: "j-populated-area",
      title: "Move toward a populated, open area",
      description: "Head for a shop, station or other place with people around and good lighting.",
      kind: "engagement",
    },
  ];
  const high: Omit<ActionItem, "priority">[] = [
    {
      id: "j-live-location",
      title: "Share your live location",
      description:
        "Turn on live location sharing so your trusted contacts can follow your movement.",
      kind: "contact",
    },
    {
      id: "j-phone-ready",
      title: "Keep your phone unlocked and in hand",
      description:
        "Be ready to call for help instantly without unlocking or searching for your phone.",
      kind: "assistance",
    },
  ];
  const critical: Omit<ActionItem, "priority">[] = [
    {
      id: "j-sos",
      title: "Trigger the SOS alarm",
      description:
        "Activate the SOS alarm to alert people nearby and notify your contacts at once.",
      kind: "assistance",
    },
    {
      id: "j-call-112",
      title: "Call emergency services (112)",
      description:
        "If you are in immediate danger, call 112 now. You stay in control of this step.",
      kind: "assistance",
    },
  ];

  let chosen: Omit<ActionItem, "priority">[];
  switch (level) {
    case "LOW":
      chosen = low;
      break;
    case "MODERATE":
      chosen = [...moderate, ...low];
      break;
    case "HIGH":
      chosen = [...high, ...moderate];
      break;
    case "CRITICAL":
      chosen = [...critical, ...high];
      break;
  }
  return chosen.map((a, i) => ({ ...a, priority: i + 1 }));
}

export function assessJourneyRisk(input: JourneyRiskInput): JourneyRiskResult {
  const W = JOURNEY_RISK_WEIGHTS;
  const cappedMissed = Math.min(Math.max(Math.floor(input.missedCheckInCount), 0), 3);

  const pWalking = input.walkingAlone ? W.walkingAlone : 0;
  const pDeviation = input.routeDeviation ? W.routeDeviation : 0;
  const pStops = input.repeatedStops ? W.repeatedStops : 0;
  const pMissed = 10 * cappedMissed;

  const rawScore = Math.max(0, Math.min(pWalking + pDeviation + pStops + pMissed, 100));

  const band = RISK_LEVEL_BANDS[input.stage - 1];
  const lo = band?.min ?? 0;
  const hi = band?.max ?? 100;
  const score = input.stage <= 0 ? rawScore : Math.max(lo, Math.min(rawScore, hi));
  const level = levelFromScore(score);

  const factors: RiskFactorScore[] = [
    {
      key: "walkingAlone",
      label: JOURNEY_INDICATOR_LABELS.walkingAlone,
      score: pWalking,
      max: W.walkingAlone,
      note: input.walkingAlone
        ? "Travelling alone with no companion on this journey."
        : "Travelling with a companion.",
    },
    {
      key: "routeDeviation",
      label: JOURNEY_INDICATOR_LABELS.routeDeviation,
      score: pDeviation,
      max: W.routeDeviation,
      note: input.routeDeviation
        ? "Route deviation from the expected path."
        : "On the expected route.",
    },
    {
      key: "repeatedStops",
      label: JOURNEY_INDICATOR_LABELS.repeatedStops,
      score: pStops,
      max: W.repeatedStops,
      note: input.repeatedStops
        ? "Repeated unplanned stops detected during the journey."
        : "No unusual stops detected.",
    },
    {
      key: "missedCheckIns",
      label: JOURNEY_INDICATOR_LABELS.missedCheckIns,
      score: pMissed,
      max: W.missedCheckIns,
      note:
        cappedMissed === 0
          ? "All safety check-ins answered so far."
          : `${cappedMissed} missed safety check-in${
              cappedMissed === 1 ? "" : "s"
            } during the journey.`,
    },
  ];

  const indicatorDefs: { active: boolean; label: string; points: number; weight: number }[] = [
    {
      active: input.walkingAlone,
      label: JOURNEY_INDICATOR_LABELS.walkingAlone,
      points: pWalking,
      weight: W.walkingAlone,
    },
    {
      active: input.routeDeviation,
      label: JOURNEY_INDICATOR_LABELS.routeDeviation,
      points: pDeviation,
      weight: W.routeDeviation,
    },
    {
      active: input.repeatedStops,
      label: JOURNEY_INDICATOR_LABELS.repeatedStops,
      points: pStops,
      weight: W.repeatedStops,
    },
    {
      active: cappedMissed > 0,
      label: JOURNEY_INDICATOR_LABELS.missedCheckIns,
      points: pMissed,
      weight: W.missedCheckIns,
    },
  ];

  const indicators: RiskIndicatorItem[] = indicatorDefs
    .filter((d) => d.active)
    .map((d): RiskIndicatorItem => {
      const ratio = d.weight === 0 ? 0 : d.points / d.weight;
      return {
        label: d.label,
        severity: ratio >= 0.66 ? "High" : ratio >= 0.33 ? "Medium" : "Low",
      };
    });

  return { score, rawScore, level, factors, indicators, actions: buildJourneyActions(level) };
}

export const DEMO_SCENARIOS = [
  {
    id: "deepfake",
    title: "Deepfake + Blackmail",
    category: "deepfake" as IncidentCategory,
    text: "Someone created a fake image of me and is threatening to share it publicly unless I do what they say. They have already sent it to two people.",
    answers: { threatened: "yes", repeated: "yes", escalating: "yes" },
  },
  {
    id: "bullying",
    title: "Cyberbullying + Blackmail",
    category: "cyberbullying" as IncidentCategory,
    text: "Someone from school keeps sending threatening messages and says they will publish my photos if I block them. This has happened repeatedly and I am scared.",
    answers: { threatened: "yes", repeated: "yes", escalating: "yes" },
  },
  {
    id: "physical",
    title: "Immediate Physical Danger",
    category: "physical-threat" as IncidentCategory,
    text: "Someone is following me right now and I am scared they may hurt me. They are waiting near my street and I feel unsafe.",
    answers: { threatened: "yes", repeated: "no", escalating: "yes" },
  },
] as const;
