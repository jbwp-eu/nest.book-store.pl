import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

function ErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();
  let message = t("error.unknown");

  if (isRouteErrorResponse(error)) {
    message = error.statusText || String(error.data) || message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <section className="space-y-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">{t("error.title")}</h1>
      <p className="text-muted-foreground">{message}</p>
      <Button asChild>
        <Link to="/">{t("error.home")}</Link>
      </Button>
    </section>
  );
}

export default ErrorPage;
