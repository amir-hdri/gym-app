import Link from "next/link";
import { cn, formatPersianNumber } from "@/lib/utils";

export interface StatCardProps {
  /** Caption above the figure — rendered with `.meta-label`. */
  label: string;
  /** Already a display string, so a currency or ratio can be passed as-is. */
  value: string;
  /** Small unit beside the figure. `ریال`, `نفر`, `جلسه`… */
  unit?: string;
  /** Anything Latin (a Latin figure, an icon) — isolated so bidi cannot reorder it. */
  latn?: boolean;
  /** One line of context under the tile. */
  hint?: string;
  /** Turns the whole tile into a link. */
  href?: string;
  className?: string;
}

/**
 * The stat tile of DESIGN_SYSTEM §6: a `.meta-label` caption above a
 * `.stat-figure`, inside a `border-border rounded-2xl` surface.
 *
 * Deliberately *not* `components/ui/StatTile`, which is the older
 * counter-animated KPI tile (28px/bold) and does not use `.stat-figure` /
 * `.stat-unit`. This is the calm, light-numeral version §5 specifies, and it
 * lives here rather than in `components/ui` so it cannot drift across portals.
 */
export function StatCard({ label, value, unit, latn, hint, href, className }: StatCardProps) {
  const body = (
    <>
      <p className="meta-label">{label}</p>
      <p className="mt-1.5 flex flex-wrap items-baseline">
        <span className={cn("stat-figure", latn && "inline-block")} dir={latn ? "ltr" : undefined}>
          {value}
        </span>
        {unit && <span className="stat-unit">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>}
    </>
  );

  const surface = cn("rounded-2xl border border-border bg-card p-5", className);

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          surface,
          "card-hover block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={surface}>{body}</div>;
}

/**
 * Formats a plain number for a stat figure. `formatPersianNumber` is only a
 * digit transliterator, so a thousands separator does not survive it — this
 * groups first, then transliterates.
 */
export function persianFigure(value: number): string {
  return formatPersianNumber(new Intl.NumberFormat("en-US").format(value));
}
