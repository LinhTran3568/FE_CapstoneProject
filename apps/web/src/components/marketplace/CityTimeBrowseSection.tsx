import React from 'react';
import { MapPin, Calendar, Clock, ChevronRight } from 'lucide-react';

interface CityItem {
  id: string;
  name: string;
  count: number;
  imageUrl: string;
}

const CITIES: CityItem[] = [
  {
    id: 'HCM',
    name: 'Ho Chi Minh City',
    count: 38,
    imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'HN',
    name: 'Hanoi',
    count: 26,
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'DN',
    name: 'Da Nang',
    count: 12,
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
  },
];

interface CityTimeBrowseSectionProps {
  onSelectCity: (cityId: string) => void;
  onSelectTimeRange: (timeRange: 'upcoming' | 'this-month') => void;
}

export const CityTimeBrowseSection: React.FC<CityTimeBrowseSectionProps> = ({
  onSelectCity,
  onSelectTimeRange,
}) => {
  return (
    <div className="my-12 space-y-10">
      {/* 1. BROWSE BY CITY */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <span>Events by City</span>
            </h3>
            <p className="text-xs text-[#8B929C]">Explore popular events taking place near you</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {CITIES.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => onSelectCity(city.id)}
              className="relative h-36 rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-400/60 transition-all duration-300 group cursor-pointer text-left shadow-lg"
            >
              <img
                src={city.imageUrl}
                alt={city.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-75 group-hover:brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/40 to-transparent" />

              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <h4 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {city.name}
                </h4>
                <p className="text-xs text-[#CBD5E1] font-mono mt-0.5">
                  {city.count} events &amp; tickets available
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. BROWSE BY TIME */}
      <div>
        <div className="mb-5">
          <h3 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#FF5A36]" />
            <span>Upcoming Schedule</span>
          </h3>
          <p className="text-xs text-[#8B929C]">Select a time frame to find events matching your calendar</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onSelectTimeRange('upcoming')}
            className="p-5 rounded-2xl bg-[#090C12]/80 hover:bg-[#121622] border border-white/10 hover:border-[#FF5A36]/50 transition-all duration-200 flex items-center justify-between group cursor-pointer text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FF5A36]/10 text-[#FF5A36] flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white group-hover:text-[#FF5A36] transition-colors">
                  Next 7 Days
                </h4>
                <p className="text-xs text-[#8B929C] mt-0.5">
                  Shows and concerts taking place this week
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#8B929C] group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>

          <button
            type="button"
            onClick={() => onSelectTimeRange('this-month')}
            className="p-5 rounded-2xl bg-[#090C12]/80 hover:bg-[#121622] border border-white/10 hover:border-emerald-500/50 transition-all duration-200 flex items-center justify-between group cursor-pointer text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                  This Month
                </h4>
                <p className="text-xs text-[#8B929C] mt-0.5">
                  All events and live performances this month
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#8B929C] group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
};
