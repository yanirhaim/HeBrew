export const stripNiqqud = (value: string) => value.replace(/[\u0591-\u05C7]/g, "");

const normalizeFinalForms = (value: string) =>
  value
    .replace(/ך/g, "כ")
    .replace(/ם/g, "מ")
    .replace(/ן/g, "נ")
    .replace(/ף/g, "פ")
    .replace(/ץ/g, "צ");

export const tokenizeHebrewText = (text: string): string[] => {
  const matches = text.match(/[\u0590-\u05FF]+/g);
  if (!matches) return [];
  return matches.map((token) => stripNiqqud(token));
};

const PREFIXES = ["ו", "ה", "ב", "כ", "ל", "מ", "ש"] as const;
const SUFFIXES = ["ים", "ות", "ה", "י", "ך", "ו", "נו", "כם", "כן", "ם", "ן"] as const;

export const generateCandidateForms = (token: string): string[] => {
  const base = normalizeFinalForms(stripNiqqud(token));
  const variants = new Set<string>();
  variants.add(base);

  const removeSuffix = (value: string) => {
    for (const suffix of SUFFIXES) {
      if (value.length > suffix.length + 1 && value.endsWith(suffix)) {
        variants.add(value.slice(0, -suffix.length));
      }
    }
  };

  removeSuffix(base);

  let trimmed = base;
  for (let i = 0; i < 2; i += 1) {
    const prefix = PREFIXES.find((p) => trimmed.startsWith(p));
    if (!prefix || trimmed.length <= 2) break;
    trimmed = trimmed.slice(prefix.length);
    variants.add(trimmed);
    removeSuffix(trimmed);
  }

  return Array.from(variants).filter(Boolean);
};
