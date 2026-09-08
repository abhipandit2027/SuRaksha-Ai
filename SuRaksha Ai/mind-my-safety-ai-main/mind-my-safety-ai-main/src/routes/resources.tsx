import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Safety Resource Center — SuRaksha AI" },
      {
        name: "description",
        content:
          "Practical guidance on harassment, cyberbullying, image-based abuse, evidence preservation and when to seek emergency help.",
      },
      { property: "og:title", content: "Safety Resource Center — SuRaksha AI" },
      { property: "og:description", content: "Guidance for women and child safety situations." },
    ],
  }),
  component: ResourcesPage,
});

const RESOURCES = [
  {
    title: "Women Safety",
    summary: "Guidance for harassment, stalking and threats.",
    points: [
      "Keep a written log of every incident with dates, times and what happened.",
      "Vary predictable routines if you believe you are being followed, and stay in public, well-lit areas.",
      "Share your live location with a trusted person when travelling alone.",
      "Women helpline 181 and emergency response 112 are available nationwide.",
    ],
  },
  {
    title: "Child Safety",
    summary: "Guidance for cyberbullying, online threats and trusted-adult escalation.",
    points: [
      "Tell a trusted adult early — a parent, guardian or teacher. You are not in trouble for reporting.",
      "Do not meet anyone offline who you only know online.",
      "Block and report accounts that pressure you for photos or personal details.",
      "Childline 1098 supports children in distress.",
    ],
  },
  {
    title: "Cyber Harassment",
    summary: "Evidence preservation and reporting guidance.",
    points: [
      "Screenshot messages including the sender handle, date and time before blocking.",
      "Save profile URLs and post links — content is often deleted after reporting.",
      "Report inside the platform first, then use the official cybercrime reporting pathway.",
      "Never pay or comply with a demand; it typically increases pressure.",
    ],
  },
  {
    title: "Deepfake / Image Abuse",
    summary: "What to do when manipulated content is created or distributed.",
    points: [
      "Preserve the content and where it appeared, but do not forward it further.",
      "Submit a takedown request to the hosting platform for non-consensual or manipulated imagery.",
      "Tell a trusted adult or friend — image-based abuse relies on isolation and shame.",
      "Report through the official cybercrime pathway; this is treated as a serious offence.",
    ],
  },
  {
    title: "Bullying",
    summary: "Immediate steps and trusted-adult guidance.",
    points: [
      "Do not respond to provocation; document everything instead.",
      "Inform school authorities in writing where relevant.",
      "Adjust privacy settings and limit who can contact you.",
    ],
  },
  {
    title: "Emergency Assistance",
    summary: "When to seek immediate help.",
    points: [
      "If you are in immediate danger, contact emergency services now.",
      "Immediate physical threat, someone following you, or a credible threat of harm all warrant emergency help.",
      "Emergency services are never replaced by SuRaksha — it prepares context so help arrives informed.",
    ],
  },
];

function ResourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Safety Resource Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Practical guidance only. SuRaksha does not provide legal advice.
        </p>
      </div>

      <div className="panel p-2">
        <Accordion type="single" collapsible className="w-full">
          {RESOURCES.map((r) => (
            <AccordionItem key={r.title} value={r.title}>
              <AccordionTrigger className="px-3 text-left">
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{r.title}</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {r.summary}
                    </span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-3">
                <ul className="list-disc space-y-2 pl-8 text-sm text-muted-foreground">
                  {r.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
