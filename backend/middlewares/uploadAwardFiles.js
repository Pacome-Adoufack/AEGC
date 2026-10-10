import multer from "multer";
import path from "path";
import { config } from "../config/env.js";
import {
  ensureUploadDir,
  generateStoredFilename,
  decodeOriginalName,
  toStoredPath,
  deleteStoredFiles,
} from "../utils/uploadStorage.js";

export const AWARD_FILE_MAX_SIZE_BYTES = config.pdfMaxSizeMb * 1024 * 1024;

// Liste blanche stricte : pas de SVG ni de HTML, qui peuvent embarquer du script.
const ACCEPTED_TYPES = {
  "application/pdf": { extensions: [".pdf"], kind: "pdf" },
  "image/jpeg": { extensions: [".jpg", ".jpeg"], kind: "image" },
  "image/png": { extensions: [".png"], kind: "image" },
  "image/webp": { extensions: [".webp"], kind: "image" },
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ensureUploadDir("awards")),
  filename: (req, file, cb) => cb(null, generateStoredFilename(file.originalname)),
});

const fileFilter = (req, file, cb) => {
  const rule = ACCEPTED_TYPES[file.mimetype];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!rule || !rule.extensions.includes(ext)) {
    return cb(new Error("Seuls les fichiers PDF et les images JPG, PNG ou WEBP sont acceptés"));
  }
  // La photo du lauréat est une image, le document est un PDF : on refuse tout
  // de suite l'inversion des deux champs.
  if (file.fieldname === "photo" && rule.kind !== "image") {
    return cb(new Error("La photo doit être une image"));
  }
  if (file.fieldname === "document" && rule.kind !== "pdf") {
    return cb(new Error("Le document doit être un PDF"));
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: AWARD_FILE_MAX_SIZE_BYTES, files: 2 },
});

export const uploadAwardFiles = (req, res, next) => {
  upload.fields([
    { name: "document", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ])(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          error: `Chaque fichier doit faire au maximum ${config.pdfMaxSizeMb} MB`,
        });
      }
      return res.status(400).json({ success: false, error: `Erreur d'upload : ${error.message}` });
    }

    return res.status(400).json({ success: false, error: error.message || "Fichier invalide" });
  });
};

export const toStoredAwardFile = (file) => ({
  originalName: decodeOriginalName(file.originalname),
  storedPath: toStoredPath(file.path),
  mimetype: file.mimetype,
  size: file.size,
});

// Supprime les fichiers que multer vient d'écrire, quand la requête échoue ensuite.
export const discardAwardFiles = (files = {}) =>
  deleteStoredFiles(Object.values(files).flat().map((file) => toStoredPath(file.path)));
