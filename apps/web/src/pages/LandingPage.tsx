import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { Hero } from '../components/landing/Hero';
import { ResellerConsole } from '../components/reseller/ResellerConsole';
import { FeaturedEvent } from '../components/landing/FeaturedEvent';
import { MusicDiscovery } from '../components/landing/MusicDiscovery';
import { FeelTheSound } from '../components/landing/FeelTheSound';
import { EventCategories } from '../components/landing/EventCategories';
import { TicketExperience } from '../components/landing/TicketExperience';
import { Security } from '../components/landing/Security';
import { HowItWorks } from '../components/landing/HowItWorks';
import { FinalCTA } from '../components/landing/FinalCTA';

export const LandingPage: React.FC = () => {
  const { user } = useAuthStore();
  const isReseller = user?.role === 'RESELLER' || (user?.role as string) === 'SELLER';

  return (
    <div className="w-full bg-[#05070A] text-[#F5F5F2] overflow-x-hidden selection:bg-[#FF5A36] selection:text-white font-sans antialiased">
      {/* 01: 100vh Full Screen Concert Hero */}
      <Hero />

      {/* 01.5: Reseller Portal Dashboard Console (Visible for Resellers) */}
      {isReseller && <ResellerConsole />}

      {/* 02: Featured Tonight (Massive Photo Presentation) */}
      <FeaturedEvent />

      {/* 03: Music Discovery (Magazine Editorial Layout) */}
      <MusicDiscovery />

      {/* 04: Feel The Sound (Cinematic Visual Showcase) */}
      <FeelTheSound />

      {/* 05: More Than Music (Spectrum Categories) */}
      <EventCategories />

      {/* 06: The Ticket (Impression Centerpiece Pass) */}
      <TicketExperience />

      {/* 07: Security Protocol (Crypto Scanner & Status) */}
      <Security />

      {/* 08: How It Works (Editorial Staggered Timeline) */}
      <HowItWorks />

      {/* 09: Final Experience (Full Screen Crowd CTA) */}
      <FinalCTA />
    </div>
  );
};

export default LandingPage;
