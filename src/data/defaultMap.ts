import raw from './map.json';
import { indexMap } from '../graph/model';
import type { BJJMap } from '../graph/types';

/**
 * Carte de référence (au sol uniquement), livrée avec l'application.
 * Pour l'enrichir : éditez map.json — `npm test` signale les erreurs de liens.
 */
export const bjjMap = raw as unknown as BJJMap;
export const mapIndex = indexMap(bjjMap);
