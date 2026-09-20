import React from 'react';
import { InspectionStatus, OverallInspectionStatus, ConfidenceState, ImageQualityState } from '../../types';
import { CheckCircle2, AlertTriangle, HelpCircle, Clock, ShieldCheck, UserCheck, Image as ImageIcon, Eye } from 'lucide-react';

interface StatusBadgeProps {
  status?: InspectionStatus | OverallInspectionStatus | ConfidenceState | ImageQualityState | string;
  confidenceState?: ConfidenceState;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  confidenceState,
  size = 'md',
  showIcon = true,
}) => {
  const normalized = (confidenceState || status || '').toUpperCase().trim();

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium font-mono',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold tracking-wide font-mono',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold font-mono',
  }[size];

  // 1. Confidence States
  if (normalized === 'VERIFIED BY INSPECTOR') {
    return (
      <span
        id="badge-confidence-verified"
        className={`inline-flex items-center rounded border border-violet-600/60 bg-violet-950/70 text-violet-200 ${sizeClasses}`}
      >
        {showIcon && <UserCheck className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
        <span>VERIFIED BY INSPECTOR</span>
      </span>
    );
  }

  if (normalized === 'HIGH CONFIDENCE' || normalized === 'HIGH') {
    return (
      <span
        id="badge-confidence-high"
        className={`inline-flex items-center rounded border border-emerald-600/60 bg-emerald-950/70 text-emerald-200 ${sizeClasses}`}
      >
        {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
        <span>HIGH CONFIDENCE</span>
      </span>
    );
  }

  if (normalized === 'MEDIUM CONFIDENCE' || normalized === 'MEDIUM') {
    return (
      <span
        id="badge-confidence-med"
        className={`inline-flex items-center rounded border border-sky-600/60 bg-sky-950/70 text-sky-200 ${sizeClasses}`}
      >
        {showIcon && <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
        <span>MEDIUM CONFIDENCE</span>
      </span>
    );
  }

  if (normalized === 'LOW CONFIDENCE' || normalized === 'LOW') {
    return (
      <span
        id="badge-confidence-low"
        className={`inline-flex items-center rounded border border-amber-600/60 bg-amber-950/70 text-amber-200 ${sizeClasses}`}
      >
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
        <span>LOW CONFIDENCE</span>
      </span>
    );
  }

  // 2. Rule Finding & Field States
  if (normalized === 'DETECTED') {
    return (
      <span
        id="badge-status-detected"
        className={`inline-flex items-center rounded border border-emerald-600/60 bg-emerald-950/70 text-emerald-200 ${sizeClasses}`}
      >
        {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
        <span>DETECTED</span>
      </span>
    );
  }

  if (normalized === 'NOT DETECTED IN SUBMITTED IMAGES' || normalized === 'NOT DETECTED' || normalized === 'NOT_DETECTED') {
    return (
      <span
        id="badge-status-not-detected"
        className={`inline-flex items-center rounded border border-[#2D2448] bg-[#151025] text-slate-400 ${sizeClasses}`}
      >
        {showIcon && <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
        <span>NOT DETECTED</span>
      </span>
    );
  }

  if (
    normalized === 'POTENTIAL ISSUE — MANUAL VERIFICATION' ||
    normalized === 'REQUIRES MANUAL VERIFICATION' ||
    normalized === 'NEEDS_MANUAL_VERIFICATION'
  ) {
    return (
      <span
        id="badge-status-requires-verification"
        className={`inline-flex items-center rounded border border-rose-600/60 bg-rose-950/70 text-rose-200 ${sizeClasses}`}
      >
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
        <span>MANUAL VERIFICATION</span>
      </span>
    );
  }

  // 3. Overall Inspection Lifecycle States
  if (normalized === 'COMPLETED') {
    return (
      <span
        id="badge-status-completed"
        className={`inline-flex items-center rounded border border-emerald-600/60 bg-emerald-950/70 text-emerald-200 ${sizeClasses}`}
      >
        {showIcon && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
        <span>COMPLETED</span>
      </span>
    );
  }

  if (normalized === 'READY FOR REVIEW' || normalized === 'PENDING REVIEW') {
    return (
      <span
        id="badge-status-ready-for-review"
        className={`inline-flex items-center rounded border border-amber-600/60 bg-amber-950/70 text-amber-200 ${sizeClasses}`}
      >
        {showIcon && <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
        <span>READY FOR REVIEW</span>
      </span>
    );
  }

  if (normalized === 'IN PROGRESS') {
    return (
      <span
        id="badge-status-in-progress"
        className={`inline-flex items-center rounded border border-violet-600/60 bg-violet-950/70 text-violet-200 ${sizeClasses}`}
      >
        {showIcon && <Clock className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
        <span>IN PROGRESS</span>
      </span>
    );
  }

  if (normalized === 'DRAFT') {
    return (
      <span
        id="badge-status-draft"
        className={`inline-flex items-center rounded border border-[#2D2448] bg-[#151025] text-slate-400 ${sizeClasses}`}
      >
        {showIcon && <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
        <span>DRAFT</span>
      </span>
    );
  }

  // 4. Image Quality States
  if (normalized.includes('GOOD IMAGE QUALITY') || normalized === 'READABLE') {
    return (
      <span
        id="badge-quality-good"
        className={`inline-flex items-center rounded border border-teal-600/60 bg-teal-950/70 text-teal-200 ${sizeClasses}`}
      >
        {showIcon && <ImageIcon className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
        <span>{status}</span>
      </span>
    );
  }

  if (
    normalized.includes('LOW LIGHTING') ||
    normalized.includes('BLUR') ||
    normalized.includes('TOO SMALL') ||
    normalized.includes('PARTIALLY HIDDEN')
  ) {
    return (
      <span
        id="badge-quality-warning"
        className={`inline-flex items-center rounded border border-amber-600/60 bg-amber-950/70 text-amber-200 ${sizeClasses}`}
      >
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
        <span>{status}</span>
      </span>
    );
  }

  return (
    <span
      id="badge-status-default"
      className={`inline-flex items-center rounded border border-[#2D2448] bg-[#151025] text-slate-300 ${sizeClasses}`}
    >
      {showIcon && <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
      <span>{status}</span>
    </span>
  );
};
