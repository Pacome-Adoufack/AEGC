import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { config } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DOCUMENT_MAX_SIZE_BYTES = config.pdfMaxSizeMb * 1024 * 1024;

// Types MIME acceptés
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];

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

// Filtrer pour accepter PDF et Word
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    ACCEPTED_MIME_TYPES.includes(file.mimetype) &&
    ACCEPTED_EXTENSIONS.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error("Seuls les fichiers PDF et Word (.doc, .docx) sont acceptés"),
      false,
    );
  }
};

// Configuration de multer
const uploadDocument = multer({
  storage: storage,
  limits: {
    fileSize: DOCUMENT_MAX_SIZE_BYTES,
  },
  fileFilter: fileFilter,
});

export default uploadDocument;
