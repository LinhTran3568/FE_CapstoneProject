import React, { useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/event/EventCard';
import { Search, Filter } from 'lucide-react';

export const EventsPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const { data: events, isLoading } = useEvents({ query, category });

  return (
    <div className="space-y-8 py-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Sự Kiện Âm Nhạc & Thể Thao Việt Nam</h1>
        <p className="text-sm text-slate-400 mt-1">
          Tất cả sự kiện mở bán vé chính thức và sang nhượng được bảo vệ bởi TicketShield AI Engine
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-navy-850 p-4 rounded-xl border border-navy-750">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm theo tên sự kiện, ca sĩ, địa điểm..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-navy-900 border border-navy-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-navy-900 text-slate-200 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="">Tất cả thể loại</option>
            <option value="CONCERT">Concert</option>
            <option value="FESTIVAL">Lễ hội âm nhạc</option>
            <option value="SPORTS">Thể thao</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 bg-navy-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {events?.map((evt) => (
            <EventCard key={evt.id} event={evt} />
          ))}
        </div>
      )}
    </div>
  );
};
