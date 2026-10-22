import AppLoader from "@src/components/ui/AppLoader";

export default function Loading() {
  return (
    <AppLoader
      label="Loading administration"
      showLabel
      className="min-h-[70vh]"
    />
  );
}
