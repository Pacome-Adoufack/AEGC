import express from "express";
import Reservation from "../models/Reservation.js";
import ReservationFormation from "../models/ReservationFormation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Toutes les routes de réservation nécessitent une authentification
router.use(authMiddleware);

// ============================================
// RÉSERVATIONS ACTIVITÉS
// ============================================

// Créer une réservation d'activité (USER)
router.post("/activity", async (req, res) => {
  try {
    const { activityId } = req.body;
    const user = req.user.id;

    if (!user || !activityId) {
      return res.status(400).json({ error: "Données manquantes" });
    }

    // Vérifier si l'utilisateur a déjà réservé cette activité
    const existingReservation = await Reservation.findOne({
      user,
      activity: activityId,
    });

    if (existingReservation) {
      return res
        .status(400)
        .json({ error: "Vous avez déjà réservé cette activité" });
    }

    const newReservation = new Reservation({
      user,
      activity: activityId,
    });

    await newReservation.save();
    res.status(201).json({ message: "Réservation réussie !" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création de la réservation." });
  }
});

// Obtenir les réservations d'activités de l'utilisateur connecté
router.get("/activity", async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id }).populate(
      "activity",
      "name date timeParis timeYaounde location",
    );

    res.json(reservations);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des réservations." });
  }
});

// Obtenir les réservations d'une activité spécifique (ADMIN/DEV)
router.get(
  "/activity/:activityId",
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const reservations = await Reservation.find({
        activity: req.params.activityId,
      })
        .populate("activity")
        .populate("user", "name firstName email");

      res.json(reservations);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération." });
    }
  },
);

// Annuler une réservation d'activité
router.delete("/activity/:id", async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée." });
    }

    // Vérifier que l'utilisateur annule sa propre réservation (sauf admin/dev)
    const userRole = req.user.role || "user";
    if (
      reservation.user.toString() !== req.user.id &&
      !["admin", "dev"].includes(userRole)
    ) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ message: "Réservation annulée avec succès." });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur lors de l'annulation de la réservation." });
  }
});

// ============================================
// RÉSERVATIONS FORMATIONS
// ============================================

// Créer une réservation de formation (USER)
router.post("/formation", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, formationId, message } =
      req.body;
    const user = req.user.id;

    if (!user || !firstName || !lastName || !email || !phone || !formationId) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    // Vérifier si l'utilisateur a déjà réservé cette formation
    const existingReservation = await ReservationFormation.findOne({
      user,
      formationId,
    });

    if (existingReservation) {
      return res
        .status(400)
        .json({ error: "Vous avez déjà réservé cette formation" });
    }

    const newReservation = new ReservationFormation({
      user,
      firstName,
      lastName,
      email,
      phone,
      formationId,
      message,
    });

    await newReservation.save();
    res.status(201).json({ message: "Réservation réussie !" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création de la réservation." });
  }
});

// Obtenir les réservations de formations de l'utilisateur connecté
router.get("/formation", async (req, res) => {
  try {
    const reservations = await ReservationFormation.find({
      user: req.user.id,
    }).populate("formationId");
    res.json(reservations);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des réservations." });
  }
});

// Annuler une réservation de formation
router.delete("/formation/:id", async (req, res) => {
  try {
    const reservation = await ReservationFormation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée." });
    }

    // Vérifier que l'utilisateur annule sa propre réservation (sauf admin/dev)
    const userRole = req.user.role || "user";
    if (
      reservation.user.toString() !== req.user.id &&
      !["admin", "dev"].includes(userRole)
    ) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    await ReservationFormation.findByIdAndDelete(req.params.id);
    res.json({ message: "Réservation annulée avec succès." });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur lors de l'annulation de la réservation." });
  }
});

// ============================================
// STATISTIQUES RÉSERVATIONS (ADMIN/DEV)
// ============================================

// Obtenir toutes les réservations (ADMIN/DEV)
router.get("/all", requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const activityReservations = await Reservation.find()
      .populate("activity", "name date")
      .populate("user", "name firstName email");

    const formationReservations = await ReservationFormation.find()
      .populate("formationId", "title date")
      .populate("user", "name firstName email");

    res.json({
      activities: activityReservations,
      formations: formationReservations,
      stats: {
        totalActivityReservations: activityReservations.length,
        totalFormationReservations: formationReservations.length,
        total: activityReservations.length + formationReservations.length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération." });
  }
});

export default router;
