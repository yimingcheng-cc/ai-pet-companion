"use client";
import { useLocale } from "@/components/locale";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useLocale();
  return (
    <main className="center-page">
      <h1>{t("刚刚出了点小状况。")}</h1>
      <p>{t("请重新试一次，你的本地存档会保留。")}</p>
      <button className="button primary" onClick={reset}>
        {t("重新加载")}
      </button>
    </main>
  );
}
