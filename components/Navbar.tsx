
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
  const isAdmin = useMemo(() => userEmail === 'admin@mkservice.com', [userEmail]);

  return (
    <nav className={`sticky top-0 z-40 w-full transition-all duration-300 ${
      isAdmin 
        ? 'bg-slate-900 text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] border-b border-indigo-500/30' 
        : 'bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-xl'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center space-x-5 rtl:space-x-reverse">
            <div className={`p-3 rounded-2xl shadow-lg transition-transform hover:scale-105 ${
              isAdmin ? 'bg-indigo-600 shadow-indigo-500/40' : 'bg-blue-600 shadow-blue-500/20'
            }`}>
              {isAdmin ? <LayoutDashboard className="w-8 h-8 text-white" /> : <ShieldCheck className="w-8 h-8 text-white" />}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">
                {t.appTitle}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                {isAdmin ? (
                   <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500 text-[10px] font-black rounded-lg uppercase tracking-widest animate-pulse">
                     <Star className="w-3 h-3 fill-white" /> Root Administrator
                   </div>
                ) : (
                   <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Registration Portal v4.2</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-5 rtl:space-x-reverse">
            {/* User Profile Card */}
            <div className={`hidden md:flex items-center space-x-4 rtl:space-x-reverse border-r ${
              isAdmin ? 'border-slate-700' : 'dark:border-slate-700'
            } pr-5 rtl:pr-0 rtl:pl-5`}>
              <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all ${
                isAdmin 
                  ? 'bg-indigo-600/20 border-indigo-400/50 shadow-lg shadow-indigo-500/20' 
                  : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
              }`}>
                <User className={`w-6 h-6 ${isAdmin ? 'text-indigo-300' : 'text-blue-600 dark:text-blue-400'}`} />
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isAdmin ? 'text-indigo-400' : 'text-slate-500'}`}>Session Live</span>
                <span className={`text-sm font-black uppercase whitespace-nowrap ${isAdmin ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
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
                className={`pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2.5 rounded-xl border appearance-none cursor-pointer text-xs font-black uppercase transition-all shadow-sm ${
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={`p-3 rounded-xl transition-all border ${
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
                className={`flex items-center space-x-2 rtl:space-x-reverse px-5 py-3 rounded-2xl text-red-500 transition-all group border-2 ${
                  isAdmin 
                    ? 'border-transparent hover:bg-red-500/10 hover:border-red-500/40' 
                    : 'border-transparent hover:bg-red-50 dark:hover:bg-red-950/20'
                }`}
              >
                <LogOut className="w-5 h-5 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform" />
                <span className="text-xs font-black uppercase hidden lg:block tracking-widest">{t.logout}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
