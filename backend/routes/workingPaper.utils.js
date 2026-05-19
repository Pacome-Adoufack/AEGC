import multer from "multer";
import fs from "fs/promises";
import uploadDocument, { DOCUMENT_MAX_SIZE_BYTES } from "../middlewares/uploadDocument.js";

export const LEGACY_TO_NEW_SUBMISSION_STATUS = {
  reçue: "soumise",
  en_attente: "en_revision",
  traitée: "revision_requise",
  terminée: "acceptee",
};

export const SUBMISSION_STATUSES = [
  "soumise",
  "en_revision",
  "revision_requise",
  "rejetee",
  "acceptee",
];

export const TERMINAL_STATUSES = ["rejetee", "acceptee"];

export const STATUS_FILTER_MAP = {
  soumise: ["soumise", "reçue"],
  en_revision: ["en_revision", "en_attente"],
  revision_requise: ["revision_requise", "traitée"],
  rejetee: ["rejetee"],
  acceptee: ["acceptee", "terminée"],
};

const JEL_CODE_REGEX = /^[A-Z][0-9]{2}$/;

export const parseJelCodesInput = (value) => {
  if (!value) return [];

  const arrayValue = Array.isArray(value)
    ? value
    : String(value).split(",").map((item) => item.trim());

  const normalized = arrayValue
    .map((item) => String(item || "").trim().toUpperCase())
    .filter(Boolean);

  const uniqueCodes = [...new Set(normalized)];
  const invalidCode = uniqueCodes.find((code) => !JEL_CODE_REGEX.test(code));

  if (invalidCode) {
    const error = new Error(`Code JEL invalide: ${invalidCode}`);
    error.status = 400;
    throw error;
  }

  return uniqueCodes;
};

export const normalizeSubmissionStatus = (status) =>
  LEGACY_TO_NEW_SUBMISSION_STATUS[status] || status;

export const isActiveDispatcherAssignment = (submission) =>
  submission?.assignedDispatcher && !submission?.dispatcherSessionClosedAt;

export const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value._id) return value._id.toString();
  if (typeof value.toHexString === "function") return value.toHexString();
  if (typeof value.toString === "function") {
    const id = value.toString();
    if (id && id !== "[object Object]") return id;
  }
  return null;
};

export const canAccessSubmissionAsDispatcher = (submission, user) => {
  if (!submission || !user || user.role !== "dispatcher") return false;
  const assignedDispatcherId = toIdString(submission.assignedDispatcher);
  const userId = toIdString(user._id || user.id);
  return isActiveDispatcherAssignment(submission) && assignedDispatcherId === userId;
};

export const canReadSubmission = (submission, user) => {
  if (!submission || !user) return false;
  if (user.role === "admin") return true;
  if (canAccessSubmissionAsDispatcher(submission, user)) return true;
  const submittedById = toIdString(submission.submittedBy);
  const userId = toIdString(user._id || user.id);
  return submittedById === userId;
};

export const normalizeSubmission = (submission) => {
  const submissionObject = submission.toObject ? submission.toObject() : submission;

  const hasVersions =
    Array.isArray(submissionObject.versions) && submissionObject.versions.length > 0;

  const fallbackVersion =
    !hasVersions && submissionObject.pdfFile?.filename && submissionObject.pdfFile?.path
      ? [
          {
            versionNumber: submissionObject.currentVersion || 1,
            pdfFile: submissionObject.pdfFile,
            submittedAt: submissionObject.createdAt,
            submittedBy: submissionObject.submittedBy,
          },
        ]
      : [];

  const normalizedVersions = hasVersions ? submissionObject.versions : fallbackVersion;

  const normalizedCurrentVersion =
    submissionObject.currentVersion ||
    (normalizedVersions.length > 0
      ? Math.max(...normalizedVersions.map((v) => v.versionNumber || 1))
      : 1);

  return {
    ...submissionObject,
    status: normalizeSubmissionStatus(submissionObject.status),
    versions: normalizedVersions,
    currentVersion: normalizedCurrentVersion,
    reviewRequests: Array.isArray(submissionObject.reviewRequests)
      ? submissionObject.reviewRequests
      : [],
  };
};

export const uploadSubmissionPDF = (req, res, next) => {
  uploadDocument.single("pdf")(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        const maxSizeMb = Math.floor(DOCUMENT_MAX_SIZE_BYTES / (1024 * 1024));
        return res.status(400).json({ error: `Le fichier ne doit pas dépasser ${maxSizeMb} MB` });
      }
      return res.status(400).json({ error: `Erreur lors de l'upload du document: ${error.message}` });
    }

    return res.status(400).json({ error: error.message || "Fichier document invalide" });
  });
};

export const removeSubmissionFiles = async (submission) => {
  const filePaths = new Set();

  if (submission?.pdfFile?.path) filePaths.add(submission.pdfFile.path);

  if (Array.isArray(submission?.versions)) {
    submission.versions.forEach((version) => {
      if (version?.pdfFile?.path) filePaths.add(version.pdfFile.path);
    });
  }

  await Promise.all(
    [...filePaths].map(async (filePath) => {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }),
  );
};
