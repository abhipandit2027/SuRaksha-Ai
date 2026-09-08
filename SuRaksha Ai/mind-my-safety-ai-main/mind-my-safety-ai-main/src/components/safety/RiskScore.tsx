import { LEVEL_STYLES } from "@/lib/risk-engine";
import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RiskScore({
  score,
  level,
  size = 200,
  subtitle,
}: {
  score: number;
  level: RiskLevel;
  size?: number;
  subtitle?: string;
}) {
  const styles = LEVEL_STYLES[level];
  const r = 45;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" className="stroke-muted" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className={cn(styles.ring, "transition-all duration-1000 ease-out")}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold tracking-tight">{score}</span>
          <span className="text-xs font-medium text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-bold tracking-wide",
          styles.bg,
          styles.text,
        )}
      >
        {styles.label}
      </div>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const styles = LEVEL_STYLES[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        styles.bg,
        styles.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
      {score !== undefined ? `${score}/100 · ` : ""}
      {level}
    </span>
  );
}
