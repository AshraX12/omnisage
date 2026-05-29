/**
 * RecordsPage.jsx
 *
 * The "Records" tab of the Omnisage sidebar navigation.
 * Wraps the HealthTimeline component with a page header and contextual stats bar.
 */

import React from 'react';
import { ClipboardList, AlertCircle } from 'lucide-react';
import HealthTimeline from '../components/HealthTimeline';

/**
 * Records tab page — full chronological timeline with search and filters.
 *
 * @param {Object}   props
 * @param {Array}    props.records        - All user medical records.
 * @param {boolean}  props.loading        - Whether records are still loading.
 * @param {Function} props.onRecordSelect - Opens the detail modal for a record.
 * @returns {JSX.Element}
 */
export default function RecordsPage({ records, loading, onRecordSelect }) {
  const unreviewedCount = records.filter(r => !r.is_reviewed).length;

  return (
    <div className="page-content">

      {/* ── Page Header ────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon icon-blue">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">Medical Records</h1>
            <p className="page-sub">Browse, search, and manage your complete health history</p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="page-header-stats">
          <div className="page-stat">
            <span className="page-stat-value">{records.length}</span>
            <span className="page-stat-label">Total</span>
          </div>
          {unreviewedCount > 0 && (
            <div className="page-stat page-stat--alert">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400 mr-1" />
              <span className="page-stat-value text-amber-400">{unreviewedCount}</span>
              <span className="page-stat-label">Unreviewed</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Timeline ───────────────────────────────── */}
      {loading ? (
        <div className="page-loading">
          <div className="spinner" />
          <p>Retrieving your health timeline…</p>
        </div>
      ) : (
        <HealthTimeline records={records} onRecordSelect={onRecordSelect} />
      )}
    </div>
  );
}
