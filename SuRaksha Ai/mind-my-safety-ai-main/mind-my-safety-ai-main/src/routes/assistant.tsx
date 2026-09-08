import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { assessRisk, CATEGORY_LABELS } from "@/lib/risk-engine";
import type { AssessmentAnswers, IncidentCategory, TriState } from "@/lib/types";
import { RiskBadge } from "@/components/safety/RiskScore";
import { EmergencyButton } from "@/components/safety/EmergencyButton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "SuRaksha Assistant — Guided Safety Questions" },
      {
        name: "description",
        content:
          "A guided safety assistant that asks structured questions and updates your risk factors — not a generic chatbot.",
      },
      { property: "og:title", content: "SuRaksha Assistant — Guided Safety Questions" },
      { property: "og:description", content: "Structured, guided safety triage." },
    ],
  }),
  component: AssistantPage,
});

const QUESTIONS: { key: keyof AssessmentAnswers; text: string; options: TriState[] }[] = [
  {
    key: "sharedPublicly",
    text: "Has the content already been shared publicly?",
    options: ["yes", "no", "unsure"],
  },
  {
    key: "physicalHarm",
    text: "Has the person threatened you with physical harm?",
    options: ["yes", "no"],
  },
  { key: "repeated", text: "Has this happened repeatedly?", options: ["yes", "no"] },
  {
    key: "threatened",
    text: "Is anyone threatening you right now?",
    options: ["yes", "no", "unsure"],
  },
];

const LABELS: Record<TriState, string> = { yes: "Yes", no: "No", unsure: "I don't know" };

function AssistantPage() {
  const navigate = useNavigate();
  const { addIncident, profile } = useStore();
  const [text, setText] = useState("");
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({
    threatened: null,
    repeated: null,
    escalating: "unsure",
  });

  const category: IncidentCategory = /photo|image|deepfake|fake/i.test(text)
    ? "deepfake"
    : /follow|stalk/i.test(text)
      ? "stalking"
      : /school|class/i.test(text)
        ? "cyberbullying"
        : /threat|hurt|harm/i.test(text)
          ? "physical-threat"
          : "online-harassment";

  const live = assessRisk({
    category,
    description: text,
    answers,
    evidence: [],
    ageCategory: profile.ageCategory,
  });
  const done = step >= QUESTIONS.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl surface-gradient text-primary-foreground">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight">SuRaksha AI</h1>
          <p className="text-xs text-muted-foreground">
            Guided safety assistant · structured triage, not a chatbot
          </p>
        </div>
      </div>

      <section className="panel space-y-4 p-5">
        <p className="rounded-2xl rounded-bl-sm bg-secondary p-3 text-sm">
          I can help you assess the situation. Tell me what happened, and I&rsquo;ll ask a few
          details to determine the appropriate response.
        </p>
        {!started ? (
          <>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Someone created my fake photo and is threatening to send it to everyone."
              className="min-h-28"
            />
            <Button onClick={() => setStarted(true)} disabled={!text.trim()}>
              <Sparkles className="mr-2 h-4 w-4" /> Start guided assessment
            </Button>
          </>
        ) : (
          <>
            <p className="ml-auto max-w-lg rounded-2xl rounded-br-sm bg-primary p-3 text-sm text-primary-foreground">
              {text}
            </p>
            {QUESTIONS.slice(0, step + 1).map((q, i) => (
              <div key={q.key} className="space-y-2">
                <p className="rounded-2xl rounded-bl-sm bg-secondary p-3 text-sm">{q.text}</p>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((o) => (
                    <button
                      key={o}
                      onClick={() => {
                        setAnswers((a) => ({ ...a, [q.key]: o }));
                        setStep((s) => Math.max(s, i + 1));
                      }}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm",
                        answers[q.key] === o
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-secondary",
                      )}
                    >
                      {LABELS[o]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </section>

      {started ? (
        <section className="panel space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Live risk factors</h2>
            <RiskBadge level={live.level} score={live.score} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Situation" value={`${CATEGORY_LABELS[category]} — ${live.summary}`} />
            <Field label="Why" value={live.why} />
            <Field
              label="Detected factors"
              value={live.indicators.map((i) => i.label).join(", ") || "None yet"}
            />
            <Field label="Escalation" value={live.escalation} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={!done}
              onClick={() => {
                const id = `INC-${Date.now().toString().slice(-8)}`;
                addIncident({
                  id,
                  type: CATEGORY_LABELS[category],
                  category,
                  description: text,
                  riskScore: live.score,
                  riskLevel: live.level,
                  createdAt: new Date().toISOString(),
                  status: "Assessment Completed",
                  assessment: live,
                  evidence: [],
                  answers,
                  completedActions: [],
                });
                navigate({ to: "/assessment/$id", params: { id } });
              }}
            >
              {done ? "View full assessment" : "Answer all questions to continue"}
            </Button>
            <EmergencyButton />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
