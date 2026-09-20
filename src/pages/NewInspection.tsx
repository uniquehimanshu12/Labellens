import React, { useState, useEffect } from 'react';
import { InspectionRecord, ImageSide, ExtractedField, RuleFinding, PackageImages, InspectorSignature, RawAnalysisDebugInfo, UploadedImageRecord } from '../types';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import { locationService } from '../services/locationService';
import { ocrService, ExtractionResult } from '../services/ocrService';
import { ruleEngine } from '../services/ruleEngine';
import { SAMPLE_PACKAGES } from '../data/demoData';
import { InspectionStepper } from '../components/inspection/InspectionStepper';
import { CaptureSlot } from '../components/inspection/CaptureSlot';
import { ExtractionTable } from '../components/inspection/ExtractionTable';
import { FindingTable } from '../components/inspection/FindingTable';
import { InspectionSummaryPanel } from '../components/inspection/InspectionSummaryPanel';
import { LocationBadge } from '../components/common/LocationBadge';
import { CameraCaptureModal } from '../components/common/CameraCaptureModal';
import { EvidenceViewerModal } from '../components/common/EvidenceViewerModal';
import { ManualEditModal } from '../components/inspection/ManualEditModal';
import { RawAnalysisDebugModal } from '../components/common/RawAnalysisDebugModal';
import { DedicatedScanner } from './DedicatedScanner';
import { SignaturePad } from '../components/inspection/SignaturePad';
import { AuditReviewSummary } from '../components/inspection/AuditReviewSummary';
import { PackageImageCarousel } from '../components/inspection/PackageImageCarousel';
import { FieldDetailDrawer } from '../components/inspection/FieldDetailDrawer';
import { CompletionScreen } from '../components/inspection/CompletionScreen';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Package,
  ShieldCheck,
  Scan,
  Tag,
} from 'lucide-react';

interface NewInspectionProps {
  onNavigate: (route: string, params?: { inspectionId?: string }) => void;
  isResumingDraft?: boolean;
}

const REMARKS_QUICK_CHIPS = [
  'MRP missing on package',
  'Manufacturer address incomplete',
  'Net quantity font too small',
  'Customer care details missing',
  'Date stamped unclearly',
  'Package damaged / torn',
];

