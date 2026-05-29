/**
 * DashboardPage.jsx
 *
 * The landing tab of the Omnisage application.
 * Displays a health summary hero, stat cards for records/diagnoses/vitals,
 * the most recent three records as a quick-access list, and a condensed
 * latest-vitals snapshot grid.
 */

import React from 'react';
import {
  ClipboardList,
  Activity,
  Heart,
  AlertCircle,
  Calendar,
  FileText,
  Pill,
  Image as ImageIcon,
  Sparkles,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

/** Shared category → color mapping used across tabs */
const CATEGORY_STYLE = {
  'Lab Report':   'text-blue-400   bg-blue-500/10   border-blue-500/20',
  'Prescription': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Doctor Note':  'text-violet-400 bg-violet-500/10 border-violet-500/20',
  'Imaging':      'text-amber-400  bg-amber-500/10  border-amber-500/20',
  'Other':        'text-slate-400  bg-slate-500/10  border-slate-500/20',
};
const CATEGORY_ICON = {
  'Lab Report':   ClipboardList,
  'Prescription': Pill,
  'Doctor Note':  FileText,
  'Imaging':      ImageIcon,
  'Other':        Sparkles,
};

/**
 * DashboardPage — overview tab with stats, recent records, and vitals snapshot.
 *
 * @param {Object}   props
 * @param {Array}    props.records       - All user medical records.
 * @param {boolean}  props.loading       - Whether records are still fetching.
 * @param {Function} props.onRecordSelect - Opens the detail modal for a record.
 * @param {Function} props.onTabChange   - Navigates to another sidebar tab.
 * @returns {JSX.Element}
 */
export default function DashboardPage({ records, loading, onRecordSelect, onTabChange }) {
  /* ── Computed stats ─────────────────────────────── */
  const totalRecords      = records.length;
  const allDiagnoses      = [...new Set(records.flatMap(r => r.diagnoses))];
  const allVitalMetrics   = [...new Set(records.flatMap(r => r.vitals.map(v => v.metric)))];
  const unreviewedCount   = records.filter(r => !r.is_reviewed).length;

  /* Latest vitals snapshot: collect last reading for each unique metric */
  const latestVitals = (() => {
    const map = {};
    [...records].reverse().forEach(r => {
      r.vitals.forEach(v => {
        if (!map[v.metric]) map[v.metric] = { ...v, date: r.record_date };
      });
    });
    return Object.values(map).slice(0, 6);
  })();

  /* Recent records (newest 3) */
  const recentRecords = records.slice(0, 3);

  /* ── Stat card helper ───────────────────────────── */
  const StatCard = ({ icon: Icon, iconClass, value, label, sub }) => (
    <div className="stat-card">
      <div className={`stat-card-icon ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="stat-card-body">
        <p className="stat-card-value">{value}</p>
        <p className="stat-card-label">{label}</p>
        {sub && <p className="stat-card-sub">{sub}</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading your health dashboard…</p>
      </div>
    );
  }

  return (
    <div className="page-content">

      {/* ── Hero greeting ──────────────────────────── */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-text">
          <div className="hero-badge">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            Centralized Medical Ledger
          </div>
          <h1 className="hero-title">
            Good {getTimeGreeting()},&nbsp;
            <span className="hero-name">Alex</span>
          </h1>
          <p className="hero-sub">
            Your complete health history is secured and indexed. Here's your at-a-glance summary.
          </p>
        </div>
        <div className="hero-glow" />
      </div>

      {/* ── Stat Cards ─────────────────────────────── */}
      <div className="stats-grid">
        <StatCard
          icon={ClipboardList}
          iconClass="icon-blue"
          value={totalRecords}
          label="Total Records"
          sub={unreviewedCount > 0 ? `${unreviewedCount} unreviewed` : 'All reviewed'}
        />
        <StatCard
          icon={Activity}
          iconClass="icon-emerald"
          value={allDiagnoses.length}
          label="Conditions Tracked"
        />
        <StatCard
          icon={Heart}
          iconClass="icon-rose"
          value={allVitalMetrics.length}
          label="Vitals Monitored"
        />
        <StatCard
          icon={TrendingUp}
          iconClass="icon-violet"
          value={records.filter(r => r.vitals?.length > 0).length}
          label="Records with Data"
        />
      </div>

      {/* ── Bottom two columns ─────────────────────── */}
      <div className="dashboard-bottom">

        {/* Recent Records */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recent Records</h2>
            <button
              onClick={() => onTabChange('records')}
              className="section-link"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentRecords.length === 0 ? (
            <div className="empty-state">
              <ClipboardList className="h-10 w-10 text-slate-700 mb-3" />
              <p className="empty-state-title">No records yet</p>
              <p className="empty-state-sub">Upload your first medical document to get started.</p>
              <button
                onClick={() => onTabChange('upload')}
                className="btn-primary mt-4"
              >
                Upload Records
              </button>
            </div>
          ) : (
            <div className="recent-list">
              {recentRecords.map(record => {
                const style = CATEGORY_STYLE[record.category] || CATEGORY_STYLE['Other'];
                const Icon  = CATEGORY_ICON[record.category]  || Sparkles;
                return (
                  <div
                    key={record.id}
                    onClick={() => onRecordSelect(record)}
                    className="recent-item"
                  >
                    <div className={`recent-item-icon ${style}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="recent-item-body">
                      <p className="recent-item-name">{record.file_name}</p>
                      <p className="recent-item-meta">
                        {record.category}
                        {record.record_date && (
                          <>
                            &nbsp;·&nbsp;
                            <Calendar className="inline h-3 w-3 mr-0.5" />
                            {new Date(record.record_date).toLocaleDateString()}
                          </>
                        )}
                      </p>
                    </div>
                    {!record.is_reviewed && (
                      <span className="badge-new">New</span>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-600 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Vitals Snapshot */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Latest Vitals Snapshot</h2>
            <button
              onClick={() => onTabChange('analytics')}
              className="section-link"
            >
              Analytics <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {latestVitals.length === 0 ? (
            <div className="empty-state">
              <Activity className="h-10 w-10 text-slate-700 mb-3" />
              <p className="empty-state-title">No vitals extracted yet</p>
              <p className="empty-state-sub">Upload lab reports or clinical notes to automatically extract biometric data.</p>
            </div>
          ) : (
            <div className="vitals-snapshot-grid">
              {latestVitals.map((vit, i) => (
                <div key={i} className="vital-tile">
                  <p className="vital-tile-label">{vit.metric}</p>
                  <p className="vital-tile-value">
                    {vit.value}
                    <span className="vital-tile-unit">{vit.unit}</span>
                  </p>
                  <span className={`vital-tile-status ${
                    vit.status === 'Normal' ? 'status-normal' : 'status-alert'
                  }`}>
                    {vit.status || 'Normal'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

/** Returns "Morning" / "Afternoon" / "Evening" based on local time */
function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}
