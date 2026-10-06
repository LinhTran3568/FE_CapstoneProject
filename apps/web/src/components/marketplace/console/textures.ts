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
  const seller = listing?.sellerFullName ? `Seller: ${listing.sellerFullName}` : 'Seller: Nguyen Van Seller';

  function draw(time = 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Deep pristine AMOLED black background
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Top Header Row: Badges
    const badgeY = 90;

    // 1. Tier Cyan Pill Badge
    const cyanPillW = 340;
    const cyanPillH = 82;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    roundedRect(ctx, 80, badgeY, cyanPillW, cyanPillH, 41);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Glowing cyan dot
    const pulse = 0.85 + 0.15 * Math.sin(time * 3);
    ctx.fillStyle = `rgba(34, 211, 238, ${pulse})`;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(125, badgeY + cyanPillH / 2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(tierName.toUpperCase().slice(0, 16), 150, badgeY + cyanPillH / 2);

    // 2. BUNDLE (N TICKETS) Solid Glowing Neon Orange Pill
    const orangePillW = 470;
    const orangePillH = 82;
    ctx.save();
    ctx.fillStyle = '#FF5A36';
    roundedRect(ctx, 450, badgeY, orangePillW, orangePillH, 41);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(`BUNDLE (${count} TICKETS)`, 490, badgeY + orangePillH / 2);
    ctx.textBaseline = 'alphabetic';

    // Main Event Title: Bold Crisp Modern Typography
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 86px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '-1px';
    const title = eventName.length > 26 ? `${eventName.slice(0, 24)}...` : eventName;
    ctx.fillText(title, 80, 320);

    // Metadata Section (Zone, Date, Venue, Organizer, Seller)
    // Row 1: Zone & Date
    const metaY1 = 490;
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`⛶  ${seatZone.slice(0, 22)}`, 80, metaY1);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`📅  ${eventDate}`, 820, metaY1);

    // Row 2: Venue
    const metaY2 = 610;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const venueText = venue.length > 38 ? `${venue.slice(0, 36)}...` : venue;
    ctx.fillText(`📍  ${venueText}`, 80, metaY2);

    // Row 3: Organizer & Seller
    const metaY3 = 730;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(organizer.slice(0, 32), 80, metaY3);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`✔  ${seller.slice(0, 30)}`, 820, metaY3);
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
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Top Right ID: Masked Code
    const idBoxW = 400;
    const idBoxH = 88;
    const idBoxX = 70;
    const idBoxY = 90;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    roundedRect(ctx, idBoxX, idBoxY, idBoxW, idBoxH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(code, idBoxX + idBoxW / 2, idBoxY + idBoxH / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Price Section
    const priceY = 320;

    // "PRICE" Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('PRICE', 70, priceY);

    // Big Bold Crisp Price + VND Unit
    ctx.fillStyle = '#ffffff';
    ctx.font = formattedPriceStr.length > 9
      ? '800 100px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : '800 120px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '-1px';
    ctx.fillText(formattedPriceStr, 70, priceY + 130);

    const priceWidth = ctx.measureText(formattedPriceStr).width;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('VND', 70 + priceWidth + 20, priceY + 130);

    // Subtitle: "Organizer Verified Price"
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Organizer Verified Price', 70, priceY + 205);

    // ON-SCREEN TOUCHSCREEN CTA BUTTON (Vibrant Brand Orange #FF5A36)
    const btnX = 70;
    const btnY = 800;
    const btnW = canvas.width - 140; // 960
    const btnH = 260;
    const btnR = 36;

    ctx.save();
    ctx.fillStyle = isPressed ? '#E04826' : '#FF5A36';
    roundedRect(ctx, btnX, btnY, btnW, btnH, btnR);
    ctx.fill();

    // Text: "XEM & MUA →" in Bold Modern Font
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
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
