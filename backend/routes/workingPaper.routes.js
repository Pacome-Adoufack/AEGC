import express from "express";
import multer from "multer";
import fs from "fs/promises";
import WorkingPaper from "../models/WorkingPaper.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";
import PublicationIssue from "../models/PublicationIssue.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";
import uploadPDF, { PDF_MAX_SIZE_BYTES } from "../middlewares/uploadPDF.js";

const router = express.Router();

const LEGACY_TO_NEW_SUBMISSION_STATUS = {
  reçue: "soumise",
  en_attente: "en_revision",
  traitée: "revision_requise",
  terminée: "acceptee",
};

const SUBMISSION_STATUSES = [
  "soumise",
  "en_revision",
  "revision_requise",
  "rejetee",
  "acceptee",
];

const TERMINAL_STATUSES = ["rejetee", "acceptee"];

const STATUS_FILTER_MAP = {
  soumise: ["soumise", "reçue"],
  en_revision: ["en_revision", "en_attente"],
  revision_requise: ["revision_requise", "traitée"],
  rejetee: ["rejetee"],
  acceptee: ["acceptee", "terminée"],
};

const JEL_CODE_REGEX = /^[A-Z][0-9]{2}$/;

const parseJelCodesInput = (value) => {
  if (!value) {
    return [];
  }

  const arrayValue = Array.isArray(value)
    ? value
    : String(value)
        .split(",")
        .map((item) => item.trim());

  const normalized = arrayValue
    .map((item) =>
      String(item || "")
        .trim()
        .toUpperCase(),
    )
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

const normalizeSubmissionStatus = (status) =>
  LEGACY_TO_NEW_SUBMISSION_STATUS[status] || status;

const isActiveDispatcherAssignment = (submission) =>
  submission?.assignedDispatcher && !submission?.dispatcherSessionClosedAt;

const toIdString = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (value._id) {
    return value._id.toString();
  }

  if (typeof value.toHexString === "function") {
    return value.toHexString();
  }

  if (typeof value.toString === "function") {
    const id = value.toString();
    if (id && id !== "[object Object]") {
      return id;
    }
  }

  return null;
};

const canAccessSubmissionAsDispatcher = (submission, user) => {
  if (!submission || !user || user.role !== "dispatcher") {
    return false;
  }

  const assignedDispatcherId = toIdString(submission.assignedDispatcher);
  const userId = toIdString(user._id || user.id);

  return (
    isActiveDispatcherAssignment(submission) && assignedDispatcherId === userId
  );
};

const canReadSubmission = (submission, user) => {
  if (!submission || !user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  if (canAccessSubmissionAsDispatcher(submission, user)) {
    return true;
  }

  const submittedById = toIdString(submission.submittedBy);
  const userId = toIdString(user._id || user.id);

  return submittedById === userId;
};

const normalizeSubmission = (submission) => {
  const submissionObject = submission.toObject
    ? submission.toObject()
    : submission;

  const hasVersions =
    Array.isArray(submissionObject.versions) &&
    submissionObject.versions.length > 0;

  const fallbackVersion =
    !hasVersions &&
    submissionObject.pdfFile?.filename &&
    submissionObject.pdfFile?.path
      ? [
          {
            versionNumber: submissionObject.currentVersion || 1,
            pdfFile: submissionObject.pdfFile,
            submittedAt: submissionObject.createdAt,
            submittedBy: submissionObject.submittedBy,
          },
        ]
      : [];

  const normalizedVersions = hasVersions
    ? submissionObject.versions
    : fallbackVersion;

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

const uploadSubmissionPDF = (req, res, next) => {
  uploadPDF.single("pdf")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        const maxSizeMb = Math.floor(PDF_MAX_SIZE_BYTES / (1024 * 1024));
        return res.status(400).json({
          error: `Le fichier PDF ne doit pas dépasser ${maxSizeMb} MB`,
        });
      }

      return res.status(400).json({
        error: `Erreur lors de l'upload du PDF: ${error.message}`,
      });
    }

    return res.status(400).json({
      error: error.message || "Fichier PDF invalide",
    });
  });
};

