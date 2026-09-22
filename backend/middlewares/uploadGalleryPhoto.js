import multer from "multer";
import path from "path";
import {
  ensureUploadDir,
  generateStoredFilename,
  toStoredPath,
  deleteStoredFiles,
} from "../utils/uploadStorage.js";

// Les photos arrivent déjà redimensionnées par le navigateur (≈ 0,2 à 1 Mo) :
// ces plafonds ne servent qu'à bloquer un envoi anormal.
const FULL_MAX_BYTES = 8 * 1024 * 1024;
const THUMB_MAX_BYTES = 2 * 1024 * 1024;

const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ensureUploadDir("gallery")),
  filename: (req, file, cb) => cb(null, generateStoredFilename(file.originalname)),
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if ((ACCEPTED_TYPES[file.mimetype] || []).includes(ext)) return cb(null, true);
  cb(new Error("Seules les images JPG, PNG ou WEBP sont acceptées"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: FULL_MAX_BYTES, files: 2 },
});

export const uploadGalleryPhoto = (req, res, next) => {
  upload.fields([{ name: "full", maxCount: 1 }, { name: "thumb", maxCount: 1 }])(req, res, async (error) => {
    if (!error) {
      // Plafond propre à la miniature, que multer ne sait pas appliquer par champ.
      const thumb = req.files?.thumb?.[0];
      if (thumb && thumb.size > THUMB_MAX_BYTES) {
        await discardGalleryFiles(req.files);
        return res.status(400).json({ success: false, error: "Miniature trop volumineuse" });
      }
      return next();
    }

    if (error instanceof multer.MulterError) {
      const message = error.code === "LIMIT_FILE_SIZE"
        ? "Photo trop volumineuse, même après réduction"
        : `Erreur d'upload : ${error.message}`;
      return res.status(400).json({ success: false, error: message });
    }
    return res.status(400).json({ success: false, error: error.message || "Image invalide" });
  });
};

export const toStoredPhotoFile = (file, width, height) => ({
  storedPath: toStoredPath(file.path),
  mimetype: file.mimetype,
  size: file.size,
  width,
  height,
});

// Supprime les fichiers que multer vient d'écrire, quand la requête échoue ensuite.
export const discardGalleryFiles = (files = {}) =>
  deleteStoredFiles(Object.values(files).flat().map((file) => toStoredPath(file.path)));
