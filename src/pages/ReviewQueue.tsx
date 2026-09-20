import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { InspectionRecord } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { AlertTriangle, Clock, Search, ChevronRight } from 'lucide-react';

interface ReviewQueueProps {
  onNavigate: (route: string, params?: { inspectionId?: string }) => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ onNavigate }) => {
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'issues' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const list = storageService.getInspections();
    const queue = list.filter(
      (item) =>
        item.status.toLowerCase().includes('pending') ||
        item.status.toLowerCase().includes('manual') ||
        item.status.toLowerCase().includes('issue') ||
        item.status.toLowerCase().includes('requires')
    );
    setInspections(queue);
  }, []);

  const filteredQueue = inspections.filter((item) => {
    if (filterType === 'issues' && !item.status.toLowerCase().includes('issue')) return false;
    if (filterType === 'pending' && !item.status.toLowerCase().includes('pending') && !item.status.toLowerCase().includes('manual')) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.id.toLowerCase().includes(q) ||
      item.productName.toLowerCase().includes(q) ||
      item.location.placeName.toLowerCase().includes(q)
    );
  });

  const potentialIssuesCount = inspections.filter(
    (i) => i.status.toLowerCase().includes('issue')
  ).length;
  const pendingCount = inspections.filter((i) => i.status.toLowerCase().includes('pending') || i.status.toLowerCase().includes('manual')).length;

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header */}
      <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-violet-400 tracking-wider">
              Verification Workflow
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-0.5">Inspector Review Queue</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspections requiring officer confirmation, manual evidence resolution, or secondary signoff.
          </p>
        </div>

        {/* Count chips */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 border border-amber-700/60 text-amber-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>{potentialIssuesCount} Flagged Issues</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-[#1C1630] border border-violet-700/50 text-violet-300 text-xs font-semibold flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            <span>{pendingCount} Pending</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-950'
                : 'bg-[#1C1630] border border-[#2D2448] text-slate-300 hover:text-white hover:bg-[#251D42]'
            }`}
          >
            All Review Items ({inspections.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('issues')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filterType === 'issues'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-[#1C1630] border border-[#2D2448] text-slate-300 hover:text-white hover:bg-[#251D42]'
            }`}
          >
            Potential Issues Only ({potentialIssuesCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filterType === 'pending'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-950'
                : 'bg-[#1C1630] border border-[#2D2448] text-slate-300 hover:text-white hover:bg-[#251D42]'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search queue..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#2D2448] bg-[#0D0917] text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-violet-500"
          />
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-[#151025] border border-[#2D2448] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1C1630] border-b border-[#2D2448] text-slate-400 uppercase tracking-wider font-bold text-[11px]">
                <th className="py-3.5 px-4">Dossier ID</th>
                <th className="py-3.5 px-4">Commodity</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Flagged Reason</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2448]/80 text-slate-200">
              {filteredQueue.map((item) => {
                const flaggedFinding = item.findings.find(
                  (f) => f.status.includes('POTENTIAL ISSUE') || f.status.includes('VIOLATION')
                );

                return (
                  <tr key={item.id} className="hover:bg-[#241B3E]/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-violet-300 whitespace-nowrap">
                      {item.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{item.productName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Logged by {item.inspector.name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{item.location.placeName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-xs">
                      {flaggedFinding ? (
                        <div className="text-amber-300 font-medium">
                          <span className="font-bold text-white">{flaggedFinding.ruleCode}:</span>{' '}
                          {flaggedFinding.notes || flaggedFinding.requirement}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Routine manual verification needed</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onNavigate('inspection-detail', { inspectionId: item.id })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-500/50 bg-[#1C1630] hover:bg-[#251D42] text-violet-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors shadow-md"
                      >
                        <span>Resolve & Review</span>
                        <ChevronRight className="w-3.5 h-3.5 text-violet-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredQueue.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No items in queue matching the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};
