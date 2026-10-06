import * as THREE from 'three';
import { MarketplaceListingDto } from '@ticketshield/types';
import { formatEventDateTime, formatVND } from '../../../utils/formatters';

// Helper to draw rounded rectangle with cross-browser fallback
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

/**
 * Procedural Anodized Brushed Metal Bump Texture
 * Produces micro-grain speckles and fine brushed streaks for authentic PBR metal feel
 */
export function createBrushedMetalBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const idx = (y * 512 + x) * 4;
      const grain = (Math.random() - 0.5) * 42;
      const streak = Math.sin(x * 0.04 + y * 0.25) * 7;
      const val = Math.min(255, Math.max(0, 128 + grain + streak));
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  return tex;
}

/**
 * Left Screen Canvas Texture
 * Clean, bold TicketShield dark theme with high-contrast amber/cyan glow & crisp typography
 */
export function createLeftScreenTexture(listing?: MarketplaceListingDto, bundleCount = 3): {
  texture: THREE.CanvasTexture;
  update: (time: number) => void;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d')!;

  const eventName = listing?.eventName || 'Anh Trai Say Hi Concert 2026';
  const tierName = listing?.tierName || 'VIP ZONE B';
  const count = listing?.bundleTotalTickets || bundleCount;
  const seatZone = listing?.seatZone || 'VIP Zone B - Hàng 3, Ghế 12';
  const eventDate = listing?.eventStartAt
    ? formatEventDateTime(listing.eventStartAt)
    : '05 Th11 2026 • 19:30';
  const venue = listing?.eventVenue || 'SVĐ Quân Khu 7, TP.HCM';
  const organizer = listing?.organizerName ? `BTC: ${listing.organizerName}` : 'BTC: VieON Entertainment';
  const seller = listing?.sellerFullName ? `Seller: ${listing.sellerFullName}` : 'Seller: Hoàng Thông';

  function draw(time = 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Deep OLED Obsidian Background (TicketShield Theme)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#090d15');
    bgGrad.addColorStop(0.5, '#06080d');
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Subtle Upper Ambient Horizon Glow (Soft cyan/amber backlight)
    const glowGrad = ctx.createRadialGradient(
      canvas.width * 0.35, 120, 50,
      canvas.width * 0.35, 120, 600
    );
    glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
    glowGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, canvas.width, 350);

    // 3. Ultra-subtle Micro-Grid (Rất mờ, không tạo sọc răng cưa che chữ)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    for (let gy = 40; gy < canvas.height; gy += 40) {
      ctx.fillRect(0, gy, canvas.width, 1);
    }

    // 4. Header Badges
    const badgeY = 60;
    const badgeH = 92;

    // Cyan Tier Badge: "• VIP ZONE A" (from user's .badge-zone)
    const cyanPillW = 440;
    ctx.save();
    ctx.fillStyle = '#111e29';
    roundedRect(ctx, 70, badgeY, cyanPillW, badgeH, 24);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Pulsing Cyan Dot
    const pulse = 0.85 + 0.15 * Math.sin(time * 3);
    ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(120, badgeY + badgeH / 2, 11, 0, Math.PI * 2);
    ctx.fill();

    // Tier Text
    ctx.font = '700 42px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
    ctx.shadowBlur = 8;
    ctx.textBaseline = 'middle';
    ctx.fillText(`• ${tierName.toUpperCase().slice(0, 15)}`, 150, badgeY + badgeH / 2);
    ctx.restore();

    // Orange Bundle Badge: "BUNDLE (N TICKETS)" (from user's .badge-bundle)
    const orangePillW = 560;
    ctx.save();
    ctx.fillStyle = '#2a1608';
    roundedRect(ctx, 540, badgeY, orangePillW, badgeH, 24);
    ctx.fill();
    ctx.strokeStyle = '#ff7a18';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = '800 40px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ff9142';
    ctx.shadowColor = 'rgba(255, 122, 24, 0.6)';
    ctx.shadowBlur = 12;
    ctx.textBaseline = 'middle';
    ctx.fillText(`BUNDLE (${count} TICKETS)`, 580, badgeY + badgeH / 2);
    ctx.restore();

    // 5. Concert Title: KHỔNG LỒ & BOLD (#ffffff)
    ctx.save();
    ctx.font = '800 108px "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
    ctx.shadowBlur = 16;
    ctx.letterSpacing = '-1.5px';
    const displayTitle = eventName.length > 24 ? `${eventName.slice(0, 22)}...` : eventName;
    ctx.fillText(displayTitle, 70, 285);
    ctx.restore();

    // 6. Glowing Horizontal Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, 370);
    ctx.lineTo(canvas.width - 70, 370);
    ctx.stroke();

    // 7. Event Metadata (Matching user's .event-meta: #9aa5b5 and #e2e8f0)
    // Row 1: Venue
    const metaY1 = 490;
    ctx.save();
    ctx.fillStyle = '#ff7a18';
    ctx.font = '700 54px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('📍', 70, metaY1);

    ctx.fillStyle = '#9aa5b5';
    ctx.font = '500 50px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(venue.slice(0, 44), 145, metaY1);

    // Row 2: Date & Seller
    const metaY2 = 640;
    ctx.fillStyle = '#ff7a18';
    ctx.font = '700 54px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('📅', 70, metaY2);

    ctx.fillStyle = '#9aa5b5';
    ctx.font = '500 48px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(eventDate, 145, metaY2);

    const dateW = ctx.measureText(eventDate).width;
    const sellerX = Math.max(145 + dateW + 60, 960);

    ctx.fillStyle = '#9aa5b5';
    ctx.fillText('👤 Seller: ', sellerX, metaY2);
    const sellerLabelW = ctx.measureText('👤 Seller: ').width;

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 48px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(seller.slice(0, 24), sellerX + sellerLabelW, metaY2);

    // Divider Line 2
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(70, 720);
    ctx.lineTo(canvas.width - 70, 720);
    ctx.stroke();

    // Row 3: Organizer
    const metaY3 = 810;
    ctx.fillStyle = '#627284';
    ctx.font = '500 44px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(organizer.slice(0, 36), 70, metaY3);

    ctx.fillStyle = '#34d399';
    ctx.font = '700 44px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('✓ BTC Verified', sellerX, metaY3);
    ctx.restore();

    // 8. Bottom Border Inner Shadow
    const bottomShadow = ctx.createLinearGradient(0, canvas.height - 40, 0, canvas.height);
    bottomShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bottomShadow.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = bottomShadow;
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
  }

  draw(0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  return {
    texture,
    update: (time: number) => {
      draw(time);
      texture.needsUpdate = true;
    },
  };
}

