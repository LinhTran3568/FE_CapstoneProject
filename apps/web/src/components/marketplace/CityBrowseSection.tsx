import React from 'react';
import { MapPin } from 'lucide-react';

interface CityItem {
  id: string;
  name: string;
  count: number;
  imageUrl: string;
}

const CITIES: CityItem[] = [
  {
    id: 'HCM',
    name: 'TP. Hồ Chí Minh',
    count: 38,
    imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'HN',
    name: 'Hà Nội',
    count: 26,
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'DN',
    name: 'Đà Nẵng',
    count: 12,
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
  },
];

interface CityBrowseSectionProps {
  onSelectCity: (cityId: string) => void;
}

export const CityBrowseSection: React.FC<CityBrowseSectionProps> = ({ onSelectCity }) => {
  return (
    <div className="my-10">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <span>Sự Kiện Theo Thành Phố</span>
          </h3>
          <p className="text-xs text-[#8B929C]">Khám phá các sự kiện đang diễn ra tại các thành phố lớn</p>
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
                {city.count} sự kiện & vé khả dụng
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
