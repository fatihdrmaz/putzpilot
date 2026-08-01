// Tek stil (2px stroke, Lucide tarzı) inline SVG ikon seti — emoji ikon kullanılmaz.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...props }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 13l4 4L19 7" />
  </svg>
);
export const IconCheckCircle = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </svg>
);
export const IconStar = (p: P) => (
  <svg {...base({ ...p, fill: "currentColor", stroke: "none" })}>
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9 2.9-6z" />
  </svg>
);
export const IconMapPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-7-5.5-7-11a7 7 0 1114 0c0 5.5-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);
export const IconEuro = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 6.5A7.5 7.5 0 007 12a7.5 7.5 0 0011 5.5" />
    <path d="M4 10.5h9M4 13.5h8" />
  </svg>
);
export const IconHome = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h5v-6h4v6h5V10" />
  </svg>
);
export const IconBriefcase = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18" />
  </svg>
);
export const IconWallet = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <path d="M3 10h18M16 15h2" />
  </svg>
);
export const IconUser = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5" />
  </svg>
);
export const IconChevronRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const IconChevronLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);
export const IconSparkle = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
  </svg>
);
export const IconCamera = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8h3l2-2h6l2 2h3v12H4V8z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);
export const IconPaw = (p: P) => (
  <svg {...base(p)}>
    <circle cx="7" cy="9" r="1.8" />
    <circle cx="12" cy="6.5" r="1.8" />
    <circle cx="17" cy="9" r="1.8" />
    <path d="M12 11c-3 0-5.5 2.5-5.5 5 0 1.5 1 2.5 2.5 2.5 1 0 2-.5 3-.5s2 .5 3 .5c1.5 0 2.5-1 2.5-2.5 0-2.5-2.5-5-5.5-5z" />
  </svg>
);
export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);
export const IconCard = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
    <path d="M2.5 10h19" />
  </svg>
);
export const IconWhatsApp = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.7-1.2A9 9 0 1012 3z" />
    <path d="M8.8 9.2c.3-.8.9-.8 1.2-.2l.6 1.1c.2.4 0 .8-.3 1.1-.3.3-.3.6 0 1a5.5 5.5 0 002.5 2.2c.4.2.7.1.9-.2.3-.4.6-.6 1-.4l1.2.6c.6.3.6.9-.1 1.3" />
  </svg>
);
export const IconLogout = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 4H5v16h4M15 8l4 4-4 4M19 12H9" />
  </svg>
);
export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3l10 18H2L12 3z" />
    <path d="M12 10v4M12 17.5v.5" />
  </svg>
);
export const IconLocate = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconArrowRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
);
// "Was ist inklusive?" satırı için oda/iş ikonları
export const IconBath = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12V6a2 2 0 012-2 2 2 0 012 2M3 12h18v2a4 4 0 01-4 4H7a4 4 0 01-4-4v-2zM6 18l-1 2M18 18l1 2" />
  </svg>
);
export const IconKitchen = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 2v8M5 2v4a2 2 0 002 2M9 2v4a2 2 0 01-2 2M7 10v12M16 2c-2 0-3 2-3 5s1 4 3 4 3-1 3-4-1-5-3-5zM16 11v11" />
  </svg>
);
export const IconSofa = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 11V8a2 2 0 012-2h12a2 2 0 012 2v3M3 12a2 2 0 012 2v3h14v-3a2 2 0 012-2 2 2 0 012 2v4a1 1 0 01-1 1H2a1 1 0 01-1-1v-4a2 2 0 012-2zM6 18v2M18 18v2" />
  </svg>
);
export const IconBed = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 8v11M3 12h18a2 2 0 012 2v5M21 19v-5M3 12V8a2 2 0 012-2h6a2 2 0 012 2v4" />
  </svg>
);
export const IconWindow = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M12 3v18M4 12h16" />
  </svg>
);
export const IconIron = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 15v-2a5 5 0 015-5h9a4 4 0 014 4v3H3zM3 15v2a2 2 0 002 2M8 8V6a2 2 0 012-2h4" />
  </svg>
);
export const IconFridge = (p: P) => (
  <svg {...base(p)}>
    <rect x="6" y="2" width="12" height="20" rx="2" />
    <path d="M6 9h12M10 5v2M10 12v3" />
  </svg>
);
export const IconOven = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M7 6h.01M11 6h.01M7 13h10v5H7z" />
  </svg>
);
