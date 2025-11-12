import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaUpdater() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration: ServiceWorkerRegistration | undefined) {
      if (import.meta.env.DEV) {
        console.log('SW Registered:', registration);
      }
    },
    onRegisterError(error: Error) {
      if (import.meta.env.DEV) {
        console.error('SW registration error:', error);
      }
    },
  });

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
        <p className="pwa-updater-message">A new version is available!</p>
        <div className="pwa-updater-actions">
          <button
            type="button"
            onClick={handleUpdate}
            className="pwa-updater-button primary"
            aria-label="Reload to update application"
          >
            Reload
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="pwa-updater-button secondary"
            aria-label="Dismiss update notification"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
