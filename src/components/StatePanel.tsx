import { useState } from 'react';
import { mapIndex } from '../data/defaultMap';
import {
  FAMILY_COLORS,
  GAME_LABELS,
  KIND_COLORS,
  KIND_ORDER,
  ROLE_COLORS,
  ROLE_LABELS,
} from '../graph/labels';
import {
  finId,
  findItem,
  getSide,
  groupOf,
  groupPickKeys,
  itemThen,
  matchesKinds,
  moveId,
  otherRole,
  parseSid,
  pickedTechniques,
  resolveRef,
  sid,
  techGroups,
  techKey,
  type TechGroup,
} from '../graph/model';
import type { Move, StateId } from '../graph/types';
import { useI18n } from '../i18n/useI18n';
import { useActiveProfile, useStore } from '../store/useStore';

function CustomAdder({ mid }: { mid: string }) {
  const addCustom = useStore((s) => s.addCustom);
  const { t } = useI18n();
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
        placeholder={t('addOwn')}
        aria-label={t('addOwn')}
      />
      <button className="btn small" type="submit" disabled={!value.trim()}>
        +
      </button>
    </form>
  );
}

/** Carte d'un mouvement : destination (ou finition) + techniques à étoiler. `only` limite à une technique. */
function MoveCard({ from, move, only }: { from: StateId; move: Move; only?: string }) {
  const profile = useActiveProfile();
  const select = useStore((s) => s.select);
  const togglePick = useStore((s) => s.togglePick);
  const removeCustom = useStore((s) => s.removeCustom);
  const i18n = useI18n();
  const { t } = i18n;

  const mid = moveId(from, move);
  const picked = new Set(pickedTechniques(profile, mid, move));
  const custom = only ? [] : (profile.custom[mid] ?? []);
  const techs = only ? move.techniques.filter((x) => x.name === only) : move.techniques;
  const total = techs.length + custom.length;
  const dest = move.to ? parseSid(move.to) : null;
  const destPos = dest ? mapIndex.get(dest.position) : undefined;
  const color = KIND_COLORS[move.kind];

  return (
    <li className="move-card" style={{ borderLeftColor: color }}>
      <div className="move-head">
        {move.to ? (
          <button className="move-dest" onClick={() => select(move.to!)}>
            <strong>{destPos?.name}</strong>
            <small>{i18n.sideTitle(move.to)}</small>
          </button>
        ) : (
          <button className="move-dest" onClick={() => select(from, finId(mid))}>
            <strong>{move.finish}</strong>
            {i18n.lang !== 'en' && <small>{i18n.finish(move)}</small>}
          </button>
        )}
        {picked.size > 0 && <span className="stars-badge">★ {picked.size}</span>}
      </div>
      <details className="move-techs" open>
        <summary>{t('techniqueCount', { n: total })}</summary>
        <ul>
          {techs.map((tech) => {
            const key = techKey(mid, tech.name);
            const on = picked.has(tech.name);
            const note = i18n.note(tech);
            return (
              <li key={tech.name}>
                <button
                  className={`star ${on ? 'on' : ''}`}
                  aria-pressed={on}
                  aria-label={t(on ? 'removeFromGame' : 'addToGame', { name: tech.name })}
                  onClick={() => togglePick(key)}
                >
                  {on ? '★' : '☆'}
                </button>
                <span>
                  {move.kind === 'submission' || only ? (
                    tech.name
                  ) : (
                    <button className="linkish tech-link" onClick={() => select(from, key)}>
                      {tech.name}
                    </button>
                  )}
                  {note && <small>{note}</small>}
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
                  aria-label={t(on ? 'removeFromGame' : 'addToGame', { name })}
                  onClick={() => togglePick(techKey(mid, name))}
                >
                  {on ? '★' : '☆'}
                </button>
                <span>
                  {name}
                  <small>{t('myTechnique')}</small>
                </span>
                <button
                  className="btn ghost small"
                  aria-label={t('delete', { name })}
                  onClick={() => removeCustom(mid, name)}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
        {!only && <CustomAdder mid={mid} />}
      </details>
    </li>
  );
}


/** Une technique (une seule ligne, même si elle mène à plusieurs positions). */
function TechRow({ from, g }: { from: StateId; g: TechGroup }) {
  const profile = useActiveProfile();
  const select = useStore((s) => s.select);
  const togglePick = useStore((s) => s.togglePick);
  const i18n = useI18n();
  const { t } = i18n;
  const keys = groupPickKeys(from, g);
  const multi = g.moves.length > 1;
  const on = keys.some((k) => profile.picks.includes(k));
  const note = i18n.note(g.tech);
  return (
    <li className="move-card" style={{ borderLeftColor: KIND_COLORS[g.kind] }}>
      <div className="tech-row">
        {!multi ? (
          <button
            className={`star ${on ? 'on' : ''}`}
            aria-pressed={on}
            aria-label={t(on ? 'removeFromGame' : 'addToGame', { name: g.name })}
            onClick={() => togglePick(keys[0])}
          >
            {on ? '★' : '☆'}
          </button>
        ) : (
          <span className="star-spacer" aria-hidden />
        )}
        <div className="tech-main">
          <button className="move-dest" onClick={() => select(from, g.item)}>
            <strong>{g.name}</strong>
            <small>
              {multi
                ? t('destCount', { n: g.moves.length })
                : g.moves[0].to
                  ? `→ ${i18n.stateName(g.moves[0].to)}`
                  : ''}
            </small>
          </button>
          {note && <small className="tech-note">{note}</small>}
        </div>
      </div>
    </li>
  );
}

/** Détail d'une technique ou d'une soumission : son résultat et ses plans B. */
function ItemPanel({ from, itemId }: { from: StateId; itemId: string }) {
  const select = useStore((s) => s.select);
  const i18n = useI18n();
  const { t } = i18n;
  const item = findItem(mapIndex, from, itemId);
  if (!item) return null;
  const parsed = parseSid(from)!;
  const pos = mapIndex.get(parsed.position)!;
  const m = item.move;
  const color = KIND_COLORS[m.kind];
  const name = item.tech ? item.tech.name : (m.finish ?? '');

  const nexts = itemThen(item)
    .map((r) => resolveRef(mapIndex, from, r))
    .filter((r): r is NonNullable<typeof r> => !!r);

  return (
    <div className="state-panel">
      <header className="state-head">
        <div className="chips-row">
          <span className="badge" style={{ background: color }}>
            {i18n.kindLabel(m.kind)}
          </span>
          <span className="badge soft" style={{ color: ROLE_COLORS[parsed.role] }}>
            {pos.name} · {ROLE_LABELS[parsed.role]}
          </span>
        </div>
        <h2>{name}</h2>
        {!item.tech && i18n.lang !== 'en' && <p className="fr">{i18n.finish(m)}</p>}
        {item.tech && i18n.note(item.tech) && <p className="summary">{i18n.note(item.tech)}</p>}
        <div className="head-actions">
          <button className="btn small" onClick={() => select(from)}>
            ← {t('leaveItem')} {pos.name}
          </button>
        </div>
      </header>

      {item.tech ? (
        <section>
          <h3 style={{ color }}>{t('result')}</h3>
          {(groupOf(from, getSide(mapIndex, from)!, item.tech.name)?.moves.length ?? 1) > 1 && <p className="filter-note">{t('chooseDest')}</p>}
          <ul className="moves">
            {(groupOf(from, getSide(mapIndex, from)!, item.tech.name)?.moves ?? [m]).map((dm) => (
              <MoveCard key={moveId(from, dm)} from={from} move={dm} only={item.tech!.name} />
            ))}
          </ul>
        </section>
      ) : (
        <ul className="moves">
          <MoveCard from={from} move={m} />
        </ul>
      )}

      {nexts.length > 0 && (
        <section>
          <h3 style={{ color: '#94a3b8' }}>{t('ifItFails')}</h3>
          <ul className="moves">
            {nexts.map((n, i) => {
              if (n.type === 'state') {
                return (
                  <li key={i} className="move-card" style={{ borderLeftColor: '#94a3b8' }}>
                    <button className="move-dest" onClick={() => select(n.id)}>
                      <strong>{mapIndex.get(parseSid(n.id)!.position)?.name}</strong>
                      <small>{i18n.sideTitle(n.id)}</small>
                    </button>
                  </li>
                );
              }
              const im = n.item.move;
              return (
                <li key={i} className="move-card" style={{ borderLeftColor: KIND_COLORS[im.kind] }}>
                  <button className="move-dest" onClick={() => select(from, n.item.id)}>
                    <strong>{n.item.tech ? n.item.tech.name : im.finish}</strong>
                    <small>
                      {i18n.kindShort(im.kind)}
                      {im.to ? ` → ${i18n.stateName(im.to)}` : ''}
                    </small>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

export function StatePanel() {
  const selected = useStore((s) => s.selected);
  const selItem = useStore((s) => s.selItem);
  const select = useStore((s) => s.select);
  const setStart = useStore((s) => s.setStart);
  const togglePin = useStore((s) => s.togglePin);
  const kindFilter = useStore((s) => s.kindFilter);
  const clearKinds = useStore((s) => s.clearKinds);
  const profile = useActiveProfile();
  const i18n = useI18n();
  const { t } = i18n;

  const parsed = selected ? parseSid(selected) : null;
  const pos = parsed ? mapIndex.get(parsed.position) : undefined;
  const side = selected ? getSide(mapIndex, selected) : undefined;

  if (!selected || !parsed || !pos || !side) {
    return (
      <div className="state-panel intro">
        <h3>{t('howTitle')}</h3>
        <ol>
          <li>{t('how1')}</li>
          <li>{t('how2')}</li>
          <li>{t('how3')}</li>
          <li>{t('how4')}</li>
        </ol>
      </div>
    );
  }

  if (selItem && findItem(mapIndex, selected, selItem)) {
    return <ItemPanel from={selected} itemId={selItem} />;
  }

  const isStart = profile.starts[parsed.role] === selected;
  const mirror = sid(pos.id, otherRole(parsed.role));
  const game = GAME_LABELS[parsed.role].toLowerCase();
  const techs = techGroups(selected, side);
  const groups = KIND_ORDER.filter((kind) => matchesKinds(kind, kindFilter))
    .map((kind) => ({
      kind,
      techs: techs.filter((g) => g.kind === kind),
      moves: side.moves.filter((m) => m.kind === kind && m.kind === 'submission'),
    }))
    .filter((g) => g.techs.length || g.moves.length);
  const pinned = (profile.pins ?? []).includes(selected);

  return (
    <div className="state-panel">
      <header className="state-head">
        <div className="chips-row">
          <span className="badge" style={{ background: ROLE_COLORS[parsed.role] }}>
            {ROLE_LABELS[parsed.role]} · {i18n.roleSub(parsed.role)}
          </span>
          <span className="badge soft" style={{ color: FAMILY_COLORS[pos.family] }}>
            {i18n.posName(pos)}
          </span>
        </div>
        <h2>{side.title}</h2>
        {i18n.lang !== 'en' && <p className="fr">{i18n.sideTitle(selected)}</p>}
        <p className="summary">{i18n.sideSummary(selected)}</p>
        <div className="head-actions">
          <button className="btn small" onClick={() => select(mirror)} disabled={!getSide(mapIndex, mirror)}>
            {t('seeSide', { role: ROLE_LABELS[otherRole(parsed.role)] })}
          </button>
          <button
            className={`btn small ${isStart ? 'primary' : ''}`}
            onClick={() => setStart(parsed.role, isStart ? null : selected)}
          >
            {isStart ? t('isStart', { game }) : t('setStart', { game })}
          </button>
          <button className={`btn small ${pinned ? 'primary' : ''}`} aria-pressed={pinned} onClick={() => togglePin(selected)}>
            {pinned ? t('unpin') : t('pin')}
          </button>
        </div>
      </header>

      {kindFilter.length > 0 && (
        <p className="filter-note">
          {t('filterActive')} {kindFilter.map((k) => i18n.kindLabel(k)).join(' + ')}.{' '}
          <button className="linkish" onClick={clearKinds}>
            {t('showAll')}
          </button>
        </p>
      )}

      {groups.map((g) => (
        <section key={g.kind}>
          <h3 style={{ color: KIND_COLORS[g.kind] }}>{i18n.kindLabel(g.kind)}</h3>
          <ul className="moves">
            {g.techs.map((x) => (
              <TechRow key={x.item} from={selected} g={x} />
            ))}
            {g.moves.map((m) => (
              <MoveCard key={moveId(selected, m)} from={selected} move={m} />
            ))}
          </ul>
        </section>
      ))}
      {!groups.length && <p className="empty">{kindFilter.length ? t('noOptionsKind') : t('noOptions')}</p>}
      <p className="hint-text">{t('starHint', { name: profile.name })}</p>
    </div>
  );
}
