import { memo, useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { bjjMap, mapIndex } from '../data/defaultMap';
import {
  FAMILY_COLORS,
  GAME_LABELS,
  KIND_COLORS,
  KIND_ORDER,
  KIND_SHORT,
  ROLE_COLORS,
  ROLE_LABELS,
} from '../graph/labels';
import {
  entryTarget,
  gameEntries,
  getSide,
  layerGame,
  matchesKinds,
  moveId,
  overviewEdges,
  parseSid,
  pickedTechniques,
  sid,
} from '../graph/model';
import type { MoveKind, Role, StateId } from '../graph/types';
import { useActiveProfile, useStore } from '../store/useStore';
import { KindFilter } from './KindFilter';
import { RoleToggle } from './RoleToggle';

const NODE_W = 184;
const NODE_H = 62;

/* ------------------------------------------------------------------ */
/* Nœud                                                                */
/* ------------------------------------------------------------------ */

interface MapNodeData extends Record<string, unknown> {
  title: string;
  subtitle?: string;
  color: string;
  variant: 'center' | 'sat' | 'finish' | 'pos' | 'game';
  chip?: string;
  chipColor?: string;
  stars?: number;
  start?: boolean;
  dashed?: boolean;
  faded?: boolean;
  selected?: boolean;
  /** état à sélectionner au clic */
  target?: StateId;
}
type MapFlowNode = Node<MapNodeData, 'map'>;

const SIDES = [
  ['l', Position.Left],
  ['r', Position.Right],
  ['t', Position.Top],
  ['b', Position.Bottom],
] as const;

const MapNode = memo(function MapNode({ data }: NodeProps<MapFlowNode>) {
  const d = data;
  return (
    <div
      className={`map-node ${d.variant} ${d.dashed ? 'dashed' : ''} ${d.faded ? 'faded' : ''} ${d.selected ? 'selected' : ''} ${d.target ? 'clickable' : ''}`}
      style={{ borderColor: d.color }}
    >
      {SIDES.map(([k, p]) => (
        <Handle key={`s${k}`} id={`s-${k}`} type="source" position={p} className="handle" />
      ))}
      {SIDES.map(([k, p]) => (
        <Handle key={`t${k}`} id={`t-${k}`} type="target" position={p} className="handle" />
      ))}
      {d.start && <span className="start-flag">Départ</span>}
      <div className="map-node-title">{d.title}</div>
      {d.subtitle && <div className="map-node-sub">{d.subtitle}</div>}
      <div className="map-node-meta">
        {d.chip && (
          <span className="map-chip" style={{ background: d.chipColor ?? d.color }}>
            {d.chip}
          </span>
        )}
        {!!d.stars && <span className="map-stars">★ {d.stars}</span>}
      </div>
    </div>
  );
});
const nodeTypes = { map: MapNode };

/* ------------------------------------------------------------------ */
/* Arêtes                                                              */
/* ------------------------------------------------------------------ */

type Pos = { x: number; y: number };

function faceHandles(from: Pos, to: Pos): [string, string] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy) * 1.25) return dx > 0 ? ['s-r', 't-l'] : ['s-l', 't-r'];
  return dy > 0 ? ['s-b', 't-t'] : ['s-t', 't-b'];
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  color: string,
  opts: { handles?: [string, string]; label?: string; width?: number; opacity?: number; animated?: boolean } = {},
): Edge {
  const [sh, th] = opts.handles ?? ['s-r', 't-l'];
  return {
    id,
    source,
    target,
    sourceHandle: sh,
    targetHandle: th,
    animated: opts.animated,
    label: opts.label,
    labelStyle: { fill: '#e2e8f0', fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: '#0f172a', fillOpacity: 0.95 },
    labelBgPadding: [5, 3] as [number, number],
    labelBgBorderRadius: 5,
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
    style: { stroke: color, strokeWidth: opts.width ?? 2, opacity: opts.opacity ?? 1 },
  };
}

/* ------------------------------------------------------------------ */
/* Dispositions                                                        */
/* ------------------------------------------------------------------ */

/** Vue d'ensemble : les nœuds sont plus compacts pour faire tenir toutes les positions. */
const OV_W = 150;
const OV_H = 58;

