import { useLanguage } from '../i18n/LanguageContext';
import { displayName } from '../lib/displayName';
import type { ActivityEntry } from '../lib/activityStats';

export default function ThisMonthHistory({ entries }: { entries: ActivityEntry[] }) {
  const { t, language } = useLanguage();

  if (entries.length === 0) return null;

  const monthName = new Date().toLocaleDateString(language, { month: 'long' });
  const currentYear = new Date().getFullYear();

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display mb-1 text-lg font-semibold text-ink">{t('dashboard.thisMonthTitle')}</h2>
      <p className="mb-3 text-xs text-muted">{t('dashboard.thisMonthSubtitle', { month: monthName })}</p>
      <div className="space-y-3">
        {entries.slice(0, 6).map((e, i) => {
          const { primary } = displayName(e.species, language);
          const yearsAgo = currentYear - Number(e.date.slice(0, 4));
          return (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: e.list.color }} />
              <span className="min-w-0 flex-1 truncate font-medium text-ink">{primary}</span>
              <span className="shrink-0 truncate text-xs text-muted">{e.list.name}</span>
              <span className="shrink-0 rounded-full bg-cream-dark px-2 py-0.5 text-[11px] font-medium text-muted">
                {t('dashboard.yearsAgo', { count: yearsAgo })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
