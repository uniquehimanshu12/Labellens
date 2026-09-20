import React from 'react';
import { Check, ShieldCheck } from 'lucide-react';

interface InspectionStepperProps {
  currentStep: number; // 1 to 6
  onSelectStep?: (step: number) => void;
  maxStepAllowed?: number;
}

export const InspectionStepper: React.FC<InspectionStepperProps> = ({
  currentStep,
  onSelectStep,
  maxStepAllowed = 6,
}) => {
  const steps = [
    { num: 1, name: 'PREPARE', desc: 'Metadata & Location' },
    { num: 2, name: 'CAPTURE', desc: 'Package Images' },
    { num: 3, name: 'SCAN', desc: 'Inspection Console' },
    { num: 4, name: 'VERIFY', desc: 'Declarations & Rules' },
    { num: 5, name: 'REVIEW', desc: 'Audit & Pre-flight' },
    { num: 6, name: 'COMPLETE', desc: 'Finalized Dossier' },
  ];

  return (
    <div
      id="inspection-stepper"
      className="w-full bg-[#140F24] border border-[#2D234C] rounded-2xl p-3.5 sm:p-4 shadow-xl select-none"
    >
      {/* Desktop Horizontal Stepper */}
      <ol className="hidden md:flex items-center w-full justify-between gap-2">
        {steps.map((s, index) => {
          const isCompleted = s.num < currentStep;
          const isCurrent = s.num === currentStep;
          const isSelectable = onSelectStep && s.num <= maxStepAllowed && s.num < currentStep;

          return (
            <li
              key={s.num}
              className={`flex items-center flex-1 ${
                index < steps.length - 1
                  ? "after:content-[''] after:w-full after:h-0.5 after:mx-2 after:transition-all after:duration-500 " +
                    (isCompleted ? 'after:bg-violet-600' : 'after:bg-[#2D234C]')
                  : ''
              }`}
            >
              <button
                type="button"
                disabled={!isSelectable && !isCurrent}
                onClick={() => isSelectable && onSelectStep && onSelectStep(s.num)}
                className={`flex items-center gap-2.5 text-left transition-all ${
                  isSelectable
                    ? 'cursor-pointer hover:opacity-90'
                    : isCurrent
                    ? 'cursor-default'
                    : 'cursor-not-allowed opacity-60'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/70 shadow-emerald-950/50'
                      : isCurrent
                      ? 'bg-violet-600 text-white ring-4 ring-violet-900/60 shadow-lg shadow-violet-950 scale-105'
                      : 'bg-[#1C1630] text-slate-500 border border-[#2D234C]'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <div className="shrink-0">
                  <div
                    className={`text-[10px] uppercase font-mono font-bold tracking-wider transition-colors ${
                      isCurrent ? 'text-violet-300' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {s.name}
                  </div>
                  <div
                    className={`text-xs truncate max-w-[110px] transition-colors ${
                      isCurrent
                        ? 'text-white font-bold'
                        : isCompleted
                        ? 'text-slate-300 font-semibold'
                        : 'text-slate-500 font-normal'
                    }`}
                  >
                    {s.desc}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Mobile Compact Step Bar */}
      <div className="md:hidden flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs font-mono shadow-md">
            {currentStep}
          </div>
          <div>
            <span className="font-mono text-[10px] font-bold text-violet-300 uppercase mr-1.5">
              {steps[currentStep - 1]?.name}
            </span>
            <span className="font-bold text-white">
              {steps[currentStep - 1]?.desc}
            </span>
          </div>
        </div>
        <span className="text-slate-400 text-[11px] font-mono">
          Step {currentStep} of 6
        </span>
      </div>
    </div>
  );
};
