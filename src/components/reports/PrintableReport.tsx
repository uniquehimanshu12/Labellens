import React, { useEffect, useState } from 'react';
import { InspectionRecord, ExtractedField, ManualCorrectionItem, ImageSide } from '../../types';
import { ArrowLeft, Printer, Download, AlertCircle } from 'lucide-react';
import { generateInspectionPdf, triggerBlobDownload } from '../../services/pdfReportGenerator';
import { useToast } from '../common/Toast';

interface PrintableReportProps {
  inspection: InspectionRecord;
  onBack?: () => void;
  autoPrint?: boolean;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({
  inspection,
  onBack,
  autoPrint = false,
}) => {
  const { toastError, toastReportReady } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = async () => {
    setIsGeneratingPdf(true);
    setPdfError(null);
    try {
      const { blob, filename } = await generateInspectionPdf(inspection);
      triggerBlobDownload(blob, filename);
      toastReportReady(inspection.id);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      const errMsg = err?.message || 'PDF generation failed — Try Again';
      setPdfError(errMsg);
      toastError('PDF Export Failed', errMsg);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getFieldDisplay = (field?: ExtractedField) => {
    if (!field) return { display: 'Not Detected', isVerified: false, isNotVisible: false };
    if (field.isNotVisible) return { display: 'Marked Not Visible by Inspector', isVerified: true, isNotVisible: true };
    if (field.verifiedValue && field.verifiedValue.trim()) {
      return { display: field.verifiedValue, isVerified: Boolean(field.isManuallyVerified), isNotVisible: false };
    }
    if (field.extractedValue && field.extractedValue.trim()) {
      return { display: field.extractedValue, isVerified: false, isNotVisible: false };
    }
    return { display: 'Not Detected', isVerified: false, isNotVisible: false };
  };

  const structuredFields = [
    { key: 'productName', label: 'Product / Commodity Name' },
    { key: 'brandName', label: 'Brand / Trade Name' },
    { key: 'productVariant', label: 'Product Variant / Type' },
    { key: 'mrp', label: 'Maximum Retail Price (MRP)' },
    { key: 'netQuantity', label: 'Net Quantity / Content' },
    { key: 'unitSalePrice', label: 'Unit Sale Price (USP)' },
    { key: 'manufacturer', label: 'Manufacturer / Packer Name' },
    { key: 'manufacturerAddress', label: 'Premises Address' },
    { key: 'dateInformation', label: 'Date of Mfg / Packing' },
    { key: 'bestBefore', label: 'Best Before / Expiry' },
    { key: 'batchNumber', label: 'Batch / Lot Number' },
    { key: 'consumerCare', label: 'Consumer Care Helpline' },
    { key: 'countryOfOrigin', label: 'Country of Origin' },
    { key: 'licenseInfo', label: 'License / Registration (FSSAI/LM)' },
    { key: 'barcode', label: 'Barcode / GTIN' },
    { key: 'ingredients', label: 'Ingredients / Composition' },
    { key: 'nutritionalInfo', label: 'Nutritional Info' },
    { key: 'storageInstructions', label: 'Storage Instructions' },
    { key: 'warnings', label: 'Warnings / Precautionary' },
  ];

  const manualCorrections: ManualCorrectionItem[] = React.useMemo(() => {
    if (inspection.manualCorrections && inspection.manualCorrections.length > 0) {
      return inspection.manualCorrections;
    }
    const list: ManualCorrectionItem[] = [];
    Object.values(inspection.extractedFields || {}).forEach((f) => {
      if (f.isManuallyVerified || f.audit) {
        list.push({
          fieldKey: f.key,
          fieldLabel: f.label,
          originalValue: f.audit?.originalValue || f.extractedValue || 'Not Detected',
          verifiedValue: f.isNotVisible ? 'Marked Not Visible' : f.verifiedValue || f.extractedValue || 'Verified',
          changedBy: f.audit?.changedBy || inspection.inspector?.id || 'Inspector',
          timestamp: f.audit?.timestamp
            ? new Date(f.audit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'During Review',
        });
      }
    });
    return list;
  }, [inspection]);

  const textBySurface: Record<string, string[]> = React.useMemo(() => {
    const grouped: Record<string, string[]> = { Front: [], Back: [], Side: [], Additional: [] };
    if (inspection.allDetectedText) {
      const surfaceKeys: Array<'Front' | 'Back' | 'Side' | 'Additional'> = ['Front', 'Back', 'Side', 'Additional'];
      surfaceKeys.forEach((side) => {
        const textArr = inspection.allDetectedText?.[side];
        if (Array.isArray(textArr)) {
          grouped[side] = [...textArr];
        }
      });
    }
    if (inspection.detectedTexts && inspection.detectedTexts.length > 0) {
      inspection.detectedTexts.forEach((dt) => {
        const s = dt.sourceSide || 'Front';
        if (grouped[s] && dt.text && !grouped[s].includes(dt.text)) {
          grouped[s].push(dt.text);
        }
      });
    }
    return grouped;
  }, [inspection]);

  const imagePanels: Array<{ side: ImageSide; label: string; src: string | null; sub: string }> = [
    { side: 'front', label: 'Front Panel', src: inspection.images?.front || null, sub: 'Principal Display Panel' },
    { side: 'back', label: 'Back Panel', src: inspection.images?.back || null, sub: 'Manufacturer & Care' },
    { side: 'side', label: 'Side Surface', src: inspection.images?.side || null, sub: 'MRP, Dates & Batch' },
    { side: 'additional', label: 'Additional Surface', src: inspection.images?.additional || null, sub: 'Flap / Auxiliary' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 py-6 px-4 sm:px-6 print:p-0 print:bg-white">
      {/* Top Toolbar (Hidden during print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col gap-3 no-print">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-300 shadow-xs">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Application</span>
              </button>
            )}
            <span className="text-xs font-mono text-slate-500">
              Printable Dossier: #{inspection.id}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSavePdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Save as PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {pdfError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>PDF generation failed — {pdfError}</span>
            </div>
            <button
              type="button"
              onClick={handleSavePdf}
              className="px-2.5 py-1 bg-rose-600 text-white rounded font-bold hover:bg-rose-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Printable Sheet Container (A4 styling) */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-10 border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 font-sans text-xs">
        {/* Header */}
        <div className="border-b-2 border-violet-700 pb-4 mb-5 flex items-start justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold tracking-wider text-violet-700 uppercase">
              LABEL LENS · SIH26034
            </div>
            <div className="text-[10px] text-slate-500">Evidence-Based Package Inspection Assistant</div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              INSPECTION REPORT
            </h1>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Statutory Packaging Compliance Verification Dossier (Legal Metrology PCR 2011)
            </p>
          </div>
          <div className="text-right font-mono text-xs space-y-1">
            <div>
              <span className="text-slate-500">Inspection ID: </span>
              <span className="font-bold text-slate-900">{inspection.id || 'N/A'}</span>
            </div>
            <div className="text-slate-600 text-[11px]">
              {new Date(inspection.createdAt || Date.now()).toLocaleDateString()} ·{' '}
              {new Date(inspection.createdAt || Date.now()).toLocaleTimeString()}
            </div>
            <div className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
              {inspection.status || 'COMPLETED'}
            </div>
          </div>
        </div>

        {/* 1. Profile & Location */}
        <section className="mb-6 avoid-break">
          <div className="border-b border-slate-300 pb-1 mb-2.5 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
              1. Inspection & Officer Profile
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">Authority Identification</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase">Commodity</span>
              <span className="font-bold text-slate-900 text-xs">{inspection.productName || 'Unspecified'}</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase">Barcode / GTIN</span>
              <span className="font-mono text-slate-800 text-xs">{inspection.barcode || 'Not Specified'}</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase">Inspecting Officer</span>
              <span className="font-bold text-slate-900 text-xs">{inspection.inspector?.name || 'Rahul Sharma'}</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase">Officer Badge</span>
              <span className="font-mono text-violet-700 font-bold text-xs">{inspection.inspector?.id || 'INS-1042'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-[9px] font-bold text-slate-500 uppercase">Location / Venue</span>
              <span className="text-slate-800 text-xs">
                {inspection.location?.placeName || 'Field Inspection Venue'}
                {inspection.location?.latitude ? ` (${inspection.location.latitude.toFixed(4)}°N, ${inspection.location.longitude?.toFixed(4)}°E)` : ''}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-[9px] font-bold text-slate-500 uppercase">Jurisdiction</span>
              <span className="text-slate-800 text-xs">{inspection.inspector?.jurisdiction || 'Department of Consumer Affairs'}</span>
            </div>
          </div>
        </section>

        {/* 2. Submitted Package Images */}
        <section className="mb-6 avoid-break">
          <div className="border-b border-slate-300 pb-1 mb-2.5 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
              2. Physical Package Surface Evidence
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">Image Submission Set</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {imagePanels.map((panel) => (
              <div key={panel.side} className="border border-slate-200 rounded-lg p-2 bg-slate-50 text-center flex flex-col justify-between min-h-[140px]">
                <div className="mb-1">
                  <div className="font-bold text-[10px] text-slate-800 uppercase">{panel.label}</div>
                  <div className="text-[9px] text-slate-500">{panel.sub}</div>
                </div>
                {panel.src ? (
                  <img
                    src={panel.src}
                    alt={panel.label}
                    className="max-h-[85px] w-full object-contain rounded border border-slate-200 bg-slate-900 mx-auto"
                  />
                ) : (
                  <div className="py-6 border border-dashed border-slate-300 rounded text-slate-400 text-[10px] italic">
                    Not Submitted
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 3. Package Information (Mandatory Declarations) */}
        <section className="mb-6">
          <div className="border-b border-slate-300 pb-1 mb-2.5 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
              3. Mandatory Statutory Declarations (Level A)
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">19 Standard Metrology Fields</span>
          </div>
          <div className="overflow-hidden border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase border-b border-slate-200">
                  <th className="py-2 px-3">Statutory Field</th>
                  <th className="py-2 px-3">Observed / Verified Value</th>
                  <th className="py-2 px-3">Source Surface</th>
                  <th className="py-2 px-3 text-right">Verification State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {structuredFields.map((item, idx) => {
                  const field = inspection.extractedFields?.[item.key];
                  const val = getFieldDisplay(field);
                  const isDetected = val.display !== 'Not Detected';

                  return (
                    <tr key={item.key} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="py-1.5 px-3 font-semibold text-slate-900">{item.label}</td>
                      <td className="py-1.5 px-3 font-mono text-[11px]">
                        {val.display}
                      </td>
                      <td className="py-1.5 px-3 text-slate-500 text-[11px]">
                        {field?.sourceImage || '—'}
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        {val.isVerified ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                            Verified
                          </span>
                        ) : isDetected ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-100 text-violet-800">
                            Detected
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500">
                            Not Detected
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Complete Detected Package Text */}
        <section className="mb-6 avoid-break">
          <div className="border-b border-slate-300 pb-1 mb-2.5 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
              4. Complete Detected Package Text
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">OCR Raw Stream</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            {(['Front', 'Back', 'Side', 'Additional'] as const).map((side) => {
              const lines = textBySurface[side] || [];
              return (
                <div key={side} className="text-xs">
                  <div className="font-bold text-[10px] text-slate-700 uppercase mb-1">
                    {side} Surface ({lines.length} lines detected)
                  </div>
                  <div className="text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-200 font-mono leading-relaxed max-h-24 overflow-y-auto">
                    {lines.length > 0 ? lines.join(' · ') : <span className="italic text-slate-400">No text detected</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Rule Verification Summary */}
        <section className="mb-6 avoid-break">
          <div className="border-b border-slate-300 pb-1 mb-2.5 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
              5. Legal Metrology Rule Findings ({inspection.findings?.length || 0} Rules Evaluated)
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">PCR 2011 Automated Verification</span>
          </div>
          <div className="overflow-hidden border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase border-b border-slate-200">
                  <th className="py-2 px-3">Rule Code</th>
                  <th className="py-2 px-3">Requirement</th>
                  <th className="py-2 px-3">Observed Information</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Evidence Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {(inspection.findings || []).map((f, idx) => {
                  const s = (f.status || '').toUpperCase();
                  const isDet = s.includes('DETECTED') && !s.includes('NOT');
                  const isIssue = s.includes('ISSUE') || s.includes('MANUAL');
                  const isNA = s.includes('NOT APPLICABLE');

                  return (
                    <tr key={f.ruleCode || idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="py-1.5 px-3 font-mono font-bold text-violet-800">{f.ruleCode}</td>
                      <td className="py-1.5 px-3 font-semibold text-slate-900">{f.requirement}</td>
                      <td className="py-1.5 px-3 text-slate-700 text-[11px]">{f.observedEvidence || '—'}</td>
                      <td className="py-1.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isDet
                              ? 'bg-emerald-100 text-emerald-800'
                              : isIssue
                              ? 'bg-amber-100 text-amber-800'
                              : isNA
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right text-slate-500 font-mono text-[11px]">
                        {f.evidenceImage || 'Front Panel'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. Manual Corrections & Remarks */}
        <section className="mb-6 avoid-break">
          <div className="border-b border-slate-300 pb-1 mb-2.5 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
              6. Manual Corrections & Observations
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">Inspector Audit Log</span>
          </div>
          {manualCorrections.length > 0 && (
            <div className="mb-3 overflow-hidden border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase border-b border-slate-200">
                    <th className="py-1.5 px-3">Field</th>
                    <th className="py-1.5 px-3">Original Extracted</th>
                    <th className="py-1.5 px-3">Verified Value</th>
                    <th className="py-1.5 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {manualCorrections.map((c, i) => (
                    <tr key={i} className="bg-white">
                      <td className="py-1.5 px-3 font-semibold text-slate-900">{c.fieldLabel}</td>
                      <td className="py-1.5 px-3 text-slate-400 line-through font-mono">{c.originalValue}</td>
                      <td className="py-1.5 px-3 font-bold text-emerald-800 font-mono">{c.verifiedValue}</td>
                      <td className="py-1.5 px-3 text-right text-slate-500 text-[11px]">{c.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <span className="font-bold text-slate-700 block mb-1">Inspector Remarks:</span>
            <p className="text-slate-800 leading-relaxed font-sans">
              {inspection.remarks && inspection.remarks.trim() ? inspection.remarks : 'No additional field remarks recorded.'}
            </p>
          </div>
        </section>

        {/* 7. Officer Endorsement & Signature */}
        <section className="mb-6 avoid-break">
          <div className="border-b border-slate-300 pb-1 mb-2.5 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
              7. Officer Certification & Electronic Signature
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">Statutory Attestation</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 items-center">
            <div className="space-y-1">
              <div className="font-bold text-slate-900 text-sm">{inspection.inspector?.name || 'Rahul Sharma'}</div>
              <div className="font-mono text-violet-700 text-xs">Officer ID: {inspection.inspector?.id || 'INS-1042'}</div>
              <div className="text-slate-500 text-[11px]">
                {inspection.inspector?.jurisdiction || 'Department of Consumer Affairs · Legal Metrology'}
              </div>
              <div className="text-slate-500 text-[10px] mt-2">
                Session activity count: {(inspection.activityLog || []).length} log events
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="text-[10px] font-bold uppercase mb-1" style={{ color: '#000000' }}>
                Digital Signature Record
              </div>
              {inspection.signature?.signatureDataUrl ? (
                <img
                  src={inspection.signature.signatureDataUrl}
                  alt="Inspector Signature"
                  className="max-h-[50px] max-w-[140px] object-contain border border-slate-300 rounded bg-white p-1 mb-1"
                  style={{ filter: 'brightness(0)', color: '#000000' }}
                />
              ) : (
                <div className="italic text-[11px] my-3" style={{ color: '#000000' }}>
                  Not signed electronically
                </div>
              )}
              <div className="text-[10px] font-mono font-bold" style={{ color: '#000000' }}>
                {inspection.signature?.signedAt
                  ? `Certified: ${new Date(inspection.signature.signedAt).toLocaleString()}`
                  : 'Pending signature certification'}
              </div>
            </div>
          </div>
        </section>

        {/* Regulatory Notice */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-500 leading-relaxed avoid-break">
          <strong className="text-slate-700">Prototype Notice: </strong>
          LabelLens is an evidence-based prototype verification assistant calibrated against the Legal Metrology (Packaged Commodities) Rules, 2011. Evidence association and rule evaluation findings are conducted on submitted package imagery. Final regulatory determinations remain with the designated inspecting authority under the Legal Metrology Act, 2009.
        </div>

        {/* Print Page Footer */}
        <div className="mt-6 pt-3 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
          <span>LabelLens • SIH26034 Prototype</span>
          <span>Dossier #{inspection.id || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};
