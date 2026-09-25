"use client"

import React, { useMemo, useRef, useState } from "react"
import { motion } from "motion/react"
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  QrCode,
  ArrowRight,
  UserCheck,
  Store,
  Check,
  Lock,
  Users,
  KeyRound,
  ArrowLeftRight,
  Coins,
  Banknote,
} from "lucide-react"
import BoxCarousel, {
  type BoxCarouselRef,
  type CarouselItem,
} from "@/components/fancy/carousel/box-carousel"
import PixelateSvgFilter from "@/components/fancy/filter/pixelate-svg-filter"
import useScreenSize from "@/hooks/use-screen-size"
import { cn } from "@/lib/utils"
import "./FlowSection.css"

/* -------------------------------------------------------------
   8 BESPOKE STRIPE / LINEAR STYLE MICRO-ANIMATION CONCEPTS
   ------------------------------------------------------------- */

// BUYER 1: Holographic Ticket + Clamping Golden Padlock + Countdown Wave
const VisualBuyer1: React.FC = () => (
  <div className="flow-stage">
    <div className="b1-container">
      <div className="b1-ticket-card">
        <div className="b1-ticket-left">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-mono text-orange-400 font-bold uppercase">TicketShield PASS</span>
            <span className="text-[7px] font-mono text-white/50">#TS-8849</span>
          </div>
          <div>
            <div className="text-[11px] font-sans font-extrabold text-white leading-tight">THE CHILLIES LIVE</div>
            <div className="text-[8px] font-sans text-orange-300/80">VIP Section A1 • Seat 18</div>
          </div>
          <div className="text-[8px] font-mono text-white/40">1,200,000 ₫ (Face Value)</div>
        </div>
        <div className="b1-ticket-right">
          <QrCode className="w-7 h-7 text-orange-400/80" />
          <span className="text-[6px] font-mono text-orange-400 font-bold">VERIFIED</span>
        </div>
      </div>

      <div className="b1-lock-overlay">
        <div className="b1-pulse-wave" />
        <div className="b1-padlock-unit">
          <div className="b1-shackle" />
          <div className="b1-lock-core">
            <Lock className="w-4 h-4 text-slate-950 font-bold" />
          </div>
        </div>
        <div className="b1-timer-badge">
          RESERVED: 10:00
        </div>
      </div>
    </div>
  </div>
)

// BUYER 2: VietQR Terminal + Particle Stream + Safe with Glowing LED (No Text)
const VisualBuyer2: React.FC = () => (
  <div className="flow-stage">
    <div className="b2-container">
      <div className="b2-terminal">
        <div className="text-[7px] font-mono text-sky-400 font-bold">VietQR NAPAS</div>
        <div className="b2-qr-box">
          <div className="b2-laser-scan" />
          <QrCode className="w-9 h-9 text-slate-900" />
        </div>
        <div className="text-[7px] font-mono text-white/70">1,200,000 ₫</div>
      </div>

      <div className="b2-stream-track">
        <div className="b2-flow-line" />
        <div className="b2-gold-particle" />
        <div className="b2-gold-particle" />
        <div className="b2-gold-particle" />
        <div className="b2-gold-particle" />
      </div>

      <div className="b2-vault-safe">
        <div className="b2-vault-dial-outer">
          <div className="b2-dial-teeth" />
          <div className="b2-dial-teeth" />
          <div className="b2-dial-teeth" />
          <div className="b2-dial-teeth" />
          <Lock className="w-4 h-4 text-orange-400" />
        </div>
        <div className="b2-vault-led-ring" />
      </div>
    </div>
  </div>
)

