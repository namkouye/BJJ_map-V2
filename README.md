# BJJ Game Map

PWA de **game mapping** pour le Jiu-Jitsu Brésilien, centrée sur le travail **au sol** :
une carte intuitive de position à position, et un outil pour construire **son propre jeu**.

## Ce que fait l'application

**Explorer** (idéal débutants)
- Carte globale : 11 positions (gardes, HQ, contrôles dominants, tortue), sans détail technique
- Curseur **On top / On bottom** : on change de point de vue sur toute la carte
- On touche une position : elle passe au centre et toutes ses possibilités apparaissent autour
  (passages, balayages, progressions, évasions, soumissions). Exemple : *On top → Headquarters*
  affiche tous les passages de garde
- Les techniques (avec une courte explication) sont dans le panneau de détail

**Mon jeu** (personnalisation)
- Étoilez vos techniques favorites : chaque étoile ajoute une flèche à votre carte
- Choisissez la position de départ de votre **game top** et de votre **game bottom**
- Plusieurs **profils** (ex. jeu compétition, no-gi, jeu du moment) : créer, renommer, dupliquer, supprimer
- Ajoutez vos propres techniques à n'importe quel mouvement
- Export / import JSON, 100 % local et utilisable **hors-ligne**, installable sur téléphone

## Démarrer en local

Prérequis : Node.js 20 ou plus.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests unitaires
npm run build      # build de production dans dist/
npm run preview    # sert le build (avec service worker)
```

## Déployer sur GitHub Pages

1. Créez un dépôt GitHub et envoyez **le contenu du dossier** (pas le dossier lui-même) à la racine,
   sans oublier le dossier caché `.github`.
2. **Settings → Pages → Build and deployment → Source : GitHub Actions**.
3. Le workflow `.github/workflows/deploy.yml` construit et publie le site à chaque push sur `main`
   (`https://<vous>.github.io/<repo>/`). Le chemin de base est calculé automatiquement.

Test local comme sur GitHub Pages : `BASE_PATH=/<repo>/ npm run build && BASE_PATH=/<repo>/ npm run preview`.

## Structure

```
src/
  data/map.json            La carte : positions, côtés, mouvements, techniques
  graph/types.ts           Modèle (Position, Move, Profile…)
  graph/model.ts           Validation, vue d'ensemble, profils, mise en couches
  graph/labels.ts          Libellés FR et couleurs
  store/useStore.ts        État + sauvegarde locale (zustand)
  components/              MapView (carte), StatePanel (détail), GamePanel (profils)…
```

## Modèle de données

Une **position** a deux côtés (`top`, `bottom`), chacun avec ses propres mouvements écrits du point de
vue du joueur. Un « état » est `position:côté` (ex. `closed-guard:bottom`).

```jsonc
{
  "id": "closed-guard", "name": "Closed Guard", "nameFr": "Garde fermée", "family": "guard",
  "bottom": {
    "title": "Closed guard", "titleFr": "Garde fermée", "summary": "…",
    "moves": [
      { "kind": "sweep", "to": "mount:top",
        "techniques": [{ "name": "Scissor sweep", "note": "Manche + col, ciseaux avec les jambes" }] },
      { "kind": "submission", "finish": "Armbar", "finishFr": "Clé de bras",
        "techniques": [{ "name": "Armbar (juji gatame)" }] }
    ]
  }
}
```

Types de mouvements : `pass`, `sweep`, `transition`, `escape`, `submission`. Une soumission n'a pas de
destination (`finish` à la place de `to`). `npm test` vérifie la cohérence (destinations existantes,
un balayage mène toujours à un état « dessus », un passage part toujours du dessus…).

## Enrichir la carte

Ajoutez une position ou des mouvements dans `src/data/map.json`, puis lancez `npm test`. Pour
placer une nouvelle position sur la vue d'ensemble, complétez `OVERVIEW_POS` dans
`src/components/MapView.tsx` (sinon elle apparaît dans une colonne par défaut).

## Limites connues

- Les données (profils) vivent dans le navigateur : exportez régulièrement. Vider les données du site les efface.
- La partie debout (takedowns) est volontairement absente pour l'instant.
- Le heel hook est inclus à titre éducatif : interdit dans de nombreuses catégories de compétition.

## Licence

MIT
