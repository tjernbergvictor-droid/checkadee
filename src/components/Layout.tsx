import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { MenuIcon } from './icons';

export default function Layout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-cream">
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col">
        <Sidebar />
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80vw] shadow-2xl">
            <Sidebar onClose={() => setDrawerOpen(false)} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-col md:pl-64">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-charcoal px-4 py-3 text-cream md:hidden">
          <button onClick={() => setDrawerOpen(true)} className="rounded-lg p-1.5 hover:bg-white/10" aria-label="Menu">
            <MenuIcon />
          </button>
          <div className="flex items-center gap-2">
            <img src="/icons/icon-512.png" alt="" className="h-6 w-6 rounded-md" />
            <span className="font-display text-base font-semibold tracking-wide text-gold-light">Checkadee</span>
          </div>
        </div>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
