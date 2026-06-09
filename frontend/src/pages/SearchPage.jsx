/**
 * SearchPage.jsx
 *
 * Semantic search page for finding medical records using natural language
 * queries. Powered by vector embeddings and cosine similarity. Includes
 * advanced filters for date range, category, and physician.
 */

import React, { useState } from 'react';
import { Search, Filter, FileText, Calendar, SlidersHorizontal } from 'lucide-react';
import { apiService } from '../services/apiService';

/**
 * Smart semantic search page component.
 *
 * @param {Object}   props
 * @param {Array}    props.records         - All records (for reference).
 * @param {Function} props.onRecordSelect  - Callback to open a record detail.
 * @returns {JSX.Element}
 */
export default function SearchPage({ records, onRecordSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    category: '',
    doctor: '',
  });

  /**
   * Handles the search form submission.
   *
   * @param {Event} e - Form submit event.
   */
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const searchFilters = {};
      if (filters.date_from) searchFilters.date_from = filters.date_from;
      if (filters.date_to) searchFilters.date_to = filters.date_to;
      if (filters.category) searchFilters.category = filters.category;
      if (filters.doctor) searchFilters.doctor = filters.doctor;

      const data = await apiService.semanticSearch(query, searchFilters);
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Handles clicking a search result to open the record.
   *
   * @param {number} recordId - The record ID to open.
   */
  const handleResultClick = (recordId) => {
    const record = records?.find(r => r.id === recordId);
    if (record && onRecordSelect) {
      onRecordSelect(record);
    }
  };

  return (
    <div className="page-content">
      {/* ── Header ── */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(59,130,246,0.10)', color: 'hsl(215,90%,60%)' }}>
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">Smart Search</h1>
            <p className="page-sub">Search your medical records using natural language</p>
          </div>
        </div>
      </div>

      {/* ── Search Input ── */}
      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <div className="search-input-wrapper">
          <Search className="h-5 w-5 search-input-icon" />
          <input
            className="search-input-lg"
            type="text"
            placeholder="e.g., blood tests related to cholesterol, MRI scans from 2024..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </form>

      {/* ── Filters Toggle ── */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', padding: '6px 14px',
            fontSize: '11px', color: '#64748b', cursor: 'pointer',
          }}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {showFilters ? 'Hide Filters' : 'Advanced Filters'}
        </button>

        {showFilters && (
          <div className="search-filters" style={{ marginTop: '12px' }}>
            <div className="search-filter-field">
              <label className="search-filter-label">From Date</label>
              <input
                type="date"
                className="search-filter-input"
                value={filters.date_from}
                onChange={(e) => setFilters(f => ({ ...f, date_from: e.target.value }))}
              />
            </div>
            <div className="search-filter-field">
              <label className="search-filter-label">To Date</label>
              <input
                type="date"
                className="search-filter-input"
                value={filters.date_to}
                onChange={(e) => setFilters(f => ({ ...f, date_to: e.target.value }))}
              />
            </div>
            <div className="search-filter-field">
              <label className="search-filter-label">Category</label>
              <select
                className="search-filter-input"
                value={filters.category}
                onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
              >
                <option value="">All Categories</option>
                <option value="Lab Report">Lab Report</option>
                <option value="Prescription">Prescription</option>
                <option value="Doctor Note">Doctor Note</option>
                <option value="Imaging">Imaging</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="search-filter-field">
              <label className="search-filter-label">Physician</label>
              <input
                type="text"
                className="search-filter-input"
                placeholder="Dr. name..."
                value={filters.doctor}
                onChange={(e) => setFilters(f => ({ ...f, doctor: e.target.value }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {isSearching ? (
        <div className="page-loading">
          <div className="spinner" />
          <p>Searching your records...</p>
        </div>
      ) : results === null ? (
        /* Initial state — tips */
        <div className="search-tips">
          <p className="search-tips-title">Search Tips</p>
          <p className="search-tip-item">Use natural language: "blood tests showing high cholesterol"</p>
          <p className="search-tip-item">Search by condition: "reports mentioning diabetes"</p>
          <p className="search-tip-item">Find by type: "MRI scans from last year"</p>
          <p className="search-tip-item">Search medications: "prescriptions for metformin"</p>
          <p className="search-tip-item">Use filters to narrow results by date, category, or physician</p>
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '40px' }}>
          <Search className="h-10 w-10" style={{ color: '#334155' }} />
          <h3 className="empty-state-title">No matching records found</h3>
          <p className="empty-state-sub">
            Try a different query or adjust your filters. Make sure records have been uploaded and indexed.
          </p>
        </div>
      ) : (
        <div className="search-results">
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </p>
          {results.map((result, i) => (
            <div
              key={i}
              className="search-result-card"
              onClick={() => handleResultClick(result.record_id)}
            >
              <div className="search-result-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText className="h-4 w-4" style={{ color: '#64748b' }} />
                  <span className="search-result-title">{result.file_name}</span>
                </div>
                <div className="search-result-badges">
                  <span className="search-match-badge">
                    {Math.round(result.similarity_score * 100)}% match
                  </span>
                  <span className="search-cat-badge">{result.category}</span>
                </div>
              </div>
              <div className="search-excerpt">{result.chunk_text}</div>
              {result.record_date && (
                <div className="search-result-date">
                  <Calendar className="h-3 w-3" style={{ display: 'inline', marginRight: '4px' }} />
                  {result.record_date}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
