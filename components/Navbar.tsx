
import React, { useMemo } from 'react';
import { ShieldCheck, Sun, Moon, LogOut, Globe, User, Star, LayoutDashboard } from 'lucide-react';
import { Language, Theme } from '../types';

interface NavbarProps {
  lang: Language;
  setLang: (l: Language) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  t: any;
  onLogout: () => void;
  userEmail: string;
}

const Navbar: React.FC<NavbarProps> = ({ lang, setLang, theme, setTheme, t, onLogout, userEmail }) => {
  const userName = userEmail.split('@')[0] || 'Admin';
  const isAdmin = userEmail === 'admin@mkservice.com';

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200 dark:border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30 group-hover:rotate-6 transition-transform duration-300">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight leading-none">
              {t.appTitle}
            </h1>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5 opacity-80">
              {isAdmin ? t.rootAdmin : t.portalVersion}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4 px-6 py-2 border-x border-slate-200 dark:border-slate-800/50">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900 dark:text-white leading-none tracking-tight">{userName}</span>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 uppercase tracking-wider opacity-70">{userEmail}</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center border border-slate-200 dark:border-slate-700/50 shadow-inner">
              <User className="w-5 h-5 text-slate-500" />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 p-1.5 bg-slate-100/50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800/50">
            {(['en', 'fr', 'ar'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-300 ${
                  lang === l
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100/50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all active:scale-90"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <button 
              onClick={onLogout}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all active:scale-90"
              title={t.logout}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
