import { useRegisterSW } from 'virtual:pwa-register/react';

type PwaUpdaterProps = {
  t: (keyPath: string, params?: Record<string, string | number>) => string;
};

export function PwaUpdater({ t }: PwaUpdaterProps) {
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
}