const removeSubmissionFiles = async (submission) => {
  const filePaths = new Set();

  if (submission?.pdfFile?.path) {
    filePaths.add(submission.pdfFile.path);
  }

  if (Array.isArray(submission?.versions)) {
    submission.versions.forEach((version) => {
      if (version?.pdfFile?.path) {
        filePaths.add(version.pdfFile.path);
      }
    });
  }

  await Promise.all(
    [...filePaths].map(async (filePath) => {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }
    }),
  );
};

// ============================================
// ROUTES PUBLIQUES
// ============================================

// Obtenir tous les WP ouverts (PUBLIC)
router.get("/working-papers", async (req, res) => {
  try {
    const workingPapers = await WorkingPaper.find()
      .populate("createdBy", "name firstName")
      .sort({ createdAt: -1 });

    // Compter les soumissions pour chaque WP
    const wpWithCounts = await Promise.all(
      workingPapers.map(async (wp) => {
        const count = await Submission.countDocuments({ workingPaper: wp._id });
        return {
          ...wp.toObject(),
          submissionsCount: count,
        };
      }),
    );

    res.json(wpWithCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir un WP spécifique (PUBLIC)
router.get("/working-papers/:id", async (req, res) => {
  try {
    const wp = await WorkingPaper.findById(req.params.id).populate(
      "createdBy",
      "name firstName",
    );

    if (!wp) {
      return res.status(404).json({ error: "Working Paper non trouvé" });
    }

    // Compter les soumissions
    const count = await Submission.countDocuments({ workingPaper: wp._id });

    res.json({
      ...wp.toObject(),
      submissionsCount: count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Historique public: publications de synthèse éditoriales
router.get("/working-papers/history/public", async (req, res) => {
  try {
    const publications = await PublicationIssue.find({ status: "published" })
      .select("title summary status publishedAt createdAt pdfFile stats")
      .sort({ publishedAt: -1, createdAt: -1 });

    const payload = publications.map((publication) => {
      const obj = publication.toObject();
      return {
        ...obj,
        downloadUrl: `/api/publications/${publication._id}/download`,
      };
    });

    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Télécharger une publication de synthèse (PUBLIC)
router.get("/publications/:id/download", async (req, res) => {
  try {
    const publication = await PublicationIssue.findById(req.params.id);

    if (!publication) {
      return res.status(404).json({ error: "Publication non trouvée" });
    }

    if (publication.status !== "published") {
      return res.status(403).json({ error: "Publication non accessible" });
    }

    res.download(publication.pdfFile.path, publication.pdfFile.filename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROUTES UTILISATEUR (requiert authentification)
// ============================================

// Soumettre un travail
router.post(
  "/submissions",
  authMiddleware,
  uploadSubmissionPDF,
  async (req, res) => {
    try {
      const {
        workingPaperId,
        articleTitle,
        keywords,
        authors,
        abstract,
        publication,
      } = req.body;

      // Vérifier que le WP existe
      const wp = await WorkingPaper.findById(workingPaperId);
      if (!wp) {
        return res.status(404).json({ error: "Working Paper non trouvé" });
      }

      // Vérifier la deadline
      if (new Date() > new Date(wp.deadline)) {
        return res.status(400).json({ error: "La deadline est passée" });
      }

      // Vérifier si l'utilisateur a déjà soumis
      const existing = await Submission.findOne({
        workingPaper: workingPaperId,
        submittedBy: req.user._id,
      });

      if (existing) {
        return res.status(400).json({
          error: "Vous avez déjà soumis un travail pour cet appel",
        });
      }

      // Vérifier que le fichier a été uploadé
      if (!req.file) {
        return res.status(400).json({ error: "Fichier PDF requis" });
      }

      // Parser les auteurs (si c'est une string JSON)
      let parsedAuthors = authors;
      if (typeof authors === "string") {
        parsedAuthors = JSON.parse(authors);
      }

      // Parser keywords
      let parsedKeywords = keywords;
      if (typeof keywords === "string") {
        parsedKeywords = keywords.split(",").map((k) => k.trim());
      }

      // Parser publication si présent
      let parsedPublication = publication;
      if (typeof publication === "string" && publication) {
        parsedPublication = JSON.parse(publication);
      }

      // Créer la soumission
      const initialPdfFile = {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
      };

      const submission = new Submission({
        workingPaper: workingPaperId,
        submittedBy: req.user._id,
        articleTitle,
        keywords: parsedKeywords,
        // Les codes JEL sont définis au niveau de l'appel (WP) et non par le soumetteur.
        jelCodes: parseJelCodesInput(wp.jelCodes || []),
        authors: parsedAuthors,
        abstract,
        publication: parsedPublication,
        pdfFile: initialPdfFile,
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            pdfFile: initialPdfFile,
            submittedAt: new Date(),
            submittedBy: req.user._id,
          },
        ],
      });

      await submission.save();

      res.status(201).json({
        message: "Soumission enregistrée avec succès",
        submission,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
);

// Obtenir mes soumissions
router.get("/my-submissions", authMiddleware, async (req, res) => {
  try {
    const submissions = await Submission.find({ submittedBy: req.user._id })
      .populate("workingPaper", "title deadline")
      .sort({ createdAt: -1 });

    const normalizedSubmissions = submissions.map(normalizeSubmission);

    // Marquer les commentaires comme lus
    const unreadComments = submissions.reduce((acc, sub) => {
      const unread = sub.adminComments.filter((c) => !c.read).length;
      return acc + unread;
    }, 0);

    res.json({
      submissions: normalizedSubmissions,
      unreadComments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir une soumission spécifique (si c'est la mienne)
router.get("/submissions/:id", authMiddleware, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("workingPaper", "title deadline")
      .populate("assignedDispatcher", "name firstName email")
      .populate("adminComments.commentedBy", "name firstName")
      .populate("reviewRequests.createdBy", "name firstName")
      .populate("versions.submittedBy", "name firstName email");

    if (!submission) {
      return res.status(404).json({ error: "Soumission non trouvée" });
    }

    if (!canReadSubmission(submission, req.user)) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    res.json(normalizeSubmission(submission));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les demandes de révision d'une soumission
router.get(
  "/submissions/:id/review-requests",
  authMiddleware,
  async (req, res) => {
    try {
      const submission = await Submission.findById(req.params.id).populate(
        "reviewRequests.createdBy",
        "name firstName",
      );

      if (!submission) {
        return res.status(404).json({ error: "Soumission non trouvée" });
      }

      if (!canReadSubmission(submission, req.user)) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      const reviewRequests = [...(submission.reviewRequests || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      res.json({
        reviewRequests,
        status: normalizeSubmissionStatus(submission.status),
        currentVersion: submission.currentVersion || 1,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Obtenir l'historique des versions d'une soumission
router.get("/submissions/:id/versions", authMiddleware, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate(
      "versions.submittedBy",
      "name firstName email",
    );

    if (!submission) {
      return res.status(404).json({ error: "Soumission non trouvée" });
    }

    if (!canReadSubmission(submission, req.user)) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    const normalized = normalizeSubmission(submission);
    const versions = [...normalized.versions].sort(
      (a, b) => (b.versionNumber || 1) - (a.versionNumber || 1),
    );

    res.json({
      currentVersion: normalized.currentVersion,
      versions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resoumettre un PDF après demande de correction
router.post(
  "/submissions/:id/resubmit",
  authMiddleware,
  uploadSubmissionPDF,
  async (req, res) => {
    try {
      const { responseNote } = req.body;

      const submission = await Submission.findById(req.params.id);

      if (!submission) {
        return res.status(404).json({ error: "Soumission non trouvée" });
      }

      if (submission.submittedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      if (normalizeSubmissionStatus(submission.status) !== "revision_requise") {
        return res.status(400).json({
          error:
            "La resoumission n'est possible que pour une soumission en statut 'À modifier'",
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Fichier PDF requis" });
      }

      const previousPdfFile = submission.pdfFile;

      if (!Array.isArray(submission.versions)) {
        submission.versions = [];
      }

      if (
        submission.versions.length === 0 &&
        previousPdfFile?.filename &&
        previousPdfFile?.path
      ) {
        submission.versions.push({
          versionNumber: 1,
          pdfFile: {
            filename: previousPdfFile.filename,
            path: previousPdfFile.path,
            size: previousPdfFile.size,
            uploadDate:
              previousPdfFile.uploadDate || submission.createdAt || new Date(),
          },
          submittedAt: submission.createdAt || new Date(),
          submittedBy: submission.submittedBy,
        });
      }

      const nextVersion =
        (submission.currentVersion || submission.versions.length || 1) + 1;

      const newPdfFile = {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        uploadDate: new Date(),
      };

      submission.pdfFile = newPdfFile;
      submission.currentVersion = nextVersion;
      submission.status = "en_revision";
      submission.isPublicInHistory = false;

      submission.versions.push({
        versionNumber: nextVersion,
        pdfFile: newPdfFile,
        responseNote:
          typeof responseNote === "string" ? responseNote.trim() : undefined,
        submittedAt: new Date(),
        submittedBy: req.user._id,
      });

      submission.reviewRequests.forEach((request) => {
        if (request.status === "open") {
          request.status = "addressed";
          request.addressedAt = new Date();
          request.addressedByVersion = nextVersion;
        }
      });

      await submission.save();

      const savedSubmission = await Submission.findById(submission._id)
        .populate("workingPaper", "title deadline")
        .populate("adminComments.commentedBy", "name firstName")
        .populate("reviewRequests.createdBy", "name firstName")
        .populate("versions.submittedBy", "name firstName email");

      res.json({
        message: "Nouvelle version soumise avec succès",
        submission: normalizeSubmission(savedSubmission),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Marquer les commentaires comme lus
router.patch(
  "/submissions/:id/read-comments",
  authMiddleware,
  async (req, res) => {
    try {
      const submission = await Submission.findById(req.params.id);

      if (!submission) {
        return res.status(404).json({ error: "Soumission non trouvée" });
      }

      if (submission.submittedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      // Marquer tous les commentaires comme lus
      submission.adminComments.forEach((comment) => {
        comment.read = true;
      });

      await submission.save();
      res.json({ message: "Commentaires marqués comme lus" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Supprimer sa propre soumission tant qu'elle n'a pas encore été traitée
router.delete("/submissions/:id", authMiddleware, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: "Soumission non trouvée" });
    }

    const isOwner = submission.submittedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    if (!isAdmin && normalizeSubmissionStatus(submission.status) !== "soumise") {
      return res.status(400).json({
        error: "Vous ne pouvez supprimer la soumission que tant qu'elle est encore en attente",
      });
    }

    await removeSubmissionFiles(submission);
    await Submission.deleteOne({ _id: submission._id });

    res.json({ message: "Soumission supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROUTES ADMIN
// ============================================

// Créer un Working Paper (ADMIN)
router.post(
  "/admin/working-papers",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const {
        title,
        subtitle,
        organizer,
        description,
        deadline,
        manuscriptLength,
        language,
        submissionRequirements,
        status,
        jelCodes,
        contactEmail,
        contactPhone,
        contactWebsite,
        contactLinkedin,
        usefulLinks,
      } = req.body;

      console.log("📝 Création Working Paper:", {
        title,
        organizer,
        deadline,
      });
      console.log("👤 User:", req.user);

      const wp = new WorkingPaper({
        title,
        subtitle: subtitle || "",
        organizer,
        description,
        deadline,
        manuscriptLength: manuscriptLength || "",
        language: language || "francais",
        submissionRequirements: submissionRequirements || "",
        status: status || "ouvert",
        jelCodes: parseJelCodesInput(jelCodes),
        contact: {
          email: contactEmail || "",
          phone: contactPhone || "",
          website: contactWebsite || "",
          linkedin: contactLinkedin || "",
        },
        usefulLinks: Array.isArray(usefulLinks)
          ? usefulLinks.filter(Boolean)
          : typeof usefulLinks === "string"
            ? usefulLinks
                .split("\n")
                .map((link) => link.trim())
                .filter(Boolean)
            : [],
        createdBy: req.user._id,
      });

      await wp.save();
      console.log("✅ Working Paper créé:", wp);
      res.status(201).json({ message: "Working Paper créé", wp });
    } catch (error) {
      console.error("❌ Erreur création WP:", error);
      const status = error.status || 500;
      res.status(status).json({ error: error.message });
    }
  },
);

// Modifier un Working Paper (ADMIN)
router.put(
  "/admin/working-papers/:id",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const {
        title,
        subtitle,
        organizer,
        description,
        deadline,
        status,
        manuscriptLength,
        language,
        submissionRequirements,
        jelCodes,
        contactEmail,
        contactPhone,
        contactWebsite,
        contactLinkedin,
        usefulLinks,
      } = req.body;

      const wp = await WorkingPaper.findById(req.params.id);

      if (!wp) {
        return res.status(404).json({ error: "Working Paper non trouvé" });
      }

      // Seul le créateur de l'appel peut le modifier.
      if (wp.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          error: "Accès non autorisé",
          message: "Seul le créateur de l'appel peut le modifier",
        });
      }

      wp.title = title;
      wp.subtitle = subtitle || "";
      wp.organizer = organizer;
      wp.description = description;
      wp.deadline = deadline;
      wp.status = status;
      wp.manuscriptLength = manuscriptLength || "";
      wp.language = language || "francais";
      wp.submissionRequirements = submissionRequirements || "";
      wp.jelCodes = parseJelCodesInput(jelCodes);
      wp.contact = {
        email: contactEmail || "",
        phone: contactPhone || "",
        website: contactWebsite || "",
        linkedin: contactLinkedin || "",
      };
      wp.usefulLinks = Array.isArray(usefulLinks)
        ? usefulLinks.filter(Boolean)
        : typeof usefulLinks === "string"
          ? usefulLinks
              .split("\n")
              .map((link) => link.trim())
              .filter(Boolean)
          : [];

      await wp.save();

      res.json({ message: "Working Paper mis à jour", wp });
    } catch (error) {
      const status = error.status || 500;
      res.status(status).json({ error: error.message });
    }
  },
);

// Supprimer un Working Paper (ADMIN)
router.delete(
  "/admin/working-papers/:id",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const wp = await WorkingPaper.findByIdAndDelete(req.params.id);

      if (!wp) {
        return res.status(404).json({ error: "Working Paper non trouvé" });
      }

      // Supprimer aussi toutes les soumissions liées
      await Submission.deleteMany({ workingPaper: req.params.id });

      res.json({ message: "Working Paper supprimé" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Obtenir toutes les soumissions (ADMIN)
router.get(
  "/admin/submissions",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { status, workingPaper } = req.query;

      const filter = {};
      if (status) {
        const normalizedStatus = normalizeSubmissionStatus(status);

        if (!SUBMISSION_STATUSES.includes(normalizedStatus)) {
          return res.status(400).json({
            error: "Statut invalide",
            allowedStatuses: SUBMISSION_STATUSES,
          });
        }

        const statusesForFilter = STATUS_FILTER_MAP[normalizedStatus] || [
          normalizedStatus,
        ];

        filter.status =
          statusesForFilter.length > 1
            ? { $in: statusesForFilter }
            : statusesForFilter[0];
      }
      if (workingPaper) filter.workingPaper = workingPaper;

      const submissions = await Submission.find(filter)
        .populate("workingPaper", "title")
        .populate("submittedBy", "name firstName email")
        .populate("assignedDispatcher", "name firstName email")
        .sort({ createdAt: -1 });

      res.json(submissions.map(normalizeSubmission));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Lister les publications de synthèse (ADMIN)
router.get(
  "/admin/publications",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const publications = await PublicationIssue.find()
        .populate("createdBy", "name firstName email")
        .sort({ createdAt: -1 });

      res.json(publications);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Créer une publication de synthèse (ADMIN)
router.post(
  "/admin/publications",
  authMiddleware,
  requireRole(["admin"]),
  uploadSubmissionPDF,
  async (req, res) => {
    try {
      const { title, summary, status, acceptedCount, rejectedCount } = req.body;

      if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "Titre requis" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Fichier PDF requis" });
      }

      const normalizedStatus = status === "published" ? "published" : "draft";
      const parsedAccepted =
        acceptedCount === "" || acceptedCount === undefined
          ? undefined
          : Number.parseInt(acceptedCount, 10);
      const parsedRejected =
        rejectedCount === "" || rejectedCount === undefined
          ? undefined
          : Number.parseInt(rejectedCount, 10);

      if (parsedAccepted !== undefined && Number.isNaN(parsedAccepted)) {
        return res.status(400).json({ error: "acceptedCount invalide" });
      }

      if (parsedRejected !== undefined && Number.isNaN(parsedRejected)) {
        return res.status(400).json({ error: "rejectedCount invalide" });
      }

      if (parsedAccepted !== undefined && parsedAccepted < 0) {
        return res.status(400).json({ error: "acceptedCount doit être >= 0" });
      }

      if (parsedRejected !== undefined && parsedRejected < 0) {
        return res.status(400).json({ error: "rejectedCount doit être >= 0" });
      }

      const publication = await PublicationIssue.create({
        title: title.trim(),
        summary: typeof summary === "string" ? summary.trim() : "",
        stats: {
          acceptedCount: parsedAccepted,
          rejectedCount: parsedRejected,
        },
        pdfFile: {
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size,
          uploadDate: new Date(),
        },
        status: normalizedStatus,
        publishedAt: normalizedStatus === "published" ? new Date() : null,
        createdBy: req.user._id,
      });

      const saved = await PublicationIssue.findById(publication._id).populate(
        "createdBy",
        "name firstName email",
      );

      res.status(201).json({
        message:
          normalizedStatus === "published"
            ? "Publication publiée"
            : "Publication enregistrée en brouillon",
        publication: saved,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Changer le statut d'une publication de synthèse (ADMIN)
router.patch(
  "/admin/publications/:id/status",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["draft", "published"].includes(status)) {
        return res.status(400).json({ error: "Statut invalide" });
      }

      const update = {
        status,
        publishedAt: status === "published" ? new Date() : null,
      };

      const publication = await PublicationIssue.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true },
      ).populate("createdBy", "name firstName email");

      if (!publication) {
        return res.status(404).json({ error: "Publication non trouvée" });
      }

      res.json({ message: "Statut de publication mis à jour", publication });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Supprimer une publication de synthèse (ADMIN)
router.delete(
  "/admin/publications/:id",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const publication = await PublicationIssue.findByIdAndDelete(
        req.params.id,
      );

      if (!publication) {
        return res.status(404).json({ error: "Publication non trouvée" });
      }

      res.json({ message: "Publication supprimée" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Lister les gestionnaires (ADMIN)
router.get(
  "/admin/dispatchers",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const dispatchers = await User.find({ role: "dispatcher" })
        .select("name firstName email")
        .sort({ firstName: 1, name: 1 });

      const dispatchersWithStats = await Promise.all(
        dispatchers.map(async (dispatcher) => {
          const activeAssignedCount = await Submission.countDocuments({
            assignedDispatcher: dispatcher._id,
            dispatcherSessionClosedAt: null,
          });

          const completedCount = await Submission.countDocuments({
            assignedDispatcher: dispatcher._id,
            dispatcherSessionClosedAt: null,
            status: { $in: TERMINAL_STATUSES },
          });

          return {
            id: dispatcher._id,
            name: dispatcher.name,
            firstName: dispatcher.firstName,
            email: dispatcher.email,
            activeAssignedCount,
            completedCount,
            pendingCount: Math.max(activeAssignedCount - completedCount, 0),
            canCloseSession:
              activeAssignedCount > 0 && activeAssignedCount === completedCount,
          };
        }),
      );

      res.json(dispatchersWithStats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Assigner un gestionnaire a une soumission (ADMIN)
router.patch(
  "/admin/submissions/:id/assign-dispatcher",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { dispatcherId } = req.body;

      if (!dispatcherId) {
        return res.status(400).json({ error: "dispatcherId requis" });
      }

      const dispatcher = await User.findOne({
        _id: dispatcherId,
        role: "dispatcher",
      }).select("_id name firstName email");

      if (!dispatcher) {
        return res
          .status(404)
          .json({ error: "Gestionnaire introuvable ou role invalide" });
      }

      const submission = await Submission.findById(req.params.id);
      if (!submission) {
        return res.status(404).json({ error: "Soumission non trouvée" });
      }

      submission.assignedDispatcher = dispatcher._id;
      submission.dispatcherAssignedBy = req.user._id;
      submission.dispatcherAssignedAt = new Date();
      submission.dispatcherSessionClosedAt = null;
      submission.dispatcherSessionClosedBy = null;

      await submission.save();

      const updated = await Submission.findById(submission._id)
        .populate("workingPaper", "title")
        .populate("submittedBy", "name firstName email")
        .populate("assignedDispatcher", "name firstName email");

      res.json({
        message: "Gestionnaire assigne avec succes",
        submission: normalizeSubmission(updated),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Lister les soumissions assignees au gestionnaire connecte
router.get(
  "/dispatcher/submissions",
  authMiddleware,
  requireRole(["dispatcher"]),
  async (req, res) => {
    try {
      const submissions = await Submission.find({
        assignedDispatcher: req.user._id,
        dispatcherSessionClosedAt: null,
      })
        .populate("workingPaper", "title")
        .populate("submittedBy", "name firstName email")
        .populate("assignedDispatcher", "name firstName email")
        .sort({ createdAt: -1 });

      res.json(submissions.map(normalizeSubmission));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Cloturer la session d'un gestionnaire (ADMIN) si toutes ses soumissions actives sont finales
router.post(
  "/admin/dispatchers/:id/close-session",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const dispatcher = await User.findOne({
        _id: req.params.id,
        role: "dispatcher",
      }).select("_id name firstName email");

      if (!dispatcher) {
        return res.status(404).json({ error: "Gestionnaire introuvable" });
      }

      const activeSubmissions = await Submission.find({
        assignedDispatcher: dispatcher._id,
        dispatcherSessionClosedAt: null,
      }).select("_id status");

      if (activeSubmissions.length === 0) {
        return res.status(400).json({
          error: "Aucune soumission active pour ce gestionnaire",
        });
      }

      const remaining = activeSubmissions.filter(
        (submission) =>
          !TERMINAL_STATUSES.includes(
            normalizeSubmissionStatus(submission.status),
          ),
      );

      if (remaining.length > 0) {
        return res.status(400).json({
          error:
            "Impossible de cloturer: certaines soumissions assignees ne sont pas encore acceptees/rejetees",
          remainingCount: remaining.length,
        });
      }

      const now = new Date();
      const updateResult = await Submission.updateMany(
        {
          assignedDispatcher: dispatcher._id,
          dispatcherSessionClosedAt: null,
        },
        {
          $set: {
            dispatcherSessionClosedAt: now,
            dispatcherSessionClosedBy: req.user._id,
          },
        },
      );

      res.json({
        message: "Session du gestionnaire cloturee",
        closedCount: updateResult.modifiedCount,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Changer le statut d'une soumission (GESTIONNAIRE)
router.patch(
  "/admin/submissions/:id/status",
  authMiddleware,
  requireRole(["dispatcher"]),
  async (req, res) => {
    try {
      const { status } = req.body;
      const normalizedStatus = normalizeSubmissionStatus(status);

      if (!SUBMISSION_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({
          error: "Statut invalide",
          allowedStatuses: SUBMISSION_STATUSES,
        });
      }

      const submission = await Submission.findById(req.params.id);

      if (!submission) {
        return res.status(404).json({ error: "Soumission non trouvée" });
      }

      if (!canAccessSubmissionAsDispatcher(submission, req.user)) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      submission.status = normalizedStatus;
      await submission.save();

      res.json({ message: "Statut mis à jour", submission });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Ajouter un commentaire editorial (GESTIONNAIRE)
router.post(
  "/admin/submissions/:id/comments",
  authMiddleware,
  requireRole(["dispatcher"]),
  async (req, res) => {
    try {
      const { comment } = req.body;

      const submission = await Submission.findById(req.params.id);

      if (!submission) {
        return res.status(404).json({ error: "Soumission non trouvée" });
      }

      if (!canAccessSubmissionAsDispatcher(submission, req.user)) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      submission.adminComments.push({
        comment,
        commentedBy: req.user._id,
      });

      await submission.save();

      res.json({ message: "Commentaire ajouté", submission });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Demander des modifications avec appréciation structurée (GESTIONNAIRE)
router.post(
  "/admin/submissions/:id/revision-request",
  authMiddleware,
  requireRole(["dispatcher"]),
  async (req, res) => {
    try {
      const { summary, items } = req.body;

      const cleanSummary = typeof summary === "string" ? summary.trim() : "";
      const cleanItems = Array.isArray(items)
        ? items
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter(Boolean)
        : [];

      if (!cleanSummary && cleanItems.length === 0) {
        return res.status(400).json({
          error:
            "Veuillez renseigner une appréciation (résumé ou au moins un point à corriger)",
        });
      }

      const submission = await Submission.findById(req.params.id);

      if (!submission) {
        return res.status(404).json({ error: "Soumission non trouvée" });
      }

      if (!canAccessSubmissionAsDispatcher(submission, req.user)) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      const finalSummary = cleanSummary || "Modifications demandées";

      submission.reviewRequests.push({
        summary: finalSummary,
        items: cleanItems,
        createdBy: req.user._id,
        status: "open",
      });

      submission.adminComments.push({
        comment: `Demande de modification: ${finalSummary}`,
        commentedBy: req.user._id,
      });

      submission.status = "revision_requise";
      submission.isPublicInHistory = false;

      await submission.save();

      const savedSubmission = await Submission.findById(submission._id)
        .populate("workingPaper", "title")
        .populate("submittedBy", "name firstName email")
        .populate("adminComments.commentedBy", "name firstName")
        .populate("reviewRequests.createdBy", "name firstName")
        .populate("versions.submittedBy", "name firstName email");

      res.json({
        message: "Demande de modification enregistrée",
        submission: normalizeSubmission(savedSubmission),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Toggle visibilité historique public (ADMIN)
router.patch(
  "/admin/submissions/:id/visibility",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { isPublicInHistory } = req.body;

      const submission = await Submission.findByIdAndUpdate(
        req.params.id,
        { isPublicInHistory },
        { new: true },
      );

      if (!submission) {
        return res.status(404).json({ error: "Soumission non trouvée" });
      }

      res.json({ message: "Visibilité mise à jour", submission });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Télécharger un PDF (ADMIN ou propriétaire)
router.get("/submissions/:id/download", authMiddleware, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: "Soumission non trouvée" });
    }

    if (!canReadSubmission(submission, req.user)) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    res.download(submission.pdfFile.path, submission.pdfFile.filename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Télécharger une version précise (ADMIN ou propriétaire)
router.get(
  "/submissions/:id/versions/:versionNumber/download",
  authMiddleware,
  async (req, res) => {
    try {
      const versionNumber = Number(req.params.versionNumber);

      if (!Number.isInteger(versionNumber) || versionNumber < 1) {
        return res.status(400).json({ error: "Numéro de version invalide" });
      }

      const submission = await Submission.findById(req.params.id);

      if (!submission) {
        return res.status(404).json({ error: "Soumission non trouvée" });
      }

      if (!canReadSubmission(submission, req.user)) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      const versions = Array.isArray(submission.versions)
        ? submission.versions
        : [];
      const version = versions.find((v) => v.versionNumber === versionNumber);

      if (!version || !version.pdfFile?.path || !version.pdfFile?.filename) {
        return res.status(404).json({ error: "Version non trouvée" });
      }

      res.download(version.pdfFile.path, version.pdfFile.filename);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
