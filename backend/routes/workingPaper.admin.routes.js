import express from "express";
import WorkingPaper from "../models/WorkingPaper.js";
import Submission from "../models/Submission.js";
import PublicationIssue from "../models/PublicationIssue.js";
import User from "../models/User.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";
import {
  parseJelCodesInput,
  normalizeSubmission,
  normalizeSubmissionStatus,
  canAccessSubmissionAsDispatcher,
  uploadSubmissionPDF,
  SUBMISSION_STATUSES,
  TERMINAL_STATUSES,
  STATUS_FILTER_MAP,
} from "./workingPaper.utils.js";

const router = express.Router();

// Créer un Working Paper (ADMIN)
router.post("/admin/working-papers", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const {
      title, subtitle, organizer, description, deadline, manuscriptLength,
      language, submissionRequirements, status, jelCodes, contactEmail,
      contactPhone, contactWebsite, contactLinkedin, usefulLinks,
    } = req.body;

    console.log("📝 Création Working Paper:", { title, organizer, deadline });
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
          ? usefulLinks.split("\n").map((link) => link.trim()).filter(Boolean)
          : [],
      createdBy: req.user._id,
    });

    await wp.save();
    console.log("✅ Working Paper créé:", wp);
    res.status(201).json({ message: "Working Paper créé", wp });
  } catch (error) {
    console.error("❌ Erreur création WP:", error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Modifier un Working Paper (ADMIN)
router.put("/admin/working-papers/:id", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const {
      title, subtitle, organizer, description, deadline, status,
      manuscriptLength, language, submissionRequirements, jelCodes,
      contactEmail, contactPhone, contactWebsite, contactLinkedin, usefulLinks,
    } = req.body;

    const wp = await WorkingPaper.findById(req.params.id);
    if (!wp) return res.status(404).json({ error: "Working Paper non trouvé" });

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
        ? usefulLinks.split("\n").map((link) => link.trim()).filter(Boolean)
        : [];

    await wp.save();
    res.json({ message: "Working Paper mis à jour", wp });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Supprimer un Working Paper (ADMIN)
router.delete("/admin/working-papers/:id", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const wp = await WorkingPaper.findByIdAndDelete(req.params.id);
    if (!wp) return res.status(404).json({ error: "Working Paper non trouvé" });

    await Submission.deleteMany({ workingPaper: req.params.id });
    res.json({ message: "Working Paper supprimé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir toutes les soumissions (ADMIN)
router.get("/admin/submissions", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const { status, workingPaper } = req.query;
    const filter = {};

    if (status) {
      const normalizedStatus = normalizeSubmissionStatus(status);
      if (!SUBMISSION_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({ error: "Statut invalide", allowedStatuses: SUBMISSION_STATUSES });
      }
      const statusesForFilter = STATUS_FILTER_MAP[normalizedStatus] || [normalizedStatus];
      filter.status = statusesForFilter.length > 1 ? { $in: statusesForFilter } : statusesForFilter[0];
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
});

// Lister les publications de synthèse (ADMIN)
router.get("/admin/publications", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const publications = await PublicationIssue.find()
      .populate("createdBy", "name firstName email")
      .sort({ createdAt: -1 });
    res.json(publications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une publication de synthèse (ADMIN)
router.post("/admin/publications", authMiddleware, requireRole(["admin"]), uploadSubmissionPDF, async (req, res) => {
  try {
    const { title, summary, status, acceptedCount, rejectedCount } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Titre requis" });
    }
    if (!req.file) return res.status(400).json({ error: "Fichier PDF requis" });

    const normalizedStatus = status === "published" ? "published" : "draft";
    const parsedAccepted = acceptedCount === "" || acceptedCount === undefined
      ? undefined : Number.parseInt(acceptedCount, 10);
    const parsedRejected = rejectedCount === "" || rejectedCount === undefined
      ? undefined : Number.parseInt(rejectedCount, 10);

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
      stats: { acceptedCount: parsedAccepted, rejectedCount: parsedRejected },
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

    const saved = await PublicationIssue.findById(publication._id).populate("createdBy", "name firstName email");

    res.status(201).json({
      message: normalizedStatus === "published" ? "Publication publiée" : "Publication enregistrée en brouillon",
      publication: saved,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Changer le statut d'une publication (ADMIN)
router.patch("/admin/publications/:id/status", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    const publication = await PublicationIssue.findByIdAndUpdate(
      req.params.id,
      { status, publishedAt: status === "published" ? new Date() : null },
      { new: true },
    ).populate("createdBy", "name firstName email");

    if (!publication) return res.status(404).json({ error: "Publication non trouvée" });
    res.json({ message: "Statut de publication mis à jour", publication });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une publication (ADMIN)
router.delete("/admin/publications/:id", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const publication = await PublicationIssue.findByIdAndDelete(req.params.id);
    if (!publication) return res.status(404).json({ error: "Publication non trouvée" });
    res.json({ message: "Publication supprimée" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lister les gestionnaires (ADMIN)
router.get("/admin/dispatchers", authMiddleware, requireRole(["admin"]), async (req, res) => {
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
          canCloseSession: activeAssignedCount > 0 && activeAssignedCount === completedCount,
        };
      }),
    );

    res.json(dispatchersWithStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assigner un gestionnaire à une soumission (ADMIN)
router.patch("/admin/submissions/:id/assign-dispatcher", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const { dispatcherId } = req.body;
    if (!dispatcherId) return res.status(400).json({ error: "dispatcherId requis" });

    const dispatcher = await User.findOne({ _id: dispatcherId, role: "dispatcher" })
      .select("_id name firstName email");
    if (!dispatcher) return res.status(404).json({ error: "Gestionnaire introuvable ou role invalide" });

    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: "Soumission non trouvée" });

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

    res.json({ message: "Gestionnaire assigne avec succes", submission: normalizeSubmission(updated) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clôturer la session d'un gestionnaire (ADMIN)
router.post("/admin/dispatchers/:id/close-session", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const dispatcher = await User.findOne({ _id: req.params.id, role: "dispatcher" })
      .select("_id name firstName email");
    if (!dispatcher) return res.status(404).json({ error: "Gestionnaire introuvable" });

    const activeSubmissions = await Submission.find({
      assignedDispatcher: dispatcher._id,
      dispatcherSessionClosedAt: null,
    }).select("_id status");

    if (activeSubmissions.length === 0) {
      return res.status(400).json({ error: "Aucune soumission active pour ce gestionnaire" });
    }

    const remaining = activeSubmissions.filter(
      (sub) => !TERMINAL_STATUSES.includes(normalizeSubmissionStatus(sub.status)),
    );

    if (remaining.length > 0) {
      return res.status(400).json({
        error: "Impossible de cloturer: certaines soumissions assignees ne sont pas encore acceptees/rejetees",
        remainingCount: remaining.length,
      });
    }

    const now = new Date();
    const updateResult = await Submission.updateMany(
      { assignedDispatcher: dispatcher._id, dispatcherSessionClosedAt: null },
      { $set: { dispatcherSessionClosedAt: now, dispatcherSessionClosedBy: req.user._id } },
    );

    res.json({ message: "Session du gestionnaire cloturee", closedCount: updateResult.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lister les soumissions assignées au gestionnaire connecté (DISPATCHER)
router.get("/dispatcher/submissions", authMiddleware, requireRole(["dispatcher"]), async (req, res) => {
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
});

// Changer le statut d'une soumission (DISPATCHER)
router.patch("/admin/submissions/:id/status", authMiddleware, requireRole(["dispatcher"]), async (req, res) => {
  try {
    const { status } = req.body;
    const normalizedStatus = normalizeSubmissionStatus(status);

    if (!SUBMISSION_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({ error: "Statut invalide", allowedStatuses: SUBMISSION_STATUSES });
    }

    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: "Soumission non trouvée" });
    if (!canAccessSubmissionAsDispatcher(submission, req.user)) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    submission.status = normalizedStatus;
    await submission.save();
    res.json({ message: "Statut mis à jour", submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ajouter un commentaire éditorial (DISPATCHER)
router.post("/admin/submissions/:id/comments", authMiddleware, requireRole(["dispatcher"]), async (req, res) => {
  try {
    const { comment } = req.body;
    const submission = await Submission.findById(req.params.id);

    if (!submission) return res.status(404).json({ error: "Soumission non trouvée" });
    if (!canAccessSubmissionAsDispatcher(submission, req.user)) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    submission.adminComments.push({ comment, commentedBy: req.user._id });
    await submission.save();
    res.json({ message: "Commentaire ajouté", submission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Demander des modifications (DISPATCHER)
router.post("/admin/submissions/:id/revision-request", authMiddleware, requireRole(["dispatcher"]), async (req, res) => {
  try {
    const { summary, items } = req.body;

    const cleanSummary = typeof summary === "string" ? summary.trim() : "";
    const cleanItems = Array.isArray(items)
      ? items.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
      : [];

    if (!cleanSummary && cleanItems.length === 0) {
      return res.status(400).json({
        error: "Veuillez renseigner une appréciation (résumé ou au moins un point à corriger)",
      });
    }

    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: "Soumission non trouvée" });
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

    res.json({ message: "Demande de modification enregistrée", submission: normalizeSubmission(savedSubmission) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle visibilité historique public (ADMIN)
router.patch("/admin/submissions/:id/visibility", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const isPublicInHistory = req.body.isPublicInHistory === true;
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: "Soumission non trouvée" });

    // Un papier refusé ou encore en cours n'a rien à faire dans l'archive.
    if (isPublicInHistory && submission.status !== "acceptee") {
      return res.status(400).json({ error: "Seul un papier accepté peut être diffusé" });
    }

    submission.isPublicInHistory = isPublicInHistory;
    submission.publicInHistoryAt = isPublicInHistory ? new Date() : null;
    submission.publicInHistoryBy = isPublicInHistory ? req.user._id : null;
    await submission.save();

    res.json({
      message: isPublicInHistory ? "Papier diffusé" : "Papier retiré de la diffusion",
      submission: { _id: submission._id, isPublicInHistory: submission.isPublicInHistory },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// Diffusion des résultats d'un appel (ADMIN)
// Deux décisions distinctes : l'appel ouvre ses résultats (verrou global),
// puis chaque papier accepté est coché ou non. RePEc ne lit que l'intersection.
// ─────────────────────────────────────────────
router.get("/admin/working-papers/:id/diffusion", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const workingPaper = await WorkingPaper.findById(req.params.id)
      .select("title resultsPublic resultsPublishedAt resultsPublishedBy")
      .populate("resultsPublishedBy", "name firstName");
    if (!workingPaper) return res.status(404).json({ error: "Appel non trouvé" });

    const submissions = await Submission.find({
      workingPaper: workingPaper._id,
      status: "acceptee",
    })
      .select("articleTitle authors isPublicInHistory publicInHistoryAt createdAt")
      .sort({ createdAt: 1 });

    res.json({
      workingPaper: {
        _id: workingPaper._id,
        title: workingPaper.title,
        resultsPublic: workingPaper.resultsPublic,
        resultsPublishedAt: workingPaper.resultsPublishedAt,
        resultsPublishedBy: workingPaper.resultsPublishedBy,
      },
      submissions: submissions.map((s) => ({
        _id: s._id,
        articleTitle: s.articleTitle,
        authors: (s.authors || []).map((a) => a.name),
        isPublicInHistory: s.isPublicInHistory,
        publicInHistoryAt: s.publicInHistoryAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/admin/working-papers/:id/diffusion", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const resultsPublic = req.body.resultsPublic === true;
    const workingPaper = await WorkingPaper.findById(req.params.id);
    if (!workingPaper) return res.status(404).json({ error: "Appel non trouvé" });

    workingPaper.resultsPublic = resultsPublic;
    workingPaper.resultsPublishedAt = resultsPublic ? new Date() : null;
    workingPaper.resultsPublishedBy = resultsPublic ? req.user._id : null;
    await workingPaper.save();

    // Les cases des papiers ne sont pas touchées : fermer puis rouvrir un appel
    // ne fait pas perdre la sélection faite précédemment.
    const selected = await Submission.countDocuments({
      workingPaper: workingPaper._id,
      status: "acceptee",
      isPublicInHistory: true,
    });

    res.json({
      message: resultsPublic ? "Résultats de l'appel diffusés" : "Diffusion de l'appel suspendue",
      resultsPublic: workingPaper.resultsPublic,
      selectedCount: selected,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
