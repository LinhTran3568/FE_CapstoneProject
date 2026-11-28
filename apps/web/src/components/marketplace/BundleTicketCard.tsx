import { useState, type CSSProperties, type ReactNode } from "react";
import { TicketShieldIcon } from "../ui/TicketShieldLogo";

/**
 * BundleTicketCard — retro "device" card drawn with oblique projection.
 *
 * Three faces, like the hand-drawn letter N (the top/right faces are a real
 * extrusion of the ROUNDED front shape, so their corners are round too):
 *   - FRONT face : the card itself (2 screens). Flat, text stays readable.
 *   - TOP face   : parallelogram above the front face (lightest shade).
 *   - RIGHT face : parallelogram on the right (darkest shade). It holds the
 *                  slot the ticket stubs slide out of.
 *
 * Depth vector = (DX, -DY): the box's back edge is shifted DX px right and
 * DY px up. Change DX / DY to make the box thicker or thinner.
 */

export interface BundleTicketCardProps {
  title: string;
  ticketTypeLabel: string; // "GA STANDING", "VIP ZONE A"
  zoneLabel: string;
  dateLabel: string;
  venue: string;
  organizer: string;
  seller: string;
  count: number;
  totalPrice: number;
  currency?: string;
  priceVerified?: boolean;
  ctaLabel?: string;
  onView?: () => void;
  className?: string;
  backdropUrl?: string;
  /** screen noise: "always" (default), "hover" (only while hovered) or "off" (static grain) */
  noise?: "always" | "hover" | "off";
  /** render your real single-ticket component inside each stub (index 0 = front) */
  renderStub?: (index: number) => ReactNode;
}

const PIXEL = "font-['Silkscreen',monospace]";

/* ---- geometry (all tweakable) ---- */
const DX = 28; // box depth, horizontal part (= width of the right face)
const DY = 16; // box depth, vertical part (= height of the top face)
const SLOT_U: [number, number] = [0.28, 0.72]; // slot span along the depth (0 = front edge, 1 = back edge)
const SLOT_V: [number, number] = [0.16, 0.84]; // slot span along the height
const STUB_V: [number, number] = [0.2, 0.8]; // stubs are a bit shorter than the slot
const STUB_STEP = 0.12; // depth gap between stacked stubs
const STUB_W = 90;
const REST_REVEAL = 8; // px of front stub visible past the face at rest
const PEEK_REVEAL = 26; // px on hover / tap (gentle, tight slide)
const PEEK_STAGGER = 4; // back stubs slide a little further: fan-out stack
const RIGHT_RESERVED = 44; // Reserve width so the whole 3D body + resting staggered stubs fit precisely within grid cell

const STUB_THEMES = [
  {
    bg: "#ffffff",
    accent: "#FF5A1F", // Orange (Ticket 1)
    border: "#ea580c",
    badgeBg: "bg-[#FF5A1F]",
    seat: "SEAT 01",
    code: "TKT-01",
  },
  {
    bg: "#f8fafc",
    accent: "#0284c7", // Sky blue (Ticket 2)
    border: "#0369a1",
    badgeBg: "bg-[#0284c7]",
    seat: "SEAT 02",
    code: "TKT-02",
  },
  {
    bg: "#f1f5f9",
    accent: "#d97706", // Amber (Ticket 3)
    border: "#b45309",
    badgeBg: "bg-[#d97706]",
    seat: "SEAT 03",
    code: "TKT-03",
  },
];

// How deep the screens sit behind the frame (same direction as the box depth)
const RX = 7;
const RY = 5;

/* ---- face shapes ---- */
const RIGHT_FACE: CSSProperties = {
  left: "100%",
  top: -DY,
  width: DX,
  height: `calc(100% + ${DY}px)`,
  clipPath: `polygon(0 ${DY}px, 100% 0, 100% calc(100% - ${DY}px), 0 100%)`,
};

/* ---- extrusion: the rounded front shape swept along (DX, -DY) ---- */
const FRONT_R = 20; // MUST equal the front face's border radius
const STEPS = 4; // High-performance 4-step extrusion (GPU accelerated, 0 lag)

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number) =>
  `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * t)).join(",")})`;

