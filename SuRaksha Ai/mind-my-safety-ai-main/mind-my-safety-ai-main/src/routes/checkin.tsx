import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { EmergencyButton } from "@/components/safety/EmergencyButton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkin")({
  head: () => ({
    meta: [
      { title: "Safety Check-In — SuRaksha AI" },
      {
        name: "description",
        content:
          "Set a timed safety check-in before you travel. If you don't confirm you're safe, SuRaksha prompts an escalation.",
      },
      { property: "og:title", content: "Safety Check-In — SuRaksha AI" },
      { property: "og:description", content: "Proactive timed check-ins, not just reactive SOS." },
    ],
  }),
  component: CheckInPage,
});

function CheckInPage() {
  const { checkIn, startCheckIn, resolveCheckIn, contacts } = useStore();
  const [minutes, setMinutes] = useState(30);
  const [label, setLabel] = useState("Travelling home");
  const [contactId, setContactId] = useState(contacts[0]?.id ?? null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining =
    checkIn && checkIn.status === "active"
      ? Math.max(0, Math.floor((new Date(checkIn.expiryTime).getTime() - now) / 1000))
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Safety Check-In</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          &ldquo;I&rsquo;m going somewhere and want a safety check-in.&rdquo; If you don&rsquo;t
          confirm you&rsquo;re safe in time, SuRaksha prompts you and prepares an escalation for
          your trusted contact.
        </p>
      </div>

      {checkIn && checkIn.status === "active" ? (
        <section className="panel space-y-4 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Timer className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold">{checkIn.label}</p>
              <p className="text-xs text-muted-foreground">
                Check-in due at {new Date(checkIn.expiryTime).toLocaleTimeString("en-IN")}
              </p>
            </div>
          </div>
          <p className="font-mono text-4xl font-bold tabular-nums">
            {String(Math.floor(remaining / 60)).padStart(2, "0")}:
            {String(remaining % 60).padStart(2, "0")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                resolveCheckIn("completed");
                toast.success("Check-in completed. Glad you're safe.");
              }}
            >
              I&rsquo;m Safe
            </Button>
            <EmergencyButton label="I NEED HELP" />
          </div>
        </section>
      ) : checkIn && checkIn.status === "missed" ? (
        <section className="rounded-3xl border border-high/40 bg-high-soft p-6">
          <p className="text-lg font-bold text-high">Safety check-in missed</p>
          <p className="mt-1 text-sm text-muted-foreground">Are you safe?</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                resolveCheckIn("completed");
                toast.success("Thanks for confirming. Check-in closed.");
              }}
            >
              I&rsquo;m Safe
            </Button>
            <EmergencyButton label="I NEED HELP" />
          </div>
        </section>
      ) : (
        <section className="panel space-y-4 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Heart className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold">Start a new check-in</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="label">What are you doing?</Label>
              <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <div className="flex flex-wrap gap-2">
                {[15, 30, 60].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMinutes(m)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      minutes === m
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {m} minutes
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Emergency contact</Label>
            <div className="flex flex-wrap gap-2">
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setContactId(c.id)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm",
                    contactId === c.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  )}
                >
                  {c.name}
                </button>
              ))}
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add an emergency contact first.</p>
              ) : null}
            </div>
          </div>
          <Button
            onClick={() => {
              startCheckIn(minutes, contactId, label || "Safety check-in");
              toast.success(`Check-in started for ${minutes} minutes`);
            }}
          >
            Start Check-In
          </Button>
          <p className="text-xs text-muted-foreground">
            Prototype simulation: no message is actually delivered to your contact.
          </p>
        </section>
      )}

      {checkIn && checkIn.status === "completed" ? (
        <div className="rounded-2xl border border-low/40 bg-low-soft p-4 text-sm">
          Last check-in completed safely — {checkIn.label}.
        </div>
      ) : null}
    </div>
  );
}
