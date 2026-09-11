import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HeroSection } from '../components/landing/HeroSection';
import { FlowSection } from '../components/landing/FlowSection';
import { PartnersSection } from '../components/landing/PartnersSection';
import { TicketMachineSection } from '../components/landing/TicketMachineSection';
import './Home.css';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

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
          const availableHeight = viewportHeight - headerOffset;

          let targetScrollTop: number;
          if (targetId === 'ticket-dispenser') {
            targetScrollTop = absoluteElementTop - headerOffset - 10;
          } else if (elementHeight < availableHeight) {
            targetScrollTop = absoluteElementTop - headerOffset - (availableHeight - elementHeight) / 2;
          } else {
            targetScrollTop = absoluteElementTop - headerOffset - 16;
          }

          window.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth',
          });
        }
      }, 150);
    }
  }, [location, navigate]);

  return (
    <div className="home-container content-wrapper" ref={containerRef}>
      {/* SECTION 1: HERO */}
      <HeroSection />

      {/* SECTION 2: 3D BOX CAROUSEL FLOW */}
      <FlowSection />

      {/* SECTION 3: CÁC BÊN LIÊN KẾT (MARQUEE ALONG SVG PATH) */}
      <PartnersSection />

      {/* SECTION 4: 3D TICKET MACHINE & CALL TO ACTION */}
      <TicketMachineSection />
    </div>
  );
}

export const HomePage = Home;
