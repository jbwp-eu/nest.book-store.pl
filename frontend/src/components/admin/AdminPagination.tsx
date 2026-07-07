import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

type AdminPaginationProps = {
  pages: number;
  basePath: string;
  currentPage: number;
};

function AdminPagination({ pages, basePath, currentPage }: AdminPaginationProps) {
  if (pages <= 1) return null;

  function getPageUrl(page: number): string {
    if (page <= 1) return basePath;
    return `${basePath}/page/${page}`;
  }

  return (
    <ul className="mt-6 inline-flex overflow-hidden rounded-md border divide-x">
      {Array.from({ length: pages }, (_, i) => i + 1).map((page) => (
        <li key={page}>
          <NavLink
            to={getPageUrl(page)}
            className={cn(
              "block px-4 py-2 text-sm hover:bg-muted",
              page === currentPage && "bg-muted font-semibold"
            )}
          >
            {page}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export default AdminPagination;
