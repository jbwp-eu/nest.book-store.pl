import { type SubmitEvent, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  buildCatalogSearchUrl,
  isCatalogPath,
} from "@/lib/product-search-navigation";

type HeaderSearchProps = {
  className?: string;
  compact?: boolean;
  onNavigate?: () => void;
};

function HeaderSearch({
  className,
  compact = false,
  onNavigate,
}: HeaderSearchProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (isCatalogPath(location.pathname)) {
      setValue(searchParams.get("search") ?? "");
    }
  }, [location.pathname, searchParams]);

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(buildCatalogSearchUrl(value));
    onNavigate?.();
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex items-center gap-2",
        compact ? "w-full" : "flex min-w-0 flex-1 items-center gap-2",
        className,
      )}
    >
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("search.placeholder")}
        aria-label={t("search.placeholder")}
        className={cn("h-8", compact ? "flex-1" : "min-w-0 flex-1")}
      />
      <Button
        type="submit"
        size="icon"
        variant="outline"
        className="size-8 shrink-0"
        aria-label={t("search.submit")}
      >
        <Search className="size-4" />
      </Button>
    </form>
  );
}

export default HeaderSearch;
