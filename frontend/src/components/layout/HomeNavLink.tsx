import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HomeNavLinkProps = {
  className?: string;
  onNavigate?: () => void;
};

function HomeNavLink({ className, onNavigate }: HomeNavLinkProps) {
  const { t } = useTranslation();

  return (
    <Button asChild variant="outline" size="icon" className={cn(className)}>
      <Link to="/" aria-label={t("nav.home")} onClick={onNavigate}>
        <Home className="size-4" />
      </Link>
    </Button>
  );
}

export default HomeNavLink;
