import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'orange' | 'blue' | 'gold' | 'green' | 'red' | 'purple' | 'slate' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'orange',
  size = 'md',
  className = ''
}) => {
  const variantStyles = {
    orange: 'bg-gbl-orange-500/15 text-gbl-orange-400 border border-gbl-orange-500/30',
    blue: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    gold: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    green: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    red: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    slate: 'bg-slate-800/60 text-slate-300 border border-slate-700',
    outline: 'border border-slate-700 text-slate-300 bg-transparent'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded',
    md: 'text-xs px-2.5 py-1 rounded-md font-semibold tracking-wide',
    lg: 'text-sm px-3.5 py-1.5 rounded-lg font-bold tracking-wider'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 uppercase font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
};
