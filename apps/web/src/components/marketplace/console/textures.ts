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
 * Left Screen Canvas Texture
 * Clean, modern AMOLED display showing real listing details
 */
export function createLeftScreenTexture(listing?: MarketplaceListingDto, bundleCount = 3): {
  texture: THREE.CanvasTexture;
  update: (time: number) => void;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1300;
  const ctx = canvas.getContext('2d')!;

  const eventName = listing?.eventName || 'Anh Trai Say Hi Concert 2026';
  const tierName = listing?.tierName || 'GA STANDING';
  const count = listing?.bundleTotalTickets || bundleCount;
  const seatZone = listing?.seatZone || 'GA Standing Zone 2';
  const eventDate = listing?.eventStartAt
    ? formatEventDateTime(listing.eventStartAt)
    : '05 Nov 2026, 02:11';
  const venue = listing?.eventVenue || 'Van Hanh Mall Stadium, TP.HCM';
  const organizer = listing?.organizerName ? `BTC: ${listing.organizerName}` : 'BTC: VieON Entertainment';
  const seller = listing?.sellerFullName ? `✔  Seller: ${listing.sellerFullName}` : '✔  Seller: Hoang Thong';

  function draw(time = 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Deep pristine AMOLED black background
    ctx.fillStyle = '#030508';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle LED Dot Matrix Grid Texture Overlay
    ctx.fillStyle = 'rgba(255, 90, 54, 0.035)';
    for (let gx = 30; gx < canvas.width; gx += 28) {
      for (let gy = 30; gy < canvas.height; gy += 28) {
        ctx.fillRect(gx, gy, 3, 3);
      }
    }

    // Top Header Row: Badges
    const badgeY = 90;

    // 1. Tier Cyan Pill Badge
    const cyanPillW = 340;
    const cyanPillH = 82;
    ctx.save();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.16)';
    roundedRect(ctx, 80, badgeY, cyanPillW, cyanPillH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Glowing cyan dot
    const pulse = 0.75 + 0.25 * Math.sin(time * 3);
    ctx.fillStyle = `rgba(34, 211, 238, ${pulse})`;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(125, badgeY + cyanPillH / 2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#22d3ee';
    ctx.font = '700 32px "Silkscreen", monospace';
    ctx.fillText(tierName.toUpperCase().slice(0, 14), 150, badgeY + 54);

    // 2. BUNDLE (N TICKETS) Solid Glowing Neon Orange Pill
    const orangePillW = 460;
    const orangePillH = 82;
    ctx.save();
    ctx.fillStyle = '#FF5A36';
    roundedRect(ctx, 450, badgeY, orangePillW, orangePillH, 20);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 32px "Silkscreen", monospace';
    ctx.fillText(`BUNDLE (${count} TICKETS)`, 480, badgeY + 54);

    // Main Event Title: Dot Matrix Bold Crisp Typography
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 96px "Silkscreen", "VT323", monospace';
    ctx.letterSpacing = '-1px';
    const title = eventName.length > 22 ? `${eventName.slice(0, 20)}...` : eventName;
    ctx.fillText(title, 80, 320);

    // Technical Metadata Section
    // Row 1: Zone & Date
    const metaY1 = 490;

    // Gold Ticket Badge: Seat Zone
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    ctx.font = '400 48px "Silkscreen", "VT323", monospace';
    ctx.fillText(`🎟 ${seatZone.slice(0, 20)}`, 80, metaY1);
    ctx.restore();

    // Calendar: Event Date
    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 44px "Silkscreen", "VT323", monospace';
    ctx.fillText(`📅 ${eventDate}`, 820, metaY1);

    // Row 2: Venue
    const metaY2 = 610;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '400 44px "Silkscreen", "VT323", monospace';
    const venueText = venue.length > 34 ? `${venue.slice(0, 32)}...` : venue;
    ctx.fillText(`📍 ${venueText}`, 80, metaY2);

    // Clean Subtle Separator Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(80, 715);
    ctx.lineTo(canvas.width - 80, 715);
    ctx.stroke();

    // Footer Info
    const footY = 840;

    // Organizer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 38px "Silkscreen", monospace';
    ctx.fillText(organizer.slice(0, 30), 80, footY);

    // Verified Seller Tag with checkmark
    ctx.fillStyle = '#ffffff';
    ctx.font = '400 38px "Silkscreen", monospace';
    ctx.fillText(seller.slice(0, 30), 820, footY);
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
  canvas.height = 1300;
  const ctx = canvas.getContext('2d')!;
  let isPressed = false;

  const code = listing?.maskedTicketCode || 'AT*******99';
  const priceNumber = totalResalePrice || listing?.resalePrice || 50000;
  const formattedPriceStr = priceNumber >= 1000000
    ? (priceNumber / 1).toLocaleString('vi-VN')
    : priceNumber.toLocaleString('vi-VN');

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Deep pristine AMOLED Black background
    ctx.fillStyle = '#030508';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle LED Dot Matrix Grid Texture Overlay
    ctx.fillStyle = 'rgba(255, 90, 54, 0.035)';
    for (let gx = 30; gx < canvas.width; gx += 28) {
      for (let gy = 30; gy < canvas.height; gy += 28) {
        ctx.fillRect(gx, gy, 3, 3);
      }
    }

    // Top Right ID: Masked Code
    const idBoxW = 380;
    const idBoxH = 80;
    const idBoxX = 70;
    const idBoxY = 90;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    roundedRect(ctx, idBoxX, idBoxY, idBoxW, idBoxH, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 46px "VT323", "Silkscreen", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(code, idBoxX + idBoxW / 2, idBoxY + 56);
    ctx.textAlign = 'left';

    // Price Section
    const priceY = 320;

    // "PRICE" Label in Dot Matrix
    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 38px "Silkscreen", monospace';
    ctx.fillText('COMBO PRICE', 70, priceY);

    // Huge Crisp Dot Matrix Digital Price (VT323 has authentic digital LED glyphs)
    ctx.fillStyle = '#ffffff';
    ctx.font = formattedPriceStr.length > 9 ? '700 135px "VT323", monospace' : '700 155px "VT323", monospace';
    ctx.letterSpacing = '1px';
    ctx.fillText(formattedPriceStr, 70, priceY + 130);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 46px "Silkscreen", monospace';
    const vOffsetX = formattedPriceStr.length > 9 ? 650 : 570;
    ctx.fillText('VND', 70 + vOffsetX, priceY + 130);

    // Subtitle: "Organizer Verified Price"
    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 34px "Silkscreen", monospace';
    ctx.fillText('Organizer Verified Price', 70, priceY + 210);

    // ON-SCREEN TOUCHSCREEN CTA BUTTON (Vibrant Brand Orange #FF5A36)
    const btnX = 70;
    const btnY = 830;
    const btnW = canvas.width - 140; // 960
    const btnH = 250;
    const btnR = 32;

    ctx.save();
    ctx.fillStyle = isPressed ? '#FF7252' : '#FF5A36';
    roundedRect(ctx, btnX, btnY, btnW, btnH, btnR);
    ctx.fill();

    // Text: "XEM & MUA →" in Dot Matrix Font
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 78px "Silkscreen", monospace';
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
      return uv.x >= 0.05 && uv.x <= 0.95 && uv.y >= 0.15 && uv.y <= 0.38;
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
