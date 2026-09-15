import React from 'react';
import { Music, Zap, Trophy, Theater, GraduationCap, LayoutGrid } from 'lucide-react';

export interface CategoryOption {
  id: string;
  label: string;
  icon: React.ElementType;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'ALL', label: 'Tất cả', icon: LayoutGrid },
  { id: 'CONCERT', label: 'Ca nhạc', icon: Music },
  { id: 'FESTIVAL', label: 'Festival & EDM', icon: Zap },
  { id: 'SPORTS', label: 'Thể thao', icon: Trophy },
  { id: 'THEATER', label: 'Sân khấu', icon: Theater },
  { id: 'WORKSHOP', label: 'Hội thảo', icon: GraduationCap },
];

interface CategoryFilterBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 mb-6">
      <div className="flex items-center gap-2.5 min-w-max">
        {CATEGORY_OPTIONS.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`h-11 px-4 sm:px-5 rounded-2xl text-xs sm:text-sm font-sans font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer border select-none ${
                isSelected
                  ? 'bg-[#FF5A36] border-[#FF5A36] text-white shadow-[0_4px_15px_rgba(255,90,54,0.35)] scale-[1.02]'
                  : 'bg-[#090C12]/90 hover:bg-[#121620] border-white/10 hover:border-white/20 text-[#A3A8B3] hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#8B929C]'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
