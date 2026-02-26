import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Activity from "../models/Activity.js";
import Formation from "../models/Formations.js";
import Reservation from "../models/Reservation.js";
import ReservationFormation from "../models/ReservationFormation.js";
import Contact from "../models/Contact.js";
import Subscribe from "../models/Subscribe.js";
import Faq from "../models/Faq.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Toutes les routes DEV nécessitent d'être DEV
router.use(authMiddleware);
router.use(requireRole(["dev"]));

// ============================================
// GESTION DES UTILISATEURS (DEV ONLY)
// ============================================

// Lister tous les utilisateurs avec leurs rôles (avec pagination)
router.get("/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    // Construction du filtre de recherche
    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { firstName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { university: { $regex: search, $options: "i" } },
        ],
      };
    }

    // Compter le total
    const total = await User.countDocuments(searchFilter);

    // Récupérer les utilisateurs paginés
    const users = await User.find(searchFilter)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Stats globales (sans pagination)
    const allUsersCount = await User.countDocuments();
    const stats = {
      total: allUsersCount,
      byRole: {
        user: await User.countDocuments({
          $or: [{ role: "user" }, { role: { $exists: false } }],
        }),
        admin: await User.countDocuments({ role: "admin" }),
        dev: await User.countDocuments({ role: "dev" }),
      },
    };

    res.json({
      stats,
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        firstName: u.firstName,
        email: u.email,
        role: u.role || "user",
        country: u.country,
        city: u.city,
        university: u.university,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un utilisateur manuellement (avec choix du rôle)
router.post("/create-user", async (req, res) => {
  const {
    name,
    firstName,
    email,
    gender,
    telefonNummer,
    country,
    city,
    university,
    password,
    role, // Le DEV peut choisir le rôle
  } = req.body;

  if (
    !name ||
    !firstName ||
    !email ||
    !gender ||
    !telefonNummer ||
    !country ||
    !city ||
    !university ||
    !password
  ) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }

  // Valider le rôle
  const validRoles = ["user", "admin", "dev"];
  const userRole = role && validRoles.includes(role) ? role : "user";

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      firstName,
      email,
      gender,
      telefonNummer,
      country,
      city,
      university,
      password: hashedPassword,
      role: userRole,
    });

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Changer le rôle d'un utilisateur
router.patch("/users/:userId/role", async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  const validRoles = ["user", "admin", "dev"];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({
      error: "Rôle invalide",
      validRoles,
    });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true },
    ).select("-password -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json({
      message: "Rôle mis à jour avec succès",
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un utilisateur
router.delete("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MIGRATION DES UTILISATEURS EXISTANTS
// ============================================

// Ajouter le rôle 'user' à tous les utilisateurs qui n'en ont pas
router.post("/migrate-users", async (req, res) => {
  try {
    const result = await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: "user" } },
    );

    res.json({
      message: "Migration effectuée avec succès",
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// STATISTIQUES GLOBALES (DEV)
// ============================================

router.get("/stats", async (req, res) => {
  try {
    // Stats utilisateurs
    const allUsers = await User.find().select("role createdAt");
    const userStats = {
      total: allUsers.length,
      byRole: {
        user: allUsers.filter((u) => (u.role || "user") === "user").length,
        admin: allUsers.filter((u) => u.role === "admin").length,
        dev: allUsers.filter((u) => u.role === "dev").length,
      },
      withoutRole: allUsers.filter((u) => !u.role).length,
      recent: {
        last24h: allUsers.filter(
          (u) =>
            new Date(u.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000),
        ).length,
        last7days: allUsers.filter(
          (u) =>
            new Date(u.createdAt) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ).length,
        last30days: allUsers.filter(
          (u) =>
            new Date(u.createdAt) >
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        ).length,
      },
    };

    // Stats activités
    const activities = await Activity.find();
    const activityStats = {
      total: activities.length,
      recent: activities.filter(
        (a) =>
          new Date(a.createdAt) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      ).length,
    };

    // Stats formations
    const formations = await Formation.find();
    const formationStats = {
      total: formations.length,
      recent: formations.filter(
        (f) =>
          new Date(f.createdAt) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      ).length,
    };

    // Stats réservations
    const reservations = await Reservation.find();
    const reservationFormations = await ReservationFormation.find();
    const reservationStats = {
      activities: {
        total: reservations.length,
        recent: reservations.filter(
          (r) =>
            new Date(r.createdAt) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ).length,
      },
      formations: {
        total: reservationFormations.length,
        recent: reservationFormations.filter(
          (r) =>
            new Date(r.createdAt) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ).length,
      },
      totalAll: reservations.length + reservationFormations.length,
    };

    // Stats contacts
    const contacts = await Contact.find();
    const contactStats = {
      total: contacts.length,
      recent: contacts.filter(
        (c) =>
          new Date(c.createdAt) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      ).length,
    };

    // Stats abonnés
    const subscribers = await Subscribe.find();
    const subscriberStats = {
      total: subscribers.length,
      recent: subscribers.filter(
        (s) =>
          new Date(s.createdAt) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      ).length,
    };

    // Stats FAQ
    const faqs = await Faq.find();
    const faqStats = {
      total: faqs.length,
    };

    res.json({
      users: userStats,
      activities: activityStats,
      formations: formationStats,
      reservations: reservationStats,
      contacts: contactStats,
      subscribers: subscriberStats,
      faqs: faqStats,
      summary: {
        totalUsers: userStats.total,
        totalActivities: activityStats.total,
        totalFormations: formationStats.total,
        totalReservations: reservationStats.totalAll,
        totalContacts: contactStats.total,
        totalSubscribers: subscriberStats.total,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
