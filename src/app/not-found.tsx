"use client";
import { useLocale } from "@/components/locale";
import Link from "next/link";
export default function NotFound() {
  const { t } = useLocale();
  return (
    <main className="center-page">
      <span className="eyebrow">A LITTLE DETOUR</span>
      <h1>{t("好像走远了一点。")}</h1>
      <p>{t("这个页面不存在，一起回家吧。")}</p>
      <Link className="button primary" href="/">
        {t("回到首页")}
      </Link>
    </main>
  );
}
