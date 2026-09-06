import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle, Image } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';
import { PhoneInput } from '../../components/common/PhoneInput';
import { uploadImage } from '../../lib/supabase';

export const AdminTournament: React.FC = () => {
  const { tournament, updateTournament } = useTournament();

  const [name, setName] = useState(tournament.name);
  const [shortName, setShortName] = useState(tournament.short_name);
  const [season, setSeason] = useState(tournament.season);
  const [logoUrl, setLogoUrl] = useState(tournament.logo_url || '/gbl-logo.png');
  const [bannerUrl, setBannerUrl] = useState(tournament.banner_url || '');
  const [venue, setVenue] = useState(tournament.venue);
  const [tournamentDates, setTournamentDates] = useState(tournament.tournament_dates);
  const [auctionDate, setAuctionDate] = useState(tournament.auction_date);
  const [auctionTime, setAuctionTime] = useState(tournament.auction_time);
  const [registrationDates, setRegistrationDates] = useState(tournament.registration_dates);
  const [organizerName, setOrganizerName] = useState(tournament.organizer_name);
  const [sponsorInfo, setSponsorInfo] = useState(tournament.sponsor_info);
  const [contactPhone, setContactPhone] = useState(tournament.contact_phone);
  const [contactEmail, setContactEmail] = useState(tournament.contact_email);
  const [socialInstagram, setSocialInstagram] = useState(tournament.social_instagram);
  const [socialFacebook, setSocialFacebook] = useState(tournament.social_facebook);
  const [socialYoutube, setSocialYoutube] = useState(tournament.social_youtube);
  const [description, setDescription] = useState(tournament.description);
  const [uploading, setUploading] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await uploadImage(file, 'tournament');
    setUploading(false);
    if (res.url) {
      setLogoUrl(res.url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateTournament({
      name,
      short_name: shortName,
      season,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      venue,
      tournament_dates: tournamentDates,
      auction_date: auctionDate,
      auction_time: auctionTime,
      registration_dates: registrationDates,
      organizer_name: organizerName,
      sponsor_info: sponsorInfo,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      social_instagram: socialInstagram,
      social_facebook: socialFacebook,
      social_youtube: socialYoutube,
      description
    });
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white font-sports tracking-wide">TOURNAMENT INFORMATION</h1>
          <p className="text-xs text-slate-400">Configure global tournament branding, dates, venue, and organizer details</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-950/50 border border-emerald-500/50 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Tournament information updated successfully.</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Brand Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-gbl-navy-800">
            Tournament Brand & Season
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Official Tournament Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Season Identifier</label>
              <input
                type="text"
                required
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-slate-300 font-semibold mb-1">Tournament Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
            />
          </div>

          {/* Tournament Logo & Banner Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tournament Logo (Emblem)</label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gbl-navy-800 file:text-white hover:file:bg-gbl-navy-700 cursor-pointer"
                />
                <input
                  type="url"
                  placeholder="Or image URL (e.g. /gbl-logo.png)"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value.trim())}
                  className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-gbl-orange-500 focus:outline-none"
                />
                {logoUrl && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-gbl-navy-950 border border-gbl-navy-800">
                    <img src={logoUrl} alt="Tournament Logo" className="w-10 h-10 object-contain rounded-lg bg-slate-900 border border-gbl-navy-700 p-0.5" />
                    <span className="text-[10px] text-emerald-400 font-semibold">Active Tournament Logo</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tournament Hero Banner URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value.trim())}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
              {bannerUrl && (
                <div className="mt-2 rounded-xl overflow-hidden border border-gbl-navy-800 h-14">
                  <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dates & Venue */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-gbl-navy-800">
            Dates & Arena Location
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Venue Address</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tournament Playing Dates</label>
              <input
                type="text"
                value={tournamentDates}
                onChange={(e) => setTournamentDates(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Live Auction Date</label>
              <input
                type="text"
                value={auctionDate}
                onChange={(e) => setAuctionDate(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Live Auction Time</label>
              <input
                type="text"
                value={auctionTime}
                onChange={(e) => setAuctionTime(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Organizer & Sponsorship */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-gbl-navy-800">
            Secretariat & Sponsorship
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Organizer Entity</label>
              <input
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Official Title Sponsor</label>
              <input
                type="text"
                value={sponsorInfo}
                onChange={(e) => setSponsorInfo(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <PhoneInput
                value={contactPhone}
                onChange={(fullVal) => setContactPhone(fullVal)}
                label="Contact Phone Number (10 Digits)"
                variant="dark"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contact Email Address</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-gbl-navy-800">
            Social Channels
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Instagram URL</label>
              <input
                type="text"
                value={socialInstagram}
                onChange={(e) => setSocialInstagram(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Facebook URL</label>
              <input
                type="text"
                value={socialFacebook}
                onChange={(e) => setSocialFacebook(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">YouTube URL</label>
              <input
                type="text"
                value={socialYoutube}
                onChange={(e) => setSocialYoutube(e.target.value)}
                className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-white focus:border-gbl-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gbl-navy-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-gbl-orange-600 hover:bg-gbl-orange-500 text-white font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-gbl-orange-600/30 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Tournament Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
