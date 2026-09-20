import React from 'react';
import { InspectionRecord } from '../../types';
import { LocationBadge } from '../common/LocationBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Shield, Clock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

interface InspectionSummaryPanelProps {
  inspection: InspectionRecord;
  lastSavedTime?: string | null;
  onOpenReport?: () => void;
}

export const InspectionSummaryPanel: React.FC<InspectionSummaryPanelProps> = ({
  inspection,
  lastSavedTime,
  onOpenReport,
}) => {
  const imageCount = [
    inspection.images.front,
    inspection.images.back,
    inspection.images.side,
    inspection.images.additional,
  ].filter(Boolean).length;

  const fieldCount = Object.keys(inspection.extractedFields).length;
  const verifiedCount = Object.values(inspection.extractedFields).filter((f) => f.isManuallyVerified).length;
  
  const rulesCount = inspection.findings.length;
  const potentialIssuesCount = inspection.findings.filter(
    (f) => f.status === 'POTENTIAL ISSUE — MANUAL VERIFICATION'
  ).length;

  return (
    <div id="inspection-summary-panel" className="bg-[#151025] rounded-2xl border border-[#2D2448] p-4 space-y-4 shadow-xl text-slate-200">
      {/* Header Info */}
      <div className="border-b border-[#2D2448] pb-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
            Inspection Dossier
          </span>
          {lastSavedTime && (
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Saved {lastSavedTime}</span>
            </span>
          )}
        </div>
        <div className="text-sm font-bold font-mono text-violet-300 mt-1">
          {inspection.id}
        </div>
        <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
          {inspection.productName || 'Unlabeled Package'}
        </div>
      </div>

      {/* Inspector Details */}
      <div className="text-xs space-y-1.5 bg-[#1C1630] p-3 rounded-xl border border-[#2D2448]">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Officer:</span>
          <span className="font-semibold text-white">{inspection.inspector.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">ID / Dept:</span>
          <span className="font-mono text-violet-300">{inspection.inspector.id}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Division:</span>
          <span className="text-slate-300 truncate max-w-[140px]">{inspection.inspector.department}</span>
        </div>
      </div>

      {/* Location Badge */}
      <div>
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">
          Geographic Stamp
        </div>
        <LocationBadge location={inspection.location} compact={false} />
      </div>

      {/* Inspection Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#1C1630] border border-[#2D2448] rounded-xl p-2.5">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Panels Captured</div>
          <div className="text-base font-bold font-mono text-white mt-0.5">
            {imageCount} <span className="text-[10px] font-normal text-slate-400 font-sans">/ 4 panels</span>
          </div>
        </div>

        <div className="bg-[#1C1630] border border-[#2D2448] rounded-xl p-2.5">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Declarations</div>
          <div className="text-base font-bold font-mono text-white mt-0.5">
            {fieldCount}
          </div>
        </div>

        <div className="bg-[#1C1630] border border-[#2D2448] rounded-xl p-2.5">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Verified Fields</div>
          <div className="text-base font-bold font-mono text-emerald-400 mt-0.5 flex items-center gap-1">
            <span>{verifiedCount}</span>
            {verifiedCount > 0 && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
          </div>
        </div>

        <div className="bg-[#1C1630] border border-[#2D2448] rounded-xl p-2.5">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Flagged Issues</div>
          <div className={`text-base font-bold font-mono mt-0.5 flex items-center gap-1 ${potentialIssuesCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            <span>{potentialIssuesCount}</span>
            {potentialIssuesCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
          </div>
        </div>
      </div>

      {/* Rules status */}
      <div className="pt-2 border-t border-[#2D2448]">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400">Rules Evaluated:</span>
          <span className="font-mono font-semibold text-slate-200">{rulesCount} rules</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Audit Status:</span>
          <StatusBadge status={inspection.status} size="sm" />
        </div>
      </div>

      {/* Legal & Assistant Disclaimer */}
      <div className="rounded-xl border border-[#2D2448] bg-[#1C1630]/60 p-3 text-[11px] text-slate-400 leading-relaxed">
        <div className="flex items-center gap-1.5 text-slate-200 font-semibold mb-1">
          <Shield className="w-3.5 h-3.5 text-violet-400" />
          <span>Statutory Metrology Assistant</span>
        </div>
        LabelLens assists verification. Final legal enforcement remains under the authority of the inspecting officer.
      </div>

      {onOpenReport && (
        <button
          id="btn-preview-dossier"
          type="button"
          onClick={onOpenReport}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#2D2448] bg-[#1C1630] hover:bg-[#251D42] text-slate-200 text-xs font-semibold shadow-md transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-violet-400" />
          <span>View Inspection Dossier / Print</span>
        </button>
      )}
    </div>
  );
};
