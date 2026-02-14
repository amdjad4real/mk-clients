
import React from 'react';
import { ShieldCheck, Sun, Moon, LogOut, Globe, User } from 'lucide-react';
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
  // Extract name from email (part before @)
  const userName = userEmail.split('@')[0] || 'Admin';

  return (
    <nav className="sticky top-0 z-40 w-full bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white hidden sm:block tracking-tight">
              {t.appTitle}
            </h1>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white sm:hidden tracking-tight">
              MK
            </h1>
          </div>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* User Info */}
            <div className="hidden lg:flex items-center space-x-3 rtl:space-x-reverse border-r dark:border-slate-700 pr-4 rtl:pr-0 rtl:pl-4">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 dark:text-white leading-none whitespace-nowrap">
                  {t.welcome} <span className="text-blue-600 dark:text-blue-400 capitalize">{userName}</span>
                </span>
              </div>
            </div>

            {/* Language Selector */}
            <div className="relative flex items-center">
              <Globe className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 text-slate-400 pointer-events-none" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none cursor-pointer"
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
                <option value="ar">AR</option>
              </select>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-slate-600" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-400" />
              )}
            </button>

            {/* Logout */}
            <button 
              onClick={onLogout}
              className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-bold hidden sm:block">{t.logout}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