export const NewInspection: React.FC<NewInspectionProps> = ({
  onNavigate,
  isResumingDraft = false,
}) => {
  const currentInspector = authService.getCurrentUser()!;
  const { toastSaved, toastVerified, toastReportReady, toastLocationUnavailable, toastError } = useToast();

  // Initialize or resume draft inspection
  const [inspection, setInspection] = useState<InspectionRecord>(() => {
    if (isResumingDraft) {
      const draft = storageService.getActiveDraft();
      if (draft) return draft;
    }

    const generatedId = `LL-2026-00${Math.floor(143 + Math.random() * 850)}`;
    const now = new Date().toISOString();

    return {
      id: generatedId,
      productName: '',
      barcode: '',
      inspector: currentInspector,
      createdAt: now,
      updatedAt: now,
      location: {
        latitude: null,
        longitude: null,
        accuracy: null,
        placeName: 'Detecting...',
        timestamp: now,
        locationSource: 'Unavailable',
      },
      images: {
        front: null,
        back: null,
        side: null,
        additional: null,
      },
      extractedFields: {},
      findings: [],
      remarks: '',
      status: 'REQUIRES MANUAL VERIFICATION',
      activityLog: [
        {
          id: '1',
          timestamp: now,
          timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'Inspection session initiated',
          actor: currentInspector.id,
        },
      ],
      step: 1,
    };
  });

  const [currentStep, setCurrentStep] = useState<number>(inspection.step || 1);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Modals state
  const [activeCameraSide, setActiveCameraSide] = useState<ImageSide | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);
  const [evidenceField, setEvidenceField] = useState<ExtractedField | null>(null);
  const [editingField, setEditingField] = useState<ExtractedField | null>(null);
  const [drawerField, setDrawerField] = useState<ExtractedField | null>(null);
  const [selectedCarouselSide, setSelectedCarouselSide] = useState<ImageSide>('front');
  const [annotatingFinding, setAnnotatingFinding] = useState<RuleFinding | null>(null);
  const [findingNoteText, setFindingNoteText] = useState('');

  // Single-image debug modal states for Step 2
  const [step2DebugInfo, setStep2DebugInfo] = useState<RawAnalysisDebugInfo | null>(null);
  const [step2DebugModalOpen, setStep2DebugModalOpen] = useState(false);
  const [step2TestingSide, setStep2TestingSide] = useState<ImageSide | null>(null);
  const [step2DebugImageSrc, setStep2DebugImageSrc] = useState<string | null>(null);

  const handleTestSlotImage = async (side: ImageSide) => {
    const dataUrl = inspection.images[side];
    if (!dataUrl) return;
    setStep2TestingSide(side);
    setStep2DebugImageSrc(dataUrl);

    const imageRecord: UploadedImageRecord = {
      imageId: `img_${side}_${Date.now()}`,
      side,
      fileName: `${side}_surface.jpg`,
      dataUrl,
      uploadedAt: new Date().toISOString(),
    };

    const res = await ocrService.analyzeSingleImage(inspection.id, imageRecord, false);
    setStep2TestingSide(null);

    if (res.success && res.debugInfo) {
      setStep2DebugInfo(res.debugInfo);
      setStep2DebugModalOpen(true);
    } else {
      toastError('Single Image Issue', res.error || 'Failed to inspect image');
    }
  };

  // Location detection states
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [manualLocationModalOpen, setManualLocationModalOpen] = useState(false);
  const [manualPlaceInput, setManualPlaceInput] = useState('');
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);

  // Auto-save draft on changes
  useEffect(() => {
    storageService.saveActiveDraft(inspection);
    setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [inspection]);

  // Initial location detection on Step 1 if not yet captured
  useEffect(() => {
    if (inspection.location.latitude === null && inspection.location.locationSource === 'Unavailable') {
      handleDetectLocation();
    }
  }, []);

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    const loc = await locationService.detectLocation();
    setIsDetectingLocation(false);

    if (loc.locationSource === 'Unavailable') {
      toastLocationUnavailable();
    }

    setInspection((prev) => ({
      ...prev,
      location: loc,
      activityLog: [
        ...prev.activityLog,
        {
          id: String(Date.now()),
          timestamp: new Date().toISOString(),
          timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: `Location acquired (${loc.locationSource})`,
          actor: 'GPS/System',
          details: loc.placeName,
        },
      ],
    }));
  };

  const handleSaveManualLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPlaceInput.trim()) return;

    const loc = locationService.createManualLocation(manualPlaceInput.trim());
    setInspection((prev) => ({
      ...prev,
      location: loc,
    }));
    setManualLocationModalOpen(false);
    setManualPlaceInput('');
  };

  // Image capture / preset loading handlers
  const handleSetImage = (side: ImageSide, dataUrl: string) => {
    setInspection((prev) => {
      const updatedImages = { ...prev.images, [side]: dataUrl };
      return {
        ...prev,
        images: updatedImages,
        activityLog: [
          ...prev.activityLog,
          {
            id: String(Date.now()),
            timestamp: new Date().toISOString(),
            timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: `${side.toUpperCase()} package surface captured`,
            actor: currentInspector.id,
          },
        ],
      };
    });
  };

  const handleRemoveImage = (side: ImageSide) => {
    setInspection((prev) => ({
      ...prev,
      images: { ...prev.images, [side]: null },
    }));
  };

  const handleLoadSamplePreset = (presetKey: 'biscuits' | 'milk') => {
    const sample = SAMPLE_PACKAGES[presetKey];
    setInspection((prev) => ({
      ...prev,
      productName: sample.name,
      barcode: sample.barcode,
      images: { ...sample.images },
      activityLog: [
        ...prev.activityLog,
        {
          id: String(Date.now()),
          timestamp: new Date().toISOString(),
          timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: `Sample package loaded: ${sample.name}`,
          actor: currentInspector.id,
        },
      ],
    }));
  };

  // Handling scan result from DedicatedScanner (Step 3)
  const handleScanCompleted = (result: ExtractionResult) => {
    const evaluated = ruleEngine.evaluatePackageRules(result.fields, inspection.images);
    const status = ruleEngine.determineOverallStatus(evaluated.findings);

    setInspection((prev) => ({
      ...prev,
      extractedFields: result.fields,
      findings: evaluated.findings,
      status: status,
      detectedTexts: result.detectedTexts || prev.detectedTexts,
      allDetectedText: result.allDetectedText || prev.allDetectedText,
      otherDetectedInfo: result.otherDetectedInfo || prev.otherDetectedInfo,
      scanSummary: result.summary || prev.scanSummary,
      productName: prev.productName || result.fields.productName?.extractedValue || 'Packaged Commodity',
      activityLog: [
        ...prev.activityLog,
        {
          id: String(Date.now()),
          timestamp: new Date().toISOString(),
          timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: `Multimodal scan processed (${result.modeUsed} mode)`,
          actor: 'Scanner Engine',
          details: `${Object.keys(result.fields).length} fields extracted`,
        },
      ],
    }));

    handleStepChange(4); // Advance to VERIFY step
  };

  // Skip to manual verification without scan
  const handleSkipToManualVerify = () => {
    if (Object.keys(inspection.extractedFields).length === 0) {
      const emptyResult = ocrService.generateEmptyExtraction();
      const evaluated = ruleEngine.evaluatePackageRules(emptyResult.fields, inspection.images);
      setInspection((prev) => ({
        ...prev,
        extractedFields: emptyResult.fields,
        findings: evaluated.findings,
        status: 'REQUIRES MANUAL VERIFICATION',
      }));
    }
    handleStepChange(4);
  };

  // Inspector Audit Actions (Accept, Clear, Mark Not Visible, Edit)
  const handleAcceptField = (key: string) => {
    const f = inspection.extractedFields[key];
    if (!f) return;
    const updated: ExtractedField = {
      ...f,
      isManuallyVerified: true,
      verifiedValue: f.verifiedValue || f.extractedValue || 'Verified',
      confidenceState: 'VERIFIED BY INSPECTOR',
      isNotVisible: false,
    };
    handleSaveVerifiedField(updated);
  };

  const handleClearField = (key: string) => {
    const f = inspection.extractedFields[key];
    if (!f) return;
    const updated: ExtractedField = {
      ...f,
      extractedValue: '',
      verifiedValue: '',
      isManuallyVerified: true,
      confidenceState: 'NOT DETECTED',
    };
    handleSaveVerifiedField(updated);
  };

  const handleMarkNotVisible = (key: string) => {
    const f = inspection.extractedFields[key];
    if (!f) return;
    const updated: ExtractedField = {
      ...f,
      isNotVisible: true,
      isManuallyVerified: true,
      confidenceState: 'NOT DETECTED',
    };
    handleSaveVerifiedField(updated);
  };

  const handleSaveVerifiedField = (updatedField: ExtractedField) => {
    setInspection((prev) => {
      const originalField = prev.extractedFields[updatedField.key];
      const newFields = { ...prev.extractedFields, [updatedField.key]: updatedField };
      const evalResult = ruleEngine.evaluatePackageRules(newFields, prev.images);
      const newStatus = ruleEngine.determineOverallStatus(evalResult.findings);

      const originalVal = originalField?.extractedValue || 'Not Detected';
      const newVal = updatedField.isNotVisible
        ? 'Marked Not Visible'
        : (updatedField.verifiedValue || updatedField.extractedValue || 'Verified');
      const isChanged = originalVal !== newVal;

      const existingCorrections = prev.manualCorrections || [];
      const updatedCorrections = isChanged
        ? [
            ...existingCorrections.filter((c) => c.fieldKey !== updatedField.key),
            {
              fieldKey: updatedField.key,
              fieldLabel: updatedField.label,
              originalValue: originalVal,
              verifiedValue: newVal,
              changedBy: currentInspector.id,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]
        : existingCorrections;

      return {
        ...prev,
        extractedFields: newFields,
        findings: evalResult.findings,
        status: newStatus,
        manualCorrections: updatedCorrections,
        activityLog: [
          ...prev.activityLog,
          {
            id: String(Date.now()),
            timestamp: new Date().toISOString(),
            timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: `Field verified: ${updatedField.label}`,
            actor: currentInspector.id,
            details: updatedField.isNotVisible ? 'Marked Not Visible' : updatedField.verifiedValue,
          },
        ],
      };
    });

    toastVerified(
      updatedField.label,
      updatedField.isNotVisible ? 'Marked Not Visible' : updatedField.verifiedValue || 'Verified'
    );
  };

  const handleSaveFindingNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annotatingFinding) return;

    setInspection((prev) => {
      const updatedFindings = prev.findings.map((f) =>
        f.ruleCode === annotatingFinding.ruleCode ? { ...f, notes: findingNoteText.trim() } : f
      );
      return {
        ...prev,
        findings: updatedFindings,
      };
    });

    setAnnotatingFinding(null);
    setFindingNoteText('');
  };

  // Quick insert chips for remarks
  const handleInsertRemarkChip = (chipText: string) => {
    setInspection((prev) => {
      const current = prev.remarks.trim();
      const next = current ? `${current}\n• ${chipText}` : `• ${chipText}`;
      return { ...prev, remarks: next };
    });
  };

  // Signature capture
  const handleSaveSignature = (sig: InspectorSignature) => {
    setInspection((prev) => ({
      ...prev,
      signature: sig,
      activityLog: [
        ...prev.activityLog,
        {
          id: String(Date.now()),
          timestamp: new Date().toISOString(),
          timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'Inspector digital signature recorded',
          actor: currentInspector.id,
        },
      ],
    }));
  };

  // Request finalize with modal
  const handleRequestFinalizeInspection = () => {
    setCompleteConfirmOpen(true);
  };

  // Finalize inspection
  const executeFinalizeInspection = () => {
    const finalizedRecord: InspectionRecord = {
      ...inspection,
      step: 6,
      status: 'COMPLETED',
      updatedAt: new Date().toISOString(),
      activityLog: [
        ...inspection.activityLog,
        {
          id: String(Date.now()),
          timestamp: new Date().toISOString(),
          timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'Inspection completed and archived into records',
          actor: currentInspector.id,
        },
      ],
    };

    storageService.saveInspection(finalizedRecord);
    storageService.clearActiveDraft();
    setInspection(finalizedRecord);
    setCompleteConfirmOpen(false);
    toastReportReady(finalizedRecord.id);
    handleStepChange(6);
  };

  const handleStepChange = (newStep: number) => {
    setCurrentStep(newStep);
    setInspection((prev) => ({ ...prev, step: newStep }));
  };

  const imagesCount = Object.values(inspection.images).filter(Boolean).length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Workflow Stepper */}
      <InspectionStepper
        currentStep={currentStep}
        onSelectStep={(step) => handleStepChange(step)}
        maxStepAllowed={6}
      />

      {/* ================= STEP 3: DEDICATED SCANNER FULL SCREEN WORKSPACE ================= */}
      {currentStep === 3 ? (
        <DedicatedScanner
          inspectionId={inspection.id}
          images={inspection.images}
          onScanComplete={handleScanCompleted}
          onContinueManually={handleSkipToManualVerify}
          onBackToCapture={() => handleStepChange(2)}
          onUpdateImages={(updated) => setInspection((prev) => ({ ...prev, images: updated }))}
        />
      ) : currentStep === 5 ? (
        /* ================= STEP 5: FINAL AUDIT-REVIEW SUMMARY PAGE ================= */
        <AuditReviewSummary
          inspection={inspection}
          onBackToVerification={() => handleStepChange(4)}
          onFinalSubmit={handleRequestFinalizeInspection}
        />
      ) : currentStep === 6 ? (
        /* ================= STEP 6: COMPLETION SCREEN ================= */
        <CompletionScreen
          inspection={inspection}
          onStartNewInspection={() => onNavigate('new-inspection')}
          onViewInspection={() => onNavigate('inspection-detail', { inspectionId: inspection.id })}
          onViewReport={() => onNavigate('reports', { inspectionId: inspection.id })}
        />
      ) : (
        /* ================= STEPS 1, 2, 4: Standard Two-Column Layout ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Active Step Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* ================= STEP 1: PREPARE ================= */}
            {currentStep === 1 && (
              <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-6 shadow-xl space-y-5 text-slate-200">
                <div className="border-b border-[#2D2448] pb-3">
                  <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-violet-400">
                    STAGE 1 · PREPARE
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5">Commodity Identity & Field Location</h2>
                  <p className="text-xs text-slate-400">
                    Register product identity, capture verified GPS coordinates, and prepare the inspection session.
                  </p>
                </div>

                {/* Dossier Meta Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#1C1630] border border-[#2D2448] rounded-xl p-3.5 text-xs">
                  <div>
                    <span className="text-slate-400 block uppercase font-mono text-[10px]">Dossier ID</span>
                    <span className="font-mono font-bold text-violet-300 text-sm">{inspection.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-mono text-[10px]">Inspector</span>
                    <span className="font-semibold text-white">
                      {inspection.inspector.name} ({inspection.inspector.id})
                    </span>
                  </div>
                </div>

                {/* Identity Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input-product-name" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Commodity Name
                    </label>
                    <input
                      id="input-product-name"
                      type="text"
                      value={inspection.productName}
                      onChange={(e) => setInspection({ ...inspection, productName: e.target.value })}
                      placeholder="e.g. Enter product title or leave blank to auto-detect via AI OCR"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2448] bg-[#0D0917] text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="input-barcode" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Barcode / EAN-13 (Optional)
                    </label>
                    <input
                      id="input-barcode"
                      type="text"
                      value={inspection.barcode || ''}
                      onChange={(e) => setInspection({ ...inspection, barcode: e.target.value })}
                      placeholder="e.g. 8901030948201"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2448] bg-[#0D0917] text-sm font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Location Metadata */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Field Location Evidence
                  </label>
                  <LocationBadge
                    location={inspection.location}
                    isLoading={isDetectingLocation}
                    onRetry={handleDetectLocation}
                    onManualEdit={() => {
                      setManualPlaceInput(inspection.location.placeName || '');
                      setManualLocationModalOpen(true);
                    }}
                  />
                </div>

                {/* Demo Presets Bar */}
                <div className="bg-[#1C1630] border border-[#2D2448] rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-violet-300">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span>Evaluation Presets (Sample Packages):</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Instantly load packaged commodity sample panels with real evidence for testing:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      id="btn-load-preset-biscuits"
                      type="button"
                      onClick={() => handleLoadSamplePreset('biscuits')}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#151025] border border-[#2D2448] hover:bg-[#201738] text-slate-200 text-xs font-semibold shadow-md cursor-pointer transition-colors"
                    >
                      <Package className="w-3.5 h-3.5 text-violet-400" />
                      <span>ABC Cream Biscuits 100g</span>
                    </button>
                    <button
                      id="btn-load-preset-milk"
                      type="button"
                      onClick={() => handleLoadSamplePreset('milk')}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#151025] border border-[#2D2448] hover:bg-[#201738] text-slate-200 text-xs font-semibold shadow-md cursor-pointer transition-colors"
                    >
                      <Package className="w-3.5 h-3.5 text-violet-400" />
                      <span>FreshMilk 1L TetraPak</span>
                    </button>
                  </div>
                </div>

                {/* Step 1 Actions */}
                <div className="flex items-center justify-end pt-4 border-t border-[#2D2448]">
                  <button
                    id="btn-step1-next"
                    type="button"
                    onClick={() => handleStepChange(2)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-950 cursor-pointer transition-colors"
                  >
                    <span>Proceed to Package Capture</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 2: CAPTURE (NO COMPULSORY PHOTO REQUIREMENT) ================= */}
            {currentStep === 2 && (
              <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-6 shadow-xl space-y-5 text-slate-200">
                <div className="border-b border-[#2D2448] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-violet-400">
                      STAGE 2 · CAPTURE
                    </span>
                    <h2 className="text-lg font-bold text-white mt-0.5">Package Surface Evidence</h2>
                    <p className="text-xs text-slate-400">
                      Capture or upload 0 to 4 package surfaces. Inspections can be completed with or without photos.
                    </p>
                  </div>

                  <div className="text-xs font-mono text-slate-400">
                    <span>Captured: </span>
                    <strong className="text-white">{imagesCount}</strong> of 4 views
                  </div>
                </div>

                {/* Informative Guidance */}
                <div className="bg-[#1C1630] border border-[#2D2448] rounded-xl p-3.5 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="leading-relaxed">
                    <strong className="text-violet-300">Recommended Capture:</strong> Front, Back, and Side panels provide standard statutory evidence.
                    If physical conditions prevent photography, you may proceed directly to manual verification.
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLoadSamplePreset('biscuits')}
                    className="text-xs text-violet-400 hover:text-violet-300 font-semibold underline whitespace-nowrap cursor-pointer"
                  >
                    Load Sample Biscuits
                  </button>
                </div>

                {/* Package Surface Carousel if photos exist */}
                {imagesCount > 0 && (
                  <div className="mb-2">
                    <PackageImageCarousel
                      images={inspection.images}
                      onCameraClick={(side: ImageSide) => setActiveCameraSide(side)}
                      onFileSelect={(side: ImageSide, dataUrl: string) => handleSetImage(side, dataUrl)}
                      onRemove={(side: ImageSide) => handleRemoveImage(side)}
                      onOpenLightbox={(side: ImageSide) => {
                        const src = inspection.images[side];
                        if (src) setPreviewImage({ src, title: `${side.toUpperCase()} Surface` });
                      }}
                      onTestImage={(side: ImageSide) => handleTestSlotImage(side)}
                      isTestingSide={step2TestingSide}
                    />
                  </div>
                )}

                {/* 4 Capture Slots */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CaptureSlot
                    side="front"
                    label="Front Surface (Principal Display)"
                    isRecommended={true}
                    imageSrc={inspection.images.front}
                    onCameraClick={() => setActiveCameraSide('front')}
                    onFileSelect={(dataUrl) => handleSetImage('front', dataUrl)}
                    onRemove={() => handleRemoveImage('front')}
                    onPreview={() => inspection.images.front && setPreviewImage({ src: inspection.images.front, title: 'Front Surface' })}
                    onTestImage={() => handleTestSlotImage('front')}
                    isTesting={step2TestingSide === 'front'}
                  />

                  <CaptureSlot
                    side="back"
                    label="Back Surface (Manufacturer & Care)"
                    isRecommended={true}
                    imageSrc={inspection.images.back}
                    onCameraClick={() => setActiveCameraSide('back')}
                    onFileSelect={(dataUrl) => handleSetImage('back', dataUrl)}
                    onRemove={() => handleRemoveImage('back')}
                    onPreview={() => inspection.images.back && setPreviewImage({ src: inspection.images.back, title: 'Back Surface' })}
                    onTestImage={() => handleTestSlotImage('back')}
                    isTesting={step2TestingSide === 'back'}
                  />

                  <CaptureSlot
                    side="side"
                    label="Side Surface (Dates & Batch Details)"
                    isRecommended={true}
                    imageSrc={inspection.images.side}
                    onCameraClick={() => setActiveCameraSide('side')}
                    onFileSelect={(dataUrl) => handleSetImage('side', dataUrl)}
                    onRemove={() => handleRemoveImage('side')}
                    onPreview={() => inspection.images.side && setPreviewImage({ src: inspection.images.side, title: 'Side Surface' })}
                    onTestImage={() => handleTestSlotImage('side')}
                    isTesting={step2TestingSide === 'side'}
                  />

                  <CaptureSlot
                    side="additional"
                    label="Additional Surface (Flap / Seal / Barcode)"
                    isRecommended={false}
                    imageSrc={inspection.images.additional}
                    onCameraClick={() => setActiveCameraSide('additional')}
                    onFileSelect={(dataUrl) => handleSetImage('additional', dataUrl)}
                    onRemove={() => handleRemoveImage('additional')}
                    onPreview={() => inspection.images.additional && setPreviewImage({ src: inspection.images.additional, title: 'Additional Surface' })}
                    onTestImage={() => handleTestSlotImage('additional')}
                    isTesting={step2TestingSide === 'additional'}
                  />
                </div>

                {/* Step 2 Actions Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#2D2448]">
                  <button
                    type="button"
                    onClick={() => handleStepChange(1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#2D2448] text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#1C1630] cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Details</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      id="btn-proceed-without-photos"
                      type="button"
                      onClick={handleSkipToManualVerify}
                      className="px-4 py-2.5 rounded-xl border border-[#2D2448] bg-[#1C1630] hover:bg-[#251D42] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                    >
                      Continue Without Photos
                    </button>

                    <button
                      id="btn-step2-scan-package"
                      type="button"
                      onClick={() => handleStepChange(3)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-950 cursor-pointer transition-colors"
                    >
                      <Scan className="w-4 h-4" />
                      <span>Inspect & Scan Package</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 4: VERIFY (AUDIT DECLARATIONS & RULES) ================= */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Declarations Table Card */}
                <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-6 shadow-xl space-y-4 text-slate-200">
                  <div className="border-b border-[#2D2448] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-violet-400">
                        STAGE 4 · VERIFY
                      </span>
                      <h2 className="text-lg font-bold text-white mt-0.5">Statutory Declarations Verification</h2>
                      <p className="text-xs text-slate-400">
                        Review, audit, accept, or edit extracted values with traceable inspector stamps.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        id="btn-re-scan-package"
                        type="button"
                        onClick={() => handleStepChange(3)}
                        className="px-3.5 py-1.5 rounded-xl border border-[#2D2448] bg-[#1C1630] hover:bg-[#251D42] text-slate-300 hover:text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors"
                      >
                        <Scan className="w-3.5 h-3.5 text-violet-400" />
                        <span>Open Scanner Console</span>
                      </button>
                    </div>
                  </div>

                  {/* Extraction Table */}
                  <ExtractionTable
                    fields={inspection.extractedFields}
                    onViewEvidence={(field) => setEvidenceField(field)}
                    onEditField={(field) => setDrawerField(field)}
                    onAcceptField={handleAcceptField}
                    onClearField={handleClearField}
                    onMarkNotVisible={handleMarkNotVisible}
                  />

                  {/* Audit notice */}
                  <div className="bg-[#1C1630] border border-[#2D2448] rounded-xl p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong className="text-white">Audit Trail Integrity:</strong> Modifying or accepting any declaration creates an officer-stamped revision in the permanent activity log.
                    </div>
                  </div>
                </div>

                {/* Deterministic Rule Findings Card */}
                <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-6 shadow-xl space-y-4 text-slate-200">
                  <div className="border-b border-[#2D2448] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-violet-300 uppercase">
                        Legal Metrology Rule Evaluation
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-0.5">
                      Packaged Commodities Statutory Rules (LM-001 through LM-005)
                    </h3>
                  </div>

                  <FindingTable
                    findings={inspection.findings}
                    onViewEvidence={(finding) => {
                      const ruleFieldKeyMap: Record<string, string> = {
                        'LM-001': 'mrp',
                        'LM-002': 'netQuantity',
                        'LM-003': 'manufacturer',
                        'LM-004': 'dateInformation',
                        'LM-005': 'consumerCare',
                        'rule-lm-001': 'mrp',
                        'rule-lm-002': 'netQuantity',
                        'rule-lm-003': 'manufacturer',
                        'rule-lm-004': 'dateInformation',
                        'rule-lm-005': 'consumerCare',
                      };

                      const targetKey = ruleFieldKeyMap[finding.ruleCode] || ruleFieldKeyMap[finding.ruleId];
                      let matchedField = targetKey ? inspection.extractedFields[targetKey] : null;

                      if (!matchedField) {
                        matchedField = Object.values(inspection.extractedFields).find(
                          (f) =>
                            f.extractedValue &&
                            finding.extractedValue &&
                            (f.extractedValue.includes(finding.extractedValue) ||
                              finding.extractedValue.includes(f.extractedValue))
                        ) || null;
                      }

                      if (matchedField) {
                        setEvidenceField(matchedField);
                      } else {
                        setEvidenceField({
                          key: finding.ruleCode,
                          label: finding.requirement,
                          extractedValue: finding.extractedValue || finding.observedEvidence,
                          verifiedValue: finding.inspectorValue || finding.extractedValue || finding.observedEvidence,
                          sourceImage: finding.evidenceImage === 'None' ? 'Not Visible' : finding.evidenceImage,
                          sourceImageId: finding.evidenceImage === 'Back' ? 'img_back_002' : finding.evidenceImage === 'Side' ? 'img_side_003' : 'img_front_001',
                          confidence: finding.confidence || 90,
                          isManuallyVerified: Boolean(finding.inspectorValue),
                          isNotVisible: finding.status.includes('NOT DETECTED'),
                        });
                      }
                    }}
                    onAnnotateFinding={(finding) => {
                      setAnnotatingFinding(finding);
                      setFindingNoteText(finding.notes || '');
                    }}
                  />
                </div>

                {/* Remarks & Field Observations with Quick-Insert Chips */}
                <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-6 shadow-xl space-y-3.5 text-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-[#2D2448]">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        Official Remarks & Field Observations
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Insert standard metrology violation chips or enter custom narrative notes.
                      </p>
                    </div>
                    <Tag className="w-4 h-4 text-violet-400" />
                  </div>

                  {/* Quick-Insert Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {REMARKS_QUICK_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleInsertRemarkChip(chip)}
                        className="px-3 py-1.5 rounded-lg bg-[#1C1630] hover:bg-[#251D42] border border-[#2D2448] text-[11px] font-medium text-slate-300 hover:text-violet-300 transition-colors"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>

                  <textarea
                    id="inspector-remarks-area"
                    rows={4}
                    value={inspection.remarks}
                    onChange={(e) => setInspection({ ...inspection, remarks: e.target.value })}
                    placeholder="Enter observations regarding package condition, pricing discrepancies, or retail premises..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2448] bg-[#0D0917] text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  />
                </div>

                {/* Inspector Signature Pad */}
                <SignaturePad
                  inspectorName={inspection.inspector.name}
                  inspectorId={inspection.inspector.id}
                  initialSignature={inspection.signature}
                  onSave={handleSaveSignature}
                />

                {/* Step 4 Actions Bar */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => handleStepChange(2)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#2D2448] text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#1C1630] cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Surfaces</span>
                  </button>

                  <button
                    id="btn-proceed-to-complete-review"
                    type="button"
                    onClick={() => handleStepChange(5)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-950 cursor-pointer transition-colors"
                  >
                    <span>Proceed to Audit Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Persistent Inspection Summary Panel (4 cols) */}
          <div className="lg:col-span-4 sticky top-16 space-y-4">
            <InspectionSummaryPanel
              inspection={inspection}
              lastSavedTime={lastSaved}
            />
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* Camera Capture Modal */}
      {activeCameraSide && (
        <CameraCaptureModal
          isOpen={true}
          sideName={activeCameraSide}
          title={`Capture ${activeCameraSide.toUpperCase()} Package Surface`}
          onClose={() => setActiveCameraSide(null)}
          onCapture={(dataUrl) => {
            handleSetImage(activeCameraSide, dataUrl);
            setActiveCameraSide(null);
          }}
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewImage(null)}
          title={previewImage.title}
          maxWidth="4xl"
        >
          <div className="bg-[#090610] rounded-xl flex items-center justify-center p-3 min-h-[400px] border border-[#2D2448]">
            <img
              src={previewImage.src}
              alt={previewImage.title}
              className="max-h-[500px] w-auto object-contain rounded-lg"
            />
          </div>
        </Modal>
      )}

      {/* Evidence Viewer Modal */}
      {evidenceField && (
        <EvidenceViewerModal
          isOpen={true}
          field={evidenceField}
          images={inspection.images}
          imageRecords={inspection.imageRecords}
          allOcrTokens={inspection.detectedTexts}
          onClose={() => setEvidenceField(null)}
          onEditField={(field) => {
            setEvidenceField(null);
            setEditingField(field);
          }}
        />
      )}

      {/* Manual Edit Declaration Modal */}
      {editingField && (
        <ManualEditModal
          isOpen={true}
          field={editingField}
          inspector={inspection.inspector}
          onClose={() => setEditingField(null)}
          onSaveField={(updated) => handleSaveVerifiedField(updated)}
        />
      )}

      {/* Manual Location Entry Modal */}
      {manualLocationModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setManualLocationModalOpen(false)}
          title="Manual Location Designation"
          subtitle="Enter facility or market name where package was inspected."
          maxWidth="md"
        >
          <form onSubmit={handleSaveManualLocation} className="space-y-4">
            <div>
              <label htmlFor="manual-place-input" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Location / Facility Name
              </label>
              <input
                id="manual-place-input"
                type="text"
                required
                value={manualPlaceInput}
                onChange={(e) => setManualPlaceInput(e.target.value)}
                placeholder="e.g. Gurugram Wholesale Market, Sector 18"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2448] bg-[#0D0917] text-white text-sm focus:outline-hidden focus:border-violet-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2D2448]">
              <button
                type="button"
                onClick={() => setManualLocationModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-[#2D2448] text-xs font-medium text-slate-300 hover:bg-[#1C1630]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
              >
                Save Location
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Finding Annotation Note Modal */}
      {annotatingFinding && (
        <Modal
          isOpen={true}
          onClose={() => setAnnotatingFinding(null)}
          title={`Inspector Observation Note: Rule ${annotatingFinding.ruleCode}`}
          subtitle={annotatingFinding.requirement}
          maxWidth="md"
        >
          <form onSubmit={handleSaveFindingNote} className="space-y-4">
            <div>
              <label htmlFor="finding-note-input" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Specific Finding Note / Discrepancy Observation
              </label>
              <textarea
                id="finding-note-input"
                rows={4}
                value={findingNoteText}
                onChange={(e) => setFindingNoteText(e.target.value)}
                placeholder="e.g. Retailer applied ₹55 sticker over original ₹50 printed MRP."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2D2448] bg-[#0D0917] text-white text-xs focus:outline-hidden focus:border-violet-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2D2448]">
              <button
                type="button"
                onClick={() => setAnnotatingFinding(null)}
                className="px-3.5 py-2 rounded-xl border border-[#2D2448] text-xs font-medium text-slate-300 hover:bg-[#1C1630]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
              >
                Save Observation
              </button>
            </div>
          </form>
        </Modal>
      )}
      {/* Raw AI Single-Image Debug Modal */}
      <RawAnalysisDebugModal
        isOpen={step2DebugModalOpen}
        onClose={() => setStep2DebugModalOpen(false)}
        debugInfo={step2DebugInfo}
        imageSrc={step2DebugImageSrc}
        onReAnalyze={() => {
          if (step2TestingSide) handleTestSlotImage(step2TestingSide);
        }}
        isLoading={step2TestingSide !== null}
      />

      {/* Field Detail Slide-Over Drawer */}
      <FieldDetailDrawer
        field={drawerField}
        images={inspection.images}
        imageRecords={inspection.imageRecords}
        onClose={() => setDrawerField(null)}
        onVerify={(fieldKey: string) => {
          handleAcceptField(fieldKey);
          setDrawerField(null);
        }}
        onEdit={(fieldToEdit: ExtractedField) => {
          setDrawerField(null);
          setEditingField(fieldToEdit);
        }}
        onMarkNotDetected={(fieldKey: string) => {
          handleMarkNotVisible(fieldKey);
          setDrawerField(null);
        }}
        onOpenFullEvidence={(fieldWithEvidence: ExtractedField) => {
          setDrawerField(null);
          setEvidenceField(fieldWithEvidence);
        }}
      />

      {/* Complete Inspection Confirmation Modal */}
      <ConfirmDialog
        id="confirm-complete-inspection-dialog"
        isOpen={completeConfirmOpen}
        title="Finalize & Complete Inspection"
        message={`Are you sure you want to finalize dossier ${inspection.id}? The statutory declarations, findings, geolocation, remarks, and digital signature will be officially archived.`}
        confirmLabel="Finalize & Complete"
        cancelLabel="Continue Editing"
        isDestructive={false}
        onConfirm={executeFinalizeInspection}
        onCancel={() => setCompleteConfirmOpen(false)}
      />
    </div>
  );
};
