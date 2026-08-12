import type { SVGProps } from "react";

/**
 * Jeu d'icônes maison.
 * Une seule grammaire : traits fins, formes géométriques, aucun remplissage.
 * Tout appartient au même univers instrumental.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.15}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ArrowUpRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 17 17 7" />
    <path d="M8.5 7H17v8.5" />
  </Icon>
);

export const ArrowRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12h15" />
    <path d="m13 6 6 6-6 6" />
  </Icon>
);

export const ArrowLeft = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 12H5" />
    <path d="m11 18-6-6 6-6" />
  </Icon>
);

export const ArrowDown = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4v15" />
    <path d="m6 13 6 6 6-6" />
  </Icon>
);

export const Plus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Icon>
);

export const Check = (p: IconProps) => (
  <Icon {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Icon>
);

export const Close = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 6 12 12" />
    <path d="m18 6-12 12" />
  </Icon>
);

export const Menu = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 8h16" />
    <path d="M4 16h10" />
  </Icon>
);

export const Mail = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="m3.8 7 7.1 5.4a2 2 0 0 0 2.2 0L20.2 7" />
  </Icon>
);

export const Phone = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8.4 3.8 10 7.2l-1.9 1.6a11 11 0 0 0 5.1 5.1L14.8 12l3.4 1.6v3.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 5.4a2 2 0 0 1 2-2.2h3.4Z" />
  </Icon>
);

/**
 * L'étoile de notation.
 *
 * C'est la seule icône du jeu qui accepte un remplissage, et l'exception est
 * assumée : une note se lit d'un coup d'œil, à la surface pleine, jamais au
 * contour. Le tracé reste celui de la maison — sommets adoucis, trait fin —
 * de sorte qu'une étoile éteinte appartienne visiblement à la même famille
 * que les autres icônes du site.
 */
export const Star = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Icon fill={filled ? "currentColor" : "none"} {...p}>
    <path d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.75-5.2-2.73-5.2 2.73 1-5.75-4.2-4.1 5.8-.85z" />
  </Icon>
);

/* --- Icônes de missions ------------------------------------------- */

export const IconSite = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
    <path d="M2.5 9h19" />
    <circle cx="6" cy="6.75" r="0.55" fill="currentColor" stroke="none" />
    <path d="M6.5 13h6" />
    <path d="M6.5 16h9" />
  </Icon>
);

export const IconLanding = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="2.5" width="14" height="19" rx="2.5" />
    <path d="M8.5 7.5h7" />
    <path d="M8.5 11h4" />
    <rect x="8.5" y="15" width="7" height="3.2" rx="1.6" />
  </Icon>
);

export const IconRefonte = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 12a8 8 0 0 1-13.7 5.6" />
    <path d="M4 12a8 8 0 0 1 13.7-5.6" />
    <path d="M17.8 3v3.5h-3.5" />
    <path d="M6.2 21v-3.5h3.5" />
  </Icon>
);

export const IconSeo = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 4.5 4.5" />
    <path d="M7.5 11.5 9.7 9l2 2.2L14 7.7" />
  </Icon>
);

export const IconMaintenance = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 2.8 20 6v6c0 4.2-3.2 7.6-8 9.2-4.8-1.6-8-5-8-9.2V6l8-3.2Z" />
    <path d="M9 12.2l2 2 4-4.3" />
  </Icon>
);

export const IconAutomation = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="5.5" cy="6" r="2.2" />
    <circle cx="18.5" cy="6" r="2.2" />
    <circle cx="12" cy="18" r="2.2" />
    <path d="M7.7 6h8.6" />
    <path d="M6.4 8.1 10.8 16" />
    <path d="M17.6 8.1 13.2 16" />
  </Icon>
);

/* --- Icônes de bénéfices ------------------------------------------ */

export const IconShine = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v3.2" />
    <path d="M12 17.8V21" />
    <path d="M3 12h3.2" />
    <path d="M17.8 12H21" />
    <path d="m5.6 5.6 2.3 2.3" />
    <path d="m16.1 16.1 2.3 2.3" />
    <path d="m18.4 5.6-2.3 2.3" />
    <path d="m7.9 16.1-2.3 2.3" />
    <circle cx="12" cy="12" r="3.1" />
  </Icon>
);

export const IconLink = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 14a4.2 4.2 0 0 0 6 0l3-3a4.2 4.2 0 0 0-6-6l-1.6 1.6" />
    <path d="M14 10a4.2 4.2 0 0 0-6 0l-3 3a4.2 4.2 0 0 0 6 6l1.6-1.6" />
  </Icon>
);

export const IconClock = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.8" />
    <path d="M12 7.2V12l3.2 2" />
  </Icon>
);

export const IconGrowth = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 19.5h17" />
    <path d="M6.5 19.5v-5" />
    <path d="M11.5 19.5v-9" />
    <path d="M16.5 19.5V6.5" />
    <path d="M20.5 4.5h-3.2M20.5 4.5v3.2" />
  </Icon>
);

/* --- Signal / télémétrie ------------------------------------------ */

export const IconSignalLost = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 15.5a10.6 10.6 0 0 1 4-3.1" />
    <path d="M2 11.4a15.7 15.7 0 0 1 6-3.9" />
    <path d="M12 19.2h.01" />
    <path d="m15 8 6 6" />
    <path d="m21 8-6 6" />
  </Icon>
);

export const IconOrbit = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <ellipse cx="12" cy="12" rx="10" ry="4.6" transform="rotate(-24 12 12)" />
  </Icon>
);
