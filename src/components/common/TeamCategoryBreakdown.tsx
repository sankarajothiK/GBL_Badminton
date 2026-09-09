import React from 'react';
import { Player } from '../../types/database';
import { Sparkles, Users, Award, Shield } from 'lucide-react';

interface TeamCategoryBreakdownProps {
  squad: Player[];
  maxSlots?: number;
  className?: string;
  variant?: 'compact' | 'full';
}

export const TeamCategoryBreakdown: React.FC<TeamCategoryBreakdownProps> = ({
  squad,
  maxSlots = 6,
  className = '',
  variant = 'full'
}) => {
  // Normalize and group players by their primary category
  const categoryCounts = squad.reduce((acc, player) => {
    let cat = (player.auction_category || 'NON-MEDALIST').toUpperCase().replace('NON-MEDALLIST', 'NON-MEDALIST').trim();
    if (!cat) cat = 'NON-MEDALIST';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const openCount = categoryCounts['OPEN'] || 0;
  const age35Count = categoryCounts['35+ AGE'] || categoryCounts['35+'] || 0;
  const nonMedalCount = categoryCounts['NON-MEDALIST'] || 0;
  const totalCount = squad.length;

  // Other custom categories if any exist
  const standardCats = new Set(['OPEN', '35+ AGE', '35+', 'NON-MEDALIST']);
  const customCats = Object.entries(categoryCounts).filter(([k]) => !standardCats.has(k));

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center gap-2 text-[11px] ${className}`}>
        <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
          OPEN: {openCount}
        </span>
        <span className="px-2 py-0.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold">
          35+: {age35Count}
        </span>
        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
          NON-MEDALIST: {nonMedalCount}
        </span>
        {customCats.map(([cat, count]) => (
          <span key={cat} className="px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
            {cat}: {count}
          </span>
        ))}
        <span className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/20 text-white font-mono font-black">
          TOTAL: {totalCount}/{maxSlots}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-gbl-navy-950/90 border border-gbl-navy-800 rounded-2xl p-4 space-y-3 ${className}`}>
      <div className="flex justify-between items-center pb-2 border-b border-gbl-navy-800/80">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Category-Wise Composition</span>
        </h4>
        <span className="text-xs font-mono font-bold text-slate-400">
          <strong className="text-white">{totalCount}</strong> / {maxSlots} Slots Filled
        </span>
      </div>

      {/* Category Pills Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* OPEN Category */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-center">
          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
            OPEN
          </span>
          <span className="text-lg font-black text-white font-mono mt-0.5 block">
            {openCount}
          </span>
          <span className="text-[9px] text-slate-400">
            {openCount === 1 ? '1 Player' : `${openCount} Players`}
          </span>
        </div>

        {/* 35+ AGE Category */}
        <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-2.5 text-center">
          <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider block">
            35+ AGE
          </span>
          <span className="text-lg font-black text-white font-mono mt-0.5 block">
            {age35Count}
          </span>
          <span className="text-[9px] text-slate-400">
            {age35Count === 1 ? '1 Player' : `${age35Count} Players`}
          </span>
        </div>

        {/* NON-MEDALIST Category */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 text-center">
          <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
            NON-MEDALIST
          </span>
          <span className="text-lg font-black text-white font-mono mt-0.5 block">
            {nonMedalCount}
          </span>
          <span className="text-[9px] text-slate-400">
            {nonMedalCount === 1 ? '1 Player' : `${nonMedalCount} Players`}
          </span>
        </div>

        {/* TOTAL SQUAD */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
            TOTAL SQUAD
          </span>
          <span className="text-lg font-black text-white font-mono mt-0.5 block">
            {totalCount} / {maxSlots}
          </span>
          <span className="text-[9px] text-emerald-400 font-semibold">
            {maxSlots - totalCount === 0 ? 'Squad Full' : `${maxSlots - totalCount} Slots Open`}
          </span>
        </div>
      </div>

      {/* Any Custom Categories */}
      {customCats.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {customCats.map(([cat, count]) => (
            <span key={cat} className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
              {cat}: {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
