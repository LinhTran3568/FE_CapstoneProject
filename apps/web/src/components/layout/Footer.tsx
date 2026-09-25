import React from 'react';
import { Link } from 'react-router-dom';
import { TicketShieldLogo } from '../ui/TicketShieldLogo';
import { ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0A0D12]/95 backdrop-blur-2xl border-t border-white/10 text-[#F5F5F2] pt-12 pb-10 relative z-20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* MAIN FOOTER NAVIGATION LINKS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-10">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="inline-block">
              <TicketShieldLogo size="md" />
            </Link>
            <p className="text-sm text-[#8B929C] max-w-sm leading-relaxed">
              Vietnam's premier secure and verified event ticket resale platform.
            </p>
          </div>

          {/* Links Col 1: Platform Nav */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest font-display mb-4 border-b border-[#FF5A36] pb-1 w-fit">
              Discover
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link
                  to="/marketplace"
                  className="text-[#CBD5E1] hover:text-[#FF5A36] transition-colors flex items-center gap-1"
                >
                  <span>Ticket Marketplace</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#FF5A36]" />
                </Link>
              </li>
              <li>
                <Link to="/sell-ticket" className="text-[#CBD5E1] hover:text-[#FF5A36] transition-colors">
                  Sell Tickets
                </Link>
              </li>
              <li>
                <Link to="/my-listings" className="text-[#CBD5E1] hover:text-[#FF5A36] transition-colors">
                  My Listings
                </Link>
              </li>
              <li>
                <Link to="/my-tickets" className="text-[#CBD5E1] hover:text-[#FF5A36] transition-colors">
                  My Tickets
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 2: Account */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest font-display mb-4 border-b border-[#FF5A36] pb-1 w-fit">
              Account
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/profile" className="text-[#CBD5E1] hover:text-[#FF5A36] transition-colors">
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-[#CBD5E1] hover:text-[#FF5A36] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-[#CBD5E1] hover:text-[#FF5A36] transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 3: Policy */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest font-display mb-4 border-b border-[#FF5A36] pb-1 w-fit">
              Trust &amp; Safety
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <a href="#privacy" className="text-[#CBD5E1] hover:text-[#FF5A36] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="text-[#CBD5E1] hover:text-[#FF5A36] transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8B929C] gap-4">
          <p className="font-medium">© 2026 TicketShield Platform. All rights reserved.</p>
          <p className="font-mono text-xs text-[#FF5A36] font-semibold tracking-wider uppercase">
            VERIFIED FAN EVENT TICKET PLATFORM
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
