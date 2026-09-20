import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  PlusCircle, 
  CheckSquare, 
  History, 
  Scale, 
  FileBarChart, 
  Settings, 
  HelpCircle,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string, params?: { inspectionId?: string }) => void;
  onOpenOnboarding: () => void;
  onStartNewInspection: () => void;
  onOpenAiAssistant?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenOnboarding,
  onStartNewInspection,
  onOpenAiAssistant,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const actions = [
    {
      id: 'ai-assistant',
      title: 'AI Compliance Assistant & Live Voice',
      subtitle: 'Ask Gemini about PCR 2011, FSSAI regulations, or start voice conversation',
      icon: Sparkles,
      action: () => {
        onClose();
        if (onOpenAiAssistant) {
          onOpenAiAssistant();
        }
      },
      category: 'AI Assistant',
    },
    {
      id: 'new-inspection',
      title: 'Start New Inspection',
      subtitle: 'Open inspection initiation modal & capture package surfaces',
      icon: PlusCircle,
      action: () => {
        onClose();
        onStartNewInspection();
      },
      category: 'Inspection Actions',
    },
    {
      id: 'review-queue',
      title: 'Open Review Queue',
      subtitle: 'View inspections requiring officer confirmation or evidence check',
      icon: CheckSquare,
      action: () => {
        onClose();
        onNavigate('review-queue');
      },
      category: 'Inspection Actions',
    },
    {
      id: 'history',
      title: 'Inspection History & Archive',
      subtitle: 'Browse all previously signed and finalized inspection records',
      icon: History,
      action: () => {
        onClose();
        onNavigate('history');
      },
      category: 'Navigation',
    },
    {
      id: 'rules-references',
      title: 'Rules & References Database',
      subtitle: 'Legal Metrology (Packaged Commodities) Rules, 2011 knowledge base',
      icon: Scale,
      action: () => {
        onClose();
        onNavigate('rules-references');
      },
      category: 'Knowledge',
    },
    {
      id: 'reports',
      title: 'Inspection Reports & Dossiers',
      subtitle: 'Generate and print official Form-1 inspection certificates',
      icon: FileBarChart,
      action: () => {
        onClose();
        onNavigate('reports');
      },
      category: 'Navigation',
    },
    {
      id: 'onboarding',
      title: 'Getting Started Tutorial',
      subtitle: 'Open 4-step interactive guide to LabelLens evidence workflows',
      icon: HelpCircle,
      action: () => {
        onClose();
        onOpenOnboarding();
      },
      category: 'Help',
    },
    {
      id: 'settings',
      title: 'Inspector Station Settings',
      subtitle: 'Configure OCR engine, display theme, and station profile',
      icon: Settings,
      action: () => {
        onClose();
        onNavigate('settings');
      },
      category: 'Configuration',
    },
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="command-palette-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="command-palette-modal"
        className="bg-[#140F24] border border-[#2D234C] rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-slate-100"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#2D234C] flex items-center gap-3 bg-[#1C1630]/60">
          <Search className="w-5 h-5 text-violet-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, tool, or screen..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-hidden"
          />
          <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-[#151025] border border-[#2D234C]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching inspector commands for "{query}".
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'hover:bg-[#1C1630] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#1C1630] text-violet-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">{item.title}</div>
                      <div
                        className={`text-[11px] ${
                          isSelected ? 'text-violet-100' : 'text-slate-400'
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 ${isSelected ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-[#0D0917] border-t border-[#2D234C] text-[11px] text-slate-500 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1 py-0.5 rounded bg-[#1C1630] text-[10px] text-slate-400">↑</kbd>
            <kbd className="px-1 py-0.5 rounded bg-[#1C1630] text-[10px] text-slate-400">↓</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-[#1C1630] text-[10px] text-slate-400">ENTER</kbd>
          </div>
          <span className="font-mono text-[10px]">LabelLens SIH26034 Workstation</span>
        </div>
      </div>
    </div>
  );
};
