import { Suspense } from "react";
import { DashboardClient } from "./dashboard-client";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <DashboardClient />
      </Suspense>
    </main>
  );
}
