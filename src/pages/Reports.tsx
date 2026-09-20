import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { InspectionRecord, RuleDefinition } from '../types';
import { PROTOTYPE_RULES } from '../services/ruleEngine';
import { InspectionReportView } from '../components/inspection/InspectionReportView';
import {
  Printer,
  Download,
  ShieldCheck,
  FileText,
  BarChart3,
  ChevronDown,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ReportsProps {
  onNavigate: (route: string, params?: { inspectionId?: string }) => void;
  selectedInspectionId?: string;
}

export const Reports: React.FC<ReportsProps> = ({ onNavigate, selectedInspectionId }) => {
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'dossier' | 'analytics'>(
    selectedInspectionId ? 'dossier' : 'dossier'
  );
  const [currentId, setCurrentId] = useState<string | null>(selectedInspectionId || null);

  useEffect(() => {
    const list = storageService.getInspections();
    setInspections(list);
    if (!currentId && list.length > 0) {
      setCurrentId(list[0].id);
    }
  }, [selectedInspectionId]);

  const selectedRecord = inspections.find((i) => i.id === currentId) || inspections[0] || null;

  const totalInspections = inspections.length;
  const completedInspections = inspections.filter(
    (i) => i.status.toLowerCase().includes('completed') || i.status.toLowerCase().includes('compliant')
  ).length;
  const potentialIssues = inspections.filter(
    (i) => i.status.toLowerCase().includes('issue') || i.status.toLowerCase().includes('violation')
  ).length;
  const pendingReview = inspections.filter(
    (i) => i.status.toLowerCase().includes('pending') || i.status.toLowerCase().includes('manual')
  ).length;

  // Calculate rule compliance metrics across all inspections
  const ruleStats = PROTOTYPE_RULES.map((rule: RuleDefinition) => {
    let detectedCount = 0;
    let issueCount = 0;
    let notDetectedCount = 0;

    inspections.forEach((item) => {
      const match = item.findings?.find((f) => f.ruleCode === rule.code);
      if (match) {
        if (match.status.includes('DETECTED') && !match.status.includes('NOT')) detectedCount++;
        else if (match.status.includes('ISSUE')) issueCount++;
        else notDetectedCount++;
      }
    });

    const complianceRate = totalInspections > 0 ? Math.round((detectedCount / totalInspections) * 100) : 100;

    return {
      rule,
      detectedCount,
      issueCount,
      notDetectedCount,
      complianceRate,
    };
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(inspections, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `LabelLens_Ledger_Export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Header & Navigation Switcher (Hidden in Print) */}
      <div className="no-print bg-[#151025] border border-[#2D2448] rounded-xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-bold text-violet-400 tracking-wider">
              Statutory Reporting & Ledger
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-0.5">Package Inspection Reports</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Official inspection dossiers and aggregated compliance metrics under Legal Metrology Rules, 2011.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#1C1630] border border-[#2D2448] p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('dossier')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'dossier'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Inspection Dossier</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Compliance Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= VIEW 1: INDIVIDUAL INSPECTION DOSSIER REPORT PREVIEW ================= */}
      {activeTab === 'dossier' && (
        <div className="space-y-4">
          {/* Dossier Selector Bar (Hidden in Print) */}
          <div className="no-print bg-[#151025] border border-[#2D2448] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-semibold whitespace-nowrap">Select Dossier:</span>
              {inspections.length > 0 ? (
                <div className="relative inline-block min-w-[280px]">
                  <select
                    value={selectedRecord?.id || ''}
                    onChange={(e) => setCurrentId(e.target.value)}
                    aria-label="Select inspection dossier"
                    className="w-full bg-[#1C1630] border border-[#2D2448] rounded-lg px-3 py-1.5 pr-8 text-white font-mono text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    {inspections.map((rec) => (
                      <option key={rec.id} value={rec.id}>
                        {rec.id} — {rec.productName} ({rec.status})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <span className="text-slate-400 italic font-mono">No archived dossiers</span>
              )}
            </div>

            {selectedRecord && (
              <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                <span>Archived: {new Date(selectedRecord.createdAt).toLocaleDateString()}</span>
                <span>·</span>
                <span>Inspector: {selectedRecord.inspector?.id}</span>
              </div>
            )}
          </div>

          {/* Canonical Inspection Report Renderer */}
          {selectedRecord ? (
            <InspectionReportView
              inspection={selectedRecord}
              onBack={() => onNavigate('dashboard')}
              showToolbar={true}
            />
          ) : (
            <div className="bg-[#151025] border border-[#2D2448] rounded-xl p-12 text-center text-slate-400 space-y-3">
              <div className="font-semibold text-slate-300">No inspection records found</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No inspection dossiers have been performed yet. Start a new inspection to capture and verify package declarations.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('new-inspection')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                <span>Start New Inspection</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 2: AGGREGATE COMPLIANCE LEDGER ================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#151025] border border-[#2D2448] rounded-xl p-4 shadow-xl">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Dossiers</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">{totalInspections}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Archived inspections</div>
            </div>

            <div className="bg-[#151025] border border-[#2D2448] rounded-xl p-4 shadow-xl">
              <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Compliant (Clean)</div>
              <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">{completedInspections}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">All declarations verified</div>
            </div>

            <div className="bg-[#151025] border border-[#2D2448] rounded-xl p-4 shadow-xl">
              <div className="text-amber-400 text-xs font-bold uppercase tracking-wider">Flagged Discrepancies</div>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{potentialIssues}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Requiring manual inspection</div>
            </div>

            <div className="bg-[#151025] border border-[#2D2448] rounded-xl p-4 shadow-xl">
              <div className="text-violet-300 text-xs font-bold uppercase tracking-wider">Pending Review</div>
              <div className="text-2xl font-bold font-mono text-violet-200 mt-1">{pendingReview}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Awaiting signoff</div>
            </div>
          </div>

          {/* Rule Breakdown Table */}
          <div className="bg-[#151025] border border-[#2D2448] rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2D2448] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Rule Verification Performance Breakdown</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Statutory adherence rates under the Legal Metrology (Packaged Commodities) Rules, 2011.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2D2448] bg-[#1C1630] hover:bg-[#251D42] text-slate-200 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-violet-400" />
                  <span>Export JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer shadow-md transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Ledger</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1C1630] border-b border-[#2D2448] text-slate-400 uppercase tracking-wider font-bold text-[11px]">
                    <th className="py-3 px-4">Rule Code</th>
                    <th className="py-3 px-4">Requirement</th>
                    <th className="py-3 px-4 text-center">Detected</th>
                    <th className="py-3 px-4 text-center">Flagged Issues</th>
                    <th className="py-3 px-4 text-center">Not Detected</th>
                    <th className="py-3 px-4 text-right">Compliance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2448]/80 text-slate-200">
                  {ruleStats.map((stat) => (
                    <tr key={stat.rule.code} className="hover:bg-[#241B3E]/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-violet-300 whitespace-nowrap">
                        {stat.rule.code}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200 max-w-sm">
                        {stat.rule.requirement}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-emerald-400">
                        {stat.detectedCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-amber-400">
                        {stat.issueCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-500">
                        {stat.notDetectedCount}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-[#0D0917] border border-[#2D2448] rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-violet-500 h-2 rounded-full"
                              style={{ width: `${stat.complianceRate}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-bold text-white text-xs w-9 text-right">
                            {stat.complianceRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statutory Ledger Advisory */}
          <div className="bg-[#151025] border border-[#2D2448] rounded-xl p-4 text-xs text-slate-400 space-y-1">
            <div className="font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              <span>Statutory Metrology Ledger Note</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Aggregated ledger statistics are computed directly from archived inspection records. Each record represents
              a physical examination session with captured coordinates and verified declarations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
