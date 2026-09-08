import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Phone, ShieldAlert, Siren, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import type { EmergencyOptions } from "@/lib/types";

export const Route = createFileRoute("/emergency/")({
  head: () => ({
    meta: [
      { title: "Emergency Assistance — SuRaksha AI" },
      {
        name: "description",
        content:
          "Request help fast: choose an assistance pathway, notify trusted contacts and share incident context. Prototype simulation.",
      },
      { property: "og:title", content: "Emergency Assistance — SuRaksha AI" },
      {
        property: "og:description",
        content: "User-controlled emergency escalation with trusted contacts.",
      },
    ],
  }),
  component: EmergencyPage,
});

const SERVICES: {
  key: EmergencyOptions["service"];
  title: string;
  body: string;
  icon: typeof Phone;
}[] = [
  {
    key: "emergency-services",
    title: "Emergency Services",
    body: "Nationwide emergency response (112).",
    icon: Phone,
  },
  {
    key: "police",
    title: "Police Assistance",
    body: "Local police assistance pathway.",
    icon: ShieldAlert,
  },
  {
    key: "women-safety",
    title: "Women Safety Assistance",
    body: "Women safety helpline pathway.",
    icon: Siren,
  },
  {
    key: "contacts",
    title: "Emergency Contacts",
    body: "Notify your configured trusted contacts.",
    icon: Users,
  },
];

function EmergencyPage() {
  const navigate = useNavigate();
  const { emergencyOptions, setEmergencyOptions, activateEmergency, contacts, incidents } =
    useStore();
  const [open, setOpen] = useState(false);
  const latest = incidents[0];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-critical/30 bg-critical-soft p-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-critical lg:text-3xl">
          <Siren className="h-7 w-7" /> Emergency Assistance
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          If you are in immediate danger, use this mode to quickly request help. SuRaksha does not
          replace 112 or official services — it prepares and routes your request.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold">Emergency Options</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <button
              key={s.key}
              onClick={() => setEmergencyOptions({ service: s.key })}
              className={cn(
                "flex items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-all",
                emergencyOptions.service === s.key
                  ? "border-critical shadow-lift"
                  : "border-border hover:bg-secondary",
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <s.icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{s.title}</span>
                <span className="block text-xs text-muted-foreground">{s.body}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="text-base font-semibold">Emergency Response Settings</h2>
        {(
          [
            ["notifyContacts", "Notify emergency contacts"],
            ["shareLocation", "Share current location"],
            ["sendIncident", "Send incident information"],
            ["sendRisk", "Send risk assessment"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={emergencyOptions[key]}
              onCheckedChange={(v) =>
                setEmergencyOptions({ [key]: Boolean(v) } as Partial<EmergencyOptions>)
              }
            />
            {label}
          </label>
        ))}
        {contacts.length === 0 ? (
          <p className="rounded-xl bg-moderate-soft p-3 text-sm">
            You haven&rsquo;t configured an emergency contact yet.
          </p>
        ) : null}
      </section>

      <section className="panel flex items-start gap-3 p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
          <MapPin className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">Current Location</p>
          <p className="text-xs text-muted-foreground">
            Simulated location: Sector 21, New Delhi (approximate). Real location is never exposed
            in this prototype.
          </p>
        </div>
      </section>

      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl bg-critical px-6 py-6 text-lg font-extrabold tracking-wide text-critical-foreground shadow-lift emergency-pulse"
      >
        🚨 ACTIVATE EMERGENCY
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Prototype simulation only. No real emergency call or message is sent.
      </p>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Emergency Response?</AlertDialogTitle>
            <AlertDialogDescription>
              This will notify your configured emergency contacts and initiate the selected
              emergency workflow.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-critical text-critical-foreground hover:bg-critical/90"
              onClick={() => {
                activateEmergency(latest ? latest.id : null);
                navigate({ to: "/emergency/active" });
              }}
            >
              Activate Emergency
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
