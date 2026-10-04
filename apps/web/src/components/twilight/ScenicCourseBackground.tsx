import React from 'react';

interface Props {
  className?: string;
  theme?: 'dusk' | 'dawn' | 'night' | 'amber';
}

/**
 * Scenic course background card art with soft gradient and geometric sun/moon motifs.
 * Ported from Twilight Meditation source.
 */
export const ScenicCourseBackground: React.FC<Props> = ({ className = '', theme = 'dusk' }) => {
  const getGradient = () => {
    switch (theme) {
      case 'amber':
        return 'linear-gradient(135deg, #2c1a14 0%, #3d261e 40%, #543729 70%, #704732 100%)';
      case 'dawn':
        return 'linear-gradient(135deg, #182230 0%, #28374d 40%, #4a4a58 70%, #6d5452 100%)';
      case 'night':
        return 'linear-gradient(135deg, #0d1117 0%, #161d26 40%, #1f2a38 70%, #2b394d 100%)';
      case 'dusk':
      default:
        return 'linear-gradient(135deg, #181d26 0%, #252d3d 40%, #363645 70%, #524346 100%)';
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden select-none pointer-events-none rounded-[inherit] ${className}`}>
      <div 
        className="absolute inset-0"
        style={{ background: getGradient() }}
      />
      
      {/* Radiant celestial glow */}
      <div 
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-40 blur-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(210, 192, 165, 0.4) 0%, rgba(255, 90, 31, 0.2) 50%, transparent 100%)'
        }}
      />

      {/* Subtle geometric horizon arches */}
      <svg 
        viewBox="0 0 400 240" 
        preserveAspectRatio="none" 
        className="absolute inset-0 w-full h-full opacity-35"
      >
        <circle cx="200" cy="320" r="180" fill="none" stroke="#d2c0a5" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="200" cy="320" r="130" fill="none" stroke="#d2c0a5" strokeWidth="1" />
        <circle cx="200" cy="320" r="80" fill="none" stroke="#d2c0a5" strokeWidth="1" strokeDasharray="2 2" />
      </svg>

      {/* Ambient vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(16, 20, 26, 0.2) 0%, rgba(16, 20, 26, 0.7) 80%, #10141a 100%)'
        }}
      />
    </div>
  );
};
