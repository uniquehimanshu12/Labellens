import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import { InspectionRecord, DashboardMetrics } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useLanguage } from '../i18n/LanguageContext';
import { useToast } from '../components/common/Toast';
import { InspectionCarousel } from '../components/inspection/InspectionCarousel';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  PlusCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ArrowRight,
  ShieldAlert,
  Search,
  ChevronRight,
  LayoutGrid,
  List,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (route: string, params?: { inspectionId?: string }) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { toastSaved } = useToast();
  const [inspector] = useState(authService.getCurrentUser());
  const [metrics, setMetrics] = useState<DashboardMetrics>(storageService.getDashboardMetrics());
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [activeDraft, setActiveDraft] = useState<InspectionRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'carousel' | 'table'>('carousel');
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  useEffect(() => {
    const list = storageService.getInspections();
    setInspections(list);
    setMetrics(storageService.getDashboardMetrics());
    setActiveDraft(storageService.getActiveDraft());
  }, []);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const attentionInspections = inspections.filter(
    (i) =>
      i.status === 'REQUIRES MANUAL VERIFICATION' ||
      i.status === 'Potential Issue — Manual Verification' ||
      i.findings?.some((f) => f.status === 'POTENTIAL ISSUE — MANUAL VERIFICATION')
  );

  const filteredInspections = inspections.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.id.toLowerCase().includes(q) ||
      item.productName.toLowerCase().includes(q) ||
      item.location.placeName.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q)
    );
  });

  const handleConfirmDiscardDraft = () => {
    storageService.clearActiveDraft();
    setActiveDraft(null);
    toastSaved('Draft Discarded', 'The in-progress draft inspection was cleared');
  };

  return (
    <div className="space-y-5 text-slate-200">
      {/* Station Session Banner */}
      <div className="bg-[#151025] border border-[#2D2448] rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-mono font-bold text-violet-300 tracking-wider">
              Legal Metrology Workstation
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">Active Session</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            {getTimeGreeting()}, {inspector?.name?.split(' ')[0] || 'Rahul'}.
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {attentionInspections.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/60 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                {attentionInspections.length} inspections need review
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                All dossiers verified and up to date
              </span>
            )}
            <span className="text-xs text-slate-400">
              · Officer ID: {inspector?.id || 'INS-1042'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-start-inspection-dashboard"
            type="button"
            onClick={() => onNavigate('new-inspection')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-950/60 cursor-pointer transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.startNewInspection}</span>
          </button>
        </div>
      </div>

      {/* Draft Resume Banner if Draft exists */}
      {activeDraft && (
        <div className="bg-[#1C1428] border border-amber-500/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0 mt-0.5 border border-amber-500/30">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                Unfinished Inspection In Progress
              </div>
              <div className="text-sm font-semibold text-white mt-0.5">
                {activeDraft.productName || 'Unnamed Package'} ({activeDraft.id})
              </div>
              <div className="text-xs text-amber-200/80 mt-0.5 font-mono">
                Last saved: Step {activeDraft.step || 1} of 6 · {activeDraft.location?.placeName || 'Location Logged'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-resume-draft"
              type="button"
              onClick={() => onNavigate('active-inspection')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm"
            >
              <span>Resume Inspection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-discard-draft"
              type="button"
              onClick={() => setDiscardConfirmOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-amber-700/60 text-amber-300 hover:bg-amber-950/40 text-xs font-medium cursor-pointer transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Workstation Core Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Pending Review */}
        <div className="bg-[#151025] border border-[#2D2448] rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-violet-300 tracking-wider">
              Pending Review
            </span>
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {metrics.pendingReviewCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting secondary signoff</div>
        </div>

        {/* In Progress */}
        <div className="bg-[#151025] border border-[#2D2448] rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-300 tracking-wider">
              In Progress
            </span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-2">
            {activeDraft ? 1 : 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active field draft session</div>
        </div>

        {/* Completed Today */}
        <div className="bg-[#151025] border border-[#2D2448] rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider">
              Completed Today
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-2">
            {metrics.todayCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Compliant dossiers finalized</div>
        </div>

        {/* Requires Verification */}
        <div className="bg-[#151025] border border-[#2D2448] rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-rose-400 tracking-wider">
              Needs Verification
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-300 mt-2">
            {metrics.potentialIssuesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Discrepancies flagged for review</div>
        </div>
      </div>

      {/* Active Inspections Section Header with Search & Switcher */}
      <div className="bg-[#151025] border border-[#2D2448] rounded-xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Recent Inspections</span>
            <span className="text-xs font-mono text-violet-400 bg-violet-950/70 border border-violet-800/60 px-2 py-0.5 rounded-full">
              {filteredInspections.length} total
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified packaged commodity dossiers with evidence coordinates and location records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search bar */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, product..."
              className="w-full pl-8.5 pr-3 py-1.5 rounded-lg border border-[#2D2448] bg-[#0D0917] text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-violet-500"
            />
          </div>

          {/* View mode toggle (Carousel vs Table) */}
          <div className="flex items-center bg-[#1C1630] border border-[#2D2448] rounded-lg p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('carousel')}
              title="Card Carousel View"
              className={`p-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'carousel'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Compact Table View"
              className={`p-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspections View Mode Display */}
      {viewMode === 'carousel' ? (
        <InspectionCarousel
          inspections={filteredInspections}
          onNavigate={onNavigate}
        />
      ) : (
        /* Compact Table View */
        <div className="bg-[#151025] border border-[#2D2448] rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1C1630] border-b border-[#2D2448] text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Inspection ID</th>
                  <th className="py-3 px-4">Packaged Commodity</th>
                  <th className="py-3 px-4">Field Location</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D2448]/80 text-slate-200">
                {filteredInspections.map((item) => (
                  <tr
                    key={item.id}
                    id={`row-inspection-${item.id}`}
                    className="hover:bg-[#241B3E]/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-violet-300 whitespace-nowrap">
                      {item.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{item.productName}</div>
                      {item.barcode && (
                        <div className="text-[10px] font-mono text-slate-400">Barcode: {item.barcode}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{item.location.placeName || 'Coordinates Logged'}</div>
                      {item.location.accuracy && (
                        <div className="text-[10px] font-mono text-slate-500">±{item.location.accuracy}m</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <div className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        id={`btn-view-${item.id}`}
                        type="button"
                        onClick={() => onNavigate('inspection-detail', { inspectionId: item.id })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2D2448] bg-[#1C1630] hover:bg-[#251D42] text-slate-200 hover:text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                      >
                        <span>Open Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5 text-violet-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInspections.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No inspections matched query "{searchQuery}".
            </div>
          )}
        </div>
      )}

      {/* Statutory Guidance Card */}
      <div className="bg-[#151025] border border-[#2D2448] rounded-xl p-4 text-xs text-slate-400 space-y-1">
        <div className="font-bold text-slate-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-violet-400" />
          <span>Statutory Inspection Protocol — SIH26034 Standard</span>
        </div>
        <p className="leading-relaxed text-slate-400">
          Under Legal Metrology (Packaged Commodities) Rules, 2011, declarations of MRP, Net Quantity,
          Manufacturer/Packer identity, Batch/Dates, and Consumer Care details are verified against physical display
          surfaces. Any detected discrepancy is flagged for inspector verification before formal report issuance.
        </p>
      </div>

      {/* Discard Draft Confirmation Modal */}
      <ConfirmDialog
        id="confirm-discard-draft-dialog"
        isOpen={discardConfirmOpen}
        title="Discard Draft Inspection"
        message="Are you sure you want to discard this in-progress inspection draft? All unfinalized surface captures and declarations will be permanently deleted."
        confirmLabel="Discard Draft"
        cancelLabel="Keep Draft"
        isDestructive={true}
        onConfirm={handleConfirmDiscardDraft}
        onCancel={() => setDiscardConfirmOpen(false)}
      />
    </div>
  );
};
