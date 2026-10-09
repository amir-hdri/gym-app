"use client";

import React from "react";

interface Props {
  className?: string;
}

/**
 * Twilight ridge artwork.
 *
 * Purely decorative — it carries no information, so it is hidden from
 * assistive tech here rather than at each call site (three of the four
 * callers remembered to wrap it; the landing page did not).
 *
 * The gradient/clip `id`s are derived from `useId()` instead of hardcoded:
 * they are document-global, and two instances on one page would otherwise
 * silently resolve every `url(#…)` to the first one's definitions.
 *
 * `useId()` output is sanitised to `[A-Za-z0-9]`: React's ids contain colons,
 * and a colon inside an SVG `url(#…)` reference is a selector, not a name.
 */
export const ScenicBackground: React.FC<Props> = ({ className = "" }) => {
  const uid = React.useId().replace(/[^A-Za-z0-9]/g, "");
  const id = (name: string) => `${name}-${uid}`;

  const mist = id("scenic-mist");
  const ridgeRear = id("scenic-ridge-rear");
  const ridgeMid = id("scenic-ridge-mid");
  const ridgeFront = id("scenic-ridge-front");

  return (
    <div
      aria-hidden="true"
      className={`relative h-full w-full overflow-hidden select-none pointer-events-none ${className}`}
    >
      {/* Twilight Sky Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #1b2432 0%, #253348 35%, #3c495e 60%, #5d535b 80%, #7d655a 100%)",
        }}
      />

      {/* Warm Twilight Horizon Glow */}
      <div
        className="absolute bottom-12 left-0 right-0 h-40 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 100%, rgba(220, 160, 120, 0.45) 0%, rgba(140, 120, 140, 0.2) 60%, transparent 100%)",
        }}
      />

      {/* Layered Mountain Ridges SVG */}
      <svg
        viewBox="0 0 600 400"
        preserveAspectRatio="none"
        focusable="false"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id={mist} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id={ridgeRear} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#434e62" />
            <stop offset="100%" stopColor="#2c3647" />
          </linearGradient>
          <linearGradient id={ridgeMid} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2c3647" />
            <stop offset="100%" stopColor="#1a2230" />
          </linearGradient>
          <linearGradient id={ridgeFront} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#18202d" />
            <stop offset="100%" stopColor="#0e131c" />
          </linearGradient>
        </defs>

        {/* Far Ridge */}
        <path
          d="M0 240 Q 80 200, 170 225 T 350 215 T 480 230 Q 540 210, 600 235 L 600 400 L 0 400 Z"
          fill={`url(#${ridgeRear})`}
          opacity="0.75"
        />

        {/* Soft atmospheric mist layer */}
        <rect x="0" y="210" width="600" height="40" fill={`url(#${mist})`} />

        {/* Middle Ridge */}
        <path
          d="M0 270 Q 110 235, 230 265 T 420 250 T 560 275 L 600 280 L 600 400 L 0 400 Z"
          fill={`url(#${ridgeMid})`}
          opacity="0.9"
        />

        {/* Foreground Ridge */}
        <path
          d="M0 310 Q 150 280, 290 320 T 470 295 T 600 330 L 600 400 L 0 400 Z"
          fill={`url(#${ridgeFront})`}
        />
      </svg>

      {/* Atmospheric Fog Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(16, 21, 30, 0.4) 0%, rgba(16, 21, 30, 0.1) 40%, rgba(14, 18, 25, 0.85) 85%, #0e131c 100%)",
        }}
      />
    </div>
  );
};