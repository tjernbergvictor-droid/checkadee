import { useLanguage } from '../i18n/LanguageContext';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-display mb-2 text-xl font-semibold text-ink">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-ink/85">{children}</div>
    </section>
  );
}

export default function Help() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8 md:py-10">
      <h1 className="font-display mb-6 text-3xl font-semibold text-ink">{t('help.title')}</h1>

      <Section title={t('help.introTitle')}>
        <p>{t('help.introBody')}</p>
      </Section>

      <Section title={t('help.usageTitle')}>
        <div>
          <h3 className="font-medium text-ink">{t('help.usageAddListTitle')}</h3>
          <p className="text-muted">{t('help.usageAddListBody')}</p>
        </div>
        <div>
          <h3 className="font-medium text-ink">{t('help.usageCheckTitle')}</h3>
          <p className="text-muted">{t('help.usageCheckBody')}</p>
        </div>
        <div>
          <h3 className="font-medium text-ink">{t('help.usageImportTitle')}</h3>
          <p className="text-muted">{t('help.usageImportBody')}</p>
        </div>
        <div>
          <h3 className="font-medium text-ink">{t('help.usageNewSightingTitle')}</h3>
          <p className="text-muted">{t('help.usageNewSightingBody')}</p>
        </div>
        <div>
          <h3 className="font-medium text-ink">{t('help.usageChronologicalTitle')}</h3>
          <p className="text-muted">{t('help.usageChronologicalBody')}</p>
        </div>
        <div>
          <h3 className="font-medium text-ink">{t('help.usageManualTotalTitle')}</h3>
          <p className="text-muted">{t('help.usageManualTotalBody')}</p>
        </div>
        <div>
          <h3 className="font-medium text-ink">{t('help.usageSyncTitle')}</h3>
          <p className="text-muted">{t('help.usageSyncBody')}</p>
        </div>
        <div>
          <h3 className="font-medium text-ink">{t('help.usageLanguageTitle')}</h3>
          <p className="text-muted">{t('help.usageLanguageBody')}</p>
        </div>
      </Section>

      <Section title={t('help.sourcesTitle')}>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-medium text-gold-dark">{t('help.sourceAvilistTitle')}</h3>
          <p className="mt-1 text-muted">{t('help.sourceAvilistBody')}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-medium text-gold-dark">{t('help.sourceVpTitle')}</h3>
          <p className="mt-1 text-muted">{t('help.sourceVpBody')}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-medium text-gold-dark">{t('help.sourceSverigeTitle')}</h3>
          <p className="mt-1 text-muted">{t('help.sourceSverigeBody')}</p>
        </div>
      </Section>

      <p className="text-xs text-muted">{t('help.credits')}</p>
    </div>
  );
}
