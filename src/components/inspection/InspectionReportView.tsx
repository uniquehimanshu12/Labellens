import React, { useState } from 'react';
import { InspectionRecord, ExtractedField, ManualCorrectionItem, ImageSide } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { EvidenceViewerModal } from '../common/EvidenceViewerModal';
import { useToast } from '../common/Toast';
import { reportService } from '../../services/reportService';
import {
  Printer,
  FileDown,
  ArrowLeft,
  Eye,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Layers,
  Crosshair,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface InspectionReportViewProps {
  inspection: InspectionRecord;
  onBack?: () => void;
  showToolbar?: boolean;
}

export const InspectionReportView: React.FC<InspectionReportViewProps> = ({
  inspection,
  onBack,
  showToolbar = true,
}) => {
  const [evidenceModalField, setEvidenceModalField] = useState<ExtractedField | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState<boolean>(false);
  const { showToast } = useToast();

  // 1. DATA VALIDATION (Requirement 21)
  const validationIssues: string[] = [];
  if (!inspection.id) validationIssues.push('Inspection ID missing');
  if (!inspection.inspector?.name) validationIssues.push('Inspector information missing');
  if (!inspection.status) validationIssues.push('Inspection status missing');
  if (!inspection.createdAt) validationIssues.push('Inspection timestamp missing');
  const hasIncompleteData = validationIssues.length > 0;

  // Print handler (Requirement 1 & 2)
  const handlePrint = () => {
    setIsPreparingPrint(true);
    try {
      reportService.printReport(inspection.id);
    } catch (err) {
      console.error('Print workflow failed:', err);
      showToast('error', 'Print Failed', 'Could not open browser print dialog.');
    } finally {
      setTimeout(() => {
        setIsPreparingPrint(false);
      }, 800);
    }
  };

  // Real PDF export handler (Requirement 3, 4, 5, 9, 10)
  const handleSavePdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const result = await reportService.downloadPdf(inspection);
      if (result.success) {
        showToast('success', 'PDF Downloaded', 'PDF downloaded successfully');
      }
    } catch (err: any) {
      console.error('PDF generation error:', err);
      showToast('error', 'PDF Generation Failed', 'PDF generation failed — Try Again');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Helper for priority display: Verified Value -> Extracted Value -> Not Detected (Requirement 6)
  const getFieldValueDisplay = (field?: ExtractedField) => {
    if (!field) return { display: 'Not Detected', isVerified: false, isNotVisible: false };
    if (field.isNotVisible) return { display: 'Marked Not Visible by Inspector', isVerified: true, isNotVisible: true };
    if (field.verifiedValue && field.verifiedValue.trim()) {
      return {
        display: field.verifiedValue,
        isVerified: Boolean(field.isManuallyVerified),
        isNotVisible: false,
      };
    }
    if (field.extractedValue && field.extractedValue.trim()) {
      return { display: field.extractedValue, isVerified: false, isNotVisible: false };
    }
    return { display: 'Not Detected', isVerified: false, isNotVisible: false };
  };

  // Extract all available manual corrections (Requirement 7)
  const manualCorrections: ManualCorrectionItem[] = React.useMemo(() => {
    if (inspection.manualCorrections && inspection.manualCorrections.length > 0) {
      return inspection.manualCorrections;
    }
    // Derive from extractedFields if not populated directly
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

  // Group detected texts by surface (Requirement 4 & 6)
  const textBySurface = React.useMemo(() => {
    const grouped: Record<'Front' | 'Back' | 'Side' | 'Additional', string[]> = {
      Front: [],
      Back: [],
      Side: [],
      Additional: [],
    };

    // If explicit allDetectedText exists
    if (inspection.allDetectedText) {
      (['Front', 'Back', 'Side', 'Additional'] as const).forEach((side) => {
        if (Array.isArray(inspection.allDetectedText?.[side])) {
          grouped[side] = [...inspection.allDetectedText[side]];
        }
      });
    }

    // If detectedTexts array exists
    if (inspection.detectedTexts && inspection.detectedTexts.length > 0) {
      inspection.detectedTexts.forEach((dt) => {
        const sideKey = (dt.sourceSide || 'Front') as 'Front' | 'Back' | 'Side' | 'Additional';
        if (grouped[sideKey] && dt.text && !grouped[sideKey].includes(dt.text)) {
          grouped[sideKey].push(dt.text);
        }
      });
    }

    // Complement from extractedFields evidence snippets without duplication
    Object.values(inspection.extractedFields || {}).forEach((f) => {
      const sideKey = (f.sourceImage || 'Front') as 'Front' | 'Back' | 'Side' | 'Additional';
      if (grouped[sideKey]) {
        const snip = f.evidenceSnippet || f.extractedValue;
        if (snip && snip !== 'Not detected' && !grouped[sideKey].includes(snip)) {
          grouped[sideKey].push(snip);
        }
      }
    });

    return grouped;
  }, [inspection]);

  // Structured fields catalog for Section 5 (Requirement 3A)
  const structuredFieldKeys = [
    { key: 'productName', label: 'Product / Commodity Name' },
    { key: 'brandName', label: 'Brand / Trade Name' },
    { key: 'productVariant', label: 'Product Variant / Type' },
    { key: 'mrp', label: 'Maximum Retail Price (MRP)' },
    { key: 'netQuantity', label: 'Net Quantity / Content' },
    { key: 'unitSalePrice', label: 'Unit Sale Price (USP)' },
    { key: 'manufacturer', label: 'Manufacturer / Packer Name' },
    { key: 'manufacturerAddress', label: 'Manufacturer / Packer Premises Address' },
    { key: 'dateInformation', label: 'Date of Manufacture / Packing' },
    { key: 'bestBefore', label: 'Best Before Period / Expiry' },
    { key: 'batchNumber', label: 'Batch / Lot Number' },
    { key: 'consumerCare', label: 'Consumer Care Contact / Grievance Cell' },
    { key: 'countryOfOrigin', label: 'Country of Origin' },
    { key: 'licenseInfo', label: 'License / Registration Number (FSSAI/LM)' },
    { key: 'barcode', label: 'Barcode / EAN Identification' },
    { key: 'ingredients', label: 'Ingredients / Composition' },
    { key: 'nutritionalInfo', label: 'Nutritional Information' },
    { key: 'storageInstructions', label: 'Storage Instructions' },
    { key: 'warnings', label: 'Warnings / Precautionary Declarations' },
  ];

  // Images list (Requirement 11)
  const imageSurfaces: Array<{ side: ImageSide; label: string; src: string | null; sub: string }> = [
    { side: 'front', label: 'FRONT', src: inspection.images?.front || null, sub: 'Principal Display Panel (PDP)' },
    { side: 'back', label: 'BACK', src: inspection.images?.back || null, sub: 'Manufacturer, Ingredients & Grievance' },
    { side: 'side', label: 'SIDE', src: inspection.images?.side || null, sub: 'Batch Coding, MRP & Packaging Date' },
    { side: 'additional', label: 'ADDITIONAL', src: inspection.images?.additional || null, sub: 'Flap, Base or Auxiliary View' },
  ];

  const totalSubmittedImages = imageSurfaces.filter((s) => Boolean(s.src)).length;

  return (
    <div className="space-y-6 text-slate-200">
      {/* ================= TOP TOOLBAR (Requirement 23 - Hidden on Print) ================= */}
      {showToolbar && (
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151025] border border-[#2D2448] rounded-xl p-4 shadow-xl">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#2D2448] bg-[#1C1630] hover:bg-[#251D42] text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Inspection</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-violet-300 text-sm">{inspection.id}</span>
                <StatusBadge status={inspection.status} size="sm" />
              </div>
              <div className="text-[11px] text-slate-400">Official Report Preview (Screen & Print Synchronized)</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-save-pdf"
              onClick={handleSavePdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#2D2448] bg-[#1C1630] hover:bg-[#251D42] text-slate-200 hover:text-white text-xs font-semibold cursor-pointer shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-violet-400" />
                  <span>Save as PDF</span>
                </>
              )}
            </button>
            <button
              type="button"
              id="btn-print-report"
              onClick={handlePrint}
              disabled={isPreparingPrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-950 cursor-pointer transition-colors disabled:opacity-60"
            >
              {isPreparingPrint ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing report...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================= REPORT DOCUMENT CONTAINER ================= */}
      <div
        id="official-inspection-report"
        className="bg-[#151025] border border-[#2D2448] rounded-xl p-6 sm:p-10 shadow-2xl space-y-8 print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0 print:space-y-6"
      >
        {/* DATA VALIDATION WARNING BANNER (Requirement 21) */}
        {hasIncompleteData && (
          <div className="bg-amber-950/40 border border-amber-500/50 rounded-lg p-3 text-amber-200 text-xs flex items-start gap-2.5 print:bg-amber-50 print:text-amber-900 print:border-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <div className="font-bold">Report generated with incomplete inspection data.</div>
              <div className="text-[11px] text-amber-300/80 print:text-amber-800">
                Notice: {validationIssues.join(' · ')}. Fields without recorded observations are marked 'Not Detected'.
              </div>
            </div>
          </div>
        )}

        {/* ================= OFFICIAL REPORT COVER / HEADER (Requirement 9) ================= */}
        <div className="border-b-2 border-violet-500/50 print:border-slate-900 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest font-bold text-violet-400 print:text-slate-600">
                LABEL LENS · SIH26034
              </div>
              <div className="text-xs text-slate-400 print:text-slate-600 font-medium">
                Evidence-Based Package Inspection Assistant
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white print:text-slate-900 mt-1">
                INSPECTION REPORT
              </h1>
              <div className="text-xs text-slate-300 print:text-slate-700 font-mono mt-0.5">
                Statutory Packaging Compliance Verification Dossier
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-slate-300 print:text-slate-700 space-y-0.5 shrink-0">
              <div>
                <span className="text-slate-400 print:text-slate-500">Inspection ID: </span>
                <strong className="text-white print:text-slate-900 font-bold">{inspection.id || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-400 print:text-slate-500">Status: </span>
                <span className="font-bold text-violet-300 print:text-slate-900">{inspection.status}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-slate-500">Session Date: </span>
                <span>{new Date(inspection.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-slate-500">Session Time: </span>
                <span>{new Date(inspection.createdAt || Date.now()).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 1: INSPECTION SUMMARY (Requirement 10.1) ================= */}
        <div className="report-section-card space-y-3">
          <div className="border-b border-[#2D2448] print:border-slate-300 pb-1.5 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider font-bold text-slate-200 print:text-slate-900 flex items-center gap-1.5">
              <span>1. Inspection Summary</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400 print:text-slate-600">
              Overview & Scope
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#1C1630] print:bg-slate-50 border border-[#2D2448] print:border-slate-300 rounded-lg p-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">Commodity Examined</span>
              <div className="font-semibold text-white print:text-slate-900 mt-0.5 truncate" title={inspection.productName}>
                {inspection.productName || 'Unspecified Commodity'}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">Barcode / EAN</span>
              <div className="font-mono text-slate-200 print:text-slate-900 mt-0.5">
                {inspection.barcode || 'Not Specified'}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">Surfaces Submitted</span>
              <div className="font-mono text-slate-200 print:text-slate-900 mt-0.5">
                {totalSubmittedImages} of 4 Panels
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">Overall Status</span>
              <div className="font-bold text-violet-300 print:text-slate-900 mt-0.5">
                {inspection.status}
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: INSPECTOR & SESSION INFORMATION (Requirement 10.2) ================= */}
        <div className="report-section-card space-y-3">
          <div className="border-b border-[#2D2448] print:border-slate-300 pb-1.5 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider font-bold text-slate-200 print:text-slate-900">
              2. Inspector & Session Information
            </h2>
            <span className="text-[11px] font-mono text-slate-400 print:text-slate-600">
              Authority Identification
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-[#1C1630] print:bg-slate-50 border border-[#2D2448] print:border-slate-300 rounded-lg p-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">Inspector Name</span>
              <div className="font-semibold text-white print:text-slate-900 mt-0.5">
                {inspection.inspector?.name || 'Authorized Inspector'}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">Inspector ID / Badge</span>
              <div className="font-mono text-violet-300 print:text-slate-800 mt-0.5">
                {inspection.inspector?.id || 'INS-N/A'}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">Role & Designation</span>
              <div className="text-slate-200 print:text-slate-800 mt-0.5">
                {inspection.inspector?.role || 'Legal Metrology Field Officer'}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">Department</span>
              <div className="text-slate-200 print:text-slate-800 mt-0.5">
                Legal Metrology Department
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">Session Initiated</span>
              <div className="font-mono text-slate-300 print:text-slate-700 mt-0.5">
                {new Date(inspection.createdAt || Date.now()).toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">Session Concluded</span>
              <div className="font-mono text-slate-300 print:text-slate-700 mt-0.5">
                {new Date(inspection.updatedAt || inspection.createdAt || Date.now()).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 3: INSPECTION LOCATION (Requirement 10.3 & 13) ================= */}
        <div className="report-section-card space-y-3">
          <div className="border-b border-[#2D2448] print:border-slate-300 pb-1.5 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider font-bold text-slate-200 print:text-slate-900">
              3. Inspection Location
            </h2>
            <span className="text-[11px] font-mono text-slate-400 print:text-slate-600">
              Geographic Verification
            </span>
          </div>

          <div className="bg-[#1C1630] print:bg-slate-50 border border-[#2D2448] print:border-slate-300 rounded-lg p-3 text-xs">
            {inspection.location?.placeName || inspection.location?.latitude ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">Location Name</span>
                  <div className="font-semibold text-white print:text-slate-900 mt-0.5">
                    {inspection.location.placeName || 'Field Inspection Site'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">Coordinates</span>
                  <div className="font-mono text-slate-200 print:text-slate-900 mt-0.5">
                    {inspection.location.latitude && inspection.location.longitude
                      ? `${inspection.location.latitude.toFixed(4)}, ${inspection.location.longitude.toFixed(4)}`
                      : 'Not recorded'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">Accuracy</span>
                  <div className="font-mono text-slate-200 print:text-slate-900 mt-0.5">
                    {inspection.location.accuracy ? `±${inspection.location.accuracy} m` : 'Standard'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">Source</span>
                  <div className="text-slate-200 print:text-slate-900 mt-0.5">
                    {inspection.location.locationSource || 'Browser Geolocation / GPS'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 print:text-slate-600 font-mono italic">
                Location unavailable
              </div>
            )}
          </div>
        </div>

        {/* ================= SECTION 4: SUBMITTED PACKAGE IMAGES (Requirement 10.4, 11, 12) ================= */}
        <div className="report-section-card space-y-3 print-break-inside-avoid">
          <div className="border-b border-[#2D2448] print:border-slate-300 pb-1.5 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider font-bold text-slate-200 print:text-slate-900">
              4. Submitted Package Images
            </h2>
            <span className="text-[11px] font-mono text-slate-400 print:text-slate-600">
              {totalSubmittedImages} Image{totalSubmittedImages === 1 ? '' : 's'} Recorded
            </span>
          </div>

          {totalSubmittedImages === 0 ? (
            <div className="bg-[#1C1630] print:bg-slate-50 border border-[#2D2448] print:border-slate-300 rounded-lg p-6 text-center text-slate-400 print:text-slate-600 text-xs italic">
              No package images were submitted.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {imageSurfaces.map((img) => (
                <div
                  key={img.side}
                  className="report-image-card border border-[#2D2448] print:border-slate-300 rounded-lg overflow-hidden bg-[#1C1630] print:bg-slate-50 flex flex-col"
                >
                  <div className="p-2 border-b border-[#2D2448] print:border-slate-200 bg-[#151025] print:bg-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-white print:text-slate-900">{img.label}</span>
                    <span className="text-[10px] font-mono text-slate-400 print:text-slate-600 uppercase">
                      {img.src ? 'Submitted' : 'Omitted'}
                    </span>
                  </div>

                  <div className="h-44 bg-[#090610] print:bg-slate-200 flex items-center justify-center p-1.5 relative">
                    {img.src ? (
                      <img
                        src={img.src}
                        alt={`${img.label} package panel`}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-slate-500 print:text-slate-400 text-xs italic font-mono text-center p-2">
                        Panel not submitted
                      </span>
                    )}
                  </div>

                  <div className="p-2 bg-[#151025] print:bg-white border-t border-[#2D2448] print:border-slate-200 text-[10px] text-slate-400 print:text-slate-600 truncate">
                    {img.sub}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= SECTION 5: PACKAGE INFORMATION (Requirement 10.5 & 3) ================= */}
        <div className="report-section-card space-y-4 print-break-inside-avoid">
          <div className="border-b border-[#2D2448] print:border-slate-300 pb-1.5 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider font-bold text-slate-200 print:text-slate-900">
              5. Package Information
            </h2>
            <span className="text-[11px] font-mono text-slate-400 print:text-slate-600">
              Statutory & Additional Declarations
            </span>
          </div>

          {/* Level A: Structured Package Information */}
          <div className="space-y-2">
            <h3 className="text-[11px] uppercase tracking-wider font-bold text-violet-400 print:text-slate-700">
              Level A: Structured Declarations
            </h3>

            <div className="border border-[#2D2448] print:border-slate-300 rounded-lg overflow-hidden bg-[#1C1630] print:bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#151025] print:bg-slate-100 border-b border-[#2D2448] print:border-slate-300 text-slate-400 print:text-slate-700 font-bold text-[11px]">
                    <th className="py-2.5 px-3 w-1/3">Statutory Declaration</th>
                    <th className="py-2.5 px-3 w-1/2">Declared / Verified Value</th>
                    <th className="py-2.5 px-3 w-1/6 text-right">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2448]/80 print:divide-slate-200 text-slate-200 print:text-slate-900">
                  {structuredFieldKeys.map((item) => {
                    const field = inspection.extractedFields?.[item.key];
                    const val = getFieldValueDisplay(field);
                    const isDetected = val.display !== 'Not Detected';

                    return (
                      <tr key={item.key} className="hover:bg-[#241B3E]/40 print:hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-white print:text-slate-800">
                          {item.label}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {isDetected ? (
                            <span className={val.isVerified ? 'text-emerald-400 print:text-emerald-800 font-bold' : 'text-slate-200 print:text-slate-900'}>
                              {val.display}
                              {val.isVerified && (
                                <span className="ml-2 text-[10px] font-sans font-semibold text-emerald-400 print:text-emerald-700">
                                  [Verified]
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Not Detected</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-sans text-slate-400 print:text-slate-600 text-[11px]">
                          {field?.sourceImage ? `${field.sourceImage} Panel` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Level B: Other Detected Information (Requirement 3B) */}
          <div className="space-y-2">
            <h3 className="text-[11px] uppercase tracking-wider font-bold text-violet-400 print:text-slate-700">
              Level B: Other Detected Information
            </h3>

            {inspection.otherDetectedInfo && inspection.otherDetectedInfo.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {inspection.otherDetectedInfo.map((info, idx) => (
                  <div
                    key={idx}
                    className="bg-[#1C1630] print:bg-slate-50 border border-[#2D2448] print:border-slate-300 rounded-lg p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 print:text-slate-600 font-bold uppercase mb-1">
                      <span>{info.title}</span>
                      <span>{info.sourceImage} Panel</span>
                    </div>
                    <div className="font-mono text-slate-200 print:text-slate-800">{info.content}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#1C1630] print:bg-slate-50 border border-[#2D2448] print:border-slate-300 rounded-lg p-3 text-xs text-slate-400 print:text-slate-600 italic">
                No auxiliary non-statutory declarations cataloged.
              </div>
            )}
          </div>
        </div>

        {/* ================= SECTION 6: COMPLETE DETECTED PACKAGE TEXT (Requirement 10.6 & 4) ================= */}
        <div className="report-section-card space-y-3 print-break-inside-avoid">
          <div className="border-b border-[#2D2448] print:border-slate-300 pb-1.5 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider font-bold text-slate-200 print:text-slate-900">
              6. Complete Detected Package Text
            </h2>
            <span className="text-[11px] font-mono text-slate-400 print:text-slate-600">
              Grouped by Submitted Panel (Saved Optical Results)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['Front', 'Back', 'Side', 'Additional'] as const).map((side) => {
              const lines = textBySurface[side] || [];

              return (
                <div
                  key={side}
                  className="bg-[#1C1630] print:bg-slate-50 border border-[#2D2448] print:border-slate-300 rounded-lg p-3 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-[#2D2448] print:border-slate-200 pb-1">
                    <span className="font-bold text-white print:text-slate-900">{side} Image Text</span>
                    <span className="text-[10px] font-mono text-slate-400 print:text-slate-600">
                      {lines.length} Line{lines.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {lines.length > 0 ? (
                    <div className="space-y-1 font-mono text-[11px] text-slate-300 print:text-slate-800 max-h-48 overflow-y-auto">
                      {lines.map((line, idx) => (
                        <div key={idx} className="bg-[#151025] print:bg-white px-2 py-1 rounded border border-[#2D2448]/60 print:border-slate-200">
                          {line}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 italic text-[11px] py-2">
                      No recognized text for {side} surface.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= SECTION 7: FIELD VERIFICATION & EVIDENCE (Requirement 10.7 & 5) ================= */}
        <div className="report-section-card space-y-3 print-break-inside-avoid">
          <div className="border-b border-[#2D2448] print:border-slate-300 pb-1.5 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider font-bold text-slate-200 print:text-slate-900">
              7. Field Verification & Evidence
            </h2>
            <span className="text-[11px] font-mono text-slate-400 print:text-slate-600">
              Observations & Evidence References
            </span>
          </div>

          <div className="border border-[#2D2448] print:border-slate-300 rounded-lg overflow-hidden bg-[#1C1630] print:bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#151025] print:bg-slate-100 border-b border-[#2D2448] print:border-slate-300 text-slate-400 print:text-slate-700 font-bold text-[11px]">
                  <th className="py-2.5 px-3">Field</th>
                  <th className="py-2.5 px-3">Observed Value</th>
                  <th className="py-2.5 px-3">Source Image</th>
                  <th className="py-2.5 px-3">Verification Status</th>
                  <th className="py-2.5 px-3">Evidence Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D2448]/80 print:divide-slate-200 text-slate-200 print:text-slate-900">
                {Object.values(inspection.extractedFields || {}).map((f) => {
                  const val = getFieldValueDisplay(f);
                  const firstEv = f.evidence && f.evidence.length > 0 ? f.evidence[0] : null;

                  return (
                    <tr key={f.key} className="hover:bg-[#241B3E]/40 print:hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-white print:text-slate-900">
                        {f.label}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <div className="font-bold text-violet-300 print:text-slate-900">
                          {val.display}
                        </div>
                        {f.isManuallyVerified && f.extractedValue && f.extractedValue !== f.verifiedValue && (
                          <div className="text-[10px] text-slate-500 line-through">
                            Original: {f.extractedValue}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 print:text-slate-700">
                        {f.sourceImage ? `${f.sourceImage} Panel` : 'Not Visible'}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge
                          confidenceState={
                            f.isManuallyVerified
                              ? 'VERIFIED BY INSPECTOR'
                              : f.isNotVisible
                              ? 'NOT DETECTED'
                              : f.confidenceState || 'HIGH CONFIDENCE'
                          }
                          size="sm"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        {firstEv ? (
                          <div className="space-y-0.5">
                            <div className="font-mono text-slate-300 print:text-slate-800 truncate max-w-[200px]" title={firstEv.snippet}>
                              "{firstEv.snippet || f.evidenceSnippet}"
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Loc: X:{Math.round(firstEv.x * 100)}% Y:{Math.round(firstEv.y * 100)}%
                            </div>
                            {/* Evidence inspect trigger for preview mode */}
                            <button
                              type="button"
                              onClick={() => setEvidenceModalField(f)}
                              className="no-print text-violet-400 hover:text-violet-300 underline text-[10px] font-semibold cursor-pointer"
                            >
                              Inspect Crop
                            </button>
                          </div>
                        ) : f.evidenceSnippet && f.evidenceSnippet !== 'Not detected' ? (
                          <span className="font-mono text-slate-300 print:text-slate-700 text-[11px]">
                            "{f.evidenceSnippet}"
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">No evidence coordinate</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= SECTION 8: RULE FINDINGS (Requirement 10.8 & 8) ================= */}
        <div className="report-section-card space-y-3 print-break-inside-avoid">
          <div className="border-b border-[#2D2448] print:border-slate-300 pb-1.5 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider font-bold text-slate-200 print:text-slate-900">
              8. Rule Findings
            </h2>
            <span className="text-[11px] font-mono text-slate-400 print:text-slate-600">
              Legal Metrology Rules, 2011 Verification
            </span>
          </div>

          <div className="border border-[#2D2448] print:border-slate-300 rounded-lg overflow-hidden bg-[#1C1630] print:bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#151025] print:bg-slate-100 border-b border-[#2D2448] print:border-slate-300 text-slate-400 print:text-slate-700 font-bold text-[11px]">
                  <th className="py-2.5 px-3">Rule</th>
                  <th className="py-2.5 px-3">Requirement</th>
                  <th className="py-2.5 px-3">Observed Information</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Evidence</th>
                  <th className="py-2.5 px-3">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D2448]/80 print:divide-slate-200 text-slate-200 print:text-slate-900">
                {(inspection.findings || []).map((f) => {
                  return (
                    <tr key={f.ruleCode} className="hover:bg-[#241B3E]/40 print:hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-violet-300 print:text-slate-900 whitespace-nowrap">
                        {f.ruleCode}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-200 print:text-slate-800 max-w-xs">
                        {f.requirement}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 print:text-slate-800">
                        {f.observedEvidence || 'No direct observation recorded'}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <StatusBadge status={f.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 print:text-slate-600">
                        {f.evidenceImage ? `${f.evidenceImage} Image` : 'Submitted Panels'}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-300 print:text-slate-700">
                        {f.notes ? (
                          <span className="text-amber-300 print:text-amber-900 font-semibold">{f.notes}</span>
                        ) : (
                          <span>Rule criteria satisfied</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= SECTION 9: MANUAL CORRECTIONS (Requirement 10.9 & 7) ================= */}
        <div className="report-section-card space-y-3 print-break-inside-avoid">
          <div className="border-b border-[#2D2448] print:border-slate-300 pb-1.5 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider font-bold text-slate-200 print:text-slate-900">
              9. Manual Corrections
            </h2>
            <span className="text-[11px] font-mono text-slate-400 print:text-slate-600">
              Inspector Audit History
            </span>
          </div>

          {manualCorrections.length > 0 ? (
            <div className="border border-[#2D2448] print:border-slate-300 rounded-lg overflow-hidden bg-[#1C1630] print:bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#151025] print:bg-slate-100 border-b border-[#2D2448] print:border-slate-300 text-slate-400 print:text-slate-700 font-bold text-[11px]">
                    <th className="py-2.5 px-3">Field</th>
                    <th className="py-2.5 px-3">Original Extracted</th>
                    <th className="py-2.5 px-3">Verified Value</th>
                    <th className="py-2.5 px-3">Modified By</th>
                    <th className="py-2.5 px-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2448]/80 print:divide-slate-200 text-slate-200 print:text-slate-900 font-mono">
                  {manualCorrections.map((c, i) => (
                    <tr key={i} className="hover:bg-[#241B3E]/40 print:hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-sans font-semibold text-white print:text-slate-900">
                        {c.fieldLabel}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 line-through">
                        {c.originalValue}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400 print:text-emerald-800">
                        {c.verifiedValue}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-300 print:text-slate-700">
                        {c.changedBy}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 print:text-slate-600">
                        {c.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-[#1C1630] print:bg-slate-50 border border-[#2D2448] print:border-slate-300 rounded-lg p-3 text-xs text-slate-400 print:text-slate-600 italic">
              No manual corrections recorded.
            </div>
          )}
        </div>

        {/* ================= SECTION 10: INSPECTOR REMARKS (Requirement 10.10 & 15) ================= */}
        <div className="report-section-card space-y-2 print-break-inside-avoid">
          <div className="border-b border-[#2D2448] print:border-slate-300 pb-1.5 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider font-bold text-slate-200 print:text-slate-900">
              10. Inspector Remarks
            </h2>
            <span className="text-[11px] font-mono text-slate-400 print:text-slate-600">
              Field Observations
            </span>
          </div>

          <div className="bg-[#1C1630] print:bg-slate-50 border border-[#2D2448] print:border-slate-300 rounded-lg p-3.5 text-xs text-slate-200 print:text-slate-900 leading-relaxed font-sans whitespace-pre-line">
            {inspection.remarks && inspection.remarks.trim() ? (
              `"${inspection.remarks.trim()}"`
            ) : (
              <span className="text-slate-500 italic">No inspector remarks recorded.</span>
            )}
          </div>
        </div>

        {/* ================= SECTION 11: INSPECTOR SIGNATURE (Requirement 10.11 & 14) ================= */}
        <div className="report-signature-card report-section-card space-y-3 print-break-inside-avoid">
          <div className="border-b border-[#2D2448] print:border-slate-300 pb-1.5 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider font-bold text-slate-200 print:text-slate-900">
              11. Inspector Signature
            </h2>
            <span className="text-[11px] font-mono text-slate-400 print:text-slate-600">
              Officer Endorsement
            </span>
          </div>

          <div className="bg-[#1C1630] print:bg-slate-50 border border-[#2D2448] print:border-slate-300 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="text-slate-400 print:text-slate-600">Inspecting Official:</div>
              <div className="font-bold text-white print:text-slate-900 text-sm">
                {inspection.inspector?.name || 'Rahul Sharma'}
              </div>
              <div className="font-mono text-violet-300 print:text-slate-700">
                Officer ID: {inspection.inspector?.id || 'INS-1042'}
              </div>
              <div className="text-[11px] text-slate-400 print:text-slate-600">
                Jurisdiction: {inspection.inspector?.jurisdiction || 'Northern Zone, Legal Metrology'}
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-[#2D2448] print:border-slate-300 pt-3 sm:pt-0 sm:pl-6 min-w-[200px]">
              <div className="text-[10px] uppercase font-bold mb-1" style={{ color: '#000000' }}>
                Digital Signature Record
              </div>
              {inspection.signature?.signatureDataUrl ? (
                <div className="space-y-1">
                  <div className="bg-white p-2 rounded border border-slate-300 inline-block">
                    <img
                      src={inspection.signature.signatureDataUrl}
                      alt="Inspector Signature"
                      className="max-h-12 w-auto"
                      style={{ filter: 'brightness(0)', color: '#000000' }}
                    />
                  </div>
                  <div className="text-[10px] font-semibold flex items-center sm:justify-end gap-1" style={{ color: '#000000' }}>
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span style={{ color: '#000000' }}>Signed electronically</span>
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: '#000000' }}>
                    Signed at: {new Date(inspection.signature.signedAt).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="font-mono italic py-2" style={{ color: '#000000' }}>
                  Not signed
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= SECTION 12: ACTIVITY TIMELINE (Requirement 10.12 & 16) ================= */}
        <div className="report-section-card space-y-3 print-break-inside-avoid">
          <div className="border-b border-[#2D2448] print:border-slate-300 pb-1.5 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider font-bold text-slate-200 print:text-slate-900">
              12. Activity Timeline
            </h2>
            <span className="text-[11px] font-mono text-slate-400 print:text-slate-600">
              Audit Trail
            </span>
          </div>

          <div className="border border-[#2D2448] print:border-slate-300 rounded-lg overflow-hidden bg-[#1C1630] print:bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#151025] print:bg-slate-100 border-b border-[#2D2448] print:border-slate-300 text-slate-400 print:text-slate-700 font-bold text-[11px]">
                  <th className="py-2.5 px-3 w-28">Timestamp</th>
                  <th className="py-2.5 px-3">Action Recorded</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Details / Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D2448]/80 print:divide-slate-200 text-slate-200 print:text-slate-900 font-mono text-[11px]">
                {(inspection.activityLog || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#241B3E]/40 print:hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-400 print:text-slate-600 whitespace-nowrap">
                      {item.timeFormatted || new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 px-3 font-sans font-medium text-white print:text-slate-900">
                      {item.action}
                    </td>
                    <td className="py-2 px-3 text-slate-400 print:text-slate-700 font-sans">
                      {item.actor}
                    </td>
                    <td className="py-2 px-3 text-slate-300 print:text-slate-700 font-sans">
                      {item.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= SECTION 13: PROTOTYPE NOTICE / REFERENCE NOTE (Requirement 10.13 & 18) ================= */}
        <div className="report-section-card pt-4 border-t border-[#2D2448] print:border-slate-400">
          <div className="p-3 rounded-lg bg-[#1C1630]/60 print:bg-slate-100 border border-[#2D2448]/70 print:border-slate-300 text-[11px] text-slate-400 print:text-slate-600 leading-relaxed">
            <strong className="text-slate-300 print:text-slate-800">Reference Note: </strong>
            LabelLens is an SIH26034 prototype inspection assistant. Findings are based on submitted package images, extracted information, prototype verification rules, and inspector review. This report does not constitute a final legal or regulatory determination.
          </div>
        </div>
      </div>

      {/* Evidence Viewer Modal for inspect clicks */}
      {evidenceModalField && (
        <EvidenceViewerModal
          isOpen={true}
          field={evidenceModalField}
          images={inspection.images}
          imageRecords={inspection.imageRecords}
          allOcrTokens={inspection.detectedTexts}
          onClose={() => setEvidenceModalField(null)}
        />
      )}
    </div>
  );
};
