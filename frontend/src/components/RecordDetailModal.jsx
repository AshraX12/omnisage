/**
 * RecordDetailModal Component.
 * 
 * Renders a full details drawer/modal for a medical record.
 * Displays extracted clinical findings (vitals, prescriptions, diagnoses),
 * raw text payload, and integrates a terminology translator (health glossary).
 * If the record is a DICOM scan, mounts the DicomViewer component.
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, User, FileText, Plus, Info, HelpCircle, Save, Trash2, Heart, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import DicomViewer from './DicomViewer';
import { apiService } from '../services/apiService';

// Dictionary translating clinical codes and names to plain layman explanations
const GLOSSARY = {
  "vitamin d": "Essential for bone health and immune support. Recommended range is 30-100 ng/mL. Deficiencies can lead to weak bones and fatigue.",
  "total cholesterol": "Total fat circulating in the blood. Desirable level is below 200 mg/dL. Elevated levels can increase cardiovascular risk.",
  "ldl cholesterol": "Commonly known as 'bad' cholesterol. Can build plaque in blood vessel walls. Desirable level is below 100 mg/dL.",
  "hdl cholesterol": "Commonly known as 'good' cholesterol. Cleans lipids from blood vessels and routes them to the liver. Recommended is above 40 mg/dL.",
  "fasting glucose": "Blood sugar concentration after fasting. Normal is 70-90 mg/dL. 100-125 mg/dL indicates prediabetes; 126+ mg/dL indicates diabetes.",
  "hemoglobin": "Protein in red blood cells that transports oxygen from lungs to tissue. Ranges: 13.8-17.2 g/dL (men), 12.1-15.1 g/dL (women). Low signifies anemia.",
  "hypertension": "Chronic high blood pressure, typically diagnosed at 130/80 mmHg or higher. Strain on arteries can lead to cardiovascular disease.",
  "hyperlipidemia": "High concentration of fats (cholesterol and triglycerides) in the bloodstream, contributing to clogged arteries.",
  "gerd": "Gastroesophageal Reflux Disease. Chronic acid reflux where stomach acid consistently backs up into the esophagus.",
  "anemia": "Condition characterized by a deficiency of red blood cells or hemoglobin, leading to fatigue and paleness."
};

/**
 * Renders a details editor and view modal for a medical record.
 * 
 * @param {Object} props
 * @param {Object} props.record - The medical record object.
 * @param {Function} props.onClose - Close action handler.
 * @param {Function} props.onUpdate - Callback invoked when a record is successfully saved or deleted.
 * @returns {JSX.Element} The record modal UI.
 */
