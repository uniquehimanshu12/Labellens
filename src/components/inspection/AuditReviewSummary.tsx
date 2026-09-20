import React from 'react';
import { InspectionRecord, ImageSide } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { 
  Package, 
  MapPin, 
  Image as ImageIcon, 
  FileText, 
  Scale, 
  PenTool, 
  MessageSquare, 
  ArrowLeft,
  Save,
} from 'lucide-react';

interface AuditReviewSummaryProps {
  inspection: InspectionRecord;
  onBackToVerification: () => void;
  onFinalSubmit: () => void;
}

export const AuditReviewSummary: React.FC<AuditReviewSummaryProps> = ({
  inspection,
  onBackToVerification,
  onFinalSubmit,
}) => {
  const sides: { side: ImageSide; label: string; src: string | null }[] = [
    { side: 'front', label: 'Front Surface', src: inspection.images.front },
    { side: 'back', label: 'Back Surface', src: inspection.images.back },
    { side: 'side', label: 'Side Surface', src: inspection.images.side },
    { side: 'additional', label: 'Additional Surface', src: inspection.images.additional },
  ];

  const fieldEntries = Object.values(inspection.extractedFields);

  return (
    <div id="audit-review-summary-page" className="bg-[#151025] border border-[#2D2448] rounded-2xl p-6 space-y-6 shadow-xl text-slate-200">
      {/* Top Banner */}
      <div className="border-b border-[#2D2448] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-violet-950 text-violet-300 border border-violet-700/60 rounded-md">
              Statutory Audit Review
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">{inspection.id}</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            Pre-Submission Inspection Dossier Review
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verify commodity declarations, physical packaging evidence, and rule engine findings before committing to the immutable record.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={inspection.status} />
        </div>
      </div>

      {/* 1. Commodity Details & Metadata */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 pb-1.5 border-b border-[#2D2448]">
          <Package className="w-3.5 h-3.5 text-violet-400" />
          1. Packaged Commodity Metadata
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-[#1C1630] p-3.5 rounded-xl border border-[#2D2448]">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Product Name</span>
            <span className="font-bold text-white text-sm">{inspection.productName || 'Unlabeled Commodity'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Barcode / GTIN</span>
            <span className="font-mono text-slate-300">{inspection.barcode || '— Not scanned —'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Assigned Officer</span>
            <span className="font-semibold text-white">{inspection.inspector.name} ({inspection.inspector.id})</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Dossier Timestamp</span>
            <span className="font-mono text-slate-300">
              {new Date(inspection.createdAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Location Evidence */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 pb-1.5 border-b border-[#2D2448]">
          <MapPin className="w-3.5 h-3.5 text-violet-400" />
          2. Geolocation & Field Venue Evidence
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#1C1630] p-3.5 rounded-xl border border-[#2D2448]">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Venue / Facility</span>
            <span className="font-semibold text-white">{inspection.location.placeName || 'Unknown Location'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">GPS Coordinates</span>
            <span className="font-mono text-slate-300">
              {inspection.location.latitude !== null && inspection.location.longitude !== null
                ? `${inspection.location.latitude.toFixed(5)}° N, ${inspection.location.longitude.toFixed(5)}° E`
                : 'Manual Geolocation Entry'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Acquisition Source</span>
            <span className="font-mono px-2 py-0.5 bg-[#151025] border border-[#2D2448] rounded text-slate-300 text-[11px] inline-block mt-0.5">
              {inspection.location.locationSource}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Image Evidence Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 pb-1.5 border-b border-[#2D2448]">
          <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
          3. Physical Package Surface Evidence ({sides.filter((s) => s.src).length} / 4 Views Provided)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {sides.map((item) => (
            <div
              key={item.side}
              className="border border-[#2D2448] rounded-xl p-2.5 text-center bg-[#1C1630] flex flex-col items-center justify-between min-h-[140px]"
            >
              <div className="text-[11px] font-mono font-bold text-slate-300 mb-1.5 uppercase">
                {item.label}
              </div>
              {item.src ? (
                <img
                  src={item.src}
                  alt={item.label}
                  className="max-h-[90px] w-full object-contain rounded-lg border border-[#2D2448] bg-[#090610]"
                />
              ) : (
                <div className="w-full py-6 bg-[#151025] border border-dashed border-[#2D2448] rounded-lg text-slate-500 text-[11px] font-mono">
                  Panel not provided
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Statutory Declaration Audit Verification */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 pb-1.5 border-b border-[#2D2448]">
          <FileText className="w-3.5 h-3.5 text-violet-400" />
          4. Field Verification Summary
        </h3>
        <div className="overflow-x-auto border border-[#2D2448] rounded-xl bg-[#1C1630]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151025] border-b border-[#2D2448] text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-3.5">Statutory Field</th>
                <th className="py-2.5 px-3.5">Recorded Value</th>
                <th className="py-2.5 px-3.5">Source Surface</th>
                <th className="py-2.5 px-3.5">Verification State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2448]/80 text-slate-200">
              {fieldEntries.map((field) => (
                <tr key={field.key} className="hover:bg-[#241B3E]/50">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-100">{field.label}</td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-300">
                    {field.isNotVisible ? (
                      <span className="text-slate-500 italic">Not Visible on Packaging</span>
                    ) : (
                      field.verifiedValue || field.extractedValue || '— None —'
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-400 font-mono text-[11px]">{field.sourceImage}</td>
                  <td className="py-2.5 px-3.5">
                    <StatusBadge
                      confidenceState={
                        field.isManuallyVerified
                          ? 'VERIFIED BY INSPECTOR'
                          : field.isNotVisible
                          ? 'NOT DETECTED'
                          : field.confidenceState || 'MEDIUM CONFIDENCE'
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Rule Engine Findings */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 pb-1.5 border-b border-[#2D2448]">
          <Scale className="w-3.5 h-3.5 text-violet-400" />
          5. Legal Metrology Rule Findings ({inspection.findings.length} Rules Evaluated)
        </h3>
        <div className="space-y-2">
          {inspection.findings.map((f) => (
            <div
              key={f.ruleCode}
              className="p-3.5 bg-[#1C1630] border border-[#2D2448] rounded-xl flex items-start justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold bg-[#151025] text-violet-300 px-2 py-0.5 rounded border border-[#2D2448] text-[11px]">
                    {f.ruleCode}
                  </span>
                  <span className="font-semibold text-white">{f.requirement}</span>
                </div>
                <p className="text-slate-300 mt-1.5 text-[11px]">
                  <strong className="text-slate-400">Evidence Observed:</strong> {f.observedEvidence}
                </p>
                {f.notes && (
                  <p className="text-violet-300 mt-1 text-[11px] italic bg-[#151025] p-1.5 rounded border border-[#2D2448]">
                    Inspector Note: {f.notes}
                  </p>
                )}
              </div>
              <StatusBadge status={f.status} />
            </div>
          ))}
        </div>
      </div>

      {/* 6. Remarks & Observations */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 pb-1.5 border-b border-[#2D2448]">
          <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
          6. Inspector Remarks & Field Observations
        </h3>
        <div className="bg-[#1C1630] p-3.5 rounded-xl border border-[#2D2448] text-xs text-slate-200 font-sans leading-relaxed">
          {inspection.remarks ? (
            inspection.remarks
          ) : (
            <span className="text-slate-500 italic">No additional field observations recorded.</span>
          )}
        </div>
      </div>

      {/* 7. Digital Signature Certification */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 pb-1.5 border-b border-[#2D2448]">
          <PenTool className="w-3.5 h-3.5 text-violet-400" />
          7. Officer Electronic Certification
        </h3>
        <div className="bg-[#1C1630] p-4 rounded-xl border border-[#2D2448] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs space-y-1">
            <div className="font-bold text-white text-sm">{inspection.inspector.name}</div>
            <div className="font-mono text-violet-300">Officer ID: {inspection.inspector.id}</div>
            <div className="text-slate-400 text-[11px]">Department of Consumer Affairs · Legal Metrology</div>
            <div className="text-slate-500 text-[10px] font-mono mt-1">
              Signed at: {inspection.signature?.signedAt || new Date().toISOString()}
            </div>
          </div>

          <div className="text-center">
            {inspection.signature?.signatureDataUrl ? (
              <div className="bg-white border border-slate-300 rounded-xl p-2.5">
                <img
                  src={inspection.signature.signatureDataUrl}
                  alt="Inspector Signature"
                  className="max-h-[60px] w-auto mx-auto"
                  style={{ filter: 'brightness(0)', color: '#000000' }}
                />
                <span className="text-[10px] font-mono font-bold block mt-1" style={{ color: '#000000' }}>
                  ✓ Certified Digitally
                </span>
              </div>
            ) : (
              <div className="px-4 py-3 bg-amber-950/60 border border-amber-700/60 rounded-xl text-xs font-medium" style={{ color: '#000000' }}>
                Signature not captured on pad (default officer signoff applied)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="pt-4 border-t border-[#2D2448] flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToVerification}
          className="px-4 py-2 rounded-xl border border-[#2D2448] text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#1C1630] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Verification & Edit</span>
        </button>

        <button
          id="btn-confirm-archive-dossier"
          type="button"
          onClick={onFinalSubmit}
          className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-950 inline-flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Confirm & Archive Inspection Dossier</span>
        </button>
      </div>
    </div>
  );
};
