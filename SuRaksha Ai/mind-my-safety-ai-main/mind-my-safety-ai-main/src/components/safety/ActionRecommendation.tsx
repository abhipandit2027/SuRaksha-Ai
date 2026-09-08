import { Button } from "@/components/ui/button";
import type { ActionItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, EyeOff, FileCheck2, Flag, LifeBuoy, Users } from "lucide-react";

const ICONS = {
  evidence: FileCheck2,
  engagement: EyeOff,
  report: Flag,
  contact: Users,
  assistance: LifeBuoy,
} as const;

export function ActionRecommendation({
  action,
  done,
  onToggle,
  extra,
}: {
  action: ActionItem;
  done: boolean;
  onToggle: () => void;
  extra?: React.ReactNode;
}) {
  const Icon = ICONS[action.kind];
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-soft sm:flex-row sm:items-start",
        done ? "border-low/40 bg-low-soft/40" : "border-border",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          done ? "bg-low text-low-foreground" : "bg-secondary text-secondary-foreground",
        )}
      >
        {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold">
          {action.priority}. {action.title}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
        {extra ? <div className="mt-3">{extra}</div> : null}
      </div>
      <Button variant={done ? "secondary" : "outline"} size="sm" onClick={onToggle}>
        {done ? "Done" : "Mark as Done"}
      </Button>
    </div>
  );
}
