import React, { useRef, useState, useEffect } from 'react';
import { InspectorSignature } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PenTool, RotateCcw, Check, ShieldCheck, Eraser } from 'lucide-react';

interface SignaturePadProps {
  inspectorName: string;
  inspectorId: string;
  initialSignature?: InspectorSignature;
  onSave: (signature: InspectorSignature) => void;
  readOnly?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  inspectorName,
  inspectorId,
  initialSignature,
  onSave,
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [savedSignature, setSavedSignature] = useState<InspectorSignature | undefined>(initialSignature);
  const [isSaved, setIsSaved] = useState(Boolean(initialSignature?.signatureDataUrl));
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  useEffect(() => {
    if (initialSignature?.signatureDataUrl) {
      setSavedSignature(initialSignature);
      setIsSaved(true);
      setHasDrawn(true);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // Invert black strokes to white for dark canvas display
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
              if (data[i + 3] > 0 && data[i] < 50 && data[i + 1] < 50 && data[i + 2] < 50) {
                data[i] = 255;
                data[i + 1] = 255;
                data[i + 2] = 255;
              }
            }
            ctx.putImageData(imgData, 0, 0);
          };
          img.src = initialSignature.signatureDataUrl;
        }
      }
    }
  }, [initialSignature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly || isSaved) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#FFFFFF'; // Crisp white ink on dark purple canvas
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly || isSaved) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const executeClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setIsSaved(false);
    setSavedSignature(undefined);
    setClearConfirmOpen(false);
  };

  const handleClear = () => {
    if (isSaved) {
      setClearConfirmOpen(true);
    } else {
      executeClear();
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    // Create export canvas with black stroke (#000000) for final report & signature records
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    if (exportCtx) {
      exportCtx.drawImage(canvas, 0, 0);
      const imgData = exportCtx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      // Convert drawn white/light pixels to solid black (#000000)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a > 0 && (r > 100 || g > 100 || b > 100)) {
          data[i] = 0;     // R
          data[i + 1] = 0; // G
          data[i + 2] = 0; // B
          data[i + 3] = a; // keep alpha
        }
      }
      exportCtx.putImageData(imgData, 0, 0);
    }

    const dataUrl = exportCanvas.toDataURL('image/png');
    const nowIso = new Date().toISOString();
    const sig: InspectorSignature = {
      signatureDataUrl: dataUrl,
      signedAt: nowIso,
      officerName: inspectorName,
      officerId: inspectorId,
    };
    setSavedSignature(sig);
    setIsSaved(true);
    onSave(sig);
  };

  return (
    <div id="inspector-certification-section" className="bg-[#151025] border border-[#2D2448] rounded-2xl p-5 shadow-xl text-slate-200">
      <div className="flex items-center justify-between pb-3 border-b border-[#2D2448]">
        <div>
          <h4 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <PenTool className="w-4 h-4 text-violet-400" />
            Inspector Certification & Attestation
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Electronic certification of physical package inspection under SIH26034 protocol.
          </p>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 bg-[#1C1630] text-violet-300 rounded-lg border border-[#2D2448]">
          Electronic Signoff
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4 text-xs">
        <div className="p-3 bg-[#1C1630] border border-[#2D2448] rounded-xl">
          <span className="block text-slate-400 text-[10px] uppercase font-mono tracking-wider">Inspector Name</span>
          <span className="font-semibold text-white text-sm">{inspectorName}</span>
        </div>
        <div className="p-3 bg-[#1C1630] border border-[#2D2448] rounded-xl">
          <span className="block text-slate-400 text-[10px] uppercase font-mono tracking-wider">Officer ID / Badge</span>
          <span className="font-semibold text-violet-300 font-mono text-sm">{inspectorId}</span>
        </div>
        <div className="p-3 bg-[#1C1630] border border-[#2D2448] rounded-xl">
          <span className="block text-slate-400 text-[10px] uppercase font-mono tracking-wider">Attestation Timestamp</span>
          <span className="font-semibold text-slate-200 font-mono text-xs">
            {savedSignature?.signedAt
              ? new Date(savedSignature.signedAt).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Pending signoff'}
          </span>
        </div>
      </div>

      {/* Canvas Pad Container */}
      <div className="relative border-2 border-dashed border-[#2D2448] rounded-xl bg-[#0D0917] overflow-hidden select-none">
        <canvas
          id="inspector-signature-canvas"
          ref={canvasRef}
          width={500}
          height={140}
          className={`w-full h-[140px] touch-none cursor-crosshair ${
            isSaved ? 'bg-[#0D0917] cursor-not-allowed opacity-90' : 'bg-[#0D0917]'
          }`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Baseline guideline */}
        <div className="absolute bottom-6 left-8 right-8 border-b border-[#2D2448] pointer-events-none flex justify-between">
          <span className="text-[10px] font-mono text-slate-500 -mt-4">Sign above this line</span>
          <span className="text-[10px] font-mono text-slate-500 -mt-4">✕</span>
        </div>

        {/* Saved Watermark Pill */}
        {isSaved && (
          <div className="absolute top-2.5 right-2.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Signature Attested
          </div>
        )}
      </div>

      {/* Pad Controls */}
      {!readOnly && (
        <div className="flex items-center justify-between mt-3 pt-2">
          <div className="text-[11px] text-slate-400">
            {isSaved ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Signature locked into immutable inspection audit trail.
              </span>
            ) : (
              <span>Draw signature with mouse, touchpad, or stylus.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isSaved ? (
              <button
                id="btn-resign-signature"
                type="button"
                onClick={handleClear}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-[#1C1630] hover:bg-[#251D42] border border-[#2D2448] rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <Eraser className="w-3.5 h-3.5 text-slate-400" />
                Re-sign
              </button>
            ) : (
              <>
                <button
                  id="btn-clear-signature"
                  type="button"
                  onClick={handleClear}
                  disabled={!hasDrawn}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#1C1630] hover:bg-[#251D42] border border-[#2D2448] rounded-lg inline-flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  Clear
                </button>
                <button
                  id="btn-save-signature"
                  type="button"
                  onClick={handleSave}
                  disabled={!hasDrawn}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg inline-flex items-center gap-1.5 shadow-md transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Check className="w-3.5 h-3.5" />
                  Attest Signature
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        id="confirm-clear-signature-dialog"
        isOpen={clearConfirmOpen}
        title="Clear Attested Signature"
        message="Are you sure you want to clear your attested digital signature? You will need to re-draw and sign off again before issuing the final report."
        confirmLabel="Clear Signature"
        cancelLabel="Keep Signature"
        isDestructive={true}
        onConfirm={executeClear}
        onCancel={() => setClearConfirmOpen(false)}
      />
    </div>
  );
};
