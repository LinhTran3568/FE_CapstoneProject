import React from 'react';
import { Mic2 } from 'lucide-react';

interface ArtistItem {
  id: string;
  name: string;
  genre: string;
  avatarUrl: string;
  activeEventsCount: number;
}

const FEATURED_ARTISTS: ArtistItem[] = [
  {
    id: 'art-1',
    name: 'HIEUTHUHAI',
    genre: 'Rap / Hip-Hop',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    activeEventsCount: 3,
  },
  {
    id: 'art-2',
    name: 'Mỹ Tâm',
    genre: 'Pop / Ballad',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    activeEventsCount: 2,
  },
  {
    id: 'art-3',
    name: 'Anh Trai Say Hi',
    genre: 'Pop / Live Band',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    activeEventsCount: 4,
  },
  {
    id: 'art-4',
    name: 'Suboi',
    genre: 'Hip-Hop / Rap',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    activeEventsCount: 2,
  },
  {
    id: 'art-5',
    name: 'Thành Lộc & Ngày Xửa Ngày Xưa',
    genre: 'Theater / Family',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    activeEventsCount: 5,
  },
];

interface FeaturedArtistsOrganizersProps {
  onSelectArtist: (artistName: string) => void;
  onSelectOrganizer?: (organizerName: string) => void;
}

export const FeaturedArtistsOrganizers: React.FC<FeaturedArtistsOrganizersProps> = ({
  onSelectArtist,
}) => {
  return (
    <div className="my-10">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-xl bg-[#FF5A36]/10 text-[#FF5A36] flex items-center justify-center">
          <Mic2 className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold font-display text-white">Popular Artists</h3>
          <p className="text-xs text-[#8B929C]">Discover upcoming shows and concerts by top performers</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-5">
        {FEATURED_ARTISTS.map((artist) => (
          <button
            key={artist.id}
            type="button"
            onClick={() => onSelectArtist(artist.name)}
            className="flex flex-col items-center text-center p-4 rounded-2xl bg-[#090C12]/80 hover:bg-[#121622] border border-white/10 hover:border-[#FF5A36]/40 transition-all duration-200 group cursor-pointer"
          >
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-3 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#FF5A36] transition-colors shadow-lg">
              <img
                src={artist.avatarUrl}
                alt={artist.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-[#FF5A36] transition-colors line-clamp-1">
              {artist.name}
            </h4>
            <p className="text-[11px] text-[#8B929C] mt-0.5">{artist.genre}</p>
            <span className="mt-2 px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-white/5 text-[#CBD5E1] group-hover:bg-[#FF5A36]/10 group-hover:text-[#FF5A36]">
              {artist.activeEventsCount} events
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
