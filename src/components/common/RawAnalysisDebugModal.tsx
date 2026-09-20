import React, { useState } from 'react';
import { RawAnalysisDebugInfo, ExtractedField } from '../../types';
import { Modal } from './Modal';
import {
  Code,
  Crosshair,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  Info,
} from 'lucide-react';

interface RawAnalysisDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  debugInfo: RawAnalysisDebugInfo | null;
  imageSrc?: string | null;
  onReAnalyze?: () => void;
  isLoading?: boolean;
}

export const RawAnalysisDebugModal: React.FC<RawAnalysisDebugModalProps> = ({
  isOpen,
  onClose,
  debugInfo,
  imageSrc,
  onReAnalyze,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'parsed' | 'raw' | 'boxes'>('parsed');
  const [copied, setCopied] = useState(false);
  const [hoveredBoxIndex, setHoveredBoxIndex] = useState<number | null>(null);

  if (!debugInfo) return null;

  const handleCopyRaw = () => {
    if (!debugInfo.rawResponse) return;
    navigator.clipboard.writeText(debugInfo.rawResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const evidenceItems = debugInfo.evidenceItems || [];
  const parsedDeclarations = debugInfo.parsedResult?.declarations || debugInfo.parsedResult || {};

  const getBoxCoords = (item: any) => {
    if (item.pixelBox && typeof item.pixelBox.x === 'number') {
      return item.pixelBox;
    }
    if (Array.isArray(item.boundingBox) && item.boundingBox.length === 4) {
      const [ymin, xmin, ymax, xmax] = item.boundingBox;
      const norm = (v: number) => (v > 1 ? v / 1000 : v);
      const top = norm(ymin);
      const left = norm(xmin);
      const height = Math.max(0.01, norm(ymax) - top);
      const width = Math.max(0.01, norm(xmax) - left);
      return { x: left, y: top, width, height };
    }
    return { x: 0, y: 0, width: 0, height: 0 };
  };

  return (
    <Modal
      id="modal-raw-analysis-debug"
      isOpen={isOpen}
      onClose={onClose}
      title="Raw AI Vision Analysis & Evidence Inspector"
      subtitle={`Grounded pixel attribution for Image: ${debugInfo.imageId || debugInfo.fileName || 'Active Panel'}`}
      maxWidth="4xl"
    >
      <div className="space-y-4 text-slate-200">
        {/* Top Telemetry Header */}
        <div className="bg-[#1C1630] border border-[#2D2448] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-400">ENGINE:</span>
              <span className="px-2 py-0.5 rounded bg-violet-950/80 border border-violet-700/60 text-violet-300 font-bold">
                {debugInfo.extractionMode || 'LIVE AI VISION'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-400">MODEL:</span>
              <span className="text-emerald-400 font-semibold">{debugInfo.modelUsed || 'gemini-3.1-flash-lite'}</span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-slate-400">
              <span>IMAGE ID:</span>
              <span className="text-slate-200">{debugInfo.imageId || 'img_active'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onReAnalyze && (
              <button
                type="button"
                onClick={onReAnalyze}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Analyzing...' : 'Re-Test Image'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[#2D2448] pb-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('parsed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'parsed'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C1630]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Parsed Declarations ({Object.keys(parsedDeclarations).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('boxes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'boxes'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C1630]'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Bounding Reticle ({evidenceItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'raw'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1C1630]'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Raw AI Output</span>
            </button>
          </div>

          {activeTab === 'raw' && (
            <button
              type="button"
              onClick={handleCopyRaw}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-[#1C1630] border border-[#2D2448] rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          )}
        </div>

        {/* Tab 1: Parsed Declarations Table */}
        {activeTab === 'parsed' && (
          <div className="space-y-3">
            <div className="bg-[#120D20] p-2.5 rounded-xl border border-[#2D2448] text-xs text-slate-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <span>
                These statutory fields were parsed directly from pixels in this single image. If a field is not visibly printed in this picture, it will show as <strong>NOT VISIBLE</strong> with zero hallucinated placeholder data.
              </span>
            </div>

            <div className="bg-[#151025] border border-[#2D2448] rounded-xl overflow-hidden shadow-inner max-h-[440px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#1C1630] text-[11px] font-mono text-slate-400 uppercase tracking-wider sticky top-0 border-b border-[#2D2448] z-10">
                  <tr>
                    <th className="py-2.5 px-3">Statutory Field</th>
                    <th className="py-2.5 px-3">Extracted Value</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Coordinates</th>
                    <th className="py-2.5 px-3">Snippet Text</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2448]/60 font-mono">
                  {Object.entries(parsedDeclarations).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                        No declarations extracted for this image.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(parsedDeclarations).map(([key, rawVal]: [string, any]) => {
                      const isObj = rawVal && typeof rawVal === 'object';
                      const val = isObj ? rawVal.value || rawVal.text || '' : String(rawVal || '');
                      const status = isObj ? rawVal.status : val ? 'DETECTED' : 'NOT_DETECTED';
                      const box = isObj ? rawVal.box_2d || rawVal.boundingBox : null;
                      const snippet = isObj ? rawVal.snippet || '' : '';

                      return (
                        <tr key={key} className="hover:bg-[#1C1630]/60 transition-colors">
                          <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-violet-300">
                            {val ? (
                              <span>{val}</span>
                            ) : (
                              <span className="text-slate-500 font-normal italic">Not visible</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                status === 'DETECTED' || (val && status !== 'NOT_DETECTED')
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                                  : 'bg-slate-900 text-slate-500 border border-slate-800'
                              }`}
                            >
                              {val ? 'DETECTED' : 'NOT DETECTED'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[10px] text-slate-400">
                            {box ? (
                              <span>
                                [{Array.isArray(box) ? box.join(', ') : `${box.ymin || box.y}, ${box.xmin || box.x}`}]
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-400 max-w-xs truncate font-sans">
                            {snippet || val || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Visual Bounding Reticle Preview */}
        {activeTab === 'boxes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Image Canvas with Box Overlays */}
            <div className="lg:col-span-7 bg-[#090610] rounded-xl border border-[#2D2448] p-4 flex items-center justify-center min-h-[380px] relative overflow-hidden">
              {imageSrc ? (
                <div className="relative inline-block max-w-full max-h-[380px]">
                  <img
                    src={imageSrc}
                    alt="Analyzed panel"
                    className="max-h-[360px] w-auto object-contain rounded shadow-2xl pointer-events-none"
                  />

                  {/* Render Bounding Boxes */}
                  <div className="absolute inset-0 pointer-events-none">
                    {evidenceItems.map((item, idx) => {
                      const isHovered = hoveredBoxIndex === idx;
                      const coords = getBoxCoords(item);
                      return (
                        <div
                          key={`box_${idx}`}
                          onMouseEnter={() => setHoveredBoxIndex(idx)}
                          onMouseLeave={() => setHoveredBoxIndex(null)}
                          className={`absolute border-2 transition-all pointer-events-auto cursor-pointer ${
                            isHovered
                              ? 'border-amber-400 bg-amber-400/25 shadow-[0_0_15px_rgba(251,191,36,0.9)] z-30'
                              : 'border-violet-500 bg-violet-500/20 hover:border-violet-400 z-10'
                          }`}
                          style={{
                            left: `${coords.x * 100}%`,
                            top: `${coords.y * 100}%`,
                            width: `${coords.width * 100}%`,
                            height: `${coords.height * 100}%`,
                          }}
                        >
                          <div
                            className={`absolute -top-5 left-0 px-1.5 py-0.2 rounded text-[9px] font-mono whitespace-nowrap shadow-md z-40 ${
                              isHovered
                                ? 'bg-amber-500 text-black font-bold'
                                : 'bg-slate-900/95 text-violet-300 border border-violet-500/60'
                            }`}
                          >
                            {item.field}: {item.value || 'Located'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 p-8 text-xs font-mono">
                  Image pixel data not available for rendering bounding reticle.
                </div>
              )}
            </div>

            {/* Side List of Bounding Coordinates */}
            <div className="lg:col-span-5 space-y-2 max-h-[380px] overflow-y-auto">
              <div className="text-[11px] font-mono text-slate-400 uppercase font-bold px-1">
                Detected Evidence Regions ({evidenceItems.length})
              </div>

              {evidenceItems.length === 0 ? (
                <div className="p-4 bg-[#151025] rounded-xl border border-[#2D2448] text-xs text-slate-500 italic text-center">
                  No bounding boxes were mapped on this surface.
                </div>
              ) : (
                evidenceItems.map((item, idx) => {
                  const isHovered = hoveredBoxIndex === idx;
                  const coords = getBoxCoords(item);
                  return (
                    <div
                      key={`region_${idx}`}
                      onMouseEnter={() => setHoveredBoxIndex(idx)}
                      onMouseLeave={() => setHoveredBoxIndex(null)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isHovered
                          ? 'border-amber-400 bg-amber-950/40 text-amber-200'
                          : 'border-[#2D2448] bg-[#151025] hover:bg-[#1C1630]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{item.field}</span>
                        <span className="text-[10px] font-mono text-violet-400">
                          {Math.round(coords.x * 100)}%, {Math.round(coords.y * 100)}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono mt-1 truncate">
                        "{item.value || 'Snippet'}"
                      </div>
                      <div className="text-[9px] font-mono text-slate-500 mt-1">
                        W:{Math.round(coords.width * 100)}% • H:{Math.round(coords.height * 100)}% • Image:{item.imageId || 'Current'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Raw AI Response Block */}
        {activeTab === 'raw' && (
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Unfiltered Gemini Multimodal Output</span>
              <span>Length: {debugInfo.rawResponse?.length || 0} chars</span>
            </div>

            <pre className="p-4 rounded-xl bg-[#090610] border border-[#2D2448] text-violet-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[420px] overflow-y-auto whitespace-pre-wrap select-text">
              {debugInfo.rawResponse || 'No raw output available.'}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};
