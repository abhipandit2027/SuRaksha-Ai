import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, FileText, ListChecks } from "lucide-react";
import { useStore } from "@/lib/store";
import { RiskScore } from "@/components/safety/RiskScore";
import { RiskBreakdown, RiskIndicator } from "@/components/safety/RiskBreakdown";
import { Button } from "@/components/ui/button";
import { EmergencyButton } from "@/components/safety/EmergencyButton";
import { EmptyState } from "@/routes/index";

export const Route = createFileRoute("/assessment/$id")({
  head: () => ({
    meta: [
      { title: "AI Safety Assessment — SuRaksha AI" },
      {
        name: "description",
        content:
          "Explainable AI-assisted situational risk assessment with a transparent factor-by-factor score breakdown.",
      },
      { property: "og:title", content: "AI Safety Assessment — SuRaksha AI" },
      {
        property: "og:description",
        content: "See exactly why your situation was scored the way it was.",
      },
    ],
  }),
  component: AssessmentPage,
});

function AssessmentPage() {
  const { id } = Route.useParams();
  const { incidents } = useStore();
  const incident = incidents.find((i) => i.id === id);

  if (!incident) {
    return (
      <EmptyState
        title="Assessment not found"
        body="This assessment is no longer available on this device."
      />
    );
  }
  const a = incident.assessment;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          AI Safety Assessment
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight lg:text-3xl">{incident.type}</h1>
      </div>

      {a.confidence === "low" ? (
        <div className="flex items-start gap-3 rounded-2xl border border-moderate/40 bg-moderate-soft p-4">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="text-sm font-semibold">
              We need more information to confidently assess this situation.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Answer a few guided questions in the SuRaksha Assistant to refine this score.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link to="/assistant">Answer guided questions</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <section className="panel flex flex-col items-center gap-4 p-6">
          <RiskScore
            score={incident.riskScore}
            level={incident.riskLevel}
            subtitle={
              incident.riskLevel === "CRITICAL"
                ? "Immediate attention recommended"
                : incident.riskLevel === "HIGH"
                  ? "Prompt protective action recommended"
                  : incident.riskLevel === "MODERATE"
                    ? "Stay alert and document"
                    : "No urgent escalation indicated"
            }
          />
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            This is an AI-assisted situational risk assessment and is not a medical diagnosis.
          </p>
        </section>

        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="text-base font-semibold">Why this score?</h2>
            <p className="mt-2 text-sm text-muted-foreground">{a.why}</p>
            <p className="mt-3 rounded-xl bg-secondary p-3 text-sm">{a.summary}</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">Detected Risk Indicators</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {a.indicators.map((ind) => (
                <RiskIndicator key={ind.label} item={ind} />
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="panel p-5">
        <h2 className="mb-4 text-base font-semibold">Risk Breakdown</h2>
        <RiskBreakdown factors={a.factors} total={incident.riskScore} />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link to="/action-plan/$id" params={{ id: incident.id }}>
            <ListChecks className="mr-2 h-4 w-4" /> View Recommended Actions
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="flex-1">
          <Link to="/report/$id" params={{ id: incident.id }}>
            <FileText className="mr-2 h-4 w-4" /> Generate Incident Report
          </Link>
        </Button>
        <EmergencyButton label="GET EMERGENCY HELP" className="sm:w-64" />
      </div>
    </div>
  );
}
