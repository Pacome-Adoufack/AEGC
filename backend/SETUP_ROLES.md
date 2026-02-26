# 🎯 Système de Rôles AEGC - Guide Complet

## 📌 Nouveautés

Le système AEGC dispose maintenant d'un **système de rôles complet** avec 3 types d'utilisateurs :

- **USER** : Utilisateurs normaux (par défaut)
- **ADMIN** : Administrateurs (gestion du contenu)
- **DEV** : Développeurs (accès complet + gestion des utilisateurs)

---

## 🚀 Démarrage Rapide

### 1. Initialiser le compte DEV

**Première chose à faire après installation :**

```bash
cd backend
npm run init-dev
```

Cela crée le compte développeur par défaut :

- **Email** : `dev@gmail.com`
- **Password** : `dev*2026)`
- **Rôle** : `dev`

### 2. Démarrer le serveur

```bash
npm start
# ou en mode développement
npm run dev
```

### 3. Tester l'API

Allez sur `http://localhost:3000` pour voir la documentation complète de l'API.

---

## 👥 Système de Rôles

### **USER (Utilisateur Normal)**

✅ **Peut faire :**

- S'inscrire publiquement
- Se connecter
- Consulter activités et formations
- Réserver des activités/formations
- Annuler ses propres réservations
- Gérer son profil
- Envoyer des messages de contact
- S'abonner à la newsletter

❌ **Ne peut PAS :**

- Créer/modifier/supprimer du contenu
- Voir les statistiques
- Gérer d'autres utilisateurs

### **ADMIN (Administrateur)**

✅ **Peut faire (en plus de USER) :**

- **Activités** : Créer, modifier, supprimer
- **Formations** : Créer, modifier, supprimer
- **FAQ** : Créer, modifier, supprimer
- **Images** : Upload, supprimer
- **Contacts** : Consulter tous les messages
- **Abonnés** : Consulter la liste
- **Réservations** : Voir toutes les réservations

❌ **Ne peut PAS :**

- Gérer les utilisateurs
- Changer les rôles
- Accéder aux stats globales DEV

### **DEV (Développeur)**

✅ **Peut TOUT faire (ADMIN +) :**

- **Gestion utilisateurs** :
  - Créer des users avec choix du rôle
  - Changer le rôle de n'importe qui
  - Supprimer des utilisateurs
  - Voir la liste complète des users
- **Stats globales** :
  - Nombre total users/admins/devs
  - Stats complètes sur tout
  - Réservations, contacts, etc.
- **Migration** :
  - Migrer les anciens users sans rôle

---

## 📡 Endpoints API

### **Authentification (PUBLIC)**

```bash
POST /register                    # Inscription (crée un USER)
POST /login                       # Connexion
POST /forgot-password             # Mot de passe oublié
POST /reset-password/:token       # Réinitialisation
GET  /reset-password/:token       # Vérifier token
```

### **Routes DEV (DEV uniquement)**

```bash
GET    /dev/users                     # Liste tous les users
POST   /dev/create-user               # Créer un user (avec rôle)
PATCH  /dev/users/:userId/role        # Changer le rôle
DELETE /dev/users/:userId             # Supprimer un user
POST   /dev/migrate-users             # Migrer les users existants
GET    /dev/stats                     # Stats globales
```

### **Activités**

```bash
GET    /api/activities                # Liste (PUBLIC)
GET    /api/activities/:id            # Détails (PUBLIC)
POST   /api/activities                # Créer (ADMIN/DEV)
PUT    /api/activities/:id            # Modifier (ADMIN/DEV)
DELETE /api/activities/:id            # Supprimer (ADMIN/DEV)
```

### **Formations**

```bash
GET    /api/formations                # Liste (PUBLIC)
GET    /api/formations/:id            # Détails (PUBLIC)
POST   /api/formations                # Créer (ADMIN/DEV)
PUT    /api/formations/:id            # Modifier (ADMIN/DEV)
DELETE /api/formations/:id            # Supprimer (ADMIN/DEV)
```

### **Réservations**

```bash
# Activités
POST   /reservation/activity          # Réserver (USER)
GET    /reservation/activity          # Mes réservations (USER)
DELETE /reservation/activity/:id      # Annuler (USER)

# Formations
POST   /reservation/formation         # Réserver (USER)
GET    /reservation/formation         # Mes réservations (USER)
DELETE /reservation/formation/:id     # Annuler (USER)

# Admin
GET    /reservation/all               # Toutes les réservations (ADMIN/DEV)
```

### **FAQ**

```bash
GET    /faq                           # Liste (PUBLIC)
POST   /faq                           # Créer (ADMIN/DEV)
PUT    /faq/:id                       # Modifier (ADMIN/DEV)
DELETE /faq/:id                       # Supprimer (ADMIN/DEV)
```

### **Images**

