import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Link2, Loader2, Paperclip, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { assessRisk, CATEGORY_LABELS, DEMO_SCENARIOS } from "@/lib/risk-engine";
import type { AssessmentAnswers, EvidenceItem, IncidentCategory, TriState } from "@/lib/types";
import { EmergencyButton } from "@/components/safety/EmergencyButton";
import { toast } from "sonner";

export const Route = createFileRoute("/assess")({
  head: () => ({
    meta: [
      { title: "Assess a Situation — SuRaksha AI" },
      {
        name: "description",
        content:
          "Describe what happened in your own words. SuRaksha AI identifies safety indicators and produces an explainable risk score.",
      },
      { property: "og:title", content: "Assess a Situation — SuRaksha AI" },
      {
        property: "og:description",
        content: "Guided safety assessment with transparent, rule-based risk scoring.",
      },
    ],
  }),
  component: AssessPage,
});

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [IncidentCategory, string][];

const STEPS = [
  "Understanding incident",
  "Identifying risk indicators",
  "Assessing severity",
  "Evaluating escalation risk",
  "Preparing recommended actions",
];

function AssessPage() {
  const navigate = useNavigate();
  const { addIncident, profile } = useStore();
  const [category, setCategory] = useState<IncidentCategory | null>(null);
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [answers, setAnswers] = useState<AssessmentAnswers>({
    threatened: null,
    repeated: null,
    escalating: null,
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState(0);
  const [showDemos, setShowDemos] = useState(false);

  const addEvidence = (fileType: EvidenceItem["fileType"], fileName: string) =>
    setEvidence((e) => [
      ...e,
      { id: `ev-${Date.now()}`, fileName, fileType, uploadedAt: new Date().toISOString() },
    ]);

  const runAnalysis = () => {
    if (!category) {
      toast.error("Please select what type of situation this is.");
      return;
    }
    setAnalyzing(true);
    setStep(0);
    const interval = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length)), 500);
    setTimeout(() => {
      clearInterval(interval);
      const assessment = assessRisk({
        category,
        description,
        answers,
        evidence,
        ageCategory: profile.ageCategory,
      });
      const id = `INC-${Date.now().toString().slice(-8)}`;
      addIncident({
        id,
        type: CATEGORY_LABELS[category],
        category,
        description,
        riskScore: assessment.score,
        riskLevel: assessment.level,
        createdAt: new Date().toISOString(),
        status: "Assessment Completed",
        assessment,
        evidence,
        answers,
        completedActions: [],
      });
      navigate({ to: "/assessment/$id", params: { id } });
    }, 2800);
  };

  if (analyzing) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 text-center">
        <div className="relative">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl surface-gradient text-primary-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </span>
        </div>
        <div>
          <h1 className="text-xl font-bold">SuRaksha AI is analyzing the situation…</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Interpreting your description and mapping it to structured risk factors.
          </p>
        </div>
        <ul className="w-full max-w-sm space-y-3 text-left">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-sm transition-all",
                i < step ? "border-low/40 bg-low-soft/50" : "border-border bg-card opacity-60",
              )}
            >
              {i < step ? (
                <Check className="h-4 w-4 text-low" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {s}
            </li>
          ))}
        </ul>
        <EmergencyButton size="sm" label="GET HELP NOW" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">What is happening?</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Tell SuRaksha what happened. You don&rsquo;t need to know what category it belongs to.
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowDemos((v) => !v)}>
          <Sparkles className="mr-2 h-4 w-4" /> Try Demo Scenario
        </Button>
      </div>

      {showDemos ? (
        <div className="grid gap-3 rounded-2xl border border-primary/25 bg-secondary p-4 md:grid-cols-3">
          {DEMO_SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setCategory(s.category);
                setDescription(s.text);
                setAnswers({
                  threatened: s.answers.threatened as TriState,
                  repeated: s.answers.repeated as TriState,
                  escalating: s.answers.escalating as TriState,
                });
                setShowDemos(false);
                toast.success(`Loaded demo scenario: ${s.title}`);
              }}
              className="rounded-xl border border-border bg-card p-4 text-left shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <p className="text-sm font-semibold">{s.title}</p>
              <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{s.text}</p>
            </button>
          ))}
        </div>
      ) : null}

      <section className="panel p-5">
        <Label className="text-sm font-semibold">Type of situation</Label>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                category === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-secondary",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel space-y-3 p-5">
        <Label htmlFor="desc" className="text-sm font-semibold">
          Describe what happened
        </Label>
        <Textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the situation in your own words…"
          className="min-h-40 resize-y text-sm"
        />
        <p className="text-xs text-muted-foreground">
          You can write naturally. SuRaksha will identify relevant safety indicators.
        </p>
      </section>

      <section className="panel space-y-3 p-5">
        <Label className="text-sm font-semibold">Evidence</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addEvidence("screenshot", `screenshot_${evidence.length + 1}.png`)}
          >
            <Camera className="mr-2 h-4 w-4" /> Upload Screenshot
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addEvidence("file", `evidence_${evidence.length + 1}.pdf`)}
          >
            <Paperclip className="mr-2 h-4 w-4" /> Upload File
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addEvidence("url", "https://example.com/reported-post")}
          >
            <Link2 className="mr-2 h-4 w-4" /> Add URL
          </Button>
        </div>
        {evidence.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {evidence.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-xl border border-border p-3 text-sm"
              >
                <span className="truncate">{e.fileName}</span>
                <button
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setEvidence((list) => list.filter((x) => x.id !== e.id))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            Evidence upload is simulated in this prototype — no file leaves your device.
          </p>
        )}
      </section>

      <section className="panel space-y-5 p-5">
        <Label className="text-sm font-semibold">A few quick questions</Label>
        <TriQuestion
          label="Is anyone threatening you?"
          value={answers.threatened}
          onChange={(v) => setAnswers((a) => ({ ...a, threatened: v }))}
        />
        <TriQuestion
          label="Has this happened repeatedly?"
          value={answers.repeated}
          onChange={(v) => setAnswers((a) => ({ ...a, repeated: v }))}
        />
        <TriQuestion
          label="Do you feel that the situation could escalate?"
          value={answers.escalating}
          onChange={(v) => setAnswers((a) => ({ ...a, escalating: v }))}
        />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="flex-1 text-base font-semibold" onClick={runAnalysis}>
          ANALYZE WITH SURAKSHA AI
        </Button>
        <EmergencyButton className="sm:w-64" />
      </div>
    </div>
  );
}

function TriQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TriState | null;
  onChange: (v: TriState) => void;
}) {
  const opts: { v: TriState; l: string }[] = [
    { v: "yes", l: "Yes" },
    { v: "no", l: "No" },
    { v: "unsure", l: "Not sure" },
  ];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm">{label}</p>
      <div className="flex gap-2">
        {opts.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              value === o.v
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-secondary",
            )}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}
