import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { config } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PDF_MAX_SIZE_BYTES = config.pdfMaxSizeMb * 1024 * 1024;

// Configuration du stockage sur disque
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const year = new Date().getFullYear();
    const uploadPath = path.join(__dirname, `../uploads/papers/${year}`);

    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Nom unique : timestamp + nom original
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// Filtrer pour accepter uniquement les PDF
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Seuls les fichiers PDF sont acceptés"), false);
  }
};

// Configuration de multer
const uploadPDF = multer({
  storage: storage,
  limits: {
    fileSize: PDF_MAX_SIZE_BYTES,
  },
  fileFilter: fileFilter,
});

export default uploadPDF;
