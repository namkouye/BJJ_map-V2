/**
 * Modèle de données : des POSITIONS vues depuis deux côtés (dessus / dessous).
 *
 * Un "état" = une position + le côté où l'on se trouve. Exemple : "closed-guard:bottom"
 * (je suis dans ma garde fermée) ou "closed-guard:top" (je suis dans la garde fermée
 * de l'adversaire). Les mouvements sont toujours écrits du point de vue du joueur :
 * après un balayage depuis la garde fermée (bottom), je me retrouve "mount:top".
 */

export type Role = 'top' | 'bottom';

/** `${positionId}:${role}` */
export type StateId = string;

export type MoveKind = 'pass' | 'sweep' | 'transition' | 'escape' | 'submission';

export type Family = 'guard' | 'passing' | 'dominant' | 'scramble';

export interface Technique {
  name: string;
  /** Explication courte (français) pour les débutants */
  note?: string;
}

/**
 * Un mouvement possible depuis un état.
 * - Non-soumission : `to` est l'état d'arrivée.
 * - Soumission : `finish` est le nom de la finition (pas d'état d'arrivée).
 */
export interface Move {
  kind: MoveKind;
  to?: StateId;
  finish?: string;
  finishFr?: string;
  techniques: Technique[];
}

export interface PositionSide {
  /** Nom de la position vue de ce côté (ex : "Headquarters (HQ)") */
  title: string;
  titleFr: string;
  summary: string;
  moves: Move[];
}

export interface Position {
  id: string;
  name: string;
  nameFr: string;
  family: Family;
  top?: PositionSide;
  bottom?: PositionSide;
}

export interface BJJMap {
  version: number;
  positions: Position[];
}

/** Un "jeu" personnel : techniques favorites + positions de départ. */
export interface Profile {
  id: string;
  name: string;
  /** Position de départ de mon game top / de mon game bottom */
  starts: Partial<Record<Role, StateId>>;
  /** Clés de techniques choisies (voir techKey) */
  picks: string[];
  /** Techniques ajoutées par l'utilisateur : moveId -> noms */
  custom: Record<string, string[]>;
}

export interface ProfilesExport {
  app: 'bjj-game-map';
  kind: 'profiles';
  exportedAt: string;
  profiles: Profile[];
}
