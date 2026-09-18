interface ProgressBarProps {
  value: number;
  total: number;
  color?: string;
  size?: 'sm' | 'md';
}

export default function ProgressBar({ value, total, color = 'var(--color-gold)', size = 'md' }: ProgressBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div className={`w-full overflow-hidden rounded-full bg-cream-dark ${height}`}>
      <div
        className={`h-full rounded-full transition-all duration-500`}
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
