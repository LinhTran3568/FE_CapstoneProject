import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { HeroSection } from '../components/landing/HeroSection';
import { FlowSection } from '../components/landing/FlowSection';
import { PartnersSection } from '../components/landing/PartnersSection';
import { TicketMachineSection } from '../components/landing/TicketMachineSection';
import './Home.css';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  // If user is already authenticated, redirect away from Guest Landing Page to Marketplace
  useEffect(() => {
    if (user) {
      navigate('/marketplace', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (location.state && (location.state as any).scrollTo) {
      const targetId = (location.state as any).scrollTo;
      navigate(location.pathname, { replace: true, state: {} });
      setTimeout(() => {
        if (targetId === 'hero') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        const el = document.getElementById(targetId);
        if (el) {
          const headerOffset = 64;
          const elementRect = el.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.scrollY;
          const elementHeight = el.offsetHeight;
          const viewportHeight = window.innerHeight;

          let targetScrollTop = absoluteElementTop - headerOffset - 16;
          if (targetId === 'flow') {
            targetScrollTop = absoluteElementTop - 40;
          } else if (elementHeight < viewportHeight) {
            targetScrollTop = Math.min(targetScrollTop, absoluteElementTop - (viewportHeight - elementHeight) / 2);
          }

          window.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth',
          });
        }
      }, 150);
    }
  }, [location, navigate]);

  if (user) {
    return null;
  }

  return (
    <div className="home-container content-wrapper" ref={containerRef}>
      {/* SECTION 1: HERO */}
      <HeroSection />

      {/* SECTION 2: 3D BOX CAROUSEL FLOW */}
      <FlowSection />

      {/* SECTION 3: PARTNERS MARQUEE */}
      <PartnersSection />

      {/* SECTION 4: 3D TICKET MACHINE & CALL TO ACTION */}
      <TicketMachineSection />
    </div>
  );
}

export const HomePage = Home;
