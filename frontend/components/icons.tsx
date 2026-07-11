/**
 * Streamline Core Line–style icon system
 * Stroke-based, 24×24 viewBox, 1.5px stroke, rounded caps & joins.
 * All paths are original geometric constructions matching the Streamline
 * Core Line aesthetic (https://streamlinehq.com/icons/core-line-free).
 */
import { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function mk(children: React.ReactNode) {
  return function Icon({ size = 24, className, style, ...rest }: P) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
        aria-hidden="true"
        {...rest}
      >
        {children}
      </svg>
    );
  };
}

/* ── Navigation ──────────────────────────────────────────────────────────── */

/** Raindrop – Hydration tab */
export const IconDroplet = mk(
  <path d="M12 21a7 7 0 0 0 7-7c0-5-7-13-7-13S5 9 5 14a7 7 0 0 0 7 7Z" />
);

/** Fork + knife – Diet / Nutrition tab */
export const IconUtensils = mk(
  <>
    <path d="M3 2v7c0 1.1.9 2 2 2s2-.9 2-2V2" />
    <line x1="5" y1="9" x2="5" y2="22" />
    <line x1="3" y1="5" x2="7" y2="5" />
    <path d="M19 3a3 3 0 0 1 2 2.82V9h-4V5.82A3 3 0 0 1 19 3Z" />
    <line x1="19" y1="9" x2="19" y2="22" />
  </>
);

/** Dumbbell – Exercise / Training tab */
export const IconDumbbell = mk(
  <>
    <rect x="2" y="11" width="3" height="2" rx="0.75" />
    <rect x="5" y="9" width="2.5" height="6" rx="0.75" />
    <line x1="7.5" y1="12" x2="16.5" y2="12" />
    <rect x="16.5" y="9" width="2.5" height="6" rx="0.75" />
    <rect x="19" y="11" width="3" height="2" rx="0.75" />
  </>
);

/** Scales of justice – Weight tab */
export const IconScale = mk(
  <>
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="3" y1="21" x2="21" y2="21" />
    <path d="M5 21V9l7-6 7 6v12" />
    <rect x="9" y="14" width="6" height="7" rx="0.5" />
  </>
);

/** Flame – Streak tab */
export const IconFlame = mk(
  <path d="M12 22c3 0 6-2.5 6-6.5 0-3-1.5-5-3-7-1 2-2.5 3-3 5-.5-2-1-3.5-1-5.5-1.5 2-3 4.5-3 7.5C8 19.5 9 22 12 22Z" />
);

/** Bar chart – Summary / Stats tab */
export const IconBarChart = mk(
  <>
    <line x1="18" y1="20" x2="18" y2="9" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6"  y1="20" x2="6"  y2="13" />
    <line x1="3"  y1="20" x2="21" y2="20" />
  </>
);

/* ── Theme / Settings ────────────────────────────────────────────────────── */

/** Sun – Light mode */
export const IconSun = mk(
  <>
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2"  x2="12" y2="4"  />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="2"  y1="12" x2="4"  y2="12" />
    <line x1="20" y1="12" x2="22" y2="12" />
    <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"  />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
    <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
  </>
);

/** Moon – Dark mode */
export const IconMoon = mk(
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
);

/* ── Actions ─────────────────────────────────────────────────────────────── */

/** Sparkle / AI */
export const IconSparkle = mk(
  <>
    <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
  </>
);

/** Brain – AI coach */
export const IconBrain = mk(
  <>
    <path d="M12 5a7 7 0 0 1 7 7 5 5 0 0 1-5 5H10a5 5 0 0 1-5-5 7 7 0 0 1 7-7Z" />
    <path d="M12 5V3" />
    <path d="M9 7.5C7.5 7.5 6 9 6 10.5" />
    <path d="M15 7.5C16.5 7.5 18 9 18 10.5" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </>
);

/** Lightning bolt – calories / energy */
export const IconZap = mk(
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
);

/** Heart – cardio */
export const IconHeart = mk(
  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
);

/** Timer / clock */
export const IconTimer = mk(
  <>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15 15" />
    <line x1="9" y1="3" x2="15" y2="3" />
  </>
);

