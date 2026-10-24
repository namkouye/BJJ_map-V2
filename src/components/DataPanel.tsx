import { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { Modal } from './Modal';

interface Props {
  onClose: () => void;
  canInstall: boolean;
  onInstall: () => void;
}

export function DataPanel({ onClose, canInstall, onInstall }: Props) {
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
    setOk('Export téléchargé.');
    setErrors([]);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setOk('');
    try {
      const errs = importData(JSON.parse(await file.text()));
      setErrors(errs.slice(0, 8));
      if (!errs.length) setOk('Profils importés : ils ont été ajoutés à vos profils.');
    } catch {
      setErrors(['Fichier JSON illisible.']);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Modal title="Mes données" onClose={onClose}>
      <div className="data-panel">
        <p>
          Vos profils ({profileCount}) sont stockés <strong>uniquement sur cet appareil</strong>.
          Exportez-les pour les sauvegarder ou les transférer vers un autre appareil.
        </p>
        <div className="btn-col">
          <button className="btn primary" onClick={download}>
            Exporter mes profils
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Importer des profils (JSON)
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
              Installer l'application
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

        <h3>Zone de réinitialisation</h3>
        <button
          className="btn danger"
          onClick={() =>
            window.confirm('Supprimer TOUS vos profils et repartir de zéro ?') && resetProfiles()
          }
        >
          Effacer tous mes profils
        </button>
      </div>
    </Modal>
  );
}
