"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Download } from "lucide-react";
import { PageHeader } from "@src/components/ui/page-header";
import { Button } from "@src/components/ui/button";

export default function DashboardHeader() {
  const [updated, setUpdated] = useState("");

  useEffect(() => {
    const tick = () => setUpdated(new Date().toLocaleTimeString());
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <PageHeader
      title="Facility Command Overview"
      description={`Real-time status tracking for Medical Unit Head · Last updated: ${updated || "—"}`}
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Grid
          </Button>
          <Button variant="secondary" size="sm" type="button">
            <Download className="w-3.5 h-3.5" />
            Export Log
          </Button>
        </>
      }
    />
  );
}
