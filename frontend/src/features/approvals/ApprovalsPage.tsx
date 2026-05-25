import { useState } from 'react';
import { Search, Filter, CheckSquare, X, ChevronDown, FileText, AlertTriangle } from 'lucide-react';

/* ── Types & mock data ─────────────────────────────────────────────────── */

type RiskLevel = 'high' | 'medium' | 'low';

interface ApprovalItem {
  id: string;
  type: string;
  subject: string;
  dept: string;
  value: string;
  risk: RiskLevel;
  dueLabel: string;
  dueUrgent: boolean;
  vendor: string;
}

const ITEMS: ApprovalItem[] = [
  { id: 'REQ-1918', type: 'PAYMENT ORDER',    subject: 'Structural Steel Supply',                dept: 'FBC', value: '$450,000', risk: 'high',   dueLabel: '46H OVERDUE',  dueUrgent: true,  vendor: 'Steel Corp Ltd' },
  { id: 'FY-4431', type: 'IT INFRA UPGRADE',  subject: 'IT Infrastructure Upgrade',             dept: 'ITS', value: '$125,000', risk: 'medium', dueLabel: '2H REMAINING', dueUrgent: true,  vendor: 'TechViet' },
  { id: 'PY-5821', type: 'Q4 SAFETY EQ.',    subject: 'Q4 Safety Equipment',                   dept: 'OPS', value: '$82,500',  risk: 'low',    dueLabel: '4H REMAINING', dueUrgent: false, vendor: 'SafeGuard' },
  { id: 'REQ-4094', type: 'SUBCONTRACTOR',    subject: 'Subcontractor Agreement – Phase 2',     dept: 'COM', value: '$2,100,000',risk:'high',   dueLabel: '6H REMAINING', dueUrgent: false, vendor: 'BuildCo' },
  { id: 'REQ-4094', type: 'OFFICE SUPPLIES',  subject: 'Office Supplies Bulk',                  dept: 'ADM', value: '$12,400',  risk: 'low',    dueLabel: '8H REMAINING', dueUrgent: false, vendor: 'OfficeHub' },
  { id: 'REQ-3091', type: 'FLEET MAINT.',     subject: 'Fleet Maintenance',                     dept: 'LOG', value: '$38,000',  risk: 'medium', dueLabel: 'Tomorrow',     dueUrgent: false, vendor: 'AutoServ' },
  { id: 'REQ-3992', type: 'CONSULTING',       subject: 'Consulting Retainer',                   dept: 'FIN', value: '$250,000', risk: 'medium', dueLabel: 'Tomorrow',     dueUrgent: false, vendor: 'Deloitte' },
  { id: 'REQ-3991', type: 'MARKETING',        subject: 'Marketing Campaign Q3',                 dept: 'MKT', value: '$95,000',  risk: 'low',    dueLabel: '2 days',       dueUrgent: false, vendor: 'MediaVN' },
];

const RISK_COLORS: Record<RiskLevel, string> = { high: '#DC2626', medium: '#F59E0B', low: '#10B981' };

/* ── AI Analysis mock ──────────────────────────────────────────────────── */

const AI_SUMMARY = `Standard procurement request for structural steel. Vendor "Steel Corp Ltd" is a pre-approved supplier (Tier 1). Pricing is within 5% of historical average.

• Vendor: Steel Corp Ltd — Tier 1, Approved
• Term: Net 45
• Delivery: On-site, FOB`;

const POLICY_CLAUSES = [
  {
    id: 'CLAUSE 1', title: 'PAYMENT TERMS', status: 'Medium Risk', statusColor: '#F59E0B',
    note: 'Net 30 requested. Standard is Net 45. Deviation reduces working capital efficiency by ~$1.2M. Tier-2 suppliers commonly accept Net 30.',
    contract: 'Net 30 Days', standard: 'Net 14 Days',
  },
  {
    id: 'CLAUSE 2', title: 'LIABILITY CAP', status: 'Critical Risk', statusColor: '#DC2626',
    note: '100% of Contract Value cap is non-standard. High exposure. Recommended rejection of >50% cap unless waiver approved.',
    contract: '100% Contract Value', standard: '$4.5M · 50% Max',
  },
];

/* ── Component ──────────────────────────────────────────────────────────── */

