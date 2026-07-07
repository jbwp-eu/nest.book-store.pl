import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useTranslation } from "react-i18next";
import StripePaymentForm from "@/components/checkout/StripePaymentForm";
import { env } from "@/lib/env";

const stripePromise = env.stripePublishableKey
  ? loadStripe(env.stripePublishableKey)
  : null;

type StripeCheckoutProps = {
  clientSecret: string;
  orderId: string;
  totalPrice: number;
};

function StripeCheckout({
  clientSecret,
  orderId,
  totalPrice,
}: StripeCheckoutProps) {
  const { t } = useTranslation();

  if (!stripePromise) {
    return (
      <p className="text-sm text-destructive">{t("stripe.missingKey")}</p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: "stripe" },
      }}
    >
      <StripePaymentForm orderId={orderId} totalPrice={totalPrice} />
    </Elements>
  );
}

export default StripeCheckout;
