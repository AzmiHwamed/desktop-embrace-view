// lib/i18n.ts

// Replaces {name}, {count}, etc. in a translated string with real values.
// Left untouched if a key isn't provided, so a missing var is visible
// instead of silently vanishing.
// lib/i18n.ts

// Replaces {name}, {count}, etc. in a translated string with real values.
// Left untouched if a key isn't provided, so a missing var is visible
// instead of silently vanishing.
const PLACEHOLDER_PATTERN = /\{\{[^{}]+\}\}|\{[^{}]+\}/g;

// Translation models sometimes translate placeholder names (`{amount}` ->
// `{مبلغ}`). Restore placeholders by position from the English source so old
// cached dictionaries remain usable without asking users to clear storage.
export function normalizePlaceholders(source: string, translated: string): string {
  const expected = source.match(PLACEHOLDER_PATTERN) ?? [];
  if (expected.length === 0) return translated;

  const received = translated.match(PLACEHOLDER_PATTERN) ?? [];
  if (received.length !== expected.length) return source;

  let index = 0;
  return translated.replace(PLACEHOLDER_PATTERN, () => expected[index++] ?? "");
}

export function interpolate(template: string | undefined, vars: Record<string, string | number> = {}): string {
  if (typeof template !== "string") return "";
  return template.replace(/\{\{(\w+)\}\}|\{(\w+)\}/g, (match, doubleKey, singleKey) => {
    const key = doubleKey ?? singleKey;
    return vars[key] !== undefined ? String(vars[key]) : match;
  });
}
