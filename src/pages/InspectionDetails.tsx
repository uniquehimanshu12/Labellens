import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { InspectionRecord } from '../types';
import { InspectionReportView } from '../components/inspection/InspectionReportView';
import { ArrowLeft } from 'lucide-react';

interface InspectionDetailsProps {
  inspectionId: string;
  onNavigate: (route: string, params?: { inspectionId?: string }) => void;
}

export const InspectionDetails: React.FC<InspectionDetailsProps> = ({
  inspectionId,
  onNavigate,
}) => {
  const [inspection, setInspection] = useState<InspectionRecord | null>(null);

  useEffect(() => {
    const record = storageService.getInspectionById(inspectionId);
    if (record) {
      setInspection(record);
    }
  }, [inspectionId]);

  if (!inspection) {
    return (
      <div className="bg-[#151025] rounded-xl border border-[#2D2448] p-8 text-center space-y-4 text-slate-200 max-w-xl mx-auto mt-8">
        <div className="text-slate-300 font-semibold">Inspection record not found</div>
        <p className="text-slate-400 text-xs leading-relaxed">
          The dossier ID "{inspectionId}" could not be retrieved from local records or has been removed.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    );
  }

  return (
    <InspectionReportView
      inspection={inspection}
      onBack={() => onNavigate('history')}
      showToolbar={true}
    />
  );
};
