import { cn } from "@/lib/utils";

interface ActivityRingsProps {
  className?: string;
  progress?: [number, number, number];
}

// Ring hues come from the data-only activity tokens in globals.css
// (`--activity-move`, `--activity-exercise`, `--activity-stand`). They are
// Apple-Fitness-inspired but darkened in the light theme so each ring still
// reads against `--background`; the dark theme keeps the vivid originals.
// Change the hues there, never here.
export function ActivityRings({ className, progress = [86, 68, 78] }: ActivityRingsProps) {
  const rings = [
    { radius: 42, color: "hsl(var(--activity-move))", value: progress[0] },
    { radius: 31, color: "hsl(var(--activity-exercise))", value: progress[1] },
    { radius: 20, color: "hsl(var(--activity-stand))", value: progress[2] },
  ];

  return (
    <svg viewBox="0 0 100 100" className={cn("-rotate-90", className)} role="img" aria-label="حلقه‌های فعالیت">
      <title>حلقه‌های فعالیت</title>
      {rings.map((ring) => {
        const circumference = 2 * Math.PI * ring.radius;
        const offset = circumference * (1 - Math.max(0, Math.min(100, ring.value)) / 100);
        return (
          <g key={ring.radius}>
            {/* track */}
            <circle
              cx="50"
              cy="50"
              r={ring.radius}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="7.5"
              strokeLinecap="round"
              opacity="1"
            />
            {/* progress — solid Apple color, no glow */}
            <circle
              cx="50"
              cy="50"
              r={ring.radius}
              fill="none"
              stroke={ring.color}
              strokeWidth="7.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="activity-ring-apple"
              style={{
                // 1.2s draw — matches Apple Fitness
                transition: "stroke-dashoffset 1200ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
