
import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, ArrowRight, ArrowLeft, Loader2, Globe, User, Sun, Moon } from 'lucide-react';
import { Language, Theme } from '../types';
import { supabase } from '../lib/supabase';

interface AuthProps {
  lang: Language;
  t: any;
  theme: Theme;
  setTheme: (t: Theme) => void;
  setLang: (l: Language) => void;
}

const Auth: React.FC<AuthProps> = ({ lang, t, theme, setTheme, setLang }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = t.validation.required;
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = t.validation.invalidEmail;
    
    if (!password) newErrors.password = t.validation.required;
    else if (password.length < 6) newErrors.password = t.validation.passwordShort;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (validate()) {
      setIsLoading(true);
      try {
        if (isLogin) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.signUp({ email, password });
          if (error) throw error;
          alert('Check your email for confirmation link!');
        }
      } catch (err: any) {
        setAuthError(err.message || 'Authentication failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors p-4">
      <div className="max-w-5xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-700 min-h-[600px]">
        
        {/* Branding Side */}
        <div className="md:w-1/2 bg-blue-600 p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-lg">
                  <ShieldCheck className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-xl font-black tracking-tighter uppercase leading-none">MK Clients</h1>
              </div>

              <div className="pt-4">
                <h2 className="text-4xl font-black text-white leading-tight mb-2">
                  {isLogin ? 'Access Portal' : 'Join Network'}
                </h2>
                <p className="text-blue-100 text-2xl font-bold tracking-tight">
                  {t.authDescription}
                </p>
              </div>

              <div className="mt-8 flex justify-start">
                <div className="bg-white p-2 rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-300">
                  <img 
                    src="logo.png" 
                    alt="MK Service Logo" 
                    className="w-40 h-40 md:w-48 md:h-48 object-contain rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-auto pt-10">
              <div className="flex gap-4 items-center opacity-80">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-blue-600 bg-slate-800 flex items-center justify-center shadow-lg">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-100 font-bold uppercase tracking-widest">
                  Verified Admin System
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="md:w-1/2 p-8 md:p-12 bg-white dark:bg-slate-800 flex flex-col justify-center">
          <div className="flex justify-end gap-3 mb-8">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <div className="relative group">
              <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="appearance-none bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-bold pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-all"
              >
                <option value="en">English (EN)</option>
                <option value="fr">Français (FR)</option>
                <option value="ar">العربية (AR)</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              {isLogin ? t.login : t.signup}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {isLogin ? t.signInToAccount : t.createAccount}
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl text-sm text-red-600 dark:text-red-400 font-bold">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                {t.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mk-visa.com"
                  className={`w-full pl-12 pr-4 rtl:pr-12 rtl:pl-4 py-4 rounded-2xl border ${
                    errors.email ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 dark:border-slate-700'
                  } bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 font-bold ml-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.password}
                </label>
                {isLogin && (
                  <button type="button" className="text-xs text-blue-600 dark:text-blue-500 hover:text-blue-700 font-black tracking-tight">
                    {t.forgotPassword}
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2">
                   <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-4 rtl:pr-12 rtl:pl-4 py-4 rounded-2xl border ${
                    errors.password ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 dark:border-slate-700'
                  } bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400`}
                />
              </div>
              {errors.password && <p className="text-xs text-red-500 font-bold ml-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl font-black shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span className="text-lg uppercase tracking-tight">{isLogin ? t.login : t.signup}</span>
                  {lang === 'ar' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
              {isLogin ? t.noAccount : t.hasAccount}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setAuthError(null);
                  setErrors({});
                }}
                className="ml-2 rtl:mr-2 text-blue-600 dark:text-blue-500 font-black hover:underline underline-offset-4"
              >
                {isLogin ? t.signup : t.login}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
