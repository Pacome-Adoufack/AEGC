import express from "express";
import Faq from "../models/Faq.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Obtenir toutes les FAQs (PUBLIC)
router.get("/faq", async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: faqs.length, data: faqs });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Créer une FAQ (ADMIN/DEV)
router.post("/faq", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const faqData = req.body;

    if (!faqData || Object.keys(faqData).length === 0) {
      return res.status(400).json({ error: "Données FAQ invalides" });
    }

    const requiredQuestions = ["q1","q2","q3","q4","q5","q6","q7","q8","q9","q10","q11","q12","q13","q14","q15"];
    for (const q of requiredQuestions) {
      if (!faqData[q] || !faqData[q].question || !faqData[q].answer) {
        return res.status(400).json({ error: `Données manquantes pour ${q}` });
      }
    }

    const faq = new Faq(faqData);
    await faq.save();
    res.status(201).json({ success: true, message: "FAQ créée avec succès", data: faq });
  } catch (error) {
    console.error("Erreur:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: "Erreur de validation", details: error.errors });
    }
    res.status(500).json({ success: false, error: "Erreur serveur interne" });
  }
});

// Modifier une FAQ (ADMIN/DEV)
router.put("/faq/:id", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!faq) return res.status(404).json({ error: "FAQ non trouvée" });
    res.json({ success: true, message: "FAQ mise à jour avec succès", data: faq });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Supprimer une FAQ (ADMIN/DEV)
router.delete("/faq/:id", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const faq = await Faq.findByIdAndDelete(req.params.id);
    if (!faq) return res.status(404).json({ error: "FAQ non trouvée" });
    res.json({ success: true, message: "FAQ supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
