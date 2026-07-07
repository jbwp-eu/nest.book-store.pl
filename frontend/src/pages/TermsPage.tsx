import { useTranslation } from "react-i18next";

const sectionKeys = ["general", "orders", "returns", "privacy"] as const;

function TermsPage() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("terms.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("terms.updated")}</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>{t("terms.intro")}</p>

        {sectionKeys.map((key) => (
          <article key={key} className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              {t(`terms.sections.${key}.title`)}
            </h2>
            <p>{t(`terms.sections.${key}.body`)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TermsPage;
