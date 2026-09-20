import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { InspectionRecord } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Search, Trash2, Eye } from 'lucide-react';

interface HistoryProps {
  onNavigate: (route: string, params?: { inspectionId?: string }) => void;
}

export const History: React.FC<HistoryProps> = ({ onNavigate }) => {
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = () => {
    setInspections(storageService.getInspections());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (id: string) => {
    storageService.deleteInspection(id);
    setDeletingId(null);
    loadData();
  };

  const filteredInspections = inspections.filter((item) => {
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'COMPLETED' && !item.status.toLowerCase().includes('completed') && !item.status.toLowerCase().includes('compliant')) return false;
      if (statusFilter === 'ISSUES' && !item.status.toLowerCase().includes('issue') && !item.status.toLowerCase().includes('violation')) return false;
      if (statusFilter === 'PENDING' && !item.status.toLowerCase().includes('pending') && !item.status.toLowerCase().includes('manual')) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.id.toLowerCase().includes(q) ||
      item.productName.toLowerCase().includes(q) ||
      item.location.placeName.toLowerCase().includes(q) ||
      item.inspector.name.toLowerCase().includes(q) ||
      item.inspector.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header */}
      <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-violet-400 tracking-wider">
              Permanent Records
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-0.5">Inspection History Archive</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit-grade history of packaged commodity inspections, GPS timestamps, and officer verifications.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total Archived: <strong className="text-violet-300">{inspections.length}</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#151025] border border-[#2D2448] rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Records' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'ISSUES', label: 'Potential Issues' },
            { id: 'PENDING', label: 'Pending Review' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-950'
                  : 'bg-[#1C1630] border border-[#2D2448] text-slate-300 hover:text-white hover:bg-[#251D42]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dossier ID, commodity, place..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#2D2448] bg-[#0D0917] text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-violet-500"
          />
        </div>
      </div>

      {/* Archive Table */}
      <div className="bg-[#151025] border border-[#2D2448] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1C1630] border-b border-[#2D2448] text-slate-400 uppercase tracking-wider font-bold text-[11px]">
                <th className="py-3.5 px-4">Dossier ID</th>
                <th className="py-3.5 px-4">Commodity Examined</th>
                <th className="py-3.5 px-4">Inspection Site</th>
                <th className="py-3.5 px-4">Officer</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2448]/80 text-slate-200">
              {filteredInspections.map((item) => (
                <tr key={item.id} className="hover:bg-[#241B3E]/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-violet-300 whitespace-nowrap">
                    {item.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{item.productName}</div>
                    {item.barcode && (
                      <div className="text-[10px] font-mono text-slate-400">Barcode: {item.barcode}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <div>{item.location.placeName}</div>
                    {item.location.latitude && (
                      <div className="text-[10px] font-mono text-slate-500">
                        {item.location.latitude.toFixed(3)}, {item.location.longitude?.toFixed(3)}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <div className="font-medium text-white">{item.inspector.name}</div>
                    <div className="text-[10px] font-mono text-violet-400">{item.inspector.id}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <StatusBadge status={item.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onNavigate('inspection-detail', { inspectionId: item.id })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2D2448] bg-[#1C1630] hover:bg-[#251D42] text-slate-200 hover:text-white text-xs font-semibold cursor-pointer shadow-md transition-colors"
                        title="View Official Dossier"
                      >
                        <Eye className="w-3.5 h-3.5 text-violet-400" />
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingId(item.id)}
                        className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 border border-transparent hover:border-rose-900/60 transition-colors"
                        title="Delete record from local database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInspections.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No inspection archives matched your query or filter.
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Inspection Dossier"
          message={`Are you sure you want to permanently delete dossier "${deletingId}"? This removes the digital evidence, findings, and audit record.`}
          confirmLabel="Delete Record"
          isDestructive={true}
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
};
