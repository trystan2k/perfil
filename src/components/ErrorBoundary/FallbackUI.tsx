import { type FC, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { navigateWithLocale } from '@/i18n/locales';
import { cn } from '@/lib/utils';
import { useTranslate } from '../TranslateProvider';

interface FallbackUIProps {
  error?: Error;
  onRetry: () => void;
  loggingContext?: string;
}

const FallbackUI: FC<FallbackUIProps> = ({ error, onRetry, loggingContext }) => {
  const { t } = useTranslate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const handleGoHome = (): void => {
    navigateWithLocale('/');
  };

  return (
    <div
      className={cn(
        'flex min-h-[50vh] items-center justify-center p-4',
        'animate-in fade-in-50 duration-300'
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle
            as="h2"
            ref={headingRef}
            tabIndex={-1}
            className="text-destructive focus:outline-none"
          >
            {t('errorHandler.title')}
          </CardTitle>
          <CardDescription>
            {loggingContext
              ? t('errorHandler.contextMessage', { context: loggingContext })
              : t('errorHandler.defaultMessage')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error?.message || t('errorHandler.defaultMessage')}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={onRetry}
            variant="default"
            className="w-full sm:w-auto"
            aria-label={t('common.retry')}
          >
            {t('common.retry')}
          </Button>
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full sm:w-auto"
            aria-label={t('common.goHome')}
          >
            {t('common.goHome')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FallbackUI;
