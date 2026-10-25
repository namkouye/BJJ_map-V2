import { describe, expect, it } from 'vitest';
import { bjjMap, mapIndex } from '../data/defaultMap';
import {
  addCustom,
  entryTarget,
  findItem,
  itemThen,
  resolveRef,
  gameEntries,
  getSide,
  layerGame,
  moveId,
  newProfile,
  otherRole,
  overviewEdges,
  parseProfiles,
  parseSid,
  pickedTechniques,
  profileStats,
  removeCustom,
  sid,
  techKey,
  togglePick,
  validateMap,
} from './model';

describe('jeu de données (au sol)', () => {
  it('est valide : destinations existantes, soumissions sans destination, pas de doublons', () => {
    expect(validateMap(bjjMap)).toEqual([]);
  });

  it('ne contient plus de position debout', () => {
    expect(mapIndex.has('standing')).toBe(false);
    for (const p of bjjMap.positions)
      for (const r of ['top', 'bottom'] as const)
        for (const m of p[r]?.moves ?? []) expect(m.to?.startsWith('standing')).toBeFalsy();
  });

  it('couvre les positions, gardes et passages de base', () => {
    for (const id of [
      'closed-guard', 'half-guard', 'side-control', 'mount', 'back-control', 'turtle',
      'butterfly-guard', 'de-la-riva', 'x-guard', 'single-leg-x', 'headquarters',
      'knee-shield', 'deep-half-guard', 'reverse-de-la-riva', 'spider-guard', 'lasso-guard',
      'collar-sleeve-guard', 'saddle', 'fifty-fifty', 'kesa-gatame', 'north-south',
      'knee-on-belly', 'front-headlock',
    ]) {
      expect(mapIndex.has(id), id).toBe(true);
    }
    const hq = getSide(mapIndex, 'headquarters:top')!;
    const passes = hq.moves.filter((m) => m.kind === 'pass').flatMap((m) => m.techniques.map((t) => t.name));
    for (const n of ['Knee cut pass', 'Toreando pass']) expect(passes).toContain(n);
  });

  it('chaque position existe des deux côtés (dessus et dessous)', () => {
    for (const p of bjjMap.positions) {
      expect(p.top, `${p.id} top`).toBeDefined();
      expect(p.bottom, `${p.id} bottom`).toBeDefined();
    }
  });

  it('relie la garde fermée à la demi-garde (guard break) et à l\'armbar', () => {
    const top = getSide(mapIndex, 'closed-guard:top')!;
    expect(top.moves.some((m) => m.to === 'half-guard:top' && m.kind === 'pass')).toBe(true);
    const bottom = getSide(mapIndex, 'closed-guard:bottom')!;
    expect(bottom.moves.some((m) => m.finish === 'Armbar' && m.kind === 'submission')).toBe(true);
    expect(bottom.moves.some((m) => m.to === 'mount:top' && m.kind === 'sweep')).toBe(true);
  });

  it('un balayage depuis le dessous mène à un état "top"', () => {
    for (const p of bjjMap.positions)
      for (const m of p.bottom?.moves ?? [])
        if (m.kind === 'sweep') expect(parseSid(m.to!)?.role).toBe('top');
  });

  it('contient une base riche de techniques', () => {
    const techniques = bjjMap.positions.flatMap((p) =>
      (['top', 'bottom'] as const).flatMap((r) => (p[r]?.moves ?? []).flatMap((m) => m.techniques)),
    );
    expect(techniques.length).toBeGreaterThanOrEqual(300);
  });

  it('chaque position est atteignable depuis une autre position', () => {
    const incoming = new Set<string>();
    for (const p of bjjMap.positions)
      for (const r of ['top', 'bottom'] as const)
        for (const m of p[r]?.moves ?? []) if (m.to) incoming.add(parseSid(m.to)!.position);
    for (const p of bjjMap.positions) expect(incoming.has(p.id), p.id).toBe(true);
  });

  it('chaque garde propose au moins un balayage et une soumission ou une transition', () => {
    for (const p of bjjMap.positions.filter((x) => x.family === 'guard')) {
      const kinds = new Set(p.bottom!.moves.map((m) => m.kind));
      expect(kinds.has('sweep') || kinds.has('transition'), p.id).toBe(true);
    }
  });

  it('chaque position dominante et chaque garde ont des options des deux côtés', () => {
    for (const p of bjjMap.positions) {
      expect(p.top!.moves.length, `${p.id} top`).toBeGreaterThan(0);
      expect(p.bottom!.moves.length, `${p.id} bottom`).toBeGreaterThan(0);
    }
  });

  it('les noms de techniques sont uniques à l\'intérieur d\'un mouvement', () => {
    for (const p of bjjMap.positions)
      for (const r of ['top', 'bottom'] as const)
        for (const m of p[r]?.moves ?? []) {
          const names = m.techniques.map((t) => t.name);
          expect(new Set(names).size, `${p.id}:${r}`).toBe(names.length);
        }
  });

  it('un passage de garde part toujours du dessus', () => {
    for (const p of bjjMap.positions)
      expect(p.bottom?.moves.some((m) => m.kind === 'pass')).toBe(false);
  });
});

