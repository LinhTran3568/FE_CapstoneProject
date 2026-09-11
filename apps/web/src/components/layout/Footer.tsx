import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 border-t border-navy-800 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center text-navy-950 font-bold">
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              TicketShield<span className="text-cyan-400">.FE</span>
            </span>
          </div>

          <div className="text-xs text-slate-400 text-center sm:text-right">
            &copy; {new Date().getFullYear()} TicketShield. Front-End Framework.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
