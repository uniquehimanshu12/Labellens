import React, { useState, useEffect } from 'react';
import { PackageImages, ImageSide, ImageQualityWarning } from '../../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  Upload, 
  Trash2, 
  Maximize2, 
  CheckCircle2, 
  AlertTriangle,
  RotateCw,
  Sparkles,
  Layers
} from 'lucide-react';
import { QualityIndicator } from './QualityIndicator';

interface PackageImageCarouselProps {
  images: PackageImages;
  onCameraClick: (side: ImageSide) => void;
  onFileSelect: (side: ImageSide, dataUrl: string) => void;
  onRemove: (side: ImageSide) => void;
  onOpenLightbox: (side: ImageSide) => void;
  onTestImage?: (side: ImageSide) => void;
  isTestingSide?: ImageSide | null;
}

export const PackageImageCarousel: React.FC<PackageImageCarouselProps> = ({
  images,
  onCameraClick,
  onFileSelect,
  onRemove,
  onOpenLightbox,
  onTestImage,
  isTestingSide,
}) => {
  const sides: { side: ImageSide; label: string; isRecommended: boolean }[] = [
    { side: 'front', label: 'FRONT PANEL', isRecommended: true },
    { side: 'back', label: 'BACK PANEL', isRecommended: true },
    { side: 'side', label: 'SIDE / LATERAL', isRecommended: true },
    { side: 'additional', label: 'ADDITIONAL VIEW', isRecommended: false },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const currentSlot = sides[currentIndex];
  const currentImageSrc = images[currentSlot.side];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : sides.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < sides.length - 1 ? prev + 1 : 0));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onFileSelect(currentSlot.side, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const capturedCount = Object.values(images).filter(Boolean).length;

  return (
    <div
      id="package-image-carousel"
      className="bg-[#140F24] border border-[#2D234C] rounded-2xl p-5 shadow-xl space-y-4 text-slate-100"
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b border-[#2D234C] pb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-700/60 uppercase">
            {currentSlot.label}
          </span>
          <span className="text-xs font-mono text-slate-400">
            {currentIndex + 1} of {sides.length}
          </span>
          {currentImageSrc ? (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/60 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Captured</span>
            </span>
          ) : currentSlot.isRecommended ? (
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/60">
              Not Added · Recommended
            </span>
          ) : (
            <span className="text-[10px] font-mono text-slate-400 bg-[#1C1630] px-2 py-0.5 rounded border border-[#2D234C]">
              Optional
            </span>
          )}
        </div>

        {/* Previous / Next Arrow Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1.5 rounded-xl border border-[#2D234C] bg-[#1C1630] hover:bg-[#251D42] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Previous surface (Left arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="p-1.5 rounded-xl border border-[#2D234C] bg-[#1C1630] hover:bg-[#251D42] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Next surface (Right arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Preview Stage (Horizontal Slide Transition) */}
      <div className="relative bg-[#0A0713] rounded-2xl border border-[#2D234C] min-h-[360px] flex items-center justify-center p-4 overflow-hidden group">
        {currentImageSrc ? (
          <div className="relative max-h-[340px] max-w-full flex items-center justify-center animate-in fade-in zoom-in-98 duration-200">
            <img
              src={currentImageSrc}
              alt={currentSlot.label}
              className="max-h-[330px] rounded-xl object-contain shadow-2xl border border-[#2D234C]"
            />

            {/* Hover Action Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3 backdrop-blur-xs">
              <button
                type="button"
                onClick={() => onOpenLightbox(currentSlot.side)}
                className="p-3 rounded-xl bg-violet-600 text-white font-bold text-xs shadow-xl flex items-center gap-1.5 hover:bg-violet-500 transition-all cursor-pointer"
                title="Inspect in Lightbox"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Open Lightbox</span>
              </button>

              <button
                type="button"
                onClick={() => onRemove(currentSlot.side)}
                className="p-3 rounded-xl bg-rose-600/80 text-white font-bold text-xs shadow-xl flex items-center gap-1.5 hover:bg-rose-500 transition-all cursor-pointer"
                title="Remove image"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 max-w-sm space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1C1630] border border-[#2D234C] flex items-center justify-center mx-auto text-violet-400">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{currentSlot.label}</div>
              <p className="text-xs text-slate-400 mt-1">
                {currentSlot.isRecommended
                  ? 'Key surface for MRP, net quantity, and manufacturer verification.'
                  : 'Supplementary display panel for barcodes or secondary declarations.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onCameraClick(currentSlot.side)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-violet-950 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Capture Camera</span>
              </button>

              <label className="px-4 py-2 rounded-xl border border-[#2D234C] bg-[#1C1630] hover:bg-[#251D42] text-slate-200 text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-violet-400" />
                <span>Upload File</span>
                <input
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

      {/* Bottom Thumbnail Strip */}
      <div className="grid grid-cols-4 gap-2.5 pt-1">
        {sides.map((s, idx) => {
          const img = images[s.side];
          const isSelected = idx === currentIndex;

          return (
            <button
              key={s.side}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`rounded-xl border p-2 flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-violet-500 bg-violet-950/40 ring-2 ring-violet-500/40 shadow-lg'
                  : 'border-[#2D234C] bg-[#1C1630]/60 hover:bg-[#1C1630]'
              }`}
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0A0713] border border-[#2D234C] shrink-0 flex items-center justify-center">
                {img ? (
                  <img src={img} alt={s.label} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-bold text-white uppercase truncate">
                  {s.side}
                </div>
                <div
                  className={`text-[9px] font-mono truncate ${
                    img ? 'text-emerald-400 font-semibold' : s.isRecommended ? 'text-amber-400' : 'text-slate-500'
                  }`}
                >
                  {img ? 'Captured' : s.isRecommended ? 'Pending' : 'Optional'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
