import React from 'react';
import { Card } from '../ui/Card';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  color?: 'cyan' | 'emerald' | 'amber' | 'red';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'cyan',
}) => {
  const borderColors = {
    cyan: 'hover:border-cyan-500/40',
    emerald: 'hover:border-emerald-500/40',
    amber: 'hover:border-amber-500/40',
    red: 'hover:border-red-500/40',
  };

  const iconBg = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  return (
    <Card hoverGlow className={`${borderColors[color]} bg-navy-850 p-5 flex flex-col justify-between`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs text-slate-400 font-medium block mb-1">{title}</span>
          <span className="text-2xl font-extrabold text-white tracking-tight">{value}</span>
        </div>
        <div className={`p-2.5 rounded-xl border ${iconBg[color]}`}>{icon}</div>
      </div>
      {subtitle && <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-navy-750">{subtitle}</p>}
    </Card>
  );
};
