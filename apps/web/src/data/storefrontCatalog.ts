export interface StorefrontTier {
  id: string;
  tierKey: 'diamond' | 'vipa' | 'vip' | 'ga' | 'tribune' | 'standard';
  tierName: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  maxPerOrder: number;
  seatZone: string;
  gateEntrance: string;
  isSoldOut?: boolean;
  perks: string[];
}

export interface ArtistLineupItem {
  name: string;
  role: string;
  tag: string;
  tagColor?: string;
  avatar: string;
}

export interface StorefrontEvent {
  id: string;
  title: string;
  tourName: string;
  subtitle: string;
  organizerId: string;
  organizerName: string;
  organizerBadge: string;
  dateDisplay: string;
  timeDisplay: string;
  venueName: string;
  venueAddress: string;
  gateOpenTime: string;
  minPrice: number;
  maxPrice: number;
  bannerImage: string;
  posterImage: string;
  stageLayoutImage: string;
  description: string;
  countdownDays?: number;
  countdownHours?: number;
  countdownMinutes?: number;
  countdownSeconds?: number;
  isFeatured?: boolean;
  tagBadge?: string;
  admissionPolicy: string[];
  tiers: StorefrontTier[];
  artists?: ArtistLineupItem[];
  genre?: 'pop' | 'rap' | 'edm' | 'rock' | 'acoustic';
  cityKey?: 'hcm' | 'hanoi' | 'danang';
}

export interface UpcomingConcertItem {
  id: string;
  title: string;
  dateText: string;
  relativeTime: string;
  venueText: string;
  priceText: string;
  badgeText: string;
  badgeType: 'error' | 'warning' | 'info';
  image: string;
  eventId: string;
}