describe('validateMap', () => {
  it('détecte une destination inconnue, une soumission mal formée et une boucle', () => {
    const bad = {
      version: 1,
      positions: [
        {
          id: 'a', name: 'A', nameFr: 'A', family: 'guard',
          top: {
            title: 't', titleFr: 't', summary: '',
            moves: [
              { kind: 'pass', to: 'zzz:top', techniques: [{ name: 'x' }] },
              { kind: 'pass', to: 'a:top', techniques: [{ name: 'x' }] },
              { kind: 'submission', techniques: [{ name: 'x' }] },
              { kind: 'sweep', techniques: [] },
            ],
          },
        },
      ],
    };
    const errors = validateMap(bad).join('\n');
    expect(errors).toContain('destination inconnue');
    expect(errors).toContain('boucle');
    expect(errors).toContain('sans "finish"');
    expect(errors).toContain('destination manquante');
    expect(errors).toContain('aucune technique');
  });

  it('rejette un format invalide', () => {
    expect(validateMap(null)).not.toEqual([]);
  });
});

describe('états', () => {
  it('construit et analyse des identifiants', () => {
    expect(sid('mount', 'top')).toBe('mount:top');
    expect(parseSid('closed-guard:bottom')).toEqual({ position: 'closed-guard', role: 'bottom' });
    expect(parseSid('mount')).toBeNull();
    expect(parseSid('mount:left')).toBeNull();
    expect(otherRole('top')).toBe('bottom');
  });
});

