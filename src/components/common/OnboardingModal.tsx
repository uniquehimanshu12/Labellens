import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Camera, 
  Scan, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  FileText, 
  Crosshair, 
  PenTool,
  Search,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartInspecting?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartInspecting,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      stepNumber: '01 / 04',
      badge: 'Step 1: Capture',
      title: 'CAPTURE PACKAGE SURFACES',
      subtitle: 'Upload or photograph available packaging panels',
      description:
        'Capture available packaging panels (Front, Back, Side, or Additional). You do not need all 4 surfaces to begin—LabelLens maps every declaration directly to its source surface.',
      visual: (
        <div className="bg-[#1C1630] border border-[#2D2448] rounded-xl p-4 flex flex-col justify-center h-48">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'FRONT', active: true, color: 'border-violet-500 bg-violet-950/30' },
              { label: 'BACK', active: true, color: 'border-violet-500 bg-violet-950/30' },
              { label: 'SIDE', active: true, color: 'border-violet-500 bg-violet-950/30' },
              { label: 'EXTRA', active: false, color: 'border-[#2D2448] bg-[#151025]' },
            ].map((slot) => (
              <div
                key={slot.label}
                className={`rounded-lg border p-2 flex flex-col items-center justify-center gap-1.5 h-24 ${slot.color}`}
              >
                <div className="text-[10px] font-mono font-bold text-slate-300">{slot.label}</div>
                <div className="w-7 h-7 rounded-md bg-[#0D0917] border border-[#2D2448] flex items-center justify-center">
                  <Camera className={`w-3.5 h-3.5 ${slot.active ? 'text-violet-400' : 'text-slate-600'}`} />
                </div>
                <div className={`text-[9px] font-mono ${slot.active ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {slot.active ? 'Captured' : 'Optional'}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[11px] text-center text-slate-400">
            High-resolution panel capture preserves fine lettering for Rule 5 verification.
          </div>
        </div>
      ),
    },
    {
      stepNumber: '02 / 04',
      badge: 'Step 2: Scan',
      title: 'SCAN & EXTRACT DECLARATIONS',
      subtitle: 'Automated OCR and statutory metrology detection',
      description:
        'Multimodal inspection reads visible text across all submitted package surfaces, locating required declarations like MRP, Net Quantity, Batch, and Manufacturer details.',
      visual: (
        <div className="bg-[#1C1630] border border-[#2D2448] rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden h-48">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-violet-600/30 border border-violet-500/60 flex items-center justify-center text-violet-300 shadow-md">
              <Scan className="w-6 h-6 text-violet-400" />
            </div>
            <div className="h-0.5 w-6 bg-violet-600/60" />
            <div className="w-12 h-12 rounded-xl bg-[#151025] border border-[#2D2448] flex items-center justify-center text-violet-300">
              <Search className="w-6 h-6 text-violet-400" />
            </div>
            <div className="h-0.5 w-6 bg-violet-600/60" />
            <div className="w-12 h-12 rounded-xl bg-emerald-950/40 border border-emerald-600/60 flex items-center justify-center text-emerald-300">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-400 tracking-wider uppercase text-center relative z-10">
            Automated Metrology Pipeline · SIH26034 Standard
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-violet-300">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span>Exact Coordinate Extraction Engine</span>
          </div>
        </div>
      ),
    },
    {
      stepNumber: '03 / 04',
      badge: 'Step 3: Verify',
      title: 'VERIFY EVIDENCE & FINDINGS',
      subtitle: 'Audit statutory bounding boxes and rule compliance',
      description:
        'Review statutory findings and open the Evidence Viewer or Field Drawer to verify raw package crops. Officers can accept values or apply corrections with complete audit logging.',
      visual: (
        <div className="bg-[#1C1630] border border-[#2D2448] rounded-xl p-4 flex flex-col justify-center h-48 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-36 h-28 rounded-lg bg-[#0D0917] border border-[#2D2448] p-2 relative flex flex-col justify-between shrink-0">
              <div className="text-[9px] font-mono text-slate-500">FRONT_SURFACE.JPG</div>
              <div className="border border-violet-500 bg-violet-500/20 rounded p-1 text-[9px] font-mono text-violet-200">
                MRP ₹68.00 (Incl. of all taxes)
              </div>
              <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-400">
                <Crosshair className="w-2.5 h-2.5" />
                <span>Box: [28, 182, 260, 24]</span>
              </div>
            </div>

            <div className="flex-1 bg-[#151025] border border-[#2D2448] rounded-lg p-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-300">Statutory Field</span>
                <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-700/60">
                  95% Match
                </span>
              </div>
              <div className="text-xs font-bold text-white">Maximum Retail Price (MRP)</div>
              <div className="text-[11px] font-mono text-violet-300">₹68.00 (Incl. Taxes)</div>
              <div className="text-[10px] text-slate-400">Source: Front Surface</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      stepNumber: '04 / 04',
      badge: 'Step 4: Report',
      title: 'ISSUE INSPECTION REPORT',
      subtitle: 'Affix digital attestation and export court-ready PDF',
      description:
        'Review pre-flight checklist, record officer remarks, stamp your digital signature, and export or print an official Legal Metrology inspection dossier.',
      visual: (
        <div className="bg-[#1C1630] border border-[#2D2448] rounded-xl p-4 flex flex-col justify-center h-48">
          <div className="space-y-1.5 max-w-sm mx-auto w-full">
            <div className="flex items-center gap-2 text-xs text-slate-200 bg-[#151025] p-2 rounded-lg border border-[#2D2448]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Declarations verified against physical evidence</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-200 bg-[#151025] p-2 rounded-lg border border-[#2D2448]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Location tagged & GPS timestamp affixed</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-200 bg-[#151025] p-2 rounded-lg border border-[#2D2448]">
              <PenTool className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Officer digital signature securely stamped</span>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-center gap-2 text-[11px] font-mono text-violet-300">
            <FileText className="w-3.5 h-3.5" />
            <span>SIH26034 Standard Metrology Dossier</span>
          </div>
        </div>
      ),
    },
  ];

  const current = slides[currentSlide];

  const handleFinish = () => {
    localStorage.setItem('labellens_onboarding_completed', 'true');
    onClose();
    if (onStartInspecting) {
      onStartInspecting();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('labellens_onboarding_completed', 'true');
    onClose();
  };

  return (
    <div
      id="onboarding-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="onboarding-modal-card"
        className="bg-[#140F24] border border-[#2D234C] rounded-xl max-w-lg w-full p-5 shadow-2xl relative text-slate-100 flex flex-col justify-between min-h-[480px]"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-[#2D234C] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-700/60">
              {current.badge}
            </span>
            <span className="text-xs font-mono text-slate-400">{current.stepNumber}</span>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1C1630] transition-colors cursor-pointer"
            title="Skip tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="my-3 space-y-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">{current.title}</h2>
            <div className="text-xs font-semibold text-violet-400 mt-0.5">{current.subtitle}</div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{current.description}</p>
          </div>

          {/* Visual Presentation */}
          <div className="transition-all duration-200">{current.visual}</div>
        </div>

        {/* Footer controls & dots */}
        <div className="border-t border-[#2D234C] pt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 transition-colors cursor-pointer"
          >
            Skip Tutorial
          </button>

          {/* Pagination Indicators */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === currentSlide ? 'w-5 bg-violet-500' : 'w-1.5 bg-[#2D234C] hover:bg-slate-600'
                }`}
                title={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentSlide > 0 && (
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                className="px-3 py-1.5 rounded-lg border border-[#2D234C] hover:bg-[#1C1630] text-xs font-semibold text-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {currentSlide < slides.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
                className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-950 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-950 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Start Inspecting</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
