import { Link } from "@tanstack/react-router";
import { Siren } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmergencyButton({
  className,
  label = "GET HELP NOW",
  size = "default",
}: {
  className?: string;
  label?: string;
  size?: "default" | "lg" | "sm";
}) {
  return (
    <Link
      to="/emergency"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-critical font-bold tracking-wide text-critical-foreground shadow-lift transition-transform hover:scale-[1.02] active:scale-[0.99]",
        size === "lg" && "w-full px-6 py-5 text-lg emergency-pulse",
        size === "default" && "px-5 py-3 text-sm",
        size === "sm" && "px-3 py-2 text-xs",
        className,
      )}
    >
      <Siren className={cn(size === "lg" ? "h-6 w-6" : "h-4 w-4")} />
      {label}
    </Link>
  );
}
