"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { Clock, Download, Pill, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { PageHeader } from "@src/components/ui/page-header";
import { Button } from "@src/components/ui/button";
import { KpiCard } from "@src/components/ui/kpi-card";
import { Card, CardHeader, CardTitle } from "@src/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@src/components/ui/table";
import type { DrugRegisterEntry, ServiceWindow } from "@src/dto/operations";
import operationsService from "@src/services/operations.service";
import { getApiErrorMessage } from "@src/utils/api-error";
import {
  getStaffId,
  isUuid,
  setStaffId,
  toAspNetDate,
  toAspNetTime,
} from "@src/utils/staff";
import {
  isServiceWindowOpen,
  serviceWindowLabel,
} from "@src/utils/service-window";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminPage() {
  const [drugs, setDrugs] = useState<DrugRegisterEntry[]>([]);
  const [windowInfo, setWindowInfo] = useState<ServiceWindow | null>(null);
  const [windowError, setWindowError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState(todayIso());
  const [openTime, setOpenTime] = useState("08:00:00");
  const [closeTime, setCloseTime] = useState("16:00:00");
  const [openedBy, setOpenedBy] = useState("");
  const [savingWindow, setSavingWindow] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setOpenedBy(getStaffId("registrar"));
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setWindowError(null);
    try {
      const register = await operationsService
        .listDrugRegister({ page: 1, limit: 50 })
        .catch(() => []);
      setDrugs(register || []);

      try {
        const serviceWindow = await operationsService.getServiceWindow();
        setWindowInfo(serviceWindow);
        if (serviceWindow?.coldCaseOpenTime) {
          setOpenTime(toAspNetTime(serviceWindow.coldCaseOpenTime));
        }
        if (serviceWindow?.coldCaseCloseTime) {
          setCloseTime(toAspNetTime(serviceWindow.coldCaseCloseTime));
        }
        if (serviceWindow?.date) {
          setDate(toAspNetDate(serviceWindow.date));
        }
      } catch (error) {
        setWindowInfo(null);
        setWindowError(
          getApiErrorMessage(error, "Could not load today’s consult hours.")
        );
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load administration data"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleExport = async () => {
    try {
      const blob = await operationsService.exportDrugRegister({
        date: toAspNetDate(date),
        format: "csv",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `drug-register-${toAspNetDate(date)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Drug register exported");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to export drug register"));
    }
  };

  const handleSaveWindow = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isUuid(openedBy)) {
      setFormError("Enter a valid staff identity for who is opening the hours.");
      return;
    }

    setStaffId("registrar", openedBy);
    setSavingWindow(true);
    try {
      const open = toAspNetTime(openTime);
      const close = toAspNetTime(closeTime);
      const saved = windowInfo?.id
        ? await operationsService.updateServiceWindow(windowInfo.id, {
            coldCaseOpenTime: open,
            coldCaseCloseTime: close,
          })
        : await operationsService.createServiceWindow({
            date: toAspNetDate(date),
            coldCaseOpenTime: open,
            coldCaseCloseTime: close,
            createdBy: openedBy.trim(),
          });
      setWindowInfo(saved);
      setWindowError(null);
      toast.success(
        windowInfo?.id ? "Consult hours updated" : "Consult hours opened"
      );
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to save consult hours");
      setFormError(message);
      toast.error(message);
    } finally {
      setSavingWindow(false);
    }
  };

  const windowOpen = isServiceWindowOpen(windowInfo);

  return (
    <div className="w-full min-w-0 space-y-6">
      <PageHeader
        title="Administration"
        description="Set cold-case consult hours and review the drug register after protocol handover"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => void handleExport()}>
              <Download className="w-3.5 h-3.5" />
              Export register
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Consult hours"
          value={windowOpen ? "OPEN" : "CLOSED"}
          hint={serviceWindowLabel(windowInfo)}
          icon={Clock}
          accent={windowOpen}
        />
        <KpiCard
          label="Today’s window"
          value={
            <span className="block truncate text-2xl xl:text-3xl">
              {windowInfo?.coldCaseOpenTime?.slice(0, 5) || "—"}
              {windowInfo?.coldCaseCloseTime
                ? `–${windowInfo.coldCaseCloseTime.slice(0, 5)}`
                : ""}
            </span>
          }
          hint={windowInfo?.date || "Not set for today"}
          icon={Clock}
        />
        <KpiCard
          label="Drug register"
          value={isLoading ? "—" : String(drugs.length)}
          hint="After handover counselling"
          icon={Pill}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-5 items-start">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Cold-case consult hours</CardTitle>
          </CardHeader>
          <form onSubmit={handleSaveWindow} className="p-4 sm:p-5 space-y-4">
            <p className="text-xs text-surface-muted leading-relaxed">
              After the first service until the last sermon. Emergencies are seen any
              time and ignore this window.
            </p>
            {windowError && (
              <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3 text-xs leading-relaxed">
                {windowError}
              </p>
            )}
            {formError && (
              <p className="text-[#C62828] bg-red-50 border border-red-200 rounded-md p-3 text-xs leading-relaxed">
                {formError}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="space-y-1.5 min-w-0">
                <span className="block uppercase text-surface-muted font-bold text-[10px] tracking-wide">
                  Date
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full min-w-0 h-10 border border-surface-border rounded-md px-3 text-sm bg-white"
                />
              </label>
              <label className="space-y-1.5 min-w-0">
                <span className="block uppercase text-surface-muted font-bold text-[10px] tracking-wide">
                  Opens
                </span>
                <input
                  type="time"
                  step="1"
                  value={openTime}
                  onChange={(e) => setOpenTime(toAspNetTime(e.target.value))}
                  className="w-full min-w-0 h-10 border border-surface-border rounded-md px-3 text-sm bg-white"
                />
              </label>
              <label className="space-y-1.5 min-w-0">
                <span className="block uppercase text-surface-muted font-bold text-[10px] tracking-wide">
                  Closes
                </span>
                <input
                  type="time"
                  step="1"
                  value={closeTime}
                  onChange={(e) => setCloseTime(toAspNetTime(e.target.value))}
                  className="w-full min-w-0 h-10 border border-surface-border rounded-md px-3 text-sm bg-white"
                />
              </label>
            </div>
            <label className="block space-y-1.5 min-w-0">
              <span className="block uppercase text-surface-muted font-bold text-[10px] tracking-wide">
                Opened by
              </span>
              <input
                value={openedBy}
                onChange={(e) => setOpenedBy(e.target.value)}
                placeholder="Staff identity"
                className="w-full min-w-0 h-10 border border-surface-border rounded-md px-3 text-sm bg-white"
              />
            </label>
            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                size="sm"
                disabled={savingWindow}
                className="shrink-0"
              >
                {savingWindow
                  ? "Saving..."
                  : windowInfo?.id
                    ? "Update hours"
                    : "Open hours"}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Drug register</CardTitle>
          </CardHeader>
          <div className="px-4 sm:px-5 pb-2 text-xs text-surface-muted">
            Collated after pharmacy dispense and protocol counselling handover.
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-0">
                <TableHead>Drug</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Handover</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6}>Loading...</TableCell>
                </TableRow>
              )}
              {!isLoading && drugs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>No handed-over drugs yet.</TableCell>
                </TableRow>
              )}
              {drugs.map((row, idx) => (
                <TableRow
                  key={row.id || row.prescriptionId || `${row.drugName}-${idx}`}
                >
                  <TableCell className="font-semibold">
                    {row.drugName || "—"}
                  </TableCell>
                  <TableCell>{row.dosage || "—"}</TableCell>
                  <TableCell>{row.batchNumber || "—"}</TableCell>
                  <TableCell>
                    {row.quantityDispensed ?? row.quantity ?? "—"}
                  </TableCell>
                  <TableCell>{row.expiryDate || "—"}</TableCell>
                  <TableCell>{row.handoverAt || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
