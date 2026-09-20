import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import { useLanguage } from '../i18n/LanguageContext';
import { AppSettings, SupportedLanguage } from '../types';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';
import { Languages, Cpu, MapPin, RefreshCw, User, Check } from 'lucide-react';

interface SettingsProps {
  onNavigate: (route: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onNavigate }) => {
  const { language, setLanguage } = useLanguage();
  const { toastSaved } = useToast();
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [inspector] = useState(authService.getCurrentUser());
  const [savedAlert, setSavedAlert] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    setSettings(storageService.getSettings());
  }, []);

  const handleUpdate = (updated: Partial<AppSettings>) => {
    const res = storageService.saveSettings(updated);
    setSettings(res);
    setSavedAlert(true);
    toastSaved('Settings Saved', 'Configuration preferences updated');
    setTimeout(() => setSavedAlert(false), 2000);
  };

  const handleResetData = () => {
    storageService.resetDemoData();
    setResetConfirmOpen(false);
    toastSaved('Database Reset', 'Workstation reset to initial demo inspections');
    onNavigate('dashboard');
  };

  return (
    <div className="space-y-6 max-w-4xl text-slate-200">
      {/* Header */}
      <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-violet-400 tracking-wider">Configuration</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-0.5">System & Inspection Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure extraction engines, language preferences, and inspector environment.
          </p>
        </div>

        {savedAlert && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-lg">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Preferences Saved</span>
          </div>
        )}
      </div>

      {/* Inspector Profile Card */}
      <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2D2448] pb-3">
          <User className="w-4 h-4 text-violet-400" />
          <span>Field Inspector Profile</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#1C1630] p-3.5 rounded-xl border border-[#2D2448]">
            <span className="text-slate-400 block uppercase font-bold text-[10px]">Officer Name</span>
            <div className="font-bold text-white mt-0.5 text-sm">{inspector?.name}</div>
          </div>
          <div className="bg-[#1C1630] p-3.5 rounded-xl border border-[#2D2448]">
            <span className="text-slate-400 block uppercase font-bold text-[10px]">Officer ID</span>
            <div className="font-mono font-bold text-violet-300 mt-0.5 text-sm">{inspector?.id}</div>
          </div>
          <div className="bg-[#1C1630] p-3.5 rounded-xl border border-[#2D2448]">
            <span className="text-slate-400 block uppercase font-bold text-[10px]">Division</span>
            <div className="font-semibold text-slate-200 mt-0.5">{inspector?.department}</div>
          </div>
        </div>
      </div>

      {/* Language & Localization */}
      <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2D2448] pb-3">
          <Languages className="w-4 h-4 text-violet-400" />
          <span>Language & Regional Localization</span>
        </h2>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Application Language</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'en', title: 'English', desc: 'Standard Government Format' },
              { id: 'hi', title: 'हिन्दी (Hindi)', desc: 'उपभोक्ता मामले विभाग' },
              { id: 'pa', title: 'ਪੰਜਾਬੀ (Punjabi)', desc: 'ਖੇਤਰੀ ਨਿਰੀਖਣ ਮੋਡ' },
            ].map((lang) => {
              const isSelected = language === lang.id;
              return (
                <div
                  key={lang.id}
                  onClick={() => {
                    setLanguage(lang.id as SupportedLanguage);
                    handleUpdate({ language: lang.id as SupportedLanguage });
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-violet-500 bg-[#251A45] ring-2 ring-violet-500/40'
                      : 'border-[#2D2448] bg-[#1C1630] hover:border-violet-600/50'
                  }`}
                >
                  <div className="text-xs font-bold text-white">{lang.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{lang.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Extraction Engine Preference */}
      <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2D2448] pb-3">
          <Cpu className="w-4 h-4 text-violet-400" />
          <span>Statutory OCR Processing Engine</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => handleUpdate({ ocrMode: 'demo' })}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              settings.ocrMode === 'demo'
                ? 'border-violet-500 bg-[#251A45] ring-2 ring-violet-500/40'
                : 'border-[#2D2448] bg-[#1C1630] hover:border-violet-600/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Deterministic Engine (Recommended for Offline)</span>
              {settings.ocrMode === 'demo' && <Check className="w-4 h-4 text-violet-400" />}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Instant, deterministic extraction suited for field environments with low bandwidth. Maps declarations directly to authentic statutory evidence bounds.
            </p>
          </div>

          <div
            onClick={() => handleUpdate({ ocrMode: 'ai' })}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              settings.ocrMode === 'ai'
                ? 'border-violet-500 bg-[#251A45] ring-2 ring-violet-500/40'
                : 'border-[#2D2448] bg-[#1C1630] hover:border-violet-600/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Gemini Vision AI Engine (Cloud / Full-Stack)</span>
              {settings.ocrMode === 'ai' && <Check className="w-4 h-4 text-violet-400" />}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Processes package surfaces server-side via Gemini Multimodal Vision, automatically parsing unconstrained label layouts into structured PCR fields.
            </p>
          </div>
        </div>
      </div>

      {/* Geolocation Controls */}
      <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2D2448] pb-3">
          <MapPin className="w-4 h-4 text-violet-400" />
          <span>Geolocation Capture Preferences</span>
        </h2>

        <div className="space-y-3 text-xs">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableAutoLocation}
              onChange={(e) => handleUpdate({ enableAutoLocation: e.target.checked })}
              className="w-4 h-4 text-violet-600 bg-[#0D0917] rounded border-[#2D2448] focus:ring-violet-500"
            />
            <div>
              <div className="font-semibold text-white">Auto-detect GPS location when starting inspection</div>
              <div className="text-slate-400 text-[11px]">Queries browser geolocation API upon opening Step 1</div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showCoordinates}
              onChange={(e) => handleUpdate({ showCoordinates: e.target.checked })}
              className="w-4 h-4 text-violet-600 bg-[#0D0917] rounded border-[#2D2448] focus:ring-violet-500"
            />
            <div>
              <div className="font-semibold text-white">Display raw latitude and longitude on reports</div>
              <div className="text-slate-400 text-[11px]">Include precise coordinates in printable statutory dossiers</div>
            </div>
          </label>
        </div>
      </div>

      {/* Prototype Reset / Maintenance */}
      <div className="bg-[#1C1630] border border-[#2D2448] rounded-2xl p-6 space-y-3">
        <div className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-violet-400" />
          <span>Prototype Data Maintenance</span>
        </div>
        <p className="text-xs text-slate-400">
          Restore the sample inspection database (LL-2026-00142, LL-2026-00141, etc.) and clear any unsaved drafts.
        </p>

        <button
          id="btn-reset-demo-data"
          type="button"
          onClick={() => setResetConfirmOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#2D2448] bg-[#151025] hover:bg-[#251D42] text-slate-200 hover:text-white text-xs font-semibold cursor-pointer shadow-md transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-violet-400" />
          <span>Reset Sample Database to Initial State</span>
        </button>
      </div>

      {/* Reset Confirmation Dialog */}
      {resetConfirmOpen && (
        <ConfirmDialog
          isOpen={true}
          title="Reset Prototype Data?"
          message="This will restore the default demo inspections and remove any custom tests or active drafts you have created."
          confirmLabel="Reset Everything"
          isDestructive={true}
          onConfirm={handleResetData}
          onCancel={() => setResetConfirmOpen(false)}
        />
      )}
    </div>
  );
};
