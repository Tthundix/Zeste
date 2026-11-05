# Zeste Cocktails

Ton carnet de cocktails : un catalogue de classiques, tes propres créations avec photo, ton bar, et ce que tu peux préparer avec.

Zeste est une application web installable (PWA). Elle fonctionne hors ligne et garde toutes les données sur l'appareil, dans le navigateur. Rien n'est envoyé en ligne.

## Contenu du dépôt

| Fichier | Rôle |
| --- | --- |
| `index.html` | Structure de la page |
| `app.css` | Styles (téléphone et grand écran) |
| `app.js` | Logique de l'application |
| `data.js` | Données de départ : ingrédients, recettes (dont la liste officielle IBA), collections |
| `infos.js` | Fiches des ingrédients (origine, conservation, rôle en cocktail) ; recettes maison de départ dans `data.js` (`PREPS`) |
| `manifest.webmanifest` | Nom, icônes et couleurs de l'appli installée |
| `sw.js` | Fonctionnement hors ligne et mises à jour |
| `icons/` | Icônes de l'appli |
| `fonts/` | Polices, hébergées ici pour fonctionner hors ligne |

## Publier une nouvelle version

1. Modifier les fichiers.
2. Dans `sw.js`, changer `VERSION` (par exemple `zeste-0.15.1`), et `APP_VERSION` dans `app.js`.
   Numérotation : versions 0.x pendant le développement ; la 1.0 sera la première mise en ligne publique.
   Si les recettes ou ingrédients de départ changent, augmenter `DATA_VERSION` dans `data.js` : les appareils récupèrent alors les nouveautés sans toucher aux recettes modifiées par l'utilisateur.
3. Pousser sur la branche `main`. GitHub Pages met le site à jour en une minute environ.

Les appareils qui ont déjà l'appli affichent alors « Une nouvelle version de Zeste est prête », avec un bouton pour mettre à jour.

## Données

- Stockage : IndexedDB, sur l'appareil.
- Sauvegarde et restauration : onglet **Données**, avec un fichier `.json` qui inclut les photos.
