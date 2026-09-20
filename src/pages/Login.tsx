import React, { useState } from 'react';
import { authService } from '../services/authService';
import { useLanguage } from '../i18n/LanguageContext';
import { ShieldCheck, Lock, User, AlertCircle, KeyRound, Languages } from 'lucide-react';
import { SupportedLanguage } from '../types';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { language, setLanguage, t } = useLanguage();
  const [inspectorId, setInspectorId] = useState('INS-1042');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = authService.login(inspectorId, password);
      setIsLoading(false);
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'Authentication failed. Please check credentials.');
      }
    }, 400);
  };

  const handleUseDemoCreds = () => {
    setInspectorId('INS-1042');
    setPassword('demo123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0D0917] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Official Header */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1C1630] border-2 border-violet-500/40 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-violet-950/40">
            LL
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          LabelLens
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400 max-w-xs mx-auto">
          Legal Metrology Packaged Commodity Inspection Portal · SIH26034
        </p>

        {/* Language selector in login */}
        <div className="mt-3 flex justify-center items-center gap-1.5 text-xs text-slate-400">
          <Languages className="w-3.5 h-3.5 text-violet-400" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="bg-[#1C1630] border border-[#2D2448] rounded-md px-2 py-0.5 text-slate-200 text-xs font-medium focus:outline-hidden cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
          </select>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#151025] py-8 px-6 sm:px-8 border border-[#2D2448] rounded-2xl shadow-2xl space-y-6">
          {/* Prototype Credentials Callout */}
          <div className="rounded-xl border border-violet-900/60 bg-[#1C1630] p-3.5 text-xs text-violet-200">
            <div className="flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Prototype Inspector Credentials:</span>
                <div className="mt-1 font-mono text-[11px] text-violet-300">
                  Officer ID: <strong className="text-white">INS-1042</strong> | Password: <strong className="text-white">demo123</strong>
                </div>
                <button
                  type="button"
                  onClick={handleUseDemoCreds}
                  className="mt-2 text-violet-400 hover:text-violet-300 underline font-semibold text-[11px] cursor-pointer"
                >
                  Auto-fill demo credentials
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-800/80 bg-rose-950/60 p-3 text-xs text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="inspector-id" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                {t.inspectorId}
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  id="inspector-id"
                  name="inspectorId"
                  type="text"
                  required
                  value={inspectorId}
                  onChange={(e) => setInspectorId(e.target.value)}
                  placeholder="e.g. INS-1042"
                  className="block w-full rounded-xl border border-[#2D2448] bg-[#0D0917] pl-9 pr-3 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-violet-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                {t.password}
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-[#2D2448] bg-[#0D0917] pl-9 pr-3 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-violet-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-violet-600 shadow-lg shadow-violet-950 cursor-pointer transition-colors disabled:opacity-75"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoading ? 'Verifying Credentials...' : t.loginButton}</span>
            </button>
          </form>

          <div className="text-[11px] text-slate-500 text-center border-t border-[#2D2448] pt-4 leading-relaxed">
            Authorized for field inspection officers under the Department of Consumer Affairs, Government of India.
          </div>
        </div>
      </div>
    </div>
  );
};
