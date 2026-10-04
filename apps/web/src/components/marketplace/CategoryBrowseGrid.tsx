import React from 'react';
import { Music, Zap, Trophy, Theater, GraduationCap } from 'lucide-react';

interface CategoryCard {
  id: string;
  name: string;
  count: number;
  icon: React.ElementType;
  imageUrl: string;
  accentColor: string;
}

const CATEGORY_CARDS: CategoryCard[] = [
  {
    id: 'CONCERT',
    name: 'Concerts & Live Music',
    count: 24,
    icon: Music,
    imageUrl: '/images/landing/hero-concert.jpg',
    accentColor: '#FF5A36',
  },
  {
    id: 'FESTIVAL',
    name: 'Festivals & EDM',
    count: 12,
    icon: Zap,
    imageUrl: '/images/landing/festival.jpg',
    accentColor: '#A855F7',
  },
  {
    id: 'SPORTS',
    name: 'Sports & Tournaments',
    count: 16,
    icon: Trophy,
    imageUrl: '/images/landing/sports.jpg',
    accentColor: '#10B981',
  },
  {
    id: 'THEATER',
    name: 'Theater & Performing Arts',
    count: 8,
    icon: Theater,
    imageUrl: '/images/landing/theater.jpg',
    accentColor: '#06B6D4',
  },
  {
    id: 'WORKSHOP',
    name: 'Workshops & Talks',
    count: 5,
    icon: GraduationCap,
    imageUrl: '/images/landing/electronic.jpg',
    accentColor: '#F59E0B',
  },
];

interface CategoryBrowseGridProps {
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryBrowseGrid: React.FC<CategoryBrowseGridProps> = ({ onSelectCategory }) => {
  return (
    <div className="my-12">
      <div className="mb-5">
        <h3 className="text-lg sm:text-xl font-bold font-display text-white">Explore by Category</h3>
        <p className="text-xs text-[#8B929C]">Choose the event categories you are looking for</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {CATEGORY_CARDS.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className="relative h-44 rounded-2xl overflow-hidden border border-white/10 hover:border-[#FF5A36]/60 transition-all duration-300 group cursor-pointer text-left shadow-lg"
            >
              {/* Image Background */}
              <img
                src={cat.imageUrl}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brightness-75 group-hover:brightness-90"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/landing/concert.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/50 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20"
                  style={{ backgroundColor: `${cat.accentColor}25`, color: cat.accentColor }}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#FF5A36] transition-colors leading-snug">
                    {cat.name}
                  </h4>
                  <p className="text-[11px] text-[#94A3B8] font-mono mt-0.5">{cat.count} tickets available</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