export const STOREFRONT_EVENTS: StorefrontEvent[] = [
  {
    id: 'atsh-2026',
    title: 'ANH TRAI SAY HI LIVE CONCERT 2025',
    tourName: 'THE GRAND ARENA WORLD TOUR',
    genre: 'pop',
    cityKey: 'hcm',
    subtitle: 'The biggest music festival of the year featuring 30 artists with international standard d&b audiotechnik surround sound and multi-dimensional laser visual effects.',
    organizerId: 'e0000000-0000-0000-0000-000000000001',
    organizerName: 'VieON & Vie Channel',
    organizerBadge: 'Official Distributor',
    dateDisplay: 'Saturday, Apr 19, 2025',
    timeDisplay: '19:30 - 23:00',
    venueName: 'Military Zone 7 Stadium',
    venueAddress: '202 Hoang Van Thu, Ward 9, Phu Nhuan District, Ho Chi Minh City',
    gateOpenTime: '15:00',
    minPrice: 800000,
    maxPrice: 4500000,
    isFeatured: true,
    tagBadge: 'Fast Selling',
    bannerImage: '/images/storefront/hero-discovery.jpg',
    posterImage: '/images/storefront/atsh-poster.jpg',
    stageLayoutImage: '/images/storefront/atsh-stage.jpg',
    description: 'The official live tour featuring the full artist lineup of Anh Trai Say Hi. The stage is equipped with international-grade d&b audiotechnik sound systems alongside laser choreography and pyrotechnics.',
    countdownDays: 2,
    countdownHours: 14,
    countdownMinutes: 23,
    countdownSeconds: 48,
    admissionPolicy: [
      'Attendees must present a valid digital ticket with QR code at the entrance.',
      'GA Standing area is not permitted for children under 12.',
      'Each QR code is valid for one (1) single entry.',
      'Professional cameras, drones, weapons, and outside food are strictly prohibited.'
    ],
    artists: [
      {
        name: 'HIEUTHUHAI',
        role: 'Rap / Performer',
        tag: 'CAPTAIN',
        avatar: '/images/storefront/artist-hieuthuhai.jpg'
      },
      {
        name: 'Anh Tú Atus',
        role: 'Vocal / Performance',
        tag: 'HEADLINER',
        avatar: '/images/storefront/artist-atus.jpg'
      },
      {
        name: 'Quang Hùng MasterD',
        role: 'Vocal / Producer',
        tag: 'HITMAKER',
        avatar: '/images/storefront/artist-quanghung.jpg'
      },
      {
        name: 'Rhyder',
        role: 'Vocals / Rock / Rap',
        tag: 'ROCKSTAR',
        avatar: '/images/storefront/artist-rhyder.jpg'
      },
      {
        name: 'Negav',
        role: 'Rap / Performer',
        tag: 'TRENDSETTER',
        avatar: '/images/storefront/artist-negav.jpg'
      },
      {
        name: 'Pháp Kiều',
        role: 'Rap / Flow Master',
        tag: 'ICON',
        avatar: '/images/storefront/artist-phapkieu.jpg'
      }
    ],
    tiers: [
      {
        id: 'c0000000-0000-0000-0000-000000000001',
        tierKey: 'vip',
        tierName: 'VIP Zone A',
        price: 2500000,
        totalQuantity: 100,
        availableQuantity: 47,
        maxPerOrder: 4,
        seatZone: 'VIP Zone A - Direct Stage Center',
        gateEntrance: 'Gate 1 (VIP Priority)',
        perks: [
          'Direct front stage seating with optimal sightlines',
          'Dedicated VIP entrance, priority check-in from 16:30',
          'Official commemorative cheer banner & glowstick package'
        ]
      },
      {
        id: 'c0000000-0000-0000-0000-000000000002',
        tierKey: 'ga',
        tierName: 'GA Standing',
        price: 1200000,
        totalQuantity: 500,
        availableQuantity: 312,
        maxPerOrder: 6,
        seatZone: 'GA Center Pitch Fanzone',
        gateEntrance: 'Gates 2 & 3',
        perks: [
          'High-energy center pitch fanzone with immersive sound',
          'Commemorative light-up wristband'
        ]
      }
    ]
  },
  {
    id: 'mixtape-hanoi-2026',
    title: 'SpaceSpeakers - Mixtape Hanoi 2026',
    tourName: 'SPACESPEAKERS LIVE TOUR 2026',
    genre: 'rap',
    cityKey: 'hanoi',
    subtitle: 'The premier rap & hip-hop festival from SpaceSpeakers featuring top producers, rappers, and an international concert audio system.',
    organizerId: 'e0000000-0000-0000-0000-000000000001',
    organizerName: 'SpaceSpeakers Group',
    organizerBadge: 'Official Tour',
    dateDisplay: 'Saturday, Sep 12, 2026',
    timeDisplay: '19:30 - 23:00',
    venueName: 'My Dinh National Stadium, Hanoi',
    venueAddress: 'Le Duc Tho Street, My Dinh, Nam Tu Liem, Hanoi',
    gateOpenTime: '16:00',
    minPrice: 800000,
    maxPrice: 3500000,
    isFeatured: true,
    tagBadge: 'Trending',
    bannerImage: '/images/storefront/hero-discovery.jpg',
    posterImage: '/images/storefront/hero-discovery.jpg',
    stageLayoutImage: '/images/storefront/atsh-stage.jpg',
    description: 'Mixtape Hanoi 2026 is the year-defining concert from SpaceSpeakers, featuring a full live band and 3D visual spectacle.',
    admissionPolicy: ['No outside alcoholic beverages permitted', 'Children under 12 must be accompanied by an adult'],
    tiers: [
      {
        id: 'c0000000-0000-0000-0000-000000000003',
        tierKey: 'vip',
        tierName: 'VIP Lounge A',
        price: 3500000,
        totalQuantity: 80,
        availableQuantity: 30,
        maxPerOrder: 4,
        seatZone: 'Stage-Front VIP Lounge',
        gateEntrance: 'Gate VIP',
        perks: ['Dedicated VIP entrance', 'Official SpaceSpeakers commemorative gift pack']
      },
      {
        id: 'c0000000-0000-0000-0000-000000000004',
        tierKey: 'ga',
        tierName: 'GA Floor Zone',
        price: 800000,
        totalQuantity: 400,
        availableQuantity: 250,
        maxPerOrder: 6,
        seatZone: 'Free Movement Pitch Fanzone',
        gateEntrance: 'Gates 2 & 3',
        perks: ['LED wristband', 'Free access throughout the fanzone']
      }
    ]
  },
  {
    id: 'westlife-vn-2026',
    title: 'Live Nation VN - Westlife Vietnam Tour 2026',
    tourName: 'THE WILD DREAMS TOUR 2026',
    genre: 'pop',
    cityKey: 'hcm',
    subtitle: 'Legendary world tour from the global pop boyband Westlife performing live in Vietnam.',
    organizerId: 'e0000000-0000-0000-0000-000000000001',
    organizerName: 'Live Nation Vietnam',
    organizerBadge: 'Exclusive World Tour',
    dateDisplay: 'Sunday, Oct 25, 2026',
    timeDisplay: '20:00 - 22:30',
    venueName: 'Thong Nhat Stadium, Ho Chi Minh City',
    venueAddress: '30 Nguyen Kim, Ward 6, District 10, Ho Chi Minh City',
    gateOpenTime: '17:00',
    minPrice: 1500000,
    maxPrice: 5000000,
    isFeatured: true,
    tagBadge: 'International',
    bannerImage: '/images/storefront/concert-lights.jpg',
    posterImage: '/images/storefront/concert-lights.jpg',
    stageLayoutImage: '/images/storefront/gallery-finale.jpg',
    description: 'Experience timeless hits My Love, I Lay My Love on You, and Fool Again performed live by Westlife.',
    admissionPolicy: ['No professional cameras allowed', 'Digital tickets scanned via QR code at entrance'],
    tiers: [
      {
        id: 'c0000000-0000-0000-0000-000000000005',
        tierKey: 'vip',
        tierName: 'VIP Platinum',
        price: 5000000,
        totalQuantity: 60,
        availableQuantity: 18,
        maxPerOrder: 2,
        seatZone: 'VIP Platinum Direct Front Seating',
        gateEntrance: 'Gate VIP',
        perks: ['Premium cushioned seating', 'World Tour souvenir package']
      },
      {
        id: 'c0000000-0000-0000-0000-000000000006',
        tierKey: 'ga',
        tierName: 'GA Standing',
        price: 1500000,
        totalQuantity: 300,
        availableQuantity: 189,
        maxPerOrder: 6,
        seatZone: 'Center Pitch Fanzone',
        gateEntrance: 'Gates 1 & 2',
        perks: ['LED wristband', 'Immersive concert audio experience']
      }
    ]
  }
];