/**
 * Right Screen Canvas Texture with IN-SCREEN TOUCH BUTTON
 * Phù hợp theme TicketShield, kích thước chữ và nút to rõ, dễ bấm
 */
export function createRightScreenTexture(
  listing?: MarketplaceListingDto,
  totalResalePrice?: number
): {
  texture: THREE.CanvasTexture;
  update: () => void;
  setPressed: (pressed: boolean) => void;
  isButtonUV: (uv: THREE.Vector2) => boolean;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 1100;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d')!;
  let isPressed = false;

  const code = listing?.maskedTicketCode || 'AT*******99';
  const count = listing?.bundleTotalTickets || 3;
  const priceNumber = totalResalePrice || listing?.resalePrice || 5500000;
  const formattedPriceStr = priceNumber >= 1000000
    ? (priceNumber / 1).toLocaleString('vi-VN')
    : priceNumber.toLocaleString('vi-VN');

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Deep OLED Obsidian Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#090d15');
    bgGrad.addColorStop(0.5, '#06080d');
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Subtle Horizon Glow
    const glowGrad = ctx.createRadialGradient(
      canvas.width * 0.5, 120, 40,
      canvas.width * 0.5, 120, 500
    );
    glowGrad.addColorStop(0, 'rgba(255, 122, 24, 0.08)');
    glowGrad.addColorStop(1, 'rgba(255, 122, 24, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, canvas.width, 350);

    // 3. Status Code (from user's .serial-box)
    const idBoxW = 480;
    const idBoxH = 92;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    roundedRect(ctx, 60, 60, idBoxW, idBoxH, 16);
    ctx.fill();
    ctx.strokeStyle = '#332414';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = '700 48px "VT323", monospace';
    ctx.fillStyle = '#ffaa5e';
    ctx.shadowColor = '#ff7a18';
    ctx.shadowBlur = 12;
    ctx.letterSpacing = '3px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(code, 60 + idBoxW / 2, 60 + idBoxH / 2);
    ctx.restore();

    // 4. Price Section (from user's .price-section: .price-label #717d8f, .price-val #ffffff)
    const priceY = 260;
    ctx.save();
    ctx.font = '700 38px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#717d8f';
    ctx.letterSpacing = '1px';
    ctx.fillText(`PRICE (BUNDLE ${count}X)`, 60, priceY);

    // Huge Glowing White Price (.price-val)
    const isVeryLong = formattedPriceStr.length > 10;
    ctx.font = isVeryLong
      ? '800 138px "Plus Jakarta Sans", sans-serif'
      : '800 162px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = 24;
    ctx.letterSpacing = '-2px';
    ctx.fillText(formattedPriceStr, 60, priceY + 155);

    const priceW = ctx.measureText(formattedPriceStr).width;
    ctx.font = '800 58px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.fillText('VND', 60 + priceW + 20, priceY + 155);

    // Verified tag (.verified-tag: #627284)
    ctx.font = '500 40px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#627284';
    ctx.shadowBlur = 0;
    ctx.fillText('✓ Organizer Verified Price', 60, priceY + 235);
    ctx.restore();

    // 5. Tactile Matrix Button: "XEM & MUA →" (.btn-action-matrix: linear-gradient(180deg, #ff8c2b 0%, #e65c00 100%))
    const btnX = 60;
    const btnY = 660;
    const btnW = canvas.width - 120; // 980
    const btnH = 460;
    const btnR = 36;

    ctx.save();
    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    if (isPressed) {
      btnGrad.addColorStop(0, '#c74e00');
      btnGrad.addColorStop(1, '#e65c00');
    } else {
      btnGrad.addColorStop(0, '#ff8c2b');
      btnGrad.addColorStop(1, '#e65c00');
    }
    ctx.fillStyle = btnGrad;
    ctx.shadowColor = 'rgba(255, 122, 24, 0.7)';
    ctx.shadowBlur = 32;
    roundedRect(ctx, btnX, btnY, btnW, btnH, btnR);
    ctx.fill();

    // Border highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Button Text: Huge Crisp White
    ctx.font = '800 86px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('XEM & MUA →', btnX + btnW / 2, btnY + btnH / 2);
    ctx.restore();
  }

  draw();
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  return {
    texture,
    update: () => {
      draw();
      texture.needsUpdate = true;
    },
    setPressed: (pressed: boolean) => {
      isPressed = pressed;
      draw();
      texture.needsUpdate = true;
    },
    isButtonUV: (uv: THREE.Vector2) => {
      const px = uv.x * 1100;
      const py = (1 - uv.y) * 1200;
      return px >= 60 && px <= 1040 && py >= 660 && py <= 1120;
    },
  };
}

