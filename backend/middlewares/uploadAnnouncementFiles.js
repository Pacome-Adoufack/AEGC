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

export const ANNOUNCEMENT_MAX_FILES = 5;
export const ANNOUNCEMENT_FILE_MAX_SIZE_BYTES = config.pdfMaxSizeMb * 1024 * 1024;

// Liste blanche stricte : pas de SVG ni de HTML, qui peuvent embarquer du script.
const ACCEPTED_TYPES = {
  "application/pdf": { extensions: [".pdf"], kind: "pdf" },
  "image/jpeg": { extensions: [".jpg", ".jpeg"], kind: "image" },
  "image/png": { extensions: [".png"], kind: "image" },
  "image/webp": { extensions: [".webp"], kind: "image" },
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ensureUploadDir("announcements")),
  filename: (req, file, cb) => cb(null, generateStoredFilename(file.originalname)),
});

const fileFilter = (req, file, cb) => {
  const rule = ACCEPTED_TYPES[file.mimetype];
  const ext = path.extname(file.originalname).toLowerCase();
  if (rule && rule.extensions.includes(ext)) return cb(null, true);
  cb(new Error("Seuls les fichiers PDF et les images JPG, PNG ou WEBP sont acceptés"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: ANNOUNCEMENT_FILE_MAX_SIZE_BYTES, files: ANNOUNCEMENT_MAX_FILES },
});

export const uploadAnnouncementFiles = (req, res, next) => {
  upload.array("attachments", ANNOUNCEMENT_MAX_FILES)(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          error: `Chaque fichier doit faire au maximum ${config.pdfMaxSizeMb} MB`,
        });
      }
      if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          error: `Maximum ${ANNOUNCEMENT_MAX_FILES} fichiers par annonce`,
        });
      }
      return res.status(400).json({ success: false, error: `Erreur d'upload : ${error.message}` });
    }

    return res.status(400).json({ success: false, error: error.message || "Fichier invalide" });
  });
};

// Convertit un fichier reçu par multer en pièce jointe à enregistrer.
export const toStoredAttachment = (file) => ({
  originalName: decodeOriginalName(file.originalname),
  storedPath: toStoredPath(file.path),
  mimetype: file.mimetype,
  size: file.size,
  kind: ACCEPTED_TYPES[file.mimetype].kind,
});

// Supprime les fichiers que multer vient d'écrire, quand la requête échoue ensuite.
export const discardUploadedFiles = (files = []) =>
  deleteStoredFiles(files.map((file) => toStoredPath(file.path)));
