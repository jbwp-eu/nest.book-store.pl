import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { adminNavLinks } from "@/links/adminLinks";
import { cn } from "@/lib/utils";

function AdminLayout() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("admin.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("admin.subtitle")}</p>
      </div>

      <nav
        aria-label={t("admin.nav.label")}
        className="flex flex-wrap gap-2 border-b pb-4"
      >
        {adminNavLinks.map((link) => (
          <NavLink
            key={link.href}
            to={link.href}
            end={link.href === "/admin/overview"}
            className={({ isActive }) =>
              cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            {t(link.titleKey)}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </section>
  );
}

export default AdminLayout;
