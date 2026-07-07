export type AdminNavLink = {
  href: string;
  titleKey: string;
};

export const adminNavLinks: AdminNavLink[] = [
  { href: "/admin/overview", titleKey: "admin.nav.overview" },
  { href: "/admin/orders", titleKey: "admin.nav.orders" },
  { href: "/admin/products", titleKey: "admin.nav.products" },
  { href: "/admin/users", titleKey: "admin.nav.users" },
  { href: "/admin/reviews", titleKey: "admin.nav.reviews" },
];
