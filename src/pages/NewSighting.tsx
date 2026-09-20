import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useLists } from '../state/ListsContext';
import { loadReferenceList } from '../data/referenceData';
import { displayName } from '../lib/displayName';
import { CheckIcon, PlusIcon, SearchIcon, TrashIcon, XCircleIcon } from '../components/icons';
import type { ReferenceListFile, ReferenceSpecies, Sighting, SourceListId } from '../types';

function uid() {
  return crypto.randomUUID();
}

export default function NewSighting() {
  const { t, language } = useLanguage();
  const { lists, setSightings } = useLists();
  const navigate = useNavigate();

  const uniqueSources = useMemo(() => [...new Set(lists.map((l) => l.source))], [lists]);
  const [refData, setRefData] = useState<Partial<Record<SourceListId, ReferenceListFile>>>({});

  useEffect(() => {
    uniqueSources.forEach((source) => {
      loadReferenceList(source).then((data) => {
        setRefData((prev) => ({ ...prev, [source]: data }));
      });
    });
  }, [uniqueSources]);

  const [query, setQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<ReferenceSpecies | null>(null);
  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(new Set());
  const [sightings, setSightingsState] = useState<Sighting[]>([]);
  const [seenNoDetails, setSeenNoDetails] = useState(true);
  const [done, setDone] = useState(false);

  const q = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (q.length < 2) return [];
    const byId = new Map<string, { species: ReferenceSpecies; sources: Set<SourceListId> }>();
    for (const source of uniqueSources) {
      const data = refData[source];
      if (!data) continue;
      for (const s of data.species) {
        if (s.rank === 'subspecies') continue;
        const matches =
          s.nameSv?.toLowerCase().includes(q) || s.nameEn.toLowerCase().includes(q) || s.scientificName.toLowerCase().includes(q);
        if (!matches) continue;
        const existing = byId.get(s.id);
        if (existing) existing.sources.add(source);
        else byId.set(s.id, { species: s, sources: new Set([source]) });
      }
    }
    return [...byId.values()].slice(0, 25);
  }, [q, uniqueSources, refData]);

  const applicableLists = useMemo(() => {
    if (!selectedSpecies) return [];
    return lists.filter((l) => refData[l.source]?.species.some((s) => s.id === selectedSpecies.id));
  }, [selectedSpecies, lists, refData]);

  function selectSpecies(species: ReferenceSpecies) {
    setSelectedSpecies(species);
    setSelectedListIds(new Set(lists.filter((l) => refData[l.source]?.species.some((s) => s.id === species.id)).map((l) => l.id)));
    setSightingsState([]);
    setSeenNoDetails(true);
    setQuery('');
  }

  function toggleListId(id: string) {
    setSelectedListIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addSighting() {
    setSightingsState((prev) => [...prev, { id: uid(), date: new Date().toISOString().slice(0, 10), location: '', notes: '' }]);
    setSeenNoDetails(false);
  }

  function updateSighting(id: string, patch: Partial<Sighting>) {
    setSightingsState((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeSighting(id: string) {
    setSightingsState((prev) => prev.filter((s) => s.id !== id));
  }

  function handleSave() {
    if (!selectedSpecies) return;
    const seen = sightings.length > 0 || seenNoDetails;
    for (const listId of selectedListIds) {
      const list = lists.find((l) => l.id === listId);
      const existing = list?.observations[selectedSpecies.id]?.sightings ?? [];
      setSightings(listId, selectedSpecies.id, [...existing, ...sightings], seen);
    }
    setDone(true);
  }

  if (lists.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted">{t('newSighting.noLists')}</p>
      </div>
    );
  }

  if (done && selectedSpecies) {
    const { primary } = displayName(selectedSpecies, language);
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mb-4 flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
            <CheckIcon width={28} height={28} strokeWidth={3} />
          </span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">{t('newSighting.savedTitle', { name: primary })}</h1>
        <p className="mt-2 text-muted">
          {selectedListIds.size === 1
            ? t('newSighting.savedBodyOne')
            : t('newSighting.savedBodyMany', { count: selectedListIds.size })}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              setSelectedSpecies(null);
              setDone(false);
            }}
            className="rounded-xl bg-gold px-5 py-2.5 font-medium text-white hover:bg-gold-dark"
          >
            {t('newSighting.addAnotherSpecies')}
          </button>
          <button onClick={() => navigate('/')} className="rounded-xl border border-border px-5 py-2.5 font-medium text-ink">
            {t('listDetail.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8 md:py-10">
      <h1 className="font-display text-3xl font-semibold text-ink">{t('newSighting.title')}</h1>
      <p className="mt-1 text-muted">{t('newSighting.subtitle')}</p>

      {!selectedSpecies ? (
        <div className="mt-6">
          <div className="relative">
            <SearchIcon width={16} height={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('newSighting.searchPlaceholder')}
              className="w-full rounded-xl border border-border bg-card py-3 pr-9 pl-9 text-ink outline-none focus:border-gold"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-ink">
                <XCircleIcon width={16} height={16} />
              </button>
            )}
          </div>

          {q.length >= 2 && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
              {searchResults.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted">{t('listDetail.noResults')}</p>}
              {searchResults.map(({ species }) => {
                const { primary, secondary } = displayName(species, language);
                return (
                  <button
                    key={species.id}
                    onClick={() => selectSpecies(species)}
                    className="flex w-full flex-col items-start border-b border-border/60 px-4 py-3 text-left last:border-b-0 hover:bg-cream-dark/30"
                  >
                    <span className="font-medium text-ink">{primary}</span>
                    <span className="text-xs text-muted italic">{secondary}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
            <div>
              <p className="font-display text-lg font-semibold text-ink">{displayName(selectedSpecies, language).primary}</p>
              <p className="text-xs text-muted italic">{displayName(selectedSpecies, language).secondary}</p>
            </div>
            <button onClick={() => setSelectedSpecies(null)} className="text-sm font-medium text-gold-dark hover:underline">
              {t('newSighting.change')}
            </button>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink">{t('newSighting.targetLists')}</p>
            <div className="space-y-2">
              {applicableLists.map((list) => (
                <label
                  key={list.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 has-[:checked]:border-gold"
                >
                  <input
                    type="checkbox"
                    checked={selectedListIds.has(list.id)}
                    onChange={() => toggleListId(list.id)}
                    className="h-4 w-4 accent-gold"
                  />
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: list.color }} />
                  <span className="font-medium text-ink">{list.name}</span>
                  <span className="ml-auto text-xs text-muted uppercase">{t(`source.${list.source}Short`)}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink">{t('observationModal.titleEdit')}</p>
            {sightings.length === 0 && (
              <label className="mb-3 flex items-center gap-2.5 rounded-xl bg-cream-dark/50 p-4 text-sm">
                <input
                  type="checkbox"
                  checked={seenNoDetails}
                  onChange={(e) => setSeenNoDetails(e.target.checked)}
                  className="h-4 w-4 accent-gold"
                />
                <span className="text-ink">{t('observationModal.markSeenNoDetails')}</span>
              </label>
            )}

            {sightings.map((sighting, idx) => (
              <div key={sighting.id} className="mb-3 rounded-xl border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium tracking-wide text-muted uppercase">
                    {t('observationModal.titleNew')} {sightings.length > 1 ? `#${idx + 1}` : ''}
                  </span>
                  <button onClick={() => removeSighting(sighting.id)} className="text-muted hover:text-danger">
                    <TrashIcon width={16} height={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">{t('observationModal.date')}</label>
                    <input
                      type="date"
                      value={sighting.date ?? ''}
                      onChange={(e) => updateSighting(sighting.id, { date: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">{t('observationModal.location')}</label>
                    <input
                      type="text"
                      value={sighting.location ?? ''}
                      onChange={(e) => updateSighting(sighting.id, { location: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gold"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-medium text-muted">{t('observationModal.notes')}</label>
                  <textarea
                    value={sighting.notes ?? ''}
                    onChange={(e) => updateSighting(sighting.id, { notes: e.target.value })}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gold"
                  />
                </div>
              </div>
            ))}

            <button
              onClick={addSighting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-ink hover:border-gold hover:text-gold-dark"
            >
              <PlusIcon width={16} height={16} />
              {t('observationModal.addAnother')}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={selectedListIds.size === 0}
              className="flex-1 rounded-xl bg-gold px-5 py-3 font-medium text-white hover:bg-gold-dark disabled:opacity-50"
            >
              {selectedListIds.size === 1 ? t('newSighting.saveOne') : t('newSighting.saveMany', { count: selectedListIds.size })}
            </button>
            <button onClick={() => navigate('/')} className="rounded-xl border border-border px-5 py-3 font-medium text-ink">
              {t('newList.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