describe('vue d\'ensemble', () => {
  it('agrège les arêtes entre positions selon le côté', () => {
    const top = overviewEdges(bjjMap, 'top');
    expect(top.some((e) => e.from === 'closed-guard' && e.to === 'half-guard')).toBe(true);
    expect(top.some((e) => e.from === 'closed-guard' && e.to === 'mount')).toBe(false);
    const bottom = overviewEdges(bjjMap, 'bottom');
    expect(bottom.some((e) => e.from === 'closed-guard' && e.to === 'mount')).toBe(true);
    // une seule arête par paire
    const keys = bottom.map((e) => `${e.from}>${e.to}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('profils', () => {
  const from = 'closed-guard:bottom';
  const move = getSide(mapIndex, from)!.moves.find((m) => m.kind === 'sweep')!;
  const mid = moveId(from, move);

  it('étoile / dé-étoile une technique', () => {
    let p = newProfile('p1', 'Test');
    p = togglePick(p, techKey(mid, 'Scissor sweep'));
    expect(pickedTechniques(p, mid, move)).toEqual(['Scissor sweep']);
    p = togglePick(p, techKey(mid, 'Scissor sweep'));
    expect(pickedTechniques(p, mid, move)).toEqual([]);
  });

  it('ajoute et retire une technique personnelle', () => {
    let p = newProfile('p1', 'Test');
    p = addCustom(p, mid, '  Mon sweep  ');
    expect(pickedTechniques(p, mid, move)).toEqual(['Mon sweep']);
    p = addCustom(p, mid, 'Mon sweep');
    expect(p.custom[mid]).toEqual(['Mon sweep']);
    p = removeCustom(p, mid, 'Mon sweep');
    expect(pickedTechniques(p, mid, move)).toEqual([]);
    expect(p.custom[mid]).toBeUndefined();
    expect(addCustom(p, mid, '   ')).toBe(p);
  });

  it('sépare game top et game bottom', () => {
    let p = newProfile('p1', 'Test');
    p = togglePick(p, techKey(mid, 'Scissor sweep'));
    const hqMove = getSide(mapIndex, 'headquarters:top')!.moves.find((m) => m.to === 'side-control:top')!;
    p = togglePick(p, techKey(moveId('headquarters:top', hqMove), hqMove.techniques[0].name));
    expect(gameEntries(bjjMap, p, 'bottom').map((e) => e.from)).toEqual([from]);
    expect(gameEntries(bjjMap, p, 'top').map((e) => e.from)).toEqual(['headquarters:top']);
    expect(profileStats(bjjMap, p)).toEqual({ top: 1, bottom: 1 });
  });

  it('calcule les couches du jeu à partir du départ', () => {
    let p = newProfile('p1', 'Test');
    const pick = (stateId: string, to: string) => {
      const m = getSide(mapIndex, stateId)!.moves.find((x) => x.to === to)!;
      p = togglePick(p, techKey(moveId(stateId, m), m.techniques[0].name));
    };
    pick('closed-guard:top', 'headquarters:top');
    pick('headquarters:top', 'side-control:top');
    pick('side-control:top', 'mount:top');
    const entries = gameEntries(bjjMap, p, 'top');
    const depth = layerGame(entries, 'closed-guard:top');
    expect(depth.get('closed-guard:top')).toBe(0);
    expect(depth.get('headquarters:top')).toBe(1);
    expect(depth.get('side-control:top')).toBe(2);
    expect(depth.get('mount:top')).toBe(3);
    expect(entries.map(entryTarget)).toContain('mount:top');
  });

  it('gère les cycles et les départs inconnus', () => {
    let p = newProfile('p1', 'Test');
    const pick = (stateId: string, to: string) => {
      const m = getSide(mapIndex, stateId)!.moves.find((x) => x.to === to)!;
      p = togglePick(p, techKey(moveId(stateId, m), m.techniques[0].name));
    };
    pick('closed-guard:bottom', 'butterfly-guard:bottom');
    pick('butterfly-guard:bottom', 'closed-guard:bottom'); // cycle
    const depth = layerGame(gameEntries(bjjMap, p, 'bottom'), 'nope:bottom');
    expect(depth.size).toBe(2);
  });
});

describe('import de profils', () => {
  it('accepte un export valide et nettoie les données', () => {
    const { profiles, errors } = parseProfiles({
      profiles: [{ id: 'a', name: ' Jeu 1 ', starts: { top: 'mount:top', bottom: 'oups' }, picks: ['x', 'x'], custom: { m: ['t', 3] } }],
    });
    expect(errors).toEqual([]);
    expect(profiles[0]).toEqual({ id: 'a', name: 'Jeu 1', starts: { top: 'mount:top' }, picks: ['x'], custom: { m: ['t'] } });
  });

  it('rejette les formats invalides', () => {
    expect(parseProfiles(null).errors).not.toEqual([]);
    expect(parseProfiles({ profiles: [{ name: '', picks: [] }] }).errors).not.toEqual([]);
    expect(parseProfiles({ profiles: [{ name: 'x', picks: [1] }] }).errors).not.toEqual([]);
  });

  it("filtre les arêtes de la vue d'ensemble par type", () => {
    const all = overviewEdges(bjjMap, 'bottom');
    const sweeps = overviewEdges(bjjMap, 'bottom', ['sweep']);
    expect(sweeps.length).toBeGreaterThan(0);
    expect(sweeps.length).toBeLessThanOrEqual(all.length);
    expect(sweeps.every((e) => e.kinds.every((k) => k === 'sweep'))).toBe(true);
    expect(overviewEdges(bjjMap, 'top', ['pass']).length).toBeGreaterThan(0);
    expect(overviewEdges(bjjMap, 'bottom', ['pass']).length).toBe(0);
  });

  it('retire la DLR de la garde fermée et ajoute la K-guard', () => {
    const cg = mapIndex.get('closed-guard')!.bottom!;
    expect(cg.moves.some((m) => m.to?.startsWith('de-la-riva'))).toBe(false);
    expect(mapIndex.has('k-guard')).toBe(true);
    expect(cg.moves.some((m) => m.to === 'k-guard:bottom')).toBe(true);
  });

  it('contient les finitions demandées (reverse triangle, leg scissors, crucifix)', () => {
    const fins = (id: string, role: 'top' | 'bottom') =>
      mapIndex.get(id)![role]!.moves.filter((m) => m.kind === 'submission').map((m) => m.finish);
    expect(fins('north-south', 'top')).toEqual(expect.arrayContaining(['Reverse triangle', 'Leg scissors choke']));
    expect(fins('turtle', 'top')).toContain('Crucifix');
    expect(fins('back-control', 'top')).toContain('Crucifix');
  });

  it('les enchaînements de la garde fermée existent (arm drag → armbar, flower sweep)', () => {
    const cg = sid('closed-guard', 'bottom');
    const drag = findItem(mapIndex, cg, techKey(moveId(cg, mapIndex.get('closed-guard')!.bottom!.moves.find((m) => m.techniques.some((t) => t.name === 'Arm drag to back'))!), 'Arm drag to back'))!;
    const names = itemThen(drag).map((r) => resolveRef(mapIndex, cg, r)).map((n) => (n?.type === 'item' ? (n.item.tech?.name ?? n.item.move.finish) : n?.id));
    expect(names).toEqual(expect.arrayContaining(['Armbar', 'Flower (pendulum) sweep']));
  });

  it('chaque soumission a des enchaînements valides', () => {
    expect(validateMap(bjjMap)).toEqual([]);
    const subs = bjjMap.positions.flatMap((p) => (['top', 'bottom'] as const).flatMap((r) => p[r]?.moves.filter((m) => m.kind === 'submission') ?? []));
    expect(subs.filter((m) => m.then?.length).length).toBeGreaterThan(subs.length * 0.8);
  });

  it('applique les corrections BJJ (demi-garde, side control, dogfight, SLX…)', () => {
    const names = (id: string, role: 'top' | 'bottom') =>
      mapIndex.get(id)![role]!.moves.flatMap((m) => m.techniques.map((t) => t.name));
    const hgTop = names('half-guard', 'top').join('|');
    expect(hgTop).not.toMatch(/Back take|Smash pass|high mount|Pressure pass/);
    expect(hgTop).toMatch(/Over-under pass/);
    expect(hgTop).toMatch(/Leg weave pass/);
    expect(mapIndex.get('half-guard')!.top!.moves.some((m) => m.kind === 'transition' && m.to === 'knee-on-belly:top')).toBe(false);
    const hgBottom = names('half-guard', 'bottom').join('|');
    expect(hgBottom).toMatch(/Enclave roll to turtle/);
    expect(hgBottom).toMatch(/Ninja roll/);
    expect(hgBottom).toMatch(/John Wayne/);
    expect(hgBottom).not.toMatch(/Dogfight sweep|Back take via underhook|Sweep to mount/);
    expect(names('dogfight', 'bottom').join('|')).toMatch(/Dive under sweep/);
    expect(mapIndex.get('half-guard')!.bottom!.moves.some((m) => m.to === 'dogfight:bottom')).toBe(true);
    const scBottom = mapIndex.get('side-control')!.bottom!;
    expect(scBottom.moves.some((m) => m.finish === 'Guillotine')).toBe(false);
    expect(names('side-control', 'bottom').join('|')).toMatch(/Stiff-arm hip escape/);
    expect(names('side-control', 'bottom').join('|')).not.toMatch(/Underhook reversal/);
    expect(names('k-guard', 'bottom').join('|')).toMatch(/Choi bar/);
    expect(names('de-la-riva', 'bottom').join('|')).toMatch(/De La X/);
    expect(names('de-la-riva', 'bottom').join('|')).toMatch(/Baby bolo/);
    expect(['short-x', 'false-x', 'truck', 'quarter-mount', 'dogfight'].every((id) => mapIndex.has(id))).toBe(true);
    const truckSubs = mapIndex.get('truck')!.top!.moves.map((m) => m.finish);
    expect(truckSubs).toEqual(expect.arrayContaining(['Calf slicer', 'Banana split', 'Twister']));
    expect(mapIndex.get('single-leg-x')!.top!.moves.some((m) => m.to === 'back-control:top')).toBe(true);
  });
});
