import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Archive,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  MapPin,
  Navigation,
  PersonStanding,
  Pin,
  ShieldAlert,
  SquareCheckBig,
  Users,
  Waypoints,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LEVEL_STYLES, RISK_LEVEL_BANDS } from "@/lib/risk-engine";
import { toast } from "sonner";
import { EmergencyButton } from "@/components/safety/EmergencyButton";
import type {
  EscalationEntry,
  JourneyEvidenceEntry,
  JourneyIncidentReport,
  RiskFactorScore,
  RiskIndicatorItem,
  TrustedContactNotifyEntry,
} from "@/lib/types";

export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [
      { title: "Safe Journey — SuRaksha AI" },
      {
        name: "description",
        content:
          "Start a monitored trip. SuRaksha watches for route deviations and escalates through 4 stages with an 'Are you safe?' countdown check.",
      },
      { property: "og:title", content: "Safe Journey — SuRaksha AI" },
      {
        property: "og:description",
        content: "Proactive monitored journeys with 4-stage escalation, not just reactive SOS.",
      },
    ],
  }),
  component: JourneyPage,
});

const INDICATOR_SEVERITY: Record<RiskIndicatorItem["severity"], string> = {
  High: "bg-critical-soft text-critical",
  Medium: "bg-high-soft text-high",
  Low: "bg-moderate-soft text-moderate-foreground",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour12: false });
}

