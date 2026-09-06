import React, { useState } from 'react';
import { Image as ImageIcon, Camera, Trophy, Flame, Users, X } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';

export const GalleryPage: React.FC = () => {
  const { gallery } = useTournament();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'tournament' | 'auction' | 'teams' | 'matches'>('all');
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  // Default sample images if gallery table is initially empty
  const displayItems = gallery.length > 0 ? gallery : [
    {
      id: 'samp-1',
      tournament_id: '00000000-0000-0000-0000-000000000001',
      title: 'Grand Opening Ceremony',
      category: 'tournament' as const,
      image_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      caption: 'Lighting the official GBL tournament lamp at Chennai arena.',
      sort_order: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 'samp-2',
      tournament_id: '00000000-0000-0000-0000-000000000001',
      title: 'Auction Floor Intensity',
      category: 'auction' as const,
      image_url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
      caption: 'Team owners placing bids for Category OPEN players.',
      sort_order: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 'samp-3',
      tournament_id: '00000000-0000-0000-0000-000000000001',
      title: 'High-Impact Smash Clash',
      category: 'matches' as const,
      image_url: 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=800&q=80',
      caption: 'Thrilling 3rd set rally in the Super Doubles semi-finals.',
      sort_order: 3,
      created_at: new Date().toISOString()
    },
    {
      id: 'samp-4',
      tournament_id: '00000000-0000-0000-0000-000000000001',
      title: 'Gulf Smashers Team Lineup',
      category: 'teams' as const,
      image_url: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=800&q=80',
      caption: 'Official team squad jersey unveiling.',
      sort_order: 4,
      created_at: new Date().toISOString()
    }
  ];

  const filteredItems = displayItems.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.category === selectedFilter;
  });

  return (
    <div className="min-h-screen bg-gbl-navy-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-gbl-orange-400 uppercase tracking-wider">Tournament Media</span>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-sports uppercase tracking-tight">
            GBL PHOTO GALLERY
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Highlights from the live player auction, matches, teams, and arena moments.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex justify-center gap-2 flex-wrap">
          {(['all', 'tournament', 'auction', 'teams', 'matches'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                selectedFilter === cat
                  ? 'bg-gbl-orange-600 text-white shadow-lg shadow-gbl-orange-600/30'
                  : 'bg-gbl-navy-900 text-slate-400 hover:text-white border border-gbl-navy-800'
              }`}
            >
              {cat === 'all' ? 'All Moments' : cat}
            </button>
          ))}
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => setActiveLightboxImage(item.image_url)}
              className="group bg-gbl-navy-900 border border-gbl-navy-800 hover:border-gbl-orange-500/50 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
            >
              <div className="aspect-[4/3] bg-gbl-navy-950 overflow-hidden relative">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Click to view full size</span>
                </div>
              </div>
              <div className="p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gbl-orange-400">{item.category}</span>
                <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                {item.caption && <p className="text-xs text-slate-400 line-clamp-2">{item.caption}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {activeLightboxImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 flex items-center justify-center"
            onClick={() => setActiveLightboxImage(null)}
          >
            <div className="relative max-w-5xl w-full max-h-[90vh]">
              <button
                onClick={() => setActiveLightboxImage(null)}
                className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={activeLightboxImage}
                alt="Full size preview"
                className="max-h-[85vh] w-auto mx-auto object-contain rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