export const UPCOMING_CONCERTS: UpcomingConcertItem[] = [
  {
    id: 'atsh-hcm-2026',
    title: 'ANH TRAI SAY HI - LIVE CONCERT 2026',
    dateText: 'NEXT SATURDAY • 19:00',
    relativeTime: 'Starts in 7 days',
    venueText: 'My Dinh National Stadium, Hanoi',
    priceText: '1,200,000 ₫',
    badgeText: 'Low Stock',
    badgeType: 'warning',
    image: '/images/storefront/atsh-poster.jpg',
    eventId: 'atsh-2026'
  },
  {
    id: 'mixtape-hanoi-live',
    title: 'SPACESPEAKERS - MIXTAPE HANOI 2026',
    dateText: '12/09/2026 • 19:30',
    relativeTime: 'Gates open at 16:00',
    venueText: 'My Dinh National Stadium, Hanoi',
    priceText: '800,000 ₫',
    badgeText: 'Trending',
    badgeType: 'info',
    image: '/images/storefront/hero-discovery.jpg',
    eventId: 'mixtape-hanoi-2026'
  },
  {
    id: 'westlife-tour-hcm',
    title: 'WESTLIFE - THE WILD DREAMS TOUR 2026',
    dateText: '25/10/2026 • 20:00',
    relativeTime: 'Official On-Sale',
    venueText: 'Thong Nhat Stadium, Ho Chi Minh City',
    priceText: '1,500,000 ₫',
    badgeText: 'World Tour',
    badgeType: 'error',
    image: '/images/storefront/concert-lights.jpg',
    eventId: 'westlife-vn-2026'
  }
];

export const getStorefrontEvents = (): StorefrontEvent[] => STOREFRONT_EVENTS;

export const getStorefrontEventById = (eventId?: string): StorefrontEvent => {
  if (!eventId) return STOREFRONT_EVENTS[0];
  const found = STOREFRONT_EVENTS.find((e) => e.id === eventId);
  return found || STOREFRONT_EVENTS[0];
};

export const getStorefrontTier = (
  eventId: string,
  tierId: string
): StorefrontTier | undefined => {
  const event = getStorefrontEventById(eventId);
  return event.tiers.find((t) => t.id === tierId);
};
