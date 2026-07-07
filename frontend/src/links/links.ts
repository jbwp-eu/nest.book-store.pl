export type NavLink = {
  href: string;
  titleKey: string;
};

export const publicNavLinks: NavLink[] = [
  { href: "/", titleKey: "nav.home" },
];

export const footerNavLinks: NavLink[] = [
  { href: "/contact", titleKey: "nav.contact" },
  { href: "/terms", titleKey: "nav.terms" },
];
