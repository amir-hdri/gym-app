interface GymBackdropProps {
  className?: string;
}

/**
 * Twilight Meditation scenic gym backdrop — verbatim port of the reference
 * source (src/components/scenic/GymBackdrop.tsx). Dark obsidian & amber dusk
 * gradient, warm golden rim light, vector barbell silhouette, scrim overlay.
 */
export function GymBackdrop({ className = "" }: GymBackdropProps) {
  return (
    <div className={`h-full w-full select-none overflow-hidden pointer-events-none ${className}`}>
      {/* Dark Obsidian & Amber Dusk Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #12161f 0%, #1a222e 40%, #272832 70%, #3e322b 100%)",
        }}
      />

      {/* Warm Golden Rim Light */}
      <div
        className="absolute bottom-6 left-1/4 right-1/4 h-36 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 90%, rgba(210, 160, 110, 0.45) 0%, rgba(120, 100, 90, 0.1) 70%, transparent 100%)",
        }}
      />

      {/* Vector Barbell & Gym Silhouette */}
      <svg viewBox="0 0 600 360" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-65">
        <defs>
          <linearGradient id="twBarbellGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e2530" />
            <stop offset="50%" stopColor="#3d4959" />
            <stop offset="100%" stopColor="#1e2530" />
          </linearGradient>
          <linearGradient id="twPlateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2c3645" />
            <stop offset="100%" stopColor="#13171f" />
          </linearGradient>
        </defs>

        {/* Floor platform reflection line */}
        <line x1="0" y1="310" x2="600" y2="310" stroke="#d2c0a5" strokeWidth="1" strokeOpacity="0.25" />

        {/* Silhouetted Olympic Barbell on rack */}
        <rect x="70" y="170" width="16" height="130" rx="4" fill="url(#twPlateGrad)" stroke="#3a4759" strokeWidth="1" />
        <rect x="90" y="185" width="14" height="100" rx="3" fill="url(#twPlateGrad)" />
        <rect x="108" y="200" width="12" height="70" rx="2" fill="url(#twPlateGrad)" />

        {/* Main Bar */}
        <rect x="60" y="230" width="480" height="10" rx="3" fill="url(#twBarbellGrad)" />

        {/* Right plates */}
        <rect x="480" y="200" width="12" height="70" rx="2" fill="url(#twPlateGrad)" />
        <rect x="496" y="185" width="14" height="100" rx="3" fill="url(#twPlateGrad)" />
        <rect x="514" y="170" width="16" height="130" rx="4" fill="url(#twPlateGrad)" stroke="#3a4759" strokeWidth="1" />

        {/* Power rack uprights */}
        <rect x="150" y="80" width="8" height="230" fill="#141922" />
        <rect x="442" y="80" width="8" height="230" fill="#141922" />
        <line x1="150" y1="120" x2="450" y2="120" stroke="#1d2430" strokeWidth="6" />
      </svg>

      {/* Scrim Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(12, 16, 22, 0.45) 0%, rgba(12, 16, 22, 0.2) 35%, rgba(10, 13, 18, 0.88) 85%, #0a0d12 100%)",
        }}
      />
    </div>
  );
}
