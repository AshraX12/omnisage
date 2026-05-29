/**
 * UploadPage.jsx
 *
 * The "Upload" tab of the Omnisage sidebar navigation.
 * Hosts the FileUploadZone with a page header, supported format badges,
 * and a persistent upload history log that accumulates during the session.
 */

import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader, FileText, Trash2 } from 'lucide-react';
import FileUploadZone from '../components/FileUploadZone';

/**
 * UploadPage — dedicated file upload and ingestion tab.
 *
 * @param {Object}   props
 * @param {Function} props.onUploadSuccess - Callback invoked when a file is parsed successfully.
 * @returns {JSX.Element}
 */
export default function UploadPage({ onUploadSuccess }) {
  /** Session upload log; each entry: { id, name, status, error } */
  const [uploadLog, setUploadLog] = useState([]);

  /**
   * Intercepts successful uploads to add them to the session log.
   * @param {Object} newRecord - The parsed record returned by the API.
   */
  const handleUploadSuccess = (newRecord) => {
    setUploadLog(prev => [{
      id: newRecord.id,
      name: newRecord.file_name,
      category: newRecord.category,
      status: 'success',
    }, ...prev]);
    if (onUploadSuccess) onUploadSuccess(newRecord);
  };

  const clearLog = () => setUploadLog([]);

  const FORMATS = [
    { ext: 'PDF', color: 'format-red' },
    { ext: 'DICOM', color: 'format-blue' },
    { ext: 'PNG', color: 'format-green' },
    { ext: 'JPG', color: 'format-yellow' },
    { ext: 'HEIC', color: 'format-purple' },
  ];

  return (
    <div className="page-content">

      {/* ── Page Header ────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon icon-blue">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">Upload Medical Records</h1>
            <p className="page-sub">Drag and drop files or browse — all formats auto-parsed by AI</p>
          </div>
        </div>
      </div>

      {/* ── Supported formats row ──────────────────── */}
      <div className="format-row">
        <span className="format-row-label">Supported formats:</span>
        {FORMATS.map(f => (
          <span key={f.ext} className={`format-badge ${f.color}`}>{f.ext}</span>
        ))}
      </div>

      {/* ── Upload Zone ────────────────────────────── */}
      <FileUploadZone onUploadSuccess={handleUploadSuccess} />

      {/* ── Session Upload Log ─────────────────────── */}
      {uploadLog.length > 0 && (
        <div className="upload-log">
          <div className="upload-log-header">
            <h3 className="upload-log-title">
              Session Upload Log
              <span className="upload-log-count">{uploadLog.length}</span>
            </h3>
            <button onClick={clearLog} className="upload-log-clear">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
            </button>
          </div>

          <div className="upload-log-list">
            {uploadLog.map((entry, i) => (
              <div key={i} className="upload-log-item">
                <div className="upload-log-item-left">
                  <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                  <div>
                    <p className="upload-log-item-name">{entry.name}</p>
                    {entry.category && (
                      <p className="upload-log-item-cat">{entry.category}</p>
                    )}
                  </div>
                </div>
                <span className={`upload-log-item-status ${
                  entry.status === 'success' ? 'status-success' : 'status-failed'
                }`}>
                  {entry.status === 'success'
                    ? <><CheckCircle className="h-3.5 w-3.5 mr-1" />Indexed</>
                    : <><AlertCircle className="h-3.5 w-3.5 mr-1" />Failed</>
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Info Cards Row ─────────────────────────── */}
      <div className="upload-info-grid">
        <div className="upload-info-card">
          <h4 className="upload-info-title">🔬 AI Parsing</h4>
          <p className="upload-info-body">
            Uploaded files are automatically processed to extract diagnoses, medications, vitals, dates, and physicians using OCR and rule-based NLP.
          </p>
        </div>
        <div className="upload-info-card">
          <h4 className="upload-info-title">🏥 DICOM Support</h4>
          <p className="upload-info-body">
            Medical imaging files (MRI, CT, X-ray) in DICOM format are stored securely and can be viewed in the built-in DICOM viewer via the Records tab.
          </p>
        </div>
        <div className="upload-info-card">
          <h4 className="upload-info-title">🔐 Privacy First</h4>
          <p className="upload-info-body">
            All files are stored locally on your server instance. No data leaves your environment unless you explicitly generate a share link.
          </p>
        </div>
      </div>

    </div>
  );
}
