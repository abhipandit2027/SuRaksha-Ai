import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Plus, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Emergency Contacts — SuRaksha AI" },
      {
        name: "description",
        content:
          "Manage the trusted people who receive notifications, location and incident context in an emergency.",
      },
      { property: "og:title", content: "Emergency Contacts — SuRaksha AI" },
      {
        property: "og:description",
        content: "Trusted contact configuration for emergency escalation.",
      },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  const {
    contacts,
    addContact,
    updateContact,
    removeContact,
    emergencyOptions,
    setEmergencyOptions,
  } = useStore();
  const [form, setForm] = useState({ name: "", relationship: "", phone: "" });
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">My Emergency Contacts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          These people can be notified when you activate emergency assistance.
        </p>
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-2xl border border-moderate/40 bg-moderate-soft p-5">
          <p className="text-sm font-semibold">
            You haven&rsquo;t configured an emergency contact yet.
          </p>
          <Button className="mt-3" onClick={() => setAdding(true)}>
            Add Emergency Contact
          </Button>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {contacts.map((c) => (
          <div key={c.id} className="panel space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.relationship}</p>
                </div>
              </div>
              {c.priority === 1 ? (
                <span className="rounded-full bg-low-soft px-2 py-1 text-[11px] font-semibold text-low">
                  Primary Contact
                </span>
              ) : null}
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" /> {c.phone}
            </p>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Notify during emergency</Label>
              <Switch
                checked={c.notificationEnabled}
                onCheckedChange={(v) => updateContact(c.id, { notificationEnabled: v })}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                removeContact(c.id);
                toast.success("Contact removed");
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        ))}
      </div>

      {adding ? (
        <section className="panel space-y-3 p-5">
          <h2 className="text-base font-semibold">Add Emergency Contact</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Relationship"
              value={form.relationship}
              onChange={(e) => setForm({ ...form, relationship: e.target.value })}
            />
            <Input
              placeholder="+91 XXXXX XXXXX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!form.name.trim()) {
                  toast.error("Please enter a name");
                  return;
                }
                addContact({
                  ...form,
                  relationship: form.relationship || "Trusted Contact",
                  phone: form.phone || "+91 XXXXX XXXXX",
                  priority: contacts.length + 1,
                  notificationEnabled: true,
                });
                setForm({ name: "", relationship: "", phone: "" });
                setAdding(false);
                toast.success("Emergency contact added");
              }}
            >
              Save Contact
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </section>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Emergency Contact
        </Button>
      )}

      <section className="panel space-y-3 p-5">
        <h2 className="text-base font-semibold">What contacts receive</h2>
        {(
          [
            ["notifyContacts", "Notify during emergency"],
            ["shareLocation", "Share location"],
            ["sendRisk", "Send risk score"],
            ["sendIncident", "Send incident report"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={emergencyOptions[key]}
              onCheckedChange={(v) => setEmergencyOptions({ [key]: Boolean(v) })}
            />
            {label}
          </label>
        ))}
      </section>
    </div>
  );
}
