/**
 * SecureShareModal Component.
 * 
 * Renders a consent-sharing dashboard.
 * Allows users to choose specific records, set expiration timers, input access
 * passcodes, and generate an expiring guest access URL.
 */

import React, { useState } from 'react';
import { X, Shield, Calendar, Key, Link as LinkIcon, Check, Copy } from 'lucide-react';
import { apiService } from '../services/apiService';

/**
 * Renders a sharing link configuration modal.
 * 
 * @param {Object} props
 * @param {Array} props.records - Chronological list of all available records.
 * @param {Function} props.onClose - Close action handler.
 * @returns {JSX.Element} The secure share link generator panel.
 */
export default function SecureShareModal({ records, onClose }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [expiryHours, setExpiryHours] = useState(24);
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    setSelectedIds(records.map(r => r.id));
  };

  const selectNone = () => {
    setSelectedIds([]);
  };

  const handleGenerate = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one record to share.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.generateShareLink(
        selectedIds,
        expiryHours,
        passcode
      );
      
      // Construct the frontend guest URL matching the host location
      const shareUrl = `${window.location.origin}/share/${response.id}`;
      setGeneratedUrl(shareUrl);
      setLoading(false);
    } catch (err) {
      alert("Failed to generate link: " + (err.response?.data?.detail || err.message));
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl glass-panel flex flex-col h-[85vh] max-h-[600px] overflow-hidden shadow-2xl animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-primary-500/10 border border-primary-500/20 text-primary-500 rounded-xl">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Temporary Health Share</h3>
              <p className="text-xs text-slate-400">Generate secure, expiring links for clinical consults</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 min-h-0 bg-slate-900/10">
          {!generatedUrl ? (
            <>
              {/* Step 1: Select Records */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Step 1: Choose Records to Share ({selectedIds.length} selected)
                  </h4>
                  <div className="flex space-x-2 text-[10px] font-bold uppercase text-primary-500">
                    <button onClick={selectAll} className="hover:underline">Select All</button>
                    <span>•</span>
                    <button onClick={selectNone} className="hover:underline">Clear</button>
                  </div>
                </div>

                <div className="border border-white/5 rounded-xl bg-slate-950/60 max-h-48 overflow-y-auto divide-y divide-white/5 p-1.5">
                  {records.map(record => (
                    <div 
                      key={record.id}
                      onClick={() => toggleSelect(record.id)}
                      className={`flex items-center space-x-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                        selectedIds.includes(record.id) 
                          ? 'bg-primary-500/5 border border-primary-500/10' 
                          : 'hover:bg-slate-900/50 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(record.id)}
                        onChange={() => {}} // Controlled by row click
                        className="rounded border-slate-700 text-primary-500 focus:ring-primary-500/20 h-4 w-4 bg-slate-900"
                      />
                      <div className="truncate text-xs">
                        <p className="font-medium text-slate-200 truncate">{record.file_name}</p>
                        <p className="text-[10px] text-slate-400">
                          {record.category} | {record.record_date ? new Date(record.record_date).toLocaleDateString() : 'No Date'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {records.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-6 italic">No records to select.</p>
                  )}
                </div>
              </div>

              {/* Step 2: Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Expiry Hours */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>Link Expiration</span>
                  </label>
                  <select
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value="1">1 Hour</option>
                    <option value="4">4 Hours</option>
                    <option value="12">12 Hours</option>
                    <option value="24">24 Hours (1 Day)</option>
                    <option value="72">72 Hours (3 Days)</option>
                    <option value="168">168 Hours (7 Days)</option>
                  </select>
                </div>

                {/* Passcode Protection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Key className="h-4 w-4" />
                    <span>Passcode Lock (Optional)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter security code"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || selectedIds.length === 0}
                className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-semibold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                {loading ? "Generating Safe Token..." : "Generate Shared Link"}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center animate-fade-in">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full animate-bounce">
                <Shield className="h-10 w-10" />
              </div>
              
              <div>
                <h4 className="text-lg font-bold text-white mb-1.5">Shared Link Created</h4>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  Provide the link below to your clinician. It will expire in{' '}
                  <strong className="text-white">{expiryHours} hours</strong>. 
                  {passcode && " The recipient will need the passcode to unlock access."}
                </p>
              </div>

              {/* Copy URL Zone */}
              <div className="w-full max-w-md flex bg-slate-950 border border-white/10 rounded-xl overflow-hidden p-1.5">
                <input
                  type="text"
                  readOnly
                  value={generatedUrl}
                  className="bg-transparent border-none text-xs text-slate-350 focus:outline-none flex-1 px-3 py-2 select-all font-mono"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white font-medium text-xs transition-all flex items-center space-x-1.5 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => setGeneratedUrl(null)}
                className="text-xs text-slate-400 hover:text-white underline transition-all"
              >
                Create Another Link
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
