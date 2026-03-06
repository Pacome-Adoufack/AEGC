import express from "express";
import WorkingPaper from "../models/WorkingPaper.js";
import Submission from "../models/Submission.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";
import uploadPDF from "../middlewares/uploadPDF.js";

const router = express.Router();

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

// Historique public (soumissions terminées et publiques)
router.get("/working-papers/history/public", async (req, res) => {
  try {
    const submissions = await Submission.find({
      isPublicInHistory: true,
      status: "terminée",
    })
      .populate("workingPaper", "title")
      .populate("submittedBy", "name firstName")
      .select("articleTitle authors abstract createdAt workingPaper")
      .sort({ createdAt: -1 });

    res.json(submissions);
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
  uploadPDF.single("pdf"),
  async (req, res) => {
    try {
      const {
        workingPaperId,
        articleTitle,
        keywords,
        jelCodes,
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

      // Parser keywords et jelCodes
      let parsedKeywords = keywords;
      if (typeof keywords === "string") {
        parsedKeywords = keywords.split(",").map((k) => k.trim());
      }

      let parsedJelCodes = jelCodes;
      if (typeof jelCodes === "string") {
        parsedJelCodes = jelCodes.split(",").map((j) => j.trim());
      }

      // Parser publication si présent
      let parsedPublication = publication;
      if (typeof publication === "string" && publication) {
        parsedPublication = JSON.parse(publication);
      }

      // Créer la soumission
      const submission = new Submission({
        workingPaper: workingPaperId,
        submittedBy: req.user._id,
        articleTitle,
        keywords: parsedKeywords,
        jelCodes: parsedJelCodes,
        authors: parsedAuthors,
        abstract,
        publication: parsedPublication,
        pdfFile: {
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size,
        },
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

    // Marquer les commentaires comme lus
    const unreadComments = submissions.reduce((acc, sub) => {
      const unread = sub.adminComments.filter((c) => !c.read).length;
      return acc + unread;
    }, 0);

    res.json({
      submissions,
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
      .populate("adminComments.commentedBy", "name firstName");

    if (!submission) {
      return res.status(404).json({ error: "Soumission non trouvée" });
    }

    // Vérifier que c'est bien la sienne (sauf si admin)
    if (
      submission.submittedBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
      const { title, description, deadline } = req.body;

      console.log("📝 Création Working Paper:", {
        title,
        description,
        deadline,
      });
      console.log("👤 User:", req.user);

      const wp = new WorkingPaper({
        title,
        description,
        deadline,
        createdBy: req.user._id,
      });

      await wp.save();
      console.log("✅ Working Paper créé:", wp);
      res.status(201).json({ message: "Working Paper créé", wp });
    } catch (error) {
      console.error("❌ Erreur création WP:", error);
      res.status(500).json({ error: error.message });
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
      const { title, description, deadline, status } = req.body;

      const wp = await WorkingPaper.findByIdAndUpdate(
        req.params.id,
        { title, description, deadline, status },
        { new: true },
      );

      if (!wp) {
        return res.status(404).json({ error: "Working Paper non trouvé" });
      }

      res.json({ message: "Working Paper mis à jour", wp });
    } catch (error) {
      res.status(500).json({ error: error.message });
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
      if (status) filter.status = status;
      if (workingPaper) filter.workingPaper = workingPaper;

      const submissions = await Submission.find(filter)
        .populate("workingPaper", "title")
        .populate("submittedBy", "name firstName email")
        .sort({ createdAt: -1 });

      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Changer le statut d'une soumission (ADMIN)
router.patch(
  "/admin/submissions/:id/status",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { status } = req.body;

      const submission = await Submission.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true },
      );

      if (!submission) {
        return res.status(404).json({ error: "Soumission non trouvée" });
      }

      res.json({ message: "Statut mis à jour", submission });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Ajouter un commentaire admin (ADMIN)
router.post(
  "/admin/submissions/:id/comments",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { comment } = req.body;

      const submission = await Submission.findById(req.params.id);

      if (!submission) {
        return res.status(404).json({ error: "Soumission non trouvée" });
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

    // Vérifier les droits
    if (
      submission.submittedBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    res.download(submission.pdfFile.path, submission.pdfFile.filename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
