import type { ServiceWindow } from "@src/dto/operations";

function parseClock(value?: string | null): number | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

export function isServiceWindowOpen(windowInfo?: ServiceWindow | null): boolean {
  if (!windowInfo) return false;
  if (typeof windowInfo.isOpen === "boolean") return windowInfo.isOpen;

  const open = parseClock(windowInfo.coldCaseOpenTime || windowInfo.opensAt);
  const close = parseClock(windowInfo.coldCaseCloseTime || windowInfo.closesAt);
  if (open == null || close == null) return false;

  const now = new Date();
  const current = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  if (close > open) return current >= open && current < close;
  return current >= open || current < close;
}

export function serviceWindowLabel(windowInfo?: ServiceWindow | null): string {
  if (!windowInfo) return "Window unknown";
  const open = windowInfo.coldCaseOpenTime || windowInfo.opensAt;
  const close = windowInfo.coldCaseCloseTime || windowInfo.closesAt;
  if (open && close) return `${open.slice(0, 8)} – ${close.slice(0, 8)}`;
  if (typeof windowInfo.isOpen === "boolean" && !windowInfo.id) {
    return windowInfo.isOpen ? "Open" : "No window set";
  }
  return windowInfo.label || "Cold-case hours";
}
