interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
}

export function StatBar({ label, value, max, color = 'bg-red-600' }: StatBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-parchment mb-0.5">
        <span>{label}</span>
        <span>{value.toFixed(2)}/{max}</span>
      </div>
      <div className="h-2 bg-cosmic-light rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
