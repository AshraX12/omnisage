/**
 * SharePage.jsx
 *
 * The "Share" tab of the Omnisage sidebar navigation.
 * Renders the secure share-link generator as a full inline page
 * (not a modal), allowing users to select records, configure expiry,
 * set a passcode, and generate a shareable guest URL.
 */

import React, { useState } from 'react';
import {
  Share2, Shield, Calendar, Key, Copy, Check,
  ClipboardList, FileText, Pill, Image as ImageIcon, Sparkles,
  AlertCircle,
} from 'lucide-react';
import { apiService } from '../services/apiService';

const CATEGORY_STYLE = {
  'Lab Report':   'text-blue-400   bg-blue-500/10   border-blue-500/20',
  'Prescription': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Doctor Note':  'text-violet-400 bg-violet-500/10 border-violet-500/20',
  'Imaging':      'text-amber-400  bg-amber-500/10  border-amber-500/20',
  'Other':        'text-slate-400  bg-slate-500/10  border-slate-500/20',
};
const CATEGORY_ICON = {
  'Lab Report': ClipboardList, 'Prescription': Pill,
  'Doctor Note': FileText, 'Imaging': ImageIcon, 'Other': Sparkles,
};

/**
 * SharePage — full-page secure clinical share link generator.
 *
 * @param {Object} props
 * @param {Array}  props.records - All available medical records.
 * @returns {JSX.Element}
 */
export default function SharePage({ records }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [expiryHours, setExpiryHours] = useState(24);
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  /** Toggle a record id in/out of the selection */
  const toggle = (id) =>
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const handleGenerate = async () => {
    if (selectedIds.length === 0) {
      setError('Select at least one record to share.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.generateShareLink(selectedIds, expiryHours, passcode || undefined);
      setGeneratedUrl(`${window.location.origin}/share/${res.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate link.');
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setGeneratedUrl(null);
    setSelectedIds([]);
    setPasscode('');
    setError(null);
  };

  return (
    <div className="page-content">

      {/* ── Page Header ────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon icon-emerald">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">Secure Clinical Share</h1>
            <p className="page-sub">Generate temporary, passcode-protected links for clinician consultations</p>
          </div>
        </div>
      </div>

      {generatedUrl ? (
        /* ── Success State ─────────────────────────── */
        <div className="share-success">
          <div className="share-success-icon">
            <Shield className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="share-success-title">Shared Link Ready</h2>
          <p className="share-success-sub">
            Share this link with your clinician. It expires in&nbsp;
            <strong>{expiryHours} hour{expiryHours !== 1 ? 's' : ''}</strong>.
            {passcode && ' The recipient will need your passcode to unlock it.'}
          </p>

          <div className="share-url-row">
            <input
              readOnly
              value={generatedUrl}
              className="share-url-input"
              onFocus={e => e.target.select()}
            />
            <button onClick={copyUrl} className="share-url-copy">
              {copied
                ? <><Check className="h-4 w-4 mr-1.5" />Copied</>
                : <><Copy className="h-4 w-4 mr-1.5" />Copy</>
              }
            </button>
          </div>

          <button onClick={reset} className="share-reset-btn">
            Create another link
          </button>
        </div>
      ) : (
        /* ── Configuration Form ──────────────────────── */
        <div className="share-form-grid">

          {/* Left: record picker */}
          <div className="share-panel">
            <div className="share-panel-header">
              <h3 className="share-panel-title">
                <span>Select Records</span>
                <span className="share-selected-count">{selectedIds.length} selected</span>
              </h3>
              <div className="share-quick-btns">
                <button onClick={() => setSelectedIds(records.map(r => r.id))}>All</button>
                <span>·</span>
                <button onClick={() => setSelectedIds([])}>None</button>
              </div>
            </div>

            {records.length === 0 ? (
              <div className="empty-state">
                <AlertCircle className="h-8 w-8 text-slate-700 mb-2" />
                <p className="empty-state-title">No records to share</p>
                <p className="empty-state-sub">Upload medical files first.</p>
              </div>
            ) : (
              <div className="share-record-list">
                {records.map(record => {
                  const catStyle = CATEGORY_STYLE[record.category] || CATEGORY_STYLE['Other'];
                  const Icon = CATEGORY_ICON[record.category] || Sparkles;
                  const selected = selectedIds.includes(record.id);
                  return (
                    <div
                      key={record.id}
                      onClick={() => toggle(record.id)}
                      className={`share-record-item ${selected ? 'share-record-item--selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={selected}
                        className="share-checkbox"
                      />
                      <div className={`share-record-icon ${catStyle}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="share-record-info">
                        <p className="share-record-name">{record.file_name}</p>
                        <p className="share-record-meta">
                          {record.category}
                          {record.record_date && ` · ${new Date(record.record_date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: settings + generate */}
          <div className="share-settings">
            <div className="share-panel">
              <h3 className="share-panel-title">Link Settings</h3>

              <div className="share-field">
                <label className="share-label">
                  <Calendar className="h-3.5 w-3.5" /> Expiration
                </label>
                <select
                  value={expiryHours}
                  onChange={e => setExpiryHours(+e.target.value)}
                  className="share-select"
                >
                  <option value="1">1 Hour</option>
                  <option value="4">4 Hours</option>
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours (1 Day)</option>
                  <option value="72">3 Days</option>
                  <option value="168">7 Days</option>
                </select>
              </div>

              <div className="share-field">
                <label className="share-label">
                  <Key className="h-3.5 w-3.5" /> Passcode Lock
                  <span className="share-optional">(Optional)</span>
                </label>
                <input
                  type="password"
                  placeholder="Set a security code"
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  className="share-input"
                />
              </div>
            </div>

            {/* Info cards */}
            <div className="share-info-card">
              <Shield className="h-4 w-4 text-primary-500 shrink-0 mt-0.5" />
              <p>Links are read-only and automatically expire. The recipient cannot modify or download your records unless you enable it.</p>
            </div>

            {error && (
              <div className="share-error">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || selectedIds.length === 0}
              className="share-generate-btn"
            >
              {loading
                ? <><div className="spinner-sm" />Generating…</>
                : <><Share2 className="h-4 w-4 mr-2" />Generate Secure Link</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
