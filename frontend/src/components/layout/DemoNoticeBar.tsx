import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

function DemoNoticeBar() {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      className="border-b border-sky-500/25 bg-sky-500/10 px-4 py-2 text-center text-sm text-sky-700 dark:text-sky-300"
    >
      <p className="inline-flex items-center justify-center gap-2">
        <Info className="size-4 shrink-0" aria-hidden />
        <span>{t("footer.demoNotice")}</span>
      </p>
    </div>
  );
}

export default DemoNoticeBar;
