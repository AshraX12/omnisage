/**
 * AnalyticsPage.jsx
 *
 * The "Analytics" tab of the Omnisage sidebar navigation.
 * Wraps the VitalsChart component and adds a summary grid of all tracked
 * vital metrics with their most recent readings and status indicators.
 */

import React from 'react';
import { TrendingUp, Activity } from 'lucide-react';
import VitalsChart from '../components/VitalsChart';

/**
 * AnalyticsPage — biometrics trends tab.
 *
 * @param {Object}  props
 * @param {Array}   props.records - All user medical records.
 * @param {boolean} props.loading - Whether records are still loading.
 * @returns {JSX.Element}
 */
export default function AnalyticsPage({ records, loading }) {
  /* Collect one latest reading per unique vital metric */
  const latestByMetric = (() => {
    const map = {};
    [...records].reverse().forEach(r => {
      (r.vitals || []).forEach(v => {
        if (!map[v.metric]) map[v.metric] = { ...v, date: r.record_date };
      });
    });
    return Object.values(map);
  })();

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading analytics data…</p>
      </div>
    );
  }

  return (
    <div className="page-content">

      {/* ── Page Header ────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon icon-violet">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">Health Analytics</h1>
            <p className="page-sub">Track biometric trends over time from your uploaded records</p>
          </div>
        </div>
      </div>

      {/* ── Current Vitals Summary ──────────────────── */}
      {latestByMetric.length > 0 && (
        <div className="analytics-vitals-grid">
          {latestByMetric.map((vit, i) => (
            <div key={i} className="analytics-vital-card">
              <div className="analytics-vital-header">
                <span className="analytics-vital-metric">{vit.metric}</span>
                <span className={`analytics-vital-status ${
                  vit.status === 'Normal' ? 'status-normal' : 'status-alert'
                }`}>
                  {vit.status || 'Normal'}
                </span>
              </div>
              <p className="analytics-vital-value">
                {vit.value}
                <span className="analytics-vital-unit"> {vit.unit}</span>
              </p>
              {vit.date && (
                <p className="analytics-vital-date">
                  As of {new Date(vit.date).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Main Chart ─────────────────────────────── */}
      <VitalsChart records={records} />

      {records.length === 0 && (
        <div className="empty-state mt-4">
          <Activity className="h-10 w-10 text-slate-700 mb-3" />
          <p className="empty-state-title">No analytics data available</p>
          <p className="empty-state-sub">
            Upload digital lab reports or clinical notes to automatically extract and chart your biometric data.
          </p>
        </div>
      )}
    </div>
  );
}
