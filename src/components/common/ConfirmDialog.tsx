import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  id?: string;
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  id = 'confirm-dialog',
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal id={id} isOpen={isOpen} onClose={onCancel} title={title} maxWidth="md">
      <div className="flex items-start gap-3 py-2 text-slate-200">
        <div className={`p-2.5 rounded-xl shrink-0 ${isDestructive ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60' : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="text-sm text-slate-300 leading-relaxed">{message}</div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#2D2448]">
        <button
          id="btn-dialog-cancel"
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-[#2D2448] bg-[#1C1630] hover:bg-[#251D42] text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          {cancelLabel}
        </button>
        <button
          id="btn-dialog-confirm"
          type="button"
          onClick={() => {
            onConfirm();
            onCancel();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer shadow-lg ${
            isDestructive
              ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950'
              : 'bg-violet-600 hover:bg-violet-500 shadow-violet-950'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
