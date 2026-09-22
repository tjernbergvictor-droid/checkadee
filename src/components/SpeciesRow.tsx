import { useLanguage } from '../i18n/LanguageContext';
import { displayName } from '../lib/displayName';
import { CalendarIcon, CheckIcon } from './icons';
import type { Observation, ReferenceSpecies } from '../types';

interface SpeciesRowProps {
  species: ReferenceSpecies;
  observation?: Observation;
  mode: 'quick' | 'detail';
  color: string;
  onToggleSeen: () => void;
  onOpenDetail: () => void;
  indent?: boolean;
  number?: number;
  dateLabel?: string;
}

export default function SpeciesRow({
  species,
  observation,
  mode,
  color,
  onToggleSeen,
  onOpenDetail,
  indent,
  number,
  dateLabel,
}: SpeciesRowProps) {
  const { language, t } = useLanguage();
  const { primary, secondary } = displayName(species, language);
  const seen = observation?.seen ?? false;
  const sightingsCount = observation?.sightings.length ?? 0;

  function handleMainClick() {
    if (mode === 'quick') onToggleSeen();
    else onOpenDetail();
  }

  return (
    <div
      className={`flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 ${indent ? 'pl-10' : ''}`}
    >
      <button
        onClick={handleMainClick}
        className="flex flex-1 items-center gap-3 text-left"
      >
        {number !== undefined && (
          <span className="w-8 shrink-0 text-right text-xs font-medium text-muted tabular-nums">{number}</span>
        )}
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
          style={{
            borderColor: seen ? color : 'var(--color-border)',
            backgroundColor: seen ? color : 'transparent',
          }}
        >
          {seen && <CheckIcon width={14} height={14} color="white" strokeWidth={3} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-medium ${indent ? 'text-sm text-ink/80' : 'text-ink'}`}>{primary}</span>
          <span className="block truncate text-xs text-muted italic">{secondary}</span>
        </span>
        {species.category && species.category !== 'ABC' && (
          <span className="shrink-0 rounded-full bg-cream-dark px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted uppercase">
            {t(`listDetail.category.${species.category}`)}
          </span>
        )}
      </button>

      {dateLabel && <span className="hidden shrink-0 text-xs text-muted sm:block">{dateLabel}</span>}

      <button
        onClick={onOpenDetail}
        className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition-colors ${
          sightingsCount > 0 ? 'text-ink' : 'text-muted/60 hover:text-muted'
        }`}
        style={sightingsCount > 0 ? { backgroundColor: `color-mix(in srgb, ${color} 14%, white)`, color } : undefined}
        aria-label={t('species.addObservation')}
      >
        <CalendarIcon width={16} height={16} />
        {sightingsCount > 0 && <span className="font-medium">{sightingsCount}</span>}
      </button>
    </div>
  );
}
