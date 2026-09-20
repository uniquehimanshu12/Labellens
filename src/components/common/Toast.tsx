import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Save, ShieldCheck, FileCheck, MapPinOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'success' | 'warning' | 'error' | 'info' | 'saved' | 'verified' | 'report_ready' | 'location_unavailable';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  toastSuccess: (title: string, message?: string) => void;
  toastWarning: (title: string, message?: string) => void;
  toastError: (title: string, message?: string) => void;
  toastInfo: (title: string, message?: string) => void;
  toastSaved: (title?: string, message?: string) => void;
  toastVerified: (title?: string, message?: string) => void;
  toastReportReady: (title?: string, message?: string) => void;
  toastLocationUnavailable: (title?: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (type: ToastType, title: string, message?: string) => {
        console.log(`[Toast ${type}] ${title}: ${message || ''}`);
      },
      removeToast: () => {},
      toastSuccess: (title: string, message?: string) => console.log(`[Success] ${title}: ${message || ''}`),
      toastWarning: (title: string, message?: string) => console.log(`[Warning] ${title}: ${message || ''}`),
      toastError: (title: string, message?: string) => console.error(`[Error] ${title}: ${message || ''}`),
      toastInfo: (title: string, message?: string) => console.log(`[Info] ${title}: ${message || ''}`),
      toastSaved: (title = 'Inspection Saved', message?: string) => console.log(`[Saved] ${title}: ${message || ''}`),
      toastVerified: (title = 'Field Verified', message?: string) => console.log(`[Verified] ${title}: ${message || ''}`),
      toastReportReady: (title = 'Report Ready', message?: string) => console.log(`[Report Ready] ${title}: ${message || ''}`),
      toastLocationUnavailable: (title = 'Location Unavailable', message?: string) => console.log(`[Location Unavailable] ${title}: ${message || ''}`),
    };
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 3500) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastMessage = { id, type, title, message, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toastSuccess = useCallback((title: string, message?: string) => showToast('success', title, message), [showToast]);
  const toastWarning = useCallback((title: string, message?: string) => showToast('warning', title, message), [showToast]);
  const toastError = useCallback((title: string, message?: string) => showToast('error', title, message, 5000), [showToast]);
  const toastInfo = useCallback((title: string, message?: string) => showToast('info', title, message), [showToast]);
  const toastSaved = useCallback((title = 'Changes Saved', message = 'Inspection state preserved in workstation storage') => showToast('saved', title, message), [showToast]);
  const toastVerified = useCallback((title = 'Field Verified', message = 'Officer attestation logged to dossier') => showToast('verified', title, message), [showToast]);
  const toastReportReady = useCallback((title = 'Report Ready', message = 'Official metrology dossier compiled') => showToast('report_ready', title, message), [showToast]);
  const toastLocationUnavailable = useCallback((title = 'Location Unavailable', message = 'GPS coordinates could not be retrieved; using manual station location') => showToast('location_unavailable', title, message, 4500), [showToast]);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        removeToast,
        toastSuccess,
        toastWarning,
        toastError,
        toastInfo,
        toastSaved,
        toastVerified,
        toastReportReady,
        toastLocationUnavailable,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div
        id="toast-notifications-container"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const getToastConfig = () => {
              switch (toast.type) {
                case 'saved':
                  return {
                    style: 'bg-[#151025] border-violet-500/70 text-violet-200 shadow-violet-950/50',
                    Icon: Save,
                    iconClass: 'text-violet-400',
                  };
                case 'verified':
                  return {
                    style: 'bg-[#151025] border-emerald-500/70 text-emerald-200 shadow-emerald-950/50',
                    Icon: ShieldCheck,
                    iconClass: 'text-emerald-400',
                  };
                case 'report_ready':
                  return {
                    style: 'bg-[#151025] border-cyan-500/70 text-cyan-200 shadow-cyan-950/50',
                    Icon: FileCheck,
                    iconClass: 'text-cyan-400',
                  };
                case 'location_unavailable':
                  return {
                    style: 'bg-[#151025] border-amber-500/70 text-amber-200 shadow-amber-950/50',
                    Icon: MapPinOff,
                    iconClass: 'text-amber-400',
                  };
                case 'success':
                  return {
                    style: 'bg-[#151025] border-emerald-500/70 text-emerald-200 shadow-emerald-950/50',
                    Icon: CheckCircle2,
                    iconClass: 'text-emerald-400',
                  };
                case 'warning':
                  return {
                    style: 'bg-[#151025] border-amber-500/70 text-amber-200 shadow-amber-950/50',
                    Icon: AlertTriangle,
                    iconClass: 'text-amber-400',
                  };
                case 'error':
                  return {
                    style: 'bg-[#151025] border-rose-500/70 text-rose-200 shadow-rose-950/50',
                    Icon: AlertCircle,
                    iconClass: 'text-rose-400',
                  };
                case 'info':
                default:
                  return {
                    style: 'bg-[#151025] border-violet-500/70 text-violet-200 shadow-violet-950/50',
                    Icon: Info,
                    iconClass: 'text-violet-400',
                  };
              }
            };

            const { style, Icon, iconClass } = getToastConfig();

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md ${style}`}
              >
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconClass}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white leading-tight">{toast.title}</div>
                  {toast.message && (
                    <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toast.message}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
