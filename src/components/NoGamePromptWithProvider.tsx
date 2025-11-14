import { I18nProvider } from './I18nProvider';
import { NoGamePrompt } from './NoGamePrompt';

interface NoGamePromptWithProviderProps {
  locale: string;
}

export function NoGamePromptWithProvider({ locale }: NoGamePromptWithProviderProps) {
  return (
    <I18nProvider locale={locale}>
      <NoGamePrompt />
    </I18nProvider>
  );
}
