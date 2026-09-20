import React, { useState, useEffect, useRef } from 'react';
import { PackageImages, ImageSide, ExtractedField, RawAnalysisDebugInfo, UploadedImageRecord } from '../types';
import { ocrService, ExtractionResult } from '../services/ocrService';
import { storageService } from '../services/storageService';
import { useToast } from '../components/common/Toast';
import { RawAnalysisDebugModal } from '../components/common/RawAnalysisDebugModal';
import { motion } from 'motion/react';
import {
  Scan,
  CheckCircle2,
  Circle,
  ArrowRight,
  Upload,
  ArrowLeft,
  RotateCw,
  Layers,
  AlertTriangle,
  HelpCircle,
  Crosshair,
  Eye,
  EyeOff,
  Cpu,
  RefreshCw,
  ShieldCheck,
  Tag,
  Terminal,
  Sparkles,
} from 'lucide-react';

interface DedicatedScannerProps {
  inspectionId: string;
  images: PackageImages;
  onScanComplete: (result: ExtractionResult) => void;
  onContinueManually: () => void;
  onBackToCapture: () => void;
  onUpdateImages: (updated: PackageImages) => void;
}

interface PipelineStage {
  num: string;
  label: string;
  status: 'waiting' | 'active' | 'done';
}

export const DedicatedScanner: React.FC<DedicatedScannerProps> = ({
  inspectionId,
  images,
  onScanComplete,
  onContinueManually,
  onBackToCapture,
  onUpdateImages,
}) => {
  const { toastError, toastReportReady } = useToast();
  const hasImages = Boolean(images.front || images.back || images.side || images.additional);

  const availableSides: { side: ImageSide; src: string | null; label: string }[] = [
    { side: 'front', src: images.front, label: 'Front Panel' },
    { side: 'back', src: images.back, label: 'Back Panel' },
    { side: 'side', src: images.side, label: 'Side / Lateral' },
    { side: 'additional', src: images.additional, label: 'Additional View' },
  ];

  const firstAvailable = availableSides.find((s) => s.src)?.side || 'front';
  const [activeSide, setActiveSide] = useState<ImageSide>(firstAvailable);
  const [isScanning, setIsScanning] = useState(hasImages);
  const [scanFinished, setScanFinished] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [showAllOcrTokens, setShowAllOcrTokens] = useState<boolean>(false);

  // Read configured OCR Mode (default 'ai' with fallback to 'demo')
  const [ocrMode, setOcrMode] = useState<'ai' | 'demo'>(() => {
    const saved = storageService.getSettings()?.ocrMode;
    return saved === 'demo' ? 'demo' : 'ai';
  });

  // Single-image debug modal states
  const [debugInfo, setDebugInfo] = useState<RawAnalysisDebugInfo | null>(null);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState<boolean>(false);
  const [isTestingSingleImage, setIsTestingSingleImage] = useState<boolean>(false);

  // 5 Statutory Pipeline Stages specified in prompt
  const [stages, setStages] = useState<PipelineStage[]>([
    { num: '01', label: 'Reading visible text', status: 'waiting' },
    { num: '02', label: 'Locating declarations', status: 'waiting' },
    { num: '03', label: 'Matching fields', status: 'waiting' },
    { num: '04', label: 'Preparing evidence', status: 'waiting' },
    { num: '05', label: 'Checking rules', status: 'waiting' },
  ]);

  const runPipeline = async (modeToUse: 'ai' | 'demo') => {
    if (!hasImages) {
      setIsScanning(false);
      return;
    }

    setIsScanning(true);
    setScanFinished(false);
    setSelectedFieldKey(null);

    // Reset stages (4 stages as per spec)
    setStages([
      { num: '01', label: 'Reading visible text', status: 'active' },
      { num: '02', label: 'Identifying declarations', status: 'waiting' },
      { num: '03', label: 'Linking evidence', status: 'waiting' },
      { num: '04', label: 'Preparing findings', status: 'waiting' },
    ]);

    await new Promise((r) => setTimeout(r, 600));

    // Stage 02: Identifying declarations
    setStages((prev) =>
      prev.map((s, i) => (i === 0 ? { ...s, status: 'done' } : i === 1 ? { ...s, status: 'active' } : s))
    );
    await new Promise((r) => setTimeout(r, 650));

    // Stage 03: Linking evidence
    setStages((prev) =>
      prev.map((s, i) => (i <= 1 ? { ...s, status: 'done' } : i === 2 ? { ...s, status: 'active' } : s))
    );
    await new Promise((r) => setTimeout(r, 700));

    // Call extraction service
    const result = await ocrService.extractDeclarations(images, modeToUse);

    // Stage 04: Preparing findings
    setStages((prev) =>
      prev.map((s, i) => (i <= 2 ? { ...s, status: 'done' } : i === 3 ? { ...s, status: 'active' } : s))
    );
    await new Promise((r) => setTimeout(r, 600));

    setStages((prev) => prev.map((s) => ({ ...s, status: 'done' })));
    setExtractionResult(result);
    setIsScanning(false);
    setScanFinished(true);
  };

  useEffect(() => {
    let isMounted = true;
    if (hasImages) {
      runPipeline(ocrMode);
    } else {
      setIsScanning(false);
    }
    return () => {
      isMounted = false;
    };
  }, [hasImages]);

  const handleFileUpload = (side: ImageSide, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updated = { ...images, [side]: dataUrl };
      onUpdateImages(updated);
      setActiveSide(side);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleEngine = (newMode: 'ai' | 'demo') => {
    setOcrMode(newMode);
    runPipeline(newMode);
  };

  const currentImageSrc = images[activeSide];

  // Test current image directly against /api/ocr/analyze-single-image
  const handleTestCurrentImage = async () => {
    if (!currentImageSrc) return;
    setIsTestingSingleImage(true);

    const imageRecord: UploadedImageRecord = {
      imageId: `img_${activeSide}_${Date.now()}`,
      side: activeSide,
      fileName: `${activeSide}_surface.jpg`,
      dataUrl: currentImageSrc,
      uploadedAt: new Date().toISOString(),
    };

    const res = await ocrService.analyzeSingleImage(inspectionId, imageRecord, ocrMode === 'demo');
    setIsTestingSingleImage(false);

    if (res.success && res.debugInfo) {
      setDebugInfo(res.debugInfo);
      setIsDebugModalOpen(true);
    } else {
      toastError('Image Analysis Error', res.error || 'Failed to inspect image');
    }
  };

  const summary = extractionResult?.scanSummary || {
    totalTextsFound: extractionResult?.detectedTexts?.length || 0,
    fieldsIdentified: Object.values(extractionResult?.fields || {}).filter((f) => f.status === 'DETECTED').length,
    manualVerificationNeeded: Object.values(extractionResult?.fields || {}).filter(
      (f) => f.status === 'NEEDS_MANUAL_VERIFICATION' || f.status === 'LOW_CONFIDENCE'
    ).length,
    notDetected: Object.values(extractionResult?.fields || {}).filter((f) => f.status === 'NOT_DETECTED').length,
  };

  // Find evidence regions STRICTLY belonging to the active surface
  // If evidence.sourceSide !== activeSide, DO NOT SHOW THE EVIDENCE ON THIS IMAGE
  const activeEvidenceBoxes = React.useMemo(() => {
    if (!extractionResult?.fields) return [];
    return Object.entries(extractionResult.fields).flatMap(([key, f]) => {
      // Filter evidence regions specifically to the active surface
      const matchingRegions = (f.evidence || []).filter((ev) => {
        const evSide = (ev.sourceSide || f.sourceImage || '').toLowerCase();
        return evSide === activeSide.toLowerCase();
      });

      return matchingRegions.map((ev, idx) => ({
        id: ev.id || `${key}_${idx}`,
        fieldKey: key,
        label: f.label,
        value: f.extractedValue,
        status: f.status,
        confidence: f.confidenceLevel,
        x: ev.x,
        y: ev.y,
        width: ev.width,
        height: ev.height,
        snippet: ev.snippet,
      }));
    });
  }, [extractionResult, activeSide]);

  // Detected raw OCR tokens for current surface
  const activeOcrTokens = React.useMemo(() => {
    if (!extractionResult?.detectedTexts) return [];
    return extractionResult.detectedTexts.filter(
      (dt) => (dt.sourceSide || 'front').toLowerCase() === activeSide.toLowerCase()
    );
  }, [extractionResult, activeSide]);

  return (
    <div id="dedicated-scanner-workspace" className="min-h-[85vh] -mx-4 -my-4 p-4 sm:p-6 bg-[#0D0917] text-slate-100 flex flex-col justify-between">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2D2448]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCapture}
            className="p-2 text-slate-400 hover:text-white bg-[#151025] hover:bg-[#1C1630] rounded-lg border border-[#2D2448] transition-colors"
            title="Return to image capture"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 bg-violet-950/80 text-violet-300 border border-violet-700/60 rounded">
                EVIDENCE SCANNER
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">{inspectionId}</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white mt-0.5">
              Statutory Surface Analysis Console
            </h1>
          </div>
        </div>

        {/* Engine Toggle & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher */}
          <div className="bg-[#151025] p-1 rounded-xl border border-[#2D2448] flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => handleToggleEngine('ai')}
              disabled={isScanning}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                ocrMode === 'ai'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C1630]'
              }`}
              title="Server-side Grounded OCR + Gemini Zero-Hallucination Pipeline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Grounded AI</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleEngine('demo')}
              disabled={isScanning}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                ocrMode === 'demo'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C1630]'
              }`}
              title="Local Statutory Rules Engine"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Deterministic</span>
            </button>
          </div>

          {/* Test Current Image (Raw AI Inspector) Button */}
          {currentImageSrc && (
            <button
              id="btn-test-current-image"
              type="button"
              onClick={handleTestCurrentImage}
              disabled={isTestingSingleImage}
              className="px-3 py-1.5 text-xs font-semibold text-violet-200 hover:text-white bg-violet-950/70 hover:bg-violet-900/80 border border-violet-700/60 rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-xs"
              title="Test current panel directly with Gemini AI and inspect raw pixel output"
            >
              {isTestingSingleImage ? (
                <RotateCw className="w-3.5 h-3.5 text-violet-400 animate-spin" />
              ) : (
                <Terminal className="w-3.5 h-3.5 text-violet-400" />
              )}
              <span>TEST CURRENT IMAGE</span>
            </button>
          )}

          {/* Re-Scan Button */}
          {hasImages && !isScanning && (
            <button
              type="button"
              onClick={() => runPipeline(ocrMode)}
              className="p-2 text-slate-300 hover:text-white bg-[#151025] hover:bg-[#1C1630] border border-[#2D2448] rounded-xl transition-colors"
              title="Re-run Surface Analysis"
            >
              <RefreshCw className="w-4 h-4 text-violet-400" />
            </button>
          )}

          {!hasImages ? (
            <button
              id="btn-continue-manually-header"
              type="button"
              onClick={onContinueManually}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#151025] hover:bg-[#1C1630] border border-[#2D2448] rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Skip Scanning & Enter Manually</span>
              <ArrowRight className="w-4 h-4 text-violet-400" />
            </button>
          ) : scanFinished && extractionResult ? (
            <button
              id="btn-proceed-to-verification"
              type="button"
              onClick={() => onScanComplete(extractionResult)}
              className="px-5 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-xl inline-flex items-center gap-2 shadow-lg shadow-violet-950 transition-colors"
            >
              <span>Review Evidence</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5 text-xs font-mono text-violet-300 bg-violet-950/70 border border-violet-700/60 px-3.5 py-1.5 rounded-lg">
              <RotateCw className="w-3.5 h-3.5 text-violet-400 animate-spin" />
              <span>ANALYZING PACKAGE...</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Inspection Viewport Area */}
      {!hasImages ? (
        /* Zero Images State */
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-violet-950/60 border border-violet-700/40 text-violet-400 mx-auto flex items-center justify-center mb-5">
              <Scan className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white">No Package Images Submitted</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Automated declaration extraction and evidence bounding boxes require at least one package panel photograph.
              You can upload photos now or proceed to manual declaration entry.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <label className="px-4 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-lg cursor-pointer inline-flex items-center gap-2 shadow-md transition-colors">
                <Upload className="w-4 h-4" />
                <span>Upload Panel Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload('front', e)}
                />
              </label>

              <button
                type="button"
                onClick={onContinueManually}
                className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#1C1630] hover:bg-[#251D42] border border-[#2D2448] rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <span>Continue to Manual Entry</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Has Images: Dual Column Layout */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 my-4">
          {/* Left Column: Surface Viewport & Bounding Box Reticle (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            {/* Panel Selector Tabs */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-2">
                {availableSides.map((item) => (
                  <button
                    key={item.side}
                    type="button"
                    onClick={() => {
                      setActiveSide(item.side);
                      setSelectedFieldKey(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border ${
                      activeSide === item.side
                        ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-950'
                        : item.src
                        ? 'bg-[#151025] text-slate-300 hover:text-white border-[#2D2448]'
                        : 'bg-[#120D20] text-slate-500 border-transparent hover:text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.src ? 'bg-emerald-400' : 'bg-slate-600'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* View Overlay Controls */}
              {scanFinished && (
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <button
                    type="button"
                    onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                    className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
                      showBoundingBoxes
                        ? 'bg-violet-950/80 border-violet-700/60 text-violet-300'
                        : 'bg-[#151025] border-[#2D2448] text-slate-400'
                    }`}
                    title="Toggle statutory field bounding boxes"
                  >
                    {showBoundingBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>Boxes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAllOcrTokens(!showAllOcrTokens)}
                    className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
                      showAllOcrTokens
                        ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
                        : 'bg-[#151025] border-[#2D2448] text-slate-400'
                    }`}
                    title="Toggle raw OCR word/line bounding boxes"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>OCR Tokens</span>
                  </button>
                </div>
              )}
            </div>

            {/* Viewport Frame with Scanner Reticle */}
            <div className="relative flex-1 bg-[#090610] rounded-2xl border border-[#2D2448] overflow-hidden min-h-[460px] flex items-center justify-center select-none shadow-2xl">
              {/* Subtle Corner Brackets [ ] */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-violet-500 pointer-events-none z-20" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-violet-500 pointer-events-none z-20" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-violet-500 pointer-events-none z-20" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-violet-500 pointer-events-none z-20" />

              {/* Status Pill Badge */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#151025]/90 backdrop-blur-md border border-violet-700/60 px-4 py-1 rounded-full text-[11px] font-mono tracking-widest text-violet-300 flex items-center gap-2 z-20 shadow-md">
                <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-violet-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span>{isScanning ? 'ANALYZING SURFACE' : `${activeEvidenceBoxes.length} DECLARATIONS MAPPED`}</span>
              </div>

              {/* Animated Scanner Line - Subtle Violet Motion */}
              {isScanning && (
                <motion.div
                  initial={{ top: '8%' }}
                  animate={{ top: ['8%', '92%', '8%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_12px_rgba(139,92,246,0.7)] z-20 pointer-events-none"
                />
              )}

              {/* Package Image Display with Scaled Bounding Box Overlay */}
              {currentImageSrc ? (
                <div className="relative inline-block max-h-[440px] max-w-full p-6">
                  <img
                    src={currentImageSrc}
                    alt={`${activeSide} panel`}
                    className="max-h-[380px] max-w-full object-contain rounded select-none pointer-events-none"
                  />

                  {/* Bounding Box Layers */}
                  {scanFinished && (
                    <div className="absolute inset-6 pointer-events-none overflow-hidden">
                      {/* 1. Raw OCR Tokens (if toggled) */}
                      {showAllOcrTokens &&
                        activeOcrTokens.map((tok, i) => (
                          <div
                            key={tok.id || i}
                            className="absolute border border-dashed border-emerald-500/50 bg-emerald-500/10 pointer-events-auto cursor-help group transition-all"
                            style={{
                              left: `${tok.x * 100}%`,
                              top: `${tok.y * 100}%`,
                              width: `${tok.width * 100}%`,
                              height: `${tok.height * 100}%`,
                            }}
                            title={`OCR Token: ${tok.text}`}
                          >
                            <div className="hidden group-hover:block absolute -top-5 left-0 z-30 px-1.5 py-0.5 bg-slate-900 border border-emerald-500/70 text-[9px] font-mono text-emerald-300 rounded whitespace-nowrap shadow-md">
                              {tok.text}
                            </div>
                          </div>
                        ))}

                      {/* 2. Matched Statutory Declarations Bounding Boxes */}
                      {showBoundingBoxes &&
                        activeEvidenceBoxes.map((box) => {
                          const isSelected = selectedFieldKey === box.fieldKey;
                          return (
                            <div
                              key={box.id}
                              onClick={() => setSelectedFieldKey(box.fieldKey)}
                              className={`absolute border-2 rounded transition-all cursor-pointer pointer-events-auto group ${
                                isSelected
                                  ? 'border-amber-400 bg-amber-400/25 shadow-[0_0_12px_rgba(251,191,36,0.8)] z-30'
                                  : box.status === 'DETECTED'
                                  ? 'border-emerald-500 bg-emerald-500/20 hover:bg-emerald-500/35 hover:border-emerald-400 z-10'
                                  : 'border-violet-500 bg-violet-500/20 hover:bg-violet-500/35 hover:border-violet-400 z-10'
                              }`}
                              style={{
                                left: `${box.x * 100}%`,
                                top: `${box.y * 100}%`,
                                width: `${box.width * 100}%`,
                                height: `${box.height * 100}%`,
                              }}
                            >
                              {/* Label pill on hover or selection */}
                              <div
                                className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-md flex items-center gap-1.5 z-40 transition-all ${
                                  isSelected
                                    ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-300'
                                    : 'bg-[#151025]/95 text-slate-200 border border-violet-600/70 group-hover:scale-105'
                                }`}
                              >
                                <span className="text-violet-300">{box.label}:</span>
                                <span className="font-semibold">{box.value || box.snippet || 'Detected'}</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 text-slate-500">
                  <Layers className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs font-mono">No image captured for {activeSide} panel</p>
                  <label className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1630] hover:bg-[#251D42] text-slate-200 text-xs rounded-lg font-medium cursor-pointer border border-[#2D2448]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload {activeSide} view</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(activeSide, e)}
                    />
                  </label>
                </div>
              )}

              {/* Bottom Telemetry Bar */}
              <div className="absolute bottom-3 inset-x-4 bg-[#151025]/90 backdrop-blur-md border border-[#2D2448] px-3.5 py-2 rounded-xl text-[11px] font-mono text-slate-300 flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">SURFACE:</span>
                    <span className="text-violet-300 font-semibold">{activeSide.toUpperCase()}</span>
                  </div>
                  {scanFinished && (
                    <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
                      <span>•</span>
                      <span>Boxes: {activeEvidenceBoxes.length}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">ENGINE:</span>
                  <span className={ocrMode === 'ai' ? 'text-violet-300 font-semibold' : 'text-emerald-400 font-semibold'}>
                    {ocrMode === 'ai' ? 'GEMINI-GROUNDED-OCR' : 'LM-LEGAL-METROLOGY'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Stages, Metrics & Detected Fields List (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* 5-Stage Pipeline Progress Card */}
            <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-4 sm:p-5 shadow-xl">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 pb-3 border-b border-[#2D2448]">
                <Scan className="w-4 h-4 text-violet-400" />
                Inspection Stages
              </h3>

              <div className="space-y-2 mt-3 text-xs">
                {stages.map((st) => (
                  <div
                    key={st.num}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                      st.status === 'active'
                        ? 'bg-violet-950/70 border-violet-600/70 text-violet-100 font-medium'
                        : st.status === 'done'
                        ? 'bg-[#1C1630] border-[#2D2448] text-slate-200'
                        : 'bg-[#120D20] border-transparent text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] font-bold text-slate-500">
                        {st.num}
                      </span>
                      <span>{st.label}</span>
                    </div>

                    <div>
                      {st.status === 'done' ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/60 font-bold text-xs">
                          ✓
                        </span>
                      ) : st.status === 'active' ? (
                        <RotateCw className="w-4 h-4 text-violet-400 animate-spin" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scan Results & Field Highlights */}
            {scanFinished && extractionResult ? (
              <div className="space-y-4 animate-in fade-in zoom-in-98 duration-200">
                {/* SCAN COMPLETE State Banner & Metrics */}
                <div className="bg-[#151025] border border-violet-600/60 rounded-2xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#2D2448]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <h3 className="text-sm font-mono font-bold tracking-wider text-white">
                        SCAN COMPLETE
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-700/60 font-semibold">
                      {ocrMode.toUpperCase()} AUDIT READY
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-[#1C1630] border border-[#2D2448] rounded-xl p-2.5 text-center">
                      <div className="text-lg font-bold font-mono text-emerald-400">
                        {summary.fieldsIdentified}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Fields detected</div>
                    </div>

                    <div className="bg-[#1C1630] border border-[#2D2448] rounded-xl p-2.5 text-center">
                      <div className="text-lg font-bold font-mono text-violet-300">
                        {Object.values(extractionResult.fields).reduce((acc, f) => acc + (f.evidence?.length || 0), 0)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Evidence linked</div>
                    </div>

                    <div className="bg-[#1C1630] border border-[#2D2448] rounded-xl p-2.5 text-center">
                      <div className="text-lg font-bold font-mono text-amber-400">
                        {summary.manualVerificationNeeded}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Needs verification</div>
                    </div>
                  </div>

                  {/* Primary and Secondary Action Buttons */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      id="btn-review-evidence-main"
                      type="button"
                      onClick={() => onScanComplete(extractionResult)}
                      className="w-full py-3 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-950/80 transition-colors cursor-pointer"
                    >
                      <span>Review Results</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      id="btn-scan-again"
                      type="button"
                      onClick={() => runPipeline(ocrMode)}
                      className="w-full py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#1C1630] hover:bg-[#251D42] border border-[#2D2448] rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Scan Again</span>
                    </button>
                  </div>
                </div>

                {/* Statutory Declarations List */}
                <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-4 shadow-xl max-h-[240px] overflow-y-auto">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between pb-2 border-b border-[#2D2448]">
                    <span>Detected Fields</span>
                    <span className="text-[10px] text-slate-500 font-normal">Click to locate</span>
                  </div>

                  <div className="divide-y divide-[#2D2448]/60 mt-1">
                    {Object.values(extractionResult.fields).map((field) => {
                      const isSelected = selectedFieldKey === field.key;
                      const hasBoxOnCurrentSide = (field.evidence || []).some(
                        (ev) => (ev.sourceSide || 'front').toLowerCase() === activeSide.toLowerCase()
                      );

                      return (
                        <div
                          key={field.key}
                          onClick={() => {
                            setSelectedFieldKey(field.key);
                            // Switch to field's source image side if on different side
                            if (field.sourceImage && field.sourceImage !== 'Not Visible') {
                              const side = field.sourceImage.toLowerCase() as ImageSide;
                              if (images[side]) setActiveSide(side);
                            }
                          }}
                          className={`py-2 px-2 rounded-lg cursor-pointer transition-all flex items-start justify-between gap-2 text-xs ${
                            isSelected
                              ? 'bg-violet-900/50 border border-violet-600/70'
                              : 'hover:bg-[#1C1630]'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-200 truncate">{field.label}</span>
                              {hasBoxOnCurrentSide && (
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" title="Visible on current surface" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                              {field.extractedValue ? (
                                <span className="text-slate-300">{field.extractedValue}</span>
                              ) : (
                                <span className="text-slate-500 italic">Not detected on package</span>
                              )}
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap ${
                              field.status === 'DETECTED'
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                                : field.status === 'NEEDS_MANUAL_VERIFICATION' || field.status === 'LOW_CONFIDENCE'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                                : 'bg-slate-900 text-slate-500 border border-slate-700/40'
                            }`}
                          >
                            {field.status === 'DETECTED' ? 'DETECTED' : field.status === 'NOT_DETECTED' ? 'NOT FOUND' : 'VERIFY'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-5 shadow-xl text-center text-slate-400 text-xs flex-1 flex flex-col items-center justify-center">
                <Crosshair className="w-8 h-8 text-violet-500 animate-pulse mb-3" />
                <p className="font-mono text-slate-300">Extracting statutory panels & correlating coordinates...</p>
                <p className="text-[11px] text-slate-500 mt-1">Zero-hallucination verification in progress</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Raw AI Vision & Coordinates Debug Modal */}
      <RawAnalysisDebugModal
        isOpen={isDebugModalOpen}
        onClose={() => setIsDebugModalOpen(false)}
        debugInfo={debugInfo}
        imageSrc={currentImageSrc}
        onReAnalyze={handleTestCurrentImage}
        isLoading={isTestingSingleImage}
      />
    </div>
  );
};
