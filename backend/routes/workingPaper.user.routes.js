import express from "express";
import Submission from "../models/Submission.js";
import WorkingPaper from "../models/WorkingPaper.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  parseJelCodesInput,
  normalizeSubmission,
  normalizeSubmissionStatus,
  canReadSubmission,
  canAccessSubmissionAsDispatcher,
  uploadSubmissionPDF,
  removeSubmissionFiles,
} from "./workingPaper.utils.js";

const router = express.Router();

// Soumettre un travail
router.post("/submissions", authMiddleware, uploadSubmissionPDF, async (req, res) => {
  try {
    const { workingPaperId, articleTitle, keywords, authors, abstract, publication } = req.body;

    const wp = await WorkingPaper.findById(workingPaperId);
    if (!wp) return res.status(404).json({ error: "Working Paper non trouvé" });

    if (new Date() > new Date(wp.deadline)) {
      return res.status(400).json({ error: "La deadline est passée" });
    }

    const existing = await Submission.findOne({
      workingPaper: workingPaperId,
      submittedBy: req.user._id,
    });
    if (existing) {
      return res.status(400).json({ error: "Vous avez déjà soumis un travail pour cet appel" });
    }

    if (!req.file) return res.status(400).json({ error: "Fichier PDF requis" });

    let parsedAuthors = authors;
    if (typeof authors === "string") parsedAuthors = JSON.parse(authors);

    let parsedKeywords = keywords;
    if (typeof keywords === "string") parsedKeywords = keywords.split(",").map((k) => k.trim());

    let parsedPublication = publication;
    if (typeof publication === "string" && publication) parsedPublication = JSON.parse(publication);

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
    res.status(201).json({ message: "Soumission enregistrée avec succès", submission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Obtenir mes soumissions
router.get("/my-submissions", authMiddleware, async (req, res) => {
  try {
    const submissions = await Submission.find({ submittedBy: req.user._id })
      .populate("workingPaper", "title deadline")
      .sort({ createdAt: -1 });

    const normalizedSubmissions = submissions.map(normalizeSubmission);

    const unreadComments = submissions.reduce((acc, sub) => {
      return acc + sub.adminComments.filter((c) => !c.read).length;
    }, 0);

    res.json({ submissions: normalizedSubmissions, unreadComments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir une soumission spécifique
router.get("/submissions/:id", authMiddleware, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("workingPaper", "title deadline")
      .populate("assignedDispatcher", "name firstName email")
      .populate("adminComments.commentedBy", "name firstName")
      .populate("reviewRequests.createdBy", "name firstName")
      .populate("versions.submittedBy", "name firstName email");

    if (!submission) return res.status(404).json({ error: "Soumission non trouvée" });
    if (!canReadSubmission(submission, req.user)) return res.status(403).json({ error: "Accès non autorisé" });

    res.json(normalizeSubmission(submission));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les demandes de révision d'une soumission
router.get("/submissions/:id/review-requests", authMiddleware, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate(
      "reviewRequests.createdBy",
      "name firstName",
    );

    if (!submission) return res.status(404).json({ error: "Soumission non trouvée" });
    if (!canReadSubmission(submission, req.user)) return res.status(403).json({ error: "Accès non autorisé" });

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
});

// Obtenir l'historique des versions d'une soumission
router.get("/submissions/:id/versions", authMiddleware, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate(
      "versions.submittedBy",
      "name firstName email",
    );

    if (!submission) return res.status(404).json({ error: "Soumission non trouvée" });
    if (!canReadSubmission(submission, req.user)) return res.status(403).json({ error: "Accès non autorisé" });

    const normalized = normalizeSubmission(submission);
    const versions = [...normalized.versions].sort(
      (a, b) => (b.versionNumber || 1) - (a.versionNumber || 1),
    );

    res.json({ currentVersion: normalized.currentVersion, versions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resoumettre un PDF après demande de correction
router.post("/submissions/:id/resubmit", authMiddleware, uploadSubmissionPDF, async (req, res) => {
  try {
    const { responseNote } = req.body;
    const submission = await Submission.findById(req.params.id);

    if (!submission) return res.status(404).json({ error: "Soumission non trouvée" });
    if (submission.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }
    if (normalizeSubmissionStatus(submission.status) !== "revision_requise") {
      return res.status(400).json({
        error: "La resoumission n'est possible que pour une soumission en statut 'À modifier'",
      });
    }
    if (!req.file) return res.status(400).json({ error: "Fichier PDF requis" });

    const previousPdfFile = submission.pdfFile;
    if (!Array.isArray(submission.versions)) submission.versions = [];

    if (submission.versions.length === 0 && previousPdfFile?.filename && previousPdfFile?.path) {
      submission.versions.push({
        versionNumber: 1,
        pdfFile: {
          filename: previousPdfFile.filename,
          path: previousPdfFile.path,
          size: previousPdfFile.size,
          uploadDate: previousPdfFile.uploadDate || submission.createdAt || new Date(),
        },
        submittedAt: submission.createdAt || new Date(),
        submittedBy: submission.submittedBy,
      });
    }

    const nextVersion = (submission.currentVersion || submission.versions.length || 1) + 1;
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
      responseNote: typeof responseNote === "string" ? responseNote.trim() : undefined,
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

    res.json({ message: "Nouvelle version soumise avec succès", submission: normalizeSubmission(savedSubmission) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marquer les commentaires comme lus
router.patch("/submissions/:id/read-comments", authMiddleware, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) return res.status(404).json({ error: "Soumission non trouvée" });
    if (submission.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    submission.adminComments.forEach((comment) => { comment.read = true; });
    await submission.save();
    res.json({ message: "Commentaires marqués comme lus" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Télécharger un PDF (propriétaire ou admin)
router.get("/submissions/:id/download", authMiddleware, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) return res.status(404).json({ error: "Soumission non trouvée" });
    if (!canReadSubmission(submission, req.user)) return res.status(403).json({ error: "Accès non autorisé" });

    res.download(submission.pdfFile.path, submission.pdfFile.filename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Télécharger une version précise
router.get("/submissions/:id/versions/:versionNumber/download", authMiddleware, async (req, res) => {
  try {
    const versionNumber = Number(req.params.versionNumber);
    if (!Number.isInteger(versionNumber) || versionNumber < 1) {
      return res.status(400).json({ error: "Numéro de version invalide" });
    }

    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: "Soumission non trouvée" });
    if (!canReadSubmission(submission, req.user)) return res.status(403).json({ error: "Accès non autorisé" });

    const versions = Array.isArray(submission.versions) ? submission.versions : [];
    const version = versions.find((v) => v.versionNumber === versionNumber);

    if (!version || !version.pdfFile?.path || !version.pdfFile?.filename) {
      return res.status(404).json({ error: "Version non trouvée" });
    }

    res.download(version.pdfFile.path, version.pdfFile.filename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer sa propre soumission (si pas encore traitée)
router.delete("/submissions/:id", authMiddleware, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: "Soumission non trouvée" });

    const isOwner = submission.submittedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Accès non autorisé" });

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

export default router;
