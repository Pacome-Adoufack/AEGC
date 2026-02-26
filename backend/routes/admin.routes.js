import express from "express";
import Faq from "../models/Faq.js";
import Image from "../models/Picture.js";
import Contact from "../models/Contact.js";
import Subscribe from "../models/Subscribe.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";

const router = express.Router();

// ============================================
// FAQ
// ============================================

// Obtenir toutes les FAQs (PUBLIC)
router.get("/faq", async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs,
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
});

// Créer une FAQ (ADMIN/DEV)
router.post(
  "/faq",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const faqData = req.body;

      if (!faqData || Object.keys(faqData).length === 0) {
        return res.status(400).json({ error: "Données FAQ invalides" });
      }

      // Validation des données
      const requiredQuestions = [
        "q1",
        "q2",
        "q3",
        "q4",
        "q5",
        "q6",
        "q7",
        "q8",
        "q9",
        "q10",
        "q11",
        "q12",
        "q13",
        "q14",
        "q15",
      ];

      for (const q of requiredQuestions) {
        if (!faqData[q] || !faqData[q].question || !faqData[q].answer) {
          return res
            .status(400)
            .json({ error: `Données manquantes pour ${q}` });
        }
      }

      const faq = new Faq(faqData);
      await faq.save();

      res.status(201).json({
        success: true,
        message: "FAQ créée avec succès",
        data: faq,
      });
    } catch (error) {
      console.error("Erreur:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          error: "Erreur de validation",
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: "Erreur serveur interne",
      });
    }
  },
);

