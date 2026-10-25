import type {
  BJJMap,
  Move,
  MoveKind,
  Position,
  PositionSide,
  Profile,
  Role,
  StateId,
  Technique,
} from './types';

/* ------------------------------------------------------------------ */
/* États (position + côté)                                             */
/* ------------------------------------------------------------------ */

export const sid = (position: string, role: Role): StateId => `${position}:${role}`;

export function parseSid(id: StateId): { position: string; role: Role } | null {
  const i = id.lastIndexOf(':');
  if (i < 1) return null;
  const role = id.slice(i + 1);
  if (role !== 'top' && role !== 'bottom') return null;
  return { position: id.slice(0, i), role };
}

export const otherRole = (r: Role): Role => (r === 'top' ? 'bottom' : 'top');

export type MapIndex = Map<string, Position>;

export function indexMap(map: BJJMap): MapIndex {
  return new Map(map.positions.map((p) => [p.id, p]));
}

export function getSide(index: MapIndex, id: StateId): PositionSide | undefined {
  const p = parseSid(id);
  if (!p) return undefined;
  return index.get(p.position)?.[p.role];
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Identifiant stable d'un mouvement (sert de base aux clés de techniques). */
export const moveId = (from: StateId, m: Move): string =>
  `${from}>${m.kind}:${m.to ?? `fin-${slugify(m.finish ?? '')}`}`;

export const techKey = (mid: string, name: string): string => `${mid}::${name}`;

export const finId = (mid: string): string => `fin:${mid}`;

/* ------------------------------------------------------------------ */
/* Éléments d'un état : techniques et soumissions                      */
/* ------------------------------------------------------------------ */

export interface Item {
  /** techKey (technique) ou finId (soumission) */
  id: string;
  from: StateId;
  move: Move;
  /** absent pour une soumission (on parle alors de la finition) */
  tech?: Technique;
}

/** Retrouve un élément (technique ou soumission) à partir de son identifiant. */
export function findItem(index: MapIndex, from: StateId, itemId: string): Item | undefined {
  const side = getSide(index, from);
  if (!side) return undefined;
  if (itemId.startsWith('fin:')) {
    const mid = itemId.slice(4);
    const move = side.moves.find((m) => m.kind === 'submission' && moveId(from, m) === mid);
    return move ? { id: itemId, from, move } : undefined;
  }
  const i = itemId.indexOf('::');
  if (i < 0) return undefined;
  const mid = itemId.slice(0, i);
  const name = itemId.slice(i + 2);
  for (const move of side.moves) {
    if (moveId(from, move) !== mid) continue;
    const tech = move.techniques.find((t) => t.name === name);
    if (tech) return { id: itemId, from, move, tech };
  }
  return undefined;
}

export type Next =
  | { type: 'state'; id: StateId }
  | { type: 'item'; item: Item };

/** Traduit une référence de `then` (état, technique ou soumission du même côté). */
export function resolveRef(index: MapIndex, from: StateId, ref: string): Next | undefined {
  const parsed = parseSid(ref);
  if (parsed && getSide(index, ref)) return { type: 'state', id: ref };
  const side = getSide(index, from);
  if (!side) return undefined;
  for (const move of side.moves) {
    if (move.kind === 'submission') continue;
    if (move.techniques.some((t) => t.name === ref)) {
      return { type: 'item', item: findItem(index, from, techKey(moveId(from, move), ref))! };
    }
  }
  const sub = side.moves.find((m) => m.kind === 'submission' && m.finish === ref);
  if (sub) return { type: 'item', item: findItem(index, from, finId(moveId(from, sub)))! };
  return undefined;
}

/** Enchaînements d'un élément : technique → then de la technique, soumission → then du mouvement. */
export function itemThen(item: Item): string[] {
  return (item.tech ? item.tech.then : item.move.then) ?? [];
}

/* ------------------------------------------------------------------ */
/* Validation du jeu de données                                        */
/* ------------------------------------------------------------------ */

const KINDS: MoveKind[] = ['pass', 'sweep', 'transition', 'escape', 'submission'];

export function validateMap(input: unknown): string[] {
  const errors: string[] = [];
  const map = input as BJJMap;
  if (!map || !Array.isArray(map.positions)) return ['"positions" est absent.'];

  const index = new Map<string, Position>();
  for (const p of map.positions) {
    if (index.has(p.id)) errors.push(`id dupliqué : ${p.id}`);
    index.set(p.id, p);
  }

  for (const p of map.positions) {
    if (!p.top && !p.bottom) errors.push(`${p.id} : aucun côté défini`);
    for (const role of ['top', 'bottom'] as const) {
      const side = p[role];
      if (!side) continue;
      const from = sid(p.id, role);
      const seen = new Set<string>();
      for (const m of side.moves) {
        const mid = moveId(from, m);
        if (seen.has(mid)) errors.push(`${from} : mouvement dupliqué (${mid})`);
        seen.add(mid);
        if (!KINDS.includes(m.kind)) errors.push(`${from} : type invalide (${m.kind})`);
        if (!m.techniques?.length) errors.push(`${mid} : aucune technique`);
        const refs = [...(m.then ?? []), ...m.techniques.flatMap((t) => t.then ?? [])];
        for (const r of refs) {
          if (!resolveRef(index, from, r)) errors.push(`${mid} : enchaînement introuvable (${r})`);
        }
        if (m.kind === 'submission') {
          if (!m.finish) errors.push(`${mid} : soumission sans "finish"`);
          if (m.to) errors.push(`${mid} : une soumission n'a pas de destination`);
        } else if (!m.to) {
          errors.push(`${mid} : destination manquante`);
        } else {
          if (m.to === from) errors.push(`${mid} : boucle sur soi-même`);
          if (!getSide(index, m.to)) errors.push(`${mid} : destination inconnue (${m.to})`);
        }
      }
    }
  }
  return errors;
}

/* ------------------------------------------------------------------ */
/* Vue d'ensemble : arêtes entre positions                             */
/* ------------------------------------------------------------------ */

export interface OverviewEdge {
  from: string;
  to: string;
  kinds: MoveKind[];
}

/** Une liste de types vide signifie « tous les types ». */
export const matchesKinds = (kind: MoveKind, kinds: readonly MoveKind[]): boolean =>
  kinds.length === 0 || kinds.includes(kind);

/** Nombre de mouvements par type pour un côté (ou pour tout un côté de la carte). */
export function countKinds(moves: readonly Move[]): Partial<Record<MoveKind, number>> {
  const out: Partial<Record<MoveKind, number>> = {};
  for (const m of moves) out[m.kind] = (out[m.kind] ?? 0) + 1;
  return out;
}

export function roleMoves(map: BJJMap, role: Role): Move[] {
  return map.positions.flatMap((p) => p[role]?.moves ?? []);
}

/** Arêtes position → position pour les mouvements d'un côté donné (sans techniques). */
export function overviewEdges(map: BJJMap, role: Role, kinds: readonly MoveKind[] = []): OverviewEdge[] {
  const out = new Map<string, OverviewEdge>();
  for (const p of map.positions) {
    for (const m of p[role]?.moves ?? []) {
      if (!m.to || !matchesKinds(m.kind, kinds)) continue;
      const target = parseSid(m.to);
      if (!target || target.position === p.id) continue;
      const key = `${p.id}>${target.position}`;
      const e = out.get(key) ?? { from: p.id, to: target.position, kinds: [] };
      if (!e.kinds.includes(m.kind)) e.kinds.push(m.kind);
      out.set(key, e);
    }
  }
  return [...out.values()];
}

/* ------------------------------------------------------------------ */
/* Profils                                                             */
/* ------------------------------------------------------------------ */

export function newProfile(id: string, name: string): Profile {
  return { id, name, starts: {}, picks: [], custom: {} };
}

export function togglePick(profile: Profile, key: string): Profile {
  const picks = profile.picks.includes(key)
    ? profile.picks.filter((k) => k !== key)
    : [...profile.picks, key];
  return { ...profile, picks };
}

export function addCustom(profile: Profile, mid: string, name: string): Profile {
  const clean = name.trim();
  if (!clean) return profile;
  const existing = profile.custom[mid] ?? [];
  const custom = existing.includes(clean) ? existing : [...existing, clean];
  const key = techKey(mid, clean);
  return {
    ...profile,
    custom: { ...profile.custom, [mid]: custom },
    picks: profile.picks.includes(key) ? profile.picks : [...profile.picks, key],
  };
}

export function removeCustom(profile: Profile, mid: string, name: string): Profile {
  const key = techKey(mid, name);
  const rest = (profile.custom[mid] ?? []).filter((n) => n !== name);
  const custom = { ...profile.custom };
  if (rest.length) custom[mid] = rest;
  else delete custom[mid];
  return { ...profile, custom, picks: profile.picks.filter((k) => k !== key) };
}

/** Noms des techniques choisies pour un mouvement (officielles puis personnelles). */
export function pickedTechniques(profile: Profile, mid: string, move: Move): string[] {
  const picks = new Set(profile.picks);
  const official = move.techniques.map((t) => t.name).filter((n) => picks.has(techKey(mid, n)));
  const custom = (profile.custom[mid] ?? []).filter((n) => picks.has(techKey(mid, n)));
  return [...official, ...custom];
}

export interface GameEntry {
  from: StateId;
  move: Move;
  id: string;
  names: string[];
}

/** Mouvements du profil partant d'un côté donné (= game top ou game bottom). */
export function gameEntries(map: BJJMap, profile: Profile, role: Role): GameEntry[] {
  const out: GameEntry[] = [];
  for (const p of map.positions) {
    const from = sid(p.id, role);
    for (const move of p[role]?.moves ?? []) {
      const id = moveId(from, move);
      const names = pickedTechniques(profile, id, move);
      if (names.length) out.push({ from, move, id, names });
    }
  }
  return out;
}

export function profileStats(map: BJJMap, profile: Profile): Record<Role, number> {
  const count = (role: Role) =>
    gameEntries(map, profile, role).reduce((a, e) => a + e.names.length, 0);
  return { top: count('top'), bottom: count('bottom') };
}

export const entryTarget = (e: GameEntry): string => e.move.to ?? finId(e.id);

/**
 * Profondeur de chaque nœud (état ou finition) dans le jeu, en partant de la position
 * de départ ; les nœuds sans entrée servent de racines supplémentaires.
 */
export function layerGame(entries: GameEntry[], start?: StateId): Map<string, number> {
  const adj = new Map<string, string[]>();
  const hasIncoming = new Set<string>();
  const nodes: string[] = [];
  const addNode = (n: string) => {
    if (!adj.has(n)) {
      adj.set(n, []);
      nodes.push(n);
    }
  };
  for (const e of entries) {
    const t = entryTarget(e);
    addNode(e.from);
    addNode(t);
    adj.get(e.from)!.push(t);
    hasIncoming.add(t);
  }

  const depth = new Map<string, number>();
  const bfs = (root: string) => {
    if (depth.has(root)) return;
    depth.set(root, 0);
    const queue = [root];
    for (let i = 0; i < queue.length; i++) {
      for (const next of adj.get(queue[i]) ?? []) {
        if (!depth.has(next)) {
          depth.set(next, depth.get(queue[i])! + 1);
          queue.push(next);
        }
      }
    }
  };

  if (start && adj.has(start)) bfs(start);
  for (const n of nodes) if (!hasIncoming.has(n)) bfs(n);
  for (const n of nodes) bfs(n); // cycles isolés
  return depth;
}

/* ------------------------------------------------------------------ */
/* Import de profils                                                   */
/* ------------------------------------------------------------------ */

export function parseProfiles(raw: unknown): { profiles: Profile[]; errors: string[] } {
  const file = raw as { profiles?: unknown };
  if (!file || !Array.isArray(file.profiles)) {
    return { profiles: [], errors: ['Fichier invalide : "profiles" est absent.'] };
  }
  const profiles: Profile[] = [];
  const errors: string[] = [];
  file.profiles.forEach((p: Partial<Profile>, i) => {
    if (!p || typeof p.name !== 'string' || !p.name.trim()) {
      errors.push(`Profil ${i + 1} : nom manquant.`);
      return;
    }
    if (!Array.isArray(p.picks) || p.picks.some((k) => typeof k !== 'string')) {
      errors.push(`Profil « ${p.name} » : liste de techniques invalide.`);
      return;
    }
    const starts: Profile['starts'] = {};
    for (const r of ['top', 'bottom'] as const) {
      const v = p.starts?.[r];
      if (typeof v === 'string' && parseSid(v)) starts[r] = v;
    }
    const custom: Profile['custom'] = {};
    for (const [k, v] of Object.entries(p.custom ?? {})) {
      if (Array.isArray(v)) custom[k] = v.filter((x) => typeof x === 'string');
    }
    profiles.push({
      id: typeof p.id === 'string' && p.id ? p.id : `imp-${i}`,
      name: p.name.trim(),
      starts,
      picks: [...new Set(p.picks)],
      custom,
    });
  });
  return { profiles, errors };
}