const extrusion = (near: RGB, far: RGB) =>
  Array.from({ length: STEPS }, (_, k) => {
    const t = (k + 1) / STEPS;
    return `${(DX * t).toFixed(1)}px ${(-DY * t).toFixed(1)}px 0 ${mix(near, far, t)}`;
  }).join(", ");

const SHADOW_RIGHT = extrusion([58, 65, 76], [30, 35, 42]);
const SHADOW_CORNER = extrusion([92, 100, 112], [54, 61, 71]);
const SHADOW_TOP = extrusion([140, 150, 164], [88, 98, 112]);

// Half-plane "before" a line that runs along the depth vector through an anchor point
const calcPt = (xPct: number, xPx: number, yPct: number, yPx: number) =>
  `calc(${xPct}% + ${xPx.toFixed(1)}px) calc(${yPct}% + ${yPx.toFixed(1)}px)`;

function halfPlaneBefore(xPct: number, xPx: number, yPct: number, yPx: number) {
  const A = [xPx + 3 * DX, yPx - 3 * DY]; // anchor + 3v
  const B = [xPx - 3 * DX, yPx + 3 * DY]; // anchor - 3v
  const K = 200; // push far away along -normal, normal = (DY, DX)
  const C = [B[0] - K * DY, B[1] - K * DX];
  const D = [A[0] - K * DY, A[1] - K * DX];
  return `polygon(${[A, B, C, D].map(([x, y]) => calcPt(xPct, x, yPct, y)).join(", ")})`;
}

const CLIP_TOP = halfPlaneBefore(100, -FRONT_R, 0, 0);
const CLIP_CORNER = halfPlaneBefore(100, 0, 0, FRONT_R);

const fx = (u: number) => `${(u * DX).toFixed(1)}px`;
const fy = (u: number, v: number) =>
  `calc(${(DY * (1 - u)).toFixed(1)}px + ${v} * (100% - ${DY}px))`;

const SLOT: CSSProperties = {
  clipPath: `polygon(${fx(SLOT_U[0])} ${fy(SLOT_U[0], SLOT_V[0])}, ${fx(SLOT_U[1])} ${fy(SLOT_U[1], SLOT_V[0])}, ${fx(SLOT_U[1])} ${fy(SLOT_U[1], SLOT_V[1])}, ${fx(SLOT_U[0])} ${fy(SLOT_U[0], SLOT_V[1])})`,
  background: "linear-gradient(to right, #000 0%, #0a0d11 100%)",
};

const NOISE_DOTS: CSSProperties = {
  backgroundImage: "radial-gradient(#64748b 1px, transparent 1px)",
  backgroundSize: "4px 4px",
};
const NOISE = NOISE_DOTS;

