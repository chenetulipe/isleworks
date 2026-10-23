# Note pour chenetulipe : mettre Isleworks en ligne et le faire évoluer

## 1. Mettre en ligne (une seule fois)
1. Sur github.com, crée un dépôt **public** (par exemple `isleworks`). Ne coche rien d'autre.
2. Dans le dépôt : **uploading an existing file** (ou Add file › Upload files).
   Sélectionne **tous les fichiers** du zip décompressé d'un coup (pas le zip lui-même).
   Tous les fichiers sont au même niveau : pas de dossier, ça marche aussi depuis un téléphone.
3. **Commit changes** en bas de la page.
4. **Settings › Pages** : Source = *Deploy from a branch*, Branch = *main*, dossier = */ (root)*, **Save**.
5. Une à deux minutes plus tard, le jeu est en ligne à :
   **https://TON-PSEUDO.github.io/isleworks/**  (remplace TON-PSEUDO par ton nom GitHub).

Astuce : ouvre ce lien sur ton téléphone, puis « Ajouter à l'écran d'accueil »
(menu du navigateur). Le jeu s'ouvre alors en plein écran avec son icône, même sans réseau.

## 2. Mettre à jour le jeu
1. Remplace les fichiers modifiés dans le dépôt (même méthode : Upload files).
2. **Change le numéro de version**, sinon les joueurs gardent l'ancienne version en cache :
   - à la main : dans `sw.js`, la ligne `const VERSION='isleworks-3.0.0'`, et dans `index.html`,
     tous les `?v=3.0.0` → mets le même nouveau numéro (ex. 3.0.1) ;
   - ou automatiquement, sur un ordinateur : `python3 version.py 3.0.1`

## 3. Organisation des fichiers
| Fichier | Contenu |
|---|---|
| `index.html` | La page : structure de l'interface et chargement des scripts |
| `style.css` | Tout le style visuel (couleurs, boutons, panneaux) |
| `00-data.js` | **Les données du jeu** : objets, recettes, machines, recherches, prix |
| `01-world.js` | Le monde : biomes, gisements, rivières, parcelles, épaves |
| `02-sim.js` | La simulation : tapis, machines, énergie, marché, vaisseaux, plans |
| `03-icons.js` | Le dessin des objets et des machines |
| `04-render.js` | L'affichage : terrain, bâtiments, objets, effets, optimisations |
| `05-fx.js` | Sons, musiques générées, particules |
| `06-ui.js` | Menus et panneaux (construire, recherche, marché, carte, réglages) |
| `07-quests.js` | Objectifs du tutoriel et défis infinis |
| `076-mascot.js` | Rivet, la mascotte |
| `08-input.js` | Gestes tactiles (tracé de tapis, zoom, démolition…) |
| `085-i18n.js` | Traduction anglaise |
| `09-main.js` | Démarrage, sauvegarde, boucle du jeu, qualité adaptative |
| `sw.js` | Mise en cache : lancement instantané et jeu hors ligne |
| `manifest.webmanifest` + les `icon-*.png` | Installation sur l'écran d'accueil |
| `version.py` | Change le numéro de version partout |
| `un-seul-fichier.py` | Recrée la version « un seul fichier HTML » (testeurs, Android) |

L'ordre des scripts compte (numéros 00 → 09) : ils sont chargés dans cet ordre par `index.html`.

## 4. Pour le futur portage Roblox
Le code ne peut pas être copié tel quel dans Roblox (Luau, moteur 3D), mais
`00-data.js` contient toutes les données du jeu (objets, valeurs, recettes,
machines, recherches) : c'est la base à reprendre en priorité. Les règles de
`02-sim.js` (tapis, énergie, marché) décrivent la logique à reproduire.
