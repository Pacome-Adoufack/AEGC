import express from "express";
import fs from "fs";
import mongoose from "mongoose";
import GalleryPhoto from "../models/GalleryPhoto.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";
import {
  uploadGalleryPhoto,
  toStoredPhotoFile,
  discardGalleryFiles,
} from "../middlewares/uploadGalleryPhoto.js";
import { resolveStoredPath, deleteStoredFiles, decodeOriginalName } from "../utils/uploadStorage.js";

const router = express.Router();

const MAX_LIST_LIMIT = 500;

// "2026-09-15" -> minuit UTC. Stocké et relu en UTC, la date ne glisse pas d'un jour
// selon le fuseau du serveur.
function parseEventDate(value) {
  if (!value || value === "null") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const formatEventDate = (date) => (date ? new Date(date).toISOString().slice(0, 10) : null);

function parseDimension(value) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number > 0 && number <= 20000 ? number : undefined;
}

// Forme renvoyée au client : jamais le chemin disque, toujours des URL de l'API.
function serializePhoto(photo) {
  return {
    _id: photo._id,
    title: photo.title,
    eventDate: formatEventDate(photo.eventDate),
    createdAt: photo.createdAt,
    width: photo.full?.width,
    height: photo.full?.height,
    thumbWidth: photo.thumb?.width,
    thumbHeight: photo.thumb?.height,
    fullUrl: `/api/gallery/${photo._id}/full`,
    thumbUrl: `/api/gallery/${photo._id}/thumb`,
  };
}

// Liste des photos, les dernières ajoutées d'abord (PUBLIC). Tri par date d'ajout et
// non d'événement : une photo sans date ou d'un événement ancien, ajoutée aujourd'hui,
// doit bien apparaître en tête sur l'accueil.
router.get("/api/gallery", async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 12, 1), MAX_LIST_LIMIT);
    const [photos, total] = await Promise.all([
      GalleryPhoto.find().sort({ createdAt: -1 }).limit(limit).lean(),
      GalleryPhoto.countDocuments(),
    ]);
    res.status(200).json({ success: true, total, count: photos.length, data: photos.map(serializePhoto) });
  } catch (error) {
    console.error("Erreur liste galerie:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Fichier image, en grand ("full") ou en miniature ("thumb") (PUBLIC)
router.get("/api/gallery/:id/:size", async (req, res) => {
  try {
    const { id, size } = req.params;
    if (!mongoose.isValidObjectId(id) || !["full", "thumb"].includes(size)) {
      return res.status(404).json({ success: false, error: "Image introuvable" });
    }

    const photo = await GalleryPhoto.findById(id).select("full thumb").lean();
    const file = photo?.[size];
    const filePath = resolveStoredPath(file?.storedPath);

    if (!file || !filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: "Image introuvable" });
    }

    res.setHeader("Content-Type", file.mimetype);
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Le fichier d'une photo ne change jamais : une modification crée une nouvelle photo.
    res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
    res.sendFile(filePath);
  } catch (error) {
    console.error("Erreur image galerie:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Ajouter une photo (ADMIN/DEV). Une requête par photo : le navigateur envoie
// les photos une à une, ce qui évite la limite de taille du proxy et permet
// d'afficher la progression.
router.post(
  "/api/admin/gallery",
  authMiddleware,
  requireRole(["admin", "dev"]),
  uploadGalleryPhoto,
  async (req, res) => {
    const full = req.files?.full?.[0];
    const thumb = req.files?.thumb?.[0];
    try {
      const title = (req.body.title || "").trim();

      if (!full || !thumb) {
        await discardGalleryFiles(req.files);
        return res.status(400).json({ success: false, error: "Les deux versions de la photo sont requises" });
      }
      if (!title) {
        await discardGalleryFiles(req.files);
        return res.status(400).json({ success: false, error: "La légende est requise" });
      }

      const photo = await GalleryPhoto.create({
        title,
        eventDate: parseEventDate(req.body.eventDate),
        originalName: decodeOriginalName(req.body.originalName || ""),
        full: toStoredPhotoFile(full, parseDimension(req.body.width), parseDimension(req.body.height)),
        thumb: toStoredPhotoFile(thumb, parseDimension(req.body.thumbWidth), parseDimension(req.body.thumbHeight)),
        author: req.user.id,
      });

      res.status(201).json({ success: true, data: serializePhoto(photo.toObject()) });
    } catch (error) {
      await discardGalleryFiles(req.files);
      console.error("Erreur ajout photo:", error);
      const status = error.name === "ValidationError" ? 400 : 500;
      res.status(status).json({ success: false, error: status === 400 ? error.message : "Erreur serveur" });
    }
  },
);

// Modifier la légende ou la date (ADMIN/DEV)
router.put("/api/admin/gallery/:id", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, error: "Photo introuvable" });
    }
    const photo = await GalleryPhoto.findById(req.params.id);
    if (!photo) return res.status(404).json({ success: false, error: "Photo introuvable" });

    if (typeof req.body.title === "string") {
      const title = req.body.title.trim();
      if (!title) return res.status(400).json({ success: false, error: "La légende est requise" });
      photo.title = title;
    }
    if ("eventDate" in req.body) photo.eventDate = parseEventDate(req.body.eventDate);

    await photo.save();
    res.status(200).json({ success: true, data: serializePhoto(photo.toObject()) });
  } catch (error) {
    console.error("Erreur modification photo:", error);
    const status = error.name === "ValidationError" ? 400 : 500;
    res.status(status).json({ success: false, error: status === 400 ? error.message : "Erreur serveur" });
  }
});

// Supprimer une photo et ses fichiers (ADMIN/DEV)
router.delete("/api/admin/gallery/:id", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, error: "Photo introuvable" });
    }
    const photo = await GalleryPhoto.findByIdAndDelete(req.params.id);
    if (!photo) return res.status(404).json({ success: false, error: "Photo introuvable" });
    await deleteStoredFiles([photo.full?.storedPath, photo.thumb?.storedPath]);
    res.status(200).json({ success: true, message: "Photo supprimée" });
  } catch (error) {
    console.error("Erreur suppression photo:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

export default router;
