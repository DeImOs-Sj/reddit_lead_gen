export function RadarMark({ active = false }: { active?: boolean }) {
  return (
    <span
      className="relative inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border"
      style={{
        boxShadow: active ? "0 0 12px color-mix(in oklch, var(--signal-sweep), transparent 35%)" : undefined,
      }}
    >
      <span
        data-active={active}
        className="radar-mark absolute inset-0.5 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, transparent 260deg, var(--signal-sweep) 340deg, transparent 360deg)",
        }}
      />
      <span className="relative size-1.5 rounded-full bg-signal-sweep" />
    </span>
  );
}
