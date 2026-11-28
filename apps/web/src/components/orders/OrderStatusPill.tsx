import React from 'react';
import { orderStatusLabel, orderStatusTone, type OrderTone } from '../../utils/buyerOrders';

const TONE_CLASSES: Record<OrderTone, string> = {
  amber: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
  emerald: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
  rose: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
  indigo: 'bg-indigo-500/15 border-indigo-400/40 text-indigo-300',
  zinc: 'bg-white/[0.06] border-white/15 text-zinc-300',
};

/** Nhãn trạng thái đơn của người mua, dùng chung cho thẻ đơn và khung chi tiết. */
export const OrderStatusPill: React.FC<{ status?: string | null }> = ({ status }) => (
  <span
    className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10.5px] font-mono font-extrabold uppercase tracking-wider ${
      TONE_CLASSES[orderStatusTone(status)]
    }`}
  >
    {orderStatusLabel(status)}
  </span>
);
