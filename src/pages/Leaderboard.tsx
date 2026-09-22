import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../state/AuthContext';
import { supabase } from '../lib/supabaseClient';
import type { SourceListId } from '../types';

interface LeaderboardRow {
  user_id: string;
  list_id: string;
  display_name: string;
  source: SourceListId;
  list_name: string;
  seen_count: number;
  last_species_name: string | null;
  last_species_date: string | null;
}

const SOURCES: SourceListId[] = ['sverige', 'vp', 'avilist'];

export default function Leaderboard() {
  const { t, language } = useLanguage();
  const { enabled, session, authLoading } = useAuth();
  const [source, setSource] = useState<SourceListId>('sverige');
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled || !supabase || !session) return;
    let cancelled = false;
    setRows(null);
    setError(false);
    supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('source', source)
      .order('seen_count', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(true);
          return;
        }
        setRows(data as LeaderboardRow[]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, session, source]);

  if (!enabled) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted">{t('sync.notConfigured')}</p>
      </div>
    );
  }

  if (!authLoading && !session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display mb-2 text-2xl font-semibold text-ink">{t('leaderboard.title')}</h1>
        <p className="text-muted">{t('leaderboard.needsLogin')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8 md:py-10">
      <h1 className="font-display text-3xl font-semibold text-ink">{t('leaderboard.title')}</h1>
      <p className="mt-1 text-muted">{t('leaderboard.subtitle')}</p>

      <div className="mt-6 flex gap-1.5">
        {SOURCES.map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              source === s ? 'bg-ink text-white' : 'bg-cream-dark text-ink/70'
            }`}
          >
            {t(`source.${s}Short`)}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
        {rows === null && !error && <p className="px-4 py-10 text-center text-sm text-muted">{t('common.loading')}</p>}
        {error && <p className="px-4 py-10 text-center text-sm text-danger">{t('leaderboard.error')}</p>}
        {rows !== null && rows.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted">{t('leaderboard.empty')}</p>
        )}
        {rows !== null &&
          rows.map((row, i) => {
            const isMe = row.user_id === session?.user.id;
            return (
              <div
                key={row.list_id}
                className={`flex items-center gap-3 border-b border-border/60 px-4 py-3 text-sm last:border-b-0 ${
                  isMe ? 'bg-gold/8' : ''
                }`}
              >
                <span className="w-6 shrink-0 text-right font-medium text-muted tabular-nums">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">
                    {row.display_name}
                    <span className="ml-1.5 text-xs font-normal text-muted">· {row.list_name}</span>
                  </p>
                  {row.last_species_name && (
                    <p className="truncate text-xs text-muted">
                      {row.last_species_name}
                      {row.last_species_date && ` · ${new Date(row.last_species_date).toLocaleDateString(language)}`}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-lg font-semibold text-ink">{row.seen_count}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