// BUYER 3: 3D Ticket Revolving Chamber (Old Revoked -> Official Verified Buyer)
const VisualBuyer3: React.FC = () => (
  <div className="flow-stage">
    <div className="b3-stage-wrap">
      <div className="b3-flip-card">
        <div className="b3-face-front">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-mono text-red-400 font-bold">SELLER ORIGINAL TICKET</span>
            <span className="text-[7px] font-mono text-white/40">#OLD-7712</span>
          </div>
          <div>
            <div className="text-[10px] font-sans text-white/50">PREVIOUS OWNER: HOANG LONG</div>
            <div className="text-[8px] font-sans text-white/30">VIP Section A1 • Seat 18</div>
          </div>
          <div className="b3-revoked-stamp">ORIGINAL REVOKED</div>
        </div>

        <div className="b3-face-back">
          <div className="flex items-center justify-between">
            <div className="b3-verified-badge">
              <Check className="w-2.5 h-2.5" /> ORGANIZER REISSUED
            </div>
            <span className="text-[7px] font-mono text-sky-300">#TS-9931</span>
          </div>
          <div>
            <div className="text-[11px] font-sans font-extrabold text-white">TICKET OWNER: YOU (AN TRAN)</div>
            <div className="text-[8px] font-sans text-sky-200/80">VIP Section A1 • Seat 18</div>
          </div>
          <div className="flex items-center justify-between text-[7px] font-mono text-white/60">
            <span>24H APP VERIFICATION</span>
            <span className="text-sky-400 font-bold">100% OFFICIAL</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// BUYER 4: Smartphone E-Pass Scan + Turnstile Scanner & 100% Shield (Redesigned)
const VisualBuyer4: React.FC = () => (
  <div className="flow-stage">
    <div className="b4-scan-stage">
      <div className="b4-phone-frame">
        <div className="b4-phone-notch" />
        <div className="b4-pass-card">
          <div className="flex items-center justify-between w-full px-1">
            <span className="text-[6px] font-mono text-emerald-400 font-bold">VIP PASS</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="b4-qr-wrap">
            <div className="b4-laser-sweep" />
            <QrCode className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="b4-gate-scanner">
        <div className="b4-scanner-ring" />
        <div className="b4-shield-badge">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        </div>
      </div>
    </div>
  </div>
)

// SELLER 1: 6 Sequential OTP Digits Glowing + Pure Golden Stamp (Zero Text Clutter)
const VisualSeller1: React.FC = () => (
  <div className="flow-stage">
    <div className="s1-container">
      <div className="s1-otp-grid">
        {["8", "4", "9", "2", "0", "3"].map((digit, idx) => (
          <div key={idx} className="s1-slot">
            {digit}
          </div>
        ))}
      </div>

      <div className="s1-seal-icon">
        <div className="s1-seal-ring" />
        <ShieldCheck className="w-5 h-5 text-orange-400" />
      </div>
    </div>
  </div>
)

// SELLER 2: Holographic Ticket Flying to 2 Distinct Zones (Marketplace vs Private VIP)
const VisualSeller2: React.FC = () => (
  <div className="flow-stage">
    <div className="s2-flight-stage">
      {/* Authentic Holographic Ticket in Flight */}
      <div className="s2-holo-ticket">
        <div className="s2-ticket-body">
          <div className="s2-ticket-sub">ADMIT ONE</div>
          <div className="s2-ticket-text">TICKET</div>
          <div className="s2-ticket-sub">№ 849 203</div>
        </div>
        <div className="s2-ticket-stub">
          <div className="s2-barcode-line" />
          <div className="s2-barcode-line" />
          <div className="s2-barcode-line" />
          <div className="s2-barcode-line" />
          <div className="s2-barcode-line" />
          <div className="s2-barcode-line" />
        </div>
      </div>

      {/* Two Distinct Destination Zones Below */}
      <div className="s2-zones-container">
        {/* Zone 1: Public Marketplace */}
        <div className="s2-zone-market">
          <div className="s2-market-crowd">
            <Users className="w-4 h-4 text-sky-400" />
            <span className="text-[7px] font-mono text-sky-300 font-bold">PUBLIC MARKETPLACE</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            <span className="text-[6px] font-mono text-white/50 uppercase"></span>
          </div>
        </div>

        {/* Zone 2: Private 1-on-1 Link */}
        <div className="s2-zone-private">
          <div className="s2-private-lock">
            <KeyRound className="w-4 h-4 text-orange-400" />
            <span className="text-[7px] font-mono text-orange-300 font-bold">PRIVATE 1-ON-1 LINK</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="w-2.5 h-2.5 text-orange-400/80" />
            <span className="text-[6px] font-mono text-white/50 uppercase"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// SELLER 3: Automated Node Clearing with Attached Beams & Arrow Exchange Core
const VisualSeller3: React.FC = () => (
  <div className="flow-stage">
    <div className="s3-arena">
      <div className="s3-seller-cluster">
        <div className="s3-agent-node seller">
          <Store className="w-4 h-4 text-orange-400" />
          <span className="text-[7px] font-mono text-white/80 font-bold">YOU</span>
        </div>
        <div className="s3-tether-beam seller" />
      </div>

      <div className="s3-central-core">
        <ArrowLeftRight className="w-5 h-5 text-white" />
      </div>

      <div className="s3-buyer-cluster">
        <div className="s3-tether-beam buyer" />
        <div className="s3-agent-node buyer">
          <UserCheck className="w-4 h-4 text-sky-400" />
          <span className="text-[7px] font-mono text-white/80 font-bold">BUYER</span>
        </div>
      </div>
    </div>
  </div>
)

// SELLER 4: 24H Orbital Timer Dial → Single Banknote Flight on 24H Release Cycle
const VisualSeller4: React.FC = () => (
  <div className="flow-stage">
    <div className="s4-chrono-payout-stage">
      {/* 24H Orbital Chrono Dial */}
      <div className="s4-clock-dial">
        <div className="s4-clock-ring-outer" />
        <div className="s4-clock-hand" />
        <div className="s4-clock-center-dot" />
        <span className="s4-clock-24h-badge">24h</span>
      </div>

      {/* Floating Single Banknote Release Channel */}
      <div className="s4-transfer-beam">
        <div className="s4-glow-wire" />
        {/* The Banknote that flies periodically */}
        <div className="s4-floating-banknote">
          <div className="s4-banknote-foil" />
          <div className="s4-banknote-seal">
            <span className="text-[6px] font-mono font-extrabold text-emerald-950">₫</span>
          </div>
          <div className="s4-banknote-lines">
            <div className="s4-b-line" />
            <div className="s4-b-line" />
          </div>
        </div>
      </div>

      {/* Receiver Wallet / Bank Card */}
      <div className="s4-payout-vault">
        <div className="s4-vault-top-chip">
          <div className="s4-microchip" />
          <div className="flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </div>
        </div>

        <div className="s4-vault-money-emblem">
          <div className="s4-vault-check-ring">
            <Banknote className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="s4-plus-money-pill">
            <Check className="w-2.5 h-2.5 text-emerald-300" />
            <span className="text-[8px] font-mono font-black text-emerald-300">+ ₫</span>
          </div>
        </div>

        <div className="s4-vault-burst-ring" />
      </div>
    </div>
  </div>
)

/* -------------------------------------------------------------
   CARD FACE COMPONENT
   ------------------------------------------------------------- */
interface FlowCardFaceProps {
  step: string
  role: "buyer" | "seller"
  title: string
  subtitle: string
  desc: string
  visual: React.ReactNode
}

const FlowCardFace: React.FC<FlowCardFaceProps> = ({
  step,
  role,
  title,
  subtitle,
  desc,
  visual,
}) => {
  return (
    <div className="relative w-full h-full bg-[#070b14] border border-white/15 rounded-none p-5 sm:p-6 flex flex-col justify-between overflow-hidden select-none shadow-[0_30px_70px_rgba(0,0,0,0.9)]">
      {/* Top Specular Line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between z-10 mb-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-mono text-[11px] uppercase px-2.5 py-0.5 border tracking-wider font-semibold",
              role === "buyer"
                ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                : "bg-sky-500/10 text-sky-400 border-sky-500/30"
            )}
          >
            {role === "buyer" ? "FOR BUYERS" : "FOR SELLERS"}
          </span>
          <span className="text-white/40 font-mono text-[11px]">•</span>
          <span className="text-white/60 font-sans text-[11px] font-medium">
            {subtitle}
          </span>
        </div>

        <span
          className={cn(
            "font-mono text-xs tracking-wider font-bold bg-white/5 px-2 py-0.5 border border-white/10",
            role === "buyer" ? "text-orange-400" : "text-sky-400"
          )}
        >
          STEP {step} / 04
        </span>
      </div>

      {/* Dedicated Impeccable Visual Stage */}
      <div className="w-full my-1 z-10">{visual}</div>

      {/* Content — Space Grotesk title & Plus Jakarta Sans body */}
      <div className="space-y-1.5 z-10 mt-2">
        <h3 className="text-lg sm:text-xl font-display font-bold text-white tracking-tight leading-snug">
          {title}
        </h3>
        <p className="text-xs sm:text-[13px] text-slate-300 font-sans leading-relaxed">
          {desc}
        </p>
      </div>

      {/* Footer Line */}
      <div className="pt-2.5 mt-1 border-t border-white/10 flex items-center justify-end text-xs font-mono z-10">
        <span
          className={cn(
            "flex items-center gap-1 font-sans font-medium text-[11px]",
            role === "buyer" ? "text-orange-400/90" : "text-sky-400/90"
          )}
        >
          Next Step <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------
   MAIN FLOW SECTION
   ------------------------------------------------------------- */
export const FlowSection: React.FC = () => {
  const carouselRef = useRef<BoxCarouselRef>(null)
  const [role, setRole] = useState<"buyer" | "seller">("buyer")
  const [isTransforming, setIsTransforming] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [pixelSize, setPixelSize] = useState(1)
  const screenSize = useScreenSize()

  // Sizing with generous breathing room
  const getCarouselDimensions = () => {
    if (screenSize.lessThan("sm")) {
      return { width: 320, height: 460 }
    }
    if (screenSize.lessThan("md")) {
      return { width: 440, height: 470 }
    }
    if (screenSize.lessThan("lg")) {
      return { width: 520, height: 480 }
    }
    return { width: 560, height: 490 }
  }

  const { width, height } = getCarouselDimensions()

  // 4 Buyer Steps — Pure end-user language, zero jargon, "face value"
  const buyerItems: CarouselItem[] = useMemo(
    () => [
      {
        id: "buyer-1",
        type: "custom",
        content: (
          <FlowCardFace
            step="01"
            role="buyer"
            subtitle="Discover & Reserve"
            title="Browse & Instant Hold"
            desc="All tickets on the marketplace are verified with zero price gouging above face value. Tap Buy — your ticket is locked exclusively for you for 10 minutes."
            visual={<VisualBuyer1 />}
          />
        ),
      },
      {
        id: "buyer-2",
        type: "custom",
        content: (
          <FlowCardFace
            step="02"
            role="buyer"
            subtitle="Secure Payment"
            title="Scan VietQR &amp; 24H Funds Protection"
            desc="Pay conveniently via VietQR. Funds are safeguarded under 24-hour protection and only released after your brand-new official ticket is successfully reissued."
            visual={<VisualBuyer2 />}
          />
        ),
      },
      {
        id: "buyer-3",
        type: "custom",
        content: (
          <FlowCardFace
            step="03"
            role="buyer"
            subtitle="Official Reissuance"
            title="Instant Reissuance & 24H Verification"
            desc="The system coordinates directly with the organizer: original ticket revoked, brand-new ticket issued in your name with 24 hours to verify in app."
            visual={<VisualBuyer3 />}
          />
        ),
      },
      {
        id: "buyer-4",
        type: "custom",
        content: (
          <FlowCardFace
            step="04"
            role="buyer"
            subtitle="Event Experience"
            title="Seamless Gate Entry & Complete Protection"
            desc="Scan at the venue entrance. If any issue arises, photo proof triggers a 100% refund. Otherwise, payout transfers to seller after 24H."
            visual={<VisualBuyer4 />}
          />
        ),
      },
    ],
    []
  )

  // 4 Seller Steps — Pure end-user language, zero jargon, "face value"
  const sellerItems: CarouselItem[] = useMemo(
    () => [
      {
        id: "seller-1",
        type: "custom",
        content: (
          <FlowCardFace
            step="01"
            role="seller"
            subtitle="Ownership Verification"
            title="OTP Organizer Verification"
            desc="Enter your ticket code and verify ownership with a 6-digit OTP sent to your registered email. Once verified, the ticket is safely locked for resale."
            visual={<VisualSeller1 />}
          />
        ),
      },
      {
        id: "seller-2",
        type: "custom",
        content: (
          <FlowCardFace
            step="02"
            role="seller"
            subtitle="Safe Listing"
            title="Set Price & Select Listing Method"
            desc="Set your resale price capped at original face value, then choose public marketplace listing or private 1-on-1 link."
            visual={<VisualSeller2 />}
          />
        ),
      },
      {
        id: "seller-3",
        type: "custom",
        content: (
          <FlowCardFace
            step="03"
            role="seller"
            subtitle="Automated Exchange"
            title="Auto-Match &amp; Instant Re-issuance"
            desc="Upon buyer payment, funds are safeguarded under 24-hour protection while a brand-new official ticket is reissued to the buyer."
            visual={<VisualSeller3 />}
          />
        ),
      },
      {
        id: "seller-4",
        type: "custom",
        content: (
          <FlowCardFace
            step="04"
            role="seller"
            subtitle="Fast Payout"
            title="Payout Released After 24 Hours"
            desc="Buyer verifies ticket on official app; 24 hours post-transfer, funds auto-payout straight to your bank account."
            visual={<VisualSeller4 />}
          />
        ),
      },
    ],
    []
  )

  const currentItems = role === "buyer" ? buyerItems : sellerItems

  // Simultaneous role change: 3D box spin & SVG Pixelate blur start together at frame 0
  const handleRoleChange = (newRole: "buyer" | "seller") => {
    if (newRole === role || isTransforming) return
    setIsTransforming(true)

    // 1. Immediately reset step index to 0 (Step 01 / 04)
    setActiveStep(0)

    // 2. Trigger 3D box rotation to Step 1; swap role content at halfway point (peak blur)
    if (carouselRef.current) {
      carouselRef.current.rotateToStep1(() => {
        setRole(newRole)
      })
    } else {
      setRole(newRole)
    }

    // 3. Simultaneously animate SVG Pixelate blur (0ms -> 440ms)
    const startTime = performance.now()
    const duration = 440 // 440ms simultaneous duration

    const animatePixelation = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)

      if (progress < 0.4) {
        // Rapid ramp up to 24px in first 40% of rotation
        const rampUp = progress / 0.4
        setPixelSize(1 + rampUp * 23)
      } else if (progress < 0.65) {
        // Hold peak pixelation blur during mid-rotation
        setPixelSize(24)
      } else {
        // Smoothly dissipate pixelation back to 1px during landing
        const rampDown = (progress - 0.65) / 0.35
        setPixelSize(24 - rampDown * 23)
      }

      if (progress < 1) {
        requestAnimationFrame(animatePixelation)
      } else {
        setPixelSize(1)
        setIsTransforming(false)
      }
    }

    requestAnimationFrame(animatePixelation)
  }

  return (
    <section className="relative py-10 sm:py-16 w-full overflow-hidden" id="flow">
      {/* SVG Pixelate Filter Definition */}
      <PixelateSvgFilter id="flow-pixelate-filter" size={pixelSize} crossLayers />

      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-orange-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* LEFT COLUMN: Section Title, Subtitle, Role Switch & Step Tracker */}
          <motion.div
            className="lg:col-span-5 flex flex-col items-start text-left"
            initial={{ opacity: 0, x: -36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Section Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full mb-4">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse shadow-[0_0_8px_#fb923c]" />
              <span className="font-mono text-xs uppercase tracking-widest text-orange-400 font-semibold">
                TRANSPARENT &amp; SECURE WORKFLOW
              </span>
            </div>

            {/* Section Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white text-left tracking-tight leading-[1.12]">
              Complete Peace of Mind <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-400 to-amber-400">Every Step of the Way</span>
            </h2>

            <p className="mt-4 text-sm sm:text-base text-slate-300 text-left font-sans leading-relaxed">
              Experience zero-risk secondary ticket resale. Explore TicketShield's exclusive protection workflow for buyers and sellers.
            </p>

            {/* Role Toggle Switch */}
            <div className="mt-8 p-1.5 bg-[#090e1a]/90 backdrop-blur-md border border-white/10 rounded-full inline-flex items-center gap-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
              <button
                type="button"
                onClick={() => handleRoleChange("buyer")}
                className={cn(
                  "relative px-5 py-2.5 rounded-full text-xs sm:text-sm font-sans font-semibold transition-all duration-200",
                  role === "buyer" ? "text-[#060b18] bg-[#fb923c] shadow-[0_0_18px_rgba(251,146,60,0.4)]" : "text-slate-300 hover:text-white"
                )}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", role === "buyer" ? "bg-[#060b18]" : "bg-orange-400")} />
                  For Buyers
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange("seller")}
                className={cn(
                  "relative px-5 py-2.5 rounded-full text-xs sm:text-sm font-sans font-semibold transition-all duration-200",
                  role === "seller"
                    ? "text-[#060b18] bg-[#38bdf8] shadow-[0_0_18px_rgba(56,189,248,0.45)]"
                    : "text-slate-300 hover:text-white"
                )}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      role === "seller" ? "bg-[#060b18]" : "bg-sky-400"
                    )}
                  />
                  For Sellers
                </span>
              </button>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: 3D Box Carousel Stage with Attached Navigation Arrows */}
          <motion.div
            className="lg:col-span-7 flex items-center justify-center relative w-full"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.85, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Box Wrapper */}
            <div className="relative flex items-center justify-center max-w-full">
              {/* Left Arrow Button (Outside blur filter) */}
              <button
                type="button"
                onClick={() => carouselRef.current?.prev()}
                className={cn(
                  "absolute -left-6 sm:-left-10 md:-left-12 lg:-left-14 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-[#090e1a]/95 border border-white/20 text-slate-200 flex items-center justify-center transition-all shadow-[0_8px_25px_rgba(0,0,0,0.8)] backdrop-blur-md hover:scale-110 active:scale-95 cursor-pointer",
                  role === "buyer"
                    ? "hover:bg-orange-500/20 hover:border-orange-500/60 hover:text-orange-400"
                    : "hover:bg-sky-500/20 hover:border-sky-500/60 hover:text-sky-400"
                )}
                aria-label="Previous step"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* 3D Box Carousel (Only this element gets subtle SVG pixelate blur) */}
              <div
                className="p-4 -m-4 overflow-visible"
                style={{
                  filter: pixelSize > 1.2 ? "url(#flow-pixelate-filter)" : "none",
                  willChange: "filter",
                }}
              >
                <BoxCarousel
                  ref={carouselRef}
                  items={currentItems}
                  width={width}
                  height={height}
                  onIndexChange={(idx) => setActiveStep(idx)}
                />
              </div>

              {/* Right Arrow Button (Outside blur filter) */}
              <button
                type="button"
                onClick={() => carouselRef.current?.next()}
                className={cn(
                  "absolute -right-6 sm:-right-10 md:-right-12 lg:-right-14 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-[#090e1a]/95 border border-white/20 text-slate-200 flex items-center justify-center transition-all shadow-[0_8px_25px_rgba(0,0,0,0.8)] backdrop-blur-md hover:scale-110 active:scale-95 cursor-pointer",
                  role === "buyer"
                    ? "hover:bg-orange-500/20 hover:border-orange-500/60 hover:text-orange-400"
                    : "hover:bg-sky-500/20 hover:border-sky-500/60 hover:text-sky-400"
                )}
                aria-label="Next step"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default FlowSection
