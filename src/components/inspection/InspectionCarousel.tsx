import React, { useState, useEffect, useCallback } from 'react';
import { InspectionRecord } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  ArrowRight, 
  CheckCircle2,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';

interface InspectionCarouselProps {
  inspections: InspectionRecord[];
  onNavigate: (route: string, params?: { inspectionId?: string }) => void;
}

export const InspectionCarousel: React.FC<InspectionCarouselProps> = ({
  inspections,
  onNavigate,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Show up to 5 most recent/active inspections
  const displayItems = inspections.slice(0, 6);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, displayItems.length - 2)));
  }, [displayItems.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < displayItems.length - 2 ? prev + 1 : 0));
  }, [displayItems.length]);

  // Keyboard navigation when hovered or focused
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  };

  if (displayItems.length === 0) return null;

  return (
    <div
      id="dashboard-active-inspections-carousel"
      className="space-y-3 focus:outline-hidden"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Carousel Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <h2 className="text-xs uppercase font-bold tracking-wider text-violet-300">
            Active Inspections & Recent Dossiers
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1C1630] text-slate-400 border border-[#2D234C]">
            {displayItems.length} Registered
          </span>
        </div>

        {/* Carousel Navigation Arrows & Indicators */}
        <div className="flex items-center gap-2">
          {/* Pagination Indicators */}
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            {displayItems.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(Math.min(i, displayItems.length - 1))}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex || (i === currentIndex + 1 && displayItems.length > 1)
                    ? 'w-4 bg-violet-500'
                    : 'w-1.5 bg-[#2D2448] hover:bg-slate-500'
                }`}
                title={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`p-1.5 rounded-xl border border-[#2D2448] bg-[#151025] text-slate-300 hover:text-white hover:bg-[#1C1630] transition-colors ${
              currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title="Previous inspection"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex >= displayItems.length - 1}
            className={`p-1.5 rounded-xl border border-[#2D2448] bg-[#151025] text-slate-300 hover:text-white hover:bg-[#1C1630] transition-colors ${
              currentIndex >= displayItems.length - 1 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title="Next inspection"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Slider Viewport */}
      <div className="overflow-hidden relative rounded-2xl">
        <div
          className="flex transition-transform duration-300 ease-out gap-4"
          style={{
            transform: `translateX(-${currentIndex * 50}%)`,
          }}
        >
          {displayItems.map((item) => {
            const isCompleted = item.status.toLowerCase().includes('completed') || item.status.toLowerCase().includes('compliant');
            const stepProgress = item.step || (isCompleted ? 6 : 4);
            const totalSteps = 6;
            const percentage = Math.round((stepProgress / totalSteps) * 100);

            return (
              <div
                key={item.id}
                id={`carousel-card-${item.id}`}
                className="w-full md:w-[calc(50%-8px)] shrink-0 bg-[#140F24] border border-[#2D234C] hover:border-violet-600/50 rounded-2xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between group"
              >
                {/* Card Top: ID, Status, Timestamp */}
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-[#2D234C] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-violet-300 tracking-wider">
                        {item.id}
                      </span>
                      {item.barcode && (
                        <span className="hidden sm:inline-block text-[10px] font-mono text-slate-500">
                          {item.barcode}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={item.status} size="sm" />
                  </div>

                  {/* Card Body: Product Name & Location */}
                  <div className="my-3 space-y-2">
                    <div className="font-bold text-sm text-white group-hover:text-violet-200 transition-colors line-clamp-1">
                      {item.productName || 'Packaged Commodity Under Inspection'}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <span className="truncate">{item.location?.placeName || 'Field Location Logged'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>·</span>
                      <span>{new Date(item.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Progress Meter & Primary Action Button */}
                <div className="pt-3 border-t border-[#2D234C] space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">
                      {isCompleted ? 'Inspection Completed' : `Workflow Stage: ${stepProgress} of ${totalSteps}`}
                    </span>
                    <span className="font-mono font-bold text-violet-300">{percentage}%</span>
                  </div>

                  {/* Subtle Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-[#1C1630] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-violet-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Primary Action Button */}
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      id={`btn-carousel-action-${item.id}`}
                      type="button"
                      onClick={() => onNavigate('inspection-detail', { inspectionId: item.id })}
                      className="w-full py-2 px-4 rounded-xl bg-[#1C1630] hover:bg-violet-600 text-slate-200 hover:text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 group-hover:bg-violet-600 group-hover:text-white"
                    >
                      <span>{isCompleted ? 'Open Dossier' : 'Continue Inspection'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
