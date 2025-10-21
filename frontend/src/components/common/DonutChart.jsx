import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

/**
 * Reusable Donut Chart Component
 * 
 * @param {Array} data - Array of objects: [{ label, value, color }]
 * @param {number} size - Chart size (width and height)
 * @param {number} innerRadius - Inner radius percentage (0-100, default 60 for donut)
 * @param {number} outerRadius - Outer radius percentage (0-100)
 * @param {boolean} showLegend - Show legend below chart
 * @param {boolean} showTooltip - Show tooltip on hover
 */
const DonutChart = ({ 
  data = [], 
  size = 300,
  innerRadius = 60,
  outerRadius = 80,
  showLegend = true,
  showTooltip = true,
}) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: size }}>
        <p className="text-text-tertiary text-sm">No data available</p>
      </div>
    );
  }

  const COLORS = data.map(item => item.color || '#3B82F6');

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        style={{ fontSize: '14px', fontWeight: 'bold' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={size}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} />
          ))}
        </Pie>
        {showTooltip && (
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            formatter={(value, name, props) => {
              return [value, props.payload.label];
            }}
          />
        )}
        {showLegend && (
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => {
              return `${entry.payload.label}: ${entry.payload.value}`;
            }}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DonutChart;
