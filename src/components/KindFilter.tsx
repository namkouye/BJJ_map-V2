import { bjjMap, mapIndex } from '../data/defaultMap';
import { KIND_COLORS, KIND_ORDER } from '../graph/labels';
import { countKinds, getSide, roleMoves } from '../graph/model';
import { useI18n } from '../i18n/useI18n';
import { useStore } from '../store/useStore';

/**
 * Boutons de filtre : afficher seulement certains types de mouvements
 * (ex. uniquement les soumissions, ou progressions + soumissions).
 */
export function KindFilter() {
  const { t, kindShort } = useI18n();
  const role = useStore((s) => s.role);
  const selected = useStore((s) => s.selected);
  const kindFilter = useStore((s) => s.kindFilter);
  const toggleKind = useStore((s) => s.toggleKind);
  const clearKinds = useStore((s) => s.clearKinds);

  const side = selected ? getSide(mapIndex, selected) : undefined;
  const counts = countKinds(side ? side.moves : roleMoves(bjjMap, role));
  const kinds = KIND_ORDER.filter((k) => counts[k]);

  return (
    <div className="kind-filter" role="group" aria-label={t('moveTypes')}>
      <button
        type="button"
        className={`kchip ${kindFilter.length === 0 ? 'on' : ''}`}
        aria-pressed={kindFilter.length === 0}
        onClick={clearKinds}
      >
        {t('all')}
      </button>
      {kinds.map((k) => {
        const on = kindFilter.includes(k);
        return (
          <button
            key={k}
            type="button"
            className={`kchip ${on ? 'on' : ''}`}
            style={{ ['--c' as string]: KIND_COLORS[k] }}
            aria-pressed={on}
            onClick={() => toggleKind(k)}
          >
            {kindShort(k)} <span className="kcount">{counts[k]}</span>
          </button>
        );
      })}
    </div>
  );
}
