# Contexte — traduction FR/EN du site AEGC

Document destiné à un assistant de code travaillant dans ce dépôt.

## Le projet

Site de l'Association des Économistes et Gestionnaires du Cameroun.

- **Frontend** : React 19 + Vite, JavaScript (pas de TypeScript), React Router.
  93 composants `.jsx` dans `frontend/src/components/`, une feuille CSS par
  écran dans `frontend/src/styles/`.
- **Backend** : Express + Mongoose (MongoDB Atlas). Hors périmètre ici.
- Les textes de l'interface sont **écrits en dur en français dans le JSX**.
  Environ 790 segments au total.

## L'objectif

Rendre le **site public** bilingue français / anglais, le français restant la
langue par défaut.

## Périmètre

### À traduire (~464 segments)

Tout ce qui est visible d'un visiteur non connecté, par ordre de priorité :

1. `components/common/Header.jsx`, `Footer.jsx` — navigation, présente partout
2. `components/pages/Home.jsx`, `HomeIntro.jsx`, `HomeGallery.jsx`,
   `components/awards/HomeAwards.jsx`
3. `components/pages/About.jsx`, `Contact.jsx`
4. `components/working-papers/` — liste, détail, historique, comité
5. `components/pages/Price.jsx` et `components/awards/AwardCard.jsx`
6. `components/auth/` — connexion, inscription, mot de passe oublié
7. Le reste des pages publiques

### À NE PAS traduire

- **`components/admin/` et les tableaux de bord** (`AdminDashboard.jsx`,
  `AdminWorkingPapers.jsx`, `DevDashboard.jsx`) : 326 segments utilisés par
  trois administrateurs francophones. Les traduire coûte 40 % de l'effort pour
  aucun bénéfice.
- **Le contenu saisi en base** : annonces, noms des prix, motivations du jury,
  titres et résumés des working papers. Ces textes viennent de MongoDB et sont
  écrits par les utilisateurs. Ils s'affichent tels quels, dans leur langue
  d'origine. Ne pas inventer de mécanisme de traduction automatique.
- Les pages des membres du bureau (`components/members/`) : noms, titres et
  coordonnées de personnes.

## La méthode attendue

1. **`react-i18next`** + `i18next` + `i18next-browser-languagedetector`.
2. Fichiers de traduction dans `frontend/src/locales/fr.json` et
   `frontend/src/locales/en.json`.
3. **Clés hiérarchiques par écran** : `header.nav.workingPapers`,
   `home.hero.title`, `contact.form.submit`. Pas de clé qui soit la phrase
   française elle-même.
4. **Sélecteur de langue dans l'en-tête**, choix mémorisé dans `localStorage`,
   et mise à jour de l'attribut `lang` de `<html>`.
5. Le **français est la langue de repli** : une clé absente de `en.json`
   affiche le français, jamais la clé brute.

### Décision à prendre avant de commencer

L'adresse des pages change-t-elle selon la langue ?

- **Non** (simple) : la langue est un réglage mémorisé. Inconvénient : les
  moteurs de recherche n'indexeront jamais la version anglaise.
- **Oui**, avec un préfixe `/en/...` : plus de travail sur le routeur, mais le
  site devient trouvable en anglais.

À trancher avec le responsable du projet avant d'écrire du code.

## Règles de travail dans ce dépôt

- **Ne pas modifier** : `frontend/src/components/Url.js`, `backend/.env`,
  `docker-compose.yml`, `.gitignore`. Ces fichiers portent la configuration de
  déploiement, une modification casse la mise en production.
- **Ne jamais commiter** de fichier `.env` ni le dossier `backend/uploads/`.
- `npm run build` dans `frontend/` doit passer après chaque étape.
- Avancer **écran par écran**. Un écran non encore converti doit continuer de
  fonctionner en français : le site ne doit jamais être à moitié cassé.
- Conserver les commentaires existants et le style du code (indentation 4
  espaces dans le JSX, guillemets doubles).

## Qualité des traductions

- Vocabulaire académique : « working paper », « call for papers », « peer
  review », « abstract », « JEL codes » sont les termes attendus en anglais.
- Ne pas traduire les noms propres, ni « AEGC », ni « RePEc », ni les intitulés
  officiels des prix.
- Attention aux chaînes contenant des variables ou du balisage : utiliser
  l'interpolation d'i18next plutôt que de découper la phrase.

## Ce qu'il faut signaler au responsable

- Tout texte dont la traduction demande une décision éditoriale.
- Toute chaîne trouvée dans un composant admin et qui apparaîtrait malgré tout
  côté public.
- Le coût d'entretien : une fois en place, chaque nouveau texte du site devra
  être écrit dans les deux langues.
