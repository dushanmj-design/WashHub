import React, { useState } from 'react';

interface LaundroPosLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'badge' | 'full';
  className?: string;
  showText?: boolean;
}

export default function LaundroPosLogo({ 
  size = 'md', 
  variant = 'badge',
  className = '', 
  showText = false 
}: LaundroPosLogoProps) {
  const [imageError, setImageError] = useState(false);

  // If full variant is requested (as on the login page)
  if (variant === 'full' || size === 'full') {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <img
          src="/logo.svg"
          alt="LaundroPOS by Navya Ventures"
          className="w-52 max-w-full h-auto object-contain select-none transition-transform hover:scale-102"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Dimension mapping for square badge
  const sizeMap = {
    sm: { box: 'w-8 h-8', font: 'text-sm' },
    md: { box: 'w-12 h-12', font: 'text-lg' },
    lg: { box: 'w-16 h-16', font: 'text-2xl' },
    xl: { box: 'w-24 h-24', font: 'text-3xl' },
    full: { box: 'w-48 h-48', font: 'text-4xl' },
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Official Squircle Badge */}
      {!imageError ? (
        <img
          src="/logo-badge.svg"
          alt="LaundroPOS Badge"
          className={`${dim.box} object-contain rounded-2xl shadow-sm`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={`${dim.box} shrink-0`}>
          <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-sm" fill="none">
            <defs>
              <clipPath id="lposFallbackClip">
                <circle cx="110" cy="110" r="66" />
              </clipPath>
            </defs>
            <rect x="0" y="0" width="220" height="220" rx="58" fill="#0d2639" />
            <circle cx="48" cy="34" r="7.5" fill="#24bcd7" />
            <circle cx="73" cy="34" r="7.5" fill="#f59e0b" />
            <rect x="134" y="27" width="54" height="15" rx="7.5" fill="#173b54" />
            <circle cx="110" cy="110" r="66" fill="#0a1f2e" />
            <g clipPath="url(#lposFallbackClip)">
              <circle cx="72" cy="74" r="3.2" fill="#ffffff" />
              <circle cx="90" cy="88" r="7.2" stroke="#ffffff" strokeWidth="2.2" fill="none" />
              <circle cx="127" cy="80" r="5" stroke="#ffffff" strokeWidth="2" fill="none" />
              <path d="M 35 122 C 55 98 85 146 115 128 C 135 116 155 128 185 122 L 185 185 L 35 185 Z" fill="#30c6e0" />
              <path d="M 35 138 C 60 120 88 156 120 142 C 145 130 165 142 185 138 L 185 185 L 35 185 Z" fill="#1491ab" />
            </g>
            <circle cx="110" cy="110" r="66" stroke="#24bcd7" strokeWidth="9.5" fill="none" />
            <rect x="78" y="194" width="26" height="5.5" rx="2.75" fill="#24bcd7" />
            <rect x="116" y="194" width="26" height="5.5" rx="2.75" fill="#24bcd7" />
          </svg>
        </div>
      )}

      {showText && (
        <div className="flex flex-col text-left">
          <div className={`font-black tracking-tight leading-none text-white ${dim.font}`}>
            Laundro<span className="text-cyan-400">POS</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
            by Navya Ventures
          </span>
        </div>
      )}
    </div>
  );
}