/** Disposition large : gardes à gauche, passage au centre, positions dominantes à droite. */
const OVERVIEW_POS: Record<string, { col: number; row: number }> = {
  'closed-guard': { col: 0, row: 0 },
  'half-guard': { col: 0, row: 1 },
  'knee-shield': { col: 0, row: 2 },
  'deep-half-guard': { col: 0, row: 3 },
  'butterfly-guard': { col: 0, row: 4 },
  'de-la-riva': { col: 1, row: 0 },
  'reverse-de-la-riva': { col: 1, row: 1 },
  'spider-guard': { col: 1, row: 2 },
  'lasso-guard': { col: 1, row: 3 },
  'collar-sleeve-guard': { col: 1, row: 4 },
  'x-guard': { col: 2, row: 0.4 },
  'single-leg-x': { col: 2, row: 1.5 },
  saddle: { col: 2, row: 2.6 },
  'fifty-fifty': { col: 2, row: 3.7 },
  headquarters: { col: 3, row: 1.5 },
  turtle: { col: 3, row: 3.4 },
  'front-headlock': { col: 3, row: 4.4 },
  'side-control': { col: 4, row: 0 },
  'kesa-gatame': { col: 4, row: 1.1 },
  'north-south': { col: 4, row: 2.2 },
  'knee-on-belly': { col: 4, row: 3.3 },
  mount: { col: 5, row: 0.8 },
  'back-control': { col: 5, row: 2.8 },
};

/** Variante portrait (téléphone) : deux colonnes, la carte se parcourt en la faisant glisser. */
const COMPACT_ORDER_LEFT = [
  'closed-guard', 'half-guard', 'knee-shield', 'deep-half-guard', 'butterfly-guard',
  'de-la-riva', 'reverse-de-la-riva', 'spider-guard', 'lasso-guard', 'collar-sleeve-guard',
  'x-guard', 'single-leg-x', 'saddle', 'fifty-fifty',
];
const COMPACT_ORDER_RIGHT = [
  'headquarters', 'side-control', 'kesa-gatame', 'north-south', 'knee-on-belly',
  'mount', 'back-control', 'turtle', 'front-headlock',
];
const OVERVIEW_POS_COMPACT: Record<string, { col: number; row: number }> = {
  ...Object.fromEntries(COMPACT_ORDER_LEFT.map((id, row) => [id, { col: 0, row }])),
  ...Object.fromEntries(COMPACT_ORDER_RIGHT.map((id, row) => [id, { col: 1, row }])),
};

function overviewPosition(id: string, fallbackIndex: number, compact: boolean): Pos {
  const table = compact ? OVERVIEW_POS_COMPACT : OVERVIEW_POS;
  const p = table[id] ?? { col: compact ? 2 : 6, row: fallbackIndex };
  return compact
    ? { x: p.col * (OV_W + 70), y: p.row * (OV_H + 44) }
    : { x: p.col * (OV_W + 90), y: p.row * (OV_H + 36) };
}

const COMPACT_QUERY = '(max-width: 700px)';
function useCompact(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(COMPACT_QUERY);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia(COMPACT_QUERY).matches,
    () => false,
  );
}

interface Sat {
  key: string;
  kind: MoveKind;
  to?: StateId;
  finish?: string;
  finishFr?: string;
  stars: number;
}

/* ------------------------------------------------------------------ */

