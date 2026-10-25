import type { Lang } from '../graph/types';

export const LANGS: Array<{ id: Lang; short: string; name: string }> = [
  { id: 'fr', short: 'FR', name: 'Français' },
  { id: 'en', short: 'EN', name: 'English' },
  { id: 'es', short: 'ES', name: 'Español' },
  { id: 'pt', short: 'PT', name: 'Português' },
];

const IDX: Record<Lang, number> = { fr: 0, en: 1, es: 2, pt: 3 };

/** [fr, en, es, pt] ; {x} = variable */
const D = {
  modeExplore: ['Explorer', 'Explore', 'Explorar', 'Explorar'],
  modeGame: ['Mon jeu', 'My game', 'Mi juego', 'Meu jogo'],
  mode: ['Mode', 'Mode', 'Modo', 'Modo'],
  data: ['Données', 'Data', 'Datos', 'Dados'],
  tabMap: ['Carte', 'Map', 'Mapa', 'Mapa'],
  tabDetail: ['Détail', 'Details', 'Detalle', 'Detalhe'],
  sections: ['Sections', 'Sections', 'Secciones', 'Seções'],
  language: ['Langue', 'Language', 'Idioma', 'Idioma'],
  activeProfileTitle: ['Profil actif', 'Active profile', 'Perfil activo', 'Perfil ativo'],

  viewpoint: ['Point de vue', 'Viewpoint', 'Punto de vista', 'Ponto de vista'],
  above: ['Dessus', 'Above', 'Arriba', 'Por cima'],
  below: ['Dessous', 'Below', 'Abajo', 'Por baixo'],

  kind_pass: ['Passage de garde', 'Guard pass', 'Pase de guardia', 'Passagem de guarda'],
  kind_sweep: ['Balayage', 'Sweep', 'Barrida', 'Raspagem'],
  kind_transition: ['Progression', 'Progression', 'Progresión', 'Progressão'],
  kind_escape: ['Évasion / récupération', 'Escape / recovery', 'Escape / recuperación', 'Fuga / recuperação'],
  kind_submission: ['Soumission', 'Submission', 'Sumisión', 'Finalização'],
  short_pass: ['Passage', 'Pass', 'Pase', 'Passagem'],
  short_sweep: ['Balayage', 'Sweep', 'Barrida', 'Raspagem'],
  short_transition: ['Progression', 'Progression', 'Progresión', 'Progressão'],
  short_escape: ['Évasion', 'Escape', 'Escape', 'Fuga'],
  short_submission: ['Soumission', 'Submission', 'Sumisión', 'Finalização'],

  all: ['Tout', 'All', 'Todo', 'Tudo'],
  moveTypes: ['Types de mouvements', 'Move types', 'Tipos de movimiento', 'Tipos de movimento'],
  filterActive: ['Filtre actif :', 'Active filter:', 'Filtro activo:', 'Filtro ativo:'],
  showAll: ['Tout afficher', 'Show all', 'Mostrar todo', 'Mostrar tudo'],

  start: ['Départ', 'Start', 'Inicio', 'Início'],
  overviewHint: [
    'Touchez une position pour voir toutes ses possibilités',
    'Tap a position to see all its options',
    'Toca una posición para ver todas sus opciones',
    'Toque numa posição para ver todas as opções',
  ],
  overviewBtn: ["Vue d'ensemble", 'Overview', 'Vista general', 'Visão geral'],
  options: ['{n} option(s)', '{n} option(s)', '{n} opción(es)', '{n} opção(ões)'],
  emptyGame: ['Votre {game} est vide.', 'Your {game} is empty.', 'Tu {game} está vacío.', 'Seu {game} está vazio.'],
  emptyGameHelp: [
    'Choisissez une position de départ dans le panneau, puis étoilez vos techniques favorites en explorant la carte.',
    'Pick a starting position in the panel, then star your favourite techniques while exploring the map.',
    'Elige una posición de inicio en el panel y marca tus técnicas favoritas explorando el mapa.',
    'Escolha uma posição inicial no painel e marque suas técnicas favoritas explorando o mapa.',
  ],
  exploreMap: ['Explorer la carte', 'Explore the map', 'Explorar el mapa', 'Explorar o mapa'],
  backTo: ['Retour', 'Back', 'Volver', 'Voltar'],
  result: ['Résultat', 'Result', 'Resultado', 'Resultado'],
  ifItFails: ['Sinon / en cas d\'échec', 'Otherwise / if it fails', 'Si no / si falla', 'Senão / se falhar'],
  technique: ['Technique', 'Technique', 'Técnica', 'Técnica'],
  leaveItem: ['Retour à la position', 'Back to position', 'Volver a la posición', 'Voltar à posição'],

  howTitle: ['Comment ça marche', 'How it works', 'Cómo funciona', 'Como funciona'],
  how1: ['Touchez une position sur la carte.', 'Tap a position on the map.', 'Toca una posición en el mapa.', 'Toque numa posição no mapa.'],
  how2: [
    'Choisissez votre point de vue avec le curseur On top / On bottom.',
    'Pick your viewpoint with the On top / On bottom switch.',
    'Elige tu punto de vista con el selector On top / On bottom.',
    'Escolha seu ponto de vista com o seletor On top / On bottom.',
  ],
  how3: [
    'La position passe au centre : toutes vos techniques apparaissent autour.',
    'The position moves to the centre: all your techniques appear around it.',
    'La posición pasa al centro: todas tus técnicas aparecen alrededor.',
    'A posição vai para o centro: todas as suas técnicas aparecem em volta.',
  ],
  how4: [
    "Touchez une technique ou une soumission pour voir ce qui se passe ensuite (et ses plans B), et étoilez vos préférées pour bâtir votre jeu.",
    'Tap a technique or a submission to see what comes next (and its plan Bs), and star your favourites to build your game.',
    'Toca una técnica o sumisión para ver qué pasa después (y sus planes B) y marca tus favoritas para construir tu juego.',
    'Toque numa técnica ou finalização para ver o que vem depois (e seus planos B) e marque as favoritas para montar seu jogo.',
  ],
  seeSide: ['Voir côté {role}', 'See {role} side', 'Ver lado {role}', 'Ver lado {role}'],
  setStart: ['Définir comme départ ({game})', 'Set as start ({game})', 'Definir como inicio ({game})', 'Definir como início ({game})'],
  isStart: ['✓ Départ de mon {game}', '✓ Start of my {game}', '✓ Inicio de mi {game}', '✓ Início do meu {game}'],
  noOptions: ['Aucune option depuis cette position.', 'No options from this position.', 'Ninguna opción desde esta posición.', 'Nenhuma opção a partir desta posição.'],
  noOptionsKind: ['Aucune option de ce type depuis cette position.', 'No option of this type from this position.', 'Ninguna opción de este tipo desde esta posición.', 'Nenhuma opção deste tipo a partir desta posição.'],
  techniqueCount: ['{n} technique(s)', '{n} technique(s)', '{n} técnica(s)', '{n} técnica(s)'],
  addOwn: ['Ajouter ma propre technique…', 'Add my own technique…', 'Añadir mi propia técnica…', 'Adicionar minha própria técnica…'],
  myTechnique: ['Ma technique', 'My technique', 'Mi técnica', 'Minha técnica'],
  starHint: [
    "☆ Étoilez une technique pour l'ajouter au profil « {name} ».",
    '☆ Star a technique to add it to the “{name}” profile.',
    '☆ Marca una técnica para añadirla al perfil «{name}».',
    '☆ Marque uma técnica para adicioná-la ao perfil “{name}”.',
  ],
  addToGame: ['Ajouter « {name} » à mon jeu', 'Add “{name}” to my game', 'Añadir «{name}» a mi juego', 'Adicionar “{name}” ao meu jogo'],
  removeFromGame: ['Retirer « {name} » de mon jeu', 'Remove “{name}” from my game', 'Quitar «{name}» de mi juego', 'Remover “{name}” do meu jogo'],
  delete: ['Supprimer « {name} »', 'Delete “{name}”', 'Eliminar «{name}»', 'Excluir “{name}”'],
  leglock: [
    'Technique avancée : interdite dans de nombreuses compétitions selon le niveau',
    'Advanced technique: banned in many competitions depending on the level',
    'Técnica avanzada: prohibida en muchas competiciones según el nivel',
    'Técnica avançada: proibida em muitas competições conforme o nível',
  ],
  noteFrOnly: ['', 'Note in French', 'Nota en francés', 'Nota em francês'],

  profile: ['Profil actif', 'Active profile', 'Perfil activo', 'Perfil ativo'],
  newProfile: ['+ Nouveau', '+ New', '+ Nuevo', '+ Novo'],
  rename: ['Renommer', 'Rename', 'Renombrar', 'Renomear'],
  duplicate: ['Dupliquer', 'Duplicate', 'Duplicar', 'Duplicar'],
  deleteBtn: ['Supprimer', 'Delete', 'Eliminar', 'Excluir'],
  promptNew: [
    'Nom du nouveau profil (ex : Jeu compétition, Jeu no-gi)',
    'Name of the new profile (e.g. Competition game, No-gi game)',
    'Nombre del nuevo perfil (p. ej. Juego de competición, Juego no-gi)',
    'Nome do novo perfil (ex.: Jogo de competição, Jogo no-gi)',
  ],
  promptRename: ['Nouveau nom du profil', 'New profile name', 'Nuevo nombre del perfil', 'Novo nome do perfil'],
  confirmDelete: ['Supprimer le profil « {name} » ?', 'Delete the profile “{name}”?', '¿Eliminar el perfil «{name}»?', 'Excluir o perfil “{name}”?'],
  statTop: ['techniques en game top', 'techniques in game top', 'técnicas en game top', 'técnicas no game top'],
  statBottom: ['techniques en game bottom', 'techniques in game bottom', 'técnicas en game bottom', 'técnicas no game bottom'],
  startOf: ['Départ du {game}', 'Start of the {game}', 'Inicio del {game}', 'Início do {game}'],
  choosePos: ['— Choisir une position —', '— Choose a position —', '— Elegir una posición —', '— Escolher uma posição —'],
  continueBuild: ['Continuer à construire depuis le départ', 'Keep building from the start', 'Seguir construyendo desde el inicio', 'Continuar montando a partir do início'],
  startBuild: ['Construire depuis cette position', 'Build from this position', 'Construir desde esta posición', 'Montar a partir desta posição'],
  myTechs: ['Mes techniques ({game})', 'My techniques ({game})', 'Mis técnicas ({game})', 'Minhas técnicas ({game})'],
  gameEmpty: [
    "Rien pour l'instant. Choisissez un départ, puis étoilez vos techniques en explorant : chaque étoile ajoute une flèche à votre carte.",
    'Nothing yet. Pick a start, then star techniques while exploring: each star adds an arrow to your map.',
    'Nada por ahora. Elige un inicio y marca técnicas explorando: cada estrella añade una flecha a tu mapa.',
    'Nada por enquanto. Escolha um início e marque técnicas explorando: cada estrela adiciona uma seta ao seu mapa.',
  ],
  continueOther: [
    'Les destinations marquées « ↪ » sur la carte se continuent dans l\'autre côté ({game}).',
    'Destinations marked “↪” on the map continue on the other side ({game}).',
    'Los destinos marcados con «↪» en el mapa continúan en el otro lado ({game}).',
    'Os destinos marcados com “↪” no mapa continuam no outro lado ({game}).',
  ],

  myData: ['Mes données', 'My data', 'Mis datos', 'Meus dados'],
  dataIntro: [
    'Vos profils ({n}) sont stockés uniquement sur cet appareil. Exportez-les pour les sauvegarder ou les transférer vers un autre appareil.',
    'Your profiles ({n}) are stored only on this device. Export them to back them up or move them to another device.',
    'Tus perfiles ({n}) se guardan solo en este dispositivo. Expórtalos para guardarlos o pasarlos a otro dispositivo.',
    'Seus perfis ({n}) ficam salvos apenas neste aparelho. Exporte-os para fazer backup ou levá-los a outro aparelho.',
  ],
  exportBtn: ['Exporter mes profils', 'Export my profiles', 'Exportar mis perfiles', 'Exportar meus perfis'],
  importBtn: ['Importer des profils (JSON)', 'Import profiles (JSON)', 'Importar perfiles (JSON)', 'Importar perfis (JSON)'],
  installBtn: ["Installer l'application", 'Install the app', 'Instalar la aplicación', 'Instalar o aplicativo'],
  exported: ['Export téléchargé.', 'Export downloaded.', 'Exportación descargada.', 'Exportação baixada.'],
  imported: [
    'Profils importés : ils ont été ajoutés à vos profils.',
    'Profiles imported: they were added to your profiles.',
    'Perfiles importados: se añadieron a tus perfiles.',
    'Perfis importados: foram adicionados aos seus perfis.',
  ],
  badJson: ['Fichier JSON illisible.', 'Unreadable JSON file.', 'Archivo JSON ilegible.', 'Arquivo JSON ilegível.'],
  resetZone: ['Zone de réinitialisation', 'Reset zone', 'Zona de reinicio', 'Zona de redefinição'],
  resetBtn: ['Effacer tous mes profils', 'Erase all my profiles', 'Borrar todos mis perfiles', 'Apagar todos os meus perfis'],
  resetConfirm: [
    'Supprimer TOUS vos profils et repartir de zéro ?',
    'Delete ALL your profiles and start over?',
    '¿Eliminar TODOS tus perfiles y empezar de cero?',
    'Excluir TODOS os seus perfis e recomeçar do zero?',
  ],
  close: ['Fermer', 'Close', 'Cerrar', 'Fechar'],
  updateAvail: ['Une nouvelle version est disponible.', 'A new version is available.', 'Hay una nueva versión disponible.', 'Há uma nova versão disponível.'],
  offlineReady: ['Application prête : elle fonctionne hors-ligne.', 'App ready: it works offline.', 'Aplicación lista: funciona sin conexión.', 'Aplicativo pronto: funciona offline.'],
  update: ['Mettre à jour', 'Update', 'Actualizar', 'Atualizar'],
} as const;

export type UiKey = keyof typeof D;

export function translate(lang: Lang, key: UiKey, vars?: Record<string, string | number>): string {
  const entry = D[key] as readonly string[];
  let s = entry[IDX[lang]] || entry[0];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

/** « 3 technique(s) » → pluriel simple selon le nombre. */
export function plural(s: string, n: number): string {
  return s.replace(/\(([^)]*)\)/, n === 1 ? '' : '$1');
}

export function detectLang(): Lang {
  try {
    const l = (navigator.language || 'fr').slice(0, 2).toLowerCase();
    return (['fr', 'en', 'es', 'pt'] as const).find((x) => x === l) ?? 'fr';
  } catch {
    return 'fr';
  }
}

