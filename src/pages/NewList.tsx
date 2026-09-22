import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useLists } from '../state/ListsContext';
import ColorSwatchPicker from '../components/ColorSwatchPicker';
import { LIST_COLORS, type SourceListId } from '../types';
import { CheckIcon } from '../components/icons';

const SOURCES: { id: SourceListId; titleKey: string; descKey: string }[] = [
  { id: 'sverige', titleKey: 'source.sverige', descKey: 'newList.sourceSverigeDesc' },
  { id: 'vp', titleKey: 'source.vp', descKey: 'newList.sourceVpDesc' },
  { id: 'avilist', titleKey: 'source.avilist', descKey: 'newList.sourceAvilistDesc' },
];

export default function NewList() {
  const { t } = useLanguage();
  const { createList, lists } = useLists();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(LIST_COLORS[0]);
  const [source, setSource] = useState<SourceListId>('sverige');
  const [includeCategoryDE, setIncludeCategoryDE] = useState(false);
  const [linkedListId, setLinkedListId] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('newList.nameRequired'));
      return;
    }
    const list = createList({
      name: name.trim(),
      color,
      source,
      includeCategoryDE: source === 'sverige' ? includeCategoryDE : undefined,
      linkedListId: linkedListId || undefined,
    });
    navigate(`/lista/${list.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8 md:py-10">
      <h1 className="font-display text-3xl font-semibold text-ink">{t('newList.title')}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        <div>
          <label className="mb-2 block text-sm font-medium text-ink">{t('newList.nameLabel')}</label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder={t('newList.namePlaceholder')}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          />
          {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink">{t('newList.colorLabel')}</label>
          <ColorSwatchPicker value={color} onChange={setColor} />
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-ink">{t('newList.sourceLabel')}</label>
          <div className="space-y-3">
            {SOURCES.map((s) => {
              const selected = source === s.id;
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setSource(s.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    selected ? 'border-gold bg-gold/8' : 'border-border bg-card hover:border-gold/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">{t(s.titleKey)}</span>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        selected ? 'border-gold bg-gold' : 'border-border'
                      }`}
                    >
                      {selected && <CheckIcon width={12} height={12} color="white" strokeWidth={3} />}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{t(s.descKey)}</p>
                </button>
              );
            })}
          </div>

          {source === 'sverige' && (
            <label className="mt-3 flex items-start gap-2.5 rounded-xl border border-border bg-cream-dark/40 p-3.5 text-sm">
              <input
                type="checkbox"
                checked={includeCategoryDE}
                onChange={(e) => setIncludeCategoryDE(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-gold"
              />
              <span>
                <span className="font-medium text-ink">{t('listDetail.showCategoryDE')}</span>
                <span className="block text-muted">{t('listDetail.categoryDEHint')}</span>
              </span>
            </label>
          )}
        </div>

        {lists.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-medium text-ink">{t('newList.linkedListLabel')}</label>
            <p className="mb-2 text-xs text-muted">{t('newList.linkedListHint')}</p>
            <select
              value={linkedListId}
              onChange={(e) => setLinkedListId(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-ink outline-none focus:border-gold"
            >
              <option value="">{t('newList.linkedListNone')}</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="rounded-xl bg-charcoal/5 p-4">
          <p className="text-sm font-medium text-ink">{t('newList.inputModeInfoTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('newList.inputModeInfoBody')}</p>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="flex-1 rounded-xl bg-gold px-5 py-3 font-medium text-white hover:bg-gold-dark">
            {t('newList.create')}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-border px-5 py-3 font-medium text-ink hover:bg-cream-dark/40"
          >
            {t('newList.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
