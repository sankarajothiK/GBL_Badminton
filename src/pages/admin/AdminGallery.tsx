import React, { useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { uploadImage } from '../../lib/supabase';
import { Modal } from '../../components/common/Modal';

export const AdminGallery: React.FC = () => {
  const { gallery, addGalleryItem, deleteGalleryItem } = useTournament();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'tournament' | 'auction' | 'teams' | 'matches'>('tournament');
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg(null);

    const res = await uploadImage(file, 'gallery');
    setUploading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setImageUrl(res.url);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl) {
      setErrorMsg('Image and title are required.');
      return;
    }

    await addGalleryItem({
      tournament_id: '00000000-0000-0000-0000-000000000001',
      title: title.trim(),
      category,
      image_url: imageUrl,
      caption: caption.trim(),
      sort_order: gallery.length + 1
    });

    setIsModalOpen(false);
    setTitle('');
    setCaption('');
    setImageUrl('');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-sports tracking-wide">
            MEDIA & GALLERY MANAGEMENT
          </h1>
          <p className="text-xs text-slate-400">
            Upload tournament event photos up to 10 MB with category tags and captions
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Media</span>
        </button>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {gallery.map((item) => (
          <div
            key={item.id}
            className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="aspect-[4/3] bg-gbl-navy-950 relative overflow-hidden">
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] uppercase font-bold text-gbl-orange-400 border border-white/10">
                  {item.category}
                </span>
              </div>
              <div className="p-4 space-y-1">
                <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                {item.caption && <p className="text-xs text-slate-400 line-clamp-2">{item.caption}</p>}
              </div>
            </div>

            <div className="p-4 pt-0 flex justify-end">
              <button
                onClick={() => deleteGalleryItem(item.id)}
                className="p-1.5 rounded-lg bg-gbl-navy-950 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                title="Delete image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* UPLOAD MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="UPLOAD TOURNAMENT MEDIA"
        subtitle="Supports JPG, PNG, WEBP files up to 10 MB"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Image Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grand Opening Ceremony"
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Gallery Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-2 text-white focus:outline-none"
            >
              <option value="tournament">Tournament Highlights</option>
              <option value="auction">Live Auction Floor</option>
              <option value="teams">Tournament Teams</option>
              <option value="matches">Match Clashes</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Caption / Description</label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
            />
          </div>

          {/* 10 MB File Upload */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select Photo (up to 10 MB)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gbl-navy-800 file:text-white hover:file:bg-gbl-navy-700"
            />
            {uploading && <p className="text-[10px] text-gbl-orange-400 mt-1">Uploading image...</p>}
            {imageUrl && (
              <div className="mt-2 flex items-center gap-2">
                <img src={imageUrl} alt="Uploaded preview" className="w-12 h-12 rounded-lg object-cover border border-gbl-navy-700" />
                <span className="text-emerald-400 text-[10px] font-bold">Image loaded</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gbl-navy-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-gbl-navy-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !imageUrl}
              className="px-5 py-2 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white font-bold uppercase tracking-wider disabled:opacity-40"
            >
              Save to Gallery
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
