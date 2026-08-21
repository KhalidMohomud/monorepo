type LoadingCircleProps = {
  label?: string;
};

// One loading indicator keeps session and page-loading feedback consistent.
export function LoadingCircle({
  label = "Loading…",
}: LoadingCircleProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 text-center"
    >
      <span className="relative flex size-11 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-4 border-[#eee3d3]" />
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#e9a12d]" />
        <span className="size-2 rounded-full bg-[#e9a12d]" />
      </span>
      <span className="text-sm font-bold text-stone-600">{label}</span>
    </div>
  );
}
