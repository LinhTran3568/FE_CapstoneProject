import type { TrendingEventDto } from '@ticketshield/api-client';

export interface OrganizerCatalogTier {
  tierName?: string;
  price?: number;
  description?: string;
}

export interface OrganizerCatalogEvent {
  externalEventId?: string;
  name?: string;
  artist?: string;
  category?: string;
  city?: string;
  venue?: string;
  description?: string;
  eventStartAt?: string;
  eventEndAt?: string;
  resaleDeadline?: string;
  tiers?: OrganizerCatalogTier[];
}

export function normalizeEventKey(value?: string | null): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function eventNamesMatch(a?: string | null, b?: string | null): boolean {
  const left = normalizeEventKey(a);
  const right = normalizeEventKey(b);
  if (left.length < 4 || right.length < 4) return left === right;
  return left === right || left.includes(right) || right.includes(left);
}

export function catalogPriceRange(tiers?: OrganizerCatalogTier[]): {
  minPrice?: number;
  maxPrice?: number;
} {
  const prices = (tiers || [])
    .map((tier) => (typeof tier.price === 'number' ? tier.price : Number.NaN))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (prices.length === 0) return {};
  return { minPrice: Math.min(...prices), maxPrice: Math.max(...prices) };
}

export function mapCatalogEventToTrending(
  event: OrganizerCatalogEvent,
  fallbackRef: string
): TrendingEventDto {
  const range = catalogPriceRange(event.tiers);
  return {
    id: event.externalEventId || fallbackRef,
    eventId: event.externalEventId || fallbackRef,
    name: event.name || fallbackRef,
    artist: event.artist,
    category: event.category,
    city: event.city,
    venue: event.venue || 'Venue to be announced',
    description: event.description,
    eventStartAt: event.eventStartAt || '',
    eventEndAt: event.eventEndAt,
    originalPriceFrom: range.minPrice,
    totalAvailableListings: 0,
  };
}
