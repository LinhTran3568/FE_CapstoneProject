import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 border-t border-navy-800 text-slate-400 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-navy-950 font-bold">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                TicketShield<span className="text-cyan-400">.AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Nền tảng công nghệ AI chống bot săn vé số lượng lớn & sàn giao dịch sang nhượng vé sự kiện xác thực P2P số 1 Việt Nam.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg w-fit">
              <CheckCircle2 className="w-4 h-4" /> 100% Vé Xác Thực Bảo Vệ Escrow
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">Tính Năng & Dịch Vụ</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/events" className="hover:text-cyan-400 transition-colors">Sự kiện đang mở bán</Link></li>
              <li><Link to="/marketplace" className="hover:text-cyan-400 transition-colors">Sàn sang nhượng vé Verified</Link></li>
              <li><Link to="/tickets/verify" className="hover:text-cyan-400 transition-colors">Xác thực vé niêm yết AI</Link></li>
              <li><Link to="/disputes" className="hover:text-cyan-400 transition-colors">Bảo vệ thanh toán & Khiếu nại Escrow</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">Công Nghệ AI & Bảo Mật</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5 text-cyan-400" /> AI Bot Behavioral Classification</li>
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-cyan-400" /> Escrow Smart Contract Simulation</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Organizer API Ticket Verification</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">Trực Thuộc Đồ Án</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Capstone Project: <strong>TicketShield AI</strong>
              <br />Bộ môn Kỹ thuật Phần mềm (Software Engineering).
            </p>
            <div className="mt-4 p-3 bg-navy-900 border border-navy-800 rounded-lg text-[11px] text-slate-400">
              Chỉ dùng cho mục đích trình diễn Capstone Project Demonstration.
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-navy-850 text-center text-xs text-slate-400">
          © 2026 TicketShield AI. Tất cả quyền được bảo lưu. Thiết kế kiến trúc Production-Ready Frontend.
        </div>
      </div>
    </footer>
  );
};