function Inner() {
  const mode = useStore((s) => s.mode);
  const role = useStore((s) => s.role);
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  const setMode = useStore((s) => s.setMode);
  const profile = useActiveProfile();
  const { fitView, setViewport } = useReactFlow();
  const compact = useCompact();
  const kindFilter = useStore((s) => s.kindFilter);

  const view: 'overview' | 'focus' | 'game' =
    mode === 'game' ? 'game' : selected && getSide(mapIndex, selected) ? 'focus' : 'overview';

  const { nodes, edges, empty } = useMemo(() => {
    const nodes: MapFlowNode[] = [];
    const edges: Edge[] = [];
    let empty = false;

    if (view === 'focus') {
      const centerId = selected!;
      const cp = parseSid(centerId)!;
      const pos = mapIndex.get(cp.position)!;
      const side = getSide(mapIndex, centerId)!;

      const sats: Sat[] = [];
      for (const m of side.moves) {
        if (!matchesKinds(m.kind, kindFilter)) continue;
        const mid = moveId(centerId, m);
        const stars = pickedTechniques(profile, mid, m).length;
        sats.push({
          key: `${m.kind}:${m.to ?? `fin-${m.finish}`}`,
          kind: m.kind,
          to: m.to,
          finish: m.finish,
          finishFr: m.finishFr,
          stars,
        });
      }
      sats.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));

      nodes.push({
        id: centerId,
        type: 'map',
        position: { x: -NODE_W / 2 - 16, y: -NODE_H / 2 - 8 },
        draggable: false,
        data: {
          title: pos.name,
          subtitle: side.titleFr,
          color: ROLE_COLORS[cp.role],
          variant: 'center',
          chip: ROLE_LABELS[cp.role],
          chipColor: ROLE_COLORS[cp.role],
        },
      });

      const n = sats.length;
      const r = Math.max(250, (n * (NODE_W + 28)) / (2 * Math.PI));
      const rx = compact ? r * 0.64 : r * 1.25;
      const ry = compact ? r * 1.25 : r * 0.82;
      const center: Pos = { x: 0, y: 0 };

      sats.forEach((s, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const p: Pos = { x: Math.cos(angle) * rx, y: Math.sin(angle) * ry };
        const color = KIND_COLORS[s.kind];
        const dest = s.to ? parseSid(s.to) : null;
        const destPos = dest ? mapIndex.get(dest.position) : undefined;
        const destSide = s.to ? getSide(mapIndex, s.to) : undefined;
        nodes.push({
          id: s.key,
          type: 'map',
          position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 },
          draggable: false,
          data: s.to
            ? {
                title: destPos?.name ?? s.to,
                subtitle: destSide?.titleFr,
                color,
                variant: 'sat',
                chip: KIND_SHORT[s.kind],
                chipColor: color,
                stars: s.stars,
                target: s.to,
              }
            : {
                title: s.finish ?? 'Soumission',
                subtitle: s.finishFr,
                color,
                variant: 'finish',
                chip: KIND_SHORT[s.kind],
                chipColor: color,
                stars: s.stars,
              },
        });
        edges.push(
          makeEdge(`e-${s.key}`, centerId, s.key, color, {
            handles: faceHandles(center, p),
            width: s.stars ? 3.2 : 2,
          }),
        );
      });
    } else if (view === 'overview') {
      bjjMap.positions.forEach((p, i) => {
        const side = p[role];
        const shown = side ? side.moves.filter((m) => matchesKinds(m.kind, kindFilter)).length : 0;
        const target = side ? sid(p.id, role) : sid(p.id, role === 'top' ? 'bottom' : 'top');
        nodes.push({
          id: p.id,
          type: 'map',
          position: overviewPosition(p.id, i, compact),
          draggable: false,
          data: {
            title: p.name,
            subtitle: p.nameFr,
            color: FAMILY_COLORS[p.family],
            variant: 'pos',
            chip: side ? `${shown} option${shown > 1 ? 's' : ''}` : undefined,
            chipColor: '#cbd5e1',
            faded: kindFilter.length > 0 && shown === 0,
            target,
          },
        });
      });
      for (const e of overviewEdges(bjjMap, role, kindFilter)) {
        const a = overviewPosition(e.from, 0, compact);
        const b = overviewPosition(e.to, 0, compact);
        const color = KIND_COLORS[e.kinds[0]];
        const handles: [string, string] =
          Math.abs(a.x - b.x) < 5 ? ['s-r', 't-r'] : a.x < b.x ? ['s-r', 't-l'] : ['s-l', 't-r'];
        edges.push(makeEdge(`o-${e.from}-${e.to}`, e.from, e.to, color, { handles, width: kindFilter.length ? 2 : 1.3, opacity: kindFilter.length ? 0.75 : 0.4 }));
      }
    } else {
      const entries = gameEntries(bjjMap, profile, role);
      empty = entries.length === 0;
      const start = profile.starts[role];
      const depth = layerGame(entries, start);
      const labels = new Map<string, { title: string; subtitle?: string; stateRole?: Role; finish?: boolean }>();
      for (const e of entries) {
        const f = parseSid(e.from)!;
        labels.set(e.from, {
          title: mapIndex.get(f.position)?.name ?? e.from,
          subtitle: getSide(mapIndex, e.from)?.titleFr,
          stateRole: f.role,
        });
        const t = entryTarget(e);
        if (e.move.to) {
          const d = parseSid(e.move.to)!;
          if (!labels.has(t))
            labels.set(t, {
              title: mapIndex.get(d.position)?.name ?? t,
              subtitle: getSide(mapIndex, t)?.titleFr,
              stateRole: d.role,
            });
        } else {
          labels.set(t, { title: e.move.finish ?? 'Soumission', subtitle: e.move.finishFr, finish: true });
        }
      }
      // colonnes par profondeur
      const columns = new Map<number, string[]>();
      for (const [id, d] of depth) columns.set(d, [...(columns.get(d) ?? []), id]);
      const sources = new Set(entries.map((e) => e.from));
      for (const [d, ids] of columns) {
        const total = ids.length * NODE_H + (ids.length - 1) * 28;
        ids.forEach((id, i) => {
          const l = labels.get(id)!;
          const stars = entries.filter((e) => e.from === id).reduce((a, e) => a + e.names.length, 0);
          const otherSide = !l.finish && l.stateRole !== role && !sources.has(id);
          nodes.push({
            id,
            type: 'map',
            position: { x: d * (NODE_W + 130), y: -total / 2 + i * (NODE_H + 28) },
            draggable: false,
            data: {
              title: l.title,
              subtitle: l.subtitle,
              color: l.finish ? KIND_COLORS.submission : l.stateRole ? ROLE_COLORS[l.stateRole] : '#94a3b8',
              variant: l.finish ? 'finish' : 'game',
              chip: l.finish ? 'Soumission' : otherSide ? `↪ ${GAME_LABELS[l.stateRole!]}` : undefined,
              chipColor: l.finish ? KIND_COLORS.submission : ROLE_COLORS[l.stateRole ?? role],
              start: id === start,
              dashed: otherSide,
              selected: id === selected,
              stars: stars || undefined,
              target: l.finish ? undefined : id,
            },
          });
        });
      }
      for (const e of entries) {
        const label = e.names.length > 2 ? `${e.names.slice(0, 2).join(' · ')} +${e.names.length - 2}` : e.names.join(' · ');
        edges.push(makeEdge(`g-${e.id}`, e.from, entryTarget(e), KIND_COLORS[e.move.kind], { label, width: 2.4 }));
      }
    }
    return { nodes, edges, empty };
  }, [view, selected, role, profile, compact, kindFilter]);

  // Recadre la vue quand le mode, la sélection ou le contenu change.
  const viewKey = `${compact ? 'c' : 'w'}:${kindFilter.join('+')}:${view}:${view === 'focus' ? selected : ''}:${view === 'overview' || view === 'game' ? role : ''}:${nodes.length}`;
  useEffect(() => {
    const t = setTimeout(() => {
      if (view === 'overview' && compact) {
        const zoom = Math.min(1, (window.innerWidth - 24) / (2 * OV_W + 70));
        setViewport({ x: 12, y: 200, zoom }, { duration: 300 });
      } else {
        fitView({ padding: { top: compact ? '190px' : '175px', bottom: '50px', left: '30px', right: '30px' }, maxZoom: 1.05, duration: 300 });
      }
    }, 60);
    return () => clearTimeout(t);
  }, [viewKey, view, compact, fitView, setViewport]);

  const selectedParsed = selected ? parseSid(selected) : null;

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        onNodeClick={(_, n) => {
          const target = (n.data as MapNodeData).target;
          if (target) select(target);
        }}
        onPaneClick={() => view === 'focus' && select(null)}
        minZoom={0.15}
        maxZoom={2}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        fitView
      >
        <Background gap={24} color={role === 'top' ? '#1d3a63' : '#4a2f1c'} />
        <Controls showInteractive={false} />
      </ReactFlow>

      <div className="graph-top">
        <RoleToggle />
        {view !== 'game' && <KindFilter />}
        {view === 'focus' && (
          <div className="pill">
            <span>
              {mapIndex.get(selectedParsed!.position)?.name} · {ROLE_LABELS[selectedParsed!.role]}
            </span>
            <button className="btn small" onClick={() => select(null)}>
              Vue d'ensemble
            </button>
          </div>
        )}
        {view === 'overview' && (
          <div className="pill hint">Touchez une position pour voir toutes ses possibilités</div>
        )}
        {view === 'game' && (
          <div className="pill">
            <span>
              {GAME_LABELS[role]} · <strong>{profile.name}</strong>
            </span>
          </div>
        )}
      </div>

      {view === 'game' && empty && (
        <div className="empty-overlay">
          <strong>Votre {GAME_LABELS[role].toLowerCase()} est vide.</strong>
          <p>
            Choisissez une position de départ dans le panneau, puis étoilez vos techniques
            favorites en explorant la carte.
          </p>
          <button className="btn primary" onClick={() => setMode('explore')}>
            Explorer la carte
          </button>
        </div>
      )}

      <div className="legend" aria-hidden>
        {KIND_ORDER.map((k) => (
          <span key={k}>
            <i style={{ background: KIND_COLORS[k] }} />
            {KIND_SHORT[k]}
          </span>
        ))}
      </div>
    </>
  );
}

export function MapView() {
  return (
    <div className="graph-wrap">
      <ReactFlowProvider>
        <Inner />
      </ReactFlowProvider>
    </div>
  );
}
