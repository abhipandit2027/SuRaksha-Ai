export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type IncidentCategory =
  | "online-harassment"
  | "deepfake"
  | "cyberbullying"
  | "blackmail"
  | "stalking"
  | "physical-threat"
  | "sexual-harassment"
  | "other";

export type TriState = "yes" | "no" | "unsure";

export interface AssessmentAnswers {
  threatened: TriState | null;
  repeated: TriState | null;
  escalating: TriState | null;
  sharedPublicly?: TriState | null;
  physicalHarm?: TriState | null;
}

export interface EvidenceItem {
  id: string;
  fileName: string;
  fileType: "screenshot" | "file" | "url";
  uploadedAt: string;
}

export interface RiskFactorScore {
  key: string;
  label: string;
  score: number;
  max: number;
  note: string;
}

export interface RiskIndicatorItem {
  label: string;
  severity: "High" | "Medium" | "Low";
}

export interface Assessment {
  score: number;
  level: RiskLevel;
  factors: RiskFactorScore[];
  indicators: RiskIndicatorItem[];
  summary: string;
  why: string;
  actions: ActionItem[];
  escalation: string;
  confidence: "high" | "low";
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: number;
  kind: "evidence" | "engagement" | "report" | "contact" | "assistance";
}

export interface Incident {
  id: string;
  type: string;
  category: IncidentCategory;
  description: string;
  riskScore: number;
  riskLevel: RiskLevel;
  createdAt: string;
  status: string;
  assessment: Assessment;
  evidence: EvidenceItem[];
  answers: AssessmentAnswers;
  completedActions: string[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  priority: number;
  notificationEnabled: boolean;
}

export interface EmergencyEvent {
  id: string;
  incidentId: string | null;
  activatedAt: string;
  locationStatus: string;
  contactNotificationStatus: string;
  emergencyStatus: "active" | "ended";
  options: EmergencyOptions;
  timeline: { time: string; label: string }[];
}

export interface EmergencyOptions {
  notifyContacts: boolean;
  shareLocation: boolean;
  sendIncident: boolean;
  sendRisk: boolean;
  service: "emergency-services" | "police" | "women-safety" | "contacts";
}

export interface SafetyCheckIn {
  id: string;
  label: string;
  startTime: string;
  expiryTime: string;
  status: "active" | "completed" | "missed" | "help";
  contactId: string | null;
}

export interface Profile {
  name: string;
  ageCategory: "adult" | "teen" | "child";
  locationSharing: boolean;
  notifications: boolean;
  guardianMode: boolean;
  guardianName: string;
}

/* ------------------------------------------------------------------ */
/* Safe Journey Mode                                                   */
/* ------------------------------------------------------------------ */

export type JourneyStatus = "idle" | "active" | "deviation" | "escalating" | "arrived" | "ended";

/** 0 = normal monitoring; 1 = LOW, 2 = MODERATE, 3 = HIGH, 4 = CRITICAL. */
export type JourneyStage = 0 | 1 | 2 | 3 | 4;

export type EscalationTrigger = "deviation" | "user-no" | "user-yes" | "timeout" | "reassessment";

export interface EscalationEntry {
  at: string;
  fromStage: JourneyStage;
  toStage: JourneyStage;
  trigger: EscalationTrigger;
  riskLevel: RiskLevel | null;
  activeIndicators: string[];
  note: string;
}

/** expiresAt = askedAt + 15_000ms */
export interface SafetyCheckPrompt {
  id: string;
  stage: JourneyStage;
  askedAt: string;
  expiresAt: string;
}

export interface JourneyEvidenceEntry {
  timestamp: string;
  gpsLocation: string;
  gpsSnapshot: GpsSnapshot | null;
  incidentDescription: string;
  riskScore: number | null;
  riskLevelAtCapture: RiskLevel | null;
  activeIndicatorsAtCapture: RiskIndicatorItem[] | null;
  escalationHistorySnapshot: EscalationEntry[];
  contactSnapshot: TrustedContactNotifyEntry[];
  incidentReport: JourneyIncidentReport | null;
}

export interface JourneyEvidence {
  startedAt: string;
  entries: JourneyEvidenceEntry[];
}

/** Simulated live GPS reading that mutates while stage >= 3. */
export interface GpsSnapshot {
  lat: string;
  lon: string;
  approx: string;
  accuracy: string;
  updatedAt: string;
  heading: string;
}

/** Per-contact delivery record (shown as chips below the status card once stage >= 3). */
export interface TrustedContactNotifyEntry {
  contactId: string;
  name: string;
  relationship: string;
  phone: string;
  notifiedAt: string | null;
  acknowledgedAt: string | null;
  status: "pending" | "delivered" | "acknowledged" | "skipped";
  deliveryChannel: "sms" | "location-share" | "both";
}

/** A structured incident report snapshot attached to every Stage 3+ evidence entry. */
export interface JourneyIncidentReport {
  id: string;
  generatedAt: string;
  destination: string;
  journeyStartedAt: string;
  stageReached: JourneyStage;
  peakRiskScore: number;
  peakRiskLevel: RiskLevel;
  currentRiskScore: number | null;
  currentRiskLevel: RiskLevel | null;
  activeIndicators: RiskIndicatorItem[];
  escalationChain: {
    at: string;
    from: JourneyStage;
    to: JourneyStage;
    trigger: EscalationTrigger;
    risk: RiskLevel | null;
    indicators: string[];
    note: string;
  }[];
  evidenceCaptured: number;
  contactsNotified: number;
  summary: string;
  timelineSummary: string[];
}

export interface SafeJourney {
  id: string;
  destination: string;
  startedAt: string;
  eta: string;
  status: JourneyStatus;
  stage: JourneyStage;
  walkingAlone: boolean;
  repeatedStops: boolean;
  missedCheckInCount: number;
  riskLevel: RiskLevel | null;
  riskScore: number | null;
  riskFactors: RiskFactorScore[] | null;
  riskIndicators: RiskIndicatorItem[] | null;
  actions: ActionItem[];
  liveLocationShared: boolean;
  contactsNotified: boolean;
  gps: GpsSnapshot | null;
  contactDeliveries: TrustedContactNotifyEntry[];
  evidence: JourneyEvidence | null;
  escalationHistory: EscalationEntry[];
  pendingCheck: SafetyCheckPrompt | null;
}
