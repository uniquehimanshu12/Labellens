import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ExtractedField, Inspector } from '../../types';
import { Check, Edit3, EyeOff, RotateCcw, ShieldAlert, History } from 'lucide-react';

interface ManualEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: ExtractedField | null;
  inspector: Inspector;
  onSaveField: (updatedField: ExtractedField) => void;
}

export const ManualEditModal: React.FC<ManualEditModalProps> = ({
  isOpen,
  onClose,
  field,
  inspector,
  onSaveField,
}) => {
  const [currentValue, setCurrentValue] = useState('');
  const [isNotVisible, setIsNotVisible] = useState(false);

  useEffect(() => {
    if (field) {
      setCurrentValue(field.verifiedValue || field.extractedValue || '');
      setIsNotVisible(Boolean(field.isNotVisible));
    }
  }, [field, isOpen]);

  if (!field) return null;

  const handleAccept = () => {
    const updated: ExtractedField = {
      ...field,
      verifiedValue: field.extractedValue,
      isManuallyVerified: true,
      confidenceState: 'VERIFIED BY INSPECTOR',
      isNotVisible: false,
      audit: {
        originalValue: field.extractedValue,
        verifiedValue: field.extractedValue,
        changedBy: inspector.id,
        timestamp: new Date().toISOString(),
      },
    };
    onSaveField(updated);
    onClose();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ExtractedField = {
      ...field,
      verifiedValue: isNotVisible ? '' : currentValue.trim(),
      isManuallyVerified: true,
      confidenceState: 'VERIFIED BY INSPECTOR',
      isNotVisible,
      audit: {
        originalValue: field.extractedValue,
        verifiedValue: isNotVisible ? 'Marked Not Visible' : currentValue.trim(),
        changedBy: inspector.id,
        timestamp: new Date().toISOString(),
      },
    };
    onSaveField(updated);
    onClose();
  };

  const handleMarkNotVisible = () => {
    setIsNotVisible(true);
    setCurrentValue('');
  };

  const handleClear = () => {
    setCurrentValue('');
    setIsNotVisible(false);
  };

  return (
    <Modal
      id="modal-manual-edit"
      isOpen={isOpen}
      onClose={onClose}
      title={`Inspector Verification: ${field.label}`}
      subtitle="Manual verification overrides OCR while maintaining full immutable audit trail."
      maxWidth="lg"
    >
      <form onSubmit={handleSaveEdit} className="space-y-4">
        {/* Audit Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-violet-950/40 border border-violet-700/40 text-xs text-violet-200">
          <History className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-white">Immutable Audit Notice:</span> Editing updates the <strong>Verified Value</strong>. The original machine extraction remains preserved in the inspection report.
          </div>
        </div>

        {/* Original Machine Extraction Box */}
        <div className="bg-[#151025] border border-[#2D2448] rounded-xl p-3.5 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="font-mono uppercase text-[10px] tracking-wider text-slate-400 font-semibold">
              Original Machine Extraction
            </span>
            <span className="font-mono text-[10px] text-violet-300">
              {field.confidenceLevel || 'EVIDENCE DETECTED'}
            </span>
          </div>
          <div className="font-mono text-slate-100 text-sm font-semibold bg-[#0D0917] p-2.5 rounded-lg border border-[#2D2448]">
            {field.extractedValue || <span className="text-slate-500 italic font-sans font-normal">— Not Detected in Images —</span>}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Source Surface: <strong className="text-slate-300 font-mono">{field.sourceImage}</strong></span>
            {field.locationDescription && <span className="font-mono text-slate-500">{field.locationDescription}</span>}
          </div>
        </div>

        {/* Verified Value Input */}
        <div>
          <label htmlFor="input-verified-val" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Verified Value by Field Inspector
          </label>
          <input
            id="input-verified-val"
            type="text"
            disabled={isNotVisible}
            value={currentValue}
            onChange={(e) => {
              setCurrentValue(e.target.value);
              setIsNotVisible(false);
            }}
            placeholder={isNotVisible ? 'Marked as Not Visible on Package' : `Enter verified ${field.label}...`}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-hidden focus:border-violet-500 transition-colors ${
              isNotVisible
                ? 'bg-[#151025] border-[#2D2448] text-slate-500 italic'
                : 'border-[#2D2448] bg-[#0D0917] text-slate-100'
            }`}
          />
        </div>

        {/* Action toggles */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <button
            id="btn-mark-not-visible"
            type="button"
            onClick={handleMarkNotVisible}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
              isNotVisible
                ? 'bg-amber-950/80 border-amber-600/80 text-amber-200 font-semibold'
                : 'bg-[#151025] border-[#2D2448] text-slate-300 hover:bg-[#201738]'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            <span>Mark Not Visible</span>
          </button>

          <button
            id="btn-clear-field"
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2D2448] bg-[#151025] hover:bg-[#201738] text-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear Value</span>
          </button>
        </div>

        {/* Verifying Officer Attribution */}
        <div className="rounded-xl border border-[#2D2448] bg-[#151025] p-3 text-[11px] text-slate-300 flex items-center justify-between">
          <span>
            Verifying Officer: <strong className="text-white">{inspector.name}</strong> <span className="text-slate-500 font-mono">({inspector.id})</span>
          </span>
          <span className="font-mono text-slate-400">{new Date().toLocaleTimeString()}</span>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#2D2448]">
          <button
            id="btn-accept-extracted"
            type="button"
            onClick={handleAccept}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-700/60 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept Original Extraction</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-cancel-edit"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#2D2448] text-xs font-medium text-slate-300 hover:bg-[#1C1630]"
            >
              Cancel
            </button>
            <button
              id="btn-save-verified-field"
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Save Verification</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