export function ApprovalsPage() {
  const [selected, setSelected] = useState<ApprovalItem>(ITEMS[0]!);
  const [activeTab, setActiveTab] = useState<'document' | 'ai' | 'history'>('document');
  const [search, setSearch] = useState('');
  const [showRejectSheet, setShowRejectSheet] = useState(false);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  const filtered = ITEMS.filter(
    (item) =>
      item.subject.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase()),
  );

  const handleApprove = () => {
    setApprovedIds((prev) => new Set([...prev, selected.id]));
    const next = filtered.find((i) => i.id !== selected.id && !approvedIds.has(i.id));
    if (next) setSelected(next);
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: '#F4F5F7', fontFamily: "'IBM Plex Sans', sans-serif" }}
    >

      {/* ── Master list pane ── */}
      <div className="flex flex-col bg-white border-r border-slate-200" style={{ width: '38%', minWidth: '320px' }}>

        {/* List header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Pending Approvals
              <span className="ml-2 text-xs font-normal text-slate-400">({filtered.length})</span>
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <Filter size={14} />
            </button>
            <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <CheckSquare size={14} />
            </button>
          </div>
        </div>

        {/* Search + filters */}
        <div className="px-4 py-2 border-b border-slate-100">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, Vendor, or Contract…"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-200 text-slate-700 placeholder-slate-400 outline-none focus:border-[#10CFC9] focus:ring-1 focus:ring-[#10CFC9]/20"
            />
          </div>
          <div className="flex gap-1.5 mt-2">
            {['Dept ▾', 'Value ▾', 'Risk ▾'].map((f) => (
              <button key={f} className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-2xs font-medium text-slate-500 hover:bg-slate-50 transition-colors">
                {f} <ChevronDown size={10} />
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((item) => {
            const isActive = selected.id === item.id && selected.subject === item.subject;
            const isApproved = approvedIds.has(item.id);
            return (
              <button
                key={`${item.id}-${item.subject}`}
                onClick={() => setSelected(item)}
                className="w-full text-left px-4 py-3 border-b border-slate-100 transition-colors hover:bg-slate-50 relative"
                style={{ background: isActive ? '#EFF6FF' : isApproved ? '#F0FDF4' : 'transparent' }}
              >
                {/* Risk strip */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                  style={{ background: RISK_COLORS[item.risk] }}
                />
                <div className="pl-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-2xs font-medium text-slate-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {item.id} · {item.dept}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {item.value}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-800 mb-1">{item.subject}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-slate-400">{item.type}</span>
                    <span
                      className={`text-2xs font-semibold ${item.dueUrgent ? 'text-red-600' : 'text-emerald-600'}`}
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {item.dueLabel}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 text-2xs text-slate-400 flex items-center justify-between">
          <span>Navigate with ↑↓ · Space to select</span>
          <span>{filtered.length} items</span>
        </div>
      </div>

      {/* ── Detail pane ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Detail header */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400"># Command Center</span>
            <span className="text-slate-300">›</span>
            <span className="text-xs font-semibold text-slate-700">{selected.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-2xs font-bold px-2 py-0.5 rounded text-white"
              style={{ background: RISK_COLORS[selected.risk], fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {selected.risk.toUpperCase()} RISK
            </span>
            <span className="text-sm font-bold text-slate-800" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              {selected.value}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-slate-200 px-6 flex gap-1">
          {[
            { key: 'document', label: 'Document' },
            { key: 'ai', label: 'AI Analysis' },
            { key: 'history', label: 'History & Logs' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className="px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors"
              style={{
                borderColor: activeTab === tab.key ? '#10CFC9' : 'transparent',
                color: activeTab === tab.key ? '#10CFC9' : '#64748B',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">

          {activeTab === 'document' && (
            <div className="space-y-4">
              {/* Fake PDF */}
              <div className="bg-white rounded border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-600"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      REQ-{selected.id}_Contract_1.pdf
                    </span>
                  </div>
                  <span className="text-2xs text-slate-400">Page 1 / 3</span>
                </div>
                <div className="p-8 min-h-[280px] bg-white">
                  <div className="max-w-lg mx-auto space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 text-center">MASTER SERVICE AGREEMENT</h3>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Doc. Ref.: MSA-2023-371</span>
                      <span>Rev.: 2.1</span>
                    </div>
                    {[
                      { n: '1.', t: 'INVOICING', b: 'Provider shall submit Invoice to Client on a monthly basis. Each invoice is subject to detailed breakdown of services rendered.' },
                      { n: '2.', t: 'PAYMENT SCHEDULE', b: 'Client agrees to pay all undisputed invoices within Net 30 days of receipt. Late payments shall incur a rate of 1.5% per month.' },
                      { n: '3.', t: 'CURRENCY', b: 'All payments to be made in US Dollars (USD) unless otherwise agreed in writing by both parties.' },
                    ].map((s) => (
                      <div key={s.n}>
                        <p className="text-xs font-semibold text-slate-700 mb-1">{s.n} {s.t}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{s.b}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              {/* AI Summary */}
              <div className="bg-white rounded border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-2xs font-bold"
                      style={{ background: '#10CFC9' }}>AI</div>
                    <span className="text-xs font-semibold text-slate-800">AI Risk Assessment</span>
                    <span className="text-2xs font-bold px-1.5 py-0.5 rounded text-red-600 bg-red-50 border border-red-200"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}>LOW RISK</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xs text-slate-400">Confidence</div>
                    <div className="text-xs font-bold text-slate-700">87%</div>
                  </div>
                </div>
                <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{AI_SUMMARY}</div>
              </div>

              {/* Policy clauses */}
              <div className="bg-white rounded border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="text-xs font-semibold text-slate-800">Policy Deviation Check</span>
                  <span className="text-2xs font-bold px-1.5 py-0.5 rounded text-red-600 bg-red-50 border border-red-200">
                    3 CRITICAL ISSUES
                  </span>
                </div>
                <div className="space-y-3">
                  {POLICY_CLAUSES.map((clause) => (
                    <div key={clause.id} className="rounded border border-slate-200 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{clause.id} · {clause.title}</span>
                        <span className="text-2xs font-bold px-2 py-0.5 rounded text-white"
                          style={{ background: clause.statusColor, fontFamily: "'IBM Plex Mono', monospace" }}>
                          {clause.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {[
                          { label: 'Contract', value: clause.contract },
                          { label: 'Standard', value: clause.standard },
                        ].map((f) => (
                          <div key={f.label} className="bg-slate-50 rounded p-2">
                            <div className="text-2xs text-slate-400 mb-0.5">{f.label}</div>
                            <div className="text-xs font-semibold text-slate-700" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                              {f.value}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{clause.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded border border-slate-200 p-4">
              <div className="space-y-3">
                {[
                  { user: 'System', action: 'Request created', time: '2 days ago', color: '#94a3b8' },
                  { user: 'Nguyen Van A', action: 'Submitted for approval', time: '1 day ago', color: '#16315E' },
                  { user: 'Le Thi B', action: 'Level 1 approved', time: '8h ago', color: '#10B981' },
                  { user: 'CFO Review', action: 'Pending your review', time: 'Now', color: '#10CFC9' },
                ].map((log, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-2xs font-bold text-white shrink-0 mt-0.5"
                      style={{ background: log.color }}>
                      {log.user[0]}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-700">{log.action}</p>
                      <p className="text-2xs text-slate-400">{log.user} · {log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div>
            <div className="text-2xs text-slate-400 font-medium">TOTAL VALUE</div>
            <div className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {selected.value}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              More Actions ▾
            </button>
            <button
              onClick={() => setShowRejectSheet(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded border border-red-200 bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
            >
              <X size={13} /> Reject
            </button>
            <button
              onClick={handleApprove}
              className="flex items-center gap-1.5 px-5 py-2 rounded text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: approvedIds.has(selected.id) ? '#10B981' : '#10CFC9', fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {approvedIds.has(selected.id) ? '✓ Approved' : '✓ Approve'}
            </button>
          </div>
        </div>
      </div>

      {/* Reject bottom sheet */}
      {showRejectSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Reason for Rejection
              </h3>
              <button onClick={() => setShowRejectSheet(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 mb-4">
              {['Over budget threshold', 'Incomplete documentation', 'Vendor not approved', 'Requires re-tender', 'Other'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setShowRejectSheet(false)}
                  className="w-full text-left px-4 py-2.5 rounded border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Add a note (optional)…"
              rows={3}
              className="w-full rounded border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-[#10CFC9] resize-none"
            />
            <button
              onClick={() => setShowRejectSheet(false)}
              className="w-full mt-3 py-2.5 rounded text-xs font-semibold text-white"
              style={{ background: '#DC2626' }}
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

