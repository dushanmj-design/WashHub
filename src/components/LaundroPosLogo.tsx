import React, { useState } from 'react';

interface LaundroPosLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export default function LaundroPosLogo({ size = 'md', className = '', showText = false }: LaundroPosLogoProps) {
  const [imageError, setImageError] = useState(false);

  // Dimension mapping
  const sizeMap = {
    sm: { box: 'w-8 h-8', svg: 32, font: 'text-sm' },
    md: { box: 'w-14 h-14', svg: 56, font: 'text-xl' },
    lg: { box: 'w-20 h-20', svg: 80, font: 'text-2xl' },
    xl: { box: 'w-24 h-24', svg: 96, font: 'text-3xl' },
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Official Logo Badge */}
      {!imageError ? (
        <img
          src="/logo.svg"
          alt="LaundroPOS Official Logo"
          className={`${dim.box} object-contain rounded-2xl shadow-md`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={`${dim.box} shrink-0`}>
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md" fill="none">
            <defs>
              <linearGradient id="lposBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="lposWhite" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#e0f2fe" />
              </linearGradient>
            </defs>
            <rect x="6" y="6" width="108" height="108" rx="28" fill="url(#lposBg)" />
            <circle cx="60" cy="60" r="38" stroke="url(#lposWhite)" strokeWidth="4.5" fill="#0f172a" fillOpacity="0.2" />
            <circle cx="60" cy="60" r="28" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="4 2" strokeOpacity="0.6" />
            <path
              d="M 46 68 C 42 56 50 46 62 46 C 74 46 78 54 74 62 C 70 70 58 72 52 64 C 48 58 52 52 58 52"
              stroke="url(#lposWhite)"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="75" cy="42" r="5" fill="#ffffff" fillOpacity="0.95" />
            <circle cx="43" cy="46" r="3.5" fill="#38bdf8" fillOpacity="0.9" />
            <circle cx="74" cy="74" r="3" fill="#ffffff" fillOpacity="0.9" />
            <path d="M 86 30 Q 86 36 92 36 Q 86 36 86 42 Q 86 36 80 36 Q 86 36 86 30 Z" fill="#facc15" />
          </svg>
        </div>
      )}

      {showText && (
        <div className="flex flex-col text-left">
          <div className={`font-black tracking-tight leading-none text-white ${dim.font}`}>
            Laundro<span className="text-cyan-400">POS</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
            Laundry & Dry Cleaning
          </span>
        </div>
      )}
    </div>
  );
}
