import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, FileText, Heart, ShieldCheck, Siren, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { IncidentCard } from "@/components/safety/IncidentCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — SuRaksha AI Safety Companion" },
      {
        name: "description",
        content:
          "Your proactive safety dashboard: assess a situation, document an incident, or request emergency assistance instantly.",
      },
      { property: "og:title", content: "Dashboard — SuRaksha AI Safety Companion" },
      {
        property: "og:description",
        content: "Assess situations, understand risk, and escalate safely with SuRaksha AI.",
      },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function Dashboard() {
  const { profile, incidents, contacts, emergency, checkIn } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          {greeting()}, {profile.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Your proactive safety companion</p>
      </div>

      <section className="overflow-hidden rounded-3xl surface-gradient p-6 text-primary-foreground shadow-lift lg:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
          Current Safety Status
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            {emergency ? <Siren className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
          </span>
          <div>
            <p className="text-xl font-bold">
              {emergency ? "Emergency mode is active" : "You are currently safe"}
            </p>
            <p className="text-sm opacity-85">
              {emergency
                ? "Assistance workflow is running. Tap to view live status."
                : "No active emergency detected."}
            </p>
          </div>
          {emergency ? (
            <Button asChild variant="secondary" className="ml-auto">
              <Link to="/emergency/active">View Emergency Status</Link>
            </Button>
          ) : null}
        </div>
        <p className="mt-6 border-t border-white/20 pt-4 text-sm font-medium opacity-90">
          &ldquo;Don&rsquo;t wait for a crisis to become an emergency.&rdquo;
        </p>
      </section>

      {checkIn && checkIn.status === "missed" ? (
        <div className="rounded-2xl border border-high/40 bg-high-soft p-4">
          <p className="text-sm font-semibold text-high">Safety check-in missed</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Are you safe? Please confirm your status.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link to="/checkin">Respond to check-in</Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <ActionCard
          icon={Activity}
          title="Assess a Situation"
          body="Not sure what to do? Tell SuRaksha what happened."
          cta="Start Assessment"
          to="/assess"
        />
        <ActionCard
          icon={FileText}
          title="Document an Incident"
          body="Preserve important information and generate a structured report."
          cta="Create Report"
          to="/assess"
        />
        <div className="flex flex-col justify-between rounded-2xl border border-critical/30 bg-critical-soft p-5 shadow-soft">
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-critical text-critical-foreground">
              <Siren className="h-5 w-5" />
            </span>
            <p className="mt-3 text-base font-bold text-critical">I AM IN DANGER</p>
            <p className="mt-1 text-sm text-muted-foreground">Activate emergency assistance.</p>
          </div>
          <Button
            asChild
            className="mt-4 w-full bg-critical font-bold text-critical-foreground hover:bg-critical/90"
          >
            <Link to="/emergency">GET HELP NOW</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Safety Activity</h2>
            <Link
              to="/history"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {incidents.length === 0 ? (
              <EmptyState
                title="No incidents recorded"
                body="When you assess a situation, it will appear here with its risk score."
              />
            ) : (
              incidents.slice(0, 3).map((i) => <IncidentCard key={i.id} incident={i} />)
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Emergency Contacts</h2>
            <Link to="/contacts" className="text-sm text-primary hover:underline">
              Manage
            </Link>
          </div>
          {contacts.length === 0 ? (
            <div className="rounded-2xl border border-moderate/40 bg-moderate-soft p-4">
              <p className="text-sm font-medium">
                You haven&rsquo;t configured an emergency contact yet.
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link to="/contacts">Add Emergency Contact</Link>
              </Button>
            </div>
          ) : (
            contacts.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                  <Users className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.relationship} · {c.phone}
                  </p>
                </div>
              </div>
            ))
          )}
          <Link
            to="/checkin"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Heart className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Safety Check-In</p>
              <p className="text-xs text-muted-foreground">
                Going somewhere? Set a timed check-in.
              </p>
            </div>
          </Link>
        </section>
      </div>

      <p className="pt-2 text-center text-sm font-semibold text-muted-foreground">
        SuRaksha AI — Detect. Assess. Act.
      </p>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  body,
  cta,
  to,
}: {
  icon: typeof Activity;
  title: string;
  body: string;
  cta: string;
  to: "/assess";
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift">
      <div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <p className="mt-3 text-base font-bold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      <Button asChild className="mt-4 w-full">
        <Link to={to}>{cta}</Link>
      </Button>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
