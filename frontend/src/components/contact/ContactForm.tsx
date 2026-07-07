import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { sendContactMessage } from "@/api/contact";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/apiClient";
import { useAppSelector } from "@/store/hooks";

type ContactFormProps = {
  onSuccess?: () => void;
};

function ContactForm({ onSuccess }: ContactFormProps) {
  const { t } = useTranslation();
  const locale = useAppSelector((state) => state.ui.language);
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<{ email?: string; text?: string }>({});

  const mutation = useMutation({
    mutationFn: () => sendContactMessage({ email: email.trim(), text: text.trim() }, locale),
    onSuccess: (data) => {
      toast.success(data.message || t("contact.success"));
      setEmail("");
      setText("");
      setErrors({});
      onSuccess?.();
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : t("contact.sendFailed");
      toast.error(message);
    },
  });

  const validate = () => {
    const next: { email?: string; text?: string } = {};
    if (!email.trim()) {
      next.email = t("contact.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = t("contact.emailInvalid");
    }
    if (!text.trim()) {
      next.text = t("contact.messageRequired");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  };

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="contact-email">
          {t("contact.emailLabel")}
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          autoComplete="email"
          required
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="contact-text">
          {t("contact.messageLabel")}
        </label>
        <textarea
          id="contact-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`${inputClass} min-h-32 resize-y`}
          required
        />
        {errors.text && (
          <p className="text-sm text-destructive">{errors.text}</p>
        )}
      </div>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? t("contact.sending") : t("contact.submit")}
      </Button>
    </form>
  );
}

export default ContactForm;
