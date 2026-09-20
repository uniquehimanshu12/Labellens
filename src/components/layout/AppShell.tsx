import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { authService } from '../../services/authService';
import { storageService } from '../../services/storageService';
import { SupportedLanguage, InspectionRecord } from '../../types';
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  CheckSquare,
  History,
  FileBarChart,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  ShieldCheck,
  Menu,
  X,
  Languages,
  Scale,
  Search,
  HelpCircle,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  Bot,
  Radio,
} from 'lucide-react';
import { CommandPalette } from '../common/CommandPalette';
import { NotificationCenter } from '../common/NotificationCenter';
import { OnboardingModal } from '../common/OnboardingModal';
import { StartInspectionModal } from '../inspection/StartInspectionModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { AiAssistantModal } from '../chat/AiAssistantModal';

interface AppShellProps {
  currentRoute: string;
  onNavigate: (route: string, params?: { inspectionId?: string }) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentRoute,
  onNavigate,
  onLogout,
  children,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [inspector] = useState(authService.getCurrentUser());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Global Modals
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for draft
    const draft = storageService.getActiveDraft();
    setHasDraft(Boolean(draft));

    // Global keyboard shortcut for Command Palette (Ctrl+K) & AI Assistant (Ctrl+J)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setAiAssistantOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentRoute]);

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, route: 'dashboard' },
    { id: 'new-inspection', label: t.newInspection, icon: PlusCircle, route: 'new-inspection' },
    ...(hasDraft ? [{ id: 'active-inspection', label: t.activeInspection, icon: Clock, route: 'active-inspection', badge: 'Draft' }] : []),
    { id: 'review-queue', label: t.reviewQueue, icon: CheckSquare, route: 'review-queue' },
    { id: 'inspection-history', label: t.inspectionHistory, icon: History, route: 'history' },
    { id: 'rules-references', label: 'Rules & References', icon: Scale, route: 'rules-references' },
    { id: 'reports', label: t.reports, icon: FileBarChart, route: 'reports' },
    { id: 'settings', label: t.settings, icon: Settings, route: 'settings' },
  ];

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as SupportedLanguage);
  };

  const handleStartInspectionFromModal = (initialData?: any) => {
    if (initialData) {
      const generatedId = `LL-2026-00${Math.floor(143 + Math.random() * 850)}`;
      const now = new Date().toISOString();
      const currentInspector = authService.getCurrentUser()!;
      const initialRecord: InspectionRecord = {
        id: generatedId,
        productName: initialData.productName || '',
        barcode: '',
        inspector: currentInspector,
        createdAt: now,
        updatedAt: now,
        location: initialData.location || {
          latitude: null,
          longitude: null,
          accuracy: null,
          placeName: 'Detecting...',
          timestamp: now,
          locationSource: 'Unavailable',
        },
        images: initialData.images || {
          front: null,
          back: null,
          side: null,
          additional: null,
        },
        extractedFields: {},
        findings: [],
        remarks: '',
        status: 'REQUIRES MANUAL VERIFICATION',
        activityLog: [
          {
            id: '1',
            timestamp: now,
            timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: 'Inspection session initialized via Quick Start',
            actor: currentInspector.id,
          },
        ],
        step: 1,
      };
      storageService.saveActiveDraft(initialRecord);
    }
    setStartModalOpen(false);
    onNavigate('new-inspection');
  };

  return (
    <div className="min-h-screen bg-[#0D0917] flex flex-col font-sans text-slate-100 antialiased selection:bg-violet-600 selection:text-white">
      {/* Top Header Bar */}
      <header className="bg-[#151025] text-white border-b border-[#2D2448] sticky top-0 z-40 shadow-xl">
        <div className="px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Brand & Gov Assistant Marker */}
          <div className="flex items-center gap-3">
            <button
              id="btn-toggle-mobile-menu"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C1630]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              onClick={() => onNavigate('dashboard')}
              className="cursor-pointer flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold tracking-wider text-sm shadow-md group-hover:bg-violet-500 transition-colors">
                LL
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white">LabelLens</span>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1C1630] text-violet-300 border border-[#2D2448]">
                    SIH26034
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 hidden sm:block">
                  Packaged Commodity Metrology Inspection System
                </div>
              </div>
            </div>
          </div>

          {/* Center Search Command Palette Trigger */}
          <div className="hidden md:flex flex-1 max-w-md justify-center">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-[#1C1630] hover:bg-[#231C3D] border border-[#2D2448] text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer shadow-inner"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-slate-400">Search commands, inspections...</span>
              </div>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono bg-[#151025] px-1.5 py-0.5 rounded border border-[#2D2448] text-slate-400 font-semibold">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2.5">
            {/* AI Assistant & Live Voice Button */}
            <button
              id="btn-open-ai-assistant"
              type="button"
              onClick={() => setAiAssistantOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-fuchsia-950/50 transition-all cursor-pointer"
              title="Open Gemini AI Compliance Assistant & Live Voice (Ctrl+J)"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">AI Assistant & Voice</span>
              <kbd className="hidden xl:inline-flex text-[9px] font-mono bg-black/30 px-1 py-0.5 rounded text-white/80">Ctrl J</kbd>
            </button>

            {/* Quick New Inspection Button */}
            <button
              id="btn-quick-new-inspection"
              type="button"
              onClick={() => setStartModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2D2448] hover:bg-[#3D3260] text-slate-200 text-xs font-semibold border border-violet-700/40 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-violet-400" />
              <span>New Inspection</span>
            </button>

            {/* Notification Center */}
            <NotificationCenter onNavigate={onNavigate} />

            {/* Workstation Guide / Tutorial */}
            <button
              id="btn-open-tutorial"
              type="button"
              onClick={() => setOnboardingOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C1630] transition-colors cursor-pointer"
              title="Workstation Tour & Guidelines"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Connection Status Indicator */}
            <div
              className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-mono ${
                isOnline
                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/80'
                  : 'bg-amber-950/70 text-amber-400 border border-amber-800/80'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold">{t.online}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold">{t.offline}</span>
                </>
              )}
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-[#1C1630] rounded-lg border border-[#2D2448] px-2 py-1 text-xs">
              <Languages className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="select-app-language"
                value={language}
                onChange={handleLanguageChange}
                className="bg-transparent text-slate-200 text-xs focus:outline-hidden cursor-pointer"
              >
                <option value="en" className="bg-[#151025] text-white">EN</option>
                <option value="hi" className="bg-[#151025] text-white">HI</option>
                <option value="pa" className="bg-[#151025] text-white">PA</option>
              </select>
            </div>

            {/* Current Inspector Pill */}
            {inspector && (
              <div className="hidden lg:flex items-center gap-2 pl-2.5 border-l border-[#2D2448] text-xs">
                <div className="w-7 h-7 rounded-full bg-violet-950 text-violet-300 border border-violet-700/60 flex items-center justify-center font-bold text-xs">
                  RS
                </div>
                <div>
                  <div className="font-semibold text-slate-200 leading-tight">{inspector.name}</div>
                  <div className="text-[10px] font-mono text-slate-400 leading-tight">
                    {inspector.id}
                  </div>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              id="btn-header-logout"
              type="button"
              onClick={() => setLogoutConfirmOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C1630] transition-colors cursor-pointer"
              title={t.logout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        {/* Sidebar for Desktop */}
        <aside
          className={`bg-[#151025] border-r border-[#2D2448] flex-col shrink-0 transition-all duration-200 ${
            isSidebarCollapsed ? 'w-18' : 'w-64'
          } ${
            mobileMenuOpen ? 'flex fixed inset-y-0 left-0 z-50 shadow-2xl pt-16 w-64' : 'hidden md:flex'
          }`}
        >
          {/* Inspector summary card inside sidebar */}
          <div className="p-3 border-b border-[#2D2448] bg-[#1C1630]/60 flex items-center justify-between">
            {!isSidebarCollapsed ? (
              <div className="overflow-hidden">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">
                  Assigned Field Officer
                </div>
                <div className="font-bold text-white text-sm mt-0.5 truncate">{inspector?.name || 'Rahul Sharma'}</div>
                <div className="text-xs text-violet-300 font-mono truncate">{inspector?.id || 'INS-1042'}</div>
              </div>
            ) : (
              <div className="mx-auto w-8 h-8 rounded-lg bg-violet-900/60 border border-violet-600/50 flex items-center justify-center text-xs font-bold text-violet-200" title={`Officer ${inspector?.name}`}>
                RS
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#251D42] transition-colors cursor-pointer ml-1 shrink-0"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-2.5 space-y-1.5 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.route;

              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  type="button"
                  onClick={() => {
                    onNavigate(item.route);
                    setMobileMenuOpen(false);
                  }}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'
                  } rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-950/80 font-bold'
                      : 'text-slate-300 hover:bg-[#1C1630] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isSidebarCollapsed && item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60 font-semibold shrink-0">
                      {item.badge}
                    </span>
                  )}
                  {isSidebarCollapsed && item.badge && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Protocol Reference Badge */}
          {!isSidebarCollapsed && (
            <div className="p-3 border-t border-[#2D2448] bg-[#1C1630]/40 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Legal Metrology Act, 2009</div>
              <div className="text-[10px] text-slate-500 leading-tight">
                PCR 2011 · Evidence-first deterministic verification engine.
              </div>
            </div>
          )}
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Footer Notice */}
      <footer className="bg-[#151025] border-t border-[#2D2448] py-3 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong className="text-slate-200">LabelLens Prototype</strong> — Smart India Hackathon Problem SIH26034
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Field Inspection & Evidence Verification Console · Dept of Consumer Affairs
          </span>
        </div>
      </footer>

      {/* Global Modals Mounted at Shell Level */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={onNavigate}
        onOpenOnboarding={() => setOnboardingOpen(true)}
        onStartNewInspection={() => setStartModalOpen(true)}
      />

      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onStartInspecting={() => {
          setOnboardingOpen(false);
          setStartModalOpen(true);
        }}
      />

      <StartInspectionModal
        isOpen={startModalOpen}
        onClose={() => setStartModalOpen(false)}
        onStart={handleStartInspectionFromModal}
      />

      <ConfirmDialog
        id="confirm-logout-dialog"
        isOpen={logoutConfirmOpen}
        title="Sign Out of Workstation"
        message="Are you sure you want to end your active inspection session? Any unsaved local changes will remain in workstation storage."
        confirmLabel="Sign Out"
        cancelLabel="Stay Signed In"
        isDestructive={true}
        onConfirm={onLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />

      <AiAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        activeInspection={storageService.getActiveDraft() || storageService.getInspections()[0] || null}
      />
    </div>
  );
};
