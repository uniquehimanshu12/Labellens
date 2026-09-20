import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { locationService } from '../../services/locationService';
import { LocationData, PackageImages, ImageSide } from '../../types';
import { 
  PlusCircle, 
  MapPin, 
  User, 
  Clock, 
  Camera, 
  Check, 
  X, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Layers
} from 'lucide-react';

interface StartInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (initialData?: {
    location?: LocationData;
    images?: PackageImages;
    productName?: string;
  }) => void;
}

export const StartInspectionModal: React.FC<StartInspectionModalProps> = ({
  isOpen,
  onClose,
  onStart,
}) => {
  const inspector = authService.getCurrentUser();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isDetectingLoc, setIsDetectingLoc] = useState(false);
  const [productNameInput, setProductNameInput] = useState('');
  const [images, setImages] = useState<PackageImages>({
    front: null,
    back: null,
    side: null,
    additional: null,
  });

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Auto-fetch location if not loaded
    const detect = async () => {
      setIsDetectingLoc(true);
      const loc = await locationService.detectLocation();
      setLocation(loc);
      setIsDetectingLoc(false);
    };
    detect();

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileDrop = (side: ImageSide, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => ({ ...prev, [side]: event.target?.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmStart = () => {
    onStart({
      location: location || undefined,
      images,
      productName: productNameInput.trim() || undefined,
    });
  };

  const hasAnyImages = Boolean(images.front || images.back || images.side || images.additional);

  return (
    <div
      id="start-inspection-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="start-inspection-modal-card"
        className="bg-[#140F24] border border-[#2D234C] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 flex flex-col justify-between"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2D234C] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/60 flex items-center justify-center text-violet-300">
              <PlusCircle className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">START NEW INSPECTION</h2>
              <p className="text-xs text-slate-400">Initialize statutory commodity inspection dossier</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1C1630] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="my-5 space-y-4 text-xs">
          {/* Inspector & Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1C1630] border border-[#2D234C] rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <User className="w-3.5 h-3.5 text-violet-400" />
                <span>Field Inspector</span>
              </div>
              <div className="font-bold text-white truncate">{inspector?.name || 'Officer Rahul Sharma'}</div>
              <div className="text-[10px] font-mono text-violet-300">{inspector?.id || 'INS-1042'}</div>
            </div>

            <div className="bg-[#1C1630] border border-[#2D234C] rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-violet-400" />
                <span>Date & Time</span>
              </div>
              <div className="font-bold text-white font-mono">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {currentTime.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Location Bar */}
          <div className="bg-[#1C1630] border border-[#2D234C] rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Inspection Location</span>
              </span>
              <span className="font-mono text-[10px] text-violet-400">
                {isDetectingLoc ? 'Acquiring GPS...' : location?.locationSource || 'GPS'}
              </span>
            </div>
            <div className="font-semibold text-white">
              {location?.placeName || 'Detecting retail / market location...'}
            </div>
            {location?.latitude && location?.longitude && (
              <div className="text-[10px] font-mono text-slate-400">
                Lat: {location.latitude.toFixed(4)}, Long: {location.longitude.toFixed(4)}
              </div>
            )}
          </div>

          {/* Optional Product Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Packaged Commodity Title (Optional)
            </label>
            <input
              type="text"
              value={productNameInput}
              onChange={(e) => setProductNameInput(e.target.value)}
              placeholder="e.g. Marie Gold Biscuits 200g (or detect from package)"
              className="w-full px-3.5 py-2 rounded-xl bg-[#0D0917] border border-[#2D234C] text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-violet-500"
            />
          </div>

          {/* Quick Image Upload Slots (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Package Images (Optional)
              </span>
              <span className="text-[10px] text-slate-400">Can also upload in workspace</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['front', 'back', 'side', 'additional'] as ImageSide[]).map((side) => {
                const hasImg = Boolean(images[side]);
                return (
                  <label
                    key={side}
                    className={`cursor-pointer rounded-xl border p-2 flex flex-col items-center justify-center gap-1 transition-all ${
                      hasImg
                        ? 'border-violet-500 bg-violet-950/40 text-violet-300'
                        : 'border-[#2D234C] bg-[#1C1630] hover:bg-[#221B3A] text-slate-400'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileDrop(side, e)}
                    />
                    {hasImg ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    <span className="text-[9px] font-mono uppercase font-bold">{side}</span>
                    <span className="text-[8px] font-mono text-slate-500">
                      {hasImg ? 'Ready' : '+ Add'}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#2D234C] pt-4 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#2D234C] hover:bg-[#1C1630] text-xs font-semibold text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-start-inspection"
            type="button"
            onClick={handleConfirmStart}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-950 transition-colors inline-flex items-center gap-2"
          >
            <span>Start Inspection</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
