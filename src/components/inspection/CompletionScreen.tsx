import React from 'react';
import { InspectionRecord } from '../../types';
import { 
  CheckCircle2, 
  FileText, 
  Eye, 
  PlusCircle, 
  ShieldCheck, 
  MapPin, 
  User, 
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';

interface CompletionScreenProps {
  inspection: InspectionRecord;
  onViewInspection: () => void;
  onViewReport: () => void;
  onStartNewInspection: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  inspection,
  onViewInspection,
  onViewReport,
  onStartNewInspection,
}) => {
  const fieldsCount = Object.keys(inspection.extractedFields).length;
  const verifiedCount = Object.values(inspection.extractedFields).filter(
    (f) => f.isManuallyVerified
  ).length;
  const findingsCount = inspection.findings.length;
  const imagesCount = Object.values(inspection.images).filter(Boolean).length;
  const hasSignature = Boolean(inspection.signature?.signatureDataUrl);

  return (
    <div
      id="inspection-completion-screen"
      className="max-w-2xl mx-auto my-8 bg-[#140F24] border border-[#2D234C] rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-98 duration-300 text-slate-100"
    >
      {/* Centered Check Icon */}
      <div className="relative mx-auto w-20 h-20">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-emerald-950/80 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-2xl">
          <CheckCircle2 className="w-10 h-10" />
        </div>
      </div>

      {/* Title & Inspection ID */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/80 border border-violet-700/60 text-violet-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
          <span>Statutory Dossier Finalized</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Inspection Completed</h1>
        <div className="text-sm font-mono font-bold text-violet-300 mt-1">
          {inspection.id}
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          {inspection.productName || 'Packaged Commodity'} verified under Legal Metrology (Packaged Commodities) Rules, 2011.
        </p>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
        <div className="bg-[#1C1630] border border-[#2D234C] rounded-2xl p-3.5">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Declarations</div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {verifiedCount} <span className="text-xs text-slate-500 font-normal">/ {fieldsCount}</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Verified by Officer</div>
        </div>

        <div className="bg-[#1C1630] border border-[#2D234C] rounded-2xl p-3.5">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Rule Findings</div>
          <div className="text-xl font-bold text-violet-300 font-mono mt-1">
            {findingsCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Evaluated</div>
        </div>

        <div className="bg-[#1C1630] border border-[#2D234C] rounded-2xl p-3.5">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Surfaces</div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {imagesCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Images Stored</div>
        </div>

        <div className="bg-[#1C1630] border border-[#2D234C] rounded-2xl p-3.5">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Signature</div>
          <div className="text-xl font-bold font-mono mt-1 text-emerald-400">
            {hasSignature ? 'Stamped' : 'Logged'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{inspection.inspector.id}</div>
        </div>
      </div>

      {/* Location & Officer Stamp */}
      <div className="bg-[#1C1630]/60 border border-[#2D234C] rounded-2xl p-4 text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-violet-400 shrink-0" />
          <div>
            <div className="font-semibold text-white">{inspection.location?.placeName || 'Location Logged'}</div>
            <div className="text-[10px] text-slate-400 font-mono">
              GPS Verified · {new Date(inspection.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div className="w-7 h-7 rounded-full bg-violet-900/60 border border-violet-700/60 flex items-center justify-center font-bold text-xs text-violet-200">
            RS
          </div>
          <div>
            <div className="font-semibold text-white">{inspection.inspector.name}</div>
            <div className="text-[10px] text-slate-400 font-mono">Inspector ID: {inspection.inspector.id}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onViewReport}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-xl shadow-violet-950/80 inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>View Official Report</span>
        </button>

        <button
          type="button"
          onClick={onViewInspection}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-[#2D234C] bg-[#1C1630] hover:bg-[#251D42] text-slate-200 font-bold text-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Eye className="w-4 h-4 text-violet-400" />
          <span>View Inspection Dossier</span>
        </button>

        <button
          type="button"
          onClick={onStartNewInspection}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-[#2D234C] hover:bg-[#1C1630] text-slate-300 hover:text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Start New Inspection</span>
        </button>
      </div>
    </div>
  );
};
