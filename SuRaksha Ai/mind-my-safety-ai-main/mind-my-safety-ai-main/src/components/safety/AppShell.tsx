import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Activity,
  BookOpen,
  Building2,
  ClipboardList,
  Heart,
  LayoutDashboard,
  MessageSquareHeart,
  Navigation,
  Settings,
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { EmergencyButton } from "./EmergencyButton";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assess", label: "Assess Situation", icon: Activity },
  { to: "/journey", label: "Safe Journey", icon: Navigation },
  { to: "/checkin", label: "Safety Check-In", icon: Heart },
  { to: "/assistant", label: "SuRaksha Assistant", icon: MessageSquareHeart },
  { to: "/history", label: "Incident History", icon: ClipboardList },
  { to: "/contacts", label: "Emergency Contacts", icon: Users },
  { to: "/services", label: "Official Services", icon: Building2 },
  { to: "/resources", label: "Safety Resources", icon: BookOpen },
  { to: "/settings", label: "Profile & Privacy", icon: Settings },
] as const;

const MOBILE_NAV = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/assess", label: "Assess", icon: Activity },
  { to: "/history", label: "History", icon: ClipboardList },
  { to: "/contacts", label: "Contacts", icon: Users },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { emergency, journey } = useStore();
  const journeyActive =
    journey?.status === "active" ||
    journey?.status === "deviation" ||
    journey?.status === "escalating";

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl surface-gradient text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-bold leading-tight">SuRaksha AI</p>
            <p className="text-xs text-muted-foreground">Detect. Assess. Act.</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 p-4">
          <EmergencyButton className="w-full" />
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            Prototype simulation for SIH. No real emergency service is contacted.
          </p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg surface-gradient text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold">SuRaksha AI</span>
          </div>
          <p className="hidden text-sm text-muted-foreground lg:block">
            &ldquo;Don&rsquo;t wait for a crisis to become an emergency.&rdquo;
          </p>
          <div className="flex items-center gap-2">
            {journeyActive ? (
              <Link
                to="/journey"
                className="inline-flex items-center gap-1.5 rounded-full bg-moderate-soft px-3 py-1.5 text-xs font-semibold text-moderate-foreground"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-moderate" />
                Journey active
              </Link>
            ) : null}
            {emergency ? (
              <Link
                to="/emergency/active"
                className="inline-flex items-center gap-1.5 rounded-full bg-critical-soft px-3 py-1.5 text-xs font-semibold text-critical"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-critical" />
                Emergency Mode Active
              </Link>
            ) : null}
            <EmergencyButton size="sm" label="GET HELP" className="lg:hidden" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 lg:px-8 lg:pb-16">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 items-end">
          {MOBILE_NAV.slice(0, 2).map((item) => (
            <MobileLink key={item.to} {...item} pathname={pathname} />
          ))}
          <Link
            to="/emergency"
            className="mx-auto -mt-6 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-critical text-critical-foreground shadow-lift emergency-pulse"
          >
            <Siren className="h-6 w-6" />
            <span className="text-[10px] font-bold">SOS</span>
          </Link>
          {MOBILE_NAV.slice(2).map((item) => (
            <MobileLink key={item.to} {...item} pathname={pathname} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function MobileLink({
  to,
  label,
  icon: Icon,
  pathname,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  pathname: string;
}) {
  const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
