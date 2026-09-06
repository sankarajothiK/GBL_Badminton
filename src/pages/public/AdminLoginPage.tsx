import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to /admin
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/admin');
    } else {
      setErrorMsg(res.error || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#edf0eb] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Emblem */}
        <div className="flex justify-center mb-2">
          <img 
            src="/gbl-logo.png" 
            alt="GBL Official Logo" 
            className="w-20 h-20 rounded-2xl object-contain bg-[#122023] border-2 border-amber-500/40 p-1 shadow-2xl" 
          />
        </div>

        <h2 className="mt-3 text-3xl font-black text-slate-950 tracking-[-0.05em] uppercase">
          GBL Admin Command
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-semibold">
          Authorized tournament directors, auctioneers, and technical staff only
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-slate-200 py-8 px-6 sm:px-10 rounded-2xl shadow-sm space-y-6 text-left">
          
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@gulfoil.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-950 focus:border-slate-900 focus:outline-none placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-950 focus:border-slate-900 focus:outline-none placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-lime-300 hover:bg-lime-200 text-lime-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Command Room'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-3 border-t border-slate-100">
            <Link to="/" className="text-xs font-bold text-slate-500 hover:text-slate-950 transition-colors">
              ← Return to Tournament Arena
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
