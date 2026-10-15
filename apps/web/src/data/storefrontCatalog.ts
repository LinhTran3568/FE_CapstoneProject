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
    subtitle: 'Đại nhạc hội bùng nổ nhất năm quy tụ 30 anh trai với hệ thống âm thanh vòm d&b audiotechnik chuẩn quốc tế và hiệu ứng thị giác laser đa chiều.',
    organizerId: 'e0000000-0000-0000-0000-000000000001',
    organizerName: 'VieON & Vie Channel',
    organizerBadge: 'Đơn vị phân phối chính thức',
    dateDisplay: 'Thứ Bảy, 19/04/2025',
    timeDisplay: '19:30 - 23:00',
    venueName: 'Sân vận động Quân Khu 7',
    venueAddress: '202 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP. Hồ Chí Minh',
    gateOpenTime: '15:00',
    minPrice: 800000,
    maxPrice: 4500000,
    isFeatured: true,
    tagBadge: 'Cháy vé nhanh nhất',
    bannerImage: '/images/storefront/hero-discovery.jpg',
    posterImage: '/images/storefront/atsh-poster.jpg',
    stageLayoutImage: '/images/storefront/atsh-stage.jpg',
    description: 'Chuyến lưu diễn chính thức quy tụ trọn vẹn dàn nghệ sĩ của chương trình Anh Trai Say Hi. Sân khấu được trang bị hệ thống âm thanh d&b audiotechnik chuẩn quốc tế cùng hiệu ứng laser và pháo hoa nghệ thuật đặc biệt.',
    countdownDays: 2,
    countdownHours: 14,
    countdownMinutes: 23,
    countdownSeconds: 48,
    admissionPolicy: [
      'Khán giả xuất trình vé điện tử kèm mã QR hợp lệ tại cửa kiểm soát.',
      'Khu vực GA Standing không dành cho trẻ em dưới 12 tuổi.',
      'Mỗi mã QR chỉ có giá trị cho một (01) lượt vào cổng duy nhất.',
      'Nghiêm cấm mang theo máy ảnh chuyên nghiệp, flycam, vũ khí và đồ ăn từ bên ngoài.'
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
        seatZone: 'VIP Zone A - Ghế ngồi trực diện',
        gateEntrance: 'Cổng 1 (VIP Priority)',
        perks: [
          'Ghế ngồi trực diện tầm nhìn sân khấu hoàn hảo',
          'Lối đi riêng VIP, check-in đặc quyền từ 16:30',
          'Bộ quà tặng Banner cổ vũ & Glowstick chính thức'
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
        seatZone: 'GA Fanzone Sân cỏ trung tâm',
        gateEntrance: 'Cổng 2 & 3',
        perks: [
          'Khu vực đứng fanzone nhiệt huyết, âm thanh bao trùm',
          'Wristband vải phát sáng lưu niệm'
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
    subtitle: 'Đêm tiệc rap bùng nổ của SpaceSpeakers quy tụ dàn nghệ sĩ đỉnh cao cùng hệ thống âm thanh festival quốc tế.',
    organizerId: 'e0000000-0000-0000-0000-000000000001',
    organizerName: 'SpaceSpeakers Group',
    organizerBadge: 'Tour diễn chính thức',
    dateDisplay: 'Thứ Bảy, 12/09/2026',
    timeDisplay: '19:30 - 23:00',
    venueName: 'Sân vận động Quốc gia Mỹ Đình, Hà Nội',
    venueAddress: 'Đường Lê Đức Thọ, Mỹ Đình, Nam Từ Liêm, Hà Nội',
    gateOpenTime: '16:00',
    minPrice: 800000,
    maxPrice: 3500000,
    isFeatured: true,
    tagBadge: 'Sự kiện Hot',
    bannerImage: '/images/storefront/hero-discovery.jpg',
    posterImage: '/images/storefront/hero-discovery.jpg',
    stageLayoutImage: '/images/storefront/atsh-stage.jpg',
    description: 'Mixtape Hanoi 2026 là concert lớn nhất năm của SpaceSpeakers kết hợp dàn live band và visual 3D hoành tráng.',
    admissionPolicy: ['Không mang đồ uống có cồn vào sân', 'Trẻ em dưới 12 tuổi cần người lớn đi kèm'],
    tiers: [
      {
        id: 'c0000000-0000-0000-0000-000000000003',
        tierKey: 'vip',
        tierName: 'VIP Lounge A',
        price: 3500000,
        totalQuantity: 80,
        availableQuantity: 30,
        maxPerOrder: 4,
        seatZone: 'Khu VIP Lounge Sát Sân Khấu',
        gateEntrance: 'Cổng VIP',
        perks: ['Lối đi riêng VIP', 'Quà tặng lưu niệm SpaceSpeakers chính hãng']
      },
      {
        id: 'c0000000-0000-0000-0000-000000000004',
        tierKey: 'ga',
        tierName: 'GA Floor Zone',
        price: 800000,
        totalQuantity: 400,
        availableQuantity: 250,
        maxPerOrder: 6,
        seatZone: 'Fanzone Sân Cỏ Tự Do',
        gateEntrance: 'Cổng 2 & 3',
        perks: ['Vòng tay phát sáng', 'Tự do di chuyển trong fanzone']
      }
    ]
  },
  {
    id: 'westlife-vn-2026',
    title: 'Live Nation VN - Westlife Vietnam Tour 2026',
    tourName: 'THE WILD DREAMS TOUR 2026',
    genre: 'pop',
    cityKey: 'hcm',
    subtitle: 'Đêm nhạc huyền thoại của nhóm nhạc pop hàng đầu thế giới Westlife tại Việt Nam.',
    organizerId: 'e0000000-0000-0000-0000-000000000001',
    organizerName: 'Live Nation Vietnam',
    organizerBadge: 'World Tour Độc Quyền',
    dateDisplay: 'Chủ Nhật, 25/10/2026',
    timeDisplay: '20:00 - 22:30',
    venueName: 'Sân vận động Thống Nhất, TP.HCM',
    venueAddress: '30 Nguyễn Kim, Phường 6, Quận 10, TP.HCM',
    gateOpenTime: '17:00',
    minPrice: 1500000,
    maxPrice: 5000000,
    isFeatured: true,
    tagBadge: 'Quốc tế',
    bannerImage: '/images/storefront/concert-lights.jpg',
    posterImage: '/images/storefront/concert-lights.jpg',
    stageLayoutImage: '/images/storefront/gallery-finale.jpg',
    description: 'Thưởng thức những bản tình ca bất hủ My Love, I Lay My Love on You, Fool Again cùng 4 chàng trai Westlife.',
    admissionPolicy: ['Không mang máy ảnh chuyên nghiệp', 'Vé điện tử quét mã QR vào cổng'],
    tiers: [
      {
        id: 'c0000000-0000-0000-0000-000000000005',
        tierKey: 'vip',
        tierName: 'VIP Platinum',
        price: 5000000,
        totalQuantity: 60,
        availableQuantity: 18,
        maxPerOrder: 2,
        seatZone: 'Ghế Ngồi VIP Platinum Trực Diện',
        gateEntrance: 'Cổng VIP',
        perks: ['Ghế bọc nệm đặc quyền', 'Gói quà tặng lưu niệm World Tour']
      },
      {
        id: 'c0000000-0000-0000-0000-000000000006',
        tierKey: 'ga',
        tierName: 'GA Standing',
        price: 1500000,
        totalQuantity: 300,
        availableQuantity: 189,
        maxPerOrder: 6,
        seatZone: 'Fanzone Sân Cỏ Trung Tâm',
        gateEntrance: 'Cổng 1 & 2',
        perks: ['Vòng tay phát sáng', 'Trải nghiệm âm thanh bao trùm']
      }
    ]
  }
];

export const UPCOMING_CONCERTS: UpcomingConcertItem[] = [
  {
    id: 'atsh-hcm-2026',
    title: 'ANH TRAI SAY HI - LIVE CONCERT 2026',
    dateText: 'THỨ BẢY TUẦN TỚI • 19:00',
    relativeTime: 'Diễn ra sau 7 ngày',
    venueText: 'Sân vận động Quốc gia Mỹ Đình, Hà Nội',
    priceText: '1.200.000₫',
    badgeText: 'Chỉ còn ít vé',
    badgeType: 'warning',
    image: '/images/storefront/atsh-poster.jpg',
    eventId: 'atsh-2026'
  },
  {
    id: 'mixtape-hanoi-live',
    title: 'SPACESPEAKERS - MIXTAPE HANOI 2026',
    dateText: '12/09/2026 • 19:30',
    relativeTime: 'Mở cổng lúc 16:00',
    venueText: 'Sân vận động Quốc gia Mỹ Đình, Hà Nội',
    priceText: '800.000₫',
    badgeText: 'Sự kiện Hot',
    badgeType: 'info',
    image: '/images/storefront/hero-discovery.jpg',
    eventId: 'mixtape-hanoi-2026'
  },
  {
    id: 'westlife-tour-hcm',
    title: 'WESTLIFE - THE WILD DREAMS TOUR 2026',
    dateText: '25/10/2026 • 20:00',
    relativeTime: 'Mở bán chính thức',
    venueText: 'Sân vận động Thống Nhất, TP.HCM',
    priceText: '1.500.000₫',
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
