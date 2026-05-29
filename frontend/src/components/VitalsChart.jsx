/**
 * VitalsChart Component.
 * 
 * Aggregates clinical lab vitals (glucose, cholesterol, vitamin D, blood pressure)
 * from a list of records and visualizes their historical trends using Recharts.
 */

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Activity, TrendingUp } from 'lucide-react';

/**
 * Renders analytical charts for clinical vitals and biometrics.
 * 
 * @param {Object} props
 * @param {Array} props.records - List of parsed medical record objects from the database.
 * @returns {JSX.Element} The biometrics visual analytics panel.
 */
export default function VitalsChart({ records }) {
  const [selectedMetric, setSelectedMetric] = useState('Vitamin D');

  // Aggregates vitals data points across all medical records
  const aggregateData = () => {
    const points = [];

    records.forEach(record => {
      if (!record.vitals || !record.record_date) return;
      
      // Find the specific metric
      const match = record.vitals.find(
        v => v.metric.toLowerCase() === selectedMetric.toLowerCase()
      );

      if (match) {
        points.push({
          date: record.record_date,
          displayDate: new Date(record.record_date).toLocaleDateString(undefined, { 
            month: 'short', 
            year: 'numeric' 
          }),
          value: parseFloat(match.value),
          unit: match.unit
        });
      }
    });

    // Sort data points chronologically
    return points.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const chartData = aggregateData();

  // Metrics definitions for threshold reference lines
  const thresholdMap = {
    'Vitamin D': { min: 30, max: 100, unit: 'ng/mL' },
    'Total Cholesterol': { min: 0, max: 200, unit: 'mg/dL' },
    'Fasting Glucose': { min: 70, max: 100, unit: 'mg/dL' },
    'Hemoglobin': { min: 13.8, max: 17.2, unit: 'g/dL' }
  };

  const thresholds = thresholdMap[selectedMetric];

  // List of available metrics in the active dataset
  const availableMetrics = ['Vitamin D', 'Total Cholesterol', 'Fasting Glucose', 'Hemoglobin'];

  return (
    <div className="glass-panel p-6 space-y-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary-500/10 border border-primary-500/20 text-primary-500 rounded-xl">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Biometrics Analytics</h3>
            <p className="text-xs text-slate-400">Track and visualize clinical trends over time</p>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900/50 p-1 rounded-xl border border-white/5">
          {availableMetrics.map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 ${
                selectedMetric === metric
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {metric}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Rendering */}
      {chartData.length > 0 ? (
        <div className="space-y-4">
          <div className="h-[280px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="rgba(255,255,255,0.4)" 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.4)" 
                  tickLine={false} 
                  axisLine={false} 
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                  }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                
                {/* Add standard reference threshold indicators */}
                {thresholds && thresholds.min > 0 && (
                  <ReferenceLine 
                    y={thresholds.min} 
                    stroke="rgba(239, 68, 68, 0.4)" 
                    strokeDasharray="3 3" 
                    label={{ value: 'min limit', position: 'insideBottomLeft', fill: 'rgba(239, 68, 68, 0.5)', fontSize: 10 }}
                  />
                )}
                {thresholds && thresholds.max && (
                  <ReferenceLine 
                    y={thresholds.max} 
                    stroke="rgba(239, 68, 68, 0.4)" 
                    strokeDasharray="3 3" 
                    label={{ value: 'max limit', position: 'insideTopLeft', fill: 'rgba(239, 68, 68, 0.5)', fontSize: 10 }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', stroke: '#0b0f19', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, strokeWidth: 0 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Quick Stat Panel */}
          <div className="flex items-center space-x-3 bg-slate-800/10 border border-white/5 p-3 rounded-xl">
            <TrendingUp className="h-4.5 w-4.5 text-primary-500" />
            <span className="text-xs text-slate-400">
              Active tracking of <strong>{chartData.length} observation points</strong> for {selectedMetric}. 
              Latest reading: <strong className="text-white">{chartData[chartData.length - 1].value} {chartData[chartData.length - 1].unit}</strong>.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/5 rounded-xl bg-slate-800/5">
          <Activity className="h-10 w-10 text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">No Historical Trends Available</p>
          <p className="text-xs text-slate-600 px-6 text-center mt-1">
            Upload digital lab reports containing {selectedMetric} values to generate analytics charts.
          </p>
        </div>
      )}
    </div>
  );
}
