import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { LEVEL_STYLES, RISK_LEVEL_BANDS } from "@/lib/risk-engine";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import type { RiskIndicatorItem } from "@/lib/types";

const SEVERITY_STYLE: Record<RiskIndicatorItem["severity"], string> = {
  High: "bg-critical-soft text-critical",
  Medium: "bg-high-soft text-high",
  Low: "bg-moderate-soft text-moderate-foreground",
};

function stageBand(stage: number) {
  const band = RISK_LEVEL_BANDS[stage - 1];
  return band?.level ?? "LOW";
}

export function SafetyCheckDialog() {
  const { journey, answerSafetyCheck } = useStore();
  const pending = journey?.pendingCheck ?? null;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [pending?.id]);

  const stage = pending?.stage ?? 0;
  const total = 15_000;
  const expiresAt = pending ? Date.parse(pending.expiresAt) : 0;
  const askedAt = pending ? Date.parse(pending.askedAt) : 0;
  const elapsed = Math.max(0, Math.min(total, now - askedAt));
  const remaining = Math.max(0, expiresAt - now);
  const pct = Math.max(0, Math.min(100, 100 - (elapsed / total) * 100));
  const sec = Math.max(0, Math.ceil(remaining / 1000));

  const open = Boolean(pending);
  const level = journey?.riskLevel ?? stageBand(stage);
  const style = LEVEL_STYLES[level];
  const indicators = journey?.riskIndicators ?? [];

  const isVerification = stage === 4;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className={cn("gap-6 border", style.bg, style.ring, "border-opacity-60")}>
        <AlertDialogHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                style.bg,
                style.text,
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Stage {stage} — {style.label}
            </span>
            <span className="text-xs text-muted-foreground">
              Journey to {journey?.destination ?? "destination"}
            </span>
          </div>
          <AlertDialogTitle className="text-xl font-bold tracking-tight">
            {isVerification ? "Are you safe? — verification" : "Are you safe?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              We noticed something unusual during your journey. Please confirm your status before{" "}
              <strong className="text-foreground">{sec}s</strong>.
            </p>
            {indicators.length > 0 && (
              <div className="rounded-xl border border-border bg-card/60 p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Why we&apos;re asking
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {indicators.map((i) => (
                    <span
                      key={i.label}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        SEVERITY_STYLE[i.severity],
                      )}
                    >
                      {i.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Safety check countdown
            </div>
            <span className="font-mono text-2xl font-bold tabular-nums" aria-live="polite">
              {sec}s
            </span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-border">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-200 ease-linear",
                pct > 50 ? "bg-low" : pct > 25 ? "bg-moderate" : "bg-critical",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct <= 25 && (
            <p className="text-xs text-critical font-medium">
              No response will automatically escalate the situation.
            </p>
          )}
        </div>

        <AlertDialogFooter className="flex-col-reverse sm:grid sm:grid-cols-2 gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => answerSafetyCheck("no")}
            className="border-critical/40 text-critical hover:bg-critical-soft hover:text-critical gap-2"
          >
            <XCircle className="h-4 w-4" />
            No — I need help
          </Button>
          <Button onClick={() => answerSafetyCheck("yes")} className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Yes — I am safe
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
