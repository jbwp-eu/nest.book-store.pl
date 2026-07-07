import { useTranslation } from "react-i18next";
import ContactForm from "@/components/contact/ContactForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function ContactPage() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("contact.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("contact.description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("contact.formTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>
    </section>
  );
}

export default ContactPage;
