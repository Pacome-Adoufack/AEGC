import express from "express";
import Contact from "../models/Contact.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Envoyer un message de contact (PUBLIC)
router.post("/contact", async (req, res) => {
  try {
    const { email, subject, message } = req.body;
    if (!email || !subject || !message) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }
    const newContact = new Contact({ email, subject, message });
    await newContact.save();
    res.status(201).json({ message: "Message envoyé avec succès!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de l'envoi du message." });
  }
});

// Obtenir tous les contacts (ADMIN/DEV)
router.get("/contact", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un contact (ADMIN/DEV)
router.delete("/contact/:id", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ error: "Contact non trouvé" });
    res.json({ message: "Contact supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
