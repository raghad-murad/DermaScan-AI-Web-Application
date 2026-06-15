import React from 'react';
import { Activity } from 'lucide-react';

export default function AppLogo({ size = 'md', showName = true, className = '' }) {
  const sizes = {
    sm: { icon: 'h-5 w-5', text: 'text-base' },
    md: { icon: 'h-6 w-6', text: 'text-lg' },
    lg: { icon: 'h-8 w-8', text: 'text-xl' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Activity className={`${s.icon} text-primary`} />
      </div>
      {showName && (
        <span className={`${s.text} font-heading font-medium tracking-tight`}>
          DermAI<span className="text-primary">Pro</span>
        </span>
      )}
    </div>
  );
}