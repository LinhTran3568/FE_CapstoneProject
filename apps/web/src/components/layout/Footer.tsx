import React from 'react';
import { Link } from 'react-router-dom';
import { TicketShieldLogo } from '../ui/TicketShieldLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#05070A] border-t border-white/10 text-[#A3A8B3] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/">
              <TicketShieldLogo size="md" />
            </Link>
            <p className="text-sm text-[#A3A8B3] max-w-sm">
              Discover experiences worth remembering. Vietnam's verified live event ticket platform.
            </p>
          </div>

          {/* Links Col 1 */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-[#F5F5F2] uppercase tracking-widest font-display mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#discover" className="hover:text-[#F5F5F2] transition-colors">
                  Discover
                </a>
              </li>
              <li>
                <a href="#events" className="hover:text-[#F5F5F2] transition-colors">
                  Events
                </a>
              </li>
              <li>
                <a href="#experiences" className="hover:text-[#F5F5F2] transition-colors">
                  Experiences
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-[#F5F5F2] transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-[#F5F5F2] uppercase tracking-widest font-display mb-4">
              Account
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/login" className="hover:text-[#F5F5F2] transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#F5F5F2] transition-colors">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 3 */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-[#F5F5F2] uppercase tracking-widest font-display mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#contact" className="hover:text-[#F5F5F2] transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-[#F5F5F2] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-[#F5F5F2] transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A3A8B3] gap-4">
          <p>© 2026 TicketShield. All rights reserved.</p>
          <p className="font-mono text-[11px]">VERIFIED CINEMATIC ENTERTAINMENT PLATFORM</p>
        </div>
      </div>
    </footer>
  );
};
