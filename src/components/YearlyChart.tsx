import { useLanguage } from '../i18n/LanguageContext';

export default function YearlyChart({ data }: { data: { year: number; count: number }[] }) {
  const { t } = useLanguage();

  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.count));

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display mb-4 text-lg font-semibold text-ink">{t('dashboard.yearlyTitle')}</h2>
      <div className="scrollbar-thin flex items-end gap-2 overflow-x-auto pb-1" style={{ height: 140 }}>
        {data.map(({ year, count }) => (
          <div key={year} className="flex h-full min-w-[28px] flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[11px] font-medium text-ink">{count}</span>
            <div
              className="w-full rounded-t-md bg-gold"
              style={{ height: `${Math.max(4, (count / max) * 96)}px` }}
              title={`${year}: ${count}`}
            />
            <span className="text-[10px] whitespace-nowrap text-muted">{String(year).slice(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
