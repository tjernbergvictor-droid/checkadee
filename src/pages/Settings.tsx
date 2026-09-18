import { useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useLists } from '../state/ListsContext';
import { exportBackup, parseBackup } from '../storage/db';

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { lists, replaceAllLists } = useLists();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  function handleExport() {
    const json = exportBackup(lists);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkadee-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file
      .text()
      .then((text) => {
        const importedLists = parseBackup(text);
        replaceAllLists(importedLists);
        setMessage({ type: 'success', text: t('settings.importSuccess') });
      })
      .catch(() => {
        setMessage({ type: 'error', text: t('settings.importError') });
      })
      .finally(() => {
        e.target.value = '';
      });
  }

  function handleReset() {
    replaceAllLists([]);
    setConfirmReset(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8 md:py-10">
      <h1 className="font-display mb-6 text-3xl font-semibold text-ink">{t('settings.title')}</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">{t('settings.language')}</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setLanguage('sv')}
            className={`rounded-xl border px-5 py-2.5 font-medium ${
              language === 'sv' ? 'border-gold bg-gold/10 text-gold-dark' : 'border-border text-ink'
            }`}
          >
            {t('settings.languageSv')}
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`rounded-xl border px-5 py-2.5 font-medium ${
              language === 'en' ? 'border-gold bg-gold/10 text-gold-dark' : 'border-border text-ink'
            }`}
          >
            {t('settings.languageEn')}
          </button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">{t('settings.dataTitle')}</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} className="rounded-xl border border-border px-5 py-2.5 font-medium text-ink hover:bg-cream-dark/40">
            {t('settings.exportData')}
          </button>
          <button onClick={handleImportClick} className="rounded-xl border border-border px-5 py-2.5 font-medium text-ink hover:bg-cream-dark/40">
            {t('settings.importData')}
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
        </div>
        {message && (
          <p className={`mt-2 text-sm ${message.type === 'success' ? 'text-gold-dark' : 'text-danger'}`}>{message.text}</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">{t('settings.resetTitle')}</h2>
        <p className="mb-3 text-sm text-muted">{t('settings.resetBody')}</p>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} className="rounded-xl border border-danger px-5 py-2.5 font-medium text-danger">
            {t('settings.resetButton')}
          </button>
        ) : (
          <div className="rounded-xl border border-danger/50 bg-danger-light/40 p-4">
            <p className="font-medium text-ink">{t('settings.resetConfirmTitle')}</p>
            <p className="mt-1 text-sm text-ink/80">{t('settings.resetConfirmBody')}</p>
            <div className="mt-3 flex gap-3">
              <button onClick={handleReset} className="rounded-xl bg-danger px-4 py-2 font-medium text-white">
                {t('settings.resetButton')}
              </button>
              <button onClick={() => setConfirmReset(false)} className="rounded-xl border border-border px-4 py-2 font-medium text-ink">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