function Screen({
  wellClassName = "",
  className = "",
  pad = 14,
  active = false,
  sweepKey = 0,
  beamType = "cyan",
  backdropUrl,
  children,
}: {
  wellClassName?: string;
  className?: string;
  pad?: number;
  active?: boolean;
  sweepKey?: number;
  beamType?: "cyan" | "amber";
  backdropUrl?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`relative flex overflow-hidden rounded-[18px] ${wellClassName}`}
      style={{
        background: "linear-gradient(to top, #454d58 0%, #2a3039 100%)",
        boxShadow: "0 1px 0 rgba(255,255,255,.14), 0 -1px 0 rgba(0,0,0,.7)",
      }}
    >
      {/* left wall */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0"
        style={{
          width: RX,
          background: "linear-gradient(to right, #06080b, #14181e)",
          clipPath: `polygon(0 0, 100% 0, 100% calc(100% - ${RY}px), 0 100%)`,
        }}
      />

      {/* GLASS */}
      <div
        className={`relative z-10 min-w-0 flex-1 overflow-hidden rounded-[14px] ${className}`}
        style={{
          transform: `translate(${RX}px, ${-RY}px)`,
          padding: `${pad + RY}px ${pad + RX}px ${pad}px ${pad}px`,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08), inset 0 2px 8px rgba(0,0,0,.7)",
          isolation: "isolate",
        }}
      >
        {/* Layer 0: Backdrop Event Poster or Solid CRT screen base */}
        {backdropUrl ? (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <img
              src={backdropUrl}
              alt=""
              className="w-full h-full object-cover object-center opacity-80 contrast-125 saturate-110 pointer-events-none"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            {/* Illuminated backlighting and contrast gradations for crystal-clear readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/75" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.22),transparent_70%)]" />
          </div>
        ) : (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(120% 90% at 35% 25%, #1a2430 0%, #0f151c 55%, #0a0e12 100%)",
            }}
          />
        )}

        {/* Layer 1: Crisp CRT Scanlines over image */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] opacity-30"
          style={{
            background:
              "repeating-linear-gradient(to bottom, transparent 0 2px, rgba(0,0,0,.65) 2px 4px)",
          }}
        />

        {/* Layer 2: CRT Micro-dots Phosphor Texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] opacity-10"
          style={NOISE}
        />

        {/* Layer 3: CRT Frequency Sweep Beam with Smooth Fade-in / Fade-out */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-[3] overflow-hidden transition-opacity duration-500 ease-out ${
            active ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            key={sweepKey}
            className={`absolute inset-x-0 ${
              beamType === "amber"
                ? "h-14 animate-crt-sweep-right"
                : "h-14 animate-crt-sweep-left"
            }`}
            style={{
              background:
                beamType === "amber"
                  ? "linear-gradient(to bottom, transparent 0%, rgba(245,158,11,0.08) 20%, rgba(245,158,11,0.45) 50%, rgba(245,158,11,0.08) 80%, transparent 100%)"
                  : "linear-gradient(to bottom, transparent 0%, rgba(56,189,248,0.08) 20%, rgba(56,189,248,0.45) 50%, rgba(56,189,248,0.08) 80%, transparent 100%)",
            }}
          />
        </div>

        {/* Layer 4: Screen Glare & Monitor Glass Sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[4]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,.14) 0%, rgba(255,255,255,0) 28%)",
          }}
        />

        {/* Layer 5: Text and Interactive Children (Crisp on top of screen effects) */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          {children}
        </div>
      </div>

      {/* shadow the top and right rim cast onto the glass (lightweight 0-lag blur) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 rounded-[18px]"
        style={{
          boxShadow:
            "inset 0 4px 6px -3px rgba(0,0,0,.9), inset -4px 0 6px -3px rgba(0,0,0,.8)",
        }}
      />
    </section>
  );
}

function Stub({
  index,
  total,
  depth,
  peek,
}: {
  index: number;
  total: number;
  depth: number;
  peek: boolean;
}) {
  const theme = STUB_THEMES[index % STUB_THEMES.length];
  // Stagger at rest by index * 4px so the 3 layered ticket edges are clearly visible in the stack!
  const reveal = peek ? PEEK_REVEAL + index * PEEK_STAGGER : REST_REVEAL + index * 4;

  return (
    <div
      className="absolute overflow-hidden pointer-events-none"
      style={{
        left: `calc(100% + ${(depth * DX).toFixed(1)}px)`,
        top: `calc(${STUB_V[0] * 100}% - ${(depth * DY).toFixed(1)}px)`,
        height: `${(STUB_V[1] - STUB_V[0]) * 100}%`,
        width: STUB_W + 20,
        zIndex: 5 - index,
      }}
    >
      <div
        className="absolute left-0 top-0 flex h-full overflow-hidden rounded-r-md text-slate-900 transition-transform duration-200 ease-out motion-reduce:transition-none pointer-events-auto items-stretch justify-between"
        style={{
          width: STUB_W,
          background: theme.bg,
          transform: `translateX(calc(-100% + ${reveal}px))`,
          boxShadow: "-1px 0 0 rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.15)",
          borderRight: `3px solid ${theme.accent}`,
        }}
      >
        {/* Left inner area: Perforated tear line with punch notch dots (visible when pulled out) */}
        <div className="h-full w-3 border-r border-dashed border-slate-300 shrink-0 flex flex-col justify-between items-center py-1 bg-slate-50/50">
          <span className="w-1.5 h-1.5 -ml-3 rounded-full bg-slate-900/30" />
          <span className="w-1.5 h-1.5 -ml-3 rounded-full bg-slate-900/30" />
        </div>

        {/* Center ticket body (visible when pulled out) */}
        <div className="flex-1 px-1 py-1.5 flex flex-col justify-between h-full min-w-0 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[7px] font-bold text-slate-500 uppercase tracking-tight">
              {theme.code}
            </span>
          </div>
          <div className="text-[7.5px] font-mono font-bold text-slate-700 leading-none">
            {theme.seat}
          </div>
        </div>

        {/* RIGHTMOST EDGE TAB: This is the exposed protruding part! Always visible even at rest & peek */}
        <div className="w-[23px] shrink-0 h-full flex flex-col justify-between items-center py-1.5 px-0.5 border-l border-slate-200/80 bg-gradient-to-r from-transparent to-slate-100/60">
          {/* Top: Project Logo Icon from Navbar */}
          <TicketShieldIcon className="w-3.5 h-3.5" />

          {/* Middle: Micro Barcode */}
          <div className="flex flex-col gap-[1.5px] w-2.5 items-center opacity-70 my-auto">
            <span className="w-full h-[1.5px] bg-slate-800" />
            <span className="w-full h-[1px] bg-slate-800" />
            <span className="w-full h-[2px] bg-slate-800" />
            <span className="w-full h-[1px] bg-slate-800" />
            <span className="w-full h-[1.5px] bg-slate-800" />
          </div>

          {/* Bottom: Ticket Sequence Number Badge */}
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[7.5px] font-black text-white shadow-sm leading-none ${theme.badgeBg}`}
          >
            #{index + 1}
          </span>
        </div>
      </div>
    </div>
  );
}

export function BundleTicketCard({
  title,
  ticketTypeLabel,
  zoneLabel,
  dateLabel,
  venue,
  organizer,
  seller,
  count,
  totalPrice,
  currency = "VND",
  priceVerified = true,
  ctaLabel = "VIEW & BUY",
  onView,
  className = "",
  backdropUrl,
}: BundleTicketCardProps) {
  const [hover, setHover] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [sweepKey, setSweepKey] = useState(0);
  const peek = hover || tapped;

  const fmt = new Intl.NumberFormat("vi-VN");
  const total = fmt.format(totalPrice);
  const perTicket = fmt.format(Math.round(totalPrice / Math.max(count, 1)));
  const stubCount = Math.min(Math.max(count, 1), 3);
  const firstDepth = 0.5 - ((stubCount - 1) / 2) * STUB_STEP;

  return (
    <article
      aria-label={`${title}, combo of ${count} tickets`}
      className={`relative h-[195px] sm:h-[200px] w-full transform-gpu transition-transform duration-200 ease-out hover:-translate-y-1.5 cursor-pointer select-none hover:z-20 will-change-transform ${className}`}
      onMouseEnter={() => {
        setSweepKey((k) => k + 1);
        setHover(true);
      }}
      onMouseLeave={() => setHover(false)}
      onClick={onView}
    >
      {/* 3D Box Container: width scaled to calc(100% - ${RIGHT_RESERVED}px) so that right face + resting stubs stay strictly inside grid cell */}
      <div
        className="relative h-full"
        style={{ width: `calc(100% - ${RIGHT_RESERVED}px)` }}
      >
        {/* TOP + RIGHT faces: extrusion of the rounded front shape (3 tones) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ borderRadius: FRONT_R, boxShadow: SHADOW_RIGHT }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ borderRadius: FRONT_R, boxShadow: SHADOW_CORNER, clipPath: CLIP_CORNER }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ borderRadius: FRONT_R, boxShadow: SHADOW_TOP, clipPath: CLIP_TOP }}
        />

        {/* slot, cut into the right face */}
        <div aria-hidden className="pointer-events-none absolute" style={RIGHT_FACE}>
          <div className="absolute inset-0" style={SLOT} />
        </div>

        {/* stubs: slide out on hover / touch */}
        <div
          aria-hidden
          onClick={(e) => {
            e.stopPropagation();
            setSweepKey((k) => k + 1);
            setTapped((v) => !v);
          }}
          className="absolute inset-0 pointer-events-none"
        >
          {Array.from({ length: stubCount }, (_, i) => (
            <Stub
              key={i}
              index={i}
              total={count}
              depth={firstDepth + i * STUB_STEP}
              peek={peek}
            />
          ))}
        </div>

        {/* FRONT face: inset border to align pixel-perfect with single tickets */}
        <div
          className="relative z-10 flex h-full flex-row gap-2.5 p-3 sm:p-3.5"
          style={{
            borderRadius: FRONT_R,
            background: "linear-gradient(145deg, #2a313a, #1b1f24)",
            boxShadow: [
              "inset 0 0 0 1px rgba(255,240,215,.35)",
              "0 8px 16px -4px rgba(0,0,0,.5)",
            ].join(", "),
          }}
        >
          {/* LEFT screen: event details (65% width) with Cyan CRT frequency sweep */}
          <Screen
            wellClassName="min-w-0 flex-[1.7] h-full"
            className="flex flex-col justify-between"
            pad={12}
            active={peek}
            sweepKey={sweepKey}
            beamType="cyan"
            backdropUrl={backdropUrl}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-950/40 px-2.5 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
                <span
                  className={`${PIXEL} text-[10px] tracking-wider text-sky-300 uppercase truncate max-w-[110px]`}
                >
                  {ticketTypeLabel}
                </span>
              </span>
              <span
                className={`${PIXEL} rounded-full bg-[#FF5A1F] px-2.5 py-0.5 text-[10px] tracking-wider text-white shadow-sm`}
              >
                COMBO · {count} {count > 1 ? 'TICKETS' : 'TICKET'}
              </span>
            </div>

            <div>
              <h3 className="text-[16px] sm:text-[18px] font-extrabold leading-tight tracking-tight text-white line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {title}
              </h3>
              <div className="mt-1 space-y-1 text-[11px] font-medium text-zinc-300">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-amber-300 font-bold truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                    {zoneLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300 text-[10.5px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  <span className="truncate">{dateLabel}</span>
                  <span>·</span>
                  <span className="truncate">{venue}</span>
                </div>
              </div>
            </div>

            <footer className="flex items-center justify-between gap-2 border-t border-zinc-700/80 pt-1.5 text-[10px] text-zinc-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              <span className="min-w-0 truncate">
                Organizer: <span className="text-zinc-100 font-medium">{organizer}</span>
              </span>
              <span className="min-w-0 truncate">
                Sold by: <span className="font-semibold text-zinc-100">{seller}</span>
              </span>
            </footer>
          </Screen>

          {/* RIGHT screen: pricing & CTA (35% width) with Amber CRT frequency sweep */}
          <Screen
            wellClassName="min-w-[130px] sm:min-w-[150px] flex-1 h-full"
            className="flex flex-col justify-between"
            pad={12}
            active={peek}
            sweepKey={sweepKey}
            beamType="amber"
          >
            <div className="flex items-center justify-between">
              <span className={`${PIXEL} text-[9px] tracking-widest text-zinc-400`}>
                TOTAL PRICE
              </span>
              <span
                className={`${PIXEL} rounded border border-zinc-700 bg-zinc-800/80 px-1.5 py-0.5 text-[9px] text-[#FF5A1F] font-bold`}
              >
                x{count}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`${PIXEL} text-[20px] sm:text-[22px] font-bold leading-none text-white`}
                >
                  {total}
                </span>
                <span className={`${PIXEL} text-[10px] text-zinc-400`}>{currency}</span>
              </div>
              <div className="mt-1 text-[10px] text-zinc-400 font-mono">
                ~{perTicket} {currency} / ticket
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onView?.();
              }}
              className="w-full cursor-pointer rounded-xl py-2 text-[11px] sm:text-xs font-bold text-white shadow-[0_2px_10px_rgba(255,90,31,.4),inset_0_1px_1px_rgba(255,255,255,.35)] transition hover:-translate-y-px hover:shadow-[0_4px_18px_rgba(255,90,31,.65),inset_0_1px_1px_rgba(255,255,255,.5)] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 motion-reduce:transition-none"
              style={{ background: "linear-gradient(180deg, #ff6a33 0%, #FF5A1F 100%)" }}
            >
              {ctaLabel} →
            </button>
          </Screen>
        </div>
      </div>
    </article>
  );
}

export default BundleTicketCard;
