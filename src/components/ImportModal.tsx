import { useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { displayName } from '../lib/displayName';
import {
  buildSpeciesIndex,
  generateTemplateCSV,
  matchSpecies,
  parseCSV,
  rowsToImportRows,
  suggestMatch,
  type ImportRow,
  type MatchedImportRow,
  type SuggestedMatch,
} from '../lib/importParser';
import { CloseIcon, DownloadIcon, UploadIcon, CheckIcon, XCircleIcon } from './icons';
import type { ReferenceSpecies } from '../types';

interface ImportModalProps {
  species: ReferenceSpecies[];
  color: string;
  onClose: () => void;
  onImport: (rows: MatchedImportRow[]) => void;
}

type Step = 'upload' | 'preview' | 'error';

interface UnmatchedEntry {
  row: ImportRow;
  suggestion?: SuggestedMatch;
}

export default function ImportModal({ species, color, onClose, onImport }: ImportModalProps) {
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [matched, setMatched] = useState<MatchedImportRow[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  function downloadTemplate() {
    const csv = generateTemplateCSV(language);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'checkadee-mall.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(file: File) {
    setBusy(true);
    setErrorMsg('');
    try {
      let table: string[][];
      const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
      if (isCsv) {
        const text = await file.text();
        table = parseCSV(text);
      } else {
        const XLSX = await import('xlsx');
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        table = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as string[][];
      }

      const { rows, error } = rowsToImportRows(table);
      if (error) {
        setErrorMsg(t('importModal.errorNoNameColumn'));
        setStep('error');
        setBusy(false);
        return;
      }

      const index = buildSpeciesIndex(species);
      const matchedRows: MatchedImportRow[] = [];
      const unmatchedEntries: UnmatchedEntry[] = [];
      for (const row of rows) {
        const found = matchSpecies(row.rawName, index);
        if (found) matchedRows.push({ ...row, species: found });
        else unmatchedEntries.push({ row, suggestion: suggestMatch(row.rawName, species) });
      }
      setMatched(matchedRows);
      setUnmatched(unmatchedEntries);
      setStep('preview');
    } catch {
      setErrorMsg(t('importModal.errorParse'));
      setStep('error');
    } finally {
      setBusy(false);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function handleConfirm() {
    onImport(matched);
  }

  function acceptSuggestion(entry: UnmatchedEntry) {
    if (!entry.suggestion) return;
    setMatched((prev) => [...prev, { ...entry.row, species: entry.suggestion!.species }]);
    setUnmatched((prev) => prev.filter((u) => u !== entry));
  }

  function dismissSuggestion(entry: UnmatchedEntry) {
    setUnmatched((prev) => prev.map((u) => (u === entry ? { ...u, suggestion: undefined } : u)));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="font-display text-lg font-semibold text-ink">{t('importModal.title')}</p>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-cream-dark" aria-label={t('common.close')}>
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {step === 'upload' && (
            <>
              <p className="text-sm text-muted">{t('importModal.introBody')}</p>

              <button
                onClick={downloadTemplate}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-ink hover:bg-cream-dark/40"
              >
                <DownloadIcon width={16} height={16} />
                {t('importModal.downloadTemplate')}
              </button>

              <div className="rounded-xl bg-cream-dark/40 p-3 text-xs text-muted">{t('importModal.aiHint')}</div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-sm font-medium text-ink hover:border-gold hover:text-gold-dark disabled:opacity-50"
              >
                <UploadIcon width={22} height={22} />
                {busy ? t('common.loading') : t('importModal.uploadPrompt')}
              </button>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInputChange} />
            </>
          )}

          {step === 'error' && (
            <div className="rounded-xl border border-danger/40 bg-danger-light/40 p-4 text-sm text-ink">
              <p>{errorMsg}</p>
              <button onClick={() => setStep('upload')} className="mt-3 font-medium text-gold-dark underline">
                {t('importModal.tryAgain')}
              </button>
            </div>
          )}

          {step === 'preview' && (
            <>
              <div className="flex items-center gap-4 rounded-xl bg-cream-dark/40 p-4 text-sm">
                <span className="flex items-center gap-1.5 font-medium text-ink">
                  <CheckIcon width={16} height={16} color={color} />
                  {t('importModal.matchedCount', { count: matched.length })}
                </span>
                {unmatched.length > 0 && (
                  <span className="flex items-center gap-1.5 text-muted">
                    <XCircleIcon width={16} height={16} />
                    {t('importModal.unmatchedCount', { count: unmatched.length })}
                  </span>
                )}
              </div>

              {matched.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border">
                  {matched.map((m, i) => {
                    const { primary } = displayName(m.species, language);
                    return (
                      <div key={i} className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-sm last:border-b-0">
                        <span className="text-ink">{primary}</span>
                        {m.date && <span className="text-xs text-muted">{m.date}</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {unmatched.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted">{t('importModal.unmatchedHint')}</p>
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {unmatched.map((entry, i) => (
                      <div key={i} className="rounded-xl border border-border bg-cream-dark/20 p-3 text-sm">
                        <p className="text-ink">
                          "{entry.row.rawName}"
                          {entry.row.date && <span className="ml-1 text-xs text-muted">({entry.row.date})</span>}
                        </p>
                        {entry.suggestion && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-muted">
                              {t('importModal.suggestionPrefix')} <strong>{displayName(entry.suggestion.species, language).primary}</strong>?
                            </span>
                            <button
                              onClick={() => acceptSuggestion(entry)}
                              className="rounded-full px-2.5 py-1 font-medium text-white"
                              style={{ backgroundColor: color }}
                            >
                              {t('importModal.useSuggestion')}
                            </button>
                            <button onClick={() => dismissSuggestion(entry)} className="text-muted underline">
                              {t('common.cancel')}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {step === 'preview' && (
          <div className="flex gap-3 border-t border-border px-5 py-4">
            <button
              onClick={handleConfirm}
              disabled={matched.length === 0}
              className="flex-1 rounded-xl px-5 py-3 font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: color }}
            >
              {t('importModal.confirmImport', { count: matched.length })}
            </button>
            <button onClick={onClose} className="rounded-xl border border-border px-5 py-3 font-medium text-ink hover:bg-cream-dark/40">
              {t('common.cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
