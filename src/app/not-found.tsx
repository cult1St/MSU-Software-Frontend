import Link from "next/link";
import { ArrowLeft, Cross, House } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-surface px-4 text-ink">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(208,52,44,0.12), transparent 42%), radial-gradient(circle at 85% 75%, rgba(208,52,44,0.08), transparent 45%), linear-gradient(180deg, #f3f3f4 0%, #ececee 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(28,28,30,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(28,28,30,0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-surface-border bg-white p-8 shadow-sm sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-red text-white">
            <Cross className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-bold tracking-tight text-ink">The Gilead</p>
            <p className="text-xs text-surface-muted">Medical Unit Portal</p>
          </div>
        </div>

        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-red">
          Error 404
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-surface-muted sm:text-[15px]">
          The page you requested is unavailable or may have been moved. Return
          to the portal to continue clinical operations.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-reddark"
          >
            <House className="h-4 w-4" />
            Go home
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-surface-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface"
          >
            <ArrowLeft className="h-4 w-4" />
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