/**
 * Ticket #1 (Front) Texture
 */
export function createTicket1Texture(listing?: MarketplaceListingDto, item?: MarketplaceListingDto): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d')!;

  const title = (listing?.eventName || 'Anh Trai Say Hi').slice(0, 20);
  const zone = item?.seatZone || listing?.seatZone || 'GA STANDING ZONE 2';
  const priceStr = formatVND(item?.resalePrice || listing?.resalePrice || 50000);
  const code = item?.maskedTicketCode || '18888278888';

  // Left root section (anchored inside machine slot)
  ctx.fillStyle = '#0a0d13';
  ctx.fillRect(0, 0, 360, canvas.height);

  // Left root metallic telemetry
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(330, 0, 30, canvas.height);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('2026', 60, 480);
  ctx.font = '500 24px monospace';
  ctx.fillText('SECURE PASS', 60, 540);
  ctx.fillText('VERIFIED BTC', 60, 590);
  ctx.fillText('SMART PASS #1', 60, 640);

  // Right section: Crisp White Card Stock
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(360, 0, canvas.width - 360, canvas.height);

  // ATSH Prismatic Logo
  const logoX = 420;
  const logoY = 90;
  ctx.save();
  ctx.translate(logoX, logoY);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(32, 32);
  ctx.lineTo(18, 48);
  ctx.lineTo(-14, 16);
  ctx.closePath();
  ctx.fillStyle = '#f97316';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(38, 0);
  ctx.lineTo(6, 32);
  ctx.lineTo(18, 48);
  ctx.lineTo(50, 16);
  ctx.closePath();
  ctx.fillStyle = '#06b6d4';
  ctx.fill();
  ctx.restore();

  // VieON Logo
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
  ctx.fillText('Vie', 510, 138);

  ctx.fillStyle = '#22c55e';
  roundedRect(ctx, 585, 100, 78, 46, 10);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.fillText('ON', 598, 138);

  // Event Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
  ctx.fillText(title, 420, 260);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.fillText('Concert 2026', 420, 315);

  // Zone pill badge
  ctx.fillStyle = '#f1f5f9';
  roundedRect(ctx, 420, 375, 410, 64, 32);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#0284c7';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.fillText(`🎟  ${zone.slice(0, 20)}`, 440, 418);

  // High-Density Vertical Barcode
  const barX = 420;
  const barY = 480;
  const barW = 420;
  const barH = 340;
  ctx.fillStyle = '#0f172a';
  for (let i = 0; i < 46; i++) {
    const isThick = i % 3 === 0 || i % 7 === 0;
    const w = isThick ? 6 : 2.5;
    ctx.fillRect(barX + i * 8.8, barY, w, barH);
  }

  // Serial Number
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(code, barX + barW / 2, barY + barH + 35);
  ctx.textAlign = 'left';

  // Price at bottom of card
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 72px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '-1px';
  ctx.fillText(priceStr, 420, 1020);

  // Organizer Verified footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('PASS #1 // TICKETSHIELD PROTOCOL', 420, 1110);

  // Ticket Notch
  ctx.fillStyle = '#0c0f17';
  ctx.beginPath();
  ctx.arc(660, 0, 36, 0, Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(660, canvas.height, 36, Math.PI, 0);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Ticket #2 (Mid) Texture: Slate finish
 */
export function createTicket2Texture(listing?: MarketplaceListingDto, item?: MarketplaceListingDto): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d')!;

  const title = (listing?.eventName || 'Anh Trai Say Hi').slice(0, 20);
  const priceStr = formatVND(item?.resalePrice || listing?.resalePrice || 50000);

  ctx.fillStyle = '#070a10';
  ctx.fillRect(0, 0, 360, canvas.height);

  // Slate metallic card stock
  ctx.fillStyle = '#334155';
  ctx.fillRect(360, 0, canvas.width - 360, canvas.height);

  ctx.fillStyle = '#475569';
  ctx.fillRect(360, 0, canvas.width - 360, 160);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
  ctx.fillText(title, 420, 240);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
  ctx.fillText('Concert 2026 • PASS #2', 420, 290);

  // Barcode
  ctx.fillStyle = '#f8fafc';
  for (let i = 0; i < 44; i++) {
    const isThick = i % 4 === 0;
    const w = isThick ? 5 : 2;
    ctx.fillRect(420 + i * 9, 440, w, 320);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 72px system-ui, -apple-system, sans-serif';
  ctx.fillText(priceStr, 420, 960);

  // Notches
  ctx.fillStyle = '#0c0f17';
  ctx.beginPath();
  ctx.arc(660, 0, 36, 0, Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(660, canvas.height, 36, Math.PI, 0);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Ticket #3 (Back) Texture: Dark carbon finish
 */
export function createTicket3Texture(listing?: MarketplaceListingDto, item?: MarketplaceListingDto): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d')!;

  const title = (listing?.eventName || 'Anh Trai Say Hi').slice(0, 20);
  const priceStr = formatVND(item?.resalePrice || listing?.resalePrice || 50000);

  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, 360, canvas.height);

  // Dark carbon card stock
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(360, 0, canvas.width - 360, canvas.height);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
  ctx.fillText(title, 420, 240);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
  ctx.fillText('Concert 2026 • PASS #3', 420, 290);

  // Barcode
  ctx.fillStyle = '#94a3b8';
  for (let i = 0; i < 44; i++) {
    const isThick = i % 5 === 0;
    const w = isThick ? 5 : 2;
    ctx.fillRect(420 + i * 9, 440, w, 320);
  }

  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 72px system-ui, -apple-system, sans-serif';
  ctx.fillText(priceStr, 420, 960);

  // Notches
  ctx.fillStyle = '#0c0f17';
  ctx.beginPath();
  ctx.arc(660, 0, 36, 0, Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(660, canvas.height, 36, Math.PI, 0);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}
