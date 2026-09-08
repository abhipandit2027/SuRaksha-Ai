import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { ActionRecommendation } from "@/components/safety/ActionRecommendation";
import { EmergencyButton } from "@/components/safety/EmergencyButton";
import { EmptyState } from "@/routes/index";
import { toast } from "sonner";
import { LEVEL_STYLES } from "@/lib/risk-engine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/action-plan/$id")({
  head: () => ({
    meta: [
      { title: "Action Plan — SuRaksha AI" },
      {
        name: "description",
        content:
          "Prioritized, risk-aware next steps: preserve evidence, avoid engagement, report and escalate safely.",
      },
      { property: "og:title", content: "Action Plan — SuRaksha AI" },
      { property: "og:description", content: "What to do now, prioritized by assessed risk." },
    ],
  }),
  component: ActionPlanPage,
});

function ActionPlanPage() {
  const { id } = Route.useParams();
  const { incidents, updateIncident, contacts } = useStore();
  const incident = incidents.find((i) => i.id === id);

  if (!incident)
    return (
      <EmptyState title="Action plan not found" body="This incident is no longer available." />
    );

  const toggle = (actionId: string) => {
    const done = incident.completedActions.includes(actionId);
    updateIncident(incident.id, {
      completedActions: done
        ? incident.completedActions.filter((a) => a !== actionId)
        : [...incident.completedActions, actionId],
    });
  };

  const critical = incident.riskLevel === "CRITICAL" || incident.riskLevel === "HIGH";
  const styles = LEVEL_STYLES[incident.riskLevel];
  const primaryContact = contacts[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">What should you do now?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          SuRaksha has prioritized the following actions based on the assessed risk.
        </p>
      </div>

      <div className={cn("flex flex-wrap items-center gap-3 rounded-2xl p-4", styles.bg)}>
        <span className={cn("text-sm font-bold", styles.text)}>
          {incident.riskScore}/100 · {styles.label}
        </span>
        <span className="text-sm text-muted-foreground">{incident.type}</span>
      </div>

      <div className="space-y-3">
        {incident.assessment.actions.map((action) => (
          <ActionRecommendation
            key={action.id}
            action={action}
            done={incident.completedActions.includes(action.id)}
            onToggle={() => toggle(action.id)}
            extra={
              action.kind === "contact" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    primaryContact
                      ? toast.success(`Simulated: notification prepared for ${primaryContact.name}`)
                      : toast.error("You haven't configured an emergency contact yet.")
                  }
                >
                  Notify Emergency Contact
                </Button>
              ) : action.kind === "assistance" ? (
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/services">Cybercrime reporting</Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/contacts">Trusted guardian</Link>
                  </Button>
                </div>
              ) : undefined
            }
          />
        ))}
      </div>

      <section className="panel space-y-3 p-5">
        <h2 className="text-base font-semibold">Recommended Escalation</h2>
        <p className="text-sm text-muted-foreground">{incident.assessment.escalation}</p>
        {critical ? <EmergencyButton size="lg" label="GET EMERGENCY HELP" /> : <EmergencyButton />}
      </section>

      <Button asChild variant="outline">
        <Link to="/report/$id" params={{ id: incident.id }}>
          Generate Incident Report
        </Link>
      </Button>
    </div>
  );
}
