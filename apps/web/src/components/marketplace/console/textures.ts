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
 * Inherited from Vintage CRT Ticket Console: Amber & Cyan Phosphor Glow with Scanlines
 */
export function createLeftScreenTexture(listing?: MarketplaceListingDto, bundleCount = 3): {
  texture: THREE.CanvasTexture;
  update: (time: number) => void;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1200;
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

    // 1. Radial CRT Screen Glass Background
    const bgGrad = ctx.createRadialGradient(
      canvas.width * 0.45, canvas.height * 0.35, 50,
      canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.7
    );
    bgGrad.addColorStop(0, '#181d22');
    bgGrad.addColorStop(0.7, '#0d1013');
    bgGrad.addColorStop(1, '#06080a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. CRT Glass Glare Highlight across top-left corner
    const glareGrad = ctx.createLinearGradient(0, 0, canvas.width * 0.75, canvas.height * 0.65);
    glareGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    glareGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.015)');
    glareGrad.addColorStop(0.65, 'transparent');
    ctx.fillStyle = glareGrad;
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.25, -canvas.height * 0.1, canvas.width * 0.65, canvas.height * 0.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 3. Dot-Matrix / LED Grid Texture overlay
    ctx.fillStyle = 'rgba(255, 170, 51, 0.045)';
    for (let gx = 20; gx < canvas.width; gx += 20) {
      for (let gy = 20; gy < canvas.height; gy += 20) {
        ctx.fillRect(gx, gy, 2.5, 2.5);
      }
    }

    // 4. CRT Horizontal Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    for (let y = 0; y < canvas.height; y += 8) {
      ctx.fillRect(0, y, canvas.width, 3.5);
    }

    // 5. Header Badges
    // Cyan Tier Badge: "• GA STANDING"
    const cyanPillW = 380;
    const cyanPillH = 76;
    ctx.save();
    ctx.fillStyle = '#091b24';
    roundedRect(ctx, 80, 80, cyanPillW, cyanPillH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Glowing Cyan Dot
    const pulse = 0.85 + 0.15 * Math.sin(time * 3);
    ctx.fillStyle = `rgba(34, 211, 238, ${pulse})`;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(125, 80 + cyanPillH / 2, 9, 0, Math.PI * 2);
    ctx.fill();

    // Cyan Text
    ctx.font = '700 34px "Silkscreen", monospace';
    ctx.fillStyle = '#67e8f9';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.textBaseline = 'middle';
    ctx.fillText(tierName.toUpperCase().slice(0, 14), 155, 80 + cyanPillH / 2);
    ctx.restore();

    // Amber Bundle Badge: "BUNDLE (N TICKETS)"
    const orangePillW = 480;
    const orangePillH = 76;
    ctx.save();
    ctx.fillStyle = '#2e1303';
    roundedRect(ctx, 490, 80, orangePillW, orangePillH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = '700 34px "Silkscreen", monospace';
    ctx.fillStyle = '#ffaa33';
    ctx.shadowColor = 'rgba(255, 140, 0, 0.8)';
    ctx.shadowBlur = 12;
    ctx.textBaseline = 'middle';
    ctx.fillText(`BUNDLE (${count} TICKETS)`, 520, 80 + orangePillH / 2);
    ctx.restore();

    // 6. Concert Title in Amber Dot Matrix Font
    ctx.save();
    ctx.font = '700 82px "Silkscreen", monospace';
    ctx.fillStyle = '#ffaa33';
    ctx.shadowColor = 'rgba(255, 140, 0, 0.9)';
    ctx.shadowBlur = 16;
    ctx.textBaseline = 'alphabetic';
    const displayTitle = eventName.length > 22 ? `${eventName.slice(0, 20)}...` : eventName;
    ctx.fillText(displayTitle.toUpperCase(), 80, 310);
    ctx.restore();

    // 7. Border Separator
    ctx.strokeStyle = 'rgba(255, 170, 51, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 420);
    ctx.lineTo(canvas.width - 80, 420);
    ctx.stroke();

    // 8. Technical Details List in Amber/Gold VFD Typography
    const metaY1 = 510;
    ctx.save();
    // Zone
    ctx.fillStyle = '#ffaa33';
    ctx.font = '700 44px "Silkscreen", monospace';
    ctx.shadowColor = 'rgba(255, 140, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText('❖', 80, metaY1);

    ctx.fillStyle = '#ffedd5';
    ctx.font = '700 38px "Silkscreen", monospace';
    ctx.shadowColor = 'rgba(255, 200, 100, 0.6)';
    ctx.shadowBlur = 8;
    ctx.fillText(seatZone.toUpperCase().slice(0, 20), 125, metaY1);

    // Time
    ctx.fillStyle = '#ffaa33';
    ctx.font = '700 44px "Silkscreen", monospace';
    ctx.fillText('◷', 850, metaY1);

    ctx.fillStyle = '#fed7aa';
    ctx.font = '700 38px "Silkscreen", monospace';
    ctx.fillText(eventDate.toUpperCase(), 895, metaY1);

    // Row 2: Venue
    const metaY2 = 640;
    ctx.fillStyle = '#ffaa33';
    ctx.font = '700 44px "Silkscreen", monospace';
    ctx.fillText('⚑', 80, metaY2);

    ctx.fillStyle = '#fef08a';
    ctx.font = '400 52px "VT323", monospace';
    ctx.fillText(venue.slice(0, 40), 125, metaY2);

    // Row 3: Organizer & Seller
    const metaY3 = 760;
    ctx.strokeStyle = 'rgba(255, 170, 51, 0.15)';
    ctx.beginPath();
    ctx.moveTo(80, 700);
    ctx.lineTo(canvas.width - 80, 700);
    ctx.stroke();

    ctx.fillStyle = '#fed7aa';
    ctx.font = '400 46px "VT323", monospace';
    ctx.fillText(`${organizer.slice(0, 30)}`, 80, metaY3);

    ctx.fillStyle = '#34d399';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.font = '700 42px "Silkscreen", monospace';
    ctx.fillText('✓', 850, metaY3);

    ctx.fillStyle = '#ffedd5';
    ctx.shadowBlur = 0;
    ctx.font = '400 46px "VT323", monospace';
    ctx.fillText(`${seller.slice(0, 30)}`, 895, metaY3);
    ctx.restore();
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
 * Inherited from Vintage CRT Ticket Console: Status, Price & Matrix Button
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
  const priceNumber = totalResalePrice || listing?.resalePrice || 50000;
  const formattedPriceStr = priceNumber >= 1000000
    ? (priceNumber / 1).toLocaleString('vi-VN')
    : priceNumber.toLocaleString('vi-VN');

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Radial CRT Screen Glass Background
    const bgGrad = ctx.createRadialGradient(
      canvas.width * 0.45, canvas.height * 0.35, 40,
      canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.75
    );
    bgGrad.addColorStop(0, '#181d22');
    bgGrad.addColorStop(0.7, '#0d1013');
    bgGrad.addColorStop(1, '#06080a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Dot-Matrix / LED Grid Texture overlay
    ctx.fillStyle = 'rgba(255, 170, 51, 0.045)';
    for (let gx = 20; gx < canvas.width; gx += 20) {
      for (let gy = 20; gy < canvas.height; gy += 20) {
        ctx.fillRect(gx, gy, 2.5, 2.5);
      }
    }

    // 3. CRT Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    for (let y = 0; y < canvas.height; y += 8) {
      ctx.fillRect(0, y, canvas.width, 3.5);
    }

    // 4. Status Code & READY Indicator
    // Code Box
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    roundedRect(ctx, 70, 80, 420, 76, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '700 36px "Silkscreen", monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(code, 70 + 210, 80 + 38);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();

    // READY Indicator
    ctx.save();
    ctx.font = '700 32px "Silkscreen", monospace';
    ctx.fillStyle = '#34d399';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(660, 118, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('READY', 680, 126);
    ctx.restore();

    // 5. Price Section
    const priceY = 320;
    ctx.save();
    ctx.font = '700 34px "Silkscreen", monospace';
    ctx.fillStyle = '#ffaa33';
    ctx.shadowColor = 'rgba(255, 140, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.fillText(`PRICE (BUNDLE ${count}x)`, 70, priceY);

    // Big Glowing White Price
    ctx.font = '700 115px "Silkscreen", monospace';
    ctx.fillStyle = '#f6f7fb';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowBlur = 18;
    ctx.fillText(formattedPriceStr, 70, priceY + 125);

    const priceW = ctx.measureText(formattedPriceStr).width;
    ctx.font = '700 44px "Silkscreen", monospace';
    ctx.fillStyle = '#ffaa33';
    ctx.shadowColor = 'rgba(255, 140, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText('VND', 70 + priceW + 18, priceY + 125);

    // Subtitle
    ctx.font = '400 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.shadowBlur = 0;
    ctx.fillText('Organizer Verified Price', 70, priceY + 195);
    ctx.restore();

    // 6. Tactile Matrix Button: "XEM & MUA →"
    const btnX = 70;
    const btnY = 780;
    const btnW = canvas.width - 140; // 960
    const btnH = 260;
    const btnR = 32;

    ctx.save();
    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    if (isPressed) {
      btnGrad.addColorStop(0, '#e05b00');
      btnGrad.addColorStop(1, '#ff7e14');
    } else {
      btnGrad.addColorStop(0, '#ff7e14');
      btnGrad.addColorStop(1, '#e05b00');
    }
    ctx.fillStyle = btnGrad;
    ctx.shadowColor = 'rgba(255, 110, 0, 0.75)';
    ctx.shadowBlur = 20;
    roundedRect(ctx, btnX, btnY, btnW, btnH, btnR);
    ctx.fill();

    // Text inside button: High-contrast crisp black
    ctx.font = '700 68px "Silkscreen", monospace';
    ctx.fillStyle = '#000000';
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
