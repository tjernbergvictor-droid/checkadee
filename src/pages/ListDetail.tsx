import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useLists } from '../state/ListsContext';
import { useReferenceList } from '../hooks/useReferenceList';
import { visibleMainSpecies, countSeen, subspeciesOf, applyLinkedListScope } from '../lib/listStats';
import { groupSpecies } from '../lib/groupSpecies';
import { displayName } from '../lib/displayName';
import SpeciesRow from '../components/SpeciesRow';
import ObservationModal from '../components/ObservationModal';
import ImportModal from '../components/ImportModal';
import ProgressBar from '../components/ProgressBar';
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  SearchIcon,
  TrashIcon,
  UploadIcon,
  XCircleIcon,
} from '../components/icons';
import type { MatchedImportRow } from '../lib/importParser';
import type { ReferenceSpecies, Sighting } from '../types';

type SeenFilter = 'all' | 'seen' | 'unseen';
type ViewMode = 'grouped' | 'chronological';

export default function ListDetail() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { lists, getList, updateListMeta, deleteList, toggleSeen, setSightings } = useLists();

  const list = listId ? getList(listId) : undefined;
  const linkedList = list?.linkedListId ? getList(list.linkedListId) : undefined;
  const { data, loading } = useReferenceList(list?.source ?? 'vp');

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'quick' | 'detail'>('quick');
  const [seenFilter, setSeenFilter] = useState<SeenFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('chronological');
  const [showSubspecies, setShowSubspecies] = useState(false);
  const [collapsedOrders, setCollapsedOrders] = useState<Set<string>>(new Set());
  const [detailSpecies, setDetailSpecies] = useState<ReferenceSpecies | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [pendingUncheck, setPendingUncheck] = useState<ReferenceSpecies | null>(null);

  const isFreeform = list?.source === 'avilist';
  const q = query.trim().toLowerCase();

  const mainSpecies = useMemo(() => {
    if (!data || !list) return [];
    const base = visibleMainSpecies(data.species, list);
    return applyLinkedListScope(base, list, linkedList);
  }, [data, list, linkedList]);
  const computedTotal = mainSpecies.length;
  const total = list?.manualTotal ?? computedTotal;
  const seenCount = list ? countSeen(list, mainSpecies.map((s) => s.id)) : 0;
  const [editingTotal, setEditingTotal] = useState(false);
  const [totalInput, setTotalInput] = useState('');
  const [editingLink, setEditingLink] = useState(false);

  function matchesQuery(s: ReferenceSpecies) {
    if (!q) return true;
    return (
      s.nameSv?.toLowerCase().includes(q) ||
      s.nameEn.toLowerCase().includes(q) ||
      s.scientificName.toLowerCase().includes(q)
    );
  }

  const browseFiltered = useMemo(() => {
    if (isFreeform || !list) return [];
    return mainSpecies.filter((s) => {
      if (!matchesQuery(s)) return false;
      const seen = list.observations[s.id]?.seen ?? false;
      if (seenFilter === 'seen' && !seen) return false;
      if (seenFilter === 'unseen' && seen) return false;
      return true;
    });
  }, [mainSpecies, list, q, seenFilter, isFreeform]);

  const groups = useMemo(() => groupSpecies(browseFiltered), [browseFiltered]);

  const chronological = useMemo(() => {
    if (isFreeform || !list) return { dated: [] as { species: ReferenceSpecies; date: string }[], undated: [] as ReferenceSpecies[] };
    const dated: { species: ReferenceSpecies; date: string }[] = [];
    const undated: ReferenceSpecies[] = [];
    for (const s of mainSpecies) {
      if (!matchesQuery(s)) continue;
      const obs = list.observations[s.id];
      if (!obs?.seen) continue;
      const dates = obs.sightings.map((x) => x.date).filter((d): d is string => Boolean(d)).sort();
      if (dates[0]) dated.push({ species: s, date: dates[0] });
      else undated.push(s);
    }
    dated.sort((a, b) => b.date.localeCompare(a.date));
    return { dated, undated };
  }, [isFreeform, list, mainSpecies, q]);

  const searchResults = useMemo(() => {
    if (!isFreeform || !data || q.length < 2) return [];
    return data.species.filter(matchesQuery).slice(0, 40);
  }, [isFreeform, data, q]);

  const yourSpecies = useMemo(() => {
    if (!isFreeform || !data || !list) return [];
    return Object.entries(list.observations)
      .filter(([, o]) => o.seen)
      .map(([id]) => data.species.find((s) => s.id === id))
      .filter((s): s is ReferenceSpecies => Boolean(s))
      .sort((a, b) => displayName(a, language).primary.localeCompare(displayName(b, language).primary));
  }, [isFreeform, data, list, language]);

  if (!list) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted">List not found.</p>
        <Link to="/" className="mt-4 inline-block text-gold-dark underline">
          {t('listDetail.back')}
        </Link>
      </div>
    );
  }

  function toggleOrder(order: string) {
    setCollapsedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(order)) next.delete(order);
      else next.add(order);
      return next;
    });
  }

  function openDetail(species: ReferenceSpecies) {
    setDetailSpecies(species);
  }

  function requestToggleSeen(species: ReferenceSpecies) {
    if (!list) return;
    const isSeen = list.observations[species.id]?.seen ?? false;
    if (isSeen) {
      setPendingUncheck(species);
    } else {
      toggleSeen(list.id, species.id);
    }
  }

  function handleModalSave(sightings: Parameters<typeof setSightings>[2], seen: boolean) {
    if (!list || !detailSpecies) return;
    setSightings(list.id, detailSpecies.id, sightings, seen);
    setDetailSpecies(null);
  }

  function handleImportConfirm(rows: MatchedImportRow[]) {
    if (!list) return;
    const grouped = new Map<string, { existing: Sighting[]; additions: Sighting[] }>();
    for (const row of rows) {
      const id = row.species.id;
      if (!grouped.has(id)) {
        grouped.set(id, { existing: list.observations[id]?.sightings ?? [], additions: [] });
      }
      if (row.date || row.location || row.notes) {
        grouped.get(id)!.additions.push({ id: crypto.randomUUID(), date: row.date, location: row.location, notes: row.notes });
      }
    }
    for (const [speciesId, entry] of grouped) {
      setSightings(list.id, speciesId, [...entry.existing, ...entry.additions], true);
    }
    setShowImport(false);
  }

  function renderSpeciesWithSubspecies(s: ReferenceSpecies) {
    const l = list!;
    const subs = l.source === 'sverige' && showSubspecies && data ? subspeciesOf(data.species, s.id) : [];
    return (
      <div key={s.id}>
        <SpeciesRow
          species={s}
          observation={l.observations[s.id]}
          mode={mode}
          color={l.color}
          onToggleSeen={() => requestToggleSeen(s)}
          onOpenDetail={() => openDetail(s)}
        />
        {subs.map((sub) => (
          <SpeciesRow
            key={sub.id}
            species={sub}
            observation={l.observations[sub.id]}
            mode={mode}
            color={l.color}
            onToggleSeen={() => requestToggleSeen(sub)}
            onOpenDetail={() => openDetail(sub)}
            indent
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeftIcon width={16} height={16} />
          {t('listDetail.back')}
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
          >
            <UploadIcon width={15} height={15} />
            {t('listDetail.importList')}
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-danger"
          >
            <TrashIcon width={15} height={15} />
            {t('listDetail.deleteList')}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-5" style={{ borderTopWidth: 4, borderTopColor: list.color }}>
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-ink">{list.name}</h1>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase"
            style={{ backgroundColor: `color-mix(in srgb, ${list.color} 16%, white)`, color: list.color }}
          >
            {t(`source.${list.source}Short`)}
          </span>
        </div>
        {isFreeform ? (
          <p className="mt-2 text-sm text-muted">{yourSpecies.length} arter</p>
        ) : (
          <div className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              {editingTotal ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const n = parseInt(totalInput, 10);
                    updateListMeta(list.id, { manualTotal: Number.isFinite(n) && n > 0 ? n : undefined });
                    setEditingTotal(false);
                  }}
                  className="flex flex-wrap items-center gap-1.5"
                >
                  <span className="font-medium text-ink">{seenCount}</span>
                  <span className="text-muted">{t('listDetail.of')}</span>
                  <input
                    type="number"
                    min={1}
                    autoFocus
                    value={totalInput}
                    onChange={(e) => setTotalInput(e.target.value)}
                    className="w-20 rounded-lg border border-border px-2 py-1 text-sm outline-none focus:border-gold"
                  />
                  <button type="submit" className="text-xs font-medium text-gold-dark underline">
                    {t('common.save')}
                  </button>
                  <button type="button" onClick={() => setEditingTotal(false)} className="text-xs text-muted underline">
                    {t('common.cancel')}
                  </button>
                </form>
              ) : (
                <span className="flex flex-wrap items-center gap-1.5 font-medium text-ink">
                  {t('listDetail.speciesSeenOf', { seen: seenCount, total })}
                  <button
                    onClick={() => {
                      setTotalInput(String(total));
                      setEditingTotal(true);
                    }}
                    className="text-muted hover:text-ink"
                    aria-label={t('listDetail.editTotal')}
                  >
                    <PencilIcon width={13} height={13} />
                  </button>
                  {list.manualTotal !== undefined && (
                    <button
                      onClick={() => updateListMeta(list.id, { manualTotal: undefined })}
                      className="text-[11px] text-muted underline"
                    >
                      {t('listDetail.resetTotal', { count: computedTotal })}
                    </button>
                  )}
                </span>
              )}
              <span className="text-muted">{total > 0 ? Math.round((seenCount / total) * 100) : 0}%</span>
            </div>
            <ProgressBar value={seenCount} total={total} color={list.color} />
          </div>
        )}

        {editingLink ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted">{t('listDetail.linkedTo')}</span>
            <select
              value={list.linkedListId ?? ''}
              onChange={(e) => {
                updateListMeta(list.id, { linkedListId: e.target.value || undefined });
                setEditingLink(false);
              }}
              className="rounded-lg border border-border px-2 py-1 text-xs outline-none focus:border-gold"
            >
              <option value="">{t('newList.linkedListNone')}</option>
              {lists
                .filter((l) => l.id !== list.id)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>
            <button onClick={() => setEditingLink(false)} className="text-muted underline">
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            {linkedList ? (
              <span>
                {t('listDetail.linkedTo')} <strong className="text-ink">{linkedList.name}</strong>
              </span>
            ) : (
              <span>{t('listDetail.notLinked')}</span>
            )}
            <button onClick={() => setEditingLink(true)} className="text-muted hover:text-ink" aria-label={t('listDetail.editLink')}>
              <PencilIcon width={11} height={11} />
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <SearchIcon width={16} height={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('listDetail.searchPlaceholder')}
            className="w-full rounded-xl border border-border bg-card py-2.5 pr-9 pl-9 text-sm outline-none focus:border-gold"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted hover:text-ink">
              <XCircleIcon width={16} height={16} />
            </button>
          )}
        </div>

        <div className="flex overflow-hidden rounded-xl border border-border">
          <button
            onClick={() => setMode('quick')}
            className={`px-3 py-2 text-xs font-medium ${mode === 'quick' ? 'bg-gold text-white' : 'bg-card text-ink'}`}
          >
            {t('listDetail.quickMode')}
          </button>
          <button
            onClick={() => setMode('detail')}
            className={`px-3 py-2 text-xs font-medium ${mode === 'detail' ? 'bg-gold text-white' : 'bg-card text-ink'}`}
          >
            {t('listDetail.detailMode')}
          </button>
        </div>
      </div>

      <p className="mb-4 text-xs text-muted">{mode === 'quick' ? t('listDetail.modeHintQuick') : t('listDetail.modeHintDetail')}</p>

      {!isFreeform && (
        <div className="mb-5 flex flex-wrap items-center gap-4">
          <div className="flex overflow-hidden rounded-full border border-border">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1 text-xs font-medium ${viewMode === 'grouped' ? 'bg-ink text-white' : 'bg-card text-ink/70'}`}
            >
              {t('listDetail.viewGrouped')}
            </button>
            <button
              onClick={() => setViewMode('chronological')}
              className={`px-3 py-1 text-xs font-medium ${viewMode === 'chronological' ? 'bg-ink text-white' : 'bg-card text-ink/70'}`}
            >
              {t('listDetail.viewChronological')}
            </button>
          </div>

          {viewMode === 'grouped' && (
            <div className="flex gap-1.5">
              {(['all', 'seen', 'unseen'] as SeenFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setSeenFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    seenFilter === f ? 'bg-ink text-white' : 'bg-cream-dark text-ink/70'
                  }`}
                >
                  {t(`listDetail.filter${f === 'all' ? 'All' : f === 'seen' ? 'Seen' : 'Unseen'}`)}
                </button>
              ))}
            </div>
          )}

          {list.source === 'sverige' && (
            <label className="flex items-center gap-2 text-xs text-ink">
              <input
                type="checkbox"
                checked={Boolean(list.includeCategoryDE)}
                onChange={(e) => updateListMeta(list.id, { includeCategoryDE: e.target.checked })}
                className="h-3.5 w-3.5 accent-gold"
              />
              {t('listDetail.showCategoryDE')}
            </label>
          )}

          {list.source === 'sverige' && (
            <label className="flex items-center gap-2 text-xs text-ink">
              <input
                type="checkbox"
                checked={showSubspecies}
                onChange={(e) => setShowSubspecies(e.target.checked)}
                className="h-3.5 w-3.5 accent-gold"
              />
              {t('listDetail.showSubspecies')}
            </label>
          )}
        </div>
      )}

      {loading && <p className="py-10 text-center text-sm text-muted">{t('common.loading')}</p>}

      {!loading && !isFreeform && viewMode === 'chronological' && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {chronological.dated.length === 0 && chronological.undated.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-muted">{t('listDetail.noResults')}</p>
          )}
          {chronological.dated.map(({ species: s, date }, i) => (
            <SpeciesRow
              key={s.id}
              species={s}
              observation={list.observations[s.id]}
              mode={mode}
              color={list.color}
              onToggleSeen={() => requestToggleSeen(s)}
              onOpenDetail={() => openDetail(s)}
              number={chronological.dated.length + chronological.undated.length - i}
              dateLabel={date}
            />
          ))}
          {chronological.undated.length > 0 && (
            <>
              <div className="border-y border-border bg-cream-dark/60 px-4 py-2 text-xs font-semibold tracking-wide text-ink/80 uppercase">
                {t('listDetail.undated')}
              </div>
              {chronological.undated.map((s, i) => (
                <SpeciesRow
                  key={s.id}
                  species={s}
                  observation={list.observations[s.id]}
                  mode={mode}
                  color={list.color}
                  onToggleSeen={() => requestToggleSeen(s)}
                  onOpenDetail={() => openDetail(s)}
                  number={chronological.undated.length - i}
                />
              ))}
            </>
          )}
        </div>
      )}

      {!loading && !isFreeform && viewMode === 'grouped' && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {groups.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted">{t('listDetail.noResults')}</p>}
          {groups.map((g) => {
            const collapsed = collapsedOrders.has(g.order);
            return (
              <div key={g.order}>
                <button
                  onClick={() => toggleOrder(g.order)}
                  className="flex w-full items-center gap-2 border-b border-border bg-cream-dark/60 px-4 py-2.5 text-left"
                >
                  {collapsed ? <ChevronRightIcon width={14} height={14} /> : <ChevronDownIcon width={14} height={14} />}
                  <span className="text-xs font-semibold tracking-wide text-ink/80 uppercase">
                    {language === 'sv' ? g.orderSv || g.order : g.order}
                  </span>
                </button>
                {!collapsed &&
                  g.families.map((fam) => (
                    <div key={fam.family}>
                      <div className="border-b border-border/60 bg-cream/60 px-4 py-1.5 text-[11px] font-medium text-muted">
                        {language === 'sv' ? fam.familySv || fam.family : fam.familyEn || fam.family}
                      </div>
                      {fam.species.map(renderSpeciesWithSubspecies)}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      )}

      {!loading && isFreeform && (
        <div className="space-y-6">
          {q.length >= 2 && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border bg-cream-dark/60 px-4 py-2 text-xs font-semibold tracking-wide text-ink/80 uppercase">
                {t('listDetail.filterAll')}
              </div>
              {searchResults.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted">{t('listDetail.noResults')}</p>}
              {searchResults.map((s) => (
                <SpeciesRow
                  key={s.id}
                  species={s}
                  observation={list.observations[s.id]}
                  mode={mode}
                  color={list.color}
                  onToggleSeen={() => requestToggleSeen(s)}
                  onOpenDetail={() => openDetail(s)}
                />
              ))}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-ink/60 uppercase">{list.name}</p>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {yourSpecies.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">{t('listDetail.noResults')}</p>
              ) : (
                yourSpecies.map((s) => (
                  <SpeciesRow
                    key={s.id}
                    species={s}
                    observation={list.observations[s.id]}
                    mode={mode}
                    color={list.color}
                    onToggleSeen={() => requestToggleSeen(s)}
                    onOpenDetail={() => openDetail(s)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {detailSpecies && (
        <ObservationModal
          species={detailSpecies}
          initialSightings={list.observations[detailSpecies.id]?.sightings ?? []}
          initialSeen={list.observations[detailSpecies.id]?.seen ?? false}
          color={list.color}
          onClose={() => setDetailSpecies(null)}
          onSave={handleModalSave}
        />
      )}

      {showImport && data && (
        <ImportModal species={data.species} color={list.color} onClose={() => setShowImport(false)} onImport={handleImportConfirm} />
      )}

      {pendingUncheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setPendingUncheck(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold text-ink">
              {t('listDetail.uncheckConfirmTitle', { name: displayName(pendingUncheck, language).primary })}
            </h3>
            <p className="mt-2 text-sm text-muted">{t('listDetail.uncheckConfirmBody')}</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  toggleSeen(list.id, pendingUncheck.id);
                  setPendingUncheck(null);
                }}
                className="flex-1 rounded-xl bg-danger px-4 py-2.5 font-medium text-white"
              >
                {t('listDetail.uncheckConfirmButton')}
              </button>
              <button onClick={() => setPendingUncheck(null)} className="rounded-xl border border-border px-4 py-2.5 font-medium text-ink">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmDelete(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold text-ink">{t('listDetail.deleteConfirmTitle', { name: list.name })}</h3>
            <p className="mt-2 text-sm text-muted">{t('listDetail.deleteConfirmBody')}</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  deleteList(list.id);
                  navigate('/');
                }}
                className="flex-1 rounded-xl bg-danger px-4 py-2.5 font-medium text-white"
              >
                {t('listDetail.deleteList')}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="rounded-xl border border-border px-4 py-2.5 font-medium text-ink">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
