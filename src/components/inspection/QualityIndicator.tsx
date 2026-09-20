import React from 'react';
import { ImageQualityWarning, ImageSide } from '../../types';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface QualityIndicatorProps {
  side: ImageSide;
  quality?: ImageQualityWarning;
  hasImage: boolean;
}

export const QualityIndicator: React.FC<QualityIndicatorProps> = ({ side, quality, hasImage }) => {
  if (!hasImage) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono py-1 px-2.5 rounded-lg bg-[#151025] border border-[#2D2448]">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
        <span>No image uploaded for {side}</span>
      </div>
    );
  }

  const state = quality?.qualityState || 'Good image quality';
  const isWarning =
    quality?.blurDetected ||
    quality?.lowLighting ||
    quality?.angleSteep ||
    state.toLowerCase().includes('blur') ||
    state.toLowerCase().includes('lighting') ||
    state.toLowerCase().includes('hidden') ||
    state.toLowerCase().includes('small');

  return (
    <div
      id={`quality-indicator-${side}`}
      className={`flex items-center justify-between text-xs py-1.5 px-3 rounded-lg border ${
        isWarning
          ? 'bg-amber-950/60 border-amber-700/60 text-amber-200'
          : 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
      }`}
    >
      <div className="flex items-center gap-2">
        {isWarning ? (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        )}
        <div>
          <span className="font-semibold">{state}</span>
          {quality?.notes && (
            <span className="text-[11px] text-slate-400 ml-1.5 hidden sm:inline">
              — {quality.notes}
            </span>
          )}
        </div>
      </div>

      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-[#0D0917]/70 px-1.5 py-0.5 rounded border border-[#2D2448]">
        Surface QA
      </span>
    </div>
  );
};