/** Target – goal */
export const IconTarget = mk(
  <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </>
);

/** Person / user */
export const IconUser = mk(
  <>
    <circle cx="12" cy="7" r="4" />
    <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
  </>
);

/** Log out arrow */
export const IconLogOut = mk(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </>
);

/** Trending up */
export const IconTrendingUp = mk(
  <>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </>
);

/** Trending down */
export const IconTrendingDown = mk(
  <>
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </>
);

/** Minus – stable trend / remove */
export const IconMinus = mk(
  <line x1="5" y1="12" x2="19" y2="12" />
);

/** Plus – add */
export const IconPlus = mk(
  <>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </>
);

/** Check – done / complete */
export const IconCheck = mk(
  <polyline points="20 6 9 17 4 12" />
);

/** Close / X */
export const IconX = mk(
  <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>
);

/** Trash – delete */
export const IconTrash = mk(
  <>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </>
);

/** Pencil – edit */
export const IconEdit = mk(
  <>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
  </>
);

/** Floppy disk – save */
export const IconSave = mk(
  <>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </>
);

/** Chevron left */
export const IconChevronLeft = mk(
  <polyline points="15 18 9 12 15 6" />
);

/** Chevron right */
export const IconChevronRight = mk(
  <polyline points="9 18 15 12 9 6" />
);

/** Chevron down */
export const IconChevronDown = mk(
  <polyline points="6 9 12 15 18 9" />
);

/** Spinner – loading */
export const IconSpinner = mk(
  <path d="M21 12a9 9 0 1 1-6.22-8.56" />
);

/* ── Content / metrics ───────────────────────────────────────────────────── */

/** Water glass */
export const IconGlass = mk(
  <>
    <path d="M5 3h14l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 3Z" />
    <line x1="8" y1="10" x2="16" y2="10" />
  </>
);

/** Bottle */
export const IconBottle = mk(
  <>
    <path d="M9 3h6M8 3c0 0-1 2-1 4v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7c0-2-1-4-1-4" />
    <line x1="8" y1="11" x2="16" y2="11" />
  </>
);

/** Download / export */
export const IconDownload = mk(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </>
);

/** File – CSV / document */
export const IconFile = mk(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </>
);

/** JSON / brackets */
export const IconBraces = mk(
  <>
    <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
    <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" />
  </>
);

/** Running man – cardio */
export const IconRun = mk(
  <>
    <circle cx="16" cy="4" r="1.5" />
    <path d="M10 9l2-3 4 2-2 4-3 1-2 5H7M14 8l3 1 2-2" />
    <path d="M9 21l2-5" />
  </>
);

/** Shield check – privacy */
export const IconShield = mk(
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <polyline points="9 12 11 14 15 10" />
  </>
);

/** Water jug / pitcher – 1L quick-add */
export const IconJug = mk(
  <>
    <path d="M7 3h10v2l1 2v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7l1-2V3Z" />
    <path d="M17 7h2a2 2 0 0 1 0 4h-2" />
    <line x1="9" y1="11" x2="15" y2="11" />
  </>
);

/** Sunrise – breakfast */
export const IconSunrise = mk(
  <>
    <path d="M12 2v2M4.93 4.93 6.35 6.35M2 12h2M19.07 4.93l-1.42 1.42M22 12h-2" />
    <path d="M5 17a7 7 0 0 1 14 0" />
    <line x1="3" y1="20" x2="21" y2="20" />
  </>
);

/** Coffee cup – snack */
export const IconCoffee = mk(
  <>
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="2" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </>
);

/** Daily log / clipboard list – Today tab */
export const IconToday = mk(
  <>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="12" y2="16" />
  </>
);

/** Apple / food */
export const IconApple = mk(
  <>
    <path d="M12 20.94c1.5.05 3.09-.96 4.07-1.94a12.08 12.08 0 0 0 2.91-8c-.13-5.11-3.91-8-7.98-8S5.1 6.89 5 12c-.06 3.09 1.02 5.88 2.91 7 .99.98 2.58 1.99 4.09 1.94Z" />
    <path d="M12 7V3" />
    <path d="M14 5c.5-1.5 2-2 2-2" />
  </>
);
