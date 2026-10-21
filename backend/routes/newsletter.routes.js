import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import Subscribe from "../models/Subscribe.js";
import Announcement from "../models/Announcement.js";
import { buildRecipients, sendAnnouncement } from "../services/newsletterMailer.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";

const router = express.Router();

const ensureToken = (user) => {
  if (!user.newsletterToken) user.newsletterToken = crypto.randomBytes(24).toString("hex");
  return user.newsletterToken;
};

// État du consentement du compte connecté.
// `newsletterOptIn: null` signifie « jamais sollicité » : c'est ce qui
// déclenche le bandeau côté site.
router.get("/api/newsletter/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("newsletterOptIn newsletterOptInAt");
    if (!user) return res.status(404).json({ success: false, error: "Compte introuvable" });
    res.json({
      success: true,
      optIn: user.newsletterOptIn,
      answered: user.newsletterOptIn !== null && user.newsletterOptIn !== undefined,
      answeredAt: user.newsletterOptInAt,
    });
  } catch (error) {
    console.error("Erreur consentement:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Répondre au bandeau, ou changer d'avis depuis son espace membre.
router.patch("/api/newsletter/me", authMiddleware, async (req, res) => {
  try {
    const optIn = req.body.optIn === true || req.body.optIn === "true";
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "Compte introuvable" });

    user.newsletterOptIn = optIn;
    // La date est mise à jour à chaque réponse : c'est la trace du
    // consentement, elle doit refléter la dernière volonté exprimée.
    user.newsletterOptInAt = new Date();
    ensureToken(user);
    await user.save();

    res.json({
      success: true,
      optIn: user.newsletterOptIn,
      message: optIn ? "Vous recevrez les actualités de l'AEGC" : "Vous ne recevrez pas les actualités",
    });
  } catch (error) {
    console.error("Erreur consentement:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Désinscription depuis un courriel, SANS connexion : c'est une obligation
// légale, le lien doit fonctionner en un clic.
router.get("/api/newsletter/unsubscribe/:token", async (req, res) => {
  try {
    const token = String(req.params.token || "");
    if (token.length < 20) return res.status(404).json({ success: false, error: "Lien invalide" });

    const user = await User.findOne({ newsletterToken: token });
    if (user) {
      user.newsletterOptIn = false;
      user.newsletterOptInAt = new Date();
      await user.save();
      return res.json({ success: true, message: "Vous êtes désinscrit des actualités de l'AEGC" });
    }

    // Le lien peut aussi venir de la liste d'abonnés, qui n'a pas de compte.
    const abonne = await Subscribe.findOne({ unsubscribeToken: token });
    if (abonne) {
      await Subscribe.deleteOne({ _id: abonne._id });
      return res.json({ success: true, message: "Vous êtes désinscrit des actualités de l'AEGC" });
    }

    res.status(404).json({ success: false, error: "Lien invalide ou déjà utilisé" });
  } catch (error) {
    console.error("Erreur désinscription:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Nombre de destinataires, pour l'administration (ADMIN/DEV).
// Affiché avant l'envoi : on ne clique pas « envoyer » sans savoir à combien
// de personnes le message part.
router.get("/api/admin/newsletter/recipients", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const [membres, enAttente, abonnes] = await Promise.all([
      User.countDocuments({ newsletterOptIn: true }),
      User.countDocuments({ $or: [{ newsletterOptIn: null }, { newsletterOptIn: { $exists: false } }] }),
      Subscribe.countDocuments(),
    ]);
    res.json({ success: true, membres, enAttente, abonnes, total: membres + abonnes });
  } catch (error) {
    console.error("Erreur destinataires:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Envoyer une annonce aux abonnés (ADMIN/DEV).
// Déclenché par un bouton, jamais automatiquement à la publication : une
// correction de faute de frappe relancerait sinon un envoi à tout le monde.
router.post(
  "/api/admin/announcements/:id/newsletter",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const annonce = await Announcement.findById(req.params.id);
      if (!annonce) return res.status(404).json({ success: false, error: "Annonce introuvable" });
      if (!annonce.isPublished) {
        return res.status(400).json({ success: false, error: "Publiez l'annonce avant de l'envoyer" });
      }
      if (annonce.newsletter?.sentAt && req.body.force !== true) {
        return res.status(409).json({
          success: false,
          error: `Déjà envoyée le ${new Date(annonce.newsletter.sentAt).toLocaleDateString("fr-FR")}`,
        });
      }

      const destinataires = await buildRecipients();
      if (destinataires.length === 0) {
        return res.status(400).json({ success: false, error: "Aucun abonné pour le moment" });
      }

      const { envoyes, erreurs } = await sendAnnouncement(annonce, destinataires);

      annonce.newsletter = {
        sentAt: new Date(),
        sentBy: req.user.id,
        recipients: envoyes,
        failed: erreurs.length,
      };
      await annonce.save();

      res.json({
        success: true,
        message: `Envoyée à ${envoyes} destinataire${envoyes > 1 ? "s" : ""}`,
        envoyes,
        echecs: erreurs.length,
        // Les adresses en échec sont utiles à l'admin pour corriger une faute
        // de frappe, mais on n'en renvoie qu'un échantillon.
        exemples: erreurs.slice(0, 5),
      });
    } catch (error) {
      console.error("Erreur envoi newsletter:", error);
      res.status(500).json({ success: false, error: error.message || "Erreur serveur" });
    }
  },
);

export default router;
