import { bjjMap, mapIndex } from '../data/defaultMap';
import { GAME_LABELS, KIND_COLORS, ROLE_COLORS } from '../graph/labels';
import { gameEntries, parseSid, profileStats, sid } from '../graph/model';
import { useActiveProfile, useStore } from '../store/useStore';

function ProfileBar() {
  const profiles = useStore((s) => s.profiles);
  const activeId = useStore((s) => s.activeId);
  const setActive = useStore((s) => s.setActive);
  const createProfile = useStore((s) => s.createProfile);
  const renameProfile = useStore((s) => s.renameProfile);
  const duplicateProfile = useStore((s) => s.duplicateProfile);
  const deleteProfile = useStore((s) => s.deleteProfile);
  const profile = useActiveProfile();

  return (
    <div className="profile-bar">
      <label>
        Profil actif
        <select value={activeId} onChange={(e) => setActive(e.target.value)}>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="profile-actions">
        <button
          className="btn small"
          onClick={() => {
            const name = window.prompt('Nom du nouveau profil (ex : Jeu compétition, Jeu no-gi)');
            if (name !== null) createProfile(name);
          }}
        >
          + Nouveau
        </button>
        <button
          className="btn small"
          onClick={() => {
            const name = window.prompt('Nouveau nom du profil', profile.name);
            if (name) renameProfile(profile.id, name);
          }}
        >
          Renommer
        </button>
        <button className="btn small" onClick={() => duplicateProfile(profile.id)}>
          Dupliquer
        </button>
        <button
          className="btn small danger"
          disabled={profiles.length <= 1}
          onClick={() =>
            window.confirm(`Supprimer le profil « ${profile.name} » ?`) && deleteProfile(profile.id)
          }
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

export function GamePanel() {
  const role = useStore((s) => s.role);
  const setMode = useStore((s) => s.setMode);
  const setStart = useStore((s) => s.setStart);
  const select = useStore((s) => s.select);
  const selected = useStore((s) => s.selected);
  const profile = useActiveProfile();

  const stats = profileStats(bjjMap, profile);
  const start = profile.starts[role];
  const entries = gameEntries(bjjMap, profile, role);

  const startOptions = bjjMap.positions
    .filter((p) => p[role])
    .map((p) => ({ id: sid(p.id, role), label: `${p.name} — ${p[role]!.titleFr}` }));

  const build = (from: string) => {
    setMode('explore');
    select(from);
  };

  return (
    <div className="game-panel">
      <ProfileBar />

      <div className="stats">
        <div style={{ borderColor: ROLE_COLORS.top }}>
          <strong>{stats.top}</strong>
          <span>techniques en game top</span>
        </div>
        <div style={{ borderColor: ROLE_COLORS.bottom }}>
          <strong>{stats.bottom}</strong>
          <span>techniques en game bottom</span>
        </div>
      </div>

      <section>
        <h3>Départ du {GAME_LABELS[role].toLowerCase()}</h3>
        <select value={start ?? ''} onChange={(e) => setStart(role, e.target.value || null)}>
          <option value="">— Choisir une position —</option>
          {startOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <button className="btn primary block" disabled={!start} onClick={() => start && build(start)}>
          {entries.length ? 'Continuer à construire depuis le départ' : 'Construire depuis cette position'}
        </button>
      </section>

      <section>
        <h3>Mes techniques ({GAME_LABELS[role].toLowerCase()})</h3>
        {!entries.length && (
          <p className="empty">
            Rien pour l'instant. Choisissez un départ, puis étoilez vos techniques en explorant :
            chaque étoile ajoute une flèche à votre carte.
          </p>
        )}
        <ul className="picked-list">
          {entries.map((e) => {
            const f = parseSid(e.from)!;
            const dest = e.move.to ? parseSid(e.move.to) : null;
            return (
              <li key={e.id} className={selected === e.from ? 'active' : ''}>
                <button className="picked-from" onClick={() => build(e.from)}>
                  {mapIndex.get(f.position)?.name}
                </button>
                <span className="arrow" style={{ color: KIND_COLORS[e.move.kind] }}>
                  →
                </span>
                {e.move.to ? (
                  <button className="picked-from" onClick={() => build(e.move.to!)}>
                    {mapIndex.get(dest!.position)?.name}
                  </button>
                ) : (
                  <strong className="finish-name">{e.move.finish}</strong>
                )}
                <small>{e.names.join(' · ')}</small>
              </li>
            );
          })}
        </ul>
        {entries.length > 0 && (
          <p className="hint-text">
            Les destinations marquées « ↪ » sur la carte se continuent dans l'autre côté
            ({GAME_LABELS[role === 'top' ? 'bottom' : 'top'].toLowerCase()}).
          </p>
        )}
      </section>
    </div>
  );
}
