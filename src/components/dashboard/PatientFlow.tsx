"use client";

import { useEffect, useState } from "react";
import { Radio, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@src/components/ui/card";
import { Badge } from "@src/components/ui/badge";
import { Button } from "@src/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@src/components/ui/table";
import { cn } from "@src/lib/utils";
import type { Encounter } from "@src/dto/encounter";
import encountersService from "@src/services/encounters.service";
import operationsService from "@src/services/operations.service";

type FlowRow = {
  id: string;
  name: string;
  type: "EMERGENCY" | "COLD";
  status: string;
  time: string;
};

export default function PatientFlow() {
  const [rows, setRows] = useState<FlowRow[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      const [queue, emergencies, consult, pharmacy] = await Promise.all([
        operationsService.getQueue().catch(() => []),
        encountersService.list({ type: "Emergency" }).catch(() => []),
        encountersService.list({ status: "InConsultation" }).catch(() => []),
        encountersService.list({ status: "PharmacyPending" }).catch(() => []),
      ]);

      if (!active) return;

      const mappedQueue: FlowRow[] = (queue || [])
        .filter(
          (item) =>
            !String(item.admissionType || "")
              .toLowerCase()
              .includes("emergency")
        )
        .map((item) => ({
          id: item.encounterId || item.id || "—",
          name: item.patientName || item.fullName || "Patient",
          type: "COLD" as const,
          status: item.status || "Queued",
          time:
            item.estimatedWaitMinutes != null
              ? `~${item.estimatedWaitMinutes}m`
              : "—",
        }));

      const mapEncounter = (item: Encounter, fallbackStatus: string): FlowRow => ({
        id: item.id,
        name: item.patientName || item.fullName || item.patientId || "Patient",
        type: String(item.admissionType || "")
          .toLowerCase()
          .includes("emergency")
          ? "EMERGENCY"
          : "COLD",
        status: item.status || fallbackStatus,
        time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : "—",
      });

      const isEmergencyEncounter = (item: Encounter) =>
        String(item.admissionType || "")
          .toLowerCase()
          .includes("emergency");

      setRows(
        [
          ...(emergencies || []).map((item) => mapEncounter(item, "Admitted")),
          ...mappedQueue,
          ...(consult || [])
            .filter((item) => !isEmergencyEncounter(item))
            .map((item) => mapEncounter(item, "InConsultation")),
          ...(pharmacy || [])
            .filter((item) => !isEmergencyEncounter(item))
            .map((item) => mapEncounter(item, "PharmacyPending")),
        ].slice(0, 8)
      );
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Patient Flow</CardTitle>
        <Badge variant="live" className="flex items-center gap-1">
          <Radio className="w-2.5 h-2.5" /> LIVE FEED
        </Badge>
      </CardHeader>

      <Table className="min-w-[560px]">
        <TableHeader>
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead>Patient ID</TableHead>
            <TableHead>Case Type</TableHead>
            <TableHead>Current Status</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>No active flow rows yet.</TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={`${row.id}-${row.status}`}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#dcdce0] shrink-0" />
                  <div>
                    <div className="font-semibold font-mono text-xs">
                      {row.id.slice(0, 8)}
                    </div>
                    <div className="text-[11.5px] text-surface-muted">
                      {row.name}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[11.5px] font-semibold",
                    row.type === "EMERGENCY" ? "text-brand-red" : "text-blue-500"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      row.type === "EMERGENCY" ? "bg-brand-red" : "bg-blue-500"
                    )}
                  />
                  {row.type}
                </span>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9c9cc]" />
                  {row.status}
                </span>
              </TableCell>
              <TableCell>{row.time}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CardFooter>
        <span>Showing {rows.length} active flows</span>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="iconSm" aria-label="Previous page">
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <Button size="iconSm" className="text-[11px] font-medium">
            1
          </Button>
          <Button variant="outline" size="iconSm" aria-label="Next page">
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
