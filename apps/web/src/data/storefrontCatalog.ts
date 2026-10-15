export interface StorefrontTier {
  id: string;
  tierKey: 'diamond' | 'vipa' | 'ga' | 'tribune';
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
        tierKey: 'diamond',
        tierName: 'Diamond Lounge VIP',
        price: 4500000,
        totalQuantity: 80,
        availableQuantity: 18,
        maxPerOrder: 4,
        seatZone: 'Khu A-1 Sát Stage • Ghế ngồi VIP',
        gateEntrance: 'Cổng 1 (VIP Priority)',
        perks: [
          'Lối đi riêng VIP, check-in đặc quyền từ 16:30',
          'F&B Lounge cao cấp, Soundcheck Pass độc quyền',
          'Bộ quà tặng Limited Merch Box + Lightstick 2025'
        ]
      },
      {
        id: 'c0000000-0000-0000-0000-000000000002',
        tierKey: 'vipa',
        tierName: 'VIP Zone A (Seated)',
        price: 2800000,
        totalQuantity: 200,
        availableQuantity: 45,
        maxPerOrder: 4,
        seatZone: 'VIP Zone A - Ghế ngồi trực diện',
        gateEntrance: 'Cổng 1 & 2',
        perks: [
          'Ghế ngồi trực diện tầm nhìn sân khấu hoàn hảo',
          'Bộ quà tặng Banner cổ vũ & Glowstick chính thức'
        ]
      },
      {
        id: 'c0000000-0000-0000-0000-000000000003',
        tierKey: 'ga',
        tierName: 'GA Standing Zone',
        price: 1200000,
        totalQuantity: 500,
        availableQuantity: 120,
        maxPerOrder: 6,
        seatZone: 'GA Fanzone Sân cỏ trung tâm',
        gateEntrance: 'Cổng 2 & 3',
        perks: [
          'Khu vực đứng fanzone nhiệt huyết, âm thanh bao trùm',
          'Wristband vải phát sáng lưu niệm'
        ]
      },
      {
        id: 'c0000000-0000-0000-0000-000000000004',
        tierKey: 'tribune',
        tierName: 'Tribune Upper CAT 3',
        price: 800000,
        totalQuantity: 1500,
        availableQuantity: 0,
        isSoldOut: true,
        maxPerOrder: 0,
        seatZone: 'Tầng 2 Khán đài C & D',
        gateEntrance: 'Cổng 4 (Tribune)',
        perks: [
          'Khu vực khán đài trên cao có ghế ngồi định danh',
          'Toàn bộ vé đợt mở bán chính thức đã hết'
        ]
      }
    ]
  },
  {
    id: 'vu-bao-tang-cua-nuoi-tiec',
    title: 'Vũ. - Bảo Tàng Của Nuối Tiếc Concert Tour',
    tourName: 'VIETNAMESE INDIE CONCERT TOUR',
    genre: 'acoustic',
    cityKey: 'hanoi',
    subtitle: 'Đêm nhạc acoustic ấm áp và đầy tự sự gắn kết hàng ngàn trái tim yêu âm nhạc indie mộc mạc.',
    organizerId: 'b0000000-0000-0000-0000-000000000002',
    organizerName: 'Warner Music Vietnam',
    organizerBadge: 'Tour diễn chính thức',
    dateDisplay: 'Thứ Ba, 22/04/2025',
    timeDisplay: '20:00 - 22:30',
    venueName: 'Trung tâm Hội nghị Quốc gia, Hà Nội',
    venueAddress: 'Đại lộ Thăng Long, Mễ Trì, Nam Từ Liêm, Hà Nội',
    gateOpenTime: '18:00',
    minPrice: 650000,
    maxPrice: 2200000,
    isFeatured: true,
    tagBadge: 'Bán chạy',
    bannerImage: '/images/storefront/vu-poster.jpg',
    posterImage: '/images/storefront/vu-poster.jpg',
    stageLayoutImage: '/images/storefront/gallery-finale.jpg',
    description: 'Hành trình âm nhạc đánh dấu album mới nhất của "hoàng tử indie" Vũ. với những bản phối live cùng dàn nhạc thính phòng đặc biệt.',
    admissionPolicy: [
      'Trang phục lịch sự, đến trước giờ biểu diễn 30 phút.',
      'Không chụp ảnh flash trong suốt buổi hòa nhạc.'
    ],
    tiers: [
      {
        id: 'c0000000-0000-0000-0000-000000000005',
        tierKey: 'diamond',
        tierName: 'Khu Hàng Đầu - Thính Phòng',
        price: 2200000,
        totalQuantity: 100,
        availableQuantity: 24,
        maxPerOrder: 4,
        seatZone: 'Hàng A & B Chính Diện',
        gateEntrance: 'Cổng Hội Trường VIP',
        perks: ['Ghế ngồi đệm nhung sang trọng', 'CD có chữ ký độc quyền của Vũ.']
      },
      {
        id: 'c0000000-0000-0000-0000-000000000006',
        tierKey: 'ga',
        tierName: 'Khu Phổ Thông',
        price: 650000,
        totalQuantity: 400,
        availableQuantity: 110,
        maxPerOrder: 4,
        seatZone: 'Tầng Lửng Khán Phòng',
        gateEntrance: 'Cổng 2 Khán Phòng',
        perks: ['Tầm nhìn bao quát toàn bộ sân khấu']
      }
    ]
  },
  {
    id: 'hay-glamping-music-festival',
    title: 'HAY GLAMPING MUSIC FESTIVAL 2025',
    tourName: 'OUTDOOR NATURE FESTIVAL',
    genre: 'rock',
    cityKey: 'hanoi',
    subtitle: 'Lễ hội âm nhạc dã ngoại kết hợp cắm trại ngoài trời lớn nhất mùa hè với hàng chục ban nhạc quốc tế.',
    organizerId: 'b0000000-0000-0000-0000-000000000003',
    organizerName: 'TheBROS Entertainment',
    organizerBadge: 'Lễ hội ngoài trời',
    dateDisplay: 'Thứ Bảy, 03/05/2025',
    timeDisplay: '14:00 - 23:30',
    venueName: 'Công viên Yên Sở, Hà Nội',
    venueAddress: 'Km 1.5 Pháp Vân, Yên Sở, Hoàng Mai, Hà Nội',
    gateOpenTime: '12:00',
    minPrice: 900000,
    maxPrice: 3200000,
    isFeatured: true,
    tagBadge: 'Mở bán sớm',
    bannerImage: '/images/storefront/hay-poster.jpg',
    posterImage: '/images/storefront/hay-poster.jpg',
    stageLayoutImage: '/images/storefront/atsh-stage.jpg',
    description: 'Hòa mình giữa thiên nhiên xanh mát cùng âm nhạc đa dạng từ Pop, Indie, Rock đến Electronic kết hợp khu ẩm thực Glamping cao cấp.',
    admissionPolicy: [
      'Có khu vực lều trại nghỉ ngơi riêng biệt cho khách VIP.',
      'Sự kiện diễn ra dưới mọi điều kiện thời tiết.'
    ],
    tiers: [
      {
        id: 'c0000000-0000-0000-0000-000000000007',
        tierKey: 'diamond',
        tierName: 'Glamping VIP Tent Pass',
        price: 3200000,
        totalQuantity: 50,
        availableQuantity: 12,
        maxPerOrder: 2,
        seatZone: 'Khu Lều Glamping Thượng Hạng',
        gateEntrance: 'Cổng Glamping Riêng',
        perks: ['Lều trang bị máy lạnh & sofa', 'Buffet tiệc nướng BBQ & đồ uống không giới hạn']
      },
      {
        id: 'c0000000-0000-0000-0000-000000000008',
        tierKey: 'ga',
        tierName: 'Early Bird Pass (Sân cỏ)',
        price: 900000,
        totalQuantity: 600,
        availableQuantity: 280,
        maxPerOrder: 6,
        seatZone: 'Bãi Cỏ Tự Do Toàn Khu',
        gateEntrance: 'Cổng Hay Festival 1 & 2',
        perks: ['Tham gia toàn bộ các sân khấu âm nhạc']
      }
    ]
  },
  {
    id: 'mono-22-live-concert',
    title: 'MONO - 22 LIVE CONCERT EXPERIENCE',
    tourName: 'CYBERPOP FUTURE EXPERIENCE',
    genre: 'pop',
    cityKey: 'hcm',
    subtitle: 'Đêm diễn bùng nổ của nam ca sĩ trẻ với phong cách biểu diễn lôi cuốn cùng dàn dancer quốc tế.',
    organizerId: 'b0000000-0000-0000-0000-000000000004',
    organizerName: 'Onionn Music Production',
    organizerBadge: 'Đêm nhạc solo',
    dateDisplay: 'Chủ Nhật, 18/05/2025',
    timeDisplay: '19:30 - 22:30',
    venueName: 'Nhà thi đấu Nguyễn Du, TP. Hồ Chí Minh',
    venueAddress: '116 Nguyễn Du, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    gateOpenTime: '17:30',
    minPrice: 700000,
    maxPrice: 2500000,
    isFeatured: true,
    tagBadge: 'Mới công bố',
    bannerImage: '/images/storefront/mono-poster.jpg',
    posterImage: '/images/storefront/mono-poster.jpg',
    stageLayoutImage: '/images/storefront/gallery-finale.jpg',
    description: 'Chuyến lưu diễn solo đầu tiên của MONO tái hiện album 22 với các bản hit Waiting For You, Em Là, Cười Lên Nào cùng sân khấu visual LED vòng cung.',
    admissionPolicy: [
      'Dành cho khán giả từ 14 tuổi trở lên.',
      'Check-in qua mã QR trên điện thoại thông minh.'
    ],
    tiers: [
      {
        id: 'c0000000-0000-0000-0000-000000000009',
        tierKey: 'diamond',
        tierName: 'VVIP Standing Fanzone',
        price: 2500000,
        totalQuantity: 150,
        availableQuantity: 35,
        maxPerOrder: 4,
        seatZone: 'Fanzone Trung Tâm Sân Khấu',
        gateEntrance: 'Cổng VIP Nguyễn Du',
        perks: ['Soundcheck độc quyền', 'Bộ quà tặng Lightstick + Card bo góc MONO']
      },
      {
        id: 'c0000000-0000-0000-0000-000000000010',
        tierKey: 'ga',
        tierName: 'GA Khán Đài B',
        price: 700000,
        totalQuantity: 500,
        availableQuantity: 210,
        maxPerOrder: 6,
        seatZone: 'Khán Đài Tầng 2',
        gateEntrance: 'Cổng Khán Đài B',
        perks: ['Ghế ngồi định danh có tầm nhìn thẳng']
      }
    ]
  },
  {
    id: 'soobin-live-bat-noc-nha',
    title: 'SOOBIN - THE FIRST LIVE CONCERT: BẬT NÓC NHÀ',
    tourName: 'BẬT NÓC NHÀ NATIONAL TOUR',
    genre: 'pop',
    cityKey: 'hcm',
    subtitle: 'Concert cá nhân đầu tiên của SOOBIN với dàn khách mời SpaceSpeakers và âm thanh chuẩn festival quốc tế.',
    organizerId: 'b0000000-0000-0000-0000-000000000005',
    organizerName: 'SpaceSpeakers Group',
    organizerBadge: 'Đêm nhạc solo đỉnh cao',
    dateDisplay: 'Thứ Bảy, 26/04/2025',
    timeDisplay: '20:00 - 23:00',
    venueName: 'SVĐ Quân Khu 7, TP.HCM',
    venueAddress: '202 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP.HCM',
    gateOpenTime: '16:00',
    minPrice: 850000,
    maxPrice: 3800000,
    isFeatured: true,
    tagBadge: 'Sắp hết vé GA',
    bannerImage: '/images/storefront/soul-city.jpg',
    posterImage: '/images/storefront/soul-city.jpg',
    stageLayoutImage: '/images/storefront/atsh-stage.jpg',
    description: 'Đêm concert bùng nổ của SOOBIN quy tụ các ca khúc trong album Bật Nóc Nhà cùng màn trình diễn live band và vũ đạo đỉnh cao.',
    admissionPolicy: ['Không mang đồ ăn uống từ ngoài vào', 'Trẻ em dưới 10 tuổi cần người lớn đi kèm'],
    tiers: [
      {
        id: 'tier-soobin-vip',
        tierKey: 'diamond',
        tierName: 'VIP Bật Nóc Nhà',
        price: 3800000,
        totalQuantity: 100,
        availableQuantity: 20,
        maxPerOrder: 4,
        seatZone: 'Khu A Trực Diện Sân Khấu',
        gateEntrance: 'Cổng VIP',
        perks: ['Vé Soundcheck độc quyền', 'Bộ quà tặng Lightstick + Nón SpaceSpeakers']
      },
      {
        id: 'tier-soobin-ga',
        tierKey: 'ga',
        tierName: 'GA Fanzone Sân Cỏ',
        price: 850000,
        totalQuantity: 800,
        availableQuantity: 150,
        maxPerOrder: 6,
        seatZone: 'Khu Đứng Fanzone',
        gateEntrance: 'Cổng 2 & 3',
        perks: ['Vòng tay phát sáng', 'Tự do di chuyển trong fanzone']
      }
    ]
  },
  {
    id: 'cyber-beats-edm-festival',
    title: 'CYBER BEATS 2025: RAVING UNDERGROUND SAIGON',
    tourName: 'ELECTRONIC & TRANCE FESTIVAL',
    genre: 'edm',
    cityKey: 'hcm',
    subtitle: 'Đại tiệc âm nhạc điện tử dưới lòng đất với dàn DJ Top 100 thế giới và công nghệ laser 3D.',
    organizerId: 'b0000000-0000-0000-0000-000000000006',
    organizerName: 'Cyber Beats Agency',
    organizerBadge: 'Lễ hội EDM quốc tế',
    dateDisplay: 'Thứ Tư, 30/04/2025',
    timeDisplay: '18:00 - 02:00',
    venueName: 'SECC Tân Trào, Quận 7, TP.HCM',
    venueAddress: '799 Nguyễn Văn Linh, Tân Phú, Quận 7, TP.HCM',
    gateOpenTime: '17:00',
    minPrice: 950000,
    maxPrice: 3500000,
    isFeatured: true,
    tagBadge: 'Chỉ còn 50 vé',
    bannerImage: '/images/storefront/cyber-beats.jpg',
    posterImage: '/images/storefront/cyber-beats.jpg',
    stageLayoutImage: '/images/storefront/gallery-lasers.jpg',
    description: 'Trải nghiệm đỉnh cao của âm thanh điện tử bassline mạnh mẽ, dàn laser 3D phủ kín không gian SECC rộng hàng chục nghìn mét vuông.',
    admissionPolicy: ['Chỉ dành cho khán giả từ 18 tuổi trở lên', 'Xuất trình CCCD khi check-in'],
    tiers: [
      {
        id: 'tier-cyber-vip',
        tierKey: 'diamond',
        tierName: 'Cyber VIP Deck Pass',
        price: 3500000,
        totalQuantity: 60,
        availableQuantity: 15,
        maxPerOrder: 2,
        seatZone: 'Khu Bục VIP Nâng Cao',
        gateEntrance: 'Cổng VIP',
        perks: ['Đồ uống miễn phí cả đêm', 'Khu vệ sinh riêng biệt và quầy bar độc quyền']
      },
      {
        id: 'tier-cyber-ga',
        tierKey: 'ga',
        tierName: 'General Admission (GA)',
        price: 950000,
        totalQuantity: 1000,
        availableQuantity: 320,
        maxPerOrder: 6,
        seatZone: 'Sàn Nhảy Trung Tâm',
        gateEntrance: 'Cổng Chính SECC',
        perks: ['Vòng tay LED đồng bộ âm nhạc']
      }
    ]
  },
  {
    id: 'den-vau-show-2025',
    title: 'ĐEN VÂU - SHOW CỦA ĐEN 2025 HÀ NỘI',
    tourName: 'SHOW CỦA ĐEN 2025',
    genre: 'rap',
    cityKey: 'hanoi',
    subtitle: 'Đêm rap ấm áp và ý nghĩa nhất năm với sự đồng ca của hàng chục ngàn Đồng Âm trên nền nhạc cụ dân tộc.',
    organizerId: 'b0000000-0000-0000-0000-000000000007',
    organizerName: 'Đen Vâu Production',
    organizerBadge: 'Live Concert Độc Quyền',
    dateDisplay: 'Thứ Bảy, 10/05/2025',
    timeDisplay: '20:00 - 23:30',
    venueName: 'Cung Điền Kinh Mỹ Đình, Hà Nội',
    venueAddress: 'Đường Trần Hữu Dực, Cầu Diễn, Nam Từ Liêm, Hà Nội',
    gateOpenTime: '17:00',
    minPrice: 750000,
    maxPrice: 2800000,
    isFeatured: true,
    tagBadge: 'Mở bán sớm',
    bannerImage: '/images/storefront/gallery-sing.jpg',
    posterImage: '/images/storefront/gallery-sing.jpg',
    stageLayoutImage: '/images/storefront/gallery-finale.jpg',
    description: 'Chuyến hạnh ngộ âm nhạc giữa Đen và các Đồng Âm tại thủ đô Hà Nội với toàn bộ những bản rap gắn liền với thanh xuân cùng dàn bè giao hưởng.',
    admissionPolicy: ['Không mang rác thải nhựa vào sân', 'Khuyến khích mang bình nước cá nhân'],
    tiers: [
      {
        id: 'tier-den-vip',
        tierKey: 'diamond',
        tierName: 'Khu Đồng Âm Gần Nhất (VIP)',
        price: 2800000,
        totalQuantity: 120,
        availableQuantity: 28,
        maxPerOrder: 4,
        seatZone: 'Sát Sân Khấu Chính',
        gateEntrance: 'Cổng Đồng Âm 1',
        perks: ['Quà lưu niệm độc quyền từ Đen', 'Áo thun kỷ niệm Show Của Đen 2025']
      },
      {
        id: 'tier-den-ga',
        tierKey: 'ga',
        tierName: 'Khu Sân Cỏ Tự Do (GA)',
        price: 750000,
        totalQuantity: 900,
        availableQuantity: 410,
        maxPerOrder: 6,
        seatZone: 'Sân Cỏ Trung Tâm',
        gateEntrance: 'Cổng Đồng Âm 2 & 3',
        perks: ['Tự do chọn vị trí đứng hòa giọng cùng Đen']
      }
    ]
  },
  {
    id: 'ha-anh-tuan-the-glorious',
    title: 'HÀ ANH TUẤN - THE GLORIOUS LIVE CONCERT',
    tourName: 'THE GLORIOUS CONCERT TOUR',
    genre: 'acoustic',
    cityKey: 'danang',
    subtitle: 'Bản tình ca diệu kỳ giữa không gian phố cổ lãng mạn cùng dàn nhạc giao hưởng quốc tế.',
    organizerId: 'b0000000-0000-0000-0000-000000000008',
    organizerName: 'Viet Vision Music',
    organizerBadge: 'Đêm nhạc acoustic thính phòng',
    dateDisplay: 'Thứ Bảy, 17/05/2025',
    timeDisplay: '19:30 - 22:30',
    venueName: 'Quảng trường Sông Hoài, Hội An, Quảng Nam',
    venueAddress: 'Đường 18 Tháng 8, Phường Cẩm Phô, TP. Hội An',
    gateOpenTime: '17:30',
    minPrice: 1200000,
    maxPrice: 5000000,
    isFeatured: true,
    tagBadge: 'VIP Pass giới hạn',
    bannerImage: '/images/storefront/concert-lights.jpg',
    posterImage: '/images/storefront/concert-lights.jpg',
    stageLayoutImage: '/images/storefront/gallery-finale.jpg',
    description: 'Đêm diễn độc nhất vô nhị bên dòng sông Hoài thơ mộng, thưởng thức những câu chuyện tình bằng âm nhạc tinh tế của ca sĩ Hà Anh Tuấn.',
    admissionPolicy: ['Trang phục dress code trắng/be thanh lịch', 'Không trẻ em dưới 8 tuổi'],
    tiers: [
      {
        id: 'tier-hat-vip',
        tierKey: 'diamond',
        tierName: 'Glorious Platinum VIP',
        price: 5000000,
        totalQuantity: 80,
        availableQuantity: 12,
        maxPerOrder: 2,
        seatZone: 'Bàn Tiệc Rượu Vang Mặt Sông',
        gateEntrance: 'Cổng Bạch Kim',
        perks: ['Thưởng thức vang cao cấp và canape', 'Sách ảnh nghệ thuật có chữ ký']
      },
      {
        id: 'tier-hat-ga',
        tierKey: 'ga',
        tierName: 'Khu Khán Đài Gió Sông',
        price: 1200000,
        totalQuantity: 400,
        availableQuantity: 110,
        maxPerOrder: 4,
        seatZone: 'Khán Đài Bậc Thang View Trực Diện',
        gateEntrance: 'Cổng Gió Sông',
        perks: ['Ghế ngồi có đệm êm ái']
      }
    ]
  },
  {
    id: 'hoang-dung-yen-concert',
    title: 'HOÀNG DŨNG - XUÂN THÌ & YÊN CONCERT ĐÀ LẠT',
    tourName: 'YÊN ACOUSTIC LIVE SESSIONS',
    genre: 'acoustic',
    cityKey: 'danang',
    subtitle: 'Đêm nhạc hoàng hôn giữa đồi thông ngập tràn cảm xúc cùng giọng ca ngọt ngào của Hoàng Dũng.',
    organizerId: 'b0000000-0000-0000-0000-000000000009',
    organizerName: 'Mây Lang Thang Đà Lạt',
    organizerBadge: 'Đêm nhạc hoàng hôn',
    dateDisplay: 'Thứ Bảy, 24/05/2025',
    timeDisplay: '17:00 - 19:45',
    venueName: 'Mây Lang Thang, TP. Đà Lạt',
    venueAddress: 'Hoàng Hoa Thám, Phường 10, TP. Đà Lạt, Lâm Đồng',
    gateOpenTime: '15:30',
    minPrice: 600000,
    maxPrice: 1800000,
    isFeatured: true,
    tagBadge: 'Vé Acoustic',
    bannerImage: '/images/storefront/gallery-lightsticks.jpg',
    posterImage: '/images/storefront/gallery-lightsticks.jpg',
    stageLayoutImage: '/images/storefront/atsh-stage.jpg',
    description: 'Thưởng thức trà chiều, ngắm hoàng hôn buông xuống đồi thông Đà Lạt và lắng nghe Nàng Thơ, Đôi Lời Tình Ca qua giọng hát mộc của Hoàng Dũng.',
    admissionPolicy: ['Thời tiết Đà Lạt lạnh về chiều tối, vui lòng chuẩn bị áo ấm'],
    tiers: [
      {
        id: 'tier-hd-vip',
        tierKey: 'diamond',
        tierName: 'Hàng Ghế VIP Hoàng Hôn',
        price: 1800000,
        totalQuantity: 50,
        availableQuantity: 10,
        maxPerOrder: 4,
        seatZone: 'Hàng Đầu Ngắm Trọn Đồi Thông',
        gateEntrance: 'Cổng Mây VIP',
        perks: ['Set trà bánh cao cấp', 'Chụp ảnh kỷ niệm cùng Hoàng Dũng']
      },
      {
        id: 'tier-hd-ga',
        tierKey: 'ga',
        tierName: 'Khu Bãi Cỏ Thông Reo',
        price: 600000,
        totalQuantity: 250,
        availableQuantity: 80,
        maxPerOrder: 6,
        seatZone: 'Thảm Cỏ Tự Do',
        gateEntrance: 'Cổng Mây 2',
        perks: ['Gối ngồi êm ái và 01 đồ uống miễn phí']
      }
    ]
  },
  {
    id: 'chillies-tren-nhung-dam-may',
    title: 'CHILLIES - TRÊN NHỮNG ĐÁM MÂY ARENA TOUR',
    tourName: 'TRÊN NHỮNG ĐÁM MÂY TOUR 2025',
    genre: 'rock',
    cityKey: 'hcm',
    subtitle: 'Tour diễn rock bùng nổ của ban nhạc Chillies với hệ thống visual đồ họa mây bay độc quyền.',
    organizerId: 'b0000000-0000-0000-0000-000000000010',
    organizerName: 'Chillies Records',
    organizerBadge: 'Rock Concert Chính Thức',
    dateDisplay: 'Thứ Bảy, 31/05/2025',
    timeDisplay: '19:30 - 22:30',
    venueName: 'Nhà thi đấu Phú Thọ, TP.HCM',
    venueAddress: '01 Lữ Gia, Phường 15, Quận 11, TP.HCM',
    gateOpenTime: '17:00',
    minPrice: 500000,
    maxPrice: 2000000,
    isFeatured: true,
    tagBadge: 'Fanzone cháy vé',
    bannerImage: '/images/storefront/festival.jpg',
    posterImage: '/images/storefront/festival.jpg',
    stageLayoutImage: '/images/storefront/atsh-stage.jpg',
    description: 'Chuyến lưu diễn kỷ niệm 6 năm hoạt động của Chillies, mang lại những bản rock giàu cảm xúc: Vùng Ký Ức, Giá Như, Mascara, Qua Khung Cửa Sổ.',
    admissionPolicy: ['Khu vực mosh pit chỉ dành cho khán giả khỏe mạnh', 'Nghiêm cấm mang bật lửa'],
    tiers: [
      {
        id: 'tier-chillies-vip',
        tierKey: 'diamond',
        tierName: 'VIP Đám Mây Sát Stage',
        price: 2000000,
        totalQuantity: 90,
        availableQuantity: 18,
        maxPerOrder: 4,
        seatZone: 'Khu VIP Bậc Cao Trực Diện',
        gateEntrance: 'Cổng VIP Phú Thọ',
        perks: ['Túi tote kỷ niệm Tour', 'Soundcheck 3 ca khúc độc quyền']
      },
      {
        id: 'tier-chillies-ga',
        tierKey: 'ga',
        tierName: 'Mosh Pit Standing GA',
        price: 500000,
        totalQuantity: 700,
        availableQuantity: 240,
        maxPerOrder: 6,
        seatZone: 'Fanzone Sàn Thi Đấu',
        gateEntrance: 'Cổng GA 1 & 2',
        perks: ['Vòng tay dạ quang']
      }
    ]
  }
];

