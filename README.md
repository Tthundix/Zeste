# Zeste Cocktails

Ton carnet de cocktails : un catalogue de classiques, tes propres créations avec photo, ton bar, et ce que tu peux préparer avec.

Zeste est une application web installable (PWA). Elle fonctionne hors ligne et garde toutes les données sur l'appareil, dans le navigateur. Rien n'est envoyé en ligne.

## Contenu du dépôt

| Fichier | Rôle |
| --- | --- |
| `index.html` | Structure de la page |
| `app.css` | Styles (téléphone et grand écran) |
| `app.js` | Logique de l'application |
| `data.js` | Données de départ : ingrédients, recettes, collections |
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

## Photos

Fichiers JPEG de 800 px de large dans `photos/`, nommés d'après l'id de la recette (`photos/french-75.jpg`), déclarés dans `PHOTOS` (`data.js`).

Format « en croix », centré sur le verre, pour un seul fichier par recette quel que soit l'affichage :

- la **bande centrale de 600 px de haut**, sur toute la largeur : cadrage paysage (4:3), utilisé par le catalogue et la fiche recette ;
- la **colonne centrale**, large des 3/4 de la hauteur de l'image, sur toute la hauteur (600 à 1000 px) : cadrage portrait (3:4), utilisé par les cartes de l'accueil ;
- les **quatre coins** ne servent à aucun cadrage : couleur unie, qui ne pèse presque rien.

Les deux cadrages ont le même centre, placé sur le verre : chaque cadre de l'appli (4:3, 16:9, 3:4, carré) reste centré sur lui. Quand le verre est plus haut que la bande paysage, c'est le haut du verre (bord et garniture) qui est gardé : la bande paysage commence juste au-dessus, et seul le pied peut être coupé. Une garniture qui se devine même rognée (paille, rondelle sur le bord) peut être coupée en haut ; une garniture essentielle (tour de citron du Crusta…) jamais. Une photo 800 × 600 classique fonctionne aussi.

## Photos et licences

Les photos du dossier `photos/` ont chacune un statut dans `PHOTO_STATUS` (`data.js`) :

- `'ok'` : utilisable publiquement. Photo faite pour Zeste (sans crédit), photo sous licence libre dont les conditions sont respectées (crédit et lien dans `PHOTO_CREDITS`), ou photo avec l'accord de l'auteur. Ne marquer `'ok'` qu'après avoir vérifié la licence sur la page source.
- `'test'` : pour les essais seulement (droits réservés, banque d'images payante…).
- Absente de la liste : non vérifiée, traitée comme non utilisable en version publique.

Pendant le développement (`PUBLIC_RELEASE = false`), toutes les photos s'affichent, avec un rappel sur les fiches dont la licence n'est pas validée. L'onglet **Données** liste les photos « à vérifier » et « pour les essais seulement ».

Pour la mise en ligne publique (1.0) :

1. Valider ou retirer chaque photo non vérifiée.
2. Passer `PUBLIC_RELEASE` à `true` et augmenter `DATA_VERSION` dans `data.js`. Seules les photos `'ok'` sont alors affichées ; les autres reviennent à l'illustration du verre, y compris sur les appareils qui ont déjà l'appli.
3. Retirer du dépôt les fichiers des photos non validées (`photos/…`) : le filtre les masque dans l'appli, mais tant que les fichiers sont publiés sur GitHub Pages, quelqu'un peut les télécharger à leur adresse.

La page **Crédits et mentions** (Données › Crédits et mentions, ou lien en bas de chaque écran) reprend les crédits des photos affichées, les polices et la mention « L'abus d'alcool est dangereux pour la santé. À consommer avec modération. ».
