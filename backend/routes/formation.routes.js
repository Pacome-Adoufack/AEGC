import express from "express";
import Formation from "../models/Formations.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";

const router = express.Router();

// ============================================
// ROUTES PUBLIQUES (lecture seule)
// ============================================

// Lister toutes les formations
router.get("/", async (req, res) => {
  try {
    const formations = await Formation.find().sort({ createdAt: -1 });
    res.json(formations);
  } catch (err) {
    console.error("Erreur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Obtenir une formation par ID
router.get("/:id", async (req, res) => {
  try {
    const formation = await Formation.findById(req.params.id);
    if (!formation) {
      return res.status(404).json({ error: "Formation non trouvée" });
    }
    res.json(formation);
  } catch (err) {
    console.error("Erreur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// ROUTES PROTÉGÉES (ADMIN/DEV uniquement)
// ============================================

// Créer une formation (ADMIN ou DEV)
router.post(
  "/",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const {
        title,
        description,
        date,
        teacher,
        duration,
        level,
        price,
        location,
      } = req.body;

      if (
        !title ||
        !description ||
        !date ||
        !teacher ||
        !duration ||
        !level ||
        price === undefined ||
        !location
      ) {
        return res.status(400).json({
          error: "Tous les champs sont requis",
        });
      }

      const formation = new Formation(req.body);
      const saved = await formation.save();

      res.status(201).json({
        message: "Formation créée avec succès",
        formation: saved,
      });
    } catch (err) {
      console.error("Erreur:", err);
      res.status(400).json({ error: err.message });
    }
  },
);

// Modifier une formation (ADMIN ou DEV)
router.put(
  "/:id",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const formation = await Formation.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true },
      );

      if (!formation) {
        return res.status(404).json({ error: "Formation non trouvée" });
      }

      res.json({
        message: "Formation mise à jour avec succès",
        formation,
      });
    } catch (err) {
      console.error("Erreur:", err);
      res.status(400).json({ error: err.message });
    }
  },
);

// Supprimer une formation (ADMIN ou DEV)
router.delete(
  "/:id",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const formation = await Formation.findByIdAndDelete(req.params.id);

      if (!formation) {
        return res.status(404).json({ error: "Formation non trouvée" });
      }

      res.json({
        message: "Formation supprimée avec succès",
        deletedFormation: formation,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
