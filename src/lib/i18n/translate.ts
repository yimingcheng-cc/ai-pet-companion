import english from "./en.json";
export type Locale = "zh" | "en";
export type Values = Record<string, string | number>;
const dictionary: Record<string, string> = english;
const reverse = new Map(Object.entries(dictionary).map(([zh, en]) => [en, zh]));
export function translate(
  locale: Locale,
  key: string,
  values: Values = {},
): string {
  const normalized = key.replace(/\s+/g, " ").trim();
  const source =
    locale === "en"
      ? (dictionary[normalized] ?? key)
      : (reverse.get(normalized) ?? key);
  return source.replace(/\{(\w+)\}/g, (match, name) =>
    String(values[name] ?? match),
  );
}
