import React from 'react';
import { Calendar, Clock, Sparkles, ChevronRight } from 'lucide-react';

interface UpcomingTimeSectionProps {
  onSelectTimeRange: (timeRange: 'upcoming' | 'this-month') => void;
}

export const UpcomingTimeSection: React.FC<UpcomingTimeSectionProps> = ({ onSelectTimeRange }) => {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FF5A36]/10 text-[#FF5A36] flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold font-display text-white">Sự Kiện Sắp Diễn Ra</h3>
            <p className="text-xs text-[#8B929C]">Chọn mốc thời gian để tìm vé phù hợp lịch trình của bạn</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 7 ngày tới */}
        <button
          type="button"
          onClick={() => onSelectTimeRange('upcoming')}
          className="p-4 sm:p-5 rounded-2xl bg-[#090C12]/80 hover:bg-[#121622] border border-white/10 hover:border-[#FF5A36]/50 transition-all duration-200 flex items-center justify-between group cursor-pointer text-left shadow-lg"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#FF5A36]/10 text-[#FF5A36] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-[#FF5A36] transition-colors">
                  Trong 7 Ngày Tới
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-[#FF5A36]/20 text-[#FF5A36] text-[10px] font-mono font-bold">
                  HOT
                </span>
              </div>
              <p className="text-xs text-[#8B929C] mt-0.5">
                Các đêm diễn và show sắp bắt đầu trong tuần này
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8B929C] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
        </button>

        {/* Trong tháng này */}
        <button
          type="button"
          onClick={() => onSelectTimeRange('this-month')}
          className="p-4 sm:p-5 rounded-2xl bg-[#090C12]/80 hover:bg-[#121622] border border-white/10 hover:border-emerald-500/50 transition-all duration-200 flex items-center justify-between group cursor-pointer text-left shadow-lg"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                Trong Tháng Này
              </h4>
              <p className="text-xs text-[#8B929C] mt-0.5">
                Tất cả các concert và giải đấu trong tháng
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8B929C] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
        </button>
      </div>
    </div>
  );
};
