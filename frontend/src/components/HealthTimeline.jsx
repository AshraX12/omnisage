/**
 * HealthTimeline Component.
 * 
 * Renders the chronological listing of all medical records.
 * Integrates search input, categorical filters (Labs, Prescriptions, Doctor Notes, Scans),
 * and links to details modals.
 */

import React, { useState } from 'react';
import { Search, Calendar, FileText, ClipboardList, Eye, Pill, Image as ImageIcon, Sparkles } from 'lucide-react';

// Maps categories to aesthetic icons and styling colors
const CATEGORY_MAP = {
  "Lab Report": { icon: ClipboardList, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  "Prescription": { icon: Pill, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  "Doctor Note": { icon: FileText, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  "Imaging": { icon: ImageIcon, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  "Other": { icon: Sparkles, color: "text-slate-400 bg-slate-500/10 border-slate-500/20" }
};

/**
 * Renders the clinical timeline panel.
 * 
 * @param {Object} props
 * @param {Array} props.records - Chronological list of user records.
 * @param {Function} props.onRecordSelect - Selection click handler.
 * @returns {JSX.Element} The scrollable records timeline.
 */
export default function HealthTimeline({ records, onRecordSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filterRecords = () => {
    return records.filter(record => {
      // Filter by category
      const matchCategory = selectedCategory === 'All' || record.category === selectedCategory;
      
      // Filter by search text
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = 
        record.file_name.toLowerCase().includes(searchLower) ||
        (record.doctor && record.doctor.toLowerCase().includes(searchLower)) ||
        record.diagnoses.some(d => d.toLowerCase().includes(searchLower)) ||
        (record.raw_text && record.raw_text.toLowerCase().includes(searchLower));

      return matchCategory && matchSearch;
    });
  };

  const filteredRecords = filterRecords();

  const categories = ['All', 'Lab Report', 'Prescription', 'Doctor Note', 'Imaging'];

  return (
    <div className="space-y-4">
      {/* Search and Filters Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search records, diagnoses, doctors, or lab tests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20 transition-all"
          />
        </div>

        {/* Filters Tab Row */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2.5 text-xs font-semibold rounded-xl shrink-0 transition-all border ${
                selectedCategory === cat
                  ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                  : 'bg-slate-900/30 text-slate-400 border-white/5 hover:text-slate-200'
              }`}
            >
              {cat === 'All' ? 'All Records' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Rows List */}
      <div className="space-y-3">
        {filteredRecords.map((record) => {
          const catConfig = CATEGORY_MAP[record.category] || CATEGORY_MAP["Other"];
          const IconComponent = catConfig.icon;

          return (
            <div
              key={record.id}
              onClick={() => onRecordSelect(record)}
              className="glass-card p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/20 hover:scale-[1.005] active:scale-[0.998] transition-all"
            >
              {/* Left Column details */}
              <div className="flex items-center space-x-4 min-w-0">
                <div className={`p-2.5 rounded-xl border shrink-0 ${catConfig.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                
                <div className="min-w-0 space-y-1">
                  <h4 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                    {record.file_name}
                  </h4>
                  
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-450">
                    <span className="font-semibold text-slate-350">{record.category}</span>
                    <span className="text-slate-700">•</span>
                    <span className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {record.record_date ? new Date(record.record_date).toLocaleDateString() : 'Date Unknown'}
                    </span>
                    {record.doctor && (
                      <>
                        <span className="text-slate-700">•</span>
                        <span>{record.doctor}</span>
                      </>
                    )}
                  </div>

                  {/* Badges preview for diagnoses */}
                  {record.diagnoses && record.diagnoses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {record.diagnoses.slice(0, 3).map((diag, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-0.5 bg-slate-900 border border-white/5 rounded text-[10px] text-slate-400 font-medium"
                        >
                          {diag}
                        </span>
                      ))}
                      {record.diagnoses.length > 3 && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          +{record.diagnoses.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column review status */}
              <div className="flex items-center space-x-3 shrink-0 ml-4">
                {!record.is_reviewed && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                    New / Unreviewed
                  </span>
                )}
                <div className="p-2 bg-slate-900/60 border border-white/5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all">
                  <Eye className="h-4 w-4" />
                </div>
              </div>
            </div>
          );
        })}

        {filteredRecords.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-900/10 border border-dashed border-white/5 rounded-2xl">
            <Search className="h-10 w-10 text-slate-700 mb-3" />
            <p className="text-sm font-semibold text-slate-400">No matching medical records</p>
            <p className="text-xs text-slate-600 px-6 text-center mt-1 max-w-sm leading-relaxed">
              Refine your filters, clear your search query, or upload new files to populate your timeline.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
