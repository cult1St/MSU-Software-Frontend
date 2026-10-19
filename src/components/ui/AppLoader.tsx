import { Cross } from "lucide-react";
import { cn } from "@src/lib/utils";

type AppLoaderProps = {
  className?: string;
  label?: string;
  fullScreen?: boolean;
};

export default function AppLoader({
  className,
  label = "Loading",
  fullScreen = false,
}: AppLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-ink",
        fullScreen ? "min-h-screen w-full bg-surface" : "flex-1 min-h-[12rem] w-full",
        className
      )}
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-2xl bg-brand-red/20 animate-brand-ring" />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-brand-red text-white shadow-md animate-brand-pop">
          <Cross className="h-6 w-6" strokeWidth={2.25} />
        </span>
      </div>

      <div className="flex items-center gap-1.5" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-brand-dot [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-brand-dot [animation-delay:160ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-brand-dot [animation-delay:320ms]" />
      </div>

      <span className="sr-only">{label}</span>
    </div>
  );
}
