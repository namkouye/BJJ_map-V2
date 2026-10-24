import type { Family, MoveKind, Role } from './types';

export const ROLES: Role[] = ['top', 'bottom'];

export const ROLE_LABELS: Record<Role, string> = { top: 'On top', bottom: 'On bottom' };
export const ROLE_LABELS_FR: Record<Role, string> = { top: 'Dessus', bottom: 'Dessous' };
export const GAME_LABELS: Record<Role, string> = { top: 'Game top', bottom: 'Game bottom' };
export const ROLE_COLORS: Record<Role, string> = { top: '#38bdf8', bottom: '#fb923c' };

/** Ordre d'affichage autour de la position centrale. */
export const KIND_ORDER: MoveKind[] = ['pass', 'sweep', 'transition', 'escape', 'submission'];

export const KIND_LABELS: Record<MoveKind, string> = {
  pass: 'Passage de garde',
  sweep: 'Balayage',
  transition: 'Progression',
  escape: 'Évasion / récupération',
  submission: 'Soumission',
};

export const KIND_SHORT: Record<MoveKind, string> = {
  pass: 'Passage',
  sweep: 'Balayage',
  transition: 'Progression',
  escape: 'Évasion',
  submission: 'Soumission',
};

export const KIND_COLORS: Record<MoveKind, string> = {
  pass: '#60a5fa',
  sweep: '#fbbf24',
  transition: '#a78bfa',
  escape: '#4ade80',
  submission: '#f87171',
};

export const FAMILY_COLORS: Record<Family, string> = {
  guard: '#a78bfa',
  passing: '#fb923c',
  dominant: '#38bdf8',
  scramble: '#94a3b8',
};

export const FAMILY_LABELS: Record<Family, string> = {
  guard: 'Gardes',
  passing: 'Passage',
  dominant: 'Positions dominantes',
  scramble: 'Transitions',
};
