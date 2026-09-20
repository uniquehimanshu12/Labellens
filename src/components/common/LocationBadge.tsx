import React from 'react';
import { LocationData } from '../../types';
import { MapPin, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface LocationBadgeProps {
  location: LocationData;
  isLoading?: boolean;
  onRetry?: () => void;
  onManualEdit?: () => void;
  compact?: boolean;
}

export const LocationBadge: React.FC<LocationBadgeProps> = ({
  location,
  isLoading = false,
  onRetry,
  onManualEdit,
  compact = false,
}) => {
  const isGps = location.locationSource === 'GPS';
  const isManual = location.locationSource === 'Manual';
  const isUnavailable = location.locationSource === 'Unavailable' || !location.latitude;

  if (isLoading) {
    return (
      <div id="location-badge-loading" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-violet-700/60 bg-violet-950/70 text-violet-200 text-xs font-medium">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-400" />
        <span>Location Status: Acquiring Coordinates...</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div id="location-badge-compact" className="inline-flex items-center gap-1.5 text-xs text-slate-300">
        <MapPin className="w-3.5 h-3.5 text-violet-400 shrink-0" />
        <span className="font-medium truncate max-w-[180px]">{location.placeName || 'Location Captured'}</span>
        {location.accuracy && (
          <span className="text-slate-500 font-mono text-[11px]">(±{location.accuracy}m)</span>
        )}
      </div>
    );
  }

  return (
    <div id="location-card-container" className="rounded-xl border border-[#2D2448] bg-[#151025] p-3.5 text-xs shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className={`p-1.5 rounded-lg ${isUnavailable ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'}`}>
            {isUnavailable ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {isUnavailable ? 'Location unavailable' : 'Location Detected'}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                isGps ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : isManual ? 'bg-violet-950 text-violet-300 border border-violet-800/60' : 'bg-[#1C1630] text-slate-400 border border-[#2D2448]'
              }`}>
                Source: {location.locationSource}
              </span>
            </div>

            <div className="text-slate-300 font-medium mt-1">
              {location.placeName || (isUnavailable ? 'Unable to acquire GPS coordinates' : 'Point Coordinates')}
            </div>

            {location.latitude !== null && location.longitude !== null && (
              <div className="text-slate-400 font-mono mt-1 text-[11px] flex flex-wrap gap-x-3 gap-y-0.5">
                <span>Lat: {location.latitude.toFixed(4)}</span>
                <span>Long: {location.longitude.toFixed(4)}</span>
                {location.accuracy && <span>Accuracy: ±{location.accuracy} m</span>}
                {location.timestamp && (
                  <span>Captured: {new Date(location.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onRetry && (
            <button
              id="btn-retry-location"
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#2D2448] bg-[#1C1630] hover:bg-[#251D42] text-slate-300 text-xs font-medium cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              <span>Retry</span>
            </button>
          )}
          {onManualEdit && (
            <button
              id="btn-manual-location"
              type="button"
              onClick={onManualEdit}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#2D2448] bg-[#1C1630] hover:bg-[#251D42] text-slate-300 text-xs font-medium cursor-pointer transition-colors"
            >
              <span>{isUnavailable ? 'Enter Manual' : 'Edit'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
