import { useEffect, useState } from 'react';
import { DataPanel } from './components/DataPanel';
import { GamePanel } from './components/GamePanel';
import { MapView } from './components/MapView';
import { ReloadPrompt } from './components/ReloadPrompt';
import { StatePanel } from './components/StatePanel';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { useActiveProfile, useStore, type Mode } from './store/useStore';

type Tab = 'map' | 'panel';

const MODES: Array<{ id: Mode; label: string }> = [
  { id: 'explore', label: 'Explorer' },
  { id: 'game', label: 'Mon jeu' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('map');
  const [showData, setShowData] = useState(false);
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const selected = useStore((s) => s.selected);
  const role = useStore((s) => s.role);
  const profile = useActiveProfile();
  const { canInstall, install } = useInstallPrompt();

  // Le thème de couleur suit le côté choisi (bleu = dessus, ambre = dessous).
  useEffect(() => {
    document.documentElement.dataset.role = role;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', role === 'top' ? '#0b1a2e' : '#1b120c');
  }, [role]);

  return (
    <div className="app" data-role={role}>
      <header className="topbar">
        <h1>
          <span className="logo" aria-hidden>
            ◈
          </span>
          <span>BJJ Game Map</span>
        </h1>

        <div className="mode-switch" role="tablist" aria-label="Mode">
          {MODES.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={mode === m.id}
              className={mode === m.id ? 'on' : ''}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="top-actions">
          <span className="profile-chip" title="Profil actif">
            {profile.name}
          </span>
          <button className="btn" onClick={() => setShowData(true)}>
            Données
          </button>
        </div>
      </header>

      <nav className="tabs" aria-label="Sections">
        <button className={tab === 'map' ? 'on' : ''} onClick={() => setTab('map')}>
          Carte
        </button>
        <button className={tab === 'panel' ? 'on' : ''} onClick={() => setTab('panel')}>
          {mode === 'game' ? 'Mon jeu' : 'Détail'}
          {selected ? ' •' : ''}
        </button>
      </nav>

      <main className={`layout show-${tab}`}>
        <section className="col col-graph" data-watermark={role === 'top' ? 'On top' : 'On bottom'}>
          <MapView />
        </section>
        <aside className="col col-detail">
          <div className="panel">
            {mode === 'game' && <GamePanel />}
            {(mode === 'explore' || selected) && <StatePanel />}
          </div>
        </aside>
      </main>

      {showData && (
        <DataPanel onClose={() => setShowData(false)} canInstall={canInstall} onInstall={install} />
      )}
      <ReloadPrompt />
    </div>
  );
}
