import express from "express";
import Subscribe from "../models/Subscribe.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";

const router = express.Router();

// S'abonner à la newsletter (PUBLIC)
router.post("/subscribe", async (req, res) => {
  try {
    const { email, name, lastName } = req.body;
    if (!email || !name || !lastName) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }
    const newSubscribe = new Subscribe({ email, name, lastName });
    await newSubscribe.save();
    res.status(201).json({ message: "Abonnement réussi!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de l'abonnement." });
  }
});

// Obtenir tous les abonnés (ADMIN/DEV)
router.get("/subscribe", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const subscribers = await Subscribe.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un abonné (ADMIN/DEV)
router.delete("/subscribe/:id", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const subscriber = await Subscribe.findByIdAndDelete(req.params.id);
    if (!subscriber) return res.status(404).json({ error: "Abonné non trouvé" });
    res.json({ message: "Abonné supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
