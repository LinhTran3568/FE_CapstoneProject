// Khối thống kê sàn trên Dashboard (SCRUM-339): số tiền, doanh thu theo sự kiện, kho vé, người dùng, bảng sự kiện.
// Biểu đồ vẽ bằng thanh CSS: một chuỗi số nên một màu, không cần chú thích, số ghi ở cuối thanh bằng màu chữ.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Boxes, Loader2, Users } from 'lucide-react';
import type { AdminPlatformAnalyticsDto } from '@ticketshield/api-client';
import { RetryButton, StatCard, errorText } from './AdminOpsUi';
import { formatMoney, topEvents, type DashboardRange, type EventMetric } from '../../utils/adminOps';
import { formatEventDateTime } from '../../utils/formatters';

/** Màu duy nhất của thanh (slot 1 bảng màu mẫu, đã qua kiểm tra tương phản trên nền sáng). */
const BAR_COLOR = '#2a78d6';

const RANGE_HINT: Record<DashboardRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  All: 'All time',
};

interface AnalyticsState {
  data: AdminPlatformAnalyticsDto | undefined;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  error: unknown;
  refetch: () => void;
}

export const DashboardRangePicker: React.FC<{ value: DashboardRange; onChange: (range: DashboardRange) => void }> = ({
  value,
  onChange,
}) => (
  <div role="group" aria-label="Analytics period" className="inline-flex rounded-lg border border-[#E5EAF0] bg-white p-0.5 shadow-2xs">
    {(['7d', '30d', 'All'] as DashboardRange[]).map((r) => (
      <button
        key={r}
        type="button"
        aria-pressed={value === r}
        onClick={() => onChange(r)}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold font-mono cursor-pointer ${
          value === r ? 'bg-[#101722] text-white' : 'text-[#667085] hover:text-[#101722]'
        }`}
      >
        {r}
      </button>
    ))}
  </div>
);

/** Hàng số tiền. Tải lỗi thì báo lỗi kèm Retry, không hiện số 0 thay cho lỗi. */
export const DashboardMoneyRow: React.FC<{ analytics: AnalyticsState; range: DashboardRange }> = ({ analytics, range }) => {
  const { data, isPending, isError, isFetching, error, refetch } = analytics;

  if (isPending) {
    return (
      <div className="bg-white border border-[#E5EAF0] rounded-xl p-5 flex items-center gap-2 text-xs text-[#667085] font-mono shadow-2xs">
        <Loader2 className="w-4 h-4 animate-spin text-[#F45135]" /> Loading platform analytics...
      </div>
    );
  }
  if (isError && !data) {
    return (
      <div role="alert" className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-800">
        <span>Platform analytics unavailable: {errorText(error)}</span>
        <RetryButton onClick={refetch} busy={isFetching} />
      </div>
    );
  }
  if (!data) return null;

  const { revenue } = data;
  const hint = RANGE_HINT[range];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      <StatCard
        label="Platform revenue"
        value={formatMoney(revenue.totalNetRevenue)}
        hint={`Buyer fees ${formatMoney(revenue.totalBuyerFees)} · Seller fees ${formatMoney(revenue.totalSellerFees)}`}
      />
      <StatCard label="GMV (total traded)" value={formatMoney(revenue.totalGmv)} hint={hint} />
      <StatCard label="Fees still in escrow" value={formatMoney(revenue.pendingFeesInEscrow)} hint={hint} />
      <StatCard label="Refunded" value={formatMoney(revenue.totalRefundedAmount)} hint={hint} />
    </div>
  );
};

const Panel: React.FC<{ title: string; icon: React.ReactNode; badge?: string; action?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  badge,
  action,
  children,
}) => (
  <div className="bg-white border border-[#E5EAF0] rounded-xl p-4 shadow-2xs space-y-3 min-w-0">
    <div className="flex items-center justify-between gap-2 border-b border-[#E5EAF0] pb-2.5">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xs font-bold text-[#101722] uppercase tracking-wider font-mono">{title}</h2>
        {badge && (
          <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200">
            {badge}
          </span>
        )}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const openListings = (navigate: ReturnType<typeof useNavigate>, eventId: string) =>
  navigate(`/admin/listings?eventId=${encodeURIComponent(eventId)}`);

/**
 * Biểu đồ theo sự kiện, kho vé và người dùng, bảng sự kiện. Chỉ hiện khi đã có dữ liệu thống kê.
 * Kho vé và người dùng đọc `allTimeData` (bản All), vì BE đếm người mua, người bán theo khoảng ngày.
 */
export const DashboardAnalyticsPanels: React.FC<{
  data: AdminPlatformAnalyticsDto | undefined;
  allTimeData: AdminPlatformAnalyticsDto | undefined;
  allTimeFailed: boolean;
  onRetryAllTime: () => void;
  range: DashboardRange;
}> = ({ data, allTimeData, allTimeFailed, onRetryAllTime, range }) => {
  const navigate = useNavigate();
  const [metric, setMetric] = useState<EventMetric>('revenue');
  if (!data) return null;

  const top = topEvents(data.eventTransactions, metric);
  const max = top[0]?.value ?? 0;
  const inventory = allTimeData?.inventory;
  const users = allTimeData?.users;
  const inventoryRows = inventory
    ? [
        { label: 'Valid', value: inventory.validTickets },
        { label: 'Locked for resale', value: inventory.lockedForResaleTickets },
        { label: 'Transferred', value: inventory.transferredTickets },
        { label: 'Used', value: inventory.usedTickets },
        { label: 'Cancelled', value: inventory.cancelledTickets },
      ]
    : [];
  const events = [...data.eventTransactions].sort((a, b) => b.totalPlatformRevenue - a.totalPlatformRevenue);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7">
          <Panel
            title={metric === 'revenue' ? 'Revenue by event' : 'GMV by event'}
            icon={<BarChart3 className="w-4 h-4 text-[#F45135]" />}
            badge={RANGE_HINT[range]}
            action={
              <div role="group" aria-label="Chart metric" className="inline-flex rounded-lg border border-[#E5EAF0] bg-slate-50 p-0.5">
                {(
                  [
                    ['revenue', 'Revenue'],
                    ['gmv', 'GMV'],
                  ] as Array<[EventMetric, string]>
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={metric === value}
                    onClick={() => setMetric(value)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer ${
                      metric === value ? 'bg-white text-[#101722] shadow-2xs' : 'text-[#667085]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
          >
            {top.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#667085]">No event has transactions in this period.</p>
            ) : (
              <ul className="space-y-2.5" aria-label={metric === 'revenue' ? 'Platform revenue by event' : 'GMV by event'}>
                {top.map((e) => {
                  const label = `${e.eventName}: ${formatMoney(e.value)}`;
                  return (
                    <li key={e.eventId}>
                      <button
                        type="button"
                        title={label}
                        aria-label={`${label}. Open listings of this event`}
                        onClick={() => openListings(navigate, e.eventId)}
                        className="group grid w-full grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 text-left cursor-pointer"
                      >
                        <span className="truncate text-xs text-[#101722] group-hover:text-[#F45135]">{e.eventName}</span>
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-3.5 rounded-r-[4px] group-hover:opacity-80"
                            style={{ width: `${max > 0 ? Math.max((e.value / max) * 75, 1) : 0}%`, backgroundColor: BAR_COLOR }}
                          />
                          <span className="shrink-0 font-mono text-[11px] tabular-nums text-[#101722]">{formatMoney(e.value)}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-5 space-y-5">
          {!inventory || !users ? (
            allTimeFailed ? (
              <div role="alert" className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-rose-800">
                <span>Inventory and user totals unavailable.</span>
                <RetryButton onClick={onRetryAllTime} />
              </div>
            ) : (
              <div className="bg-white border border-[#E5EAF0] rounded-xl p-5 flex items-center gap-2 text-xs text-[#667085] font-mono">
                <Loader2 className="w-4 h-4 animate-spin text-[#F45135]" /> Loading inventory and users...
              </div>
            )
          ) : (
            <>
          <Panel title="Ticket inventory" icon={<Boxes className="w-4 h-4 text-[#F45135]" />} badge="All time">
            <p className="text-xs text-[#667085]">
              <span className="text-lg font-bold font-mono text-[#101722] tabular-nums">{inventory.totalTicketsInInventory}</span> tickets
            </p>
            <ul className="space-y-1.5">
              {inventoryRows.map((row) => (
                <li key={row.label} className="grid grid-cols-[8rem_1fr_auto] items-center gap-2 text-xs">
                  <span className="text-[#667085]">{row.label}</span>
                  <span className="h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${inventory.totalTicketsInInventory > 0 ? (row.value / inventory.totalTicketsInInventory) * 100 : 0}%`,
                        backgroundColor: BAR_COLOR,
                      }}
                    />
                  </span>
                  <span className="font-mono tabular-nums text-[#101722] text-right min-w-[2.5rem]">{row.value}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Users" icon={<Users className="w-4 h-4 text-[#F45135]" />} badge="All time">
            <div className="grid grid-cols-3 gap-3 text-xs">
              {[
                ['Total', users.totalUsers],
                ['Active', users.activeUsers],
                ['Buyers', users.totalBuyers],
                ['Sellers', users.totalSellers],
                ['Both', users.dualRoleUsers],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-[10px] font-mono uppercase text-[#667085]">{label}</p>
                  <p className="text-base font-bold font-mono tabular-nums text-[#101722]">{value}</p>
                </div>
              ))}
            </div>
          </Panel>
            </>
          )}
        </div>
      </div>

      <Panel title="Events" icon={<BarChart3 className="w-4 h-4 text-[#F45135]" />} badge={RANGE_HINT[range]}>
        {events.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#667085]">No events yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6F9] text-[#667085] border-y border-[#E5EAF0] text-[10px] font-mono font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 min-w-[200px]">Event</th>
                  <th className="py-2.5 px-4 min-w-[130px]">Date</th>
                  <th className="py-2.5 px-4 text-right">Listings</th>
                  <th className="py-2.5 px-4 text-right">Sold</th>
                  <th className="py-2.5 px-4 text-right">Available</th>
                  <th className="py-2.5 px-4 text-right min-w-[120px]">GMV</th>
                  <th className="py-2.5 px-4 text-right min-w-[120px]">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0]">
                {events.map((e) => (
                  <tr
                    key={e.eventId}
                    tabIndex={0}
                    onClick={() => openListings(navigate, e.eventId)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        openListings(navigate, e.eventId);
                      }
                    }}
                    className="hover:bg-slate-50/70 focus:bg-slate-50 focus:outline-none cursor-pointer"
                  >
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-[#101722] truncate max-w-[260px]">{e.eventName}</p>
                      <p className="text-[11px] text-[#667085] truncate max-w-[260px]">{e.venue}</p>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[#667085] whitespace-nowrap">{formatEventDateTime(e.eventStartAt)}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{e.totalListings}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{e.totalTicketsSold}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{e.totalTicketsAvailable}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">{formatMoney(e.totalTransactionVolume)}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums whitespace-nowrap font-semibold">
                      {formatMoney(e.totalPlatformRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
};
