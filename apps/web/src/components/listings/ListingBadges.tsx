import React from 'react';
import {
  Ban,
  CheckCircle2,
  Globe,
  Hourglass,
  Lock,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import type { ListingStatus, VerificationStatus } from '@ticketshield/types';
import { StatusBadge, type BadgeTone } from '../ui/StatusBadge';

interface BadgeMeta {
  label: string;
  tone: BadgeTone;
  icon: LucideIcon;
  description: string;
}

/** Display text for every backend listing status. Reused by filters and summary tiles. */
export const LISTING_STATUS_META: Record<ListingStatus, BadgeMeta> = {
  Draft: {
    label: 'Draft',
    tone: 'neutral',
    icon: Pencil,
    description: 'Not published yet',
  },
  Verified: {
    label: 'On Sale',
    tone: 'brand',
    icon: Tag,
    description: 'Listed and open for buyers',
  },
  Transacting: {
    label: '24h Protection',
    tone: 'info',
    icon: Hourglass,
    description: 'Buyer has paid; funds are held under 24-hour protection',
  },
  Sold: {
    label: 'Sold',
    tone: 'success',
    icon: CheckCircle2,
    description: 'Ownership transferred to the buyer',
  },
  Cancelled: {
    label: 'Cancelled',
    tone: 'neutral',
    icon: Ban,
    description: 'Cancelled by you; the original ticket was unlocked',
  },
  Expired: {
    label: 'Expired',
    tone: 'neutral',
    icon: Ban,
    description: 'Closed because the event is within 2 hours or has already started',
  },
};

const VERIFICATION_META: Record<VerificationStatus, BadgeMeta> = {
  Verified: {
    label: 'Verified',
    tone: 'success',
    icon: ShieldCheck,
    description: 'Ticket ownership confirmed with the organizer',
  },
  PendingOtp: {
    label: 'Pending OTP',
    tone: 'warning',
    icon: ShieldAlert,
    description: 'Waiting for OTP confirmation',
  },
  Rejected: {
    label: 'Rejected',
    tone: 'danger',
    icon: ShieldX,
    description: 'The organizer could not confirm this ticket',
  },
};

const renderBadge = ({ label, tone, icon, description }: BadgeMeta) => (
  <StatusBadge tone={tone} icon={icon} title={description}>
    {label}
  </StatusBadge>
);

export const ListingStatusBadge: React.FC<{ status: ListingStatus }> = ({ status }) =>
  renderBadge(LISTING_STATUS_META[status] ?? LISTING_STATUS_META.Draft);

export const VerificationBadge: React.FC<{ status: VerificationStatus }> = ({ status }) =>
  renderBadge(VERIFICATION_META[status] ?? VERIFICATION_META.PendingOtp);

export const VisibilityBadge: React.FC<{ isPrivate: boolean }> = ({ isPrivate }) =>
  isPrivate ? (
    <StatusBadge tone="warning" icon={Lock} title="Only people with the private link can view and buy">
      Private
    </StatusBadge>
  ) : (
    <StatusBadge tone="neutral" icon={Globe} title="Visible to everyone on the marketplace">
      Public
    </StatusBadge>
  );
