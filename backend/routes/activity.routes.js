import express from "express";
import Activity from "../models/Activity.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";

const router = express.Router();

// ============================================
// ROUTES PUBLIQUES (lecture seule)
// ============================================

// Lister toutes les activités
router.get("/", async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 });
    res.json(activities);
  } catch (err) {
    console.error("Erreur de récupération des activités:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Obtenir une activité par ID
router.get("/:id", async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: "Activité non trouvée" });
    }
    res.json(activity);
  } catch (err) {
    console.error("Erreur:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ============================================
// ROUTES PROTÉGÉES (ADMIN/DEV uniquement)
// ============================================

// Créer une activité (ADMIN ou DEV)
router.post(
  "/",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const {
        name,
        description,
        date,
        timeParis,
        timeYaounde,
        location,
        moderators,
        participants,
      } = req.body;

      if (!name || !timeParis || !timeYaounde) {
        return res.status(400).json({
          error: "Les champs name, timeParis et timeYaounde sont requis",
        });
      }

      const activity = new Activity({
        name,
        description,
        date,
        timeParis,
        timeYaounde,
        location,
        moderators,
        participants,
      });

      const savedActivity = await activity.save();
      res.status(201).json({
        message: "Activité créée avec succès",
        activity: savedActivity,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
);

// Modifier une activité (ADMIN ou DEV)
router.put(
  "/:id",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const {
        name,
        description,
        date,
        timeParis,
        timeYaounde,
        location,
        moderators,
        participants,
      } = req.body;

      const activity = await Activity.findByIdAndUpdate(
        req.params.id,
        {
          name,
          description,
          date,
          timeParis,
          timeYaounde,
          location,
          moderators,
          participants,
        },
        { new: true, runValidators: true },
      );

      if (!activity) {
        return res.status(404).json({ message: "Activité non trouvée" });
      }

      res.json({
        message: "Activité mise à jour avec succès",
        activity,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
);

// Supprimer une activité (ADMIN ou DEV)
router.delete(
  "/:id",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const activity = await Activity.findByIdAndDelete(req.params.id);

      if (!activity) {
        return res.status(404).json({ message: "Activité non trouvée" });
      }

      res.json({
        message: "Activité supprimée avec succès",
        deletedActivity: activity,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

export default router;
