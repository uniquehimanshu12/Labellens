import React, { useState } from 'react';
import { ImageSide, ImageQualityWarning } from '../../types';
import { Camera, Upload, Trash2, RefreshCw, ZoomIn, CheckCircle2, Terminal, RotateCw } from 'lucide-react';
import { QualityIndicator } from './QualityIndicator';

interface CaptureSlotProps {
  side: ImageSide;
  label: string;
  isRecommended?: boolean;
  imageSrc: string | null;
  warning?: ImageQualityWarning;
  onCameraClick: () => void;
  onFileSelect: (imageDataUrl: string) => void;
  onRemove: () => void;
  onPreview: () => void;
  onTestImage?: () => void;
  isTesting?: boolean;
}

export const CaptureSlot: React.FC<CaptureSlotProps> = ({
  side,
  label,
  isRecommended = true,
  imageSrc,
  warning,
  onCameraClick,
  onFileSelect,
  onRemove,
  onPreview,
  onTestImage,
  isTesting,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onFileSelect(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onFileSelect(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      id={`capture-slot-${side}`}
      className={`rounded-2xl border transition-all ${
        imageSrc
          ? 'border-[#2D2448] bg-[#151025] shadow-xl'
          : isDragging
          ? 'border-violet-500 bg-violet-950/40'
          : 'border-[#2D2448] bg-[#151025]/60 hover:bg-[#151025]'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Slot Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2D2448] bg-[#1C1630]/60 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-200 tracking-wider uppercase">{label}</span>
          {isRecommended ? (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-violet-950/80 text-violet-300 border border-violet-700/60">
              Recommended
            </span>
          ) : (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#151025] text-slate-400 border border-[#2D2448]">
              Optional
            </span>
          )}
        </div>

        {imageSrc ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Captured</span>
          </span>
        ) : (
          <span className="text-[10px] font-mono text-slate-500">
            Side not captured
          </span>
        )}
      </div>

      {/* Slot Body */}
      <div className="p-4">
        {imageSrc ? (
          <div className="space-y-3">
            {/* Thumbnail */}
            <div className="relative group rounded-xl overflow-hidden border border-[#2D2448] bg-[#090610] flex items-center justify-center min-h-[180px] max-h-[210px]">
              <img
                src={imageSrc}
                alt={`${label} capture`}
                className="w-full h-[190px] object-contain cursor-pointer transition-transform group-hover:scale-[1.02]"
                onClick={onPreview}
              />
              <button
                type="button"
                onClick={onPreview}
                className="absolute inset-0 bg-[#0D0917]/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity backdrop-blur-xs cursor-pointer"
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-950/90 text-xs font-medium border border-violet-700/60">
                  <ZoomIn className="w-3.5 h-3.5 text-violet-400" />
                  <span>Inspect Surface</span>
                </div>
              </button>
            </div>

            {/* Separate Image Quality Indicator */}
            <QualityIndicator side={side} quality={warning} hasImage={true} />

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#2D2448]">
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor={`replace-file-${side}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-[#1C1630] hover:bg-[#251D42] rounded-lg cursor-pointer transition-colors border border-[#2D2448]"
                >
                  <RefreshCw className="w-3 h-3 text-slate-400" />
                  <span>Replace</span>
                  <input
                    id={`replace-file-${side}`}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </label>

                {onTestImage && (
                  <button
                    type="button"
                    onClick={onTestImage}
                    disabled={isTesting}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-violet-300 hover:text-white bg-violet-950/70 hover:bg-violet-900/80 rounded-lg cursor-pointer transition-colors border border-violet-700/60 shadow-xs"
                    title="Run single image AI inspection to verify extracted text"
                  >
                    {isTesting ? (
                      <RotateCw className="w-3 h-3 text-violet-400 animate-spin" />
                    ) : (
                      <Terminal className="w-3 h-3 text-violet-400" />
                    )}
                    <span>Test Image</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onCameraClick}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-[#1C1630] hover:bg-[#251D42] rounded-lg cursor-pointer transition-colors border border-[#2D2448]"
                >
                  <Camera className="w-3 h-3 text-violet-400" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={onRemove}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-950/50 hover:bg-rose-900/60 rounded-lg cursor-pointer transition-colors border border-rose-800/60"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-[180px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#2D2448] rounded-xl bg-[#0D0917]/50">
            <div className="w-11 h-11 rounded-xl bg-[#1C1630] border border-[#2D2448] text-slate-400 flex items-center justify-center mb-2.5">
              <Camera className="w-5 h-5 text-violet-400" />
            </div>

            <div className="text-xs font-semibold text-slate-200">
              {label}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 mb-3.5 font-mono">
              Panel not provided (0–4 photos permitted)
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                id={`btn-camera-${side}`}
                type="button"
                onClick={onCameraClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md cursor-pointer transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Open Camera</span>
              </button>

              <label
                htmlFor={`upload-file-${side}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2D2448] bg-[#1C1630] hover:bg-[#251D42] text-slate-300 text-xs font-medium cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload File</span>
                <input
                  id={`upload-file-${side}`}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
