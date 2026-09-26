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
  success: 'bg-black/80 backdrop-blur-md text-emerald-300 border-emerald-500/50 shadow-sm',
  brand: 'bg-black/80 backdrop-blur-md text-[#FF7252] border-[#FF5A36]/50 shadow-sm',
  info: 'bg-black/80 backdrop-blur-md text-cyan-200 border-cyan-500/50 shadow-sm',
  warning: 'bg-black/80 backdrop-blur-md text-amber-200 border-amber-500/50 shadow-sm',
  danger: 'bg-black/80 backdrop-blur-md text-rose-300 border-rose-500/50 shadow-sm',
  neutral: 'bg-black/80 backdrop-blur-md text-zinc-300 border-white/15 shadow-sm',
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
