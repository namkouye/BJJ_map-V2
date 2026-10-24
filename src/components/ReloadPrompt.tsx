import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** Bandeau discret : "prêt hors-ligne" et "nouvelle version disponible". */
export function ReloadPrompt() {
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
          ? 'Une nouvelle version est disponible.'
          : 'Application prête : elle fonctionne hors-ligne.'}
      </span>
      {needRefresh && (
        <button className="btn small primary" onClick={() => updateServiceWorker(true)}>
          Mettre à jour
        </button>
      )}
      <button className="btn small" onClick={close}>
        OK
      </button>
    </div>
  );
}
