import React, { useState } from 'react';
import { MapPin, Phone, Mail, Send, CheckCircle2 } from 'lucide-react';
import { useTournament } from '../../contexts/TournamentContext';

export const ContactPage: React.FC = () => {
  const { tournament } = useTournament();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gbl-navy-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-gbl-orange-400 uppercase tracking-wider">Tournament Secretariat</span>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-sports uppercase tracking-tight">
            CONTACT GBL ORGANIZERS
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Get in touch with the tournament committee regarding team registrations, auction queries, and venue directions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Contact Details Card */}
          <div className="md:col-span-5 bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <h3 className="text-lg font-bold text-white font-sports tracking-wide">ORGANIZING COMMITTEE</h3>
            
            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gbl-orange-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Official Arena Venue:</strong>
                  <p className="text-slate-400 mt-0.5">{tournament.venue}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Tournament Hotline:</strong>
                  <p className="text-slate-400 mt-0.5">{tournament.contact_phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Official Email:</strong>
                  <p className="text-slate-400 mt-0.5">{tournament.contact_email}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gbl-navy-800 text-[11px] text-slate-400">
              <p>For urgent live auction technical assistance during bidding hours, report immediately to the control console desk at Court 1.</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-7 bg-gbl-navy-900 border border-gbl-navy-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            {submitted ? (
              <div className="text-center py-12 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-xl font-bold text-white font-sports">MESSAGE DISPATCHED</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Thank you for contacting the GBL tournament secretariat. Our coordination officer will respond promptly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-4 py-2 rounded-xl bg-gbl-navy-950 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-white font-sports tracking-wide">DIRECT INQUIRY</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-gbl-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-gbl-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-gbl-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Inquiry / Message</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-gbl-navy-950 border border-gbl-navy-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-gbl-orange-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-gbl-orange-600 to-gbl-orange-500 hover:from-gbl-orange-500 hover:to-gbl-orange-400 text-white text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-gbl-orange-500/20 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmit Inquiry</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
