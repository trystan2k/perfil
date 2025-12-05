import type { SupportedLocale } from '@/i18n/locales';
import { useTranslationStore } from '@/stores/translationStore';

export function TranslationInitializer({
  locale,
  translations,
}: {
  locale: SupportedLocale;
  translations: Record<string, unknown>;
}) {
  const setTranslations = useTranslationStore((s) => s.setTranslations);
  if (locale && translations) {
    setTranslations(locale, translations);
  }
  return null;
}
