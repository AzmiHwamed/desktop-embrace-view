// lib/rtl.ts
const RTL_LANGUAGE_CODES = new Set([
  "ar", "he", "iw", "fa", "ur", "ps", "sd", "yi", "dv", "ckb", "nqo", "syr",
]);

export function isRtlLanguage(languageCode: string | undefined): boolean {
  if (!languageCode) return false;
  // Handle codes like "ar-SA" by checking just the primary subtag.
  const primary = languageCode.split("-")[0].toLowerCase();
  return RTL_LANGUAGE_CODES.has(primary);
}