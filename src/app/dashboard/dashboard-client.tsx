"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RadarMark } from "@/components/radar-mark";
import { LeadCard, type Lead } from "@/components/lead-card";
import { relativeTime } from "@/lib/format";

type Agency = { id: string; name: string };

export function DashboardClient() {
  const searchParams = useSearchParams();
  const agencyId = searchParams.get("agencyId");

  const [profileName, setProfileName] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [lastSwept, setLastSwept] = useState<string | null>(null);
  const [sweepNote, setSweepNote] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    const res = await fetch(`/api/leads?agencyId=${agencyId}`);
    const data = await res.json();
    setLeads(data);
    setLoading(false);
  }, [agencyId]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    if (!agencyId) return;
    fetch("/api/agencies")
      .then((res) => res.json())
      .then((rows: Agency[]) => {
        setProfileName(rows.find((r) => r.id === agencyId)?.name ?? null);
      });
  }, [agencyId]);

  async function runSweep() {
    if (!agencyId) return;
    setSweeping(true);
    setSweepNote(null);
    try {
      const res = await fetch("/api/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId }),
      });
      const data = await res.json();
      setSweepNote(`${data.inserted} new signal${data.inserted === 1 ? "" : "s"} from ${data.keywordsSwept} keywords`);
      setLastSwept(new Date().toISOString());
      await loadLeads();
    } finally {
      setSweeping(false);
    }
  }

  async function updateStatus(id: string, status: Lead["status"]) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  }

  if (!agencyId) {
    return (
      <p className="text-sm text-muted-foreground">
        No profile found. Run <code className="font-mono">npx tsx scripts/seed-personal-profile.ts</code> to create one.
      </p>
    );
  }

  const counts = {
    hot: leads.filter((l) => l.temperature === "hot").length,
    warm: leads.filter((l) => l.temperature === "warm").length,
    cold: leads.filter((l) => l.temperature === "cold").length,
  };

  return (
    <div className="space-y-8">
      <header className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <RadarMark active={sweeping} />
            <div>
              <h1 className="font-display text-xl font-medium tracking-tight">Signal</h1>
              <p className="text-sm text-muted-foreground">
                {profileName ? `Gigs matching ${profileName}` : "Scanning your watchlist"}
                {lastSwept && ` · last swept ${relativeTime(lastSwept)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {sweepNote && <p className="text-sm text-muted-foreground">{sweepNote}</p>}
            <Button onClick={runSweep} disabled={sweeping}>
              {sweeping ? "Sweeping…" : "Run sweep now"}
            </Button>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-border bg-card px-4 py-3 font-mono text-xs">
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted-foreground">SIGNALS</dt>
            <dd className="text-foreground">{leads.length}</dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="size-1.5 rounded-full bg-signal-hot" />
            <dt className="text-muted-foreground">HOT</dt>
            <dd className="text-foreground">{counts.hot}</dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="size-1.5 rounded-full bg-signal-warm" />
            <dt className="text-muted-foreground">WARM</dt>
            <dd className="text-foreground">{counts.warm}</dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="size-1.5 rounded-full bg-signal-cold" />
            <dt className="text-muted-foreground">COLD</dt>
            <dd className="text-foreground">{counts.cold}</dd>
          </div>
        </dl>
      </header>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!loading && leads.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No signals yet. Run a sweep to scan the last 7 days across your watchlist.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onStatusChange={updateStatus} />
        ))}
      </div>
    </div>
  );
}
