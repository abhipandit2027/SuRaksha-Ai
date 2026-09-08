import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { RiskFactorScore, RiskIndicatorItem } from "@/lib/types";
import { AlertTriangle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function RiskBreakdown({ factors, total }: { factors: RiskFactorScore[]; total: number }) {
  return (
    <div className="space-y-4">
      {factors.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium">{f.label}</span>
            <span className="text-sm tabular-nums text-muted-foreground">
              <span className="font-semibold text-foreground">{f.score}</span> / {f.max}
            </span>
          </div>
          <Progress value={(f.score / f.max) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground">{f.note}</p>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm font-semibold">Total</span>
        <span className="text-lg font-bold tabular-nums">{total} / 100</span>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Info className="h-3.5 w-3.5" /> How is this calculated?
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            This is an AI-assisted situational risk assessment and is not a medical diagnosis.
            Scores are produced by a transparent, deterministic rule engine.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

const SEVERITY_STYLE: Record<RiskIndicatorItem["severity"], string> = {
  High: "bg-critical-soft text-critical",
  Medium: "bg-high-soft text-high",
  Low: "bg-moderate-soft text-moderate-foreground",
};

export function RiskIndicator({ item }: { item: RiskIndicatorItem }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            SEVERITY_STYLE[item.severity],
          )}
        >
          <AlertTriangle className="h-4 w-4" />
        </span>
        <span className="text-sm font-medium">{item.label}</span>
      </div>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-semibold",
          SEVERITY_STYLE[item.severity],
        )}
      >
        {item.severity}
      </span>
    </div>
  );
}
