# Projet AEGC — à lire avant toute intervention

Site de l'Association des Économistes et Gestionnaires du Cameroun.
Production : https://aegc-web.com (site) et https://back.aegc-web.com (API).

- **Frontend** : React 19 + Vite, JavaScript, React Router. Bilingue FR/EN via
  react-i18next (`frontend/src/locales/`). L'espace d'administration n'est
  volontairement pas traduit.
- **Backend** : Express + Mongoose, MongoDB Atlas.
- **Déploiement** : Docker Compose sur un contexte SSH (`aegcdry`), derrière
  `jwilder/nginx-proxy` + acme-companion.

## Les cinq pièges qui ont déjà cassé la production

1. **`frontend/src/components/Url.js` et `backend/.env` sont figés dans l'image
   au moment du build.** L'état du dossier à cet instant *devient* la
   production. Avant tout `docker compose up --build` : ligne de production
   active dans les deux fichiers.
2. **`NODE_ENV` doit rester `development`** sur le serveur. En `production`,
   les téléchargements de PDF cassent (le jeton passe en paramètre d'URL) et
   les routes `/dev/*` disparaissent.
3. **`docker compose down` utilise `APP_VERSION`** pour retrouver les
   conteneurs. On arrête d'abord, on change la version ensuite.
4. **`aegc-web.com` répond 200 pour toute adresse inconnue** (c'est une
   application React). Un fichier « présent » peut donc être la page du site :
   vérifier le type et la taille, pas seulement le code de retour.
5. **Ne pas « réparer » `express.static("/uploads")`** dans `server.js` : cela
   exposerait publiquement tous les working papers non publiés.

## Base de données

Deux bases, une ligne à commenter dans `backend/.env` :

- **DEV** : `aegc_dev` sur le cluster Atlas personnel de Landry. Se met en
  pause après une longue inactivité — symptôme : `ENOTFOUND` en boucle au
  démarrage. Réveil par le bouton *Resume* dans Atlas.
- **PROD** : `economicswebseite` sur PacoCluster.

Scripts : `npm run clone-prod` (recopie la production en dev, lecture seule
côté production) et `npm run init-dev` (crée ou réinitialise un compte de
travail). Les deux refusent de s'exécuter si la base visée n'est pas `aegc_dev`.

**La base de dev contient de vraies données personnelles** (84 comptes, 21
soumissions). `RESEND_API` y est volontairement vide, et
`NEWSLETTER_TEST_RECIPIENT` redirige tout envoi vers une seule adresse.

## Règles de travail

- Ne jamais écrire dans la base de production sans accord explicite de Landry.
- Ne jamais commiter `.env`, `.env.prod-backup`, `.env.dev-backup`, ni
  `backend/uploads/`.
- Les fichiers déposés par les utilisateurs vivent sur l'hôte
  (`/home/user00adm/aegc/uploads`), montés dans le conteneur. Ils ne sont
  **sauvegardés nulle part** — sujet ouvert avec le propriétaire du serveur.
- `npm run build` dans `frontend/` doit passer après chaque étape.

## État au 21/10/2026

**En production (2.2.8)** : prix et lauréats (plusieurs par prix, fenêtre de
détail), actualités de l'accueil, diffusion des working papers, galerie,
traduction FR/EN du site public, archive RePEc.

**Développé, pas encore déployé** : consentement aux actualités (case à
l'inscription, bandeau pour les comptes existants, désinscription en un clic,
envoi par Resend). L'envoi attend une clé Resend et la vérification du domaine
`aegc-web.org`.

**En attente de tiers** : certificat de `stats.aegc-web.com` (invalide, donc
aucune statistique réelle n'est collectée), accès DNS pour les courriels,
arbitrage du bureau entre l'archive RePEc automatique et la version statique
écrite à la main, PDF du premier working paper.

**Dette connue** : secrets à renouveler (Resend, MongoDB, JWT — les jetons de
connexion n'expirent jamais), 11 CV nominatifs publics dans `frontend/public/pdf/`
et dans l'historique Git d'un dépôt public, variables de configuration à sortir
de l'image Docker.
