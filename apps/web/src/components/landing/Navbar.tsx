import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#05070A]/85 backdrop-blur-md border-b border-white/5 py-4 shadow-2xl'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-3 h-3 rounded-full bg-[#FF5A36] group-hover:scale-125 transition-transform duration-300" />
          <span className="font-display text-xl font-bold tracking-tight text-[#F5F5F2]">
            TicketShield
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide">
          <a
            href="#discover"
            className="text-[#A3A8B3] hover:text-[#F5F5F2] transition-colors duration-200"
          >
            Discover
          </a>
          <a
            href="#events"
            className="text-[#A3A8B3] hover:text-[#F5F5F2] transition-colors duration-200"
          >
            Events
          </a>
          <a
            href="#experiences"
            className="text-[#A3A8B3] hover:text-[#F5F5F2] transition-colors duration-200"
          >
            Experiences
          </a>
          <a
            href="#security"
            className="text-[#A3A8B3] hover:text-[#F5F5F2] transition-colors duration-200"
          >
            Security
          </a>
        </nav>

        {/* Right CTA / Auth */}
        <div className="hidden md:flex items-center space-x-6 text-sm">
          <Link
            to="/login"
            className="text-[#A3A8B3] hover:text-[#F5F5F2] font-medium transition-colors duration-200"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-medium rounded-full tracking-wide transition-all duration-200 shadow-lg shadow-[#FF5A36]/20 hover:shadow-[#FF5A36]/40"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-[#F5F5F2] p-2 focus:outline-none"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M18.293 5.293a1 1 0 011.414 1.414L13.414 12l6.293 6.293a1 1 0 01-1.414 1.414L12 13.414l-6.293 6.293a1 1 0 01-1.414-1.414L10.586 12 4.293 5.707a1 1 0 011.414-1.414L12 10.586l6.293-6.293z"
              />
            ) : (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#05070A]/95 backdrop-blur-xl border-b border-white/10 px-6 py-6 space-y-4">
          <a
            href="#discover"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#A3A8B3] hover:text-[#F5F5F2] text-lg font-medium"
          >
            Discover
          </a>
          <a
            href="#events"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#A3A8B3] hover:text-[#F5F5F2] text-lg font-medium"
          >
            Events
          </a>
          <a
            href="#experiences"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#A3A8B3] hover:text-[#F5F5F2] text-lg font-medium"
          >
            Experiences
          </a>
          <a
            href="#security"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#A3A8B3] hover:text-[#F5F5F2] text-lg font-medium"
          >
            Security
          </a>
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#F5F5F2] font-medium text-center py-2"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3 bg-[#FF5A36] text-white font-medium rounded-full"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
