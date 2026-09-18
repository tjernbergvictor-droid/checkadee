import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { displayName } from '../lib/displayName';
import { CloseIcon, PlusIcon, TrashIcon } from './icons';
import type { ReferenceSpecies, Sighting } from '../types';

function uid() {
  return crypto.randomUUID();
}

interface ObservationModalProps {
  species: ReferenceSpecies;
  initialSightings: Sighting[];
  initialSeen: boolean;
  color: string;
  onClose: () => void;
  onSave: (sightings: Sighting[], seen: boolean) => void;
}

export default function ObservationModal({ species, initialSightings, initialSeen, color, onClose, onSave }: ObservationModalProps) {
  const { t, language } = useLanguage();
  const { primary, secondary } = displayName(species, language);
  const [sightings, setSightings] = useState<Sighting[]>(initialSightings.length ? initialSightings : []);
  const [seenNoDetails, setSeenNoDetails] = useState(initialSeen && initialSightings.length === 0);

  function updateSighting(id: string, patch: Partial<Sighting>) {
    setSightings((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeSighting(id: string) {
    setSightings((prev) => prev.filter((s) => s.id !== id));
  }

  function addSighting() {
    setSightings((prev) => [...prev, { id: uid(), date: new Date().toISOString().slice(0, 10), location: '', notes: '' }]);
    setSeenNoDetails(false);
  }

  function handleSave() {
    const seen = sightings.length > 0 || seenNoDetails;
    onSave(sightings, seen);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-display text-lg font-semibold text-ink">{primary}</p>
            <p className="text-xs text-muted italic">{secondary}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-cream-dark" aria-label={t('common.close')}>
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {sightings.length === 0 && (
            <div className="rounded-xl bg-cream-dark/50 p-4 text-sm text-muted">
              <p>{t('observationModal.noSightings')}</p>
              <label className="mt-3 flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={seenNoDetails}
                  onChange={(e) => setSeenNoDetails(e.target.checked)}
                  className="h-4 w-4 accent-gold"
                  style={{ accentColor: color }}
                />
                <span className="text-ink">{t('observationModal.markSeenNoDetails')}</span>
              </label>
            </div>
          )}

          {sightings.map((sighting, idx) => (
            <div key={sighting.id} className="rounded-xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium tracking-wide text-muted uppercase">
                  {t('observationModal.titleNew')} {sightings.length > 1 ? `#${idx + 1}` : ''}
                </span>
                <button onClick={() => removeSighting(sighting.id)} className="text-muted hover:text-danger" aria-label={t('observationModal.delete')}>
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
                  placeholder={t('observationModal.notesPlaceholder')}
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

        <div className="flex gap-3 border-t border-border px-5 py-4">
          <button onClick={handleSave} className="flex-1 rounded-xl px-5 py-3 font-medium text-white" style={{ backgroundColor: color }}>
            {t('observationModal.save')}
          </button>
          <button onClick={onClose} className="rounded-xl border border-border px-5 py-3 font-medium text-ink hover:bg-cream-dark/40">
            {t('observationModal.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
