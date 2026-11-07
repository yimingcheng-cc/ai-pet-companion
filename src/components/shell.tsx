"use client";
import { useLocale } from "@/components/locale";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PawPrint, ArrowUpRight, Settings2, Heart, House } from "lucide-react";
import { usePet } from "./store";
export function Header() {
  const { t, locale, setLocale } = useLocale();
  const pathname = usePathname();
  const { data } = usePet();
  return (
    <header className="header">
      <Link className="brand" href="/" aria-label={t("Companion 首页")}>
        <span className="brand-mark">
          <PawPrint size={21} />
        </span>
        companion<span className="brand-dot">.</span>
      </Link>
      <nav aria-label={t("主导航")}>
        <button
          className="locale-switch"
          type="button"
          aria-label={locale === "zh" ? "Switch to English" : "切换到中文"}
          onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
        >
          {locale === "zh" ? "EN" : "中文"}
        </button>
        <Link
          className={pathname === "/pet" ? "active" : ""}
          href={data.pet ? "/pet" : "/adopt"}
        >
          <House size={15} />
          <span>{t("陪伴时光")}</span>
        </Link>
        <Link
          className={pathname === "/memories" ? "active" : ""}
          href="/memories"
        >
          <Heart size={15} />
          <span>{t("我们的记忆")}</span>
        </Link>
        <Link
          className={pathname === "/settings" ? "active" : ""}
          href="/settings"
          aria-label={t("设置")}
        >
          <Settings2 size={19} />
        </Link>
      </nav>
    </header>
  );
}
export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="footer">
      <span>A LITTLE COMPANY. A LOT OF LOVE.</span>
      <span>
        {t("为每一次平凡的陪伴而设计")}
        <ArrowUpRight size={12} />
      </span>
    </footer>
  );
}
export function Loading() {
  const { t } = useLocale();
  return (
    <div className="loading">
      <PawPrint size={26} />
      <span>{t("正在准备你们的小世界\u2026")}</span>
    </div>
  );
}
