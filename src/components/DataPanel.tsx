import { useRef, useState } from 'react';
import { useI18n } from '../i18n/useI18n';
import { useStore } from '../store/useStore';
import { Modal } from './Modal';

interface Props {
  onClose: () => void;
  canInstall: boolean;
  onInstall: () => void;
}

export function DataPanel({ onClose, canInstall, onInstall }: Props) {
  const { t } = useI18n();
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const resetProfiles = useStore((s) => s.resetProfiles);
  const profileCount = useStore((s) => s.profiles.length);
  const fileRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [ok, setOk] = useState('');

  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bjj-mes-profils-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setOk(t('exported'));
    setErrors([]);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setOk('');
    try {
      const errs = importData(JSON.parse(await file.text()));
      setErrors(errs.slice(0, 8));
      if (!errs.length) setOk(t('imported'));
    } catch {
      setErrors([t('badJson')]);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Modal title={t('myData')} onClose={onClose}>
      <div className="data-panel">
        <p>{t('dataIntro', { n: profileCount })}</p>
        <div className="btn-col">
          <button className="btn primary" onClick={download}>
            {t('exportBtn')}
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            {t('importBtn')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {canInstall && (
            <button className="btn" onClick={onInstall}>
              {t('installBtn')}
            </button>
          )}
        </div>

        {ok && <p className="ok">{ok}</p>}
        {errors.length > 0 && (
          <ul className="errors">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}

        <h3>{t('resetZone')}</h3>
        <button
          className="btn danger"
          onClick={() =>
            window.confirm(t('resetConfirm')) && resetProfiles()
          }
        >
          {t('resetBtn')}
        </button>
      </div>
    </Modal>
  );
}
