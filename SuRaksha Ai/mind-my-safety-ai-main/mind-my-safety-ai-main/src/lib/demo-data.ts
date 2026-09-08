import { assessRisk, CATEGORY_LABELS } from "./risk-engine";
import type { EmergencyContact, Incident, Profile } from "./types";

export const DEFAULT_PROFILE: Profile = {
  name: "Ananya",
  ageCategory: "teen",
  locationSharing: true,
  notifications: true,
  guardianMode: true,
  guardianName: "Parent / Guardian",
};

export const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    id: "c1",
    name: "Parent / Guardian",
    relationship: "Parent",
    phone: "+91 98XXX XXX01",
    priority: 1,
    notificationEnabled: true,
  },
  {
    id: "c2",
    name: "Trusted Friend",
    relationship: "Friend",
    phone: "+91 98XXX XXX02",
    priority: 2,
    notificationEnabled: true,
  },
  {
    id: "c3",
    name: "Trusted Teacher",
    relationship: "Teacher",
    phone: "+91 98XXX XXX03",
    priority: 3,
    notificationEnabled: false,
  },
];

function make(
  id: string,
  category: Parameters<typeof assessRisk>[0]["category"],
  description: string,
  createdAt: string,
  status: string,
  targetScore: number,
): Incident {
  const assessment = assessRisk({
    category,
    description,
    answers: { threatened: "yes", repeated: "yes", escalating: "yes" },
    evidence: [],
    ageCategory: "teen",
  });
  // Demo incidents are pinned to presentation-friendly scores.
  const scaled = { ...assessment, score: targetScore, level: assessment.level };
  return {
    id,
    type: CATEGORY_LABELS[category],
    category,
    description,
    riskScore: targetScore,
    riskLevel:
      targetScore >= 76
        ? "CRITICAL"
        : targetScore >= 51
          ? "HIGH"
          : targetScore >= 26
            ? "MODERATE"
            : "LOW",
    createdAt,
    status,
    assessment: {
      ...scaled,
      level:
        targetScore >= 76
          ? "CRITICAL"
          : targetScore >= 51
            ? "HIGH"
            : targetScore >= 26
              ? "MODERATE"
              : "LOW",
    },
    evidence: [
      {
        id: `${id}-e1`,
        fileName: "chat_screenshot_01.png",
        fileType: "screenshot",
        uploadedAt: createdAt,
      },
    ],
    answers: { threatened: "yes", repeated: "yes", escalating: "yes" },
    completedActions: [],
  };
}

export const DEMO_INCIDENTS: Incident[] = [
  make(
    "INC-2026-0817",
    "deepfake",
    "A manipulated image of me was created and circulated to two people with a demand attached.",
    "2026-08-17T19:20:00.000Z",
    "Report Generated",
    72,
  ),
  make(
    "INC-2026-0815",
    "cyberbullying",
    "Repeated threatening messages from a classmate with a threat to publish my photos if I block them.",
    "2026-08-15T15:05:00.000Z",
    "Emergency Assistance Activated",
    84,
  ),
  make(
    "INC-2026-0812",
    "online-harassment",
    "A suspicious account keeps contacting me and asking personal questions.",
    "2026-08-12T10:40:00.000Z",
    "Guidance Provided",
    46,
  ),
];
