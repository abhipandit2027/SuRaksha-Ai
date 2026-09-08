import { Link } from "@tanstack/react-router";
import { ChevronRight, FileText } from "lucide-react";
import type { Incident } from "@/lib/types";
import { RiskBadge } from "./RiskScore";

export function IncidentCard({ incident }: { incident: Incident }) {
  return (
    <Link
      to="/report/$id"
      params={{ id: incident.id }}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <FileText className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{incident.type}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(incident.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}{" "}
          · {incident.status}
        </p>
      </div>
      <RiskBadge level={incident.riskLevel} score={incident.riskScore} />
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
