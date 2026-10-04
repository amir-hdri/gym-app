/**
 * Twilight Meditation bottom-dock icons — verbatim port of the custom SVGs in
 * the reference source (src/components/GymBottomNavBar.tsx). 24x24 viewBox,
 * 1.6 stroke, round caps/joins. Each takes `isActive` to switch fill treatment.
 */

interface IconProps {
  className?: string;
  isActive?: boolean;
}

/** 1. Home Dashboard Icon: clean geometric house with archway */
export function HomeNavIcon({ className = "", isActive = false }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path
        d="M3.75 10.5 12 3.75l8.25 6.75v9a1.75 1.75 0 0 1-1.75 1.75H5.5a1.75 1.75 0 0 1-1.75-1.75v-9Z"
        fill={isActive ? "currentColor" : "none"}
      />
      <path
        d="M9.5 21.25v-6.75a1.25 1.25 0 0 1 1.25-1.25h2.5a1.25 1.25 0 0 1 1.25 1.25v6.75"
        fill={isActive ? "#11141a" : "none"}
        stroke={isActive ? "#11141a" : "currentColor"}
      />
    </svg>
  );
}

/** 2. Gym Workouts Icon: professional Olympic barbell */
export function WorkoutNavIcon({ className = "", isActive = false }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Central Bar Grip */}
      <line x1="8.5" y1="12" x2="15.5" y2="12" strokeWidth="2.4" />
      {/* Left Outer Collar Pin */}
      <line x1="2" y1="12" x2="3.5" y2="12" />
      {/* Left Outer Weight Plate */}
      <rect x="3.5" y="8" width="1.8" height="8" rx="0.75" fill={isActive ? "currentColor" : "none"} />
      {/* Left Inner Main Plate */}
      <rect x="6.5" y="5.5" width="2" height="13" rx="0.9" fill={isActive ? "currentColor" : "none"} />
      {/* Right Inner Main Plate */}
      <rect x="15.5" y="5.5" width="2" height="13" rx="0.9" fill={isActive ? "currentColor" : "none"} />
      {/* Right Outer Weight Plate */}
      <rect x="18.7" y="8" width="1.8" height="8" rx="0.75" fill={isActive ? "currentColor" : "none"} />
      {/* Right Outer Collar Pin */}
      <line x1="20.5" y1="12" x2="22" y2="12" />
    </svg>
  );
}

/** 3. Gym Access Gate & Scanner Pass Icon */
export function CheckinNavIcon({ className = "", isActive = false }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8" />
      <path d="M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8" />
      <path d="M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16" />
      <path d="M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <rect x="8.5" y="8.5" width="7" height="7" rx="1.5" fill={isActive ? "currentColor" : "none"} />
      <circle cx="12" cy="12" r="1.25" fill={isActive ? "#11141a" : "currentColor"} />
    </svg>
  );
}

/** 4. Overload Progress & Strength Metrics Chart */
export function ProgressNavIcon({ className = "", isActive = false }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3.75 4.5v15.25a.75.75 0 0 0 .75.75H20.25" />
      <path d="m7.25 15.25 4-4.5 3 2.5 5.5-6.75" strokeWidth={isActive ? "1.9" : "1.6"} />
      <path d="M15.75 6.5h4v4" />
    </svg>
  );
}

/** 5. Athlete Profile Icon: clean ergonomic silhouette */
export function AthleteNavIcon({ className = "", isActive = false }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={isActive ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="7.75" r="3.75" />
      <path d="M4.5 20.25a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}
