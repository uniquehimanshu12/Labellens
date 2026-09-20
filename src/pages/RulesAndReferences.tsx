import React, { useState } from 'react';
import { 
  STANDARD_RULES, 
  PROTOTYPE_REFERENCES, 
  PROTOTYPE_RULE_SET_NAME, 
  PROTOTYPE_RULE_DISCLAIMER 
} from '../services/ruleEngine';
import { RuleDefinition } from '../types';
import { 
  Scale, 
  BookOpen, 
  Search, 
  Layers, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  FileText,
  Crosshair,
  Filter
} from 'lucide-react';

interface RulesAndReferencesProps {
  onNavigate?: (route: string) => void;
}

export const RulesAndReferences: React.FC<RulesAndReferencesProps> = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRuleId, setSelectedRuleId] = useState<string>(STANDARD_RULES[0]?.id || 'lm-rule-mrp');
  const [activeTab, setActiveTab] = useState<'rules' | 'references'>('rules');

  const categories = [
    'All',
    'Pricing Transparency',
    'Quantity & Weights',
    'Commercial Traceability',
    'Product Shelf-Life',
    'Consumer Redressal',
    'Trade Compliance',
  ];

  const filteredRules = STANDARD_RULES.filter((rule) => {
    const matchesCat = selectedCategory === 'All' || rule.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      rule.code.toLowerCase().includes(q) ||
      rule.name.toLowerCase().includes(q) ||
      rule.requirement.toLowerCase().includes(q) ||
      rule.lookFor.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const selectedRule = STANDARD_RULES.find((r) => r.id === selectedRuleId) || filteredRules[0];

  return (
    <div id="rules-references-workstation" className="space-y-5 text-slate-100">
      {/* Top Workstation Header */}
      <div className="bg-[#140F24] border border-[#2D234C] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-violet-950 text-violet-300 border border-violet-700/60 rounded">
                Statutory Architecture
              </span>
              <span className="text-xs font-mono text-slate-400">Legal Metrology Framework</span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              {PROTOTYPE_RULE_SET_NAME}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Automated compliance inspection engine calibrated to Legal Metrology (Packaged Commodities) Rules, 2011.
            </p>
          </div>

          {/* Statutory Disclaimer Box */}
          <div className="bg-[#1C1630] border border-amber-500/40 p-3 rounded-xl text-xs text-amber-200 max-w-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-snug text-[11px]">
                <span className="font-bold">Statutory Note:</span> {PROTOTYPE_RULE_DISCLAIMER}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-3 mt-5 border-t border-[#2D234C] pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#1C1630]'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Inspection Rules Database ({STANDARD_RULES.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('references')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'references'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#1C1630]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Official Legal References & Acts ({PROTOTYPE_REFERENCES.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'rules' ? (
        /* 3-Column Workstation Layout: Left Categories, Center List, Right Detail */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Column 1: Left Categories (2 cols on large) */}
          <div className="lg:col-span-3 bg-[#140F24] border border-[#2D234C] rounded-2xl p-4 shadow-xl space-y-2">
            <div className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-violet-400" />
              <span>Statutory Categories</span>
            </div>
            <div className="space-y-1">
              {categories.map((cat) => {
                const count =
                  cat === 'All'
                    ? STANDARD_RULES.length
                    : STANDARD_RULES.filter((r) => r.category === cat).length;
                const isSelected = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600 text-white font-bold shadow-md'
                        : 'text-slate-300 hover:bg-[#1C1630] hover:text-white'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#1C1630] text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Center Rules List (4 cols on large) */}
          <div className="lg:col-span-4 bg-[#140F24] border border-[#2D234C] rounded-2xl p-4 shadow-xl space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rule code or keyword..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0D0917] border border-[#2D234C] text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-violet-500"
              />
            </div>

            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between px-1">
              <span>Matching Rules</span>
              <span>{filteredRules.length} found</span>
            </div>

            {/* Scrollable list */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredRules.map((rule) => {
                const isSelected = selectedRule?.id === rule.id;

                return (
                  <div
                    key={rule.id}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-950/60 border-violet-500 shadow-lg ring-1 ring-violet-500'
                        : 'bg-[#1C1630] border-[#2D234C] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0D0917] text-violet-300 border border-[#2D234C]">
                        {rule.code}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {rule.category}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white mt-1.5 leading-snug">
                      {rule.name}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      {rule.requirement}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 3: Right Selected Rule Detail (5 cols on large) */}
          <div className="lg:col-span-5 bg-[#140F24] border border-[#2D234C] rounded-2xl p-5 shadow-xl space-y-4">
            {selectedRule ? (
              <>
                {/* Header */}
                <div className="border-b border-[#2D234C] pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-700/60">
                      {selectedRule.code}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Category: {selectedRule.category}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-2 leading-tight">
                    {selectedRule.name}
                  </h2>
                </div>

                {/* Requirement */}
                <div className="bg-[#1C1630] border border-[#2D234C] rounded-xl p-3.5 space-y-1">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                    <span>Statutory Requirement</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {selectedRule.requirement}
                  </p>
                </div>

                {/* Evidence Required */}
                <div className="bg-[#1C1630] border border-[#2D234C] rounded-xl p-3.5 space-y-1">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Evidence Required on Physical Package</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-mono">
                    {selectedRule.lookFor}
                  </p>
                </div>

                {/* Prototype Interpretation */}
                <div className="bg-[#1C1630] border border-[#2D234C] rounded-xl p-3.5 space-y-1">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Prototype Algorithmic Evaluation</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Evaluated automatically via OCR token extraction and Gemini multimodal parsing. If statutory markers are detected with bounding box precision, the rule evaluates to COMPLIANT. Absence or invalid phrasing yields NON_COMPLIANT with actionable penalty references.
                  </p>
                </div>

                {/* Legal Reference */}
                <div className="bg-[#0D0917] border border-[#2D234C] rounded-xl p-3.5 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                    Statutory Rule Anchor
                  </div>
                  <div className="text-xs font-mono font-bold text-violet-400">
                    {selectedRule.legalReference || 'Rule 6, Legal Metrology (Packaged Commodities) Rules, 2011'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Punishable under Section 36 of the Legal Metrology Act, 2009 for deceptive packaging or non-declaration.
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Select a rule from the list to view statutory specifications.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Legal References List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROTOTYPE_REFERENCES.map((ref, idx) => (
            <div
              key={idx}
              className="bg-[#140F24] border border-[#2D234C] rounded-2xl p-5 shadow-xl space-y-2 hover:border-violet-600/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-700/60">
                  {ref.id || `REF-0${idx + 1}`}
                </span>
                <span className="text-xs font-mono text-slate-400">{ref.source}</span>
              </div>
              <h3 className="text-sm font-bold text-white">{ref.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{ref.description}</p>
              {ref.officialSection && (
                <div className="text-[11px] font-mono text-violet-400 pt-1">
                  Statutory Provision: {ref.officialSection}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
