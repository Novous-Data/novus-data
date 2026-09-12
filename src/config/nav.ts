/**
 * Site navigation. The header, the mobile menu, the footer and the sitemap all
 * read from here, so adding a section to the site is one edit.
 *
 * Order is deliberate: the register and the exposure chart are what the site is
 * for, so they lead. The email briefing is one part of the site rather than the
 * whole of it, and sits after them.
 */

export interface NavItem {
  href: string;
  label: string;
}

/** Shown in the header and the mobile menu. */
export const primaryNav: NavItem[] = [
  { href: '/disruptions', label: 'Disruptions' },
  { href: '/exposure', label: 'Exposure' },
  { href: '/briefings', label: 'Briefings' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/about', label: 'About' },
];

/** Shown in the footer. A superset of the primary navigation. */
export const footerNav: NavItem[] = [
  ...primaryNav,
  { href: '/coverage', label: 'Coverage' },
  { href: '/subscribe', label: 'Subscribe' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
];