export default function RecordDetailModal({ record, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [isEditing, setIsEditing] = useState(false);
  const [glossaryTerm, setGlossaryTerm] = useState(null);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // Load AI summary when AI Summary tab is selected
  useEffect(() => {
    if (activeTab === 'ai-summary') {
      loadAiSummary();
    }
  }, [activeTab, record.id]);

  const loadAiSummary = async () => {
    try {
      const data = await apiService.getSummary(record.id);
      setAiSummary(data);
      setSummaryError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setAiSummary(null); // No summary yet
      } else {
        setSummaryError('Failed to load summary');
      }
    }
  };

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await apiService.generateSummary(record.id);
      setAiSummary(data);
    } catch (err) {
      setSummaryError(err.response?.data?.detail || 'Failed to generate summary. Is Ollama running?');
    } finally {
      setSummaryLoading(false);
    }
  };
  
  // Local edit states
  const [category, setCategory] = useState(record.category);
  const [doctor, setDoctor] = useState(record.doctor || '');
  const [recordDate, setRecordDate] = useState(record.record_date || '');

  // Lists edit states
  const [diagnoses, setDiagnoses] = useState([...record.diagnoses]);
  const [newDiagnosis, setNewDiagnosis] = useState('');

  const handleAddDiagnosis = () => {
    if (newDiagnosis.trim()) {
      setDiagnoses([...diagnoses, newDiagnosis.trim()]);
      setNewDiagnosis('');
    }
  };

  const handleRemoveDiagnosis = (idx) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    try {
      const payload = {
        category,
        doctor: doctor || null,
        record_date: recordDate || null,
        diagnoses,
        is_reviewed: true
      };

      const updatedRecord = await apiService.updateRecord(record.id, payload);
      if (onUpdate) onUpdate(updatedRecord);
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update record: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently delete this medical record?")) {
      try {
        await apiService.deleteRecord(record.id);
        if (onUpdate) onUpdate(null); // Triggers list removal
        onClose();
      } catch (err) {
        alert("Failed to delete record: " + err.message);
      }
    }
  };

  // Inspect and lookup medical terms for patient education
  const handleTermLookup = (term) => {
    const cleanTerm = term.trim().toLowerCase();
    const definition = GLOSSARY[cleanTerm];
    if (definition) {
      setGlossaryTerm({ name: term, text: definition });
    } else {
      setGlossaryTerm({ 
        name: term, 
        text: "This specific term is not in our offline glossary. Consult with your physician for a detailed clinical definition." 
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl glass-panel flex flex-col h-[90vh] max-h-[700px] overflow-hidden shadow-2xl animate-fade-in">
        
        {/* Header Section */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50 shrink-0">
          <div className="flex items-center space-x-3 max-w-[80%]">
            <div className="p-2 bg-slate-800 rounded-lg text-primary-500 font-bold text-xs shrink-0 uppercase">
              {record.file_type}
            </div>
            <div className="truncate">
              <h3 className="text-base font-semibold text-white truncate">{record.file_name}</h3>
              <p className="text-xs text-slate-400">
                Uploaded {new Date(record.uploaded_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Outer Grid (Sidebar + Content) */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Left Sidebar controls */}
          <div className="w-48 bg-slate-900/30 border-r border-white/5 p-4 flex flex-col justify-between shrink-0">
            <div className="space-y-1.5">
              <button
                onClick={() => setActiveTab('summary')}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'summary' 
                    ? 'bg-primary-500 text-white' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                Structured Summary
              </button>
              {record.file_type === 'dcm' && (
                <button
                  onClick={() => setActiveTab('dicom')}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'dicom' 
                      ? 'bg-primary-500 text-white' 
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  DICOM Imaging
                </button>
              )}
              <button
                onClick={() => setActiveTab('raw')}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'raw' 
                    ? 'bg-primary-500 text-white' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                Raw Extracted Text
              </button>
              <button
                onClick={() => setActiveTab('ai-summary')}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'ai-summary' 
                    ? 'bg-primary-500 text-white' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                AI Summary
              </button>
            </div>

            <div className="space-y-2">
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Edits</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-2 bg-slate-850 hover:bg-slate-800 border border-white/10 text-slate-200 text-xs font-semibold rounded-lg transition-all"
                >
                  Edit Records
                </button>
              )}
              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center space-x-1.5 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/10 text-rose-300 text-xs font-semibold rounded-lg transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Record</span>
              </button>
            </div>
          </div>

          {/* Right Main Body Content */}
          <div className="flex-1 p-6 overflow-y-auto min-h-0 bg-slate-900/10">
            
            {activeTab === 'summary' && (
              <div className="space-y-6">
                
                {/* Meta details form card */}
                <div className="glass-card p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Category</span>
                    {isEditing ? (
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value="Lab Report">Lab Report</option>
                        <option value="Prescription">Prescription</option>
                        <option value="Doctor Note">Doctor Note</option>
                        <option value="Imaging">Imaging</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-sm font-semibold text-white">{category}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Date of Record</span>
                    {isEditing ? (
                      <input
                        type="date"
                        value={recordDate}
                        onChange={(e) => setRecordDate(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white"
                      />
                    ) : (
                      <p className="text-sm text-slate-200">
                        {recordDate ? new Date(recordDate).toLocaleDateString() : 'N/A'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Physician / Provider</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={doctor}
                        onChange={(e) => setDoctor(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white"
                      />
                    ) : (
                      <p className="text-sm text-slate-200">{doctor || 'N/A'}</p>
                    )}
                  </div>
                </div>

                {/* Extracted Biometrics (Vitals) */}
                {record.vitals && record.vitals.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Heart className="h-3.5 w-3.5 text-rose-500" />
                      <span>Extracted Biometrics</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {record.vitals.map((vit, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleTermLookup(vit.metric)}
                          className="glass-card p-3 flex flex-col justify-between hover:scale-[1.01] cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-xs text-slate-400 font-medium truncate flex items-center space-x-1">
                              <span>{vit.metric}</span>
                              <Info className="h-3 w-3 text-slate-600" />
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              vit.status?.toLowerCase() === 'high' || vit.status?.toLowerCase() === 'low'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {vit.status || 'Normal'}
                            </span>
                          </div>
                          <p className="text-lg font-bold text-white mt-1.5 font-mono">
                            {vit.value} <span className="text-xs font-sans text-slate-400 font-normal">{vit.unit}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Medications */}
                {record.medications && record.medications.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Extracted Medications
                    </h4>
                    <div className="space-y-2">
                      {record.medications.map((med, idx) => (
                        <div 
                          key={idx}
                          onClick={() => handleTermLookup(med.name)}
                          className="glass-card p-3 flex justify-between items-center hover:bg-slate-800/30 cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-2 w-2 rounded-full bg-primary-500" />
                            <div>
                              <p className="text-sm font-semibold text-white flex items-center space-x-1">
                                <span>{med.name}</span>
                                <Info className="h-3 w-3 text-slate-600" />
                              </p>
                              <p className="text-xs text-slate-400">{med.dosage}</p>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg">
                            {med.frequency}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Diagnoses Panel */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Extracted Conditions / Diagnoses
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {diagnoses.map((diag, idx) => (
                      <span 
                        key={idx}
                        onClick={() => handleTermLookup(diag)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-white/5 rounded-full text-xs text-slate-200 cursor-pointer hover:border-primary-500/20"
                      >
                        <span>{diag}</span>
                        <Info className="h-3 w-3 text-slate-500" />
                        {isEditing && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveDiagnosis(idx); }}
                            className="text-slate-500 hover:text-rose-400 ml-1 text-[10px]"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                    {isEditing && (
                      <div className="inline-flex items-center bg-slate-900 border border-white/10 rounded-full px-2 py-0.5 text-xs text-white">
                        <input
                          type="text"
                          placeholder="Add Diagnosis"
                          value={newDiagnosis}
                          onChange={(e) => setNewDiagnosis(e.target.value)}
                          className="bg-transparent border-none focus:outline-none text-xs w-24 py-0.5"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddDiagnosis()}
                        />
                        <button onClick={handleAddDiagnosis} className="text-primary-500 hover:text-white p-0.5">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {diagnoses.length === 0 && !isEditing && (
                      <p className="text-xs text-slate-500 italic">No clinical diagnoses identified.</p>
                    )}
                  </div>
                </div>

                {/* Patient Glossary Translation Popover */}
                {glossaryTerm && (
                  <div className="bg-primary-500/5 border border-primary-500/20 p-4 rounded-xl space-y-1.5 animate-fade-in shrink-0 relative">
                    <button 
                      onClick={() => setGlossaryTerm(null)}
                      className="absolute top-3 right-3 text-xs text-slate-500 hover:text-slate-300"
                    >
                      Dismiss
                    </button>
                    <h5 className="text-xs font-bold text-primary-500 flex items-center space-x-1.5">
                      <HelpCircle className="h-4 w-4" />
                      <span>Understanding "{glossaryTerm.name}"</span>
                    </h5>
                    <p className="text-xs text-slate-350 leading-relaxed">
                      {glossaryTerm.text}
                    </p>
                  </div>
                )}

              </div>
            )}

            {activeTab === 'dicom' && record.file_type === 'dcm' && (
              <div className="h-full">
                <DicomViewer record={record} />
              </div>
            )}

            {activeTab === 'raw' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 bg-slate-950 p-4 border border-white/5 rounded-xl overflow-auto text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[360px]">
                  {record.raw_text || "No raw text content extracted for this record."}
                </div>
              </div>
            )}

            {activeTab === 'ai-summary' && (
              <div className="ai-summary">
                {summaryLoading ? (
                  <div className="ai-summary-loading">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(215,90%,60%)' }} />
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '12px' }}>Analyzing document with AI...</p>
                    <p style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>This may take 15-30 seconds</p>
                  </div>
                ) : summaryError ? (
                  <div className="ai-summary-error">
                    <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '12px' }}>{summaryError}</p>
                    <button onClick={handleGenerateSummary} className="ai-generate-btn">
                      Try Again
                    </button>
                  </div>
                ) : !aiSummary ? (
                  <div className="ai-summary-empty">
                    <Sparkles className="h-10 w-10" style={{ color: '#334155' }} />
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginTop: '12px' }}>
                      No AI summary generated yet
                    </p>
                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', maxWidth: '300px', textAlign: 'center' }}>
                      Generate an AI-powered summary to quickly understand key findings, abnormal results, and recommendations.
                    </p>
                    <button onClick={handleGenerateSummary} className="ai-generate-btn" style={{ marginTop: '16px' }}>
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate AI Summary
                    </button>
                  </div>
                ) : (
                  <div className="ai-summary-content">
                    {/* Overview */}
                    <div className="ai-summary-section">
                      <h4 className="ai-summary-title">Overview</h4>
                      <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.7 }}>
                        {aiSummary.summary_text}
                      </p>
                    </div>

                    {/* Key Findings */}
                    {aiSummary.key_findings?.length > 0 && (
                      <div className="ai-summary-section">
                        <h4 className="ai-summary-title">Key Findings</h4>
                        <ul className="ai-summary-list">
                          {aiSummary.key_findings.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Abnormal Results */}
                    {aiSummary.abnormal_results?.length > 0 && (
                      <div className="ai-summary-section">
                        <h4 className="ai-summary-title">Abnormal Results</h4>
                        <div className="ai-abnormal-grid">
                          {aiSummary.abnormal_results.map((r, i) => (
                            <div key={i} className="ai-abnormal-card">
                              <span className="ai-abnormal-metric">{r.metric}</span>
                              <span className="ai-abnormal-value">{r.value}</span>
                              <span className={`ai-abnormal-status ai-abnormal-status--${(r.status || '').toLowerCase()}`}>
                                {r.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medications */}
                    {aiSummary.medications?.length > 0 && (
                      <div className="ai-summary-section">
                        <h4 className="ai-summary-title">Medications</h4>
                        <table className="ai-med-table">
                          <thead>
                            <tr>
                              <th>Medication</th>
                              <th>Dosage</th>
                              <th>Frequency</th>
                            </tr>
                          </thead>
                          <tbody>
                            {aiSummary.medications.map((m, i) => (
                              <tr key={i}>
                                <td>{m.name}</td>
                                <td>{m.dosage || '—'}</td>
                                <td>{m.frequency || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Follow-ups */}
                    {aiSummary.follow_ups?.length > 0 && (
                      <div className="ai-summary-section">
                        <h4 className="ai-summary-title">Recommended Follow-ups</h4>
                        <ul className="ai-summary-list">
                          {aiSummary.follow_ups.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Regenerate + Attribution */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <button onClick={handleGenerateSummary} className="ai-regen-btn">
                        <RefreshCw className="h-3 w-3" />
                        Regenerate
                      </button>
                      <span className="ai-attribution">
                        <Sparkles className="h-3 w-3" />
                        Generated by {aiSummary.model_used}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
