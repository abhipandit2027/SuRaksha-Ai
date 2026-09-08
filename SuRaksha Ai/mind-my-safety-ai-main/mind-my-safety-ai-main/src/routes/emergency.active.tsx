import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, FileText, MapPin, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/lib/store";
import { EmergencyTimeline } from "@/components/safety/EmergencyTimeline";
import { EmptyState } from "@/routes/index";

export const Route = createFileRoute("/emergency/active")({
  head: () => ({
    meta: [
      { title: "Emergency Mode Active — SuRaksha AI" },
      {
        name: "description",
        content:
          "Live emergency status: contact notification, location sharing and incident context preparation.",
      },
      { property: "og:title", content: "Emergency Mode Active — SuRaksha AI" },
      { property: "og:description", content: "Live simulated emergency response timeline." },
    ],
  }),
  component: EmergencyActivePage,
});

function EmergencyActivePage() {
  const { emergency, endEmergency, incidents, contacts } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!emergency) {
    return (
      <EmptyState
        title="No active emergency"
        body="Emergency mode is not currently active. You can activate it any time from the emergency screen."
      />
    );
  }

  const incident = incidents.find((i) => i.id === emergency.incidentId);
  const contact = contacts[0];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-critical p-6 text-critical-foreground shadow-lift">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em]">
          <Siren className="h-5 w-5 animate-pulse" /> Emergency Mode Active
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">HELP REQUEST INITIATED</h1>
        <p className="mt-2 text-sm opacity-90">
          Activated {new Date(emergency.activatedAt).toLocaleString("en-IN")} · Prototype
          simulation, no real service contacted.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          title="Emergency Contact"
          value={
            emergency.options.notifyContacts
              ? `✓ Notification Sent${contact ? ` — ${contact.name}` : ""}`
              : "Disabled"
          }
        />
        <StatusCard
          title="Location"
          value={emergency.options.shareLocation ? "✓ Sharing Active" : "Disabled"}
        />
        <StatusCard
          title="Incident Information"
          value={emergency.options.sendIncident ? "✓ Prepared" : "Disabled"}
        />
        <StatusCard
          title="Risk Assessment"
          value={
            emergency.options.sendRisk && incident
              ? `✓ ${incident.riskScore}/100 — ${incident.riskLevel}`
              : "Not sent"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-4 text-base font-semibold">Response Timeline</h2>
          <EmergencyTimeline items={emergency.timeline} />
        </section>
        <section className="panel p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <MapPin className="h-4 w-4" /> Current Location
          </h2>
          <div className="relative h-52 overflow-hidden rounded-2xl border border-border bg-[linear-gradient(0deg,transparent_24%,oklch(0.9_0.01_250)_25%,oklch(0.9_0.01_250)_26%,transparent_27%,transparent_74%,oklch(0.9_0.01_250)_75%,oklch(0.9_0.01_250)_76%,transparent_77%),linear-gradient(90deg,transparent_24%,oklch(0.9_0.01_250)_25%,oklch(0.9_0.01_250)_26%,transparent_27%,transparent_74%,oklch(0.9_0.01_250)_75%,oklch(0.9_0.01_250)_76%,transparent_77%)] [background-size:36px_36px]">
            <span className="absolute left-1/2 top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-critical emergency-pulse" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Location sharing enabled · Simulated coordinates for demonstration.
          </p>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        {incident ? (
          <Button asChild variant="outline">
            <Link to="/report/$id" params={{ id: incident.id }}>
              <FileText className="mr-2 h-4 w-4" /> View Incident Report
            </Link>
          </Button>
        ) : null}
        <Button variant="secondary" onClick={() => setOpen(true)}>
          End Emergency Mode
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End emergency mode?</AlertDialogTitle>
            <AlertDialogDescription>
              Only end emergency mode if you are safe. Your incident record and report will remain
              available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                endEmergency();
                navigate({ to: "/" });
              }}
            >
              End Emergency Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1 flex items-start gap-1.5 text-sm font-semibold">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-low" />
        {value}
      </p>
    </div>
  );
}
