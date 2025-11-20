import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function NoGamePrompt() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-main p-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">{t('noGamePage.title')}</h1>
        <p className="text-muted-foreground text-lg">{t('noGamePage.description')}</p>
        <div className="mt-6">
          <Button asChild size="lg">
            <a href="/">{t('noGamePage.createButton')}</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
