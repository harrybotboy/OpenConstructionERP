import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, TrendingUp, FileText, RefreshCw, MoreHorizontal } from 'lucide-react';

/* ── Static mock data ───────────────────────────────────────────────────── */

const KPI_CARDS = [
  {
    id: 'pending',
    label: 'PENDING VALUE',
    value: '$12,405,000',
    sub: '+2.1% WoW',
    subPositive: true,
    icon: FileText,
    danger: false,
    turquoise: false,
  },
  {
    id: 'critical',
    label: 'CRITICAL REQUESTS',
    value: '8',
    sub: 'Action Required · +2 DoD',
    subPositive: false,
    icon: AlertTriangle,
    danger: true,
    turquoise: false,
  },
  {
    id: 'time',
    label: 'AVG APPROVAL TIME',
    value: '4h 12m',
    sub: '-15m vs. Target (4h 30m)',
    subPositive: true,
    icon: Clock,
    danger: false,
    turquoise: false,
  },
  {
    id: 'velocity',
    label: 'YOUR VELOCITY',
    value: '+12%',
    sub: 'vs. Target (4h 30m)',
    subPositive: true,
    icon: TrendingUp,
    danger: false,
    turquoise: true,
  },
];

const HEATMAP: { count: number; color: string }[][] = [
  [
    { count: 2,  color: '#f0fdf4' },
    { count: 4,  color: '#fef9c3' },
    { count: 3,  color: '#fef2f2' },
  ],
  [
    { count: 12, color: '#f8fafc' },
    { count: 6,  color: '#fef9c3' },
    { count: 1,  color: '#fef2f2' },
  ],
  [
    { count: 24, color: '#f8fafc' },
    { count: 8,  color: '#f8fafc' },
    { count: 0,  color: '#f8fafc' },
  ],
];

const QUEUE = [
  { id: 'REQ-2948', subject: 'Struct. Steel Supply',       value: '$2,100,000', status: '46H OVERDUE',  sc: '#DC2626', bg: '#FEF2F2' },
  { id: 'REQ-3021', subject: 'Site Labor Contract A',      value: '$450,000',   status: '2H REMAINING', sc: '#F59E0B', bg: '#FFFBEB' },
  { id: 'REQ-3019', subject: 'HVAC Maintenance Q3',        value: '$125,000',   status: '4H REMAINING', sc: '#10B981', bg: '#ECFDF5' },
  { id: 'REQ-2999', subject: 'Legal Counsel Retainer',     value: '$85,000',    status: '6H REMAINING', sc: '#10B981', bg: '#ECFDF5' },
  { id: 'REQ-3045', subject: 'Concrete Supply – Phase 2',  value: '$3,200,000', status: '8H REMAINING', sc: '#10B981', bg: '#ECFDF5' },
];

/* ── Component ──────────────────────────────────────────────────────────── */

export function DashboardPage() {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: '#F4F5F7', fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold text-slate-900"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Global Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xs text-slate-500 font-medium">System Operational</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/approvals')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold text-white transition-colors"
            style={{ background: '#10CFC9', fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Command Center →
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon;
          const leftColor = kpi.danger ? '#DC2626' : kpi.turquoise ? '#10CFC9' : '#16315E';
          const valueColor = kpi.turquoise ? '#10CFC9' : kpi.danger ? '#DC2626' : '#0F172A';
          return (
            <div
              key={kpi.id}
              className="bg-white rounded border border-slate-200 px-5 py-4"
              style={{ borderLeft: `4px solid ${leftColor}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-2xs font-semibold uppercase tracking-widest text-slate-500"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.08em' }}
                >
                  {kpi.label}
                </span>
                <Icon size={14} className="text-slate-400" />
              </div>
              <div
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: valueColor }}
              >
                {kpi.value}
              </div>
              <div className={`text-xs font-medium ${kpi.subPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Heatmap */}
        <div className="bg-white rounded border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Risk Distribution Heatmap
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Pending approvals by Value vs. Risk Score</p>
            </div>
            <button className="text-xs font-medium hover:underline" style={{ color: '#10CFC9' }}>View Details</button>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col justify-around items-end" style={{ width: '64px', paddingBottom: '20px' }}>
              {['High Val', 'Med Val', 'Low Val'].map((l) => (
                <span key={l} className="text-2xs text-slate-400 font-medium">{l}</span>
              ))}
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {HEATMAP.map((row, ri) =>
                  row.map((cell, ci) => (
                    <div
                      key={`${ri}-${ci}`}
                      className="rounded flex items-center justify-center py-5 cursor-pointer hover:opacity-75 transition-opacity"
                      style={{ background: cell.color, border: '1px solid #E2E8F0' }}
                    >
                      <span className="text-xl font-bold text-slate-700" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {cell.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {['LOW RISK', 'MED RISK', 'HIGH RISK'].map((l) => (
                  <span key={l} className="text-2xs text-center text-slate-400 font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Queue */}
        <div className="bg-white rounded border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Next Up Queue
              </h2>
              <span className="text-2xs font-bold px-2 py-0.5 rounded text-white"
                style={{ background: '#10CFC9', fontFamily: "'IBM Plex Mono', monospace" }}>
                TOP 5 OLDEST
              </span>
            </div>
            <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={16} /></button>
          </div>

          <div className="grid grid-cols-[1fr_auto_auto] gap-2 mb-2 px-1">
            {['ID / SUBJECT', 'VALUE', 'STATUS'].map((h) => (
              <span key={h} className="text-2xs font-semibold uppercase tracking-widest text-slate-400"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{h}</span>
            ))}
          </div>

          <div className="space-y-0.5">
            {QUEUE.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate('/approvals')}
                className="w-full grid grid-cols-[1fr_auto_auto] gap-2 px-1 py-2 rounded hover:bg-slate-50 transition-colors text-left items-center"
              >
                <div>
                  <div className="text-2xs font-medium text-slate-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{item.id}</div>
                  <div className="text-xs font-medium text-slate-800">{item.subject}</div>
                </div>
                <span className="text-sm font-semibold text-slate-900 tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {item.value}
                </span>
                <span className="text-2xs font-bold px-2 py-0.5 rounded whitespace-nowrap"
                  style={{ background: item.bg, color: item.sc, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {item.status}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/approvals')}
            className="w-full mt-4 pt-3 border-t border-slate-200 text-xs font-semibold tracking-wider text-slate-500 flex items-center justify-center gap-1 hover:text-[#10CFC9] transition-colors"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            VIEW FULL QUEUE →
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
