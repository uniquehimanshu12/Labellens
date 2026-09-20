import React, { useState } from 'react';
import { ExtractedField, ConfidenceState } from '../../types';
import { Eye, Edit3, CheckCircle2, Check, X, EyeOff, Crosshair, ChevronRight, Layers } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface ExtractionTableProps {
  fields: Record<string, ExtractedField>;
  onViewEvidence: (field: ExtractedField) => void;
  onEditField: (field: ExtractedField) => void;
  onAcceptField?: (fieldKey: string) => void;
  onClearField?: (fieldKey: string) => void;
  onMarkNotVisible?: (fieldKey: string) => void;
  onOpenDetailDrawer?: (field: ExtractedField) => void;
}

const CATEGORY_ORDER = [
  'PRODUCT',
  'PRICING',
  'QUANTITY',
  'MANUFACTURER',
  'DATES',
  'CONTACT',
  'ADDITIONAL INFORMATION',
];

const getCategoryForField = (key: string, label: string): string => {
  const text = `${key} ${label}`.toLowerCase();
  if (text.includes('product') || text.includes('brand') || text.includes('commodity') || text.includes('common or generic')) return 'PRODUCT';
  if (text.includes('mrp') || text.includes('price') || text.includes('retail') || text.includes('tax')) return 'PRICING';
  if (text.includes('qty') || text.includes('quantity') || text.includes('weight') || text.includes('volume') || text.includes('net')) return 'QUANTITY';
  if (text.includes('manufacturer') || text.includes('packer') || text.includes('importer') || text.includes('address')) return 'MANUFACTURER';
  if (text.includes('date') || text.includes('expiry') || text.includes('mfg') || text.includes('best before') || text.includes('month and year')) return 'DATES';
  if (text.includes('care') || text.includes('contact') || text.includes('phone') || text.includes('email') || text.includes('consumer')) return 'CONTACT';
  return 'ADDITIONAL INFORMATION';
};

