"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { Clock, Download, Pill, RefreshCw, Users } from "lucide-react";
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
import type { ApiStaffRole } from "@src/dto/auth";
import type { DrugRegisterEntry, ServiceWindow } from "@src/dto/operations";
import type { StaffMember } from "@src/dto/staff";
import operationsService from "@src/services/operations.service";
import staffService from "@src/services/staff.service";
import { getApiErrorMessage } from "@src/utils/api-error";
import {
  getSessionStaffId,
  getStaffId,
  isUuid,
  toAspNetDate,
  toAspNetTime,
} from "@src/utils/staff";
import {
  isServiceWindowOpen,
  serviceWindowLabel,
} from "@src/utils/service-window";
import { useAuth } from "@src/context/auth-context";

const STAFF_ROLES: ApiStaffRole[] = [
  "Doctor",
  "Pharmacist",
  "Nurse",
  "Scientist",
  "ProtocolOfficer",
  "Registrar",
  "DressingNurse",
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const emptyStaffForm = {
  fullName: "",
  email: "",
  password: "",
  role: "Nurse" as ApiStaffRole,
};

export default function AdminPage() {
  const { staffId, user } = useAuth();
  const [drugs, setDrugs] = useState<DrugRegisterEntry[]>([]);
  const [windowInfo, setWindowInfo] = useState<ServiceWindow | null>(null);
  const [windowError, setWindowError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState(todayIso());
  const [openTime, setOpenTime] = useState("08:00:00");
  const [closeTime, setCloseTime] = useState("16:00:00");
  const [savingWindow, setSavingWindow] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffRoleFilter, setStaffRoleFilter] = useState<ApiStaffRole | "">("");
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [staffFormError, setStaffFormError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const openedBy =
    staffId || getSessionStaffId() || getStaffId("registrar") || "";
  const openedByLabel =
    user?.name || user?.fullName || user?.email || openedBy.slice(0, 8) || "—";

  const loadStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      const list = await staffService.list({
        role: staffRoleFilter || undefined,
      });
      setStaffList(list || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load staff"));
      setStaffList([]);
    } finally {
      setStaffLoading(false);
    }
  }, [staffRoleFilter]);

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

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

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
      setFormError("Sign in as Registrar so your staff ID can open consult hours.");
      return;
    }

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

  const handleCreateStaff = async (e: FormEvent) => {
    e.preventDefault();
    setStaffFormError(null);

    if (!staffForm.fullName.trim() || !staffForm.email.trim() || !staffForm.password) {
      setStaffFormError("Full name, email, and password are required.");
      return;
    }

    setCreatingStaff(true);
    try {
      await staffService.create({
        fullName: staffForm.fullName.trim(),
        email: staffForm.email.trim(),
        password: staffForm.password,
        role: staffForm.role,
      });
      toast.success(`${staffForm.role} account created`);
      setStaffForm(emptyStaffForm);
      await loadStaff();
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to create staff");
      setStaffFormError(message);
      toast.error(message);
    } finally {
      setCreatingStaff(false);
    }
  };

  const toggleStaffActive = async (member: StaffMember) => {
    if (!member.id) return;
    setTogglingId(member.id);
    try {
      await staffService.update(member.id, {
        isActive: !(member.isActive !== false),
      });
      toast.success(
        member.isActive === false ? "Staff activated" : "Staff deactivated"
      );
      await loadStaff();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update staff"));
    } finally {
      setTogglingId(null);
    }
  };

  const windowOpen = isServiceWindowOpen(windowInfo);

  return (
    <div className="w-full min-w-0 space-y-6">
      <PageHeader
        title="Administration"
        description="Staff accounts, cold-case consult hours, and the drug register"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void load();
                void loadStaff();
              }}
            >
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
          label="Staff accounts"
          value={staffLoading ? "—" : String(staffList.length)}
          hint={staffRoleFilter || "All roles"}
          icon={Users}
        />
        <KpiCard
          label="Drug register"
          value={isLoading ? "—" : String(drugs.length)}
          hint="After handover counselling"
          icon={Pill}
        />
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Staff</CardTitle>
        </CardHeader>
        <div className="p-4 sm:p-5 space-y-5">
          <form
            onSubmit={handleCreateStaff}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-end"
          >
            <label className="space-y-1.5 min-w-0">
              <span className="block uppercase text-surface-muted font-bold text-[10px] tracking-wide">
                Full name
              </span>
              <input
                value={staffForm.fullName}
                onChange={(e) =>
                  setStaffForm((prev) => ({ ...prev, fullName: e.target.value }))
                }
                className="w-full h-10 border border-surface-border rounded-md px-3 text-sm bg-white"
              />
            </label>
            <label className="space-y-1.5 min-w-0">
              <span className="block uppercase text-surface-muted font-bold text-[10px] tracking-wide">
                Email
              </span>
              <input
                type="email"
                value={staffForm.email}
                onChange={(e) =>
                  setStaffForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full h-10 border border-surface-border rounded-md px-3 text-sm bg-white"
              />
            </label>
            <label className="space-y-1.5 min-w-0">
              <span className="block uppercase text-surface-muted font-bold text-[10px] tracking-wide">
                Password
              </span>
              <input
                type="password"
                value={staffForm.password}
                onChange={(e) =>
                  setStaffForm((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full h-10 border border-surface-border rounded-md px-3 text-sm bg-white"
              />
            </label>
            <label className="space-y-1.5 min-w-0">
              <span className="block uppercase text-surface-muted font-bold text-[10px] tracking-wide">
                Role
              </span>
              <select
                value={staffForm.role}
                onChange={(e) =>
                  setStaffForm((prev) => ({
                    ...prev,
                    role: e.target.value as ApiStaffRole,
                  }))
                }
                className="w-full h-10 border border-surface-border rounded-md px-3 text-sm bg-white"
              >
                {STAFF_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" size="sm" disabled={creatingStaff} className="h-10">
              {creatingStaff ? "Creating..." : "Create staff"}
            </Button>
          </form>
          {staffFormError && (
            <p className="text-[#C62828] bg-red-50 border border-red-200 rounded-md p-3 text-xs">
              {staffFormError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs">
              <span className="uppercase font-bold text-surface-muted tracking-wide">
                Filter
              </span>
              <select
                value={staffRoleFilter}
                onChange={(e) =>
                  setStaffRoleFilter((e.target.value as ApiStaffRole) || "")
                }
                className="h-9 border border-surface-border rounded-md px-2 text-sm bg-white"
              >
                <option value="">All roles</option>
                {STAFF_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-0">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffLoading && (
                <TableRow>
                  <TableCell colSpan={5}>Loading staff...</TableCell>
                </TableRow>
              )}
              {!staffLoading && staffList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>No staff accounts yet.</TableCell>
                </TableRow>
              )}
              {staffList.map((member) => {
                const active = member.isActive !== false;
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-semibold">
                      {member.fullName || "—"}
                    </TableCell>
                    <TableCell>{member.email || "—"}</TableCell>
                    <TableCell>{member.role || "—"}</TableCell>
                    <TableCell>{active ? "Active" : "Inactive"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={togglingId === member.id}
                        onClick={() => void toggleStaffActive(member)}
                      >
                        {togglingId === member.id
                          ? "..."
                          : active
                            ? "Deactivate"
                            : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

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
            <div className="space-y-1.5 min-w-0">
              <span className="block uppercase text-surface-muted font-bold text-[10px] tracking-wide">
                Opened by
              </span>
              <p className="h-10 flex items-center px-3 text-sm border border-surface-border rounded-md bg-surface-muted/20 text-ink truncate">
                {openedByLabel}
              </p>
            </div>
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
