import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useI18n } from '../i18n/useI18n';

/** Bandeau discret : "prêt hors-ligne" et "nouvelle version disponible". */
export function ReloadPrompt() {
  const { t } = useI18n();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  // Le message « prêt hors-ligne » disparaît tout seul.
  useEffect(() => {
    if (!offlineReady || needRefresh) return;
    const t = setTimeout(() => setOfflineReady(false), 4000);
    return () => clearTimeout(t);
  }, [offlineReady, needRefresh, setOfflineReady]);

  if (!offlineReady && !needRefresh) return null;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="toast" role="status">
      <span>
        {needRefresh
          ? t('updateAvail')
          : t('offlineReady')}
      </span>
      {needRefresh && (
        <button className="btn small primary" onClick={() => updateServiceWorker(true)}>
          {t('update')}
        </button>
      )}
      <button className="btn small" onClick={close}>
        OK
      </button>
    </div>
  );
}
