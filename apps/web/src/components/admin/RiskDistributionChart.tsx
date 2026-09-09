import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Rủi ro thấp (0-0.3)', value: 85, color: '#10b981' },
  { name: 'Rủi ro vừa (0.3-0.7)', value: 10, color: '#f59e0b' },
  { name: 'Rủi ro cao (>0.7)', value: 5, color: '#ef4444' },
];

export const RiskDistributionChart: React.FC = () => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#26334d', borderRadius: '8px' }}
          />
          <Legend formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
