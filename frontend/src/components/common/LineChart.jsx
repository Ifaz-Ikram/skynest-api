import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Reusable Line Chart Component
 * 
 * @param {Array} data - Array of objects with keys matching dataKey
 * @param {string} dataKey - Key in data objects to plot
 * @param {Array} labels - Optional labels for X-axis (if data doesn't have labels)
 * @param {number} height - Chart height in pixels
 * @param {string} color - Line color (hex code)
 * @param {string} xKey - Key for X-axis data
 */
const LineChart = ({ 
  data = [], 
  dataKey = 'value',
  labels = [],
  height = 200, 
  color = '#3B82F6',
  xKey = 'label',
  showGrid = true,
  showTooltip = true,
  strokeWidth = 2,
}) => {
  // Transform data if labels are provided separately
  const chartData = labels.length > 0 
    ? data.map((value, index) => ({
        [xKey]: labels[index] || `Day ${index + 1}`,
        [dataKey]: value,
      }))
    : data;

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-slate-400 text-sm">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={chartData}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
        <XAxis 
          dataKey={xKey} 
          stroke="#9CA3AF" 
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#9CA3AF" 
          style={{ fontSize: '12px' }}
        />
        {showTooltip && (
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            formatter={(value) => {
              if (typeof value === 'number') {
                return value.toLocaleString();
              }
              return value;
            }}
          />
        )}
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          strokeWidth={strokeWidth}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;
