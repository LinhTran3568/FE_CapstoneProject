import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const mockChartData = [
  { time: '00:00', allowed: 1200, throttled: 120, blocked: 45 },
  { time: '04:00', allowed: 800, throttled: 80, blocked: 20 },
  { time: '08:00', allowed: 2400, throttled: 210, blocked: 90 },
  { time: '12:00', allowed: 4800, throttled: 450, blocked: 210 },
  { time: '16:00', allowed: 3900, throttled: 310, blocked: 140 },
  { time: '20:00', allowed: 5200, throttled: 580, blocked: 320 },
];

export const BotDecisionChart: React.FC = () => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorThrottled" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#26334d', borderRadius: '8px' }}
          />
          <Area type="monotone" dataKey="allowed" name="ALLOWED" stroke="#10b981" fillOpacity={1} fill="url(#colorAllowed)" />
          <Area type="monotone" dataKey="throttled" name="THROTTLED" stroke="#f59e0b" fillOpacity={1} fill="url(#colorThrottled)" />
          <Area type="monotone" dataKey="blocked" name="BLOCKED" stroke="#ef4444" fillOpacity={1} fill="url(#colorBlocked)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
