import { cn } from "@/lib/utils";

interface ActivityRingsProps {
  className?: string;
  progress?: [number, number, number];
}

export function ActivityRings({ className, progress = [86, 68, 78] }: ActivityRingsProps) {
  const rings = [
    { radius: 42, color: "hsl(var(--activity-move))", glow: "hsla(334, 100%, 59%, .4)", value: progress[0] },
    { radius: 31, color: "hsl(var(--activity-exercise))", glow: "hsla(78, 100%, 48%, .4)", value: progress[1] },
    { radius: 20, color: "hsl(var(--activity-stand))", glow: "hsla(263, 100%, 68%, .4)", value: progress[2] },
  ];

  return (
    <svg viewBox="0 0 100 100" className={cn("-rotate-90", className)} role="img" aria-label="نشان تصویری جیم‌آپ">
      {rings.map((ring) => {
        const circumference = 2 * Math.PI * ring.radius;
        return (
          <g key={ring.radius}>
            <circle cx="50" cy="50" r={ring.radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10 dark:text-white/10" />
            <circle
              cx="50"
              cy="50"
              r={ring.radius}
              fill="none"
              stroke={ring.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - ring.value / 100)}
              className="activity-ring"
              style={{ filter: `drop-shadow(0 0 5px ${ring.glow})` }}
            />
          </g>
        );
      })}
    </svg>
  );
}
