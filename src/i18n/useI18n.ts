import { useMemo } from 'react';
import { mapIndex, bjjMap } from '../data/defaultMap';
import { getSide, parseSid } from '../graph/model';
import type { Lang, Move, MoveKind, Position, Role, StateId, Technique } from '../graph/types';
import { useStore } from '../store/useStore';
import { plural, translate, type UiKey } from './ui';

const LEGLOCK_FR = 'Technique avancée : interdite dans de nombreuses compétitions selon le niveau';
const RISK_FR = 'Technique avancée à risque (colonne / aine) : interdite dans de nombreuses compétitions';

export function makeI18n(lang: Lang) {
  const pack = bjjMap.i18n?.[lang];

  const t = (key: UiKey, vars?: Record<string, string | number>): string => {
    const s = translate(lang, key, vars);
    return vars && typeof vars.n === 'number' ? plural(s, vars.n) : s;
  };

  return {
    lang,
    t,
    /** Nom de la position : anglais (terme universel) ou traduction. */
    posName: (p: Position): string => (lang === 'fr' ? p.nameFr : lang === 'en' ? p.name : (pack?.positions?.[p.id] ?? p.name)),
    /** Titre du côté (« Under mount », « Sous la montée »…). */
    sideTitle: (id: StateId): string => {
      const side = getSide(mapIndex, id);
      if (!side) return id;
      if (lang === 'fr') return side.titleFr;
      if (lang === 'en') return side.title;
      return pack?.sides?.[id]?.title ?? side.title;
    },
    sideSummary: (id: StateId): string => {
      const side = getSide(mapIndex, id);
      if (!side) return '';
      return lang === 'fr' ? side.summary : (pack?.sides?.[id]?.summary ?? side.summary);
    },
    finish: (m: Move): string => {
      const f = m.finish ?? '';
      if (lang === 'fr') return m.finishFr ?? f;
      if (lang === 'en') return f;
      return pack?.finishes?.[f] ?? f;
    },
    /** Note d'une technique : le français est la langue des notes ; l'avertissement leg lock est traduit. */
    note: (tech: Technique): string | undefined => {
      if (!tech.note) return undefined;
      if (tech.note === LEGLOCK_FR) return translate(lang, 'leglock');
      if (tech.note === RISK_FR) return translate(lang, 'riskylock');
      return tech.note;
    },
    kindLabel: (k: MoveKind) => translate(lang, `kind_${k}` as UiKey),
    kindShort: (k: MoveKind) => translate(lang, `short_${k}` as UiKey),
    roleSub: (r: Role) => translate(lang, r === 'top' ? 'above' : 'below'),
    /** Nom complet d'un état (position) à partir de son identifiant. */
    stateName: (id: StateId): string => {
      const p = parseSid(id);
      const pos = p ? mapIndex.get(p.position) : undefined;
      if (!pos) return id;
      return lang === 'fr' ? pos.nameFr : lang === 'en' ? pos.name : (pack?.positions?.[pos.id] ?? pos.name);
    },
  };
}

export type I18n = ReturnType<typeof makeI18n>;

export function useI18n(): I18n {
  const lang = useStore((s) => s.lang);
  return useMemo(() => makeI18n(lang), [lang]);
}
