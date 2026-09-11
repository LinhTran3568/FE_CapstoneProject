import React from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Semantic colour of a badge. Keep meanings consistent across pages:
 * - success → good / completed (e.g. Verified, Sold)
 * - brand   → primary TicketShield accent (e.g. On Sale)
 * - info    → in progress, money held (e.g. In Escrow)
 * - warning → needs attention
 * - danger  → failed / blocked
 * - neutral → inactive or informational (e.g. Cancelled, Public)
 */
export type BadgeTone = 'success' | 'brand' | 'info' | 'warning' | 'danger' | 'neutral';

const toneClasses: Record<BadgeTone, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  brand: 'bg-[#FF5A36]/15 text-[#FF5A36] border-[#FF5A36]/30',
  info: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  neutral: 'bg-white/5 text-[#A3A8B3] border-white/10',
};

interface StatusBadgeProps {
  tone?: BadgeTone;
  /** Optional lucide icon shown before the label */
  icon?: LucideIcon;
  /** Tooltip explaining what the badge means */
  title?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Small pill used to show a status or attribute (listing status, visibility, verification…).
 *
 * @example
 * <StatusBadge tone="success" icon={ShieldCheck}>Verified</StatusBadge>
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  tone = 'neutral',
  icon: Icon,
  title,
  className = '',
  children,
}) => (
  <span
    title={title}
    className={`inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full border text-[10px] font-bold font-mono uppercase tracking-wider ${toneClasses[tone]} ${className}`}
  >
    {Icon && <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />}
    {children}
  </span>
);

export default StatusBadge;