// Modifier une FAQ (ADMIN/DEV)
router.put(
  "/faq/:id",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!faq) {
        return res.status(404).json({ error: "FAQ non trouvée" });
      }

      res.json({
        success: true,
        message: "FAQ mise à jour avec succès",
        data: faq,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

// Supprimer une FAQ (ADMIN/DEV)
router.delete(
  "/faq/:id",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const faq = await Faq.findByIdAndDelete(req.params.id);

      if (!faq) {
        return res.status(404).json({ error: "FAQ non trouvée" });
      }

      res.json({
        success: true,
        message: "FAQ supprimée avec succès",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================
// IMAGES (PICTURES)
// ============================================

// Obtenir toutes les images (PUBLIC)
router.get("/images", async (req, res) => {
  try {
    const images = await Image.find();
    const result = images.map((image) => ({
      id: image._id,
      name: image.name,
      contentType: image.img.contentType,
      year: image.year,
      img: `data:${image.img.contentType};base64,${image.img.data.toString("base64")}`,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Ajouter une image (ADMIN/DEV)
router.post(
  "/picture",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const { image, name, year } = req.body;

      if (!image) {
        return res.status(400).json({ error: "Image requise" });
      }

      const newPicture = new Image({
        img: image,
        name,
        year,
      });

      await newPicture.save();
      res.status(201).json({ message: "Image enregistrée avec succès!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur lors de l'enregistrement." });
    }
  },
);

// Supprimer une image (ADMIN/DEV)
router.delete(
  "/picture/:id",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const picture = await Image.findByIdAndDelete(req.params.id);

      if (!picture) {
        return res.status(404).json({ error: "Image non trouvée" });
      }

      res.json({ message: "Image supprimée avec succès" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================
// CONTACTS
// ============================================

// Envoyer un message de contact (PUBLIC)
router.post("/contact", async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    const newContact = new Contact({
      email,
      subject,
      message,
    });

    await newContact.save();
    res.status(201).json({ message: "Message envoyé avec succès!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de l'envoi du message." });
  }
});

// Obtenir tous les contacts (ADMIN/DEV)
router.get(
  "/contact",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const contacts = await Contact.find().sort({ createdAt: -1 });
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Supprimer un contact (ADMIN/DEV)
router.delete(
  "/contact/:id",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const contact = await Contact.findByIdAndDelete(req.params.id);

      if (!contact) {
        return res.status(404).json({ error: "Contact non trouvé" });
      }

      res.json({ message: "Contact supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================
// ABONNEMENTS (SUBSCRIBE)
// ============================================

// S'abonner à la newsletter (PUBLIC)
router.post("/subscribe", async (req, res) => {
  try {
    const { email, name, lastName } = req.body;

    if (!email || !name || !lastName) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    const newSubscribe = new Subscribe({
      email,
      name,
      lastName,
    });

    await newSubscribe.save();
    res.status(201).json({ message: "Abonnement réussi!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de l'abonnement." });
  }
});

// Obtenir tous les abonnés (ADMIN/DEV)
router.get(
  "/subscribe",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const subscribers = await Subscribe.find().sort({ createdAt: -1 });
      res.json(subscribers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Supprimer un abonné (ADMIN/DEV)
router.delete(
  "/subscribe/:id",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const subscriber = await Subscribe.findByIdAndDelete(req.params.id);

      if (!subscriber) {
        return res.status(404).json({ error: "Abonné non trouvé" });
      }

      res.json({ message: "Abonné supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================
// MEMBERSHIPS / COTISATIONS
// ============================================

// Obtenir tous les memberships (ADMIN/DEV)
router.get(
  "/memberships",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const memberships = await Membership.find()
        .populate("user", "firstName name email membershipStatus")
        .populate("activatedBy", "firstName name")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: memberships.length,
        data: memberships,
      });
    } catch (error) {
      console.error("Erreur récupération memberships:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// Obtenir les statistiques des memberships (ADMIN/DEV)
router.get(
  "/memberships/stats",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const now = new Date();

      // Total des memberships payés
      const totalPaid = await Membership.countDocuments({
        paymentStatus: "paid",
      });

      // Memberships actifs (payés et non expirés)
      const activeMemberships = await Membership.find({
        paymentStatus: "paid",
        endDate: { $gt: now },
      });

      // Memberships expirés
      const expiredCount = await Membership.countDocuments({
        paymentStatus: "paid",
        endDate: { $lte: now },
      });

      // Memberships en attente
      const pendingCount = await Membership.countDocuments({
        paymentStatus: "pending",
      });

      // Calcul des revenus totaux
      let revenueEUR = 0;
      let revenueUSD = 0;

      const paidMemberships = await Membership.find({ paymentStatus: "paid" });
      paidMemberships.forEach((m) => {
        if (m.currency === "EUR") {
          revenueEUR += m.amount;
        } else if (m.currency === "USD") {
          revenueUSD += m.amount;
        }
      });

      // Memberships par méthode de paiement
      const stripeCount = await Membership.countDocuments({
        paymentStatus: "paid",
        paymentMethod: "stripe",
      });
      const manualCount = await Membership.countDocuments({
        paymentStatus: "paid",
        paymentMethod: "manual",
      });
      const orangeMoneyCount = await Membership.countDocuments({
        paymentStatus: "paid",
        paymentMethod: "orange_money",
      });
      const mtnMomoCount = await Membership.countDocuments({
        paymentStatus: "paid",
        paymentMethod: "mtn_momo",
      });
      const notchpayCount = await Membership.countDocuments({
        paymentStatus: "paid",
        paymentMethod: "notchpay",
      });

      // Revenus par devise incluant XAF
      const revenueXAF = paidMemberships
        .filter((m) => m.currency === "XAF")
        .reduce((sum, m) => sum + m.amount, 0);

      res.json({
        success: true,
        stats: {
          total: totalPaid,
          active: activeMemberships.length,
          expired: expiredCount,
          pending: pendingCount,
          revenue: {
            EUR: revenueEUR,
            USD: revenueUSD,
            XAF: revenueXAF,
          },
          paymentMethods: {
            stripe: stripeCount,
            manual: manualCount,
            orange_money: orangeMoneyCount,
            mtn_momo: mtnMomoCount,
            notchpay: notchpayCount,
          },
        },
      });
    } catch (error) {
      console.error("Erreur stats memberships:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// Activer/Attribuer manuellement un membership (ADMIN/DEV)
router.post(
  "/memberships/activate",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    console.log("🔥 Route /memberships/activate appelée!", req.body);
    try {
      const { email, currency, notes } = req.body;

      if (!email || !currency) {
        return res.status(400).json({
          error: "email et currency requis",
        });
      }

      if (!["EUR", "USD", "XAF"].includes(currency)) {
        return res.status(400).json({
          error: "Devise invalide. Choisissez EUR, USD ou XAF.",
        });
      }

      // Vérifier que l'utilisateur existe
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res
          .status(404)
          .json({ error: "Utilisateur non trouvé avec cet email" });
      }

      // Vérifier s'il a déjà un membership actif
      const existingMembership = await Membership.findOne({
        user: user._id,
        paymentStatus: "paid",
        endDate: { $gt: new Date() },
      });

      if (existingMembership) {
        return res.status(400).json({
          error: "Cet utilisateur a déjà une cotisation active",
          membership: existingMembership,
        });
      }

      // Créer un nouveau membership avec le bon montant selon la devise
      let amount;
      if (currency === "EUR") {
        amount = 16;
      } else if (currency === "USD") {
        amount = 18;
      } else if (currency === "XAF") {
        amount = 10000;
      }

      const paymentNumber = await Membership.generatePaymentNumber();

      const membership = new Membership({
        user: user._id,
        amount,
        currency,
        paymentStatus: "paid",
        paymentMethod: "manual",
        paymentNumber,
        startDate: new Date(),
        activatedBy: req.user.id,
        notes: notes || "Activation manuelle par admin",
      });

      membership.calculateEndDate();
      await membership.save();

      // Mettre à jour l'utilisateur
      user.membershipStatus = "active";
      user.currentMembership = membership._id;
      await user.save();

      res.json({
        success: true,
        message: "Membership activé avec succès",
        membership,
      });
    } catch (error) {
      console.error("Erreur activation membership:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// Modifier un membership (ADMIN/DEV)
router.put(
  "/memberships/:id",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const { paymentStatus, notes, endDate } = req.body;

      const membership = await Membership.findById(req.params.id);
      if (!membership) {
        return res.status(404).json({ error: "Membership non trouvé" });
      }

      // Mettre à jour les champs
      if (paymentStatus) membership.paymentStatus = paymentStatus;
      if (notes !== undefined) membership.notes = notes;
      if (endDate) membership.endDate = new Date(endDate);

      await membership.save();

      // Mettre à jour le statut de l'utilisateur
      if (paymentStatus === "paid" && membership.isActive()) {
        await User.findByIdAndUpdate(membership.user, {
          membershipStatus: "active",
          currentMembership: membership._id,
        });
      } else if (paymentStatus === "expired" || !membership.isActive()) {
        await User.findByIdAndUpdate(membership.user, {
          membershipStatus: "expired",
        });
      }

      res.json({
        success: true,
        message: "Membership mis à jour",
        membership,
      });
    } catch (error) {
      console.error("Erreur modification membership:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// Nettoyer les memberships en attente (ADMIN/DEV)
// NOTE IMPORTANTE: Cette route DOIT être AVANT /memberships/:id
// sinon Express matche "cleanup-pending" comme un paramètre :id
router.delete(
  "/memberships/cleanup-pending",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      // Supprimer les memberships "pending" créés il y a plus de 1 heure
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const result = await Membership.deleteMany({
        paymentStatus: "pending",
        createdAt: { $lt: oneHourAgo },
      });

      res.json({
        success: true,
        message: `${result.deletedCount} cotisation(s) en attente supprimée(s)`,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Erreur nettoyage memberships:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// Supprimer un membership (ADMIN/DEV)
router.delete(
  "/memberships/:id",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const membership = await Membership.findByIdAndDelete(req.params.id);

      if (!membership) {
        return res.status(404).json({ error: "Membership non trouvé" });
      }

      // Mettre à jour l'utilisateur
      await User.findByIdAndUpdate(membership.user, {
        membershipStatus: "none",
        currentMembership: null,
      });

      res.json({
        success: true,
        message: "Membership supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur suppression membership:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
