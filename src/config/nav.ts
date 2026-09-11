/**
 * Site navigation. The header, the mobile menu, the footer and the 404 page
 * all read from here, so adding a route to the site is one edit.
 */

export interface NavItem {
  href: string;
  label: string;
}

/** Shown in the header and the mobile menu. */
export const primaryNav: NavItem[] = [
  { href: '/briefings', label: 'Briefings' },
  { href: '/coverage', label: 'Coverage' },
  { href: '/about', label: 'About' },
  { href: '/subscribe', label: 'Subscribe' },
];

/** Shown in the footer. A superset of the primary navigation. */
export const footerNav: NavItem[] = [
  ...primaryNav,
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
];
