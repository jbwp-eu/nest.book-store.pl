import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

function StripePaymentSuccessPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const redirectStatus = searchParams.get("redirect_status");

  const isSuccess = redirectStatus === "succeeded";

  return (
    <section className="mx-auto max-w-lg space-y-6 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {isSuccess ? t("stripe.successTitle") : t("stripe.pendingTitle")}
      </h1>
      <p className="text-muted-foreground">
        {isSuccess ? t("stripe.successDesc") : t("stripe.pendingDesc")}
      </p>
      {id && (
        <Button asChild>
          <Link to={`/order/${id}`}>{t("stripe.viewOrder")}</Link>
        </Button>
      )}
    </section>
  );
}

export default StripePaymentSuccessPage;
