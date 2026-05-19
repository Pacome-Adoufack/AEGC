import express from "express";
import Announcement from "../models/Announcement.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";

const router = express.Router();

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

// Obtenir les annonces publiées (PUBLIC)
router.get("/api/announcements", async (req, res) => {
  try {
    const today = toDateOnly(new Date());
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 6, 1), 20);

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

    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    console.error("Erreur annonces publiques:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Obtenir toutes les annonces (ADMIN/DEV)
router.get("/api/admin/announcements", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
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

    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    console.error("Erreur annonces admin:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Créer une annonce (ADMIN/DEV)
router.post("/api/admin/announcements", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const { title, summary, content, category, isPublished, publishedAt, expiresAt, isPinned } = req.body;

    if (!title || !summary) {
      return res.status(400).json({ success: false, error: "Le titre et le résumé sont requis" });
    }

    const shouldPublish = Boolean(isPublished);
    const publicationDate = shouldPublish
      ? publishedAt ? toDateOnly(publishedAt) : toDateOnly(new Date())
      : null;
    const expiresDate = expiresAt ? toDateOnly(expiresAt) : null;

    if (expiresDate && publicationDate && expiresDate <= publicationDate) {
      return res.status(400).json({
        success: false,
        error: "La date d'expiration doit être après la date de publication",
      });
    }

    const announcement = await Announcement.create({
      title, summary, content, category,
      isPublished: shouldPublish,
      publishedAt: publicationDate,
      expiresAt: expiresDate,
      isPinned: Boolean(isPinned),
      author: req.user.id,
    });

    const populated = await Announcement.findById(announcement._id)
      .populate("author", "firstName name")
      .lean();

    if (populated) {
      populated.publishedAt = formatDateOnly(populated.publishedAt);
      populated.expiresAt = formatDateOnly(populated.expiresAt);
    }

    res.status(201).json({ success: true, message: "Annonce créée avec succès", data: populated });
  } catch (error) {
    console.error("Erreur création annonce:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Modifier une annonce (ADMIN/DEV)
router.put("/api/admin/announcements/:id", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const { title, summary, content, category, isPublished, publishedAt, expiresAt, isPinned } = req.body;
    const current = await Announcement.findById(req.params.id);

    if (!current) return res.status(404).json({ success: false, error: "Annonce non trouvée" });

    const nextIsPublished = typeof isPublished === "boolean" ? isPublished : current.isPublished;
    const nextPublishedAt = nextIsPublished
      ? publishedAt
        ? toDateOnly(publishedAt)
        : current.publishedAt ? toDateOnly(current.publishedAt) : toDateOnly(new Date())
      : null;
    const nextExpiresAt = expiresAt ? toDateOnly(expiresAt) : null;

    if (nextExpiresAt && nextPublishedAt && nextExpiresAt <= nextPublishedAt) {
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
    current.isPinned = typeof isPinned === "boolean" ? isPinned : current.isPinned;
    await current.save();

    const populated = await Announcement.findById(current._id)
      .populate("author", "firstName name")
      .lean();

    if (populated) {
      populated.publishedAt = formatDateOnly(populated.publishedAt);
      populated.expiresAt = formatDateOnly(populated.expiresAt);
    }

    res.status(200).json({ success: true, message: "Annonce mise à jour avec succès", data: populated });
  } catch (error) {
    console.error("Erreur modification annonce:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Supprimer une annonce (ADMIN/DEV)
router.delete("/api/admin/announcements/:id", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, error: "Annonce non trouvée" });
    res.status(200).json({ success: true, message: "Annonce supprimée avec succès" });
  } catch (error) {
    console.error("Erreur suppression annonce:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

export default router;