```bash
GET    /images                        # Liste (PUBLIC)
POST   /picture                       # Upload (ADMIN/DEV)
DELETE /picture/:id                   # Supprimer (ADMIN/DEV)
```

### **Contacts**

```bash
POST   /contact                       # Envoyer message (PUBLIC)
GET    /contact                       # Liste messages (ADMIN/DEV)
DELETE /contact/:id                   # Supprimer (ADMIN/DEV)
```

### **Abonnements**

```bash
POST   /subscribe                     # S'abonner (PUBLIC)
GET    /subscribe                     # Liste abonnés (ADMIN/DEV)
DELETE /subscribe/:id                 # Supprimer (ADMIN/DEV)
```

---

## 🔐 Utilisation avec Token JWT

### 1. Se connecter

```bash
POST /login
{
  "email": "dev@gmail.com",
  "password": "dev*2026)"
}
```

**Réponse :**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Developer",
    "firstName": "System",
    "email": "dev@gmail.com",
    "role": "dev",
    ...
  }
}
```

### 2. Utiliser le token

Pour toutes les routes protégées, ajouter le header :

```
Authorization: Bearer <votre_token>
```

**Exemple avec curl :**

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1..." \
     http://localhost:3000/dev/users
```

---

## 📊 Exemples d'Utilisation

### Créer un ADMIN (DEV uniquement)

```bash
POST /dev/create-user
Authorization: Bearer <token_dev>

{
  "name": "Admin",
  "firstName": "Principal",
  "email": "admin@aegc.com",
  "gender": "Male",
  "telefonNummer": "+33123456789",
  "country": "France",
  "city": "Paris",
  "university": "Sorbonne",
  "password": "securepassword",
  "role": "admin"
}
```

### Changer le rôle d'un utilisateur

```bash
PATCH /dev/users/65abc123.../role
Authorization: Bearer <token_dev>

{
  "role": "admin"
}
```

### Créer une activité (ADMIN ou DEV)

```bash
POST /api/activities
Authorization: Bearer <token_admin_ou_dev>

{
  "name": "Conférence Économie 2026",
  "description": "Grande conférence annuelle",
  "date": "2026-03-15",
  "timeParis": "14:00",
  "timeYaounde": "15:00",
  "location": "Paris",
  "moderators": [
    { "name": "Dr. Smith", "subtitle": "Économiste" }
  ],
  "participants": []
}
```

### Voir les stats globales (DEV uniquement)

```bash
GET /dev/stats
Authorization: Bearer <token_dev>
```

**Réponse :**

```json
{
  "users": {
    "total": 150,
    "byRole": {
      "user": 145,
      "admin": 4,
      "dev": 1
    },
    "recent": {
      "last24h": 5,
      "last7days": 20,
      "last30days": 35
    }
  },
  "activities": { "total": 25, "recent": 5 },
  "formations": { "total": 15, "recent": 3 },
  "reservations": {
    "activities": { "total": 120, "recent": 15 },
    "formations": { "total": 80, "recent": 10 },
    "totalAll": 200
  },
  ...
}
```

---

## 🛠️ Migration des Utilisateurs Existants

Si vous avez déjà des utilisateurs dans la base de données **AVANT** l'ajout du système de rôles :

```bash
POST /dev/migrate-users
Authorization: Bearer <token_dev>
```

Cela ajoute automatiquement `role: 'user'` à tous les utilisateurs qui n'en ont pas.

---

## ⚙️ Structure du Projet

```
backend/
├── models/
│   ├── User.js (+ champ role)
│   ├── Activity.js
│   ├── Formation.js
│   └── ...
├── middlewares/
│   ├── authMiddleware.js (vérifie JWT + ajoute role)
│   └── roleMiddleware.js (vérifie rôle)
├── routes/
│   ├── auth.routes.js (register, login, etc.)
│   ├── dev.routes.js (gestion users, stats)
│   ├── activity.routes.js (CRUD activités)
│   ├── formation.routes.js (CRUD formations)
│   ├── reservation.routes.js (réservations)
│   └── admin.routes.js (FAQ, images, contacts, etc.)
├── scripts/
│   └── initDevAccount.js (créer compte DEV)
├── server.js (utilise les routes)
└── package.json
```

---

## ✅ Compatibilité Ascendante

Le système est **100% compatible** avec les utilisateurs existants :

- Les anciens users sans champ `role` sont traités comme `'user'`
- Pas de crash si le champ n'existe pas
- Migration optionnelle quand vous êtes prêt

---

## 🎉 C'est Prêt !

Votre projet AEGC dispose maintenant d'un système de rôles complet et professionnel ! 🚀

**Prochaines étapes :**

1. Créer le compte DEV : `npm run init-dev`
2. Se connecter avec `dev@gmail.com` / `dev*2026)`
3. Créer vos premiers admins
4. Profiter du système !
