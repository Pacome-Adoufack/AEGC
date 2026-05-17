import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { config } from "./config/env.js";
import path from "path";

// Import des routes (après le chargement de la config)
import authRoutes from "./routes/auth.routes.js";
import devRoutes from "./routes/dev.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import formationRoutes from "./routes/formation.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import membershipRoutes from "./routes/membership.routes.js";
import workingPaperRoutes from "./routes/workingPaper.routes.js";
import committeeRoutes from "./routes/committee.routes.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

app.use(cors());
app.use(express.json());

// Servir les fichiers uploadés (preuves, formulaires)
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "backend", "uploads")),
);

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("✅ MongoDB connecté avec succès");

    // Création d'une collection test si elle n'existe pas
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (!collectionNames.includes("test")) {
      await db.createCollection("test");
      await db
        .collection("test")
        .insertOne({ message: "Initial document test" });
      console.log("✅ Collection test créée");
    }
  } catch (err) {
    console.error("❌ Erreur de connexion MongoDB:", err);
    process.exit(1);
  }
};

connectDB();

// ============================================
// UTILISATION DES ROUTES
// ============================================

// Routes d'authentification (register, login, forgot-password, reset-password)
app.use("/", authRoutes);

// Routes DEV (gestion users, stats globales) - /dev/*
if (!isProduction) {
  app.use("/dev", devRoutes);
}

// Routes Activities (CRUD) - /api/activities/*
app.use("/api/activities", activityRoutes);

// Routes Formations (CRUD) - /api/formations/*
app.use("/api/formations", formationRoutes);

// Routes Réservations (activities + formations) - /reservation/*
app.use("/reservation", reservationRoutes);

// Routes Membership (cotisations annuelles) - /api/membership/*
app.use("/api/membership", membershipRoutes);

// Routes Working Papers (soumissions académiques) - /api/*
app.use("/api", workingPaperRoutes);

// Routes Comité scientifique - /api/*
app.use("/api", committeeRoutes);

// Routes Admin (FAQ, Images, Contacts, Subscribe) - /*
app.use("/", adminRoutes);

// ============================================
// ROUTE DE TEST
// ============================================

app.get("/", (req, res) => {
  const payload = {
    message: "🚀 AEGC API Server - Système de rôles activé",
    version: "2.0.0",
    endpoints: {
      auth: {
        register: "POST /register",
        login: "POST /login",
        forgotPassword: "POST /forgot-password",
        resetPassword: "POST /reset-password/:token",
      },
      activities: {
        list: "GET /api/activities",
        get: "GET /api/activities/:id",
        create: "POST /api/activities (ADMIN/DEV)",
        update: "PUT /api/activities/:id (ADMIN/DEV)",
        delete: "DELETE /api/activities/:id (ADMIN/DEV)",
      },
      formations: {
        list: "GET /api/formations",
        get: "GET /api/formations/:id",
        create: "POST /api/formations (ADMIN/DEV)",
        update: "PUT /api/formations/:id (ADMIN/DEV)",
        delete: "DELETE /api/formations/:id (ADMIN/DEV)",
      },
      reservations: {
        createActivity: "POST /reservation/activity (USER)",
        getMyActivities: "GET /reservation/activity (USER)",
        cancelActivity: "DELETE /reservation/activity/:id (USER)",
        createFormation: "POST /reservation/formation (USER)",
        getMyFormations: "GET /reservation/formation (USER)",
        cancelFormation: "DELETE /reservation/formation/:id (USER)",
        getAll: "GET /reservation/all (ADMIN/DEV)",
      },
      admin: {
        faq: {
          list: "GET /faq",
          create: "POST /faq (ADMIN/DEV)",
          update: "PUT /faq/:id (ADMIN/DEV)",
          delete: "DELETE /faq/:id (ADMIN/DEV)",
        },
        images: {
          list: "GET /images",
          create: "POST /picture (ADMIN/DEV)",
          delete: "DELETE /picture/:id (ADMIN/DEV)",
        },
        contact: {
          send: "POST /contact",
          list: "GET /contact (ADMIN/DEV)",
          delete: "DELETE /contact/:id (ADMIN/DEV)",
        },
        subscribe: {
          create: "POST /subscribe",
          list: "GET /subscribe (ADMIN/DEV)",
          delete: "DELETE /subscribe/:id (ADMIN/DEV)",
        },
      },
    },
    roles: {
      user: "USER - Utilisateurs normaux",
      admin: "ADMIN - Gestion du contenu",
      dev: "DEV - Gestion complète + users",
    },
  };

  if (!isProduction) {
    payload.endpoints.dev = {
      users: "GET /dev/users (DEV only)",
      createUser: "POST /dev/create-user (DEV only)",
      changeRole: "PATCH /dev/users/:userId/role (DEV only)",
      migrateUsers: "POST /dev/migrate-users (DEV only)",
      stats: "GET /dev/stats (DEV only)",
    };
  }

  res.json(payload);
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Serveur démarré sur http://0.0.0.0:3000");
  console.log("📚 Documentation API disponible sur http://0.0.0.0:3000");
  if (!isProduction) {
    console.log("🛠️ Mode développement actif");
  }
});
