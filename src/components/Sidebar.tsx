import { NavLink } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { HomeIcon, PlusIcon, BookIcon, SettingsIcon, CloseIcon } from './icons';

interface SidebarProps {
  onNavigate?: () => void;
  onClose?: () => void;
}

export default function Sidebar({ onNavigate, onClose }: SidebarProps) {
  const { t } = useLanguage();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors ${
      isActive ? 'bg-gold/15 text-gold-light' : 'text-cream/85 hover:bg-white/5 hover:text-cream'
    }`;

  return (
    <div className="flex h-full flex-col bg-charcoal text-cream">
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <img src="/icons/icon-512.png" alt="" className="h-9 w-9 rounded-lg" />
          <div>
            <p className="font-display text-lg leading-tight font-semibold tracking-wide text-gold-light">
              Checkadee
            </p>
            <p className="text-[11px] tracking-wide text-cream/50">The Bird List App</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1.5 text-cream/70 hover:bg-white/10 md:hidden" aria-label={t('common.close')}>
            <CloseIcon width={20} height={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        <NavLink to="/" end className={linkClass} onClick={onNavigate}>
          <HomeIcon />
          {t('nav.dashboard')}
        </NavLink>
        <NavLink to="/ny-lista" className={linkClass} onClick={onNavigate}>
          <PlusIcon />
          {t('nav.newList')}
        </NavLink>
        <NavLink to="/hjalp" className={linkClass} onClick={onNavigate}>
          <BookIcon />
          {t('nav.help')}
        </NavLink>
        <NavLink to="/installningar" className={linkClass} onClick={onNavigate}>
          <SettingsIcon />
          {t('nav.settings')}
        </NavLink>
      </nav>

      <div className="border-t border-white/10 px-5 py-4 text-[11px] text-(--color-cream)/40">
        AviList · VP11 · Sverigelistan 2026
      </div>
    </div>
  );
}
