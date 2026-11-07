"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translate, type Locale, type Values } from "@/lib/i18n/translate";
const Context = createContext({
  locale: "zh" as Locale,
  t: (key: string, values?: Values) => translate("zh", key, values),
  setLocale: (_locale: Locale) => {
    void _locale;
  },
});
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setValue] = useState<Locale>("zh");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("companion.locale");
      if (saved === "zh" || saved === "en") {
        // Browser-only preference is read after hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValue(saved);
      }
    } catch {}
  }, []);
  const setLocale = useCallback((next: Locale) => {
    setValue(next);
    try {
      localStorage.setItem("companion.locale", next);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "zh-CN";
    document.title =
      locale === "en"
        ? "Companion · A little company"
        : "Companion · 让陪伴自然发生";
  }, [locale]);
  const t = useCallback(
    (key: string, values?: Values) => translate(locale, key, values),
    [locale],
  );
  const context = useMemo(
    () => ({ locale, t, setLocale }),
    [locale, t, setLocale],
  );
  return <Context.Provider value={context}>{children}</Context.Provider>;
}
export function useLocale() {
  return useContext(Context);
}
