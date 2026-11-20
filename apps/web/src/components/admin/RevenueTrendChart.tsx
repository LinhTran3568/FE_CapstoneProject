// Biểu đồ doanh thu sàn theo ngày trên Dashboard (SCRUM-391).
// Một chuỗi số nên một màu, không cần chú thích (tiêu đề khối đã gọi tên). Đường 2px, vùng tô 10%,
// lưới ngang mảnh, rê chuột hiện đường dọc và ô chú thích ghi đủ tiền. Bảng ẩn cho trình đọc màn hình.
import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dayLabel, formatCompactVnd, formatMoney, type RevenueTrendPoint } from '../../utils/adminOps';

/** Cùng màu với biểu đồ doanh thu theo sự kiện: cùng một thước đo thì cùng một màu. */
const SERIES_COLOR = '#2a78d6';
const GRID_COLOR = '#EEF1F5';
const AXIS_COLOR = '#E5EAF0';
const MUTED_TEXT = '#667085';

const fullDate = (date: string) => {
  const [y, m, d] = date.split('-');
  return d && m && y ? `${d}/${m}/${y}` : date;
};

interface TrendTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: RevenueTrendPoint }>;
}

const TrendTooltip: React.FC<TrendTooltipProps> = ({ active, payload }) => {
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;
  return (
    <div className="rounded-lg border border-[#E5EAF0] bg-white px-3 py-2 shadow-sm text-xs">
      <p className="font-mono text-[11px] text-[#667085]">{fullDate(point.date)}</p>
      <p className="mt-1 flex items-center gap-2 text-[#101722]">
        <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: SERIES_COLOR }} aria-hidden="true" />
        <span>Revenue</span>
        <span className="ml-auto pl-3 font-mono font-semibold tabular-nums">{formatMoney(point.netRevenue)}</span>
      </p>
    </div>
  );
};

export const RevenueTrendChart: React.FC<{ points: RevenueTrendPoint[] }> = ({ points }) => {
  if (!points.some((p) => p.netRevenue > 0)) {
    return <p className="py-8 text-center text-xs text-[#667085]">No platform revenue in this period.</p>;
  }

  return (
    <figure className="m-0">
      <div className="h-56 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeWidth={1} />
            <XAxis
              dataKey="date"
              tickFormatter={dayLabel}
              tick={{ fontSize: 10, fill: MUTED_TEXT }}
              tickLine={false}
              axisLine={{ stroke: AXIS_COLOR }}
              minTickGap={18}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatCompactVnd}
              tick={{ fontSize: 10, fill: MUTED_TEXT }}
              tickLine={false}
              axisLine={false}
              width={44}
              allowDecimals={false}
            />
            <Tooltip cursor={{ stroke: '#98A2B3', strokeWidth: 1 }} content={<TrendTooltip />} isAnimationActive={false} />
            <Area
              type="linear"
              dataKey="netRevenue"
              stroke={SERIES_COLOR}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill={SERIES_COLOR}
              fillOpacity={0.1}
              dot={points.length < 2 ? { r: 4, fill: SERIES_COLOR, strokeWidth: 0 } : false}
              activeDot={{ r: 4, fill: SERIES_COLOR, stroke: '#ffffff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Platform revenue per day</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{fullDate(p.date)}</td>
              <td>{formatMoney(p.netRevenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};
