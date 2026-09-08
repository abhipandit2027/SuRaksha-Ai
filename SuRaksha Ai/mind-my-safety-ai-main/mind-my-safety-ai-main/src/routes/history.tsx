import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { RiskBadge } from "@/components/safety/RiskScore";
import { EmptyState } from "@/routes/index";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Safety History — SuRaksha AI" },
      {
        name: "description",
        content:
          "A documented timeline of assessed incidents, risk scores and the outcome of each safety workflow.",
      },
      { property: "og:title", content: "Safety History — SuRaksha AI" },
      { property: "og:description", content: "Your documented incident timeline." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { incidents, removeIncident, clearHistory } = useStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Safety History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every assessment is documented and stays under your control.
          </p>
        </div>
        {incidents.length ? (
          <Button
            variant="outline"
            onClick={() => {
              clearHistory();
              toast.success("Incident history cleared");
            }}
          >
            Clear history
          </Button>
        ) : null}
      </div>

      {incidents.length === 0 ? (
        <EmptyState title="No incidents yet" body="Assessments you run will be documented here." />
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-6">
          {incidents.map((i) => (
            <li key={i.id} className="relative">
              <span className="absolute -left-[31px] top-5 h-3 w-3 rounded-full bg-primary" />
              <div className="panel flex flex-wrap items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{i.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(i.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    Status: {i.status}
                  </p>
                </div>
                <RiskBadge level={i.riskLevel} score={i.riskScore} />
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/report/$id" params={{ id: i.id }}>
                      Open report
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      removeIncident(i.id);
                      toast.success("Incident deleted");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
