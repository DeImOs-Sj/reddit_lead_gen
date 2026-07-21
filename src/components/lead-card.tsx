"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/format";

export type Lead = {
  id: string;
  sourcePostUrl: string;
  authorUsername: string | null;
  title: string;
  snippet: string | null;
  subreddit: string | null;
  postedAt: string | null;
  surfacedAt: string;
  intentScore: number | null;
  serviceMatchScore: number | null;
  temperature: "cold" | "warm" | "hot" | null;
  suggestedReply: string | null;
  status: "new" | "contacted" | "replied" | "won" | "lost";
};

const temperatureBar: Record<string, string> = {
  hot: "bg-signal-hot",
  warm: "bg-signal-warm",
  cold: "bg-signal-cold",
};

const temperatureText: Record<string, string> = {
  hot: "text-signal-hot",
  warm: "text-signal-warm",
  cold: "text-signal-cold",
};

export function LeadCard({
  lead,
  onStatusChange,
}: {
  lead: Lead;
  onStatusChange: (id: string, status: Lead["status"]) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyReply() {
    if (!lead.suggestedReply) return;
    await navigator.clipboard.writeText(lead.suggestedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const temp = lead.temperature ?? "cold";

  return (
    <div className="flex overflow-hidden rounded-lg border border-border bg-card">
      <div className={`w-1 shrink-0 ${temperatureBar[temp]}`} />

      <div className="flex-1 space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <a
            href={lead.sourcePostUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium leading-snug hover:underline"
          >
            {lead.title}
          </a>
          <span className={`shrink-0 font-mono text-xs uppercase tracking-wide ${temperatureText[temp]}`}>
            {temp}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
          <span>{lead.subreddit ? `r/${lead.subreddit}` : "reddit"}</span>
          {lead.authorUsername && <span>u/{lead.authorUsername}</span>}
          <span>surfaced {relativeTime(lead.surfacedAt)}</span>
          <span>intent {Math.round((lead.intentScore ?? 0) * 100)}</span>
          <span>match {Math.round((lead.serviceMatchScore ?? 0) * 100)}</span>
        </div>

        {lead.snippet && <p className="text-sm text-muted-foreground">{lead.snippet}</p>}

        {lead.suggestedReply && (
          <div className="rounded-md border border-border bg-muted p-3">
            <p className="mb-1.5 font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">
              Suggested reply — copy &amp; paste yourself, nothing is sent automatically
            </p>
            <p className="text-sm">{lead.suggestedReply}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={copyReply}>
              {copied ? "Copied" : "Copy reply"}
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {(["contacted", "replied", "won", "lost"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={lead.status === s ? "default" : "outline"}
              onClick={() => onStatusChange(lead.id, s)}
            >
              {s}
            </Button>
          ))}
          <a href={lead.sourcePostUrl} target="_blank" rel="noreferrer" className="ml-auto">
            <Button size="sm" variant="secondary" type="button">
              Open on Reddit ↗
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
