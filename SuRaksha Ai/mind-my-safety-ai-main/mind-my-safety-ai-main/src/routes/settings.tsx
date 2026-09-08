import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Profile & Privacy — SuRaksha AI" },
      {
        name: "description",
        content:
          "Control your profile, guardian mode, notification and location preferences, and delete your safety data at any time.",
      },
      { property: "og:title", content: "Profile & Privacy — SuRaksha AI" },
      {
        property: "og:description",
        content: "Privacy by design: minimal data, user-controlled sharing.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, setProfile, clearHistory, incidents, resetDemo } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Profile &amp; Privacy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your safety data stays under your control.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="guardian">Guardian Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 pt-4">
          <section className="panel space-y-4 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Age category</Label>
              <div className="flex flex-wrap gap-2">
                {(["adult", "teen", "child"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setProfile({ ageCategory: a })}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm capitalize",
                      profile.ageCategory === a
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Age category affects the vulnerability/context factor in the risk engine.
              </p>
            </div>
            <Row
              label="Location sharing during emergency"
              checked={profile.locationSharing}
              onChange={(v) => setProfile({ locationSharing: v })}
            />
            <Row
              label="Safety notifications"
              checked={profile.notifications}
              onChange={(v) => setProfile({ notifications: v })}
            />
            <Button asChild variant="outline">
              <Link to="/contacts">Manage emergency preferences</Link>
            </Button>
          </section>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4 pt-4">
          <section className="panel space-y-3 p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Lock className="h-4 w-4" /> Your Safety Data
            </h2>
            <p className="text-sm text-muted-foreground">
              Your incident information should only be used for safety assistance and reporting
              workflows. In this prototype, all data stays in your browser.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/history">Delete individual incidents</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearHistory();
                  toast.success("Incident history cleared");
                }}
              >
                Clear incident history ({incidents.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetDemo();
                  toast.success("Prototype reset to demo data");
                }}
              >
                Reset prototype demo data
              </Button>
            </div>
          </section>

          <section className="panel space-y-2 p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="h-4 w-4" /> Privacy by Design
            </h2>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>Minimal data collection</li>
              <li>User-controlled sharing</li>
              <li>Explicit emergency consent — AI never escalates on its own</li>
              <li>Role-based access in a future implementation</li>
              <li>Encryption in production (not implemented in this prototype)</li>
            </ul>
          </section>
        </TabsContent>

        <TabsContent value="guardian" className="space-y-4 pt-4">
          <section className="panel space-y-4 p-5">
            <h2 className="text-base font-semibold">Guardian-linked safety profile</h2>
            <p className="text-sm text-muted-foreground">
              For child mode, a guardian can be linked to receive emergency notifications and
              incident awareness. This is a future-ready prototype section — no monitoring or
              tracking is implemented.
            </p>
            <Row
              label="Enable guardian mode"
              checked={profile.guardianMode}
              onChange={(v) => setProfile({ guardianMode: v })}
            />
            <div className="space-y-1.5">
              <Label htmlFor="guardian">Linked guardian</Label>
              <Input
                id="guardian"
                value={profile.guardianName}
                onChange={(e) => setProfile({ guardianName: e.target.value })}
              />
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