function formatRelative(ms: number) {
  if (ms <= 0) return "0s";
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function journeyStageLabel(stage: number) {
  if (stage === 0) return "Stage 0 — Normal monitoring";
  const band = RISK_LEVEL_BANDS[stage - 1];
  if (!band) return `Stage ${stage}`;
  return `Stage ${stage} — ${band.level}`;
}

function triggerLabel(t: EscalationEntry["trigger"]) {
  switch (t) {
    case "deviation":
      return "Route deviation";
    case "user-no":
      return "Traveller: not safe";
    case "user-yes":
      return "Traveller: confirmed safe";
    case "timeout":
      return "No response";
    case "reassessment":
      return "Reassessment";
  }
}

function triggerDotClass(t: EscalationEntry["trigger"]) {
  switch (t) {
    case "deviation":
      return "bg-moderate text-moderate-foreground";
    case "user-no":
      return "bg-high text-high";
    case "user-yes":
      return "bg-low text-low-foreground";
    case "timeout":
      return "bg-critical text-critical-foreground";
    case "reassessment":
      return "bg-accent text-accent-foreground";
  }
}

function JourneyPage() {
  const {
    journey,
    journeyHistory,
    startJourney,
    simulateDeviation,
    simulateRepeatedStops,
    arriveJourney,
    endJourney,
    appendEvidenceEntry,
    profile,
  } = useStore();

  const [destination, setDestination] = useState("Home");
  const [etaMinutes, setEtaMinutes] = useState<number>(20);
  const [walkingAlone, setWalkingAlone] = useState<boolean>(profile.guardianMode ? false : true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const active =
    journey &&
    (journey.status === "active" ||
      journey.status === "deviation" ||
      journey.status === "escalating");

  const etaRemaining = active && journey ? Math.max(0, Date.parse(journey.eta) - now) : 0;
  const totalMs =
    active && journey ? Math.max(1, Date.parse(journey.eta) - Date.parse(journey.startedAt)) : 1;
  const progress =
    active && journey ? Math.max(0, Math.min(100, 100 - (etaRemaining / totalMs) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Safe Journey</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Start a monitored trip. If an unusual deviation is detected, SuRaksha runs a 4-stage
          escalation ladder &mdash; each stage with an &ldquo;Are you safe?&rdquo; 15-second
          countdown.
        </p>
      </div>

      {active ? (
        <ActiveJourneyView
          journey={journey}
          now={now}
          etaRemaining={etaRemaining}
          progress={progress}
          onArrive={() => {
            arriveJourney();
            toast.success("Journey completed safely. Archiving to history.");
          }}
          onEnd={() => {
            endJourney();
            toast.message("Journey ended. Archived to history.");
          }}
          onDeviate={() => {
            simulateDeviation();
            toast.warning("Unusual route deviation detected (simulated).");
          }}
          onStops={() => {
            simulateRepeatedStops();
            toast.warning("Repeated unplanned stops flagged (simulated).");
          }}
          onAppend={() => {
            appendEvidenceEntry();
            toast.success("Evidence snapshot saved.");
          }}
        />
      ) : (
        <StartJourneyForm
          destination={destination}
          setDestination={setDestination}
          etaMinutes={etaMinutes}
          setEtaMinutes={setEtaMinutes}
          walkingAlone={walkingAlone}
          setWalkingAlone={setWalkingAlone}
          onStart={() => {
            if (!destination.trim()) {
              toast.error("Enter a destination first.");
              return;
            }
            if (etaMinutes < 1 || Number.isNaN(etaMinutes)) {
              toast.error("ETA must be at least 1 minute.");
              return;
            }
            startJourney(destination.trim(), Math.round(etaMinutes), walkingAlone);
            toast.success(
              `Journey to ${destination.trim()} started — ETA ${etaMinutes} min. Staying safe!`,
            );
          }}
        />
      )}

      {journey && !active && (
        <div className="panel space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-semibold">
              Journey {journey.status === "arrived" ? "arrived" : "ended"} — {journey.destination}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Escalation stages reached: {journey.escalationHistory.length}. Evidence entries:{" "}
            {journey.evidence?.entries.length ?? 0}.
          </p>
        </div>
      )}

      {journeyHistory.length > 0 && (
        <section className="panel space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-base font-semibold">Past journeys</h2>
            </div>
            <span className="text-xs text-muted-foreground">{journeyHistory.length} archived</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {journeyHistory.slice(0, 6).map((j) => (
              <div key={j.id} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {j.destination}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {formatTime(j.startedAt)}
                    </span>
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      j.status === "arrived"
                        ? "bg-low-soft text-low"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {j.status === "arrived" ? "Arrived" : "Ended"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Stages {j.escalationHistory.length}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    Evidence {j.evidence?.entries.length ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    Missed {j.missedCheckInCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StartJourneyForm({
  destination,
  setDestination,
  etaMinutes,
  setEtaMinutes,
  walkingAlone,
  setWalkingAlone,
  onStart,
}: {
  destination: string;
  setDestination: (v: string) => void;
  etaMinutes: number;
  setEtaMinutes: (v: number) => void;
  walkingAlone: boolean;
  setWalkingAlone: (v: boolean) => void;
  onStart: () => void;
}) {
  return (
    <section className="panel space-y-5 p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Navigation className="h-6 w-6" />
        </span>
        <div>
          <p className="text-base font-semibold">Start a Safe Journey</p>
          <p className="text-xs text-muted-foreground">
            Tell SuRaksha where you&apos;re going and when you expect to arrive.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="destination">Destination</Label>
          <Input
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Home from college"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="eta">Expected time to arrive (minutes)</Label>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 20, 30, 45, 60].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setEtaMinutes(m)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm",
                  etaMinutes === m
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/60",
                )}
              >
                {m} min
              </button>
            ))}
          </div>
          <Input
            id="eta"
            type="number"
            min={1}
            value={etaMinutes}
            onChange={(e) => setEtaMinutes(Number(e.target.value))}
            className="mt-2"
          />
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-card/50 p-3">
        <Checkbox
          id="alone"
          checked={walkingAlone}
          onCheckedChange={(v) => setWalkingAlone(Boolean(v))}
          className="mt-0.5"
        />
        <div className="space-y-0.5">
          <Label htmlFor="alone" className="text-sm font-medium">
            I&apos;m travelling alone
          </Label>
          <p className="text-xs text-muted-foreground">
            Travelling alone raises the baseline risk score. Default{" "}
            {walkingAlone ? "enabled" : "disabled (guardian mode on)"}.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onStart} className="gap-2">
          <Navigation className="h-4 w-4" />
          Start Safe Journey
        </Button>
        <EmergencyButton label="I NEED HELP NOW" />
      </div>

      <p className="text-xs text-muted-foreground">
        Prototype simulation. No real GPS tracking, SMS or calls are made; location is a hardcoded
        approximate string. Evidence, contacts and escalation are simulated.
      </p>
    </section>
  );
}

function ActiveJourneyView({
  journey,
  now,
  etaRemaining,
  progress,
  onArrive,
  onEnd,
  onDeviate,
  onStops,
  onAppend,
}: {
  journey: NonNullable<ReturnType<typeof useStore>["journey"]>;
  now: number;
  etaRemaining: number;
  progress: number;
  onArrive: () => void;
  onEnd: () => void;
  onDeviate: () => void;
  onStops: () => void;
  onAppend: () => void;
}) {
  const elevatedLevel =
    journey.riskLevel ?? (RISK_LEVEL_BANDS[journey.stage - 1]?.level ?? "LOW");
  const levelStyle = LEVEL_STYLES[elevatedLevel];
  const isEscalating = journey.stage >= 1;
  const showRisk = journey.riskFactors && journey.riskScore !== null;

  const stagePillStyle =
    journey.stage === 0
      ? {
          bg: "bg-muted",
          text: "text-muted-foreground",
          dot: "bg-muted-foreground/70",
          label: journeyStageLabel(0),
        }
      : {
          bg: levelStyle.bg,
          text: levelStyle.text,
          dot: levelStyle.dot,
          label: journeyStageLabel(journey.stage),
        };

  return (
    <div className="space-y-6">
      <section className="panel space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                isEscalating ? levelStyle.bg : "bg-accent text-accent-foreground",
              )}
            >
              {isEscalating ? (
                <ShieldAlert className={cn("h-6 w-6", levelStyle.text)} />
              ) : (
                <Navigation className="h-6 w-6" />
              )}
            </span>
            <div className="space-y-2">
              <p className="text-base font-semibold leading-6">
                Journey to {journey.destination}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap",
                    stagePillStyle.bg,
                    stagePillStyle.text,
                  )}
                >
                  <span
                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", stagePillStyle.dot)}
                  />
                  {stagePillStyle.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Started at {formatTime(journey.startedAt)} · ETA {formatTime(journey.eta)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                journey.liveLocationShared
                  ? "border-high/50 bg-high-soft text-high"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              <Pin className="h-3.5 w-3.5" />
              {journey.liveLocationShared ? "Live location shared" : "Location private"}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                journey.contactsNotified
                  ? "border-high/50 bg-high-soft text-high"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              <Users className="h-3.5 w-3.5" />
              {journey.contactsNotified ? "Contacts notified" : "Contacts not notified"}
            </span>
          </div>
        </div>

        {journey.contactDeliveries.length > 0 && (
          <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-high" />
              <p className="text-sm font-semibold">Trusted contacts</p>
              <span className="ml-auto text-[11px] text-muted-foreground">
                {journey.contactDeliveries.filter((c) => c.status === "acknowledged").length}/
                {journey.contactDeliveries.length} acknowledged
              </span>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {journey.contactDeliveries.map((c) => (
                <ContactChip key={c.contactId} entry={c} />
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Time until ETA
            </div>
            <p className="font-mono text-2xl font-bold tabular-nums">
              {formatRelative(etaRemaining)}
            </p>
            <Progress value={progress} className="h-1.5" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <PersonStanding className="h-3.5 w-3.5" />
              Journey flags
            </div>
            <ul className="space-y-1 text-sm">
              <li>
                <span className="text-muted-foreground">Travelling alone:</span>{" "}
                <strong>{journey.walkingAlone ? "Yes" : "No"}</strong>
              </li>
              <li>
                <span className="text-muted-foreground">Repeated stops:</span>{" "}
                <strong>{journey.repeatedStops ? "Yes" : "No"}</strong>
              </li>
              <li>
                <span className="text-muted-foreground">Missed check-ins:</span>{" "}
                <strong>{journey.missedCheckInCount}</strong>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
              Current risk
            </div>
            {showRisk ? (
              <>
                <p className="font-mono text-2xl font-bold tabular-nums">
                  {journey.riskScore}
                  <span className="text-base font-normal text-muted-foreground"> / 100</span>
                </p>
                <p className={cn("text-xs font-semibold uppercase", levelStyle.text)}>
                  {levelStyle.label}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">No active assessment</p>
                <p className="text-xs text-muted-foreground">
                  Normal monitoring &mdash; score updates after a deviation.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={onDeviate}
            disabled={journey.stage !== 0 || journey.status !== "active"}
            className="gap-2"
          >
            <Waypoints className="h-4 w-4" />
            Simulate route deviation
          </Button>
          <Button
            variant="secondary"
            onClick={onStops}
            disabled={journey.repeatedStops}
            className="gap-2"
          >
            <SquareCheckBig className="h-4 w-4" />
            Simulate repeated stops
          </Button>
          {journey.evidence && (
            <Button variant="outline" onClick={onAppend} className="gap-2">
              <FileText className="h-4 w-4" />
              Save evidence snapshot
            </Button>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="outline" onClick={onEnd} className="gap-2">
              <Archive className="h-4 w-4" />
              End journey
            </Button>
            <Button onClick={onArrive} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              I&apos;ve arrived safely
            </Button>
          </div>
        </div>
      </section>

      {journey.gps && (
        <section className="panel space-y-4 p-6 border-high/40 bg-card">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-high" />
              <h2 className="text-base font-semibold">Live GPS Tracking</h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-high/40 bg-high-soft/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-high">
              <span className="h-2 w-2 rounded-full bg-high live-dot" />
              Live
            </span>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">
              Last update {formatTime(journey.gps.updatedAt)}
            </span>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-border bg-background p-3 space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Latitude
              </p>
              <p className="font-mono font-bold tabular-nums">{journey.gps.lat}°N</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-3 space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Longitude
              </p>
              <p className="font-mono font-bold tabular-nums">{journey.gps.lon}°E</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-3 space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Accuracy
              </p>
              <p className="font-mono font-bold tabular-nums">{journey.gps.accuracy}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-3 space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Heading
              </p>
              <p className="font-mono font-bold tabular-nums flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-high" />
                {journey.gps.heading}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-3 space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Location
              </p>
              <p className="font-mono text-xs font-semibold tabular-nums truncate">
                {journey.gps.approx}
              </p>
            </div>
          </div>
        </section>
      )}

      {showRisk && (
        <section className="panel space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Risk breakdown</h2>
            <span className={cn("text-xs font-semibold uppercase", levelStyle.text)}>
              {levelStyle.label}
            </span>
          </div>
          <RiskBars factors={journey.riskFactors ?? []} total={journey.riskScore ?? 0} />
          <div>
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
              Active indicators
            </p>
            {journey.riskIndicators && journey.riskIndicators.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {journey.riskIndicators.map((i) => (
                  <span
                    key={i.label}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                      INDICATOR_SEVERITY[i.severity],
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                    {i.label} · {i.severity}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No active indicators.</p>
            )}
          </div>
        </section>
      )}

      {journey.actions.length > 0 && (
        <section className="panel space-y-3 p-6">
          <h2 className="text-base font-semibold">Recommended actions</h2>
          <ul className="space-y-3">
            {journey.actions.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-start"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <span className="text-xs font-bold">{a.priority}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground capitalize">
                  <ArrowRight className="h-3.5 w-3.5" />
                  {a.kind}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {journey.escalationHistory.length > 0 && (
        <EscalationTimeline entries={journey.escalationHistory} />
      )}

      {journey.evidence && (
        <EvidenceLog entries={journey.evidence.entries} startedAt={journey.evidence.startedAt} />
      )}
    </div>
  );
}

function RiskBars({ factors, total }: { factors: RiskFactorScore[]; total: number }) {
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
          <Progress value={f.max ? (f.score / f.max) * 100 : 0} className="h-2" />
          <p className="text-xs text-muted-foreground">{f.note}</p>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm font-semibold">Total</span>
        <span className="text-lg font-bold tabular-nums">{total} / 100</span>
      </div>
    </div>
  );
}

function EscalationTimeline({ entries }: { entries: EscalationEntry[] }) {
  return (
    <section className="panel space-y-4 p-6">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">Escalation timeline</h2>
        <span className="ml-auto text-xs text-muted-foreground">{entries.length} events</span>
      </div>
      <ol className="relative space-y-5 border-l border-border pl-6">
        {entries.map((e, i) => {
          const level = e.riskLevel ?? "LOW";
          const s = LEVEL_STYLES[level];
          return (
            <li
              key={`${e.at}-${i}`}
              className="relative rise-in"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <span
                className={cn(
                  "absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                  triggerDotClass(e.trigger),
                )}
              >
                {e.toStage}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">
                  Stage {e.fromStage} &rarr; Stage {e.toStage}
                </p>
                {e.riskLevel && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      s.bg,
                      s.text,
                    )}
                  >
                    <span className={cn("h-1 w-1 rounded-full", s.dot)} />
                    {e.riskLevel}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {triggerLabel(e.trigger)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{e.note}</p>
              {e.activeIndicators.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.activeIndicators.map((l) => (
                    <span
                      key={l}
                      className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1 font-mono text-[11px] text-muted-foreground/80">
                {formatTime(e.at)}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ContactChip({ entry }: { entry: TrustedContactNotifyEntry }) {
  const initials = entry.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const statusMeta: Record<TrustedContactNotifyEntry["status"], { label: string; chip: string; dot: string }> = {
    pending: {
      label: "Sending…",
      chip: "border-border bg-muted text-muted-foreground",
      dot: "bg-muted-foreground/60",
    },
    delivered: {
      label: "Delivered",
      chip: "border-high/40 bg-high-soft text-high",
      dot: "bg-high",
    },
    acknowledged: {
      label: "Acknowledged",
      chip: "border-low/40 bg-low-soft text-low",
      dot: "bg-low",
    },
    skipped: {
      label: "Skipped",
      chip: "border-border bg-background text-muted-foreground",
      dot: "bg-muted-foreground/40",
    },
  };

  const s = statusMeta[entry.status];

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card/80 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">{entry.name}</p>
          {entry.status === "acknowledged" && (
            <CheckCircle2 className="h-3.5 w-3.5 text-low shrink-0" />
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{entry.relationship}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              s.chip,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
            {s.label}
          </span>
          {entry.notifiedAt && (
            <span className="font-mono text-[10px] text-muted-foreground/80">
              {formatTime(entry.notifiedAt)}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function IncidentReportAccordion({ report }: { report: JourneyIncidentReport }) {
  const [open, setOpen] = useState(false);

  const peakStyle = LEVEL_STYLES[report.peakRiskLevel];
  const currentStyle = report.currentRiskLevel ? LEVEL_STYLES[report.currentRiskLevel] : null;

  return (
    <div className="mt-3 rounded-xl border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <FileText className="h-4 w-4 text-high shrink-0" />
        <p className="text-sm font-semibold">Incident report</p>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-high/30 bg-high-soft/50 px-2 py-0.5 text-[10px] font-semibold uppercase text-high">
          Peak {report.peakRiskLevel} · {report.peakRiskScore}
        </span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Peak risk reached
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase",
                    peakStyle.bg,
                    peakStyle.text,
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", peakStyle.dot)} />
                  {report.peakRiskLevel}
                </span>
                <p className="font-mono font-bold tabular-nums">{report.peakRiskScore}/100</p>
              </div>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Risk at capture
              </p>
              {currentStyle && report.currentRiskScore !== null ? (
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase",
                      currentStyle.bg,
                      currentStyle.text,
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", currentStyle.dot)} />
                    {report.currentRiskLevel}
                  </span>
                  <p className="font-mono font-bold tabular-nums">{report.currentRiskScore}/100</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No score captured</p>
              )}
            </div>
          </div>

          <p className="text-sm leading-relaxed text-foreground/90">{report.summary}</p>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1">
              <FileText className="h-3.5 w-3.5" />
              {report.evidenceCaptured} evidence snapshots
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1">
              <Users className="h-3.5 w-3.5" />
              {report.contactsNotified} contacts notified
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1">
              <Pin className="h-3.5 w-3.5" />
              Destination: {report.destination}
            </span>
          </div>

          {report.escalationChain.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
                Escalation chain
              </p>
              <ul className="space-y-2 border-l border-border pl-4">
                {report.escalationChain.map((step, idx) => {
                  const lv = step.risk ?? "LOW";
                  const st = LEVEL_STYLES[lv];
                  return (
                    <li key={idx} className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">
                          Stage {step.from} → Stage {step.to}
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {triggerLabel(step.trigger)}
                        </span>
                        {step.risk && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                              st.bg,
                              st.text,
                            )}
                          >
                            {step.risk}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{step.note}</p>
                      {step.indicators.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {step.indicators.map((l) => (
                            <span
                              key={l}
                              className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="font-mono text-[10px] text-muted-foreground/80">
                        {formatTime(step.at)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {report.timelineSummary.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
                Timeline
              </p>
              <ul className="space-y-1.5">
                {report.timelineSummary.map((line, idx) => (
                  <li key={idx} className="flex gap-2 text-xs">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                    <span className="text-foreground/85">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="font-mono text-[10px] text-muted-foreground/80 pt-1 border-t border-border">
            Report #{report.id} · generated {new Date(report.generatedAt).toLocaleString("en-IN")}
          </p>
        </div>
      )}
    </div>
  );
}

function EvidenceLog({
  entries,
  startedAt,
}: {
  entries: JourneyEvidenceEntry[];
  startedAt: string;
}) {
  return (
    <section className="panel space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Evidence log</h2>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            Recording started {formatTime(startedAt)}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{entries.length} snapshots</span>
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No evidence snapshots yet. Snaphots are saved automatically when the situation escalates
          to Stage 3 (HIGH) and higher.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((en, i) => {
            const snapNum = entries.length - i;
            const riskLv = en.riskLevelAtCapture;
            const style = riskLv ? LEVEL_STYLES[riskLv] : null;
            const notifiedCount = en.contactSnapshot?.length ?? 0;
            const acknowledgedCount = en.contactSnapshot?.filter(
              (c) => c.status === "acknowledged" || c.status === "delivered",
            ).length ?? 0;

            return (
              <li
                key={`${en.timestamp}-${i}`}
                className="rounded-2xl border border-border bg-card p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">Snapshot #{snapNum}</p>
                    {riskLv && style && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          style.bg,
                          style.text,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                        {riskLv}
                      </span>
                    )}
                    {en.riskScore !== null && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 font-mono tabular-nums text-[11px] font-semibold text-muted-foreground">
                        Score {en.riskScore}/100
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {en.gpsLocation}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-foreground/90">{en.incidentDescription}</p>

                {en.gpsSnapshot && (
                  <div className="grid gap-2 text-xs sm:grid-cols-4">
                    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground shrink-0">Lat:</span>
                      <span className="font-mono font-semibold tabular-nums ml-auto">
                        {en.gpsSnapshot.lat}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground shrink-0">Lon:</span>
                      <span className="font-mono font-semibold tabular-nums ml-auto">
                        {en.gpsSnapshot.lon}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5">
                      <Compass className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground shrink-0">Heading:</span>
                      <span className="font-mono font-semibold tabular-nums ml-auto">
                        {en.gpsSnapshot.heading}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5">
                      <Navigation className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground shrink-0">Acc:</span>
                      <span className="font-mono font-semibold tabular-nums ml-auto">
                        {en.gpsSnapshot.accuracy}
                      </span>
                    </div>
                  </div>
                )}

                {notifiedCount > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {notifiedCount} trusted contact{notifiedCount === 1 ? "" : "s"} in scope ·{" "}
                    {acknowledgedCount} delivered/acknowledged
                  </p>
                )}

                <p className="font-mono text-[11px] text-muted-foreground/80">
                  {new Date(en.timestamp).toLocaleString("en-IN")} · Escalation history snapshot (
                  {en.escalationHistorySnapshot.length} events)
                </p>

                {en.incidentReport && <IncidentReportAccordion report={en.incidentReport} />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
