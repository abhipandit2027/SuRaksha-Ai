import { Check } from "lucide-react";

export function EmergencyTimeline({ items }: { items: { time: string; label: string }[] }) {
  return (
    <ol className="relative space-y-5 border-l border-border pl-6">
      {items.map((item, i) => (
        <li key={i} className="rise-in" style={{ animationDelay: `${i * 160}ms` }}>
          <span className="absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full bg-low text-low-foreground">
            <Check className="h-3 w-3" />
          </span>
          <p className="text-sm font-medium">{item.label}</p>
          <p className="font-mono text-xs text-muted-foreground">{item.time}</p>
        </li>
      ))}
    </ol>
  );
}
