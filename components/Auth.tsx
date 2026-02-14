
import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, ArrowRight, ArrowLeft, Loader2, Globe, Sun, Moon } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#0f172a] transition-colors p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]"></div>

      {/* Top Navigation Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        <div className="relative group">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
            className="appearance-none bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold pl-9 pr-8 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer transition-all"
          >
            <option value="en">EN</option>
            <option value="fr">FR</option>
            <option value="ar">AR</option>
          </select>
        </div>
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            MK <span className="text-blue-600">Clients</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2">
            Secure Client Management Portal
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-700/50 p-8 md:p-10">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isLogin ? t.login : t.signup}
            </h2>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-xs text-red-600 dark:text-red-400 font-bold text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.email}
                  className={`w-full pl-12 pr-4 rtl:pr-12 rtl:pl-4 py-4 rounded-2xl border transition-all outline-none bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium ${
                    errors.email ? 'border-red-500 ring-2 ring-red-500/10' : 'border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5'
                  }`}
                />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.password}
                  className={`w-full pl-12 pr-4 rtl:pr-12 rtl:pl-4 py-4 rounded-2xl border transition-all outline-none bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium ${
                    errors.password ? 'border-red-500 ring-2 ring-red-500/10' : 'border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5'
                  }`}
                />
              </div>
              {errors.password && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.password}</p>}
            </div>

            {isLogin && (
              <div className="flex justify-end px-1">
                <button type="button" className="text-xs text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors font-bold">
                  {t.forgotPassword}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-6"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span className="text-sm uppercase tracking-widest">{isLogin ? t.login : t.signup}</span>
                  {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50 text-center">
            <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-tight">
              {isLogin ? t.noAccount : t.hasAccount}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setAuthError(null);
                  setErrors({});
                }}
                className="ml-2 rtl:mr-2 text-blue-600 dark:text-blue-400 font-black hover:underline underline-offset-4"
              >
                {isLogin ? t.signup : t.login}
              </button>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-10 text-center">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">
            Support: {t.authDescription}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