export const ExtractionTable: React.FC<ExtractionTableProps> = ({
  fields,
  onViewEvidence,
  onEditField,
  onAcceptField,
  onClearField,
  onMarkNotVisible,
  onOpenDetailDrawer,
}) => {
  const fieldList = Object.values(fields);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  if (fieldList.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-[#2D234C] rounded-2xl text-slate-400 text-xs bg-[#140F24]">
        No declarations registered yet. Capture package panels or enter declarations manually.
      </div>
    );
  }

  // Group fields by category
  const groupedFields: Record<string, ExtractedField[]> = {};
  fieldList.forEach((field) => {
    const cat = getCategoryForField(field.key, field.label);
    if (!groupedFields[cat]) groupedFields[cat] = [];
    groupedFields[cat].push(field);
  });

  const categoriesToRender = CATEGORY_ORDER.filter(
    (cat) => groupedFields[cat] && groupedFields[cat].length > 0
  );

  return (
    <div id="extraction-table-wrapper" className="space-y-4">
      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveCategoryFilter('ALL')}
          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
            activeCategoryFilter === 'ALL'
              ? 'bg-violet-600 text-white shadow-md'
              : 'bg-[#1C1630] border border-[#2D234C] text-slate-400 hover:text-white'
          }`}
        >
          ALL ({fieldList.length})
        </button>
        {categoriesToRender.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategoryFilter(cat)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
              activeCategoryFilter === cat
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-[#1C1630] border border-[#2D234C] text-slate-400 hover:text-white'
            }`}
          >
            {cat} ({groupedFields[cat]?.length || 0})
          </button>
        ))}
      </div>

      {/* Main Table Content */}
      <div className="overflow-x-auto rounded-2xl border border-[#2D234C] bg-[#140F24] shadow-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#1C1630] border-b border-[#2D234C] text-slate-300 uppercase tracking-wider font-semibold text-[11px]">
              <th className="py-3 px-4">Statutory Field</th>
              <th className="py-3 px-4">Extracted / Verified Value</th>
              <th className="py-3 px-4">Source & Evidence</th>
              <th className="py-3 px-4 text-center">Status / Confidence</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2D234C]/80 text-slate-200">
            {categoriesToRender
              .filter((cat) => activeCategoryFilter === 'ALL' || activeCategoryFilter === cat)
              .map((cat) => {
                const catFields = groupedFields[cat];

                return (
                  <React.Fragment key={cat}>
                    {/* Category Divider Header */}
                    {activeCategoryFilter === 'ALL' && (
                      <tr className="bg-[#1C1630]/60 border-y border-[#2D234C]/90">
                        <td colSpan={5} className="py-2 px-4">
                          <span className="text-[10px] font-mono font-bold text-violet-300 uppercase tracking-widest">
                            {cat}
                          </span>
                        </td>
                      </tr>
                    )}

                    {catFields.map((field) => {
                      const hasDiscrepancy =
                        field.isManuallyVerified && field.verifiedValue !== field.extractedValue;
                      const notVisible = field.isNotVisible;

                      const effectiveConfidenceState: ConfidenceState = field.isManuallyVerified
                        ? 'VERIFIED BY INSPECTOR'
                        : field.isNotVisible
                        ? 'NOT DETECTED'
                        : field.confidenceState ||
                          ((field.confidence ?? 85) >= 90
                            ? 'HIGH CONFIDENCE'
                            : (field.confidence ?? 85) >= 75
                            ? 'MEDIUM CONFIDENCE'
                            : 'LOW CONFIDENCE');

                      const hasEvidence =
                        Boolean(field.evidence && field.evidence.length > 0) ||
                        Boolean(field.sourceImage && field.sourceImage !== 'Not Visible');

                      return (
                        <tr
                          key={field.key}
                          id={`row-field-${field.key}`}
                          onClick={() => onOpenDetailDrawer && onOpenDetailDrawer(field)}
                          className={`transition-colors cursor-pointer group ${
                            field.isManuallyVerified
                              ? 'bg-violet-950/20 hover:bg-violet-950/30'
                              : 'hover:bg-[#1C1630]/60'
                          }`}
                        >
                          {/* Field Name */}
                          <td className="py-3 px-4 font-medium text-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="group-hover:text-violet-300 transition-colors font-semibold">
                                {field.label}
                              </span>
                              {field.isManuallyVerified && (
                                <span title="Verified by field inspector" className="text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Extracted / Verified Value */}
                          <td className="py-3 px-4">
                            {notVisible ? (
                              <span className="inline-flex items-center gap-1 text-slate-500 italic text-[11px] bg-[#1C1630] px-2 py-0.5 rounded border border-[#2D234C]">
                                <EyeOff className="w-3 h-3 text-slate-500" />
                                <span>Not Visible</span>
                              </span>
                            ) : hasDiscrepancy ? (
                              <div>
                                <div className="font-mono font-bold text-violet-200 bg-violet-950/80 px-2 py-0.5 rounded border border-violet-700/60 inline-block text-xs">
                                  {field.verifiedValue}
                                </div>
                                <div className="text-[10px] text-slate-400 line-through font-mono mt-0.5">
                                  OCR: {field.extractedValue || '—'}
                                </div>
                              </div>
                            ) : (
                              <div
                                className="font-mono text-slate-100 font-semibold max-w-xs truncate"
                                title={field.verifiedValue || field.extractedValue}
                              >
                                {field.verifiedValue || field.extractedValue ? (
                                  field.verifiedValue || field.extractedValue
                                ) : (
                                  <span className="text-slate-500 italic font-sans">— Not Detected —</span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Source & Evidence Button */}
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              {hasEvidence ? (
                                <button
                                  id={`btn-view-evidence-${field.key}`}
                                  type="button"
                                  onClick={() => onViewEvidence(field)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-950/80 hover:bg-violet-900 border border-violet-700/60 text-violet-200 text-xs font-medium cursor-pointer transition-colors shadow-xs group/btn"
                                  title="Open evidence bounding box"
                                >
                                  <Crosshair className="w-3.5 h-3.5 text-violet-400 group-hover/btn:scale-110 transition-transform" />
                                  <span>View Evidence</span>
                                  <span className="text-[10px] font-mono text-violet-400 font-bold ml-0.5">
                                    ({field.sourceImage})
                                  </span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-500 font-mono italic">
                                  No image submitted
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status / Confidence */}
                          <td className="py-3 px-4 text-center">
                            <StatusBadge confidenceState={effectiveConfidenceState} size="sm" />
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1.5">
                              {/* Verify / Accept Button */}
                              {onAcceptField && !field.isManuallyVerified && (
                                <button
                                  id={`btn-accept-${field.key}`}
                                  type="button"
                                  onClick={() => onAcceptField(field.key)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 rounded-lg border border-emerald-700/60 transition-colors cursor-pointer"
                                  title="Mark as verified by inspector"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Verify</span>
                                </button>
                              )}

                              {/* Edit Button */}
                              <button
                                id={`btn-edit-field-${field.key}`}
                                type="button"
                                onClick={() => onEditField(field)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#2D234C] bg-[#1C1630] hover:bg-[#251D42] text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                                title="Edit declaration value"
                              >
                                <Edit3 className="w-3 h-3 text-slate-400" />
                                <span>Edit</span>
                              </button>

                              {/* Drawer trigger indicator */}
                              <button
                                type="button"
                                onClick={() => onOpenDetailDrawer && onOpenDetailDrawer(field)}
                                className="p-1 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-[#1C1630] transition-colors"
                                title="Open drawer detail"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
