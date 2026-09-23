import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useLists } from '../state/ListsContext';
import { useReferenceList } from '../hooks/useReferenceList';
import { visibleMainSpecies, countSeen, applyLinkedListScope } from '../lib/listStats';
import ProgressBar from './ProgressBar';
import type { UserList } from '../types';

export default function ListCard({ list }: { list: UserList }) {
  const { t, language } = useLanguage();
  const { getList } = useLists();
  const { data } = useReferenceList(list.source);
  const linkedList = list.linkedListId ? getList(list.linkedListId) : undefined;

  const seenCount = Object.values(list.observations).filter((o) => o.seen).length;
  const isFreeform = list.source === 'avilist';

  let total = 0;
  let seen = seenCount;
  if (data && !isFreeform) {
    const main = applyLinkedListScope(visibleMainSpecies(data.species, list), list, linkedList);
    total = list.manualTotal ?? main.length;
    seen = countSeen(list, main.map((s) => s.id));
  }

  const dates = Object.values(list.observations)
    .flatMap((o) => o.sightings.map((s) => s.date))
    .filter((d): d is string => Boolean(d))
    .sort();
  const last = dates.at(-1);

  return (
    <Link
      to={`/lista/${list.id}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
      style={{ borderTopWidth: 4, borderTopColor: list.color }}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="font-display text-xl font-semibold text-ink">{list.name}</h3>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase"
          style={{ backgroundColor: `color-mix(in srgb, ${list.color} 16%, white)`, color: list.color }}
        >
          {t(`source.${list.source}Short`)}
        </span>
      </div>

      {isFreeform ? (
        <p className="mb-4 text-2xl font-semibold text-ink">
          {seen} <span className="text-sm font-normal text-muted">arter</span>
        </p>
      ) : (
        <div className="mb-4">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-ink">{seen}</span>
            <span className="text-sm text-muted">{t('dashboard.speciesCount', { seen, total })}</span>
          </div>
          <ProgressBar value={seen} total={total} color={list.color} />
        </div>
      )}

      <p className="mt-auto text-xs text-muted">
        {last ? t('dashboard.lastActivity', { date: new Date(last).toLocaleDateString(language) }) : t('dashboard.noActivity')}
      </p>
    </Link>
  );
}
