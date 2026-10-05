import React from 'react';
import { SellerListingDto } from '@ticketshield/api-client';
import { QRCodeCanvas } from 'qrcode.react';
import {
  CheckCircle2,
  Globe,
  Lock,
  Calendar,
  MapPin,
  ExternalLink,
  Share2,
  Check,
  Copy,
  Download,
} from 'lucide-react';

export interface Step6ListingSuccessProps {
  /** Mã vé THẬT vừa đăng bán (1 vé = 1 phần tử; combo = 2–3 phần tử). */
  ticketCodes: string[];
  publishedListingId: string;
  existingListings: SellerListingDto[];
  /** Tổng giá gốc của cả gói. */
  faceValue: number;
  /** Giá bán của MỘT vé (hoặc vé đầu). */
  resalePrice: number;
  /** Tổng giá bán thực tế của toàn bộ vé trong gói (nếu có). */
  totalResalePrice?: number;
  isPrivateListing: boolean;
  getShareUrl: () => string;
  handleCopyLink: () => void;
  copiedLink: boolean;
  handleCopyQrImage: () => void;
  copiedQr: boolean;
  handleDownloadQr: () => void;
  onNavigateMyListings: () => void;
  onNavigateMarketplace: () => void;
}

export const Step6ListingSuccess: React.FC<Step6ListingSuccessProps> = ({
  ticketCodes,
  publishedListingId,
  existingListings,
  faceValue,
  resalePrice,
  totalResalePrice: customTotalResalePrice,
  isPrivateListing,
  getShareUrl,
  handleCopyLink,
  copiedLink,
  handleCopyQrImage,
  copiedQr,
  handleDownloadQr,
  onNavigateMyListings,
  onNavigateMarketplace,
}) => {
  const isCombo = ticketCodes.length > 1;
  const totalResalePrice = customTotalResalePrice ?? resalePrice * Math.max(ticketCodes.length, 1);

  // Chỉ dùng metadata từ listing thật vừa tạo — không bịa tên sự kiện/venue/tier khi chưa có.
  const matchedListing = existingListings.find(
    (l) =>
      (publishedListingId && l.listingId === publishedListingId) ||
      ticketCodes.includes(l.originalTicketCode)
  );
  const resolvedEventName = matchedListing?.eventName || 'Your listing';
  const resolvedEventDate = matchedListing?.eventStartAt
    ? new Date(matchedListing.eventStartAt).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';
  const resolvedVenue = matchedListing?.eventVenue || '—';
  const resolvedTier =
    matchedListing?.tierName ||
    (isCombo ? `Combo ${ticketCodes.length} vé` : '—');
  const resolvedPoster = '/images/landing/featured-1.jpg';

  return (
    <div key={6} className="animate-fade-in-up w-full mx-auto space-y-6 pt-2">
      {/* Header */}
      <div className="text-center space-y-2">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-xl animate-pop-in ${
            isPrivateListing
              ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-400 shadow-purple-500/30'
              : 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 shadow-emerald-500/40'
          }`}
        >
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
          {isPrivateListing ? 'Private Listing Created Successfully!' : 'Listing Published Successfully!'}
        </h2>
        <p className="text-xs sm:text-sm text-[#A3A8B3] max-w-lg mx-auto">
          {isCombo
            ? `All ${ticketCodes.length} tickets are listed together as one combo. Buyers pay the total of every ticket.`
            : isPrivateListing
              ? 'Your ticket is protected with our 100% 24-Hour Funds Protection guarantee. Share your secret private link or QR code with your buyer.'
              : 'Your ticket is now listed publicly on TicketShield Marketplace under 100% 24-Hour Protection.'}
        </p>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Ticketbox-style Ticket Pass + Bottom Navigation Buttons */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="relative ticket-perforated-mask bg-[#0A0D14] border border-[#27272A] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-white/20 flex flex-col sm:flex-row">
            {/* Top Notch Transparent Cutout Rim Arc (Desktop) */}
            <svg
              className="hidden sm:block absolute -top-[1px] right-[calc(14rem-14px)] w-7 h-3.5 z-20 pointer-events-none"
              viewBox="0 0 28 14"
              fill="none"
            >
              <path d="M0 0 A 14 14 0 0 0 28 0" stroke="#27272A" strokeWidth="1.5" fill="none" />
            </svg>

            {/* Bottom Notch Transparent Cutout Rim Arc (Desktop) */}
            <svg
              className="hidden sm:block absolute -bottom-[1px] right-[calc(14rem-14px)] w-7 h-3.5 z-20 pointer-events-none"
              viewBox="0 0 28 14"
              fill="none"
            >
              <path d="M0 14 A 14 14 0 0 1 28 14" stroke="#27272A" strokeWidth="1.5" fill="none" />
            </svg>

            {/* Perforated Dashed Seam Divider (Desktop) */}
            <div className="hidden sm:block absolute top-3.5 bottom-3.5 right-[14rem] w-[1px] border-r-2 border-dashed border-[#27272A] z-10 pointer-events-none" />

            {/* Left: Text Content Wrapper */}
            <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-4 relative min-w-0">
              {/* Top Header: Badge & Event Name */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-wider block">
                    OFFICIAL DIGITAL TICKET PASS
                  </span>
                  {isPrivateListing ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase bg-purple-500/20 border border-purple-500/40 text-purple-300">
                      <Lock className="w-2.5 h-2.5" /> PRIVATE PASS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                      <Globe className="w-2.5 h-2.5" /> PUBLIC
                    </span>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-extrabold font-display text-white leading-tight">
                  {resolvedEventName}
                </h3>
                <p className="text-xs font-mono font-semibold text-[#FF5A36] tracking-wide">
                  {resolvedTier}
                </p>
              </div>

              {/* Event Info: Date & Venue */}
              <div className="space-y-2 text-left text-xs font-sans">
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="w-4 h-4 text-[#FF5A36] shrink-0" />
                  <span className="font-semibold text-xs">{resolvedEventDate}</span>
                </div>

                <div className="flex items-center gap-2 text-[#E4E4E7]">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-xs uppercase tracking-wide">
                    {resolvedVenue}
                  </span>
                </div>
              </div>

              {/* Ticket Meta Grid: Codes & Listing ID */}
              <div className="pt-3 border-t border-[#27272A] text-left space-y-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-[#8F96A3] font-mono font-bold uppercase tracking-wider block">
                    {isCombo ? `TICKET CODES (${ticketCodes.length})` : 'TICKET CODE'}
                  </span>
                  <ul className="space-y-0.5">
                    {ticketCodes.map((code) => (
                      <li
                        key={code}
                        className="font-mono font-bold text-xs text-white tracking-wider truncate"
                      >
                        {code}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-[#8F96A3] font-mono font-bold uppercase tracking-wider block">
                    {isCombo ? 'BUNDLE ID' : 'LISTING ID'}
                  </span>
                  <p className="font-mono font-bold text-xs text-[#A3A8B3] truncate">
                    {publishedListingId || '—'}
                  </p>
                </div>
              </div>

              {/* Price Row: Face Value vs Resale Price */}
              <div className="pt-3 border-t border-[#27272A] flex items-center justify-between text-left">
                <div>
                  <span className="text-[9px] text-[#8F96A3] font-mono font-bold uppercase tracking-wider block">
                    ORIGINAL PRICE
                  </span>
                  <span className="text-xs sm:text-sm text-[#A3A8B3] line-through font-mono">
                    {faceValue.toLocaleString('vi-VN')} VND
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-wider block">
                    {isCombo ? 'RESALE PRICE (PER TICKET)' : 'RESALE PRICE'}
                  </span>
                  <span className="text-lg sm:text-xl font-extrabold font-display text-emerald-400">
                    {resalePrice.toLocaleString('vi-VN')} VND
                  </span>
                  {isCombo && (
                    <span className="block text-[10px] font-mono text-[#8F96A3] mt-0.5">
                      Total {totalResalePrice.toLocaleString('vi-VN')} VND
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Img Wrapper (Concert poster) */}
            <div className="w-full sm:w-52 md:w-56 shrink-0 relative overflow-hidden bg-[#0A0D14] min-h-[200px] sm:min-h-[320px]">
              <img
                src={resolvedPoster}
                alt={resolvedEventName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/landing/featured-1.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 text-center">
                <span className="px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-md text-[9px] font-mono uppercase font-bold text-white/90 border border-white/10 block shadow-md">
                  VERIFIED SECURE PASS
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <button
              onClick={onNavigateMyListings}
              className="w-full sm:flex-1 py-3.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-[#FF5A36]/25 hover:shadow-xl hover:shadow-[#FF5A36]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all text-center cursor-pointer"
            >
              Manage My Listings
            </button>

            {isPrivateListing ? (
              <a
                href={getShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-3.5 bg-white/5 border border-white/10 text-white font-bold font-display uppercase tracking-wider text-xs rounded-xl hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-center"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Preview Ticket Link</span>
              </a>
            ) : (
              <button
                onClick={onNavigateMarketplace}
                className="w-full sm:flex-1 py-3.5 bg-white/5 border border-white/10 text-white font-bold font-display uppercase tracking-wider text-xs rounded-xl hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-center cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>View on Marketplace</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Share Link, QR Code & Actions */}
        <div className="lg:col-span-5 p-6 bg-gradient-to-b from-[#0e131b] to-[#080b0f] border border-white/15 rounded-3xl space-y-5 shadow-2xl flex flex-col justify-between">
          {/* Link Section */}
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    isPrivateListing ? 'bg-purple-500/20 text-purple-400' : 'bg-[#FF5A36]/20 text-[#FF5A36]'
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white font-display">
                  {isPrivateListing ? 'Secret Shareable Link' : 'Marketplace Listing Link'}
                </span>
              </div>
              {isPrivateListing && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  Secret URL
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 bg-[#05070A] border border-white/10 rounded-xl p-1.5 focus-within:border-[#FF5A36]/50 transition-colors">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="bg-transparent border-none text-white text-xs font-mono px-2 flex-1 focus:ring-0 truncate select-all"
              />
              <button
                onClick={handleCopyLink}
                type="button"
                className="px-3.5 py-2 bg-white/10 hover:bg-[#FF5A36] text-white text-xs font-bold font-display rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center space-y-3 pt-1">
            <div className="p-3.5 bg-white rounded-2xl shadow-xl shadow-black/60 border border-white/80 inline-block">
              <QRCodeCanvas
                id="listing-qr-canvas"
                value={getShareUrl()}
                size={155}
                level="H"
                includeMargin={false}
              />
            </div>

            <p className="text-[11px] text-[#A3A8B3] max-w-xs text-center leading-relaxed">
              Scan this QR code with any camera or phone scanner to open ticket checkout instantly.
            </p>

            <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
              <button
                onClick={handleCopyQrImage}
                type="button"
                className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:border-white/20 active:scale-95 cursor-pointer"
              >
                {copiedQr ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Image Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#A3A8B3]" />
                    <span>Copy QR Image</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadQr}
                type="button"
                className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:border-white/20 active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#A3A8B3]" />
                <span>Download QR</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