export const UPCOMING_CONCERTS: UpcomingConcertItem[] = [
  {
    id: 'cyber-beats-saigon',
    title: 'CYBER BEATS: RAVING UNDERGROUND SAIGON',
    dateText: 'THỨ SÁU NÀY • 20:30',
    relativeTime: 'Diễn ra sau 48h',
    venueText: 'The Observatory, Quận 4, TP.HCM',
    priceText: '450.000₫',
    badgeText: 'Chỉ còn 36 vé',
    badgeType: 'error',
    image: '/images/storefront/cyber-beats.jpg',
    eventId: 'atsh-2026'
  },
  {
    id: 'soul-of-city-nguyen-ha',
    title: 'SOUL OF THE CITY: NGUYÊN HÀ & NHỮNG GIẤC MƠ',
    dateText: 'CHỦ NHẬT • 19:45',
    relativeTime: 'Diễn ra sau 4 ngày',
    venueText: 'Nhà hát VOH Music One, TP.HCM',
    priceText: '550.000₫',
    badgeText: 'Đêm nhạc giới hạn',
    badgeType: 'info',
    image: '/images/storefront/soul-city.jpg',
    eventId: 'vu-bao-tang-cua-nuoi-tiec'
  },
  {
    id: 'soobin-live-bat-noc-nha',
    title: 'SOOBIN - THE FIRST LIVE CONCERT: BẬT NÓC NHÀ',
    dateText: 'THỨ BẢY TUẦN TỚI • 20:00',
    relativeTime: 'Diễn ra sau 7 ngày',
    venueText: 'SVĐ Quân Khu 7, TP.HCM',
    priceText: '850.000₫',
    badgeText: 'Sắp hết vé GA',
    badgeType: 'warning',
    image: '/images/storefront/hero-discovery.jpg',
    eventId: 'atsh-2026'
  },
  {
    id: 'hay-fest-chill',
    title: 'HAY FESTIVAL: INDIE NIGHT CAMPING SESSIONS',
    dateText: 'THỨ SÁU TIẾP THEO • 16:00',
    relativeTime: 'Diễn ra sau 8 ngày',
    venueText: 'Công viên Yên Sở, Hà Nội',
    priceText: '900.000₫',
    badgeText: 'Mở bán đợt 2',
    badgeType: 'info',
    image: '/images/storefront/hay-poster.jpg',
    eventId: 'hay-glamping-music-festival'
  },
  {
    id: 'den-vau-show-2025',
    title: 'ĐEN VÂU - SHOW CỦA ĐEN 2025 HÀ NỘI',
    dateText: '10/05/2025 • 20:00',
    relativeTime: 'Diễn ra sau 12 ngày',
    venueText: 'Cung Điền Kinh Mỹ Đình, Hà Nội',
    priceText: '750.000₫',
    badgeText: 'Mở bán sớm',
    badgeType: 'info',
    image: '/images/storefront/gallery-sing.jpg',
    eventId: 'atsh-2026'
  },
  {
    id: 'ha-anh-tuan-the-glorious',
    title: 'HÀ ANH TUẤN - THE GLORIOUS LIVE CONCERT',
    dateText: '17/05/2025 • 19:30',
    relativeTime: 'Diễn ra sau 18 ngày',
    venueText: 'Phố cổ Hội An, Quảng Nam',
    priceText: '1.200.000₫',
    badgeText: 'VIP Pass giới hạn',
    badgeType: 'warning',
    image: '/images/storefront/gallery-finale.jpg',
    eventId: 'vu-bao-tang-cua-nuoi-tiec'
  },
  {
    id: 'hoang-dung-xuan-thi',
    title: 'HOÀNG DŨNG - XUÂN THÌ LIVE TOUR ĐÀ LẠT',
    dateText: '24/05/2025 • 18:30',
    relativeTime: 'Mở cổng lúc 17:00',
    venueText: 'Mây Lang Thang, Đà Lạt',
    priceText: '600.000₫',
    badgeText: 'Vé Acoustic',
    badgeType: 'info',
    image: '/images/storefront/gallery-lightsticks.jpg',
    eventId: 'mono-22-live-concert'
  },
  {
    id: 'chillies-tren-nhung-dam-may',
    title: 'CHILLIES - TRÊN NHỮNG ĐÁM MÂY ARENA TOUR',
    dateText: '31/05/2025 • 19:30',
    relativeTime: 'Sắp mở bán',
    venueText: 'Nhà thi đấu Phú Thọ, TP.HCM',
    priceText: '500.000₫',
    badgeText: 'Fanzone cháy vé',
    badgeType: 'error',
    image: '/images/storefront/gallery-lasers.jpg',
    eventId: 'hay-glamping-music-festival'
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
