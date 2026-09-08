import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, PhoneCall, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Emergency & Official Services — SuRaksha AI" },
      {
        name: "description",
        content:
          "Integration pathways to national emergency response, official cybercrime reporting and your trusted contacts.",
      },
      { property: "og:title", content: "Emergency & Official Services — SuRaksha AI" },
      {
        property: "og:description",
        content: "How SuRaksha routes into existing safety infrastructure.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          Emergency &amp; Official Services
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          SuRaksha is an intelligent safety orchestration layer. It does not replace 112 or
          government services — it prepares context and routes you to the right pathway.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ServiceCard
          icon={PhoneCall}
          title="112 Emergency Response"
          body="Nationwide emergency response service."
          cta="Open Emergency Assistance"
          to="/emergency"
        />
        <ServiceCard
          icon={Building2}
          title="National Cyber Crime Reporting"
          body="Official cybercrime reporting pathway."
          cta="Report Cybercrime"
          href="https://cybercrime.gov.in"
        />
        <ServiceCard
          icon={Users}
          title="Trusted Contacts"
          body="People you have configured to receive emergency notifications."
          cta="Manage Contacts"
          to="/contacts"
        />
      </div>

      <div className="panel flex items-start gap-3 p-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">
          These are represented as integration pathways. This prototype does not claim direct API
          integration with government services.
        </p>
      </div>
    </div>
  );
}

function ServiceCard({
  icon: Icon,
  title,
  body,
  cta,
  to,
  href,
}: {
  icon: typeof Users;
  title: string;
  body: string;
  cta: string;
  to?: "/emergency" | "/contacts";
  href?: string;
}) {
  return (
    <div className="panel flex flex-col justify-between p-5">
      <div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
          <Icon className="h-5 w-5" />
        </span>
        <p className="mt-3 text-base font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      {to ? (
        <Button asChild className="mt-4 w-full">
          <Link to={to}>{cta}</Link>
        </Button>
      ) : (
        <Button asChild variant="outline" className="mt-4 w-full">
          <a href={href} target="_blank" rel="noopener noreferrer">
            {cta}
          </a>
        </Button>
      )}
    </div>
  );
}
