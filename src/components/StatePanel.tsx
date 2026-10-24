import { useState } from 'react';
import { mapIndex } from '../data/defaultMap';
import {
  FAMILY_COLORS,
  GAME_LABELS,
  KIND_COLORS,
  KIND_LABELS,
  KIND_ORDER,
  ROLE_COLORS,
  ROLE_LABELS,
  ROLE_LABELS_FR,
} from '../graph/labels';
import { getSide, moveId, otherRole, parseSid, pickedTechniques, sid, techKey } from '../graph/model';
import type { Move, StateId } from '../graph/types';
import { useActiveProfile, useStore } from '../store/useStore';

function CustomAdder({ mid }: { mid: string }) {
  const addCustom = useStore((s) => s.addCustom);
  const [value, setValue] = useState('');
  return (
    <form
      className="custom-add"
      onSubmit={(e) => {
        e.preventDefault();
        addCustom(mid, value);
        setValue('');
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ajouter ma propre technique…"
        aria-label="Ajouter ma propre technique"
      />
      <button className="btn small" type="submit" disabled={!value.trim()}>
        +
      </button>
    </form>
  );
}

function MoveCard({ from, move }: { from: StateId; move: Move }) {
  const profile = useActiveProfile();
  const select = useStore((s) => s.select);
  const togglePick = useStore((s) => s.togglePick);
  const removeCustom = useStore((s) => s.removeCustom);

  const mid = moveId(from, move);
  const picked = new Set(pickedTechniques(profile, mid, move));
  const custom = profile.custom[mid] ?? [];
  const total = move.techniques.length + custom.length;
  const dest = move.to ? parseSid(move.to) : null;
  const destPos = dest ? mapIndex.get(dest.position) : undefined;
  const destSide = move.to ? getSide(mapIndex, move.to) : undefined;
  const color = KIND_COLORS[move.kind];

  return (
    <li className="move-card" style={{ borderLeftColor: color }}>
      <div className="move-head">
        {move.to ? (
          <button className="move-dest" onClick={() => select(move.to!)}>
            <strong>{destPos?.name}</strong>
            <small>{destSide?.titleFr}</small>
          </button>
        ) : (
          <div className="move-dest static">
            <strong>{move.finish}</strong>
            <small>{move.finishFr}</small>
          </div>
        )}
        {picked.size > 0 && <span className="stars-badge">★ {picked.size}</span>}
      </div>
      <details className="move-techs" open={picked.size > 0}>
        <summary>
          {total} technique{total > 1 ? 's' : ''}
        </summary>
        <ul>
          {move.techniques.map((t) => {
            const key = techKey(mid, t.name);
            const on = picked.has(t.name);
            return (
              <li key={t.name}>
                <button
                  className={`star ${on ? 'on' : ''}`}
                  aria-pressed={on}
                  aria-label={`${on ? 'Retirer' : 'Ajouter'} « ${t.name} » ${on ? 'de' : 'à'} mon jeu`}
                  onClick={() => togglePick(key)}
                >
                  {on ? '★' : '☆'}
                </button>
                <span>
                  {t.name}
                  {t.note && <small>{t.note}</small>}
                </span>
              </li>
            );
          })}
          {custom.map((name) => {
            const on = picked.has(name);
            return (
              <li key={`c-${name}`}>
                <button
                  className={`star ${on ? 'on' : ''}`}
                  aria-pressed={on}
                  aria-label={`${on ? 'Retirer' : 'Ajouter'} « ${name} »`}
                  onClick={() => togglePick(techKey(mid, name))}
                >
                  {on ? '★' : '☆'}
                </button>
                <span>
                  {name}
                  <small>Ma technique</small>
                </span>
                <button
                  className="btn ghost small"
                  aria-label={`Supprimer « ${name} »`}
                  onClick={() => removeCustom(mid, name)}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
        <CustomAdder mid={mid} />
      </details>
    </li>
  );
}

export function StatePanel() {
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  const setStart = useStore((s) => s.setStart);
  const profile = useActiveProfile();

  const parsed = selected ? parseSid(selected) : null;
  const pos = parsed ? mapIndex.get(parsed.position) : undefined;
  const side = selected ? getSide(mapIndex, selected) : undefined;

  if (!selected || !parsed || !pos || !side) {
    return (
      <div className="state-panel intro">
        <h3>Comment ça marche</h3>
        <ol>
          <li>Touchez une position sur la carte.</li>
          <li>
            Choisissez votre point de vue avec le curseur <b>On top</b> / <b>On bottom</b>.
          </li>
          <li>
            La position passe au centre : toutes vos options apparaissent autour (passages,
            balayages, soumissions…).
          </li>
          <li>Touchez une option pour continuer, et étoilez vos techniques préférées pour bâtir votre jeu.</li>
        </ol>
      </div>
    );
  }

  const isStart = profile.starts[parsed.role] === selected;
  const mirror = sid(pos.id, otherRole(parsed.role));
  const groups = KIND_ORDER.map((kind) => ({
    kind,
    moves: side.moves.filter((m) => m.kind === kind),
  })).filter((g) => g.moves.length);

  return (
    <div className="state-panel">
      <header className="state-head">
        <div className="chips-row">
          <span className="badge" style={{ background: ROLE_COLORS[parsed.role] }}>
            {ROLE_LABELS[parsed.role]} · {ROLE_LABELS_FR[parsed.role]}
          </span>
          <span className="badge soft" style={{ color: FAMILY_COLORS[pos.family] }}>
            {pos.nameFr}
          </span>
        </div>
        <h2>{side.title}</h2>
        <p className="fr">{side.titleFr}</p>
        <p className="summary">{side.summary}</p>
        <div className="head-actions">
          <button className="btn small" onClick={() => select(mirror)} disabled={!getSide(mapIndex, mirror)}>
            Voir côté {ROLE_LABELS[otherRole(parsed.role)]}
          </button>
          <button
            className={`btn small ${isStart ? 'primary' : ''}`}
            onClick={() => setStart(parsed.role, isStart ? null : selected)}
          >
            {isStart ? `✓ Départ de mon ${GAME_LABELS[parsed.role].toLowerCase()}` : `Définir comme départ (${GAME_LABELS[parsed.role].toLowerCase()})`}
          </button>
        </div>
      </header>

      {groups.map((g) => (
        <section key={g.kind}>
          <h3 style={{ color: KIND_COLORS[g.kind] }}>{KIND_LABELS[g.kind]}</h3>
          <ul className="moves">
            {g.moves.map((m) => (
              <MoveCard key={moveId(selected, m)} from={selected} move={m} />
            ))}
          </ul>
        </section>
      ))}
      {!groups.length && <p className="empty">Aucune option depuis cette position.</p>}
      <p className="hint-text">
        ☆ Étoilez une technique pour l'ajouter au profil « {profile.name} ».
      </p>
    </div>
  );
}
