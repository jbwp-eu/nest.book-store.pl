import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useProductFilterUrl } from "@/hooks/useProductFilterUrl";

type PaginationProps = {
  pages: number;
};

function Pagination({ pages }: PaginationProps) {
  const { getPageUrl } = useProductFilterUrl();

  if (pages <= 1) return null;

  return (
    <ul className="mt-6 inline-flex overflow-hidden rounded-md border divide-x">
      {Array.from({ length: pages }, (_, i) => i + 1).map((page) => (
        <li key={page}>
          <NavLink
            to={getPageUrl(page)}
            className={({ isActive }) =>
              cn(
                "block px-4 py-2 text-sm hover:bg-muted",
                isActive && "bg-muted font-semibold"
              )
            }
          >
            {page}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export default Pagination;
