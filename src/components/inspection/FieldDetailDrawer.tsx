import React, { useRef, useEffect } from 'react';
import { ExtractedField, PackageImages, UploadedImageRecord } from '../../types';
import { 
  X, 
  CheckCircle2, 
  Edit3, 
  EyeOff, 
  Crosshair, 
  ShieldCheck, 
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface FieldDetailDrawerProps {
  field: ExtractedField | null;
  images: PackageImages;
  imageRecords?: Record<string, UploadedImageRecord | null>;
  onClose: () => void;
  onVerify: (fieldKey: string) => void;
  onEdit: (field: ExtractedField) => void;
  onMarkNotDetected: (fieldKey: string) => void;
  onOpenFullEvidence?: (field: ExtractedField) => void;
}

export const FieldDetailDrawer: React.FC<FieldDetailDrawerProps> = ({
  field,
  images,
  imageRecords,
  onClose,
  onVerify,
  onEdit,
  onMarkNotDetected,
  onOpenFullEvidence,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Resolve source image for evidence crop
  const sourceSideKey = (field?.sourceImage?.toLowerCase() || 'front') as 'front' | 'back' | 'side' | 'additional';
  const sourceDataUrl = (images as any)[sourceSideKey] || images.front;
  const primaryEvidence = field?.evidence?.[0];

  // Draw evidence crop on canvas if coordinates exist
  useEffect(() => {
    if (!field || !sourceDataUrl || !primaryEvidence || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = sourceDataUrl;

    img.onload = () => {
      const padding = 16;
      const cropX = Math.max(0, primaryEvidence.x - padding);
      const cropY = Math.max(0, primaryEvidence.y - padding);
      const cropW = Math.min(img.naturalWidth - cropX, primaryEvidence.width + padding * 2);
      const cropH = Math.min(img.naturalHeight - cropY, primaryEvidence.height + padding * 2);

      canvas.width = cropW;
      canvas.height = cropH;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      // Draw bounding box highlight inside crop
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        primaryEvidence.x - cropX,
        primaryEvidence.y - cropY,
        primaryEvidence.width,
        primaryEvidence.height
      );
    };
  }, [field, sourceDataUrl, primaryEvidence]);

  if (!field) return null;

  const hasDiscrepancy = field.isManuallyVerified && field.verifiedValue !== field.extractedValue;

  return (
    <div
      id="field-detail-drawer-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
    >
      <div
        id="field-detail-drawer-panel"
        className="w-full max-w-md bg-[#140F24] border-l border-[#2D234C] h-full shadow-2xl flex flex-col justify-between text-slate-100 animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#2D234C] bg-[#1C1630]/60 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-700/60">
                Statutory Field Detail
              </span>
              {field.isManuallyVerified && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                  Verified
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white mt-1">{field.label}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C1630] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Observed Value Card */}
          <div className="bg-[#1C1630] border border-[#2D234C] rounded-2xl p-4 space-y-2 shadow-md">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Current Declaration Value
            </div>
            <div className="text-base font-bold font-mono text-white break-words">
              {field.verifiedValue || field.extractedValue || (
                <span className="text-slate-500 italic font-sans">Not detected on package</span>
              )}
            </div>

            {hasDiscrepancy && (
              <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-2.5 text-[11px] text-amber-200">
                <div className="font-bold">Inspector Override Active</div>
                <div className="text-slate-400 line-through mt-0.5">
                  OCR: {field.extractedValue || 'None'}
                </div>
              </div>
            )}
          </div>

          {/* Confidence & Source Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1C1630] border border-[#2D234C] rounded-xl p-3">
              <div className="text-[10px] uppercase font-bold text-slate-400">Confidence State</div>
              <div className="text-xs font-bold text-violet-300 mt-1 font-mono">
                {field.confidenceState || `${field.confidence || 90}% Match`}
              </div>
            </div>

            <div className="bg-[#1C1630] border border-[#2D234C] rounded-xl p-3">
              <div className="text-[10px] uppercase font-bold text-slate-400">Source Surface</div>
              <div className="text-xs font-bold text-slate-200 mt-1 uppercase font-mono">
                {field.sourceImage || 'Front Panel'}
              </div>
            </div>
          </div>

          {/* Evidence Crop Region */}
          <div className="bg-[#1C1630] border border-[#2D234C] rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-violet-400" />
                <span>Evidence Region Crop</span>
              </div>
              {onOpenFullEvidence && (
                <button
                  type="button"
                  onClick={() => onOpenFullEvidence(field)}
                  className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
                >
                  Full Viewer ↗
                </button>
              )}
            </div>

            {primaryEvidence ? (
              <div className="rounded-xl overflow-hidden border border-[#2D234C] bg-[#090610] p-2 flex flex-col items-center">
                <canvas ref={canvasRef} className="max-h-48 max-w-full rounded object-contain shadow-md" />
                {primaryEvidence.snippet && (
                  <div className="text-[10px] font-mono text-slate-400 mt-2 text-center break-words max-w-xs">
                    "{primaryEvidence.snippet}"
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 italic bg-[#0D0917] rounded-xl border border-dashed border-[#2D234C]">
                No geometric bounding box coordinates registered for this field.
              </div>
            )}
          </div>

          {/* Statutory Rule Connection */}
          <div className="bg-[#151025] border border-[#2D234C] rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Legal Metrology Rule Requirement</span>
            </div>
            <p className="leading-relaxed">
              Mandatory under Legal Metrology (Packaged Commodities) Rules, 2011. Must appear with prescribed
              height-to-width ratio and unambiguous clarity.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-[#2D234C] bg-[#1C1630]/80 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onVerify(field.key)}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-950 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify / Accept</span>
            </button>

            <button
              type="button"
              onClick={() => onEdit(field)}
              className="px-4 py-2.5 rounded-xl border border-[#2D234C] hover:bg-[#251D42] text-slate-200 font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-violet-400" />
              <span>Edit Value</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onMarkNotDetected(field.key)}
            className="w-full py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Mark as Not Detected on Package</span>
          </button>
        </div>
      </div>
    </div>
  );
};
