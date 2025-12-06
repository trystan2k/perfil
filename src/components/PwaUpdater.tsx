import { useRegisterSW } from 'virtual:pwa-register/react';
import type { SupportedLocale } from '../i18n/locales';
import type { TranslationValue } from '../i18n/utils';
import { TranslateProvider, useTranslate } from './TranslateProvider';

type PwaUpdaterProps = {
  locale: SupportedLocale;
  translations: TranslationValue;
};

export const PwaUpdater = ({ locale, translations }: PwaUpdaterProps) => {
  return (
    <TranslateProvider locale={locale} translations={translations}>
      <PwaUpdaterRaw />
    </TranslateProvider>
  );
};

const PwaUpdaterRaw = () => {
  const { t } = useTranslate();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) {
    return null;
  }

  return (
    <div className="pwa-updater" role="alert" aria-live="polite">
      <div className="pwa-updater-content">
        <p className="pwa-updater-message">{t('pwaUpdater.message')}</p>
        <div className="pwa-updater-actions">
          <button
            type="button"
            onClick={handleUpdate}
            className="pwa-updater-button primary"
            aria-label={t('pwaUpdater.reloadAriaLabel')}
          >
            {t('pwaUpdater.reload')}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="pwa-updater-button secondary"
            aria-label={t('pwaUpdater.dismissAriaLabel')}
          >
            {t('pwaUpdater.dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
};
