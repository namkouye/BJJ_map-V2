import { useMemo, useState } from 'react';
import { bjjMap, mapIndex } from '../data/defaultMap';
import { FAMILY_COLORS, KIND_COLORS, KIND_ORDER, ROLE_LABELS } from '../graph/labels';
import {
  CUSTOM_KINDS,
  LINK_KINDS,
  getSide,
  groupPickKeys,
  isCustomId,
  moveId,
  parseSid,
  sid,
  techGroups,
  techKey,
} from '../graph/model';
import type { CustomKind, MoveKind, Profile, StateId } from '../graph/types';
import { useI18n, type I18n } from '../i18n/useI18n';
import { useActiveProfile, useStore } from '../store/useStore';
import { Modal } from './Modal';

export const customColor = (k: CustomKind): string =>
  k === 'position' ? '#94a3b8' : k === 'guard' ? FAMILY_COLORS.guard : KIND_COLORS[k];

export interface BoxInfo {
  title: string;
  sub: string;
  color: string;
  custom?: CustomKind;
}

/** Nom, sous-titre et couleur d'une case : état de la carte ou case ajoutée à la main. */
export function boxInfo(profile: Profile, id: string, i18n: I18n): BoxInfo | undefined {
  if (isCustomId(id)) {
    const n = profile.nodes?.find((x) => x.id === id);
    return n && { title: n.name, sub: i18n.t(`ck_${n.kind}` as never), color: customColor(n.kind), custom: n.kind };
  }
  const p = parseSid(id);
  const pos = p && mapIndex.get(p.position);
  if (!p || !pos || !getSide(mapIndex, id)) return undefined;
  return { title: pos.name, sub: `${ROLE_LABELS[p.role]} · ${i18n.sideTitle(id)}`, color: FAMILY_COLORS[pos.family] };
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* ------------------------------------------------------------------ */
/* Nouvelle case                                                       */
/* ------------------------------------------------------------------ */

function AddNodeDialog() {
  const i18n = useI18n();
  const { t } = i18n;
  const openDialog = useStore((s) => s.openDialog);
  const addNode = useStore((s) => s.addNode);
  const select = useStore((s) => s.select);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<CustomKind>('position');
  const submit = () => {
    if (!name.trim()) return;
    const id = addNode(name, kind);
    openDialog(null);
    select(id as StateId);
  };
  return (
    <Modal title={t('addBoxTitle')} onClose={() => openDialog(null)}>
      <form
        className="builder-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label>
          {t('boxName')}
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. Lapel guard" />
        </label>
        <div role="radiogroup" aria-label={t('boxType')} className="kind-pick">
          {CUSTOM_KINDS.map((k) => (
            <button
              type="button"
              key={k}
              role="radio"
              aria-checked={kind === k}
              className={`chip-btn ${kind === k ? 'on' : ''}`}
              style={{ borderColor: customColor(k) }}
              onClick={() => setKind(k)}
            >
              {t(`ck_${k}` as never)}
            </button>
          ))}
        </div>
        <div className="builder-actions">
          <button type="button" className="btn" onClick={() => openDialog(null)}>
            {t('cancel')}
          </button>
          <button type="submit" className="btn primary" disabled={!name.trim()}>
            {t('create')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Nouvelle connexion                                                  */
/* ------------------------------------------------------------------ */

interface Cand {
  id: string;
  title: string;
  sub: string;
  color: string;
  hay: string;
}

function ConnectDialog({ from }: { from: string }) {
  const i18n = useI18n();
  const { t } = i18n;
  const profile = useActiveProfile();
  const openDialog = useStore((s) => s.openDialog);
  const addLink = useStore((s) => s.addLink);
  const addNode = useStore((s) => s.addNode);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<MoveKind>('transition');
  const [tech, setTech] = useState('');
  const [newKind, setNewKind] = useState<CustomKind>('position');

  const me = boxInfo(profile, from, i18n);

  const cands = useMemo(() => {
    const out: Cand[] = [];
    for (const p of bjjMap.positions)
      for (const role of ['top', 'bottom'] as const) {
        const id = sid(p.id, role);
        if (id === from || !getSide(mapIndex, id)) continue;
        out.push({
          id,
          title: p.name,
          sub: `${i18n.lang === 'en' ? '' : `${i18n.posName(p)} · `}${ROLE_LABELS[role]} · ${i18n.sideTitle(id)}`,
          color: FAMILY_COLORS[p.family],
          hay: norm(`${p.name} ${p.nameFr} ${i18n.posName(p)} ${i18n.sideTitle(id)} ${ROLE_LABELS[role]}`),
        });
      }
    for (const n of profile.nodes ?? []) {
      if (n.id === from) continue;
      out.push({ id: n.id, title: n.name, sub: `${t('customBox')} · ${t(`ck_${n.kind}` as never)}`, color: customColor(n.kind), hay: norm(n.name) });
    }
    return out;
  }, [i18n, profile.nodes, from, t]);

  const suggestions = useMemo(() => {
    const side = getSide(mapIndex, from);
    if (!side) return cands.slice(0, 8);
    const direct = new Set(side.moves.map((m) => m.to).filter(Boolean) as string[]);
    const freq = new Map<string, number>();
    for (const d of direct) {
      for (const m of getSide(mapIndex, d)?.moves ?? []) if (m.to && m.to !== from && !direct.has(m.to)) freq.set(m.to, (freq.get(m.to) ?? 0) + 1);
    }
    const ranked = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => cands.find((c) => c.id === id)).filter(Boolean) as Cand[];
    const customs = cands.filter((c) => isCustomId(c.id));
    return [...customs, ...ranked].slice(0, 8);
  }, [cands, from]);

  const query = norm(q.trim());
  const shown = query
    ? cands.filter((c) => query.split(/\s+/).every((w) => c.hay.includes(w))).slice(0, 30)
    : suggestions;

  const link = (to: string) => {
    addLink(from, to, kind, tech);
    openDialog(null);
  };
  const createAndLink = () => {
    const id = addNode(q, newKind);
    link(id);
  };
  const exact = cands.some((c) => norm(c.title) === query);

  return (
    <Modal title={t('linkTitle', { name: me?.title ?? '' })} onClose={() => openDialog(null)}>
      <div className="builder-form">
        <input
          autoFocus
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('linkSearch')}
          aria-label={t('linkSearch')}
        />
        <div className="builder-row">
          <label>
            {t('linkKind')}
            <select value={kind} onChange={(e) => setKind(e.target.value as MoveKind)}>
              {LINK_KINDS.map((k) => (
                <option key={k} value={k}>
                  {i18n.kindShort(k)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('linkName')}
            <input value={tech} onChange={(e) => setTech(e.target.value)} />
          </label>
        </div>
        <h3 className="builder-h">{query ? t('results') : t('suggestions')}</h3>
        <ul className="cand-list">
          {shown.map((c) => (
            <li key={c.id}>
              <button type="button" className="cand" style={{ borderLeftColor: c.color }} onClick={() => link(c.id)}>
                <strong>{c.title}</strong>
                <small>{c.sub}</small>
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="empty">{t('noResult')}</li>}
        </ul>
        {query && !exact && (
          <div className="create-row">
            <select value={newKind} onChange={(e) => setNewKind(e.target.value as CustomKind)} aria-label={t('boxType')}>
              {CUSTOM_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`ck_${k}` as never)}
                </option>
              ))}
            </select>
            <button type="button" className="btn primary" onClick={createAndLink}>
              {t('createBox', { name: q.trim() })}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function Dialogs() {
  const dialog = useStore((s) => s.dialog);
  if (!dialog) return null;
  return dialog.type === 'node' ? <AddNodeDialog /> : <ConnectDialog key={dialog.from} from={dialog.from} />;
}

/* ------------------------------------------------------------------ */
/* Connexions d'une case + panneau d'une case ajoutée                  */
/* ------------------------------------------------------------------ */

export function MyLinks({ from }: { from: string }) {
  const i18n = useI18n();
  const { t } = i18n;
  const profile = useActiveProfile();
  const openDialog = useStore((s) => s.openDialog);
  const removeLink = useStore((s) => s.removeLink);
  const select = useStore((s) => s.select);
  const links = (profile.links ?? []).filter((l) => l.from === from);
  return (
    <section className="my-links">
      <h3>{t('myLinks')}</h3>
      <ul className="moves">
        {links.map((l) => {
          const dest = boxInfo(profile, l.to, i18n);
          return (
            <li key={l.id} className="move-card" style={{ borderLeftColor: KIND_COLORS[l.kind] }}>
              <div className="tech-row">
                <div className="tech-main">
                  <button className="move-dest" onClick={() => select(l.to as StateId)}>
                    <strong>{l.name || i18n.kindShort(l.kind)}</strong>
                    <small>→ {dest?.title ?? l.to}</small>
                  </button>
                </div>
                <button className="btn ghost small" aria-label={t('removeBtn')} onClick={() => removeLink(l.id)}>
                  ✕
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <button className="btn small" onClick={() => openDialog({ type: 'link', from })}>
        ＋ {t('addLinkBtn')}
      </button>
    </section>
  );
}

export function CustomPanel({ id }: { id: string }) {
  const i18n = useI18n();
  const { t } = i18n;
  const profile = useActiveProfile();
  const removeNode = useStore((s) => s.removeNode);
  const info = boxInfo(profile, id, i18n);
  if (!info) return null;
  return (
    <div className="state-panel">
      <header className="state-head">
        <div className="chips-row">
          <span className="badge" style={{ background: info.color, color: '#0b1220' }}>
            {info.sub}
          </span>
          <span className="badge soft">{t('customBox')}</span>
        </div>
        <h2>{info.title}</h2>
        <div className="head-actions">
          <button className="btn small danger" onClick={() => window.confirm(`${t('removeBtn')} « ${info.title} » ?`) && removeNode(id)}>
            {t('removeBtn')}
          </button>
        </div>
      </header>
      <MyLinks from={id} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mon jeu : construire la case suivante                               */
/* ------------------------------------------------------------------ */

export function NextBox() {
  const i18n = useI18n();
  const { t } = i18n;
  const role = useStore((s) => s.role);
  const selected = useStore((s) => s.selected);
  const openDialog = useStore((s) => s.openDialog);
  const togglePick = useStore((s) => s.togglePick);
  const profile = useActiveProfile();
  const [q, setQ] = useState('');

  const start = profile.starts[role];
  const focus = selected && (isCustomId(selected) || parseSid(selected)?.role === role) ? selected : start;
  if (!focus) return <p className="empty">{t('pickStartFirst')}</p>;

  const info = boxInfo(profile, focus, i18n);
  const side = isCustomId(focus) ? undefined : getSide(mapIndex, focus);

  const rows = side
    ? [
        ...techGroups(focus, side).map((g) => ({
          key: g.item,
          name: g.name,
          kind: g.kind as MoveKind,
          likely: !!g.tech.likely,
          dest: g.moves.length > 1 ? `${g.moves.length} →` : g.moves[0].to ? `→ ${i18n.stateName(g.moves[0].to)}` : '',
          keys: groupPickKeys(focus, g),
        })),
        ...side.moves
          .filter((m) => m.kind === 'submission')
          .map((m) => ({
            key: `fin-${m.finish}`,
            name: i18n.finish(m),
            kind: 'submission' as MoveKind,
            likely: false,
            dest: '',
            keys: m.techniques.map((x) => techKey(moveId(focus, m), x.name)),
          })),
      ]
    : [];
  return (
    <NextRows
      focusTitle={info?.title ?? ''}
      rows={rows}
      picks={profile.picks}
      q={q}
      setQ={setQ}
      onToggle={(keys, on) => keys.forEach((k) => profile.picks.includes(k) === on && togglePick(k))}
      onFree={() => openDialog({ type: 'link', from: focus })}
    />
  );
}

interface Row {
  key: string;
  name: string;
  kind: MoveKind;
  likely: boolean;
  dest: string;
  keys: string[];
}

function NextRows({
  focusTitle,
  rows,
  picks,
  q,
  setQ,
  onToggle,
  onFree,
}: {
  focusTitle: string;
  rows: Row[];
  picks: string[];
  q: string;
  setQ: (s: string) => void;
  onToggle: (keys: string[], on: boolean) => void;
  onFree: () => void;
}) {
  const { t, kindShort } = useI18n();
  const query = norm(q.trim());
  const on = (r: Row) => r.keys.length > 0 && r.keys.every((k) => picks.includes(k));
  const order = (a: Row, b: Row) =>
    Number(b.likely) - Number(a.likely) || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);
  const shown = query
    ? rows.filter((r) => norm(r.name).includes(query) || norm(kindShort(r.kind)).includes(query)).sort(order)
    : rows.filter((r) => !on(r)).sort(order).slice(0, 8);
  return (
    <section className="next-box">
      <h3>{t('nextBox')}</h3>
      <p className="next-from">{t('nextFrom', { name: focusTitle })}</p>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('nextSearch')} aria-label={t('nextSearch')} />
      <ul className="cand-list">
        {shown.map((r) => (
          <li key={r.key}>
            <button
              type="button"
              className={`cand ${on(r) ? 'picked' : ''}`}
              style={{ borderLeftColor: KIND_COLORS[r.kind] }}
              aria-pressed={on(r)}
              onClick={() => onToggle(r.keys, on(r))}
            >
              <strong>
                {r.likely ? '● ' : ''}
                {r.name}
              </strong>
              <small>
                {kindShort(r.kind)} {r.dest}
              </small>
              <span className="cand-add">{on(r) ? `✓ ${t('inGame')}` : `＋ ${t('addToGameBtn')}`}</span>
            </button>
          </li>
        ))}
        {shown.length === 0 && rows.length > 0 && <li className="empty">{t('noResult')}</li>}
      </ul>
      <button className="btn small" onClick={onFree}>
        {t('freeLink')}
      </button>
    </section>
  );
}
