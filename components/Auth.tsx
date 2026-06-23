
import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, ArrowRight, ArrowLeft, Loader2, Sun, Moon, AlertCircle } from 'lucide-react';
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
          alert(t.checkEmail);
        }
      } catch (err: any) {
        setAuthError(err.message || 'Authentication failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] p-4 font-sans relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-8 relative">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight leading-none">
            MK <span className="text-indigo-600">Clients</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            {isLogin ? t.login : t.signup}
          </p>
        </div>

        <div className="premium-card p-10 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-slate-200/60 dark:border-slate-800/60 shadow-2xl shadow-indigo-500/5">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] ml-1 opacity-80">
                  {t.email}
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 placeholder:text-slate-400/60 ${errors.email ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : ''}`}
                    placeholder="name@company.com"
                    required
                  />
                </div>
                {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] ml-1 opacity-80">
                  {t.password}
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 placeholder:text-slate-400/60 ${errors.password ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : ''}`}
                    placeholder="••••••••"
                    required
                  />
                </div>
                {errors.password && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.password}</p>}
              </div>
            </div>

            {authError && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/25 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 text-base"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? t.login : t.signup}</span>
                  {lang === 'ar' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800/60 text-center">
            <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-widest">
              {isLogin ? t.noAccount : t.hasAccount}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setAuthError(null);
                  setErrors({});
                }}
                className="ml-2 text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-500 transition-colors underline underline-offset-4"
              >
                {isLogin ? t.signup : t.login}
              </button>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            {(['en', 'fr', 'ar'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  lang === l
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
