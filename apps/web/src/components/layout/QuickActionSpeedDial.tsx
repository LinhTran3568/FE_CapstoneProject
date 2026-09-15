import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Ticket,
  PlusCircle,
  Sparkles,
  ListFilter,
  Home,
  ArrowUp,
} from 'lucide-react';

interface SpeedDialActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  bgClass: string;
  hoverShadowClass: string;
  badgeDotClass: string;
  action?: () => void;
  to?: string;
}

export const QuickActionSpeedDial: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // All 6 actions stacked vertically from bottom to top (zero clipping & full features)
  const actions: SpeedDialActionItem[] = [
    {
      id: 'scroll-top',
      label: 'Scroll to Top',
      icon: <ArrowUp className="w-4 h-4 text-white" />,
      bgClass: 'bg-[#8B5CF6] hover:bg-[#7C3AED]',
      hoverShadowClass: 'shadow-[0_4px_16px_rgba(139,92,246,0.6)]',
      badgeDotClass: 'bg-[#8B5CF6]',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="w-4 h-4 text-white" />,
      bgClass: 'bg-[#3B82F6] hover:bg-[#2563EB]',
      hoverShadowClass: 'shadow-[0_4px_16px_rgba(59,130,246,0.6)]',
      badgeDotClass: 'bg-[#3B82F6]',
      to: '/',
    },
    {
      id: 'my-listings',
      label: 'My Listings',
      icon: <ListFilter className="w-4 h-4 text-white" />,
      bgClass: 'bg-[#6366F1] hover:bg-[#4F46E5]',
      hoverShadowClass: 'shadow-[0_4px_16px_rgba(99,102,241,0.6)]',
      badgeDotClass: 'bg-[#6366F1]',
      to: '/my-listings',
    },
    {
      id: 'my-tickets',
      label: 'My Tickets',
      icon: <Sparkles className="w-4 h-4 text-white" />,
      bgClass: 'bg-[#10B981] hover:bg-[#059669]',
      hoverShadowClass: 'shadow-[0_4px_16px_rgba(16,185,129,0.6)]',
      badgeDotClass: 'bg-[#10B981]',
      to: '/my-tickets',
    },
    {
      id: 'sell',
      label: 'Sell Ticket',
      icon: <PlusCircle className="w-4 h-4 text-white" />,
      bgClass: 'bg-[#FF5A36] hover:bg-[#E04826]',
      hoverShadowClass: 'shadow-[0_4px_16px_rgba(255,90,54,0.6)]',
      badgeDotClass: 'bg-[#FF5A36]',
      to: '/sell-ticket',
    },
    {
      id: 'marketplace',
      label: 'Marketplace',
      icon: <Ticket className="w-4 h-4 text-white" />,
      bgClass: 'bg-[#EC4899] hover:bg-[#DB2777]',
      hoverShadowClass: 'shadow-[0_4px_16px_rgba(236,72,153,0.6)]',
      badgeDotClass: 'bg-[#EC4899]',
      to: '/marketplace',
    },
  ];

  const handleItemClick = (item: SpeedDialActionItem) => {
    setIsOpen(false);
    if (item.action) {
      item.action();
    } else if (item.to) {
      navigate(item.to);
    }
  };

  return (
    <>
      {/* Backdrop Dimmer when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Vertical Speed Dial Container - Anchored at bottom-right corner */}
      <div
        ref={containerRef}
        className="fixed bottom-0 right-0 z-50 flex flex-col items-end select-none pointer-events-none"
      >
        {/* Vertically Stacked Action Items (bottom to top, popping above the corner wedge) */}
        <div className="flex flex-col items-end gap-3 mb-4 mr-3 pointer-events-none">
          {actions.map((item, idx) => {
            const isActive = item.to && location.pathname === item.to;
            // Delay animation: items near bottom open first
            const delay = isOpen ? `${(actions.length - 1 - idx) * 30}ms` : '0ms';

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 transition-all duration-300 ease-out"
                style={{
                  transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.85)',
                  opacity: isOpen ? 1 : 0,
                  transitionDelay: delay,
                  pointerEvents: isOpen ? 'auto' : 'none',
                }}
              >
                {/* Text Label Pill to the left */}
                <button
                  onClick={() => handleItemClick(item)}
                  className="px-3 py-1.5 rounded-xl bg-[#090C12]/95 border border-white/20 text-white text-xs font-mono font-bold tracking-wide whitespace-nowrap shadow-[0_4px_20px_rgba(0,0,0,0.8)] backdrop-blur-xl hover:border-[#FF5A36] hover:text-[#FF5A36] transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <span className={`w-2 h-2 rounded-full ${item.badgeDotClass} animate-pulse`} />
                  <span>{item.label}</span>
                </button>

                {/* Circular Action Button */}
                <button
                  onClick={() => handleItemClick(item)}
                  className={`w-10 h-10 rounded-full ${item.bgClass} ${item.hoverShadowClass} flex items-center justify-center transition-all duration-200 hover:scale-115 active:scale-95 shadow-xl cursor-pointer focus:outline-none ring-2 ring-black/40 shrink-0 ${
                    isActive ? 'ring-2 ring-white scale-105' : ''
                  }`}
                  aria-label={item.label}
                  title={item.label}
                >
                  {item.icon}
                </button>
              </div>
            );
          })}
        </div>

        {/* White Corner Wedge Button (Exposed ~1/3 in the bottom-right corner) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`pointer-events-auto w-16 h-16 rounded-tl-full bg-white text-[#0A0D12] shadow-[0_0_35px_rgba(0,0,0,0.7)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none z-50 flex items-end justify-end pb-2.5 pr-2.5 group ${
            isOpen
              ? 'bg-white shadow-[0_0_30px_rgba(255,255,255,0.5)]'
              : 'hover:brightness-105'
          }`}
          aria-label={isOpen ? 'Close menu' : 'Quick actions'}
          title={isOpen ? 'Close menu' : 'Quick Actions'}
        >
          {/* Centered comfortably inside visible white corner */}
          <div
            className={`transition-transform duration-300 ease-out flex items-center justify-center ${
              isOpen ? 'rotate-45' : 'rotate-0'
            }`}
          >
            <Plus className="w-6 h-6 text-[#0A0D12] stroke-[2.8]" />
          </div>
        </button>
      </div>
    </>
  );
};

export default QuickActionSpeedDial;
