import { useLanguage } from '../i18n/LanguageContext';
import { displayName } from '../lib/displayName';
import type { ActivityEntry } from '../lib/activityStats';

export default function RecentActivity({ entries }: { entries: ActivityEntry[] }) {
  const { t, language } = useLanguage();

  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display mb-3 text-lg font-semibold text-ink">{t('dashboard.recentActivity')}</h2>
      <div className="space-y-3">
        {entries.slice(0, 6).map((e, i) => {
          const { primary } = displayName(e.species, language);
          return (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: e.list.color }} />
              <span className="min-w-0 flex-1 truncate font-medium text-ink">{primary}</span>
              <span className="shrink-0 truncate text-xs text-muted">{e.list.name}</span>
              <span className="shrink-0 text-xs text-muted">{new Date(e.date).toLocaleDateString(language)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
