
import React, { useState, useMemo } from 'react';
import { ShieldCheck, Sun, Moon, LogOut, Globe, User, Star, LayoutDashboard, X, Menu } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userName = userEmail.split('@')[0] || 'Admin';
  const isAdmin = useMemo(() => userEmail === 'admin@mkservice.com', [userEmail]);

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      isAdmin 
        ? 'bg-slate-900 text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] border-b border-indigo-500/30' 
        : 'bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-xl'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          <div className="flex items-center space-x-3 sm:space-x-5 rtl:space-x-reverse flex-1 min-w-0">
            <div className={`flex-shrink-0 p-2.5 sm:p-3 rounded-2xl shadow-lg transition-transform hover:scale-105 ${
              isAdmin ? 'bg-indigo-600 shadow-indigo-500/40' : 'bg-blue-600 shadow-blue-500/20'
            }`}>
              {isAdmin ? <LayoutDashboard className="w-6 h-6 sm:w-8 sm:h-8 text-white" /> : <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h1 className="text-lg sm:text-2xl font-black tracking-tighter uppercase leading-none truncate">
                {t.appTitle}
              </h1>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1.5">
                {isAdmin ? (
                   <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-indigo-500 text-[8px] sm:text-[10px] font-black rounded-lg uppercase tracking-widest animate-pulse flex-shrink-0">
                      <Star className="w-2 h-2 sm:w-3 sm:h-3 fill-white" /> {t.rootAdmin}
                   </div>
                ) : (
                   <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">{t.portalVersion}</span>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2 sm:space-x-5 rtl:space-x-reverse">
            {/* User Profile Card */}
            <div className={`flex items-center space-x-3 rtl:space-x-reverse border-r ${
              isAdmin ? 'border-slate-700' : 'dark:border-slate-700'
            } pr-3 rtl:pr-0 rtl:pl-3`}>
              <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${
                isAdmin 
                  ? 'bg-indigo-600/20 border-indigo-400/50 shadow-lg shadow-indigo-500/20' 
                  : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
              }`}>
                <User className={`w-5 h-5 ${isAdmin ? 'text-indigo-300' : 'text-blue-600 dark:text-blue-400'}`} />
              </div>
              <div className="flex flex-col">
                <span className={`text-[9px] font-black uppercase tracking-widest ${isAdmin ? 'text-indigo-400' : 'text-slate-500'}`}>{t.sessionLive}</span>
                <span className={`text-xs font-black uppercase whitespace-nowrap ${isAdmin ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                  {t.welcome} <span className={isAdmin ? 'text-indigo-300 underline underline-offset-4 decoration-indigo-500/50' : 'text-blue-600 dark:text-blue-400'}>{userName}</span>
                </span>
              </div>
            </div>

            {/* Language Selection */}
            <div className="relative group">
              <Globe className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className={`pl-8 pr-8 rtl:pr-8 rtl:pl-8 py-2 rounded-xl border appearance-none cursor-pointer text-[10px] font-black uppercase transition-all shadow-sm ${
                  isAdmin 
                    ? 'bg-slate-800 border-slate-700 text-white focus:ring-indigo-500' 
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-blue-500'
                }`}
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
                <option value="ar">AR</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={`p-2.5 rounded-xl transition-all border ${
                  isAdmin 
                    ? 'hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-yellow-400' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 border-transparent text-slate-600 dark:text-slate-400'
                }`}
                title="Toggle Theme"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              <button 
                onClick={onLogout}
                className={`flex items-center space-x-1.5 rtl:space-x-reverse px-3 sm:px-5 py-2.5 rounded-2xl text-red-500 transition-all group border-2 ${
                  isAdmin 
                    ? 'border-transparent hover:bg-red-500/10 hover:border-red-500/40' 
                    : 'border-transparent hover:bg-red-50 dark:hover:bg-red-950/20'
                }`}
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">{t.logout}</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="absolute top-16 right-2 left-2 sm:right-4 md:hidden bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200 max-h-[90vh] overflow-y-auto">
              {/* User Profile */}
              <div className={`flex items-center space-x-3 rtl:space-x-reverse border-b dark:border-slate-700 pb-4`}>
                <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center ${
                  isAdmin 
                    ? 'bg-indigo-600/20 border-indigo-400/50' 
                    : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
                }`}>
                  <User className={`w-6 h-6 ${isAdmin ? 'text-indigo-300' : 'text-blue-600 dark:text-blue-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isAdmin ? 'text-indigo-400' : 'text-slate-500'}`}>{t.sessionLive}</span>
                  <p className={`text-sm font-black uppercase truncate ${isAdmin ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                    {t.welcome} <span className={isAdmin ? 'text-indigo-300' : 'text-blue-600 dark:text-blue-400'}>{userName}</span>
                  </p>
                </div>
              </div>

              {/* Language Selector */}
              <div className="relative group">
                <Globe className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none z-10" />
                <select
                  value={lang}
                  onChange={(e) => { setLang(e.target.value as Language); setIsMobileMenuOpen(false); }}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border appearance-none cursor-pointer text-sm font-black uppercase transition-all shadow-sm ${
                    isAdmin 
                      ? 'bg-slate-800 border-slate-700 text-white focus:ring-indigo-500' 
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-blue-500'
                  }`}
                >
                  <option value="en">EN</option>
                  <option value="fr">FR</option>
                  <option value="ar">AR</option>
                </select>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => { setTheme(theme === 'light' ? 'dark' : 'light'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all border ${
                  isAdmin 
                    ? 'hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-yellow-400' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 border-transparent text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="text-sm font-black uppercase">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              {/* Logout */}
              <button 
                onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <span className="text-sm font-black uppercase">{t.logout}</span>
                <LogOut className="w-5 h-5 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
