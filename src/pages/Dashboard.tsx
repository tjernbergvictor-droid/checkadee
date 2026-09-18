import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useLists } from '../state/ListsContext';
import ListCard from '../components/ListCard';
import { PlusIcon } from '../components/icons';

export default function Dashboard() {
  const { t } = useLanguage();
  const { lists, loading } = useLists();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">{t('dashboard.title')}</h1>
          <p className="mt-1 text-muted">{t('dashboard.subtitle')}</p>
        </div>
        <Link
          to="/ny-lista"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-gold-dark"
        >
          <PlusIcon width={18} height={18} />
          {t('dashboard.newList')}
        </Link>
      </div>

      {!loading && lists.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">{t('dashboard.emptyTitle')}</h2>
          <p className="mt-2 max-w-sm text-muted">{t('dashboard.emptyBody')}</p>
          <Link
            to="/ny-lista"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-medium text-white hover:bg-gold-dark"
          >
            <PlusIcon width={18} height={18} />
            {t('dashboard.createFirst')}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => (
          <ListCard key={list.id} list={list} />
        ))}
      </div>
    </div>
  );
}
