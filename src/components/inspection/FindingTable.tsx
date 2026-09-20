import React from 'react';
import { RuleFinding } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Eye, Edit3, Crosshair } from 'lucide-react';

interface FindingTableProps {
  findings: RuleFinding[];
  onViewEvidence: (finding: RuleFinding) => void;
  onAnnotateFinding?: (finding: RuleFinding) => void;
}

export const FindingTable: React.FC<FindingTableProps> = ({
  findings,
  onViewEvidence,
  onAnnotateFinding,
}) => {
  return (
    <div id="findings-table-wrapper" className="overflow-x-auto rounded-xl border border-[#2D2448] bg-[#1C1630] shadow-xl">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-[#151025] border-b border-[#2D2448] text-slate-300 uppercase tracking-wider font-semibold text-[11px]">
            <th className="py-3 px-3.5">Rule Code</th>
            <th className="py-3 px-3.5">Statutory Requirement</th>
            <th className="py-3 px-3.5">Observed Evidence</th>
            <th className="py-3 px-3.5 text-center">Audit Finding</th>
            <th className="py-3 px-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2D2448]/80 text-slate-200">
          {findings.map((finding) => (
            <tr
              key={finding.ruleCode}
              id={`row-rule-${finding.ruleCode}`}
              className="hover:bg-[#241B3E]/50 transition-colors"
            >
              {/* Rule Code */}
              <td className="py-3 px-3.5 font-mono font-bold text-violet-300 whitespace-nowrap">
                {finding.ruleCode}
              </td>

              {/* Legal Requirement */}
              <td className="py-3 px-3.5 font-medium text-slate-100 max-w-xs leading-relaxed">
                {finding.requirement}
              </td>

              {/* Observed Evidence */}
              <td className="py-3 px-3.5 text-slate-300">
                <div className="flex items-start gap-1.5">
                  <span className="font-medium">{finding.observedEvidence}</span>
                </div>
                {finding.notes && (
                  <div className="mt-1.5 text-[11px] text-amber-200 bg-amber-950/60 p-2 rounded-lg border border-amber-700/60">
                    <span className="font-semibold text-amber-300">Inspector Note:</span> {finding.notes}
                  </div>
                )}
              </td>

              {/* Finding Status */}
              <td className="py-3 px-3.5 text-center whitespace-nowrap">
                <StatusBadge status={finding.status} size="sm" />
              </td>

              {/* Action */}
              <td className="py-3 px-3.5 text-right whitespace-nowrap">
                <div className="inline-flex items-center gap-1.5">
                  <button
                    id={`btn-finding-evidence-${finding.ruleCode}`}
                    type="button"
                    onClick={() => onViewEvidence(finding)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-violet-700/60 bg-violet-950/70 hover:bg-violet-900 text-violet-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-violet-400" />
                    <span>Evidence</span>
                  </button>

                  {onAnnotateFinding && (
                    <button
                      id={`btn-finding-annotate-${finding.ruleCode}`}
                      type="button"
                      onClick={() => onAnnotateFinding(finding)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#2D2448] bg-[#151025] hover:bg-[#201738] text-slate-300 text-xs font-medium cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Note</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
