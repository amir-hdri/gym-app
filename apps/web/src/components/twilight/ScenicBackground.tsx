import React from 'react';

interface Props {
  className?: string;
}

/**
 * Scenic layered mountain ridges background with warm twilight dusk horizon glow.
 * Verbatim port from Twilight Meditation source.
 */
export const ScenicBackground: React.FC<Props> = ({ className = '' }) => {
  return (
    <div className={`relative w-full h-full overflow-hidden select-none pointer-events-none ${className}`}>
      {/* Twilight Sky Gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #1b2432 0%, #253348 35%, #3c495e 60%, #5d535b 80%, #7d655a 100%)'
        }}
      />

      {/* Warm Twilight Horizon Glow */}
      <div 
        className="absolute bottom-12 left-0 right-0 h-40 opacity-70"
        style={{
          background: 'radial-gradient(ellipse 90% 60% at 50% 100%, rgba(220, 160, 120, 0.45) 0%, rgba(140, 120, 140, 0.2) 60%, transparent 100%)'
        }}
      />

      {/* Layered Mountain Ridges SVG */}
      <svg 
        viewBox="0 0 600 400" 
        preserveAspectRatio="none" 
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient id="twMist1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="twMountainRidgeRear" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#434e62" />
            <stop offset="100%" stopColor="#2c3647" />
          </linearGradient>
          <linearGradient id="twMountainRidgeMid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2c3647" />
            <stop offset="100%" stopColor="#1a2230" />
          </linearGradient>
          <linearGradient id="twMountainRidgeFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#18202d" />
            <stop offset="100%" stopColor="#0e131c" />
          </linearGradient>
        </defs>

        {/* Far Ridge */}
        <path 
          d="M0 240 Q 80 200, 170 225 T 350 215 T 480 230 Q 540 210, 600 235 L 600 400 L 0 400 Z" 
          fill="url(#twMountainRidgeRear)" 
          opacity="0.75"
        />

        {/* Soft atmospheric mist layer */}
        <rect x="0" y="210" width="600" height="40" fill="url(#twMist1)" />

        {/* Middle Ridge */}
        <path 
          d="M0 270 Q 110 235, 230 265 T 420 250 T 560 275 L 600 280 L 600 400 L 0 400 Z" 
          fill="url(#twMountainRidgeMid)" 
          opacity="0.9"
        />

        {/* Foreground Ridge */}
        <path 
          d="M0 310 Q 150 280, 290 320 T 470 295 T 600 330 L 600 400 L 0 400 Z" 
          fill="url(#twMountainRidgeFront)" 
        />
      </svg>

      {/* Atmospheric Fog Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(16, 21, 30, 0.4) 0%, rgba(16, 21, 30, 0.1) 40%, rgba(14, 18, 25, 0.85) 85%, #0e131c 100%)'
        }}
      />
    </div>
  );
};
