import React from 'react';
import { Link } from 'react-router-dom';
import { TicketShieldLogo } from '../ui/TicketShieldLogo';
import { ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0A0D12]/95 backdrop-blur-2xl border-t border-white/20 text-[#F5F5F2] py-16 md:py-20 relative z-20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="inline-block">
              <TicketShieldLogo size="md" />
            </Link>
            <p className="text-sm text-[#D0D4DC] max-w-sm leading-relaxed">
              Discover experiences worth remembering. Vietnam's 100% verified live event ticket platform with escrow fraud protection.
            </p>
          </div>

          {/* Links Col 1 */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest font-display mb-4 border-b border-[#FF5A36] pb-1 w-fit">
              Platform Nav
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/marketplace" className="text-[#D0D4DC] hover:text-[#FF5A36] transition-colors flex items-center gap-1">
                  <span>Resale Marketplace</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#FF5A36]" />
                </Link>
              </li>
              <li>
                <Link to="/sell-ticket" className="text-[#D0D4DC] hover:text-[#FF5A36] transition-colors">
                  Sell Ticket
                </Link>
              </li>
              <li>
                <Link to="/my-listings" className="text-[#D0D4DC] hover:text-[#FF5A36] transition-colors">
                  My Listings
                </Link>
              </li>
              <li>
                <Link to="/my-tickets" className="text-[#D0D4DC] hover:text-[#FF5A36] transition-colors">
                  My Tickets
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest font-display mb-4 border-b border-[#FF5A36] pb-1 w-fit">
              Account
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/profile" className="text-[#D0D4DC] hover:text-[#FF5A36] transition-colors">
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-[#D0D4DC] hover:text-[#FF5A36] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-[#D0D4DC] hover:text-[#FF5A36] transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 3 */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest font-display mb-4 border-b border-[#FF5A36] pb-1 w-fit">
              Legal & Safety
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/security" className="text-[#D0D4DC] hover:text-[#FF5A36] transition-colors">
                  Security Protocol
                </Link>
              </li>
              <li>
                <a href="#privacy" className="text-[#D0D4DC] hover:text-[#FF5A36] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="text-[#D0D4DC] hover:text-[#FF5A36] transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between text-xs text-[#D0D4DC] gap-4">
          <p className="font-medium">© 2026 TicketShield Financial Inc. All rights reserved.</p>
          <p className="font-mono text-xs text-[#FF5A36] font-bold tracking-wider">
            VERIFIED CINEMATIC ENTERTAINMENT PLATFORM
          </p>
        </div>
      </div>
    </footer>
  );
};
