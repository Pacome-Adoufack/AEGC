import express from "express";
import Faq from "../models/Faq.js";
import Image from "../models/Picture.js";
import Contact from "../models/Contact.js";
import Subscribe from "../models/Subscribe.js";
import Membership from "../models/Membership.js";
import Announcement from "../models/Announcement.js";
import User from "../models/User.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Helpers: normalize date to local date-only (midnight) and format YYYY-MM-DD
function toDateOnly(input) {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDateOnly(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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
// ANNOUNCEMENTS
// ============================================

// Obtenir les annonces publiées (PUBLIC)
router.get("/api/announcements", async (req, res) => {
  try {
    const today = toDateOnly(new Date());
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 6, 1),
      20,
    );

    const announcements = await Announcement.find({
      isPublished: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: today } }],
    })
      .sort({ isPinned: -1, publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .populate("author", "firstName name")
      .lean();

    const mapped = announcements.map((a) => ({
      ...a,
      publishedAt: formatDateOnly(a.publishedAt),
      expiresAt: formatDateOnly(a.expiresAt),
    }));

    res.status(200).json({
      success: true,
      count: mapped.length,
      data: mapped,
    });
  } catch (error) {
    console.error("Erreur annonces publiques:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Obtenir toutes les annonces (ADMIN/DEV)
router.get(
  "/api/admin/announcements",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const announcements = await Announcement.find()
        .sort({ createdAt: -1 })
        .populate("author", "firstName name")
        .lean();

      const mapped = announcements.map((a) => ({
        ...a,
        publishedAt: formatDateOnly(a.publishedAt),
        expiresAt: formatDateOnly(a.expiresAt),
      }));

      res.status(200).json({
        success: true,
        count: mapped.length,
        data: mapped,
      });
    } catch (error) {
      console.error("Erreur annonces admin:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  },
);

// Créer une annonce (ADMIN/DEV)
router.post(
  "/api/admin/announcements",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const {
        title,
        summary,
        content,
        category,
        isPublished,
        publishedAt,
        expiresAt,
        isPinned,
      } = req.body;

      if (!title || !summary) {
        return res
          .status(400)
          .json({ success: false, error: "Le titre et le résumé sont requis" });
      }

      const shouldPublish = Boolean(isPublished);
      const publicationDate = shouldPublish
        ? publishedAt
          ? toDateOnly(publishedAt)
          : toDateOnly(new Date())
        : null;

      const expiresDate = expiresAt ? toDateOnly(expiresAt) : null;

      if (expiresDate && publicationDate && expiresDate <= publicationDate) {
        return res.status(400).json({
          success: false,
          error: "La date d'expiration doit être après la date de publication",
        });
      }

      const announcement = await Announcement.create({
        title,
        summary,
        content,
        category,
        isPublished: shouldPublish,
        publishedAt: publicationDate,
        expiresAt: expiresDate,
        isPinned: Boolean(isPinned),
        author: req.user.id,
      });

      const populated = await Announcement.findById(announcement._id)
        .populate("author", "firstName name")
        .lean();

      // format dates without time for response
      if (populated) {
        populated.publishedAt = formatDateOnly(populated.publishedAt);
        populated.expiresAt = formatDateOnly(populated.expiresAt);
      }

      res.status(201).json({
        success: true,
        message: "Annonce créée avec succès",
        data: populated,
      });
    } catch (error) {
      console.error("Erreur création annonce:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  },
);

// Modifier une annonce (ADMIN/DEV)
router.put(
  "/api/admin/announcements/:id",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const {
        title,
        summary,
        content,
        category,
        isPublished,
        publishedAt,
        expiresAt,
        isPinned,
      } = req.body;
      const current = await Announcement.findById(req.params.id);

      if (!current) {
        return res
          .status(404)
          .json({ success: false, error: "Annonce non trouvée" });
      }

      const nextIsPublished =
        typeof isPublished === "boolean" ? isPublished : current.isPublished;
      const nextPublishedAt = nextIsPublished
        ? publishedAt
          ? toDateOnly(publishedAt)
          : current.publishedAt
            ? toDateOnly(current.publishedAt)
            : toDateOnly(new Date())
        : null;
      const nextExpiresAt = expiresAt ? toDateOnly(expiresAt) : null;

      if (
        nextExpiresAt &&
        nextPublishedAt &&
        nextExpiresAt <= nextPublishedAt
      ) {
        return res.status(400).json({
          success: false,
          error: "La date d'expiration doit être après la date de publication",
        });
      }

      current.title = title ?? current.title;
      current.summary = summary ?? current.summary;
      current.content = content ?? current.content;
      current.category = category ?? current.category;
      current.isPublished = nextIsPublished;
      current.publishedAt = nextPublishedAt;
      current.expiresAt = nextExpiresAt;
      current.isPinned =
        typeof isPinned === "boolean" ? isPinned : current.isPinned;

      await current.save();

      const populated = await Announcement.findById(current._id)
        .populate("author", "firstName name")
        .lean();

      if (populated) {
        populated.publishedAt = formatDateOnly(populated.publishedAt);
        populated.expiresAt = formatDateOnly(populated.expiresAt);
      }

      res.status(200).json({
        success: true,
        message: "Annonce mise à jour avec succès",
        data: populated,
      });
    } catch (error) {
      console.error("Erreur modification annonce:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
    }
  },
);

// Supprimer une annonce (ADMIN/DEV)
router.delete(
  "/api/admin/announcements/:id",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const announcement = await Announcement.findByIdAndDelete(req.params.id);

      if (!announcement) {
        return res
          .status(404)
          .json({ success: false, error: "Annonce non trouvée" });
      }

      res.status(200).json({
        success: true,
        message: "Annonce supprimée avec succès",
      });
    } catch (error) {
      console.error("Erreur suppression annonce:", error);
      res.status(500).json({ success: false, error: "Erreur serveur" });
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
        .populate("approvedBy", "firstName name")
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

      // Total des memberships approuvés
      const totalApproved = await Membership.countDocuments({
        submissionStatus: "approved",
      });

      // Memberships actifs (approuvés et non expirés)
      const activeMemberships = await Membership.find({
        submissionStatus: "approved",
        endDate: { $gt: now },
      });

      // Memberships expirés
      const expiredCount = await Membership.countDocuments({
        submissionStatus: "approved",
        endDate: { $lte: now },
      });

      // Memberships en attente
      const pendingCount = await Membership.countDocuments({
        submissionStatus: "pending",
      });

      // Calcul des revenus totaux (selon montant renseigné)
      let revenueEUR = 0;
      let revenueUSD = 0;

      const approvedMemberships = await Membership.find({
        submissionStatus: "approved",
      });
      approvedMemberships.forEach((m) => {
        if (m.currency === "EUR") {
          revenueEUR += m.amount || 0;
        } else if (m.currency === "USD") {
          revenueUSD += m.amount || 0;
        }
      });

      // Memberships par méthode de soumission
      const bankCount = await Membership.countDocuments({
        submissionStatus: "approved",
        submissionMethod: "bank_transfer",
      });
      const orangeMoneyCount = await Membership.countDocuments({
        submissionStatus: "approved",
        submissionMethod: "orange_money",
      });
      const mtnMomoCount = await Membership.countDocuments({
        submissionStatus: "approved",
        submissionMethod: "mtn_momo",
      });
      const manualFormCount = await Membership.countDocuments({
        submissionStatus: "approved",
        submissionMethod: "manual_form",
      });
      const emailCount = await Membership.countDocuments({
        submissionStatus: "approved",
        submissionMethod: "email",
      });
      const onlineCount = await Membership.countDocuments({
        submissionStatus: "approved",
        submissionMethod: "online",
      });

      // Revenus par devise incluant XAF
      const revenueXAF = approvedMemberships
        .filter((m) => m.currency === "XAF")
        .reduce((sum, m) => sum + (m.amount || 0), 0);

      res.json({
        success: true,
        stats: {
          total: totalApproved,
          active: activeMemberships.length,
          expired: expiredCount,
          pending: pendingCount,
          revenue: {
            EUR: revenueEUR,
            USD: revenueUSD,
            XAF: revenueXAF,
          },
          paymentMethods: {
            bank_transfer: bankCount,
            orange_money: orangeMoneyCount,
            mtn_momo: mtnMomoCount,
            manual_form: manualFormCount,
            email: emailCount,
            online: onlineCount,
          },
        },
      });
    } catch (error) {
      console.error("Erreur stats memberships:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// Obtenir les memberships en attente (ADMIN/DEV)
router.get(
  "/memberships/pending",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const pending = await Membership.find({ submissionStatus: "pending" })
        .populate("user", "firstName name email membershipStatus")
        .sort({ createdAt: -1 });

      res.json({ success: true, count: pending.length, data: pending });
    } catch (error) {
      console.error("Erreur récupération pending memberships:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// Approuver une demande de membership (ADMIN)
router.post(
  "/memberships/:id/approve",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const id = req.params.id;
      const membership = await Membership.findById(id);
      if (!membership)
        return res.status(404).json({ message: "Membership not found" });
      if (membership.submissionStatus === "approved") {
        return res.json({
          success: true,
          message: "Déjà approuvé",
          membership,
        });
      }

      // Accept optional overrides from admin: years, amount, currency
      const { years, amount, currency } = req.body || {};
      if (amount !== undefined && !isNaN(Number(amount)))
        membership.amount = Number(amount);
      if (currency && ["EUR", "USD", "XAF"].includes(currency))
        membership.currency = currency;

      membership.submissionStatus = "approved";
      membership.startDate = new Date();
      membership.calculateEndDate(
        Number.isInteger(Number(years)) ? Number(years) : 1,
      );
      membership.approvedBy = req.user.id;
      membership.approvedAt = new Date();
      await membership.save();

      await User.findByIdAndUpdate(membership.user, {
        membershipStatus: "active",
        currentMembership: membership._id,
      });

      // Récupérer le membership peuplé pour renvoyer les informations utilisateur
      const populatedMembership = await Membership.findById(membership._id)
        .populate("user", "firstName name email membershipStatus")
        .populate("approvedBy", "firstName name");

      res.json({
        success: true,
        message: "Membership approuvé",
        membership: populatedMembership,
      });
    } catch (error) {
      console.error("Erreur approbation membership:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// Rejeter une demande de membership (ADMIN)
router.post(
  "/memberships/:id/reject",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const id = req.params.id;
      const { reason } = req.body;
      if (!reason) return res.status(400).json({ message: "Reason required" });

      const membership = await Membership.findById(id);
      if (!membership)
        return res.status(404).json({ message: "Membership not found" });

      membership.submissionStatus = "rejected";
      membership.rejectionReason = reason;
      await membership.save();

      await User.findByIdAndUpdate(membership.user, {
        currentMembership: membership._id,
        membershipStatus: "none",
      });

      const populatedMembership = await Membership.findById(membership._id)
        .populate("user", "firstName name email membershipStatus")
        .populate("approvedBy", "firstName name");

      res.json({
        success: true,
        message: "Membership rejeté",
        membership: populatedMembership,
      });
    } catch (error) {
      console.error("Erreur rejet membership:", error);
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
      // Simplification: n'exiger que l'email. Les autres champs sont facultatifs.
      const { email, currency, notes } = req.body;

      if (!email) {
        return res.status(400).json({ error: "email requis" });
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
        submissionStatus: "approved",
        endDate: { $gt: new Date() },
      });

      if (existingMembership) {
        return res.status(400).json({
          error: "Cet utilisateur a déjà une cotisation active",
          membership: existingMembership,
        });
      }

      // Choisir une devise par défaut si non précisée (XAF)
      const chosenCurrency =
        currency && ["EUR", "USD", "XAF"].includes(currency) ? currency : "XAF";
      let amount = 10000;
      if (chosenCurrency === "EUR") amount = 16;
      if (chosenCurrency === "USD") amount = 18;

      const paymentNumber = await Membership.generatePaymentNumber();

      const membership = new Membership({
        user: user._id,
        amount,
        currency: chosenCurrency,
        submissionStatus: "approved",
        submissionMethod: "manual_form",
        paymentNumber,
        startDate: new Date(),
        approvedBy: req.user.id,
        approvedAt: new Date(),
        notes: notes || "Activation manuelle par admin",
      });

      // If admin provided a specific number of years or an explicit amount, apply them
      if (
        req.body &&
        req.body.years &&
        Number.isInteger(Number(req.body.years))
      ) {
        membership.calculateEndDate(Number(req.body.years));
      } else {
        membership.calculateEndDate(1);
      }
      if (req.body && req.body.amount && !isNaN(Number(req.body.amount))) {
        membership.amount = Number(req.body.amount);
      }

      await membership.save();

      // Mettre à jour l'utilisateur
      user.membershipStatus = "active";
      user.currentMembership = membership._id;
      await user.save();

      const populatedMembership = await Membership.findById(membership._id)
        .populate("user", "firstName name email membershipStatus")
        .populate("approvedBy", "firstName name");

      res.json({
        success: true,
        message: "Membership activé avec succès",
        membership: populatedMembership,
      });
    } catch (error) {
      console.error("Erreur activation membership:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

const activateMembershipHandler = async (req, res) => {
  try {
    // Simplification: n'exiger que l'email. Les autres champs sont facultatifs.
    const { email, currency, notes } = req.body;

    if (!email) {
      return res.status(400).json({ error: "email requis" });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res
        .status(404)
        .json({ error: "Utilisateur non trouvé avec cet email" });
    }

    // Empêcher l'activation si le membre est déjà actif
    const currentMembership = user.currentMembership
      ? await Membership.findById(user.currentMembership)
      : null;
    const isAlreadyActive =
      user.membershipStatus === "active" &&
      currentMembership &&
      typeof currentMembership.isActive === "function" &&
      currentMembership.isActive();

    if (isAlreadyActive) {
      return res.status(409).json({
        error: "Abonnement déjà actif",
        message: "Ce membre a déjà un abonnement actif.",
      });
    }

    // Choisir une devise par défaut si non précisée (XAF)
    const chosenCurrency =
      currency && ["EUR", "USD", "XAF"].includes(currency) ? currency : "XAF";
    let amount = 10000;
    if (chosenCurrency === "EUR") amount = 16;
    if (chosenCurrency === "USD") amount = 18;

    const paymentNumber = await Membership.generatePaymentNumber();

    const membership = new Membership({
      user: user._id,
      amount,
      currency: chosenCurrency,
      submissionStatus: "approved",
      submissionMethod: "manual_form",
      paymentNumber,
      startDate: new Date(),
      approvedBy: req.user.id,
      approvedAt: new Date(),
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
      message: "Utilisateur trouvé et abonnement activé",
      membership: await Membership.findById(membership._id)
        .populate("user", "firstName name email membershipStatus")
        .populate("approvedBy", "firstName name"),
    });
  } catch (error) {
    console.error("Erreur activation membership:", error);
    res.status(500).json({ error: error.message });
  }
};

router.post(
  "/memberships/activate",
  authMiddleware,
  requireRole(["admin", "dev"]),
  activateMembershipHandler,
);

// Alias pour couvrir les appels qui utilisent /api/memberships/activate
router.post(
  "/api/memberships/activate",
  authMiddleware,
  requireRole(["admin", "dev"]),
  activateMembershipHandler,
);

// Modifier un membership (ADMIN/DEV)
router.put(
  "/memberships/:id",
  authMiddleware,
  requireRole(["admin", "dev"]),
  async (req, res) => {
    try {
      const { submissionStatus, paymentStatus, notes, endDate } = req.body;

      const membership = await Membership.findById(req.params.id);
      if (!membership) {
        return res.status(404).json({ error: "Membership non trouvé" });
      }

      // Mettre à jour les champs
      const normalizedSubmissionStatus =
        submissionStatus ||
        (paymentStatus === "paid"
          ? "approved"
          : paymentStatus === "pending"
            ? "pending"
            : paymentStatus === "cancelled"
              ? "rejected"
              : null);

      if (normalizedSubmissionStatus)
        membership.submissionStatus = normalizedSubmissionStatus;
      // Allow admin to set amount/currency/years when updating
      if (req.body.amount !== undefined && !isNaN(Number(req.body.amount)))
        membership.amount = Number(req.body.amount);
      if (
        req.body.currency &&
        ["EUR", "USD", "XAF"].includes(req.body.currency)
      )
        membership.currency = req.body.currency;
      if (req.body.years && Number.isInteger(Number(req.body.years))) {
        membership.calculateEndDate(Number(req.body.years));
      } else if (endDate) {
        membership.endDate = new Date(endDate);
      }
      if (notes !== undefined) membership.notes = notes;

      await membership.save();

      // Mettre à jour le statut de l'utilisateur
      if (membership.submissionStatus === "approved" && membership.isActive()) {
        await User.findByIdAndUpdate(membership.user, {
          membershipStatus: "active",
          currentMembership: membership._id,
        });
      } else if (!membership.isActive()) {
        await User.findByIdAndUpdate(membership.user, {
          membershipStatus: "expired",
          currentMembership: null,
        });
      }

      const populatedMembership = await Membership.findById(membership._id)
        .populate("user", "firstName name email membershipStatus")
        .populate("approvedBy", "firstName name");

      res.json({
        success: true,
        message: "Membership mis à jour",
        membership: populatedMembership,
      });
    } catch (error) {
      console.error("Erreur modification membership:", error);
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
