import { useEffect, useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { getStoredLanguage } from "@/lib/language-preference";
import { translateErrorMessage } from "@/lib/error-translation";

export function ErrorText({ message }: { message: string | null | undefined }) {
  const profileLanguage = useAppSelector((state) => state.account.profile?.language);
  const [storedLanguage, setStoredLanguage] = useState(getStoredLanguage);
  const language = profileLanguage ?? storedLanguage;
  const code = language?.code ?? "en";
  const name = language?.name ?? "English";
  const key = JSON.stringify([code, name, message]);
  const [result, setResult] = useState<{ key: string; text: string } | null>(null);

  useEffect(() => {
    const update = () => setStoredLanguage(getStoredLanguage());
    window.addEventListener("smarttravel:language-change", update);
    return () => window.removeEventListener("smarttravel:language-change", update);
  }, []);

  useEffect(() => {
    if (!message) return;
    let cancelled = false;
    void translateErrorMessage(message, { code, name }).then((text) => {
      if (!cancelled) setResult({ key, text });
    });
    return () => {
      cancelled = true;
    };
  }, [message, code, name, key]);

  // Never show a previous error/language while a new translation is pending.
  return <span dir="auto">{result?.key === key ? result.text : message}</span>;
}
