import express from "express";
import fs from "fs";
import mongoose from "mongoose";
import Award from "../models/Award.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";
import {
  uploadAwardFiles,
  toStoredAwardFile,
  discardAwardFiles,
} from "../middlewares/uploadAwardFiles.js";
import { resolveStoredPath, deleteStoredFiles } from "../utils/uploadStorage.js";

const router = express.Router();

// Les adresses sont parfois collées entre guillemets ; on nettoie, et on
// n'accepte que http(s) : un lien "javascript:" deviendrait une faille.
function cleanUrl(value) {
  const url = String(value || "").trim().replace(/^["'\s]+|["'\s]+$/g, "");
  return /^https?:\/\//i.test(url) ? url : "";
}

const parseBoolean = (value) => value === true || value === "true" || value === "on";

function parseYear(value) {
  const year = Number.parseInt(value, 10);
  return Number.isFinite(year) && year >= 2000 && year <= 2200 ? year : null;
}

// Forme renvoyée au client : jamais le chemin disque, toujours des URL de l'API.
function serializeAward(award) {
  return {
    _id: award._id,
    category: award.category,
    categoryRank: award.categoryRank,
    year: award.year,
    laureate: award.laureate,
    affiliation: award.affiliation,
    profileUrl: award.profileUrl,
    citation: award.citation,
    isPublished: award.isPublished,
    publishedAt: award.publishedAt,
    hasDocument: Boolean(award.document),
    documentName: award.document?.originalName || "",
    documentUrl: award.document ? `/api/awards/${award._id}/document` : null,
    photoUrl: award.photo ? `/api/awards/${award._id}/photo` : null,
  };
}

// Regroupe les lauréats d'un même prix : une carte par prix, pouvant porter
// plusieurs portraits (le Prix du jeune économiste 2026 a deux lauréats).
function groupByPrize(awards) {
  const prizes = new Map();
  for (const award of awards) {
    const key = award.category;
    if (!prizes.has(key)) {
      prizes.set(key, {
        category: award.category,
        categoryRank: award.categoryRank || 0,
        laureates: [],
      });
    }
    prizes.get(key).laureates.push(serializeAward(award));
  }
  return [...prizes.values()].sort(
    (a, b) => a.categoryRank - b.categoryRank || a.category.localeCompare(b.category),
  );
}

// Regroupe par année décroissante, puis par prix à l'intérieur de chaque année.
function groupByYear(awards) {
  const years = new Map();
  for (const award of awards) {
    if (!years.has(award.year)) years.set(award.year, []);
    years.get(award.year).push(award);
  }
  return [...years.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({ year, prizes: groupByPrize(items) }));
}

// ─────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────

// Tous les prix publiés, groupés par année (PUBLIC)
router.get("/api/awards", async (req, res) => {
  try {
    const awards = await Award.find({ isPublished: true })
      .sort({ year: -1, categoryRank: 1, category: 1 })
      .lean();
    res.status(200).json({ success: true, data: groupByYear(awards) });
  } catch (error) {
    console.error("Erreur liste prix:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Lauréats de l'année civile en cours (PUBLIC)
// Alimente le bandeau de la page d'accueil, qui disparaît de lui-même tant
// qu'aucun lauréat de l'année n'est publié.
router.get("/api/awards/current", async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const awards = await Award.find({ isPublished: true, year })
      .sort({ categoryRank: 1, category: 1 })
      .lean();
    res.status(200).json({ success: true, year, data: groupByPrize(awards) });
  } catch (error) {
    console.error("Erreur prix de l'année:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Fichier joint : document PDF ou photo du lauréat (PUBLIC, uniquement si publié)
router.get("/api/awards/:id/:kind", async (req, res) => {
  try {
    const { id, kind } = req.params;
    if (!mongoose.isValidObjectId(id) || !["document", "photo"].includes(kind)) {
      return res.status(404).json({ success: false, error: "Fichier introuvable" });
    }

    const award = await Award.findById(id).select("document photo isPublished").lean();
    // Un prix encore en brouillon ne laisse pas fuiter ses fichiers par une URL devinée.
    if (!award?.isPublished) {
      return res.status(404).json({ success: false, error: "Fichier introuvable" });
    }

    const file = award[kind];
    const filePath = resolveStoredPath(file?.storedPath);
    if (!file || !filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: "Fichier introuvable" });
    }

    res.setHeader("Content-Type", file.mimetype);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
    res.sendFile(filePath);
  } catch (error) {
    console.error("Erreur fichier prix:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────

// Tous les prix, publiés ou non (ADMIN/DEV)
router.get("/api/admin/awards", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const awards = await Award.find().sort({ year: -1, categoryRank: 1, category: 1 }).lean();
    res.status(200).json({
      success: true,
      data: awards.map(serializeAward),
      // Les catégories déjà utilisées servent de suggestions dans le formulaire :
      // le bureau peut en ajouter sans qu'on touche au code.
      categories: [...new Set(awards.map((a) => a.category))].sort(),
    });
  } catch (error) {
    console.error("Erreur liste prix admin:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Enregistrer un lauréat (ADMIN/DEV)
router.post(
  "/api/admin/awards",
  authMiddleware,
  requireRole(["admin", "dev"]),
  uploadAwardFiles,
  async (req, res) => {
    try {
      const category = (req.body.category || "").trim();
      const laureate = (req.body.laureate || "").trim();
      const year = parseYear(req.body.year);

      if (!category || !laureate || !year) {
        await discardAwardFiles(req.files);
        return res.status(400).json({
          success: false,
          error: "Le prix, l'année et le lauréat sont requis",
        });
      }

      const isPublished = parseBoolean(req.body.isPublished);
      const award = await Award.create({
        category,
        categoryRank: Number.parseInt(req.body.categoryRank, 10) || 0,
        year,
        laureate,
        affiliation: (req.body.affiliation || "").trim(),
        profileUrl: cleanUrl(req.body.profileUrl),
        citation: (req.body.citation || "").trim(),
        document: req.files?.document?.[0] ? toStoredAwardFile(req.files.document[0]) : null,
        photo: req.files?.photo?.[0] ? toStoredAwardFile(req.files.photo[0]) : null,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
        createdBy: req.user.id,
      });

      res.status(201).json({ success: true, data: serializeAward(award.toObject()) });
    } catch (error) {
      await discardAwardFiles(req.files);
      console.error("Erreur création prix:", error);
      const status = error.name === "ValidationError" ? 400 : 500;
      res.status(status).json({ success: false, error: status === 400 ? error.message : "Erreur serveur" });
    }
  },
);

// Modifier un lauréat (ADMIN/DEV). Un fichier non renvoyé est conservé.
router.put(
  "/api/admin/awards/:id",
  authMiddleware,
  requireRole(["admin", "dev"]),
  uploadAwardFiles,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        await discardAwardFiles(req.files);
        return res.status(404).json({ success: false, error: "Prix introuvable" });
      }
      const award = await Award.findById(req.params.id);
      if (!award) {
        await discardAwardFiles(req.files);
        return res.status(404).json({ success: false, error: "Prix introuvable" });
      }

      const obsolete = [];

      if (typeof req.body.category === "string" && req.body.category.trim()) {
        award.category = req.body.category.trim();
      }
      if (typeof req.body.laureate === "string" && req.body.laureate.trim()) {
        award.laureate = req.body.laureate.trim();
      }
      const year = parseYear(req.body.year);
      if (year) award.year = year;
      if (typeof req.body.affiliation === "string") award.affiliation = req.body.affiliation.trim();
      if (typeof req.body.profileUrl === "string") award.profileUrl = cleanUrl(req.body.profileUrl);
      if (typeof req.body.citation === "string") award.citation = req.body.citation.trim();
      if (req.body.categoryRank !== undefined) {
        award.categoryRank = Number.parseInt(req.body.categoryRank, 10) || 0;
      }

      for (const kind of ["document", "photo"]) {
        const file = req.files?.[kind]?.[0];
        if (file) {
          if (award[kind]?.storedPath) obsolete.push(award[kind].storedPath);
          award[kind] = toStoredAwardFile(file);
        } else if (parseBoolean(req.body[`remove_${kind}`])) {
          if (award[kind]?.storedPath) obsolete.push(award[kind].storedPath);
          award[kind] = null;
        }
      }

      if ("isPublished" in req.body) {
        const next = parseBoolean(req.body.isPublished);
        if (next !== award.isPublished) award.publishedAt = next ? new Date() : null;
        award.isPublished = next;
      }

      await award.save();
      // Les anciens fichiers ne sont supprimés qu'une fois l'enregistrement réussi.
      await deleteStoredFiles(obsolete);

      res.status(200).json({ success: true, data: serializeAward(award.toObject()) });
    } catch (error) {
      await discardAwardFiles(req.files);
      console.error("Erreur modification prix:", error);
      const status = error.name === "ValidationError" ? 400 : 500;
      res.status(status).json({ success: false, error: status === 400 ? error.message : "Erreur serveur" });
    }
  },
);

// Supprimer un lauréat et ses fichiers (ADMIN/DEV)
router.delete("/api/admin/awards/:id", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, error: "Prix introuvable" });
    }
    const award = await Award.findByIdAndDelete(req.params.id);
    if (!award) return res.status(404).json({ success: false, error: "Prix introuvable" });

    await deleteStoredFiles([award.document?.storedPath, award.photo?.storedPath]);
    res.status(200).json({ success: true, message: "Prix supprimé" });
  } catch (error) {
    console.error("Erreur suppression prix:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

export default router;
