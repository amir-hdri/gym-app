import React from "react";
import Link from "next/link";

export interface LumiLogoProps {
  /** Size preset */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero" | "responsive";
  /** Colour role. Maps to a semantic ink token (never a hard-coded hue). */
  variant?: "white" | "dark" | "rose" | "current" | "auto";
  /** Show the WELLNESS subtitle (default: true) */
  showSubtitle?: boolean;
  /** Show the delicate horizontal divider line (default: true) */
  showDivider?: boolean;
  /** Add a subtle ambient glow behind the mark */
  glow?: boolean;
  /** Additional CSS class names for the SVG */
  className?: string;
  /** If true, wraps the logo in a Link */
  asLink?: boolean;
  /** Custom link target when asLink is true */
  href?: string;
  /** Optional accessible label */
  ariaLabel?: string;
}

/**
 * LumiLogo — the official LUMI WELLNESS wordmark.
 *
 * Renders the supplied brand design directly: "LUMI" set in Bodoni Moda, a
 * hairline divider, and "WELLNESS" set in wide-tracked Montserrat. It is an
 * **inline** SVG on purpose — the DOM resolves the `--font-bodoni` /
 * `--font-montserrat` variable faces, which an `<img src=".svg">` could not —
 * so the mark always paints in the intended faces instead of a system serif.
 *
 * Colour comes from `currentColor`, driven by a semantic ink token per variant
 * (DESIGN_SYSTEM §1 / rule #1 — no raw hues here). The ink tokens
 * `--logo-ink` / `--logo-ink-inverse` are theme-invariant: "dark" is dark ink
 * for light surfaces, "white" is light ink for dark surfaces, and "auto"
 * follows the active theme.
 */
export const LumiLogo: React.FC<LumiLogoProps> = ({
  size = "md",
  variant = "white",
  showSubtitle = true,
  showDivider = true,
  glow = false,
  className = "",
  asLink = false,
  href = "/",
  ariaLabel = "LUMI WELLNESS",
}) => {
  const colorClass =
    variant === "dark"
      ? "text-logo-ink"
      : variant === "rose"
        ? "text-primary"
        : variant === "current"
          ? "text-current"
          : variant === "auto"
            ? "text-logo-ink dark:text-logo-ink-inverse"
            : "text-logo-ink-inverse"; // "white"

  // User space is a 600×232 canvas with the wordmark centred on x=300.
  // Cropping to LUMI-only just narrows the box around the title.
  const viewBox = showSubtitle ? "40 18 520 196" : "120 18 360 124";

  const sizeClasses =
    size === "xs" ? "h-6 w-auto" :
    size === "sm" ? "h-8 w-auto" :
    size === "md" ? "h-11 w-auto" :
    size === "lg" ? "h-16 w-auto" :
    size === "xl" ? "h-20 sm:h-24 w-auto" :
    size === "hero" ? "h-24 sm:h-32 md:h-36 w-auto" :
    "w-full max-w-[240px] h-auto";

  const svg = (
    <span className={`relative inline-flex items-center justify-center ${glow ? "group" : ""}`}>
      {glow && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -m-4 rounded-full bg-gradient-to-r from-primary/25 via-brand/20 to-blush/25 opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
        />
      )}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        role="img"
        aria-label={ariaLabel}
        className={`relative z-10 ${sizeClasses} ${colorClass} ${className}`}
        fill="currentColor"
      >
        <text
          x="300"
          y="128"
          textAnchor="middle"
          style={{
            fontFamily: "var(--font-bodoni), 'Bodoni Moda', 'Didot', Georgia, serif",
            fontOpticalSizing: "auto",
            fontWeight: 600,
            fontSize: "132px",
            letterSpacing: "6px",
          }}
        >
          LUMI
        </text>
        {showSubtitle && showDivider && (
          <line
            x1="178"
            y1="156"
            x2="422"
            y2="156"
            stroke="currentColor"
            strokeOpacity={0.32}
            strokeWidth="1.6"
          />
        )}
        {showSubtitle && (
          <text
            x="300"
            y="202"
            textAnchor="middle"
            style={{
              fontFamily: "var(--font-montserrat), 'Montserrat', system-ui, sans-serif",
              fontWeight: 400,
              fontSize: "27px",
              // Tracked wide, with a matching start indent so the optical centre
              // sits true despite the trailing letter-spacing advance.
              letterSpacing: "17px",
            }}
            dx="8"
          >
            WELLNESS
          </text>
        )}
      </svg>
    </span>
  );

  if (asLink) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className="ring-focus inline-flex items-center rounded-xl outline-none transition-transform duration-200 ease-out hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        {svg}
      </Link>
    );
  }

  return svg;
};

export default LumiLogo;
