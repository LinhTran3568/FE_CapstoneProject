import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Calendar, ArrowUpDown, X, Check, ChevronDown } from 'lucide-react';

export interface QuickFilterState {
  keyword: string;
  city: string;
  dateRange: 'all' | 'upcoming' | 'this-month';
  sortBy: 'newest' | 'price-asc' | 'date-asc';
}

interface QuickFilterBarProps {
  filters: QuickFilterState;
  onChange: (filters: QuickFilterState) => void;
  onReset: () => void;
}

const CITY_OPTIONS = [
  { id: 'ALL', label: 'Tất cả địa điểm' },
  { id: 'HN', label: 'Hà Nội' },
  { id: 'HCM', label: 'TP. Hồ Chí Minh' },
  { id: 'DN', label: 'Đà Nẵng' },
];

const DATE_OPTIONS = [
  { id: 'all', label: 'Mọi thời điểm' },
  { id: 'upcoming', label: '7 ngày tới' },
  { id: 'this-month', label: 'Trong tháng này' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Mới niêm yết' },
  { id: 'price-asc', label: 'Giá thấp → cao' },
  { id: 'date-asc', label: 'Ngày diễn ra gần nhất' },
];

export const QuickFilterBar: React.FC<QuickFilterBarProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<'city' | 'date' | 'sort' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters =
    Boolean(filters.keyword.trim()) ||
    filters.city !== 'ALL' ||
    filters.dateRange !== 'all' ||
    filters.sortBy !== 'newest';

  const currentCityLabel =
    CITY_OPTIONS.find((c) => c.id === filters.city)?.label || 'Địa điểm';

  const currentDateLabel =
    DATE_OPTIONS.find((d) => d.id === filters.dateRange)?.label || 'Thời gian';

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.id === filters.sortBy)?.label || 'Sắp xếp';

  return (
    <div ref={containerRef} className="relative z-40 w-full space-y-3 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search input (6 columns on desktop) */}
        <div className="lg:col-span-5 relative">
          <div className="h-11 bg-[#090C12]/90 border border-white/10 hover:border-white/20 focus-within:border-[#FF5A36] focus-within:ring-1 focus-within:ring-[#FF5A36]/40 rounded-xl px-3 flex items-center gap-2 transition-all">
            <Search className="w-4 h-4 text-[#8B929C] shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo sự kiện, nghệ sĩ, địa điểm..."
              value={filters.keyword}
              onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
              className="w-full bg-transparent border-0 text-white placeholder-[#8B929C] text-xs sm:text-sm font-medium focus:outline-none"
            />
            {filters.keyword && (
              <button
                type="button"
                onClick={() => onChange({ ...filters, keyword: '' })}
                className="p-1 text-[#8B929C] hover:text-white rounded-md transition-colors"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* City Filter (2.5 columns) */}
        <div className="lg:col-span-2 relative">
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'city' ? null : 'city')}
            className={`w-full h-11 px-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer select-none ${
              filters.city !== 'ALL'
                ? 'bg-[#FF5A36]/10 border-[#FF5A36]/50 text-white'
                : 'bg-[#090C12]/90 hover:bg-[#121620] border-white/10 text-[#CBD5E1] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <MapPin className={`w-4 h-4 shrink-0 ${filters.city !== 'ALL' ? 'text-[#FF5A36]' : 'text-[#8B929C]'}`} />
              <span className="truncate">{currentCityLabel}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#8B929C] transition-transform ${activeDropdown === 'city' ? 'rotate-180' : ''}`} />
          </button>

          {activeDropdown === 'city' && (
            <div className="absolute top-full left-0 mt-1.5 w-48 bg-[#0D1117] border border-white/15 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95">
              {CITY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange({ ...filters, city: opt.id });
                    setActiveDropdown(null);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    filters.city === opt.id
                      ? 'bg-[#FF5A36]/20 text-[#FF5A36] font-bold'
                      : 'text-[#CBD5E1] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  {filters.city === opt.id && <Check className="w-3.5 h-3.5 text-[#FF5A36]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Filter (2.5 columns) */}
        <div className="lg:col-span-2 relative">
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'date' ? null : 'date')}
            className={`w-full h-11 px-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer select-none ${
              filters.dateRange !== 'all'
                ? 'bg-[#FF5A36]/10 border-[#FF5A36]/50 text-white'
                : 'bg-[#090C12]/90 hover:bg-[#121620] border-white/10 text-[#CBD5E1] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Calendar className={`w-4 h-4 shrink-0 ${filters.dateRange !== 'all' ? 'text-[#FF5A36]' : 'text-[#8B929C]'}`} />
              <span className="truncate">{currentDateLabel}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#8B929C] transition-transform ${activeDropdown === 'date' ? 'rotate-180' : ''}`} />
          </button>

          {activeDropdown === 'date' && (
            <div className="absolute top-full left-0 mt-1.5 w-48 bg-[#0D1117] border border-white/15 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95">
              {DATE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange({ ...filters, dateRange: opt.id as any });
                    setActiveDropdown(null);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    filters.dateRange === opt.id
                      ? 'bg-[#FF5A36]/20 text-[#FF5A36] font-bold'
                      : 'text-[#CBD5E1] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  {filters.dateRange === opt.id && <Check className="w-3.5 h-3.5 text-[#FF5A36]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort Dropdown (2 columns) */}
        <div className="lg:col-span-2 relative">
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
            className={`w-full h-11 px-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer select-none ${
              filters.sortBy !== 'newest'
                ? 'bg-[#FF5A36]/10 border-[#FF5A36]/50 text-white'
                : 'bg-[#090C12]/90 hover:bg-[#121620] border-white/10 text-[#CBD5E1] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <ArrowUpDown className={`w-4 h-4 shrink-0 ${filters.sortBy !== 'newest' ? 'text-[#FF5A36]' : 'text-[#8B929C]'}`} />
              <span className="truncate">{currentSortLabel}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#8B929C] transition-transform ${activeDropdown === 'sort' ? 'rotate-180' : ''}`} />
          </button>

          {activeDropdown === 'sort' && (
            <div className="absolute top-full right-0 mt-1.5 w-52 bg-[#0D1117] border border-white/15 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange({ ...filters, sortBy: opt.id as any });
                    setActiveDropdown(null);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    filters.sortBy === opt.id
                      ? 'bg-[#FF5A36]/20 text-[#FF5A36] font-bold'
                      : 'text-[#CBD5E1] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  {filters.sortBy === opt.id && <Check className="w-3.5 h-3.5 text-[#FF5A36]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reset Filter Button (1 column / inline) */}
        {hasActiveFilters && (
          <div className="lg:col-span-1 flex items-center justify-end">
            <button
              type="button"
              onClick={onReset}
              className="h-11 px-3 text-xs font-semibold text-[#FF5A36] hover:text-white bg-[#FF5A36]/10 hover:bg-[#FF5A36] border border-[#FF5A36]/30 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
