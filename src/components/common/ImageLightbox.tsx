import React, { useState, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Layers,
  Crosshair
} from 'lucide-react';
import { ImageSide, ExtractedField } from '../../types';

export interface LightboxImageItem {
  side: ImageSide;
  label: string;
  src: string;
}

interface ImageLightboxProps {
  isOpen: boolean;
  images: LightboxImageItem[];
  initialIndex?: number;
  onClose: () => void;
  activeField?: ExtractedField | null;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  images,
  initialIndex = 0,
  onClose,
  activeField,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showEvidenceOverlay, setShowEvidenceOverlay] = useState(true);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  // Keyboard navigation (Esc, ArrowLeft, ArrowRight)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      }
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      }
    },
    [isOpen, images.length, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };
  const handleFit = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      id="image-lightbox-overlay"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Controls Bar */}
      <div className="h-14 px-6 border-b border-[#2D234C] bg-[#140F24]/80 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-700/60 uppercase">
            {currentImage?.label || currentImage?.side}
          </span>
          <span className="text-xs font-mono text-slate-400">
            {currentIndex + 1} of {images.length}
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-[#1C1630] text-slate-300 hover:text-white hover:bg-violet-900/40 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 px-1 min-w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-[#1C1630] text-slate-300 hover:text-white hover:bg-violet-900/40 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-[#2D234C] mx-1" />
          <button
            type="button"
            onClick={handleFit}
            className="p-2 rounded-lg bg-[#1C1630] text-slate-300 hover:text-white hover:bg-violet-900/40 transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-lg bg-[#1C1630] text-slate-300 hover:text-white hover:bg-violet-900/40 transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-[#2D234C] mx-1" />
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1C1630] text-slate-400 hover:text-white hover:bg-rose-950/60 transition-colors"
            title="Close Lightbox (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        {/* Previous Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-2xl bg-[#140F24]/80 border border-[#2D234C] text-slate-300 hover:text-white hover:bg-violet-600 transition-all shadow-xl"
            title="Previous Image (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Image Container with Zoom & Pan */}
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          className="max-h-[82vh] max-w-[85vw] flex items-center justify-center relative"
        >
          <img
            src={currentImage.src}
            alt={currentImage.label}
            className="max-h-[80vh] max-w-[80vw] object-contain rounded-lg shadow-2xl border border-[#2D234C] pointer-events-none"
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-2xl bg-[#140F24]/80 border border-[#2D234C] text-slate-300 hover:text-white hover:bg-violet-600 transition-all shadow-xl"
            title="Next Image (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnails Strip */}
      <div className="h-20 px-6 border-t border-[#2D234C] bg-[#140F24]/80 flex items-center justify-center gap-3 z-20">
        {images.map((img, idx) => (
          <button
            key={img.side}
            type="button"
            onClick={() => {
              setCurrentIndex(idx);
              setZoom(1);
              setPosition({ x: 0, y: 0 });
            }}
            className={`h-14 w-20 rounded-xl overflow-hidden border-2 transition-all relative ${
              idx === currentIndex
                ? 'border-violet-500 ring-2 ring-violet-500/40'
                : 'border-[#2D234C] opacity-60 hover:opacity-100'
            }`}
          >
            <img src={img.src} alt={img.label} className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] font-mono text-center text-white py-0.5 uppercase">
              {img.side}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
