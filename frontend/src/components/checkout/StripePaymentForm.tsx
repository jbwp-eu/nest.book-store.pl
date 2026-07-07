import { type FormEvent, useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format-currency";
import { env } from "@/lib/env";

type StripePaymentFormProps = {
  orderId: string;
  totalPrice: number;
};

function StripePaymentForm({ orderId, totalPrice }: StripePaymentFormProps) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setErrorMessage(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${env.stripeConfirmPaymentUrl}/order/${orderId}/payment-success`,
      },
    });

    if (result.error) {
      setErrorMessage(result.error.message ?? t("stripe.error"));
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || !elements || isLoading}
      >
        {isLoading
          ? t("stripe.purchasing")
          : `${t("stripe.purchase")} ${formatCurrency(totalPrice)}`}
      </Button>
    </form>
  );
}

export default StripePaymentForm;
